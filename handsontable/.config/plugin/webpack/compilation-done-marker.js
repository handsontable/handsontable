module.exports = function() {
  return {
    apply(compiler) {
      compiler.hooks.done.tap('CompilationDoneMarkerPlugin', () => {
        // 3rd party scripts use these non-printable characters to detect (by analyzing
        // standard output stream) when the build process is done (mostly in watch mode).
        // See: ./handsontable/test/scripts/run-puppeteer-on-code-change.mjs script.
        console.log('\x9d\t\x9d');
      });
    }
  };
}
