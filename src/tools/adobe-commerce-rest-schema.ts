import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { loadSchemaContent, DEFAULT_VERSION } from "./adobe-commerce-schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getRestSchemaPath(version: string): string {
  const v = version.replace(/\./g, "-");
  return path.join(
    __dirname,
    "..",
    "..",
    "data",
    `rest_schema_${v}_admin.json`
  );
}

export async function loadRestSchemaContent(
  version: string
): Promise<{ content: string; usedVersion: string }> {
  const primaryPath = getRestSchemaPath(version);
  const primaryGz = `${primaryPath}.gz`;

  if (existsSync(primaryPath) || existsSync(primaryGz)) {
    const content = await loadSchemaContent(primaryPath);
    return { content, usedVersion: version };
  }

  if (version !== DEFAULT_VERSION) {
    console.error(
      `[adobe-commerce-rest-schema-tool] REST schema for version ${version} not found, falling back to ${DEFAULT_VERSION}`
    );
    const fallbackPath = getRestSchemaPath(DEFAULT_VERSION);
    const content = await loadSchemaContent(fallbackPath);
    return { content, usedVersion: DEFAULT_VERSION };
  }

  throw new Error(`REST schema file not found for version ${version}`);
}

const MAX_ENDPOINTS_TO_SHOW = 10;
const MAX_DEFINITIONS_TO_SHOW = 10;
const MAX_PROPERTIES_TO_SHOW = 8;

function formatParameter(param: any): string {
  const required = param.required ? " (required)" : "";
  const type = param.type || (param.schema ? "object" : "unknown");
  return `    ${param.name} [${param.in}]: ${type}${required}`;
}

function formatEndpoint(endpointPath: string, methods: Record<string, any>): string {
  let result = "";
  for (const [method, op] of Object.entries(methods)) {
    if (typeof op !== "object" || op === null) continue;
    result += `${method.toUpperCase()} ${endpointPath}`;
    if (op.summary || op.description) {
      const desc = (op.summary || op.description).replace(/\n/g, " ");
      const maxLen = 120;
      result += `\n  Description: ${desc.length > maxLen ? desc.slice(0, maxLen) + "..." : desc}`;
    }
    if (op.tags?.length) {
      result += `\n  Tags: ${op.tags.join(", ")}`;
    }
    const pathParams = (op.parameters || []).filter((p: any) => p.in === "path");
    const bodyParam = (op.parameters || []).find((p: any) => p.in === "body");
    const queryParams = (op.parameters || []).filter((p: any) => p.in === "query");
    if (pathParams.length) {
      result += "\n  Path params:";
      pathParams.forEach((p: any) => { result += `\n${formatParameter(p)}`; });
    }
    if (bodyParam) {
      const ref = bodyParam.schema?.$ref?.split("/").pop() || "object";
      result += `\n  Body: ${ref}`;
    }
    if (queryParams.length) {
      result += `\n  Query params: ${queryParams.length} available`;
    }
    const response200 = op.responses?.["200"]?.schema;
    if (response200) {
      const ref = response200.$ref?.split("/").pop() || response200.type || "object";
      result += `\n  Response: ${ref}`;
    }
  }
  return result;
}

function formatDefinition(name: string, def: any): string {
  let result = `${name}`;
  if (def.description) {
    const desc = def.description.replace(/\n/g, " ");
    const maxLen = 120;
    result += `\n  Description: ${desc.length > maxLen ? desc.slice(0, maxLen) + "..." : desc}`;
  }
  if (def.properties) {
    const props = Object.entries(def.properties).slice(0, MAX_PROPERTIES_TO_SHOW);
    result += "\n  Properties:";
    for (const [propName, propDef] of props as [string, any][]) {
      const propType = propDef.type || (propDef.$ref ? propDef.$ref.split("/").pop() : "object");
      result += `\n    ${propName}: ${propType}`;
    }
    const total = Object.keys(def.properties).length;
    if (total > MAX_PROPERTIES_TO_SHOW) {
      result += `\n    ... and ${total - MAX_PROPERTIES_TO_SHOW} more properties`;
    }
  }
  return result;
}

export async function searchAdobeCommerceRestSchema(
  query: string,
  { version = DEFAULT_VERSION }: { version?: string } = {}
): Promise<
  | { success: true; responseText: string; usedVersion: string }
  | { success: false; error: string }
> {
  try {
    const { content, usedVersion } = await loadRestSchemaContent(version);
    const schema = JSON.parse(content);

    const searchTerm = query.trim().toLowerCase();

    // Search endpoints (paths)
    const allPaths: Array<{ path: string; methods: Record<string, any> }> = [];
    for (const [endpointPath, methods] of Object.entries(
      schema.paths || {}
    ) as [string, any][]) {
      if (!searchTerm || endpointPath.toLowerCase().includes(searchTerm)) {
        allPaths.push({ path: endpointPath, methods });
        continue;
      }
      // Also check tags and descriptions inside operations
      const ops = Object.values(methods as Record<string, any>);
      const matchesTags = ops.some((op: any) =>
        op?.tags?.some((t: string) => t.toLowerCase().includes(searchTerm))
      );
      const matchesDesc = ops.some(
        (op: any) =>
          op?.summary?.toLowerCase().includes(searchTerm) ||
          op?.description?.toLowerCase().includes(searchTerm)
      );
      if (matchesTags || matchesDesc) {
        allPaths.push({ path: endpointPath, methods });
      }
    }

    const endpointsWereTruncated = allPaths.length > MAX_ENDPOINTS_TO_SHOW;
    const limitedPaths = allPaths.slice(0, MAX_ENDPOINTS_TO_SHOW);

    // Search definitions
    const allDefs: Array<{ name: string; def: any }> = [];
    for (const [name, def] of Object.entries(schema.definitions || {}) as [
      string,
      any,
    ][]) {
      if (!searchTerm || name.toLowerCase().includes(searchTerm)) {
        allDefs.push({ name, def });
      }
    }

    const defsWereTruncated = allDefs.length > MAX_DEFINITIONS_TO_SHOW;
    const limitedDefs = allDefs.slice(0, MAX_DEFINITIONS_TO_SHOW);

    let responseText = "";

    if (usedVersion !== version) {
      responseText += `> Note: REST schema for version ${version} not found. Using ${usedVersion} as fallback.\n\n`;
    }

    responseText += "## Matching REST API Endpoints:\n";
    if (endpointsWereTruncated) {
      responseText += `(Results limited to ${MAX_ENDPOINTS_TO_SHOW} items. Refine your search for more specific results.)\n\n`;
    }
    if (limitedPaths.length > 0) {
      responseText +=
        limitedPaths
          .map(({ path: p, methods }) => formatEndpoint(p, methods))
          .join("\n\n") + "\n\n";
    } else {
      responseText += "No matching endpoints found.\n\n";
    }

    responseText += "## Matching REST API Definitions:\n";
    if (defsWereTruncated) {
      responseText += `(Results limited to ${MAX_DEFINITIONS_TO_SHOW} items. Refine your search for more specific results.)\n\n`;
    }
    if (limitedDefs.length > 0) {
      responseText += limitedDefs
        .map(({ name, def }) => formatDefinition(name, def))
        .join("\n\n");
    } else {
      responseText += "No matching definitions found.";
    }

    return { success: true, responseText, usedVersion };
  } catch (error) {
    console.error(
      `[adobe-commerce-rest-schema-tool] Error processing REST schema: ${error}`
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
