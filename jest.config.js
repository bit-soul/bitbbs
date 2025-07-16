module.exports = {
  testEnvironment: 'node',
  testTimeout: 24*3600*1000,
  setupFilesAfterEnv: ['<rootDir>/test/tester.js'],
  testMatch: ['<rootDir>/test/**/*.test.js?(x)'],
  testPathIgnorePatterns: ['<rootDir>/test/fixtures'],
  coveragePathIgnorePatterns: ['<rootDir>/test/'],
  transform: {
    '^.+\\.js$': [
      'babel-jest',
      {
        babelConfig: {
          compact: false,
          minified: false,
          retainLines: true,
          sourceMaps: 'inline',
          inputSourceMap: true,
          presets: [],
          overrides: [
            {
              test: ['src/**/*.js'],
              plugins: ['babel-plugin-rewire'],
            },
          ],
        },
      },
    ],
  },
};
