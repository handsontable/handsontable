const path = require('path');

// __dirname = handsontable-integration-tests/angular-wrapper/
// Jest is run from wrappers/angular-wrapper/ so that the correct node_modules are picked up
const integrationRoot  = __dirname;
const wrapperRoot      = path.resolve(integrationRoot, '../../wrappers/angular-wrapper');
const wrapperSrc       = path.join(wrapperRoot, 'projects/hot-table/src');
const tsconfigPath     = path.join(integrationRoot, 'tsconfig.json');

module.exports = {
  rootDir: integrationRoot,
  setupFilesAfterEnv: [path.join(integrationRoot, 'setup-jest.ts')],
  globals: {
    'jest-preset-angular': {
      tsconfig: tsconfigPath,
      stringifyContentPathRegex: '\\.html$',
    },
  },
  transform: {
    '^.+\\.(ts|js|html|mjs)$': [
      'jest-preset-angular',
      {
        tsconfig: tsconfigPath,
        stringifyContentPathRegex: '\\.html$',
      },
    ],
  },
  testEnvironment: path.join(wrapperRoot, 'node_modules', 'jest-environment-jsdom'),
  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
  moduleNameMapper: {
    '^@handsontable/angular-wrapper$': path.join(wrapperSrc, 'public-api.ts'),
    '\\.(css|less|scss|sass)$': path.join(integrationRoot, 'styleMock.js'),
  },
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$|zone\\.js|@angular|rxjs)',
  ],
  testMatch: [path.join(integrationRoot, 'src/**/*.spec.ts').replace(/\\/g, '/')],
  moduleDirectories: ['node_modules', path.join(wrapperRoot, 'node_modules')],
  testEnvironmentOptions: {
    html: '<html></html>',
  },
};
