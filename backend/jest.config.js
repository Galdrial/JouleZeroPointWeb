/**
 * jest.config.js — Joule Zero Point Backend Test Configuration
 *
 * setupFiles runs BEFORE any module is imported, ensuring
 * environment variables are available when services initialize.
 */
module.exports = {
  testEnvironment: 'node',

  // Inject env stubs before any module load
  setupFiles: [ './tests/setup.env.js' ],

  // Ignore live AI simulation tests in standard CI runs
  testPathIgnorePatterns: [
    '/node_modules/',
    'tests/ai_integrity.test.js',
  ],

  // Increase timeout for async DB operations
  testTimeout: 15000,
};
