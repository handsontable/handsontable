module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  transform: {
    '^.+\\.(ts|js|mjs|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.html$',
      },
    ],
  },
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$|zone\\.js|@angular|rxjs)',
  ],
  moduleDirectories: ['node_modules', '<rootDir>/../../node_modules'],
  testEnvironmentOptions: {
    html: `
        <html>
        </html>
    `
  }
};
