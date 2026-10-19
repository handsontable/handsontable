module.exports = {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost/',
  },
  transform: {
    '.*\\.(vue)$': '@vue/vue3-jest',
    '^.+\\.ts?$': ['ts-jest', {
      tsconfig: 'test-tsconfig.json',
      babelConfig: true,
    }],
    '^.+\\js$': 'babel-jest',
  },
  testRegex: '(/test/(.*).(test|spec)).(js?|ts?)$',
  moduleFileExtensions: [
    'ts',
    'js',
    'json',
    'vue',
    'node',
  ],
  setupFilesAfterEnv: [
    '<rootDir>/test/bootstrap.js'
  ],
};
