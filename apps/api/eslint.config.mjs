import { fileURLToPath } from "node:url";
import customConfig from "eslint-config-custom";
import { defineConfig } from "eslint/config";

const config = defineConfig([
    {
        extends: customConfig,
        languageOptions: {
            parserOptions: {
                project: fileURLToPath(
                    new URL("./tsconfig.json", import.meta.url)
                ),
            },
        },
    },
]);

export default config;
