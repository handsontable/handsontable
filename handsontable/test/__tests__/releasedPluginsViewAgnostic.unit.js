import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, resolve } from 'path';

/**
 * Released plugins that the DataProvider plugin drives when the view the grid shows changes. They must stay
 * unaware of the SheetsBar plugin: its hooks and its settings key are not theirs to depend on, and the per-view
 * state they keep is brought in line by DataProvider through their internal `_resetDataProviderTotal()`,
 * `_resetDataProviderRollback()`, and `_syncDataProviderLoading()` entry points instead.
 */
const VIEW_AGNOSTIC_PLUGINS = ['emptyDataState', 'filters', 'pagination'];

/**
 * What a released plugin's source must not mention: the SheetsBar hook family and the plugin itself.
 */
const FORBIDDEN_PATTERN = /afterSheetTab|beforeSheetTab|sheetsBar|SheetsBar/;

const PLUGINS_DIR = resolve(__dirname, '../../src/plugins');

/**
 * Lists the TypeScript source files under a directory, test folders excluded.
 *
 * @param {string} dir The directory to walk.
 * @returns {string[]} Absolute paths of the `.ts` files.
 */
function listSourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);

    if (statSync(path).isDirectory()) {
      return name === '__tests__' ? [] : listSourceFiles(path);
    }

    return name.endsWith('.ts') ? [path] : [];
  });
}

/**
 * What DataProvider's source must not contain: the SheetsBar plugin's key or module path (a `getPlugin()` call, an
 * import, a settings read) or its hook family. The match is case-sensitive, so its JSDoc may still name `SheetsBar`
 * as an example of a context owner.
 */
const DATA_PROVIDER_FORBIDDEN_PATTERN = /sheetsBar|afterSheetTab|beforeSheetTab/;

/**
 * The per-view entry points of the released plugins. Only DataProvider calls them; the SheetsBar plugin goes
 * through DataProvider's context owner contract instead.
 */
const DRIVEN_ENTRY_POINTS_PATTERN = /_resetDataProviderTotal|_resetDataProviderRollback|_syncDataProviderLoading/;

/**
 * Lists the source files under a plugin directory that match a pattern.
 *
 * @param {string} plugin The plugin directory name.
 * @param {RegExp} pattern The pattern to look for.
 * @returns {string[]} Paths relative to the plugins directory.
 */
function findOffenders(plugin, pattern) {
  return listSourceFiles(join(PLUGINS_DIR, plugin))
    .filter(file => pattern.test(readFileSync(file, 'utf8')))
    .map(file => relative(PLUGINS_DIR, file));
}

describe('the DataProvider context owner contract', () => {
  it('catches every way DataProvider could reach the SheetsBar plugin, and lets its JSDoc name it', () => {
    expect([
      'this.hot.getPlugin(\'sheetsBar\')',
      'import { SheetsBar } from \'../sheetsBar/sheetsBar\';',
      'this.hot.getSettings().sheetsBar',
      'this.addHook(\'afterSheetTabChange\', fn)',
      'this.addHook(\'beforeSheetTabChange\', fn)',
    ].filter(line => !DATA_PROVIDER_FORBIDDEN_PATTERN.test(line))).toEqual([]);
    expect(DATA_PROVIDER_FORBIDDEN_PATTERN.test('With the {@link SheetsBar} plugin, it answers.')).toBe(false);
  });

  it('keeps dataProvider source free of the SheetsBar plugin and its hooks', () => {
    expect(listSourceFiles(join(PLUGINS_DIR, 'dataProvider')).length).toBeGreaterThan(0);
    expect(findOffenders('dataProvider', DATA_PROVIDER_FORBIDDEN_PATTERN)).toEqual([]);
  });

  it('keeps the SheetsBar plugin away from the released plugins\' per-view entry points', () => {
    expect(listSourceFiles(join(PLUGINS_DIR, 'sheetsBar')).length).toBeGreaterThan(0);
    expect(findOffenders('sheetsBar', DRIVEN_ENTRY_POINTS_PATTERN)).toEqual([]);
  });
});

describe('released plugins driven by DataProvider', () => {
  VIEW_AGNOSTIC_PLUGINS.forEach((plugin) => {
    it(`${plugin} source does not reference the SheetsBar plugin or its hooks`, () => {
      expect(listSourceFiles(join(PLUGINS_DIR, plugin)).length).toBeGreaterThan(0);
      expect(findOffenders(plugin, FORBIDDEN_PATTERN)).toEqual([]);
    });
  });
});
