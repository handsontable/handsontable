module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  globals: {
    'jest-preset-angular': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      stringifyContentPathRegex: '\\.html$'
    }
  },
  transform: {
    '^.+\\.(ts|js|html)$': 'jest-preset-angular'
  },
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    // Map any path aliases from tsconfig if needed
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.js'
  },
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$|zone\\.js|@angular|rxjs)'
  ],
  moduleDirectories: ['node_modules', '<rootDir>/../../node_modules'],
  testEnvironmentOptions: {
    html: `
        <html>
            <link href="handsontable/styles/handsontable.min.css"/>
            <link href="handsontable/styles/ht-theme-main.min.css"/>
            <link href="handsontable/styles/ht-theme-horizon.min.css"/>
        </html>
    `
  }
};
