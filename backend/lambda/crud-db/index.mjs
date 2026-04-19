/**
 * crud-db Lambda
 *
 * Handles presets and chats CRUD, and asynchronously updates AWS Bedrock Agents
 * whenever a preset is saved.
 *
 * Environment variables required:
 *   MELCHIOR_AGENT_ID         - Bedrock agent ID for Melchior
 *   MELCHIOR_AGENT_NAME       - Bedrock agent name for Melchior
 *   MELCHIOR_AGENT_ROLE_ARN   - IAM role ARN assigned to the Melchior agent
 *   MELCHIOR_ALIAS_ID         - Custom alias ID for Melchior (same alias the supervisor collaborates with)
 *   BALTHASAR_AGENT_ID        - Bedrock agent ID for Balthasar
 *   BALTHASAR_AGENT_NAME      - Bedrock agent name for Balthasar
 *   BALTHASAR_AGENT_ROLE_ARN  - IAM role ARN assigned to the Balthasar agent
 *   BALTHASAR_ALIAS_ID        - Custom alias ID for Balthasar
 *   CASPER_AGENT_ID           - Bedrock agent ID for Casper
 *   CASPER_AGENT_NAME         - Bedrock agent name for Casper
 *   CASPER_AGENT_ROLE_ARN     - IAM role ARN assigned to the Casper agent
 *   CASPER_ALIAS_ID           - Custom alias ID for Casper
 *   SUPERVISOR_AGENT_ID       - Bedrock agent ID for the Supervisor
 *   SUPERVISOR_AGENT_NAME     - Bedrock agent name for the Supervisor
 *   SUPERVISOR_AGENT_ROLE_ARN - IAM role ARN assigned to the Supervisor agent
 *   SUPERVISOR_AGENT_MODEL    - Foundation model ID for the Supervisor
 *   SUPERVISOR_ALIAS_ID       - Custom alias ID for the Supervisor (used by chat-stream too)
 *
 * Lambda execution role needs:
 *   bedrock:UpdateAgent, bedrock:PrepareAgent, bedrock:GetAgent
 *   bedrock:GetAgentAlias, bedrock:UpdateAgentAlias
 *   bedrock:CreateAgentAlias, bedrock:DeleteAgentAlias
 *   lambda:InvokeFunction (on itself)
 *   dynamodb:PutItem, dynamodb:Query, dynamodb:DeleteItem, dynamodb:UpdateItem
 *
 * Lambda timeout: at least 12 minutes.
 *
 * How it works:
 *   1. User saves a preset from the frontend.
 *   2. This Lambda saves it to DynamoDB and fires an async self-invocation.
 *   3. Phase A: UpdateAgent + PrepareAgent for all 3 sub-agents in parallel,
 *      poll until PREPARED, then snapshot each DRAFT to a new numbered version
 *      and point each sub-agent's live alias at that version.
 *   4. Phase B: Same flow for the supervisor.
 *   5. DynamoDB updateStatus is set to "ready" or "failed".
 *
 * Version snapshotting:
 *   AWS forbids non-test aliases from routing to DRAFT and blocks TSTALIASID for
 *   collaborators. The supported pattern is to create a throwaway alias — which
 *   auto-snapshots a new numbered version from DRAFT as a side effect — then
 *   UpdateAgentAlias on the live alias to that version, then DeleteAgentAlias
 *   on the throwaway. The live alias ARN never changes, so the supervisor's
 *   collaborator config keeps working automatically.
 */

import dynamoDBPkg from "@aws-sdk/client-dynamodb";
const { DynamoDBClient } = dynamoDBPkg;

import dynamoDBDocPkg from "@aws-sdk/lib-dynamodb";
const { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand, UpdateCommand } = dynamoDBDocPkg;

import bedrockAgentPkg from "@aws-sdk/client-bedrock-agent";
const {
  BedrockAgentClient,
  UpdateAgentCommand,
  PrepareAgentCommand,
  GetAgentCommand,
  GetAgentAliasCommand,
  UpdateAgentAliasCommand,
  CreateAgentAliasCommand,
  DeleteAgentAliasCommand,
} = bedrockAgentPkg;

import lambdaPkg from "@aws-sdk/client-lambda";
const { LambdaClient, InvokeCommand } = lambdaPkg;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const bedrock = new BedrockAgentClient({ region: process.env.AWS_REGION });
const lambdaClient = new LambdaClient({});

