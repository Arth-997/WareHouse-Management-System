/** @type {import('jest').Config} */
module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testRegex: 'test/.*\\.spec\\.ts$',
    transform: {
        '^.+\\.ts$': ['ts-jest', { isolatedModules: true }],
    },
    collectCoverageFrom: [
        'src/**/*.service.ts',
    ],
    coverageDirectory: './coverage',
    testEnvironment: 'node',
    testTimeout: 15000,
};
