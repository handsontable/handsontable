import fs from 'fs';
import path from 'path';
import Handsontable from 'handsontable';
import * as coreRegistries from '../registries';
import * as pageRegistries from '../registries.umd';

const SOURCE_DIR = path.resolve(__dirname, '..');
// Any import, re-export or dynamic import of a registry module or of the hook registry, in either quote style.
const REGISTRY_IMPORT = new RegExp(
  '(from|import\\()\\s*[\'"]\\.\\./(cellTypes/registry|editors/registry|renderers/registry|validators/registry|' +
  'plugins/registry|core/hooks|core/hooks/(?!constants)[^\'"]*)[\'"]'
);

/**
 * Reads a source with its type-only imports removed: a type import is erased and inlines nothing.
 *
 * @param {string} file The path relative to the module.
 * @returns {string}
 */
function readRuntimeSource(file) {
  return fs.readFileSync(path.join(SOURCE_DIR, file), 'utf8').replace(/^import type[^;]*;$/gm, '');
}

/**
 * Lists the TypeScript sources of the module, the ones in subdirectories too.
 *
 * @param {string} dir The directory to list.
 * @returns {string[]} The paths relative to the module.
 */
function listSources(dir = SOURCE_DIR) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : listSources(fullPath);
    }

    return entry.name.endsWith('.ts') ? [path.relative(SOURCE_DIR, fullPath)] : [];
  });
}

describe('settingsSchema registries', () => {
  describe('boundary', () => {
    it('should read every registry through ./registries and nowhere else', () => {
      // The CDN file swaps `registries.ts` for `registries.umd.ts`. A module that imports a registry
      // directly gets inlined with a second, empty copy of it there.
      const sources = listSources().filter(file => !/^registries(\.umd)?\.ts$/.test(file));

      expect(sources).toContain('validateSettings.ts');

      sources.forEach((file) => {
        expect({ file, importsRegistry: REGISTRY_IMPORT.test(readRuntimeSource(file)) })
          .toEqual({ file, importsRegistry: false });
      });
    });

    it('should export the same names from the page adapter as from the core registries', () => {
      expect(Object.keys(pageRegistries).sort()).toEqual(Object.keys(coreRegistries).sort());
    });
  });

  describe('bridge', () => {
    it('should expose on Handsontable every registry read the page adapter makes, live', () => {
      // The page adapter calls these on the real `Handsontable._registries`. A rename or a dropped entry in
      // `src/index.ts` fails here, not only in the browser spec that needs the built files.
      const names = [
        'hasCellType', 'hasEditor', 'hasRenderer', 'hasValidator', 'hasPlugin', 'getPlugin', 'getPluginsNames',
      ];

      expect(Object.keys(Handsontable._registries).sort()).toEqual(names.slice().sort());
      expect(Handsontable._registries.hasCellType('text')).toBe(coreRegistries.hasCellType('text'));
      expect(Handsontable._registries.hasCellType('nope')).toBe(false);
      expect(Handsontable._registries.hasEditor('text')).toBe(true);
      expect(Handsontable._registries.hasRenderer('text')).toBe(true);
      expect(Handsontable._registries.hasValidator('numeric')).toBe(true);
      expect(Handsontable._registries.hasPlugin('Filters')).toBe(true);
      expect(Handsontable._registries.getPlugin('Filters')).toBe(coreRegistries.getPlugin('Filters'));
      expect(Handsontable._registries.getPluginsNames()).toEqual(coreRegistries.getPluginsNames());
    });
  });

  describe('page adapter', () => {
    /**
     * Loads the page adapter with the given `Handsontable` of the page, the way the UMD wrapper injects it.
     *
     * @param {object|undefined} page The page's `Handsontable`.
     * @returns {object} The adapter module.
     */
    function loadAdapter(page) {
      let adapter;

      jest.isolateModules(() => {
        jest.doMock('../pageHandsontable', () => ({ __esModule: true, default: page }));
        // The adapter has to be loaded after the mock above, inside the isolated registry.
        // eslint-disable-next-line global-require
        adapter = require('../registries.umd');
      });

      return adapter;
    }

    afterEach(() => {
      jest.dontMock('../pageHandsontable');
    });

    it('should answer every read from the page', () => {
      const plugin = { PLUGIN_KEY: 'thirdParty' };
      const adapter = loadAdapter({
        hooks: { isRegistered: name => name === 'afterInit' },
        _registries: {
          hasCellType: name => name === 'late',
          hasEditor: name => name === 'text',
          hasRenderer: name => name === 'text',
          hasValidator: name => name === 'numeric',
          hasPlugin: name => name === 'ThirdParty',
          getPlugin: name => (name === 'ThirdParty' ? plugin : undefined),
          getPluginsNames: () => ['ThirdParty'],
        },
      });

      expect(adapter.hasCellType('late')).toBe(true);
      expect(adapter.hasCellType('other')).toBe(false);
      expect(adapter.hasEditor('text')).toBe(true);
      expect(adapter.hasRenderer('text')).toBe(true);
      expect(adapter.hasValidator('numeric')).toBe(true);
      expect(adapter.hasPlugin('ThirdParty')).toBe(true);
      expect(adapter.getPlugin('ThirdParty')).toBe(plugin);
      expect(adapter.getPluginsNames()).toEqual(['ThirdParty']);
      expect(adapter.getHooks().isRegistered('afterInit')).toBe(true);
    });

    it('should name the missing script when the page has no Handsontable', () => {
      const adapter = loadAdapter(undefined);

      expect(() => adapter.getHooks()).toThrow('Load handsontable.js or handsontable.full.js before');
      expect(() => adapter.hasEditor('text')).toThrow('Load handsontable.js or handsontable.full.js before');
    });

    it('should name the problem when the page has a Handsontable without the bridge', () => {
      const adapter = loadAdapter({ hooks: {} });

      expect(() => adapter.hasPlugin('Filters')).toThrow('and use files of the same version');
    });
  });
});