const AGENTS = {
  melchior: {
    id: process.env.MELCHIOR_AGENT_ID,
    name: process.env.MELCHIOR_AGENT_NAME,
    roleArn: process.env.MELCHIOR_AGENT_ROLE_ARN,
    aliasId: process.env.MELCHIOR_ALIAS_ID,
  },
  balthasar: {
    id: process.env.BALTHASAR_AGENT_ID,
    name: process.env.BALTHASAR_AGENT_NAME,
    roleArn: process.env.BALTHASAR_AGENT_ROLE_ARN,
    aliasId: process.env.BALTHASAR_ALIAS_ID,
  },
  casper: {
    id: process.env.CASPER_AGENT_ID,
    name: process.env.CASPER_AGENT_NAME,
    roleArn: process.env.CASPER_AGENT_ROLE_ARN,
    aliasId: process.env.CASPER_ALIAS_ID,
  },
  supervisor: {
    id: process.env.SUPERVISOR_AGENT_ID,
    name: process.env.SUPERVISOR_AGENT_NAME,
    roleArn: process.env.SUPERVISOR_AGENT_ROLE_ARN,
    model: process.env.SUPERVISOR_AGENT_MODEL,
    aliasId: process.env.SUPERVISOR_ALIAS_ID,
  },
};

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "*",
};

// AWS Bedrock enforces instruction length >= 40 characters on UpdateAgent.
const MIN_PROMPT_LENGTH = 40;

function validatePreset(body) {
  const entries = [
    ["melchior",   body.melchior?.prompt],
    ["balthasar",  body.balthasar?.prompt],
    ["casper",     body.casper?.prompt],
    ["supervisor", body.supervisor?.prompt],
  ];

  const invalid = entries
    .filter(([, prompt]) => !prompt || prompt.length < MIN_PROMPT_LENGTH)
    .map(([key]) => key);

  if (invalid.length > 0) {
    return `Prompts for ${invalid.join(", ")} must be at least ${MIN_PROMPT_LENGTH} characters.`;
  }
  return null;
}

