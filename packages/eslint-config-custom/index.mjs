import { defineConfig } from "eslint/config";
import tsEslint from "typescript-eslint";
import collationPlugin from "eslint-plugin-collation";
import importPlugin from "eslint-plugin-import";
import stylisticPlugin from "@stylistic/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import perfectionistPlugin from "eslint-plugin-perfectionist";

const config = defineConfig([
    { files: ["**/*.{ts,tsx}"] },
    {
        rules: {
            curly: ["error", "all"],
            eqeqeq: [
                "error",
                "always",
                {
                    null: "ignore",
                },
            ],
            "no-console": "error",
            "no-useless-rename": "error",
            "no-var": "error",
        },
    },
    {
        plugins: {
            "@typescript-eslint": tsEslint.plugin,
        },
        languageOptions: {
            parser: tsEslint.parser,
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
                project: "tsconfig.json",
            },
        },
        rules: {
            "@typescript-eslint/consistent-type-definitions": ["error", "type"],
            "@typescript-eslint/consistent-type-exports": "error",
            "@typescript-eslint/consistent-type-imports": "error",
            "@typescript-eslint/explicit-member-accessibility": [
                "error",
                {
                    accessibility: "no-public",
                },
            ],
            "@typescript-eslint/strict-boolean-expressions": [
                "error",
                {
                    allowNullableObject: false,
                    allowNumber: false,
                    allowString: false,
                },
            ],
        },
    },
    {
        plugins: {
            collation: collationPlugin,
        },
        rules: {
            "collation/group-exports": "error",
            "collation/no-default-export": "error",
            "collation/no-inline-export": "error",
            "collation/no-inline-object-type": "error",
            "collation/prefer-native-private-syntax": "error",
            "collation/sort-dependency-list": "error",
            "collation/sort-exports": "error",
        },
    },
    {
        plugins: {
            react: reactPlugin,
            "react-hooks": reactHooksPlugin,
        },
        settings: {
            react: { version: "18" },
        },
        extends: [
            reactPlugin.configs.flat.recommended,
            reactHooksPlugin.configs.flat.recommended,
        ],
        rules: {
            "react-hooks/exhaustive-deps": "error",
            "react-hooks/rules-of-hooks": "error",
            "react/display-name": "error",
            "react/hook-use-state": "error",
            "react/jsx-boolean-value": ["error", "always"],
            "react/jsx-handler-names": "error",
            "react/jsx-no-constructed-context-values": "error",
            "react/jsx-sort-props": "error",
            "react/self-closing-comp": "error",
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
            "react/no-unescaped-entities": "off",
        },
    },
    {
        plugins: {
            "@stylistic": stylisticPlugin,
        },
        rules: {
            "@stylistic/padding-line-between-statements": [
                "error",
                {
                    blankLine: "always",
                    next: "export",
                    prev: "*",
                },
                {
                    blankLine: "never",
                    next: "export",
                    prev: "export",
                },
                {
                    blankLine: "always",
                    next: "*",
                    prev: "import",
                },
                {
                    blankLine: "never",
                    next: "import",
                    prev: "import",
                },
            ],
        },
    },
    {
        plugins: {
            perfectionist: perfectionistPlugin,
        },
        rules: {
            "perfectionist/sort-classes": [
                "error",
                {
                    fallbackSort: { type: "unsorted" },
                    groups: [
                        "readonly-property",
                        "property",
                        "private-property",
                        "constructor",
                        "abstract-method",
                        "static-method",
                        ["get-method", "set-method"],
                        "method",
                        "private-static-method",
                        "private-method",
                    ],
                    ignoreCase: true,
                    newlinesBetween: "ignore",
                    newlinesInside: "ignore",
                    order: "asc",
                    partitionByComment: false,
                    partitionByNewLine: false,
                    specialCharacters: "keep",
                    type: "alphabetical",
                },
            ],
            "perfectionist/sort-exports": "error",
            "perfectionist/sort-imports": ["error", { newlinesBetween: 0 }],
            "perfectionist/sort-interfaces": "error",
            "perfectionist/sort-intersection-types": "error",
            "perfectionist/sort-object-types": "error",
            "perfectionist/sort-objects": "error",
            "perfectionist/sort-union-types": "error",
        },
    },
    {
        plugins: {
            import: importPlugin,
        },
        rules: {
            "import/consistent-type-specifier-style": [
                "error",
                "prefer-top-level",
            ],
            "import/no-duplicates": "error",
        },
    },
    {
        ignores: ["dist", "eslint.config.mjs", "**/generated/*", "**/*.gen.ts"],
    },
]);

export default config;
