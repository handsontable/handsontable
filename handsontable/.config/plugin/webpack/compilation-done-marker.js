module.exports = function() {
  return {
    apply(compiler) {
      compiler.hooks.done.tap('CompilationDoneMarkerPlugin', () => {
        // 3rd party scripts use these non-printable characters to detect (by analyzing
        // standard output stream) when the build process is done (mostly in watch mode).
        // See: ./handsontable/test/scripts/run-puppeteer-on-watchers-change.mjs script.
        // eslint-disable-next-line no-console, no-restricted-globals
        console.log('\x9d\t\x9d');
      });
    }
  };
};
