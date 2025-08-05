module.exports = {
  testEnvironment: 'node',
  testTimeout: 24*3600*1000,
  globalSetup: '<rootDir>/test/global.js',
  setupFilesAfterEnv: ['<rootDir>/test/separate.js'],
  testMatch: ['<rootDir>/test/**/*.test.js?(x)'],
  testPathIgnorePatterns: ['<rootDir>/test/fixtures'],
  coveragePathIgnorePatterns: ['<rootDir>/test/'],
  transform: {
    '^.+\\.js$': ['babel-jest', {
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
    }],
  },
};