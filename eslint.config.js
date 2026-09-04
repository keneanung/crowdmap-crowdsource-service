import {
    defineConfig,
    globalIgnores,
} from "eslint/config";

import tsParser from "@typescript-eslint/parser";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import js from "@eslint/js";

import {
    FlatCompat,
} from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
    baseDirectory: currentDirectory,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([{
    extends: compat.extends(
        "eslint:recommended",
        "plugin:@typescript-eslint/strict-type-checked",
        "plugin:@typescript-eslint/stylistic-type-checked",
        "prettier",
    ),

    languageOptions: {
        parser: tsParser,

        parserOptions: {
            project: true,
            tsconfigRootDir: currentDirectory,
        },
    },

    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    rules: {
        "@typescript-eslint/no-unused-vars": ["error", {
            "argsIgnorePattern": "^_",
        }],
    },
}, globalIgnores([
    "**/node_modules",
    "**/build",
    "**/generated",
    "**/scripts",
    "**/.eslintrc.js",
    "**/eslint.config.js",
    "**/.prettierrc.js",
    "**/coverage",
    "**/website",
])]);
