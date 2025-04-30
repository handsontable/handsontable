module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  transform: {
    '^.+\\.(ts|js|mjs|html)$': 'ts-jest',
  },
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    // Map any path aliases from tsconfig if needed
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.js'
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
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
