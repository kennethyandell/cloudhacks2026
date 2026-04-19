export const handler = async (event) => {
    const startTime = Date.now();

    console.log(JSON.stringify({
        level: "INFO",
        message: "Handler invoked",
        actionGroup: event.actionGroup,
        function: event.function,
        parameterNames: (event.parameters || []).map(p => p.name)
    }));

    const actionGroup = event.actionGroup;
    const functionName = event.function;
    const parameters = event.parameters || [];

    const queryParam = parameters.find(p => p.name === 'query');
    const query = queryParam ? queryParam.value.trim() : '';

    let searchResultText = "";

    if (functionName === 'web_search') {
        if (!query) {
            console.warn(JSON.stringify({
                level: "WARN",
                message: "web_search called with empty or missing query parameter"
            }));
            searchResultText = "Error: 'query' parameter is required but was not provided.";
        } else {
            console.log(JSON.stringify({
                level: "INFO",
                message: "Starting web search",
                query
            }));

            try {
                const API_KEY = process.env.SEARCH_API_KEY;
                if (!API_KEY) throw new Error("Missing SEARCH_API_KEY environment variable.");

                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 8000);

                const fetchStart = Date.now();
                const response = await fetch('https://api.tavily.com/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        api_key: API_KEY,
                        query,
                        search_depth: "basic",
                        max_results: 3
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeout);

                console.log(JSON.stringify({
                    level: "INFO",
                    message: "Tavily API responded",
                    statusCode: response.status,
                    durationMs: Date.now() - fetchStart
                }));

                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`Tavily API error ${response.status}: ${errorBody}`);
                }

                const data = await response.json();

                if (!data.results) {
                    console.error(JSON.stringify({
                        level: "ERROR",
                        message: "Unexpected Tavily response shape — missing results field",
                        responseKeys: Object.keys(data)
                    }));
                    searchResultText = "Error: Unexpected response from search API.";
                } else if (data.results.length > 0) {
                    console.log(JSON.stringify({
                        level: "INFO",
                        message: "Search completed successfully",
                        resultCount: data.results.length,
                        query
                    }));
                    searchResultText = data.results
                        .map(r => `Title: ${r.title}\nContent: ${r.content}`)
                        .join('\n\n');
                } else {
                    console.warn(JSON.stringify({
                        level: "WARN",
                        message: "Search returned no results",
                        query
                    }));
                    searchResultText = "No relevant search results found.";
                }

            } catch (error) {
                const isTimeout = error.name === 'AbortError';
                console.error(JSON.stringify({
                    level: "ERROR",
                    message: isTimeout ? "Search request timed out" : "Search request failed",
                    errorName: error.name,
                    errorMessage: error.message,
                    query
                }));
                searchResultText = isTimeout
                    ? "Error: Search request timed out."
                    : `Error performing search: ${error.message}`;
            }
        }
    } else {
        console.warn(JSON.stringify({
            level: "WARN",
            message: "Unrecognised function name",
            functionName
        }));
        searchResultText = `Unknown function: ${functionName}`;
    }

    console.log(JSON.stringify({
        level: "INFO",
        message: "Handler complete",
        functionName,
        totalDurationMs: Date.now() - startTime
    }));

    return {
        messageVersion: '1.0',
        response: {
            actionGroup,
            function: functionName,
            functionResponse: {
                responseBody: {
                    TEXT: { body: searchResultText }
                }
            }
        }
    };
};