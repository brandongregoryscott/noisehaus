import { defineConfig } from "vitest/config";

const config = defineConfig({
    test: {
        environment: "node",
        include: ["src/**/*.test.ts"],
    },
});

// eslint-disable-next-line collation/no-default-export -- This config needs to be default exported
export default config;
