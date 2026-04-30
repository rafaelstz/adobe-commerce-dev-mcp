import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchAdobeCommerceSchema, DEFAULT_VERSION } from "./adobe-commerce-schema.js";
import { searchAdobeCommerceRestSchema } from "./adobe-commerce-rest-schema.js";

export function adobeCommerceTools(
  server: McpServer,
  version: string = DEFAULT_VERSION
) {
  server.tool(
    "introspect_admin_graphql_schema",
    `This tool introspects and returns the portion of the Adobe Commerce GraphQL schema relevant to the user prompt. Only use this for the Adobe Commerce API. Uses Adobe Commerce version ${version}.

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
    async ({ query, filter }) => {
      const result = await searchAdobeCommerceSchema(query, {
        filter,
        version,
      });

      if (result.success) {
        return {
          content: [{ type: "text" as const, text: result.responseText }],
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

  server.tool(
    "introspect_admin_rest_schema",
    `This tool introspects and returns the portion of the Adobe Commerce REST API schema relevant to the user prompt. Only use this for the Adobe Commerce REST API. Uses Adobe Commerce version ${version} (falls back to the latest available version if the requested version's REST schema is not found).

    It takes one argument: query. The query argument is the string search term to filter endpoints and definitions by name or path.`,
    {
      query: z
        .string()
        .describe(
          "Search term to filter REST API endpoints and definitions. Only pass simple terms like 'product', 'order', 'customer', etc."
        ),
    },
    async ({ query }) => {
      const result = await searchAdobeCommerceRestSchema(query, { version });

      if (result.success) {
        return {
          content: [{ type: "text" as const, text: result.responseText }],
        };
      } else {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error processing Adobe Commerce REST schema: ${result.error}. Make sure the schema file exists at data/rest_schema_${version.replace(/\./g, "-")}_admin.json.gz`,
            },
          ],
        };
      }
    }
  );
}
