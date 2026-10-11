import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

const config = defineConfig({
    plugins: [
        tanstackRouter({
            generatedRouteTree: "./src/generated/route-tree.ts",
            routesDirectory: "./src/routes",
            target: "react",
        }),
        react(),
    ],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    server: {
        port: 3000,
    },
});

// eslint-disable-next-line collation/no-default-export -- This config needs to be default exported
export default config;
