/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.svg$': '<rootDir>/src/__mocks__/svgMock.js'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      diagnostics: {
        ignoreCodes: [1343] // Ignore 'import.meta' errors
      },
      useESM: true
    }],
  },
  setupFiles: ['<rootDir>/test-env.js'],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'json-summary'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/__mocks__/**',
    '!src/__tests__/**'
  ],
  verbose: true,
  testTimeout: 10000,
  maxWorkers: '50%',
  watchPathIgnorePatterns: ['<rootDir>/node_modules/'],
  clearMocks: true,
  resetMocks: false,
  restoreMocks: false
};

export default config;