const { TestEnvironment: NodeEnvironment } = require('jest-environment-node');

class QuietNodeEnvironment extends NodeEnvironment {
  async teardown() {
    const originalEmitWarning = process.emitWarning.bind(process);

    process.emitWarning = (warning, ...args) => {
      const warningText = typeof warning === 'string' ? warning : warning?.message || '';

      if (warningText.includes('--localstorage-file') && warningText.includes('valid path')) {
        return;
      }

      return originalEmitWarning(warning, ...args);
    };

    try {
      await super.teardown();
    } finally {
      process.emitWarning = originalEmitWarning;
    }
  }
}

module.exports = QuietNodeEnvironment;
