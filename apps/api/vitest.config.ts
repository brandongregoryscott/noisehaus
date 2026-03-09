import { defineConfig } from "vitest/config";

const config = defineConfig({
    test: {
        setupFiles: ["./test/setup.ts"],
    },
});

// eslint-disable-next-line collation/no-default-export -- This config needs to be default exported
export default config;
