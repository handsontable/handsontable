module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking'
  ],
  parserOptions: {
    project: './tsconfig.json',
  },

  rules: {
    "@typescript-eslint/no-explicit-any": "off", // TODO: evenatually we should remove this
    'no-multiple-empty-lines': [
      'error',
      { max: 1 }
    ],
    "@typescript-eslint/ban-types": [
      "error",
      {
        "types": {
          "object": false,
        },
        "extendDefaults": true,
      },
    ],
    "@typescript-eslint/explicit-module-boundary-types": [
      "warn",
      {
        "allowArgumentsExplicitlyTypedAsAny": true // TODO: evenatually we should remove this
      }
    ]

  }
};
