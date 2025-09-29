import { defineConfig, globalIgnores } from "eslint/config";
import { fixupConfigRules } from "@eslint/compat";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

// Resolve current file path for FlatCompat
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Compatibility wrapper for legacy ESLint configs
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  // Ignore dist and projects, but keep src/app
  globalIgnores([
    "projects/**/*",
    "**/dist",
    "!src/app/**/*",
  ]),

  // TypeScript files
  {
    files: ["**/*.ts"],
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
      },
    },
    extends: fixupConfigRules(
      compat.extends(
        "plugin:@angular-eslint/recommended",
        "plugin:@angular-eslint/template/process-inline-templates",
        "plugin:import/recommended",
        "plugin:import/typescript",
        "plugin:prettier/recommended",
        "eslint-config-prettier",
        "plugin:@typescript-eslint/recommended"
      )
    ),

    languageOptions: {
      ecmaVersion: 2022, // Updated for modern JS features
      sourceType: "module",
      parserOptions: {
        project: ["tsconfig.json"],
        createDefaultProgram: true,
      },
    },

    rules: {
      // General rules
      "no-console": "warn",
      "prefer-const": "error",
      "arrow-body-style": ["error", "as-needed"],
      "@typescript-eslint/explicit-function-return-type": "warn",

      // Angular selector conventions
      "@angular-eslint/component-selector": [
        "error",
        { prefix: "app", style: "kebab-case", type: "element" },
      ],
      "@angular-eslint/directive-selector": [
        "error",
        { prefix: "app", style: "camelCase", type: "attribute" },
      ],

      // Import order with standalone component separation
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling", "index"],
            "object",
          ],
          pathGroups: [
            {
              pattern: "**/*.component", // standalone Angular components
              group: "internal",
              position: "after",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },

  // Angular HTML templates
  {
    files: ["**/*.html"],
    extends: fixupConfigRules(
      compat.extends("plugin:@angular-eslint/template/recommended")
    ),
    rules: {},
  },
]);
