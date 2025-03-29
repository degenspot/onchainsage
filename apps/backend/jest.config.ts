// jest.config.ts (at /Users/Proper/Desktop/onchainsaga/onchainsage/apps/backend/jest.config.ts)
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/test'],
    moduleFileExtensions: ['js', 'json', 'ts'],
    testRegex: '.*\\.spec\\.ts$', 
    transform: {
      '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: ['**/*.(t|j)s'],
    coverageDirectory: '../coverage',
    detectOpenHandles: true,
  };