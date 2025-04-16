/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^.+\\.svg$': '<rootDir>/src/__mocks__/svgMock.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: false,
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Tests to run
  testMatch: [
    '**/src/__tests__/lib/utils.test.ts',
    '**/src/__tests__/lib/github.mock.test.ts',
    '**/src/__tests__/lib/update-service.mock.test.ts',
    '**/src/__tests__/lib/use-toast.test.ts',
    '**/src/__tests__/hooks/use-mobile.test.tsx',
    '**/src/__tests__/worker/deployment.test.ts',
    '**/src/__tests__/worker/deploy-check.test.ts'
  ],
};

export default config;