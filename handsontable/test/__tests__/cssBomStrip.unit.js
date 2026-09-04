import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { resolve, join } from 'path';
import { tmpdir } from 'os';

import stripCssBomPlugin from '../../.config/plugin/rspack/strip-css-bom-plugin';

const readRepoFile = relativePath => readFileSync(resolve(__dirname, '../../', relativePath), 'utf8');

/**
 * Runs a plugin's `afterEmit` tap against an output directory, standing in for the compiler.
 *
 * @param {object} plugin The plugin instance to apply.
 * @param {string} outputPath Directory the fake compilation emitted into.
 * @returns {Promise} Resolves when the tap calls back.
 */
function applyPlugin(plugin, outputPath) {
  let tapped = null;

  plugin.apply({ hooks: { afterEmit: { tapAsync: (name, fn) => {
    tapped = fn;
  } } } });

  return new Promise(done => tapped({ outputOptions: { path: outputPath } }, done));
}

/**
 * From postcss 8.5.24 on, the minifier turns the `@charset "UTF-8"` that sass emits into a UTF-8
 * BOM, and it lands after the preserved `/*!` license banner rather than at offset 0. Nothing
 * strips a BOM in that position, and U+FEFF is an ident code point in CSS, so it fuses with the
 * selector that follows and `.ht-root-wrapper` stops matching — both in the shipped stylesheet and
 * in the copy inlined into the bundles. See the postcss entry in the root `AGENTS.md`.
 */
describe('minified CSS BOM handling', () => {
  it('should strip a BOM that sits after the license banner, not just a leading one', async() => {
    const dir = mkdtempSync(join(tmpdir(), 'ht-bom-'));
    const cssPath = join(dir, 'out.css');
    const banner = '/*! Copyright */\n';

    writeFileSync(cssPath, `${banner}\uFEFF.ht-root-wrapper{display:flex}`, 'utf8');

    await applyPlugin(stripCssBomPlugin({ cssFilename: 'out.css' }), dir);

    const result = readFileSync(cssPath, 'utf8');

    expect(result).toBe(`${banner}.ht-root-wrapper{display:flex}`);
    expect(readFileSync(cssPath).includes(Buffer.from([0xEF, 0xBB, 0xBF]))).toBe(false);

    rmSync(dir, { recursive: true, force: true });
  });

  it('should leave a stylesheet without a BOM untouched', async() => {
    const dir = mkdtempSync(join(tmpdir(), 'ht-bom-'));
    const cssPath = join(dir, 'out.css');
    const clean = '/*! Copyright */\n.ht-root-wrapper{display:flex}';

    writeFileSync(cssPath, clean, 'utf8');

    await applyPlugin(stripCssBomPlugin({ cssFilename: 'out.css' }), dir);

    expect(readFileSync(cssPath, 'utf8')).toBe(clean);

    rmSync(dir, { recursive: true, force: true });
  });

  it('should register the strip before the export plugin reads the file back', () => {
    const config = readRepoFile('.config/styles-production.js');

    expect(config).toContain('require(\'./plugin/rspack/strip-css-bom-plugin\')');

    const stripIndex = config.indexOf('stripCssBomPlugin({');
    const exportIndex = config.indexOf('addCssToJsExport(config');

    expect(stripIndex).toBeGreaterThan(-1);
    expect(exportIndex).toBeGreaterThan(-1);

    // Both are `afterEmit` taps, so registration order decides which sees the BOM.
    expect(stripIndex).toBeLessThan(exportIndex);
  });

  it('should keep the export plugin stripping as well, for the configs without the plugin', () => {
    const exportPlugin = readRepoFile('.config/plugin/rspack/css-to-js-export-plugin.js');

    expect(exportPlugin).toContain('replace(/\\uFEFF/g, \'\')');
  });

  it('should not cap postcss below 8.5.24 — that range admits a single published version', () => {
    const { pnpm } = JSON.parse(readRepoFile('../package.json'));

    expect(pnpm.overrides.postcss).toBe('^8.5.23');
  });
});
