module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/test/cryptoSetup.js'],
  roots: [
    '<rootDir>/src',
    '<rootDir>/test'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['json', 'lcov', 'clover'],
  setupFilesAfterEnv: [
    '<rootDir>/test/bootstrap.js',
    // Jest only. Must NOT be added to `ALLOWED_E2E_MODULES` in `.config/test-e2e.js` — see the
    // file's own comment for what it overrides in a real browser.
    '<rootDir>/test/jsdomThemeVars.js'
  ],
  testRegex: '\\.(unit\\.js|unit\\.ts)$',
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/'
  ],
  testRunner: 'jest-jasmine2',
  moduleNameMapper: {
    // The generated core stylesheet makes jsdom's `getComputedStyle` about 10x slower per grid.
    // See the mock's own comment, and `test/helpers/realCoreStyles.js` for specs that need it.
    '/styles/handsontableStyles$': '<rootDir>/test/__mocks__/coreStylesMock.js',
    '^handsontable(.*)$': '<rootDir>/src$1',
    '^walkontable(.*)$': '<rootDir>/src/3rdparty/walkontable/src$1',
    '\\.(css|scss)$': '<rootDir>/test/__mocks__/styleMock.js',
  }
};
