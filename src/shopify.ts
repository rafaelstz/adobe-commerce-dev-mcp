import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

// Top-level constants
const SHOPIFY_BASE_URL = "https://shopify.dev";

// Path to the schema file in the data folder
const SCHEMA_FILE_PATH = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
  "data",
  "admin_schema_2025-01.json"
);

// Helper function to filter, sort, and truncate schema items
const filterAndSortItems = (
  items: any[],
  searchTerm: string,
  maxItems: number
) => {
  // Filter items based on search term
  const filtered = items.filter((item: any) =>
    item.name?.toLowerCase().includes(searchTerm)
  );

  // Sort filtered items by name length (shorter names first)
  filtered.sort((a: any, b: any) => {
    if (!a.name) return 1;
    if (!b.name) return -1;
    return a.name.length - b.name.length;
  });

  // Return truncation info and limited items
  return {
    wasTruncated: filtered.length > maxItems,
    items: filtered.slice(0, maxItems),
  };
};

export function shopifyTools(server: McpServer) {
  // Add a new tool to access and search the Shopify Admin GraphQL schema
  server.tool(
    "shopify-admin-schema",
    "Access and search Shopify Admin GraphQL schema. Only use this for the Shopify Admin API, not for other APIs like Storefront API or Functions API.",
    {
      query: z
        .string()
        .describe(
          "Search term to filter schema elements by name. Only pass simple terms like 'product', 'discountProduct', etc."
        ),
    },
    async ({ query }, extra) => {
      try {
        console.error(
          `[shopify-admin-schema-tool] Reading GraphQL schema from ${SCHEMA_FILE_PATH}`
        );

        // Read the schema file from the local filesystem
        const schemaContent = await fs.readFile(SCHEMA_FILE_PATH, "utf8");

        // Parse the schema content
        const schemaJson = JSON.parse(schemaContent);

        // If a query is provided, filter the schema
        let resultSchema = schemaJson;
        let wasTruncated = false;
        let queriesWereTruncated = false;
        let mutationsWereTruncated = false;

        if (query && query.trim()) {
          console.error(
            `[shopify-admin-schema-tool] Filtering schema with query: ${query}`
          );

          // This is a simplified filtering approach - you might want to enhance this
          // based on the actual structure of your schema
          const searchTerm = query.toLowerCase();

          // Example filtering logic (adjust based on actual schema structure)
          // This assumes the schema has types with names and descriptions
          if (schemaJson?.data?.__schema?.types) {
            const MAX_RESULTS = 10;

            // Process types
            const processedTypes = filterAndSortItems(
              schemaJson.data.__schema.types,
              searchTerm,
              MAX_RESULTS
            );
            wasTruncated = processedTypes.wasTruncated;
            const limitedTypes = processedTypes.items;

            // Find the Query and Mutation types
            const queryType = schemaJson.data.__schema.types.find(
              (type: any) => type.name === "QueryRoot"
            );
            const mutationType = schemaJson.data.__schema.types.find(
              (type: any) => type.name === "Mutation"
            );

            // Process queries if available
            let matchingQueries: any[] = [];
            if (queryType && queryType.fields) {
              const processedQueries = filterAndSortItems(
                queryType.fields,
                searchTerm,
                MAX_RESULTS
              );
              queriesWereTruncated = processedQueries.wasTruncated;
              matchingQueries = processedQueries.items;
            }

            // Process mutations if available
            let matchingMutations: any[] = [];
            if (mutationType && mutationType.fields) {
              const processedMutations = filterAndSortItems(
                mutationType.fields,
                searchTerm,
                MAX_RESULTS
              );
              mutationsWereTruncated = processedMutations.wasTruncated;
              matchingMutations = processedMutations.items;
            }

            // Create a modified schema that includes matching types
            resultSchema = {
              data: {
                __schema: {
                  ...schemaJson.data.__schema,
                  types: limitedTypes,
                  matchingQueries,
                  matchingMutations,
                },
              },
            };
          }
        }

        // Create the response text with truncation message if needed
        let responseText = "";

        // Add types section
        responseText += "Matching Types:\n";
        if (wasTruncated) {
          responseText += `(Results limited to 10 items. Refine your search for more specific results.)\n`;
        }
        responseText +=
          resultSchema.data.__schema.types.length > 0
            ? JSON.stringify(resultSchema.data.__schema.types, null, 2) + "\n\n"
            : "No matching types found.\n\n";

        // Add queries section
        responseText += "Matching Queries:\n";
        if (queriesWereTruncated) {
          responseText += `(Results limited to 10 items. Refine your search for more specific results.)\n`;
        }
        responseText +=
          resultSchema.data.__schema.matchingQueries?.length > 0
            ? JSON.stringify(
                resultSchema.data.__schema.matchingQueries,
                null,
                2
              ) + "\n\n"
            : "No matching queries found.\n\n";

        // Add mutations section
        responseText += "Matching Mutations:\n";
        if (mutationsWereTruncated) {
          responseText += `(Results limited to 10 items. Refine your search for more specific results.)\n`;
        }
        responseText +=
          resultSchema.data.__schema.matchingMutations?.length > 0
            ? JSON.stringify(
                resultSchema.data.__schema.matchingMutations,
                null,
                2
              )
            : "No matching mutations found.";

        return {
          content: [
            {
              type: "text" as const,
              text: responseText,
            },
          ],
        };
      } catch (error) {
        console.error(
          `[shopify-admin-schema-tool] Error processing GraphQL schema: ${error}`
        );

        return {
          content: [
            {
              type: "text" as const,
              text: `Error processing Shopify Admin GraphQL schema: ${
                error instanceof Error ? error.message : String(error)
              }. Make sure the schema file exists at ${SCHEMA_FILE_PATH}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "shopify-docs",
    "Search Shopify documentation",
    {
      prompt: z.string().describe("The search query for Shopify documentation"),
    },
    async ({ prompt }, extra) => {
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
