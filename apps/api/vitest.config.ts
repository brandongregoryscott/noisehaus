import { resolve, join } from "node:path";
import { defineConfig } from "vitest/config";

const config = defineConfig({
    resolve: {
        alias: {
            "@": resolve(join(process.cwd(), "src")),
        },
    },
    test: {
        setupFiles: ["./src/test/setup.ts"],
    },
});

// eslint-disable-next-line collation/no-default-export -- This config needs to be default exported
export default config;
