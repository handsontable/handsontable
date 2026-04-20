/* eslint-disable jsdoc/require-jsdoc */
const path = require('path');
const fs = require('fs');
const jasmineCore = require('jasmine-core');

const jasmineFiles = jasmineCore.files;
const jasminePath = toRelativePath(jasmineFiles.path);
const jasmineBootDir = toRelativePath(jasmineFiles.bootDir);

/**
 * Custom Rspack plugin that generates a Jasmine test runner HTML file.
 * Replaces html-webpack-plugin for test runner generation.
 *
 * @param {object} options Plugin options.
 * @returns {object} Rspack plugin instance.
 */
function JasmineHtmlPlugin(options) {
  options = options || {};

  const config = {
    filename: options.filename || 'SpecRunner.html',
    baseJasminePath: options.baseJasminePath || '',
    jasmineJsFiles: toRelativeFiles(jasminePath, jasmineFiles.jsFiles)
      .concat(toRelativeFiles(jasmineBootDir, jasmineFiles.bootFiles)),
    jasmineCssFiles: toRelativeFiles(jasminePath, jasmineFiles.cssFiles),
    externalJsFiles: options.externalJsFiles || [],
    externalCssFiles: options.externalCssFiles || [],
    hotJsFiles: options.hotJsFiles || [],
    hotCssFiles: options.hotCssFiles || [],
    hotTheme: options.hotTheme || '',
  };

  return {
    __isJasmineHtmlPlugin: true,
    apply(compiler) {
      compiler.hooks.afterEmit.tapAsync('JasmineHtmlPlugin', (compilation, callback) => {
        // Collect the actual emitted JS asset filenames per entrypoint rather
        // than reconstructing them from the entrypoint name. The `filename`
        // template in the Rspack output can include hashes or suffixes
        // (for example per-run IDs for parallel builds) that we cannot guess.
        const jsAssets = [];

        compilation.entrypoints.forEach((entrypoint) => {
          const files = typeof entrypoint.getFiles === 'function' ? entrypoint.getFiles() : [];

          files.forEach((file) => {
            if (file.endsWith('.js')) {
              jsAssets.push(file);
            }
          });
        });

        const html = generateHtml(config, jsAssets);

        fs.writeFileSync(config.filename, html, 'utf8');
        callback();
      });
    }
  };
}

function generateHtml(config, jsAssets) {
  const lines = [];

  lines.push('<!DOCTYPE html>');
  lines.push('<html>');
  lines.push('<head>');
  lines.push('  <meta charset="UTF-8">');
  lines.push('  <title>Jasmine Spec Runner</title>');

  // Jasmine CSS
  config.jasmineCssFiles.forEach((file) => {
    lines.push(`  <link rel="stylesheet" href="${config.baseJasminePath}${file}">`);
  });

  // External CSS
  config.externalCssFiles.forEach((file) => {
    lines.push(`  <link rel="stylesheet" href="${file}">`);
  });

  // Jasmine JS
  config.jasmineJsFiles.forEach((file) => {
    lines.push(`  <script src="${config.baseJasminePath}${file}"></script>`);
  });

  // External JS
  config.externalJsFiles.forEach((file) => {
    lines.push(`  <script src="${file}"></script>`);
  });

  // HOT files (CDN or local) with theme support
  lines.push('');
  lines.push('  <script>');
  lines.push('    (function() {');
  lines.push('      var params = new URLSearchParams(window.location.search);');
  lines.push('      var hotVersion = params.get(\'hotVersion\');');
  lines.push('');
  lines.push('      if (hotVersion) {');
  lines.push(
    '        var cdnBase = \'https://cdn.jsdelivr.net/npm/handsontable@\''
    + ' + hotVersion + \'/dist/\';'
  );
  lines.push(
    '        var cdnStylesBase = \'https://cdn.jsdelivr.net/npm/handsontable@\''
    + ' + hotVersion + \'/styles/\';'
  );
  lines.push(`        var hotTheme = '${config.hotTheme}';`);
  lines.push('');
  lines.push(
    '        document.write(\'<link rel="stylesheet" href="\''
    + ' + cdnBase + \'handsontable.full.css">\');'
  );
  lines.push(
    '        document.write(\'<link rel="stylesheet" href="\''
    + ' + cdnStylesBase + \'ht-theme-\' + hotTheme'
    + ' + \'.css" onerror="this.remove()">\');'
  );
  lines.push(
    '        document.write(\'<scr\' + \'ipt src="\''
    + ' + cdnBase + \'handsontable.full.js"></scr\' + \'ipt>\');'
  );
  lines.push(
    '        document.write(\'<scr\' + \'ipt src="\''
    + ' + cdnBase + \'languages/all.js"></scr\' + \'ipt>\');'
  );
  lines.push('      } else {');

  // HOT CSS files
  (config.hotCssFiles || []).forEach((file) => {
    lines.push(
      `        document.write('<link rel="stylesheet" href="${file}">');`
    );
  });

  // HOT JS files
  (config.hotJsFiles || []).forEach((file) => {
    lines.push(
      `        document.write('<scr' + 'ipt src="${file}"></scr' + 'ipt>');`
    );
  });

  lines.push('      }');
  lines.push('    })();');
  lines.push('  </script>');
  lines.push('');
  lines.push('  <script>');
  lines.push('    if (window.location.search.indexOf(\'random=true\') === -1) {');
  lines.push('      jasmine.getEnv().configure({random: false});');
  lines.push('    }');
  lines.push('  </script>');
  lines.push('</head>');
  lines.push('<body>');

  // Inject test bundle scripts
  jsAssets.forEach((asset) => {
    lines.push(`<script src="dist/${asset}"></script>`);
  });

  lines.push('');
  lines.push('</body>');
  lines.push('</html>');

  return lines.join('\n');
}

function toRelativePath(dirname) {
  return dirname.replace(path.resolve(process.cwd(), '..'), '').replace(/^\//, '');
}

function toRelativeFiles(dirname, files) {
  return files.map(file => path.join(dirname, file));
}

module.exports = JasmineHtmlPlugin;
