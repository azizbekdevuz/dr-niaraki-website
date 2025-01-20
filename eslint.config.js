const globals = require("globals");

module.exports = [
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parser: require("@typescript-eslint/parser"),
    },
    plugins: {
      react: require("eslint-plugin-react"),
      "@typescript-eslint": require("@typescript-eslint/eslint-plugin"),
    },
    rules: {
      "react/prop-types": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
];
