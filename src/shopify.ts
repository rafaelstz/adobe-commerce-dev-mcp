import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  createParser,
  type ParseEvent,
  type ParsedEvent,
} from "eventsource-parser";

// Generate a unique ID if needed
function generateId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// Alternative SSE parsing using eventsource-parser (from VSCode extension)
function createSSEParser(
  onEvent: (event: { event?: string; data?: string }) => void,
  onError: (error: Error) => void
) {
  const parser = createParser((parseEvent: ParseEvent) => {
    try {
      if (parseEvent.type === "event") {
        const eventData = parseEvent as ParsedEvent;
        onEvent({
          event: eventData.event,
          data: eventData.data,
        });
      }
    } catch (err) {
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  });

  return {
    feed: (chunk: string) => parser.feed(chunk),
  };
}

// Extract meaningful content from various response formats
function extractContent(data: string): string {
  console.error(
    `[extractContent] Attempting to extract content from: ${
      data.substring(0, 100) + (data.length > 100 ? "..." : "")
    }`
  );

  try {
    const jsonData = JSON.parse(data);

    if (typeof jsonData === "string") {
      return "";
    }

    if (jsonData?.gql_operation?.ai_response) {
      return jsonData.gql_operation.ai_response;
    }

    // Fallback to stringifying the entire response
    return JSON.stringify(jsonData);
  } catch (e) {
    // If not valid JSON, return as is
    console.warn(`[extractContent] Not valid JSON: ${data}`);
    return data;
  }
}

export function shopifyTools(server: McpServer) {
  server.tool(
    "shopify-gql",
    "Learn how to use the Shopify Dev GraphQL API",
    {
      prompt: z.string().describe("The prompt to send to Shopify Dev"),
    },
    async ({ prompt }, extra) => {
      await server.server.sendLoggingMessage({
        level: "error",
        message: `[shopify-gql] Starting request with prompt: ${prompt}`,
      });

      // Generate a new stream ID
      const streamId = generateId();
      console.error(`[shopify-gql] Generated new stream ID: ${streamId}`);

      try {
        // Log the request details
        const requestPayload = {
          stream_id: streamId,
          gql_operation: {
            user_prompt: prompt,
          },
        };

        console.error(
          `[shopify-gql] Making request to Shopify Dev with payload: ${JSON.stringify(
            requestPayload
          )}`
        );

        // Make the POST request to Shopify Dev
        const response = await fetch("https://shopify.dev/llm/gql_operations", {
          method: "POST",
          headers: {
            Accept: "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Content-Type": "application/json",
            "X-Shopify-Surface": "vscode",
          },
          body: JSON.stringify(requestPayload),
        });

        console.error(
          `[shopify-gql] Response status: ${response.status} ${response.statusText}`
        );

        // Convert headers to object in a compatible way
        const headersObj: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headersObj[key] = value;
        });

        console.error(
          `[shopify-gql] Response headers: ${JSON.stringify(headersObj)}`
        );

        if (!response.ok) {
          console.error(`[shopify-gql] HTTP error status: ${response.status}`);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Check if the response is actually SSE format
        const contentType = response.headers.get("content-type") || "";
        console.error(`[shopify-gql] Content-Type: ${contentType}`);

        // Handle non-streaming responses
        if (!contentType.includes("text/event-stream")) {
          console.error(`[shopify-gql] Received non-streaming response`);
          const responseText = await response.text();
          console.error(
            `[shopify-gql] Response text (truncated): ${
              responseText.substring(0, 200) +
              (responseText.length > 200 ? "..." : "")
            }`
          );

          const extractedContent = extractContent(responseText);
          console.error(
            `[shopify-gql] Extracted content: ${
              extractedContent
                ? extractedContent.substring(0, 200) +
                  (extractedContent.length > 200 ? "..." : "")
                : "No content extracted"
            }`
          );

          return {
            content: [
              {
                type: "text" as const,
                text:
                  extractedContent ||
                  "Received non-streaming response from Shopify Dev",
              },
            ],
            _meta: {
              streamId: streamId,
            },
          };
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          console.error(`[shopify-gql] Failed to get response reader`);
          throw new Error("Failed to get response reader");
        }

        console.error(`[shopify-gql] Starting to process SSE stream`);

        // Process the SSE stream
        let responseText = "";
        let done = false;
        let buffer = "";
        let chunkCount = 0;

        // Create SSE parser
        let fullText = "";
        const parser = createSSEParser(
          (event) => {
            console.error(
              `[shopify-gql] Received event: ${event.event || "no-event"}`
            );

            if (event.data) {
              // Extract content regardless of event type
              const content = extractContent(event.data);
              if (content) {
                console.error(
                  `[shopify-gql] Extracted content from event: ${
                    content.substring(0, 100) +
                    (content.length > 100 ? "..." : "")
                  }`
                );
                responseText += content + "\n";
                fullText += content;
              } else {
                console.error(
                  `[shopify-gql] No content extracted from event data`
                );
              }
            } else {
              console.error(`[shopify-gql] Event contained no data`);
            }
          },
          (error) => {
            console.error(`[shopify-gql] SSE parsing error: ${error.message}`);
          }
        );

        try {
          while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;

            if (value) {
              chunkCount++;
              const chunk = new TextDecoder().decode(value);
              console.error(
                `[shopify-gql] Received chunk #${chunkCount}, size: ${chunk.length} bytes`
              );

              // Feed the chunk to the parser
              parser.feed(chunk);
            } else if (done) {
              console.error(`[shopify-gql] Stream done, no more chunks`);
            }
          }
        } catch (error) {
          console.error(`[shopify-gql] Error processing SSE stream: ${error}`);
        }

        console.error(`[shopify-gql] Response processing complete`);

        // Clean up the response if needed
        responseText =
          responseText.trim() || "No content received from Shopify Dev";

        console.error(
          `[shopify-gql] Final response text length: ${responseText.length}`
        );
        console.error(
          `[shopify-gql] Final response text (truncated): ${
            responseText.substring(0, 200) +
            (responseText.length > 200 ? "..." : "")
          }`
        );

        // Return the response along with the stream ID for future use
        const result = {
          content: [
            {
              type: "text" as const,
              text: responseText,
            },
          ],
          _meta: {
            streamId: streamId,
          },
        };

        console.error(
          `[shopify-gql] Returning result structure: ${JSON.stringify(
            result,
            null,
            2
          )}`
        );

        return result;
      } catch (error) {
        console.error(
          `[shopify-gql] Error communicating with Shopify Dev: ${error}`
        );

        return {
          content: [
            {
              type: "text" as const,
              text: `Error communicating with Shopify Dev: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          _meta: {
            streamId: streamId,
          },
        };
      }
    }
  );
}
