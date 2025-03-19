import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globals: true,
    coverage: {
      provider: "v8",
    },
    alias: {
      // Similar to the moduleNameMapper in Jest config
      "^(\\.{1,2}/.*)\\.js$": "$1",
    },
  },
});
