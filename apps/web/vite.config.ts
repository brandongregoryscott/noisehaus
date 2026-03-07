import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

const config = defineConfig({
    plugins: [
        tanstackStart({
            router: {
                generatedRouteTree: "./generated/route-tree.ts",
                routesDirectory: "routes",
            },
            spa: {
                enabled: true,
                prerender: {
                    outputPath: "/index.html",
                },
            },
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
