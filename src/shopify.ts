import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Top-level constants
const SHOPIFY_BASE_URL = "https://shopify-dev.myshopify.io";

export function shopifyTools(server: McpServer) {
  server.tool(
    "shopify-docs",
    "Search Shopify documentation",
    {
      prompt: z.string().describe("The search query for Shopify documentation"),
    },
    async ({ prompt }, extra) => {
      await server.server.sendLoggingMessage({
        level: "error",
        message: `[shopify-docs] Starting request with search query: ${prompt}`,
      });

      try {
        // Prepare the URL with query parameters
        const url = new URL("/mcp/search", SHOPIFY_BASE_URL);
        url.searchParams.append("query", prompt);

        console.error(
          `[shopify-docs] Making GET request to: ${url.toString()}`
        );

        // Make the GET request
        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
            "X-Shopify-Surface": "vscode",
          },
        });

        console.error(
          `[shopify-docs] Response status: ${response.status} ${response.statusText}`
        );

        // Convert headers to object for logging
        const headersObj: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headersObj[key] = value;
        });
        console.error(
          `[shopify-docs] Response headers: ${JSON.stringify(headersObj)}`
        );

        if (!response.ok) {
          console.error(`[shopify-docs] HTTP error status: ${response.status}`);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Read and process the response
        const responseText = await response.text();
        console.error(
          `[shopify-docs] Response text (truncated): ${
            responseText.substring(0, 200) +
            (responseText.length > 200 ? "..." : "")
          }`
        );

        // Try to parse the response as JSON if applicable
        let formattedResponse = responseText;
        try {
          const jsonResponse = JSON.parse(responseText);
          formattedResponse = JSON.stringify(jsonResponse, null, 2);
        } catch (e) {
          console.warn(`[shopify-docs] Response is not valid JSON: ${e}`);
          // Keep the original response text
        }

        // Return the response
        return {
          content: [
            {
              type: "text" as const,
              text:
                formattedResponse || "No content received from Shopify Docs",
            },
          ],
        };
      } catch (error) {
        console.error(
          `[shopify-docs] Error searching Shopify documentation: ${error}`
        );

        return {
          content: [
            {
              type: "text" as const,
              text: `Error searching Shopify documentation: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );
}
