/**
 * @jest-environment node
 */
import rspack from '@rspack/core';

import { SWC_MINIFIER_OPTIONS } from '../../.config/helper/swc-minimizer';

const PRODUCTION_CONFIGS = [
  '../../.config/production',
  '../../.config/languages-production',
  '../../.config/themes-umd-production',
];

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
 * Minifies the fixture with the given SWC minifier options.
 *
 * @param {object} minimizerOptions The `minimizerOptions` passed to `SwcJsMinimizerRspackPlugin`.
 * @returns {string} The minified code.
 */
function minify(minimizerOptions) {
  return rspack.experiments.swc.minifySync(ESCAPED_SOURCE, minimizerOptions).code;
}

/**
 * Runs minified fixture code and returns what it exports.
 *
 * @param {string} code The minified code.
 * @returns {{letters: string, sheetName: RegExp, text: string}}
 */
function run(code) {
  const module = {};

  // eslint-disable-next-line no-new-func
  new Function('module', code)(module);

  return module.exports;
}

describe('SWC minifier output charset', () => {
  it('should emit only ASCII bytes for escaped non-ASCII characters', () => {
    const bytes = Buffer.from(minify(SWC_MINIFIER_OPTIONS), 'utf8');

    expect(bytes.every(byte => byte <= 0x7F)).toBe(true);
  });

  it('should read the same under a windows-1252 decode as under UTF-8', () => {
    const bytes = Buffer.from(minify(SWC_MINIFIER_OPTIONS), 'utf8');

    expect(new TextDecoder('windows-1252').decode(bytes)).toBe(new TextDecoder('utf-8').decode(bytes));
  });

  it('should keep the escaped strings and patterns equal to the source values', () => {
    const { letters, sheetName, text } = run(minify(SWC_MINIFIER_OPTIONS));

    expect(letters).toBe(`A-Za-z${String.fromCharCode(0xC0)}-${String.fromCharCode(0x2AF)}`);
    expect(text).toBe(`There${String.fromCharCode(0x2019)}s nothing to display yet${String.fromCharCode(0x2026)}`);
    expect(sheetName.test(`Kawiarni${String.fromCharCode(0xF3)}`)).toBe(true);
    expect(sheetName.test(`Arkusz${String.fromCharCode(0x142)}`)).toBe(true);
  });
});

describe('production build configs', () => {
  it.each(PRODUCTION_CONFIGS)('should minify %s with ASCII-only output', (configPath) => {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const configs = [].concat(require(configPath).create({}));

    expect(configs.length).toBeGreaterThan(0);

    configs.forEach((config) => {
      const minimizers = config.optimization?.minimizer ?? [];
      const swcMinimizers = minimizers.filter(plugin => plugin instanceof rspack.SwcJsMinimizerRspackPlugin);

      expect(swcMinimizers.length).toBeGreaterThan(0);

      swcMinimizers.forEach((plugin) => {
        // Rspack's builtin plugins keep their constructor options in the private `_args` field,
        // with no public getter. If an Rspack upgrade moves it, this read fails loudly.
        const [options] = plugin._args;

        expect(options.minimizerOptions.format.asciiOnly).toBe(true);
      });
    });
  });
});
