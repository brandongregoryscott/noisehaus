import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

const config = defineConfig({
    resolve: {
        alias: {
            "@": resolve(process.cwd()),
        },
    },
    test: {
        setupFiles: ["./test/setup.ts"],
    },
});

// eslint-disable-next-line collation/no-default-export -- This config needs to be default exported
export default config;
