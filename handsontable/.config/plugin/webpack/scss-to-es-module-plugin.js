const fs = require('fs');
const path = require('path');
const sass = require('sass');

/**
 * Plugin that compiles SCSS directly and writes it as a simple ES module file
 * (export default `...`) without any webpack wrapper.
 */
class SCSSToESModulePlugin {
  constructor(options = {}) {
    this.outputPath = options.outputPath;
    this.outputFilename = options.outputFilename || 'styles.js';
    this.scssPath = options.scssPath;
  }

  apply(compiler) {
    compiler.hooks.afterCompile.tap('SCSSToESModulePlugin', (compilation) => {
      // Compile SCSS directly to CSS
      if (!this.scssPath || !fs.existsSync(this.scssPath)) {
        return;
      }

      const scssDir = path.dirname(this.scssPath);

      try {
        const result = sass.renderSync({
          file: this.scssPath,
          includePaths: [
            scssDir,
            path.resolve(__dirname, '../../../src/styles'),
          ],
          outputStyle: 'expanded',
        });

        const cssString = result.css.toString('utf8');

        // Escape the CSS string for JavaScript template literal
        const escapedCss = cssString
          .replace(/\\/g, '\\\\')
          .replace(/`/g, '\\`')
          .replace(/\${/g, '\\${')
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n');

        // Create simple ES module output - just export default with the CSS string
        const esModuleOutput = `/* eslint-disable max-len */\nexport default \`${escapedCss}\`;\n`;

        // Write to the output path
        const fullOutputPath = path.resolve(this.outputPath, this.outputFilename);
        const outputDir = path.dirname(fullOutputPath);

        // Ensure directory exists
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        // Write the file directly (not through webpack assets)
        fs.writeFileSync(fullOutputPath, esModuleOutput, 'utf8');
      } catch (error) {
        compilation.errors.push(new Error(`SCSSToESModulePlugin: ${error.message}`));
      }
    });
  }
}

module.exports = SCSSToESModulePlugin;

