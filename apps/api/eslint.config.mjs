import customConfig from "eslint-config-custom";
import { defineConfig } from "eslint/config";

const config = defineConfig([{ extends: customConfig }]);

export default config;
