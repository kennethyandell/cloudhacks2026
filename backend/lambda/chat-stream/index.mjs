import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";

const client = new BedrockAgentRuntimeClient({ region: process.env.AWS_REGION });

// Supervisor agent details — set these as Lambda environment variables
const SUPERVISOR_AGENT_ID = process.env.SUPERVISOR_AGENT_ID;
const SUPERVISOR_ALIAS_ID = process.env.SUPERVISOR_ALIAS_ID;

export const handler = awslambda.streamifyResponse(async (event, responseStream, _context) => {
    // Set SSE headers
    const metadata = {
        statusCode: 200,
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    };
    responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);

    try {
        // Parse the incoming request
        const body = JSON.parse(event.body || "{}");
        const prompt = body.prompt;
        const sessionId = body.sessionId || `session-${Date.now()}`;

        if (!prompt) {
            responseStream.write(`data: ${JSON.stringify({ error: "No prompt provided" })}\n\n`);
            responseStream.end();
            return;
        }

        // Send a "start" event
        responseStream.write(`data: ${JSON.stringify({ type: "start", sessionId })}\n\n`);

        // Invoke the MAGI Supervisor
        const command = new InvokeAgentCommand({
            agentId: SUPERVISOR_AGENT_ID,
            agentAliasId: SUPERVISOR_ALIAS_ID,
            sessionId: sessionId,
            inputText: prompt,
            enableTrace: true, // Get agent reasoning/routing info
        });

        const response = await client.send(command);

        // Stream the response chunks back as SSE events
        for await (const event of response.completion) {
            if (event.chunk) {
                const text = new TextDecoder("utf-8").decode(event.chunk.bytes);
                console.log(`data: ${JSON.stringify({ type: "chunk", text })}\n\n`)
                responseStream.write(`data: ${JSON.stringify({ type: "chunk", text })}\n\n`);
            }
            if (event.trace) {
                // Stream trace info so the frontend can show agent reasoning
                console.log(`data: ${JSON.stringify({ type: "trace", trace: event.trace })}\n\n`)
                responseStream.write(`data: ${JSON.stringify({ type: "trace", trace: event.trace })}\n\n`);
            }
        }

        // Signal completion
        console.log(`data: ${JSON.stringify({ type: "done" })}\n\n`)
        responseStream.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);

    } catch (err) {
        console.error("MAGI invocation error:", err);
        responseStream.write(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`);
    } finally {
        responseStream.end();
    }
});