export const handler = async (event) => {
  if (event._source === "bedrock-update") {
    await handleBedrockUpdate(event.preset, event.userId, event.presetId);
    return;
  }

  const method = event.requestContext?.http?.method || event.httpMethod;
  const path = event.rawPath || event.path;
  const body = event.body ? JSON.parse(event.body) : {};
  const userId = body.userId || "default-user";

  if (method === "OPTIONS") {
    return { statusCode: 200, headers: HEADERS, body: "" };
  }

  try {
    if (path.startsWith("/presets")) {
      if (method === "GET" && path === "/presets/status") {
        const qp = event.queryStringParameters || {};
        const uid = qp.userId || "default-user";
        const result = await ddb.send(
          new QueryCommand({
            TableName: "presets",
            KeyConditionExpression: "userID = :uid",
            ExpressionAttributeValues: { ":uid": uid },
            ScanIndexForward: false,
            Limit: 1,
          })
        );
        const latest = result.Items?.[0];
        return {
          statusCode: 200,
          headers: HEADERS,
          body: JSON.stringify({
            status: latest?.updateStatus ?? "unknown",
            presetId: latest?.presetID,
            updatedAt: latest?.updatedAt,
          }),
        };
      }

      if (method === "POST") {
        const validationError = validatePreset(body);
        if (validationError) {
          return {
            statusCode: 400,
            headers: HEADERS,
            body: JSON.stringify({ error: validationError }),
          };
        }

        const presetId = body.presetId || `preset-${Date.now()}`;
        const now = new Date().toISOString();

        await ddb.send(
          new PutCommand({
            TableName: "presets",
            Item: {
              userID: userId,
              presetID: presetId,
              name: body.name,
              melchior: body.melchior,
              balthasar: body.balthasar,
              casper: body.casper,
              supervisor: body.supervisor,
              createdAt: now,
              updateStatus: "updating",
              updatedAt: now,
            },
          })
        );

        await lambdaClient.send(
          new InvokeCommand({
            FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
            InvocationType: "Event",
            Payload: Buffer.from(
              JSON.stringify({
                _source: "bedrock-update",
                preset: {
                  melchior: body.melchior,
                  balthasar: body.balthasar,
                  casper: body.casper,
                  supervisor: body.supervisor,
                },
                userId,
                presetId,
              })
            ),
          })
        );

        return {
          statusCode: 202,
          headers: HEADERS,
          body: JSON.stringify({
            message: "Preset saved. Agents are being updated.",
            status: "updating",
            presetId,
          }),
        };
      }

      if (method === "GET") {
        const result = await ddb.send(
          new QueryCommand({
            TableName: "presets",
            KeyConditionExpression: "userID = :uid",
            ExpressionAttributeValues: { ":uid": userId },
          })
        );
        return {
          statusCode: 200,
          headers: HEADERS,
          body: JSON.stringify(result.Items),
        };
      }

      if (method === "DELETE") {
        await ddb.send(
          new DeleteCommand({
            TableName: "presets",
            Key: { userID: userId, presetID: body.presetId },
          })
        );
        return {
          statusCode: 200,
          headers: HEADERS,
          body: JSON.stringify({ message: "Preset deleted" }),
        };
      }
    }

    if (path.startsWith("/chats")) {
      if (method === "POST") {
        await ddb.send(
          new PutCommand({
            TableName: "past-chats",
            Item: {
              userID: userId,
              chatID: body.chatId || `chat-${Date.now()}`,
              title: body.title || "New Chat",
              messages: body.messages,
              presetUsed: body.presetUsed || null,
              createdAt: new Date().toISOString(),
            },
          })
        );
        return {
          statusCode: 200,
          headers: HEADERS,
          body: JSON.stringify({ message: "Chat saved" }),
        };
      }

      if (method === "GET") {
        const result = await ddb.send(
          new QueryCommand({
            TableName: "past-chats",
            KeyConditionExpression: "userID = :uid",
            ExpressionAttributeValues: { ":uid": "default-user" },
            ScanIndexForward: false,
          })
        );
        return {
          statusCode: 200,
          headers: HEADERS,
          body: JSON.stringify(result.Items),
        };
      }
    }

    return {
      statusCode: 404,
      headers: HEADERS,
      body: JSON.stringify({ error: "Not found" }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

// ---------------------------------------------------------------------------
// Bedrock agent update — runs in the async self-invocation path
// ---------------------------------------------------------------------------

async function handleBedrockUpdate(preset, userId, presetId) {
  const subAgents = [
    { key: "melchior",  ...AGENTS.melchior,  config: preset.melchior  },
    { key: "balthasar", ...AGENTS.balthasar, config: preset.balthasar },
    { key: "casper",    ...AGENTS.casper,    config: preset.casper    },
  ];

  try {
    // Phase A — update DRAFT for all sub-agents in parallel, prepare, then
    // point each alias to DRAFT so the supervisor picks up the latest changes.
    await Promise.all(
      subAgents.map((agent) =>
        bedrock.send(
          new UpdateAgentCommand({
            agentId: agent.id,
            agentName: agent.name,
            agentResourceRoleArn: agent.roleArn,
            foundationModel: agent.config.model,
            instruction: agent.config.prompt,
          })
        )
      )
    );

    await Promise.all(
      subAgents.map((agent) =>
        bedrock.send(new PrepareAgentCommand({ agentId: agent.id }))
      )
    );

    await pollUntilPrepared(subAgents, "sub-agents");
    console.log("[sub-agents] all PREPARED");

    // Snapshot each sub-agent's DRAFT to a new numbered version and point its
    // live alias at it. The supervisor's collaborator config references these
    // live alias ARNs (unchanged), so it automatically invokes the new version.
    await Promise.all(
      subAgents.map((agent) =>
        snapshotAndPointLiveAlias(agent.id, agent.aliasId)
      )
    );
    console.log("[sub-agents] live aliases snapshotted and updated");

    // Phase B — update DRAFT for supervisor, prepare, then point its alias to DRAFT.
    // agentCollaboration must be passed explicitly: UpdateAgent defaults it to
    // DISABLED, which AWS rejects when the agent has collaborators attached.
    await bedrock.send(
      new UpdateAgentCommand({
        agentId: AGENTS.supervisor.id,
        agentName: AGENTS.supervisor.name,
        agentResourceRoleArn: AGENTS.supervisor.roleArn,
        foundationModel: AGENTS.supervisor.model,
        instruction: preset.supervisor?.prompt,
        agentCollaboration: "SUPERVISOR",
      })
    );

    await bedrock.send(new PrepareAgentCommand({ agentId: AGENTS.supervisor.id }));

    await pollUntilPrepared([AGENTS.supervisor], "supervisor");
    console.log("[supervisor] PREPARED");

    await snapshotAndPointLiveAlias(AGENTS.supervisor.id, AGENTS.supervisor.aliasId);
    console.log("[supervisor] live alias snapshotted and updated");

    await setPresetStatus(userId, presetId, "ready");
    console.log("Bedrock update complete. Status: ready");
  } catch (err) {
    console.error("Bedrock agent update failed:", err);
    await setPresetStatus(userId, presetId, "failed");
  }
}

/**
 * Snapshots the agent's current DRAFT to a new numbered version (via temp alias
 * side-effect), points the live alias at that version, then cleans up the temp.
 * The live alias ARN is unchanged, so the supervisor's collaborator config
 * continues working and automatically invokes the latest version.
 *
 * CreateAgentAlias is async (HTTP 202). The new version number only appears in
 * routingConfiguration once the temp alias reaches PREPARED status, so we poll.
 */
async function snapshotAndPointLiveAlias(agentId, liveAliasId) {
  // Preserve the live alias's existing name — UpdateAgentAlias requires it
  const liveAliasResp = await bedrock.send(
    new GetAgentAliasCommand({ agentId, agentAliasId: liveAliasId })
  );
  const liveAliasName = liveAliasResp.agentAlias.agentAliasName;

  // Create throwaway alias → AWS auto-snapshots a new version from DRAFT
  const tempAliasName = `temp-snapshot-${Date.now()}`;
  const createResp = await bedrock.send(
    new CreateAgentAliasCommand({
      agentId,
      agentAliasName: tempAliasName,
    })
  );

  const tempAliasId = createResp.agentAlias?.agentAliasId;
  if (!tempAliasId) {
    throw new Error(`[${agentId}] CreateAgentAlias did not return aliasId`);
  }

  // Wait for the temp alias to finish preparing so routingConfiguration is populated
  const preparedAlias = await pollAgentAliasPrepared(agentId, tempAliasId);
  const newVersion = preparedAlias.routingConfiguration?.[0]?.agentVersion;
  if (!newVersion) {
    throw new Error(
      `[${agentId}] prepared temp alias has no version in routingConfiguration`
    );
  }

  // Point the live alias at the new numbered version
  await bedrock.send(
    new UpdateAgentAliasCommand({
      agentId,
      agentAliasId: liveAliasId,
      agentAliasName: liveAliasName,
      routingConfiguration: [{ agentVersion: newVersion }],
    })
  );

  // Clean up the throwaway alias (the numbered version remains)
  try {
    await bedrock.send(
      new DeleteAgentAliasCommand({
        agentId,
        agentAliasId: tempAliasId,
      })
    );
  } catch (err) {
    console.warn(
      `[${agentId}] failed to delete temp alias ${tempAliasId}:`,
      err.message
    );
  }

  console.log(`[${agentId}] live alias now routes to v${newVersion}`);
}

/**
 * Polls GetAgentAlias every 2 seconds until the alias reaches PREPARED,
 * throws on FAILED, or times out after ~2 minutes (60 attempts × 2s).
 */
async function pollAgentAliasPrepared(agentId, aliasId) {
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const resp = await bedrock.send(
      new GetAgentAliasCommand({ agentId, agentAliasId: aliasId })
    );
    const status = resp.agentAlias?.agentAliasStatus;
    console.log(`[${agentId}] alias ${aliasId} attempt ${i + 1}: ${status}`);
    if (status === "PREPARED") return resp.agentAlias;
    if (status === "FAILED") {
      throw new Error(
        `[${agentId}] alias ${aliasId} FAILED: ${
          resp.agentAlias?.failureReasons?.join(", ") ?? "unknown"
        }`
      );
    }
  }
  throw new Error(`[${agentId}] alias ${aliasId} timed out waiting for PREPARED`);
}

/**
 * Polls GetAgent every 5 seconds until every agent reaches PREPARED,
 * or throws after ~5 minutes (60 attempts × 5 s).
 */
async function pollUntilPrepared(agents, label) {
  const maxAttempts = 60;
  let attempts = 0;

  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const statuses = await Promise.all(
      agents.map((agent) =>
        bedrock
          .send(new GetAgentCommand({ agentId: agent.id }))
          .then((r) => r.agent.agentStatus)
      )
    );

    console.log(`[${label}] attempt ${attempts + 1}: ${statuses.join(", ")}`);

    if (statuses.some((s) => s === "FAILED")) {
      throw new Error(
        `[${label}] one or more agents failed: ${statuses.join(", ")}`
      );
    }

    if (statuses.every((s) => s === "PREPARED")) return;

    attempts++;
  }

  throw new Error(`[${label}] timed out waiting for PREPARED status`);
}

async function setPresetStatus(userId, presetId, status) {
  try {
    await ddb.send(
      new UpdateCommand({
        TableName: "presets",
        Key: { userID: userId, presetID: presetId },
        UpdateExpression: "SET updateStatus = :status, updatedAt = :ts",
        ExpressionAttributeValues: {
          ":status": status,
          ":ts": new Date().toISOString(),
        },
      })
    );
  } catch (err) {
    console.error("Failed to write preset status to DynamoDB:", err);
  }
}
