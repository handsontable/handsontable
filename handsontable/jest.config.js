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
    '<rootDir>/test/bootstrap.js'
  ],
  testRegex: '\\.(unit\\.js|unit\\.ts)$',
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/'
  ],
  testRunner: 'jest-jasmine2',
  moduleNameMapper: {
    // The linked @hfe/core package lives outside this tree; babel-jest injects
    // @babel/runtime helper imports into it, which must resolve to our copy.
    '^@babel/runtime/(.*)$': '<rootDir>/node_modules/@babel/runtime/$1',
    '^handsontable(.*)$': '<rootDir>/src$1',
    '^walkontable(.*)$': '<rootDir>/src/3rdparty/walkontable/src$1',
    '\\.(css|scss)$': '<rootDir>/test/__mocks__/styleMock.js',
  }
};
