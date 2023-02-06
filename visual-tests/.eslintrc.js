module.exports = {
  extends: [
    '../.eslintrc.js',
    'plugin:import/typescript'
  ],
  overrides: [
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      rules: {
        'import/extensions': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['error']
      }
    }
  ]
};
