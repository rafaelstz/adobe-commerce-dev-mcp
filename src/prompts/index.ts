import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function adobeCommercePrompts(server: McpServer, version: string = "2.4.8") {
  server.prompt(
    "adobe_commerce_api",
    {
      query: z
        .string()
        .describe("The specific Adobe Commerce API question or request"),
      api_type: z
        .enum(["graphql", "rest", "auto"])
        .optional()
        .default("auto")
        .describe(
          "The API type to use: 'graphql', 'rest', or 'auto' to let the AI decide (default)"
        ),
    },
    ({ query, api_type }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need help writing an Adobe Commerce API call for the following request:

${query}

Target API: ${api_type === "auto" ? "Choose the most appropriate API (GraphQL or REST) for this use case" : api_type.toUpperCase()}
Adobe Commerce version: ${version}

Use the available schema tools to look up the relevant types, queries, mutations, or REST endpoints before writing any code.

Please provide:
1. The complete API call (GraphQL operation or REST request) with proper syntax
2. A brief explanation of what each part does
3. Any variables, request body, or headers needed
4. How to handle the response data
5. Whether GraphQL or REST is the better fit for this use case and why (if not specified)

When formulating your response, make sure to:
- Always introspect the schema first to confirm field names, types, and endpoints exist in version ${version}
- Use Adobe Commerce ${version} API best practices
- Request only the fields actually needed
- Follow proper naming conventions
- Handle error cases appropriately
- Prefer GraphQL for storefront/customer-facing reads; prefer REST for admin operations and batch writes`,
          },
        },
      ],
    })
  );

  server.prompt(
    "validate_adobe_commerce_implementation",
    {
      code: z
        .string()
        .describe(
          "The GraphQL operation, REST endpoint call, or integration code to validate"
        ),
      context: z
        .string()
        .optional()
        .describe(
          "Optional context about what the code is supposed to do, the framework being used, etc."
        ),
    },
    ({ code, context }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Validate the following Adobe Commerce API implementation against version ${version}.

${context ? `Context: ${context}\n` : ""}
Code to validate:
\`\`\`
${code}
\`\`\`

Instructions:
1. Identify every GraphQL type, field, query, mutation, or REST endpoint referenced in the code above
2. Use the schema tools (introspect_admin_graphql_schema and/or introspect_admin_rest_schema) to look up each one against Adobe Commerce ${version}
3. For each item found, report:
   - ✅ Valid — exists in ${version} with the correct signature
   - ⚠️ Deprecated — exists but marked deprecated; include the recommended replacement
   - ❌ Invalid — does not exist or has a different name/signature in ${version}; include the correct alternative
4. If there are invalid or deprecated items, provide a corrected version of the full code
5. Note any version-specific behaviour or caveats for ${version}

Be thorough — check every field name, argument name and type, return type, and endpoint path.`,
          },
        },
      ],
    })
  );
}
