module.exports = {
  clearMocks: true,
  collectCoverage: false,
  logHeapUsage: true,
  passWithNoTests: true,
  randomize: true,
  resetModules: true,
  restoreMocks: false,
  rootDir: '..',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/regression/**/*.test.js'],
  verbose: true,
  maxWorkers: 1,
};
