import { describe, test, expect, beforeEach, vi, afterAll } from "vitest";
import { vol } from "memfs";

vi.mock("node:fs");
vi.mock("node:fs/promises");

import {
  getRestSchemaPath,
  searchAdobeCommerceRestSchema,
} from "./adobe-commerce-rest-schema.js";
import { clearSchemaCache } from "./adobe-commerce-schema.js";

const originalConsoleError = console.error;
console.error = vi.fn();

afterAll(() => {
  console.error = originalConsoleError;
});

const sampleRestSchema = {
  swagger: "2.0",
  info: { title: "Magento Enterprise", version: "2.4.8" },
  paths: {
    "/V1/products": {
      get: {
        tags: ["catalogProductRepositoryV1"],
        summary: "Get the list of products",
        description: "Get the list of products",
        operationId: "catalogProductRepositoryV1GetListGet",
        parameters: [
          { name: "id", in: "path", type: "string", required: true },
          { name: "searchCriteria[pageSize]", in: "query", type: "integer" },
        ],
        responses: {
          "200": {
            description: "200 Success.",
            schema: {
              $ref: "#/definitions/catalog-data-product-search-results-interface",
            },
          },
        },
      },
      post: {
        tags: ["catalogProductRepositoryV1"],
        summary: "Create a product",
        description: "Create a product",
        operationId: "catalogProductRepositoryV1SavePost",
        parameters: [
          {
            name: "body",
            in: "body",
            schema: { $ref: "#/definitions/catalog-data-product-interface" },
          },
        ],
        responses: {
          "200": {
            description: "200 Success.",
            schema: { $ref: "#/definitions/catalog-data-product-interface" },
          },
        },
      },
    },
    "/V1/orders": {
      get: {
        tags: ["salesOrderRepositoryV1"],
        summary: "Get a list of orders",
        description: "Get a list of orders",
        operationId: "salesOrderRepositoryV1GetListGet",
        parameters: [],
        responses: {
          "200": {
            description: "200 Success.",
            schema: { $ref: "#/definitions/sales-data-order-search-result-interface" },
          },
        },
      },
    },
  },
  definitions: {
    "catalog-data-product-interface": {
      type: "object",
      description: "Product interface",
      properties: {
        id: { type: "integer", description: "Product ID" },
        sku: { type: "string", description: "Product SKU" },
        name: { type: "string", description: "Product name" },
        price: { type: "number", description: "Product price" },
      },
    },
    "catalog-data-product-search-results-interface": {
      type: "object",
      description: "Product search results",
      properties: {
        items: { type: "array", description: "List of products" },
        total_count: { type: "integer", description: "Total count" },
      },
    },
    "sales-data-order-search-result-interface": {
      type: "object",
      description: "Order search result",
      properties: {
        items: { type: "array", description: "List of orders" },
      },
    },
  },
};

describe("getRestSchemaPath", () => {
  test("returns path with dashes for version with dots", () => {
    const p = getRestSchemaPath("2.4.8");
    expect(p).toContain("rest_schema_2-4-8_admin.json");
  });

  test("handles 2.4.7 version", () => {
    const p = getRestSchemaPath("2.4.7");
    expect(p).toContain("rest_schema_2-4-7_admin.json");
  });
});

describe("searchAdobeCommerceRestSchema", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSchemaCache();

    vol.reset();
    vol.fromJSON({
      "./data/rest_schema_2-4-8_admin.json": JSON.stringify(sampleRestSchema),
      "./data/rest_schema_2-4-7_admin.json": JSON.stringify(sampleRestSchema),
    });
  });

  test("returns matching endpoints for a search query", async () => {
    const result = await searchAdobeCommerceRestSchema("product");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.responseText).toContain("## Matching REST API Endpoints:");
    expect(result.responseText).toContain("/V1/products");
    expect(result.responseText).toContain("GET");
    expect(result.responseText).toContain("POST");
  });

  test("returns matching definitions for a search query", async () => {
    const result = await searchAdobeCommerceRestSchema("product");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.responseText).toContain("## Matching REST API Definitions:");
    expect(result.responseText).toContain("catalog-data-product-interface");
    expect(result.responseText).toContain(
      "catalog-data-product-search-results-interface"
    );
  });

  test("filters results by search term", async () => {
    const result = await searchAdobeCommerceRestSchema("order");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.responseText).toContain("/V1/orders");
    expect(result.responseText).not.toContain("/V1/products");
  });

  test("returns all endpoints when query is empty", async () => {
    const result = await searchAdobeCommerceRestSchema("");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.responseText).toContain("/V1/products");
    expect(result.responseText).toContain("/V1/orders");
  });

  test("uses 2.4.8 schema by default", async () => {
    const result = await searchAdobeCommerceRestSchema("product");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.usedVersion).toBe("2.4.8");
  });

  test("uses 2.4.7 schema when version is specified and file exists", async () => {
    const result = await searchAdobeCommerceRestSchema("product", {
      version: "2.4.7",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.usedVersion).toBe("2.4.7");
  });

  test("falls back to 2.4.8 when requested version REST schema is missing", async () => {
    vol.reset();
    vol.fromJSON({
      "./data/rest_schema_2-4-8_admin.json": JSON.stringify(sampleRestSchema),
      // no 2.4.5 file
    });
    clearSchemaCache();

    const result = await searchAdobeCommerceRestSchema("product", {
      version: "2.4.5",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.usedVersion).toBe("2.4.8");
    expect(result.responseText).toContain("fallback");
  });

  test("includes fallback note in response text when version not found", async () => {
    vol.reset();
    vol.fromJSON({
      "./data/rest_schema_2-4-8_admin.json": JSON.stringify(sampleRestSchema),
    });
    clearSchemaCache();

    const result = await searchAdobeCommerceRestSchema("product", {
      version: "2.4.5",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.responseText).toContain("Note:");
    expect(result.responseText).toContain("2.4.5");
    expect(result.responseText).toContain("2.4.8");
  });

  test("returns error when no REST schema file exists at all", async () => {
    vol.reset();
    vol.fromJSON({});
    clearSchemaCache();

    const result = await searchAdobeCommerceRestSchema("product");
    expect(result.success).toBe(false);
  });

  test("shows description for endpoints", async () => {
    const result = await searchAdobeCommerceRestSchema("product");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.responseText).toContain("Description:");
  });

  test("shows properties for definitions", async () => {
    const result = await searchAdobeCommerceRestSchema("catalog-data-product-interface");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.responseText).toContain("Properties:");
    expect(result.responseText).toContain("sku");
  });
});
