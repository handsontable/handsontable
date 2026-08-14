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

const readRepoFile = relativePath => readFileSync(resolve(__dirname, '../../', relativePath), 'utf8');

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

  it('should keep every browser floor pinned to an explicit version', () => {
    // A moving query (`last 2 versions`) would make builds non-reproducible and would silently drop
    // support on any rebuild.
    BROWSERS_LIST.forEach((entry) => {
      expect(entry).toMatch(/^[A-Za-z ]+ >= \d+(\.\d+)*$/);
    });
  });
});
