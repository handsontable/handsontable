/**
 * @jest-environment node
 */
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import rspack from '@rspack/core';

import { createSwcJsMinimizer } from '../../.config/helper/swc-minimizer';
import assertAsciiOutput, {
  PLUGIN_NAME as ASSERT_ASCII_PLUGIN_NAME,
} from '../../.config/plugin/rspack/assert-ascii-output';

const CONFIG_DIR = resolve(__dirname, '../../.config');
const HELPER_PATH = join(CONFIG_DIR, 'helper/swc-minimizer.js');

/**
 * HyperFormula builds its lexer from escaped strings like these (`UNICODE_LETTER_PATTERN` in its
 * `parser-consts`). The source stays ASCII, but the SWC minifier re-emits every escape above
 * U+00FF as a raw UTF-8 character unless `asciiOnly` is set. A page served without a UTF-8 charset
 * then decodes those bytes as windows-1252, so U+02AF turns into two Latin-1 characters, the
 * letter class shrinks to `A-Za-z` plus U+00C0-U+00CA, and sheet names, named expressions, and
 * function names with letters such as U+00F3 or U+0142 stop parsing.
 */
const ESCAPED_SOURCE = `
module.exports = (() => {
  const letters = 'A-Za-z\\u00C0-\\u02AF';

  return {
    letters,
    sheetName: new RegExp('^[' + letters + '0-9_]+$'),
    text: 'There\\u2019s nothing to display yet\\u2026',
  };
})();
`;

/**
 * Reads the options a minimizer plugin hands to the Rspack binding, after Rspack's own defaults
 * (`compress`, `mangle`, `ecma`) are applied. `raw()` is the method Rspack itself calls to build
 * the binding options.
 *
 * @param {rspack.SwcJsMinimizerRspackPlugin} plugin The minimizer plugin.
 * @returns {object} The resolved `minimizerOptions`.
 */
function getMinimizerOptions(plugin) {
  return plugin.raw({}).options.minimizerOptions;
}

/**
 * Minifies the fixture the way the production build does.
 *
 * @returns {string} The minified code.
 */
function minify() {
  return rspack.experiments.swc.minifySync(ESCAPED_SOURCE, getMinimizerOptions(createSwcJsMinimizer())).code;
}

/**
 * Runs the minified fixture as a browser would after decoding its bytes with `encoding`, and
 * returns what it exports.
 *
 * @param {string} code The minified code.
 * @param {string} encoding The encoding the page decodes the script with.
 * @returns {{letters: string, sheetName: RegExp, text: string}}
 */
function runDecodedAs(code, encoding) {
  const module = {};
  const decoded = new TextDecoder(encoding).decode(Buffer.from(code, 'utf8'));

  // eslint-disable-next-line no-new-func
  new Function('module', decoded)(module);

  return module.exports;
}

describe('SWC minifier output charset', () => {
  it('should emit only ASCII bytes for escaped non-ASCII characters', () => {
    const bytes = Buffer.from(minify(), 'utf8');

    expect(bytes.every(byte => byte <= 0x7F)).toBe(true);
  });

  it.each(['utf-8', 'windows-1252'])('should keep strings and patterns intact when decoded as %s', (encoding) => {
    const { letters, sheetName, text } = runDecodedAs(minify(), encoding);

    expect(letters).toBe(`A-Za-z${String.fromCharCode(0xC0)}-${String.fromCharCode(0x2AF)}`);
    expect(text).toBe(`There${String.fromCharCode(0x2019)}s nothing to display yet${String.fromCharCode(0x2026)}`);
    expect(sheetName.test(`Kawiarni${String.fromCharCode(0xF3)}`)).toBe(true);
    expect(sheetName.test(`Arkusz${String.fromCharCode(0x142)}`)).toBe(true);
  });
});

describe('production build configs', () => {
  it('should build every SWC minimizer through createSwcJsMinimizer()', () => {
    const configFiles = readdirSync(CONFIG_DIR, { recursive: true })
      .filter(name => name.endsWith('.js'))
      .map(name => join(CONFIG_DIR, name))
      .filter(path => path !== HELPER_PATH);
    const inlineMinimizers = configFiles
      .filter(path => readFileSync(path, 'utf8').includes('SwcJsMinimizerRspackPlugin'));

    expect(configFiles.length).toBeGreaterThan(0);
    expect(inlineMinimizers).toEqual([]);
  });

  it.each([
    'production.js',
    'languages-production.js',
    'themes-umd-production.js',
  ])('should minify with ASCII-only output in %s', (name) => {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const configs = [].concat(require(join(CONFIG_DIR, name)).create({}));

    configs.forEach((config) => {
      const swcMinimizers = (config.optimization?.minimizer ?? [])
        .filter(plugin => plugin instanceof rspack.SwcJsMinimizerRspackPlugin);

      expect(swcMinimizers.length).toBe(1);
      expect(getMinimizerOptions(swcMinimizers[0]).format.asciiOnly).toBe(true);
      expect(config.plugins.filter(plugin => plugin?.name === ASSERT_ASCII_PLUGIN_NAME).length).toBe(1);
    });
  });
});

/**
 * Builds `source` the way the production configs do (production mode, the shared minimizer, and
 * the output check) and resolves with the compilation errors.
 *
 * @param {string} source The entry module source.
 * @returns {Promise<string[]>} The error messages.
 */
function buildWithAsciiCheck(source) {
  const dir = mkdtempSync(join(tmpdir(), 'ht-ascii-'));
  const entry = join(dir, 'entry.js');

  writeFileSync(entry, source, 'utf8');

  return new Promise((done, fail) => {
    rspack({
      mode: 'production',
      context: dir,
      entry,
      output: { path: join(dir, 'dist'), filename: 'bundle.min.js' },
      optimization: { minimize: true, minimizer: [createSwcJsMinimizer()] },
      plugins: [assertAsciiOutput()],
    }, (error, stats) => {
      rmSync(dir, { recursive: true, force: true });

      if (error) {
        fail(error);

        return;
      }

      done(stats.toJson({ all: false, errors: true }).errors.map(({ message }) => message));
    });
  });
}

describe('assert-ascii-output plugin', () => {
  it('should fail the build on a raw character the minifier cannot escape', async() => {
    // `asciiOnly` leaves a tagged template's text as is, because escaping it would change the
    // tag's `strings.raw`.
    const source = 'const tag = strings => strings.raw[0];\n'
      + `window.message = tag\`It${String.fromCharCode(0x2019)}s\`;\n`;
    const errors = await buildWithAsciiCheck(source);

    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('bundle.min.js contains a non-ASCII byte');
  });

  it('should pass a build whose output is ASCII', async() => {
    const source = `window.message = 'It${String.fromCharCode(0x2019)}s';\n`;

    expect(await buildWithAsciiCheck(source)).toEqual([]);
  });
});
