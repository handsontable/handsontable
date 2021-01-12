module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'plugin:react/recommended',
    'plugin:md/recommended',
    'airbnb',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    'react',
  ],
  overrides: [
    {
      files: ['*.md'], // Will match js code inside *.md files
      rules: {

        "md/remark": 0, // Todo
        "max-len": 0 // Todo
      }
    }
  ],
  rules: {
    "max-len": ["error", {"code": 100, "ignoreComments": true, "ignoreStrings": true}],
    "import/no-unresolved": 0, // do not resolves path like @theme @site @docusaurus
    "import/prefer-default-export": 0,
  },
};
