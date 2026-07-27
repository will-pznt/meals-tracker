import js from "@eslint/js";
import angular from "angular-eslint";
import importPlugin from "eslint-plugin-import";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["projects/**/*", "**/dist"],
  },

  // TypeScript files
  {
    files: ["**/*.ts"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
      prettierRecommended,
    ],
    processor: angular.processInlineTemplates,

    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
      },
    },

    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        project: ["tsconfig.json"],
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
    extends: [...angular.configs.templateRecommended],
    rules: {},
  },
);
