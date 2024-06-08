/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{m,c,}[jt]s',
    '<rootDir>/src/**/*.{m,c,}[jt]s',
    '<rootDir>/test/unit/**/*.{m,c,}[jt]s',
  ],
  coveragePathIgnorePatterns: ['\\.test\\.{m,c,}[jt]s'],
  coverageDirectory: '<rootDir>/dist/.coverage/unit',
  coverageProvider: 'babel',
  logHeapUsage: true,
  passWithNoTests: true,
  preset: 'ts-jest',
  randomize: true,
  resetModules: true,
  restoreMocks: false,
  rootDir: '..',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/unit/**/*.test.{m,c,}[jt]s'],
  verbose: true,
  maxWorkers: 1,
};
