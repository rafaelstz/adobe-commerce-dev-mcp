import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchAdobeCommerceSchema } from "./adobe-commerce-schema.js";

export function adobeCommerceTools(server: McpServer) {
  server.tool(
    "introspect_admin_schema",
    `This tool introspects and returns the portion of the Adobe Commerce GraphQL schema relevant to the user prompt. Only use this for the Adobe Commerce API.

    It takes two arguments: query and filter. The query argument is the string search term to filter schema elements by name. The filter argument is an array of strings to filter results to show specific sections.`,
    {
      query: z
        .string()
        .describe(
          "Search term to filter schema elements by name. Only pass simple terms like 'product', 'category', etc."
        ),
      filter: z
        .array(z.enum(["all", "types", "queries", "mutations"]))
        .optional()
        .default(["all"])
        .describe(
          "Filter results to show specific sections. Can include 'types', 'queries', 'mutations', or 'all' (default)"
        ),
    },
    async ({ query, filter }, extra) => {
      const result = await searchAdobeCommerceSchema(query, { filter });

      if (result.success) {
        return {
          content: [
            {
              type: "text" as const,
              text: result.responseText,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error processing Adobe Commerce GraphQL schema: ${result.error}. Make sure the schema file exists.`,
            },
          ],
        };
      }
    }
  );
}
