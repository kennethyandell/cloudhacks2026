export async function invokeMagi(
  prompt: string,
  sessionId: string,
  onChunk: (text: string) => void,
  onTrace: (trace: any) => void,
  onDone: () => void,
  onError: (message: string) => void
) {
  const MAGI_LAMBDA_URL = import.meta.env.VITE_API_STREAM_URL

  try {
    const response = await fetch(MAGI_LAMBDA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, sessionId }),
    })

    if (!response.body) {
      throw new Error("No response body")
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || "" // keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6))
            switch (data.type) {
              case "chunk":
                onChunk(data.text)
                break
              case "trace":
                onTrace(data.trace)
                break
              case "done":
                onDone()
                break
              case "error":
                onError(data.message)
                break
            }
          } catch (e) {
            // skip malformed SSE
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      onError(error.message)
    } else {
      onError("An unknown error occurred")
    }
  }
}
