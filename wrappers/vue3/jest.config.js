module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '.*\\.(vue)$': 'vue-jest',
    '^.+\\.ts?$': 'ts-jest',
    '^.+\\js$': 'babel-jest',
  },
  testURL: 'http://localhost/',
  testRegex: '(/test/(.*).(test|spec)).(js?|ts?)$',
  moduleFileExtensions: [
    'ts',
    'js',
    'json',
    'vue',
    'node',
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'test-tsconfig.json',
      babelConfig: true,
    },
  },
};
