import { readFileSync } from 'fs';
import { resolve } from 'path';

import { BROWSERS_LIST, ES_TARGET } from '../../../browser-targets';

/**
 * ES years in ascending order, used to compare two `jsc.target`-style strings.
 */
const ES_YEARS = [
  'es5', 'es2015', 'es2016', 'es2017', 'es2018', 'es2019', 'es2020',
  'es2021', 'es2022', 'es2023', 'es2024', 'esnext',
];

/**
 * The CSS features the theme stylesheets ship, and the first version of every targeted browser that
 * supports each one. lightningcss lowers anything above the floor: `light-dark()` becomes a pair of
 * class-switched variables, and nested rules are either flattened or dropped. Both have already
 * shipped as bugs, so the floor is asserted against them here rather than left to a comment.
 */
const CSS_FEATURE_FLOORS = {
  'light-dark()': { Chrome: 123, Edge: 123, Firefox: 120, Safari: 17.5, iOS: 17.5 },
  'CSS nesting': { Chrome: 120, Edge: 120, Firefox: 117, Safari: 17.2, iOS: 17.2 },
};

const readRepoFile = relativePath => readFileSync(resolve(__dirname, '../../', relativePath), 'utf8');

/**
 * Splits a `BROWSERS_LIST` entry into its browser name and its version as a number.
 *
 * @param {string} entry An entry such as `'Safari >= 18.2'`.
 * @returns {{name: string, version: number}} The parsed entry.
 */
function parseFloor(entry) {
  const [name, version] = entry.split(' >= ');

  return { name, version: parseFloat(version) };
}

describe('ES target declarations', () => {
  it('should declare an ES_TARGET that is a known ES year', () => {
    expect(ES_YEARS).toContain(ES_TARGET);
  });

  it('should keep the tsconfig `lib` bucket equal to ES_TARGET', () => {
    // The API floor cannot be derived from browser versions at runtime (TS lib names are ES-year
    // buckets, browser floors are integers), so `lib` is pinned by hand and asserted here. If this
    // fails, either ES_TARGET moved without tsconfig.json following, or the reverse.
    const tsconfig = JSON.parse(readRepoFile('tsconfig.json'));

    expect(tsconfig.compilerOptions.lib).toEqual([ES_TARGET, 'dom', 'dom.iterable']);
  });

  it('should not let swc-transpile emit syntax newer than ES_TARGET', () => {
    // scripts/swc-transpile.mjs hardcodes its target (es2021) so the npm ESM/CJS artifact keeps
    // class fields lowered for Angular's Zone.js. That pin may be older than ES_TARGET, never newer
    // — anything newer would emit syntax the declared browsers cannot parse.
    const source = readRepoFile('scripts/swc-transpile.mjs');
    const match = source.match(/target:\s*'([^']+)'/);

    expect(match).not.toBeNull();
    expect(ES_YEARS.indexOf(match[1])).toBeGreaterThan(-1);
    expect(ES_YEARS.indexOf(match[1])).toBeLessThanOrEqual(ES_YEARS.indexOf(ES_TARGET));
  });

  it('should keep every browser floor at or above the CSS features the themes ship', () => {
    // A floor below one of these makes lightningcss lower that feature out of the shipped CSS. The
    // theme engine's resolved-color path and the runtime theme string both depend on it not doing
    // that, and neither failure is visible in a passing build.
    const tooLow = Object.entries(CSS_FEATURE_FLOORS).flatMap(([feature, supportedFrom]) => (
      BROWSERS_LIST
        .map(parseFloor)
        .filter(({ name, version }) => version < supportedFrom[name])
        .map(({ name, version }) => `${feature} needs ${name} ${supportedFrom[name]}, floor is ${version}`)
    ));

    expect(tooLow).toEqual([]);
  });

  it('should cover every browser floor in the CSS feature table', () => {
    // Adding a browser to BROWSERS_LIST without adding it here would leave it unchecked above.
    Object.values(CSS_FEATURE_FLOORS).forEach((supportedFrom) => {
      expect(Object.keys(supportedFrom).sort())
        .toEqual(BROWSERS_LIST.map(entry => parseFloor(entry).name).sort());
    });
  });

  it('should keep every browser floor pinned to an explicit version', () => {
    // A moving query (`last 2 versions`) would make builds non-reproducible and would silently drop
    // support on any rebuild.
    BROWSERS_LIST.forEach((entry) => {
      expect(entry).toMatch(/^[A-Za-z ]+ >= \d+(\.\d+)*$/);
    });
  });
});
