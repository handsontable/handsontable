module.exports = {
  roots: [
    '<rootDir>/src'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['json', 'lcov', 'clover'],
  setupFilesAfterEnv: [
    '<rootDir>/test/bootstrap.js'
  ],
  testRegex: '\\.unit\\.(j|t)s$',
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/'
  ],
  moduleNameMapper: {
    '^handsontable(.*)$': '<rootDir>/src$1',
    '^walkontable(.*)$': '<rootDir>/src/3rdparty/walkontable/src$1',
    '\\.css$': '<rootDir>/test/__mocks__/styleMock.js'
  }
};
