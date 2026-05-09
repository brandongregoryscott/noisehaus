import path from "node:path";
import { defineConfig } from "vitest/config";

const srcPath = path.resolve(__dirname, "src");

const config = defineConfig({
    resolve: {
        alias: {
            "@": srcPath,
        },
    },
});

// eslint-disable-next-line collation/no-default-export -- This config needs to be default exported
export default config;
