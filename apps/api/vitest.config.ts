import path from "node:path";
import { defineConfig } from "vitest/config";

const srcPath = path.resolve(__dirname, "src");

const config = defineConfig({
    oxc: {
        include: /\.([cm]?ts|[jt]sx)$/,
    },
    resolve: {
        alias: {
            "@": srcPath,
        },
    },
    test: {
        include: [
            "src/**/*.test.ts",
            "../../pocketbase/migrations/**/*.test.cts",
        ],
    },
});

// eslint-disable-next-line collation/no-default-export -- This config needs to be default exported
export default config;
