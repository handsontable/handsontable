import fs from 'fs';
import path from 'path';
import Handsontable from 'handsontable';
import * as coreRegistries from '../registries';
import * as pageRegistries from '../registries.umd';

const SRC_DIR = path.resolve(__dirname, '../..');
const ENTRY = path.join(SRC_DIR, 'settingsSchema.ts');
// The files that hold a registry. The CDN file must not bundle any of them: it reads the page's registries.
const REGISTRY_FILES = [
  'cellTypes/registry.ts',
  'editors/registry.ts',
  'renderers/registry.ts',
  'validators/registry.ts',
  'plugins/registry.ts',
  'utils/staticRegister.ts',
  'core/hooks/index.ts',
].map(file => path.join(SRC_DIR, file));
// What `.config/settings-schema-umd-development.js` swaps in the CDN build.
const ALIASES = new Map([
  [path.join(SRC_DIR, 'settingsSchema/registries.ts'), path.join(SRC_DIR, 'settingsSchema/registries.umd.ts')],
]);
const EXTERNALS = new Set([path.join(SRC_DIR, 'settingsSchema/pageHandsontable.ts')]);
// A static import, a bare import, a re-export or a dynamic import, in either quote style.
const IMPORT_SPECIFIER = /(?:\bfrom|\bimport|\bimport\()\s*['"]([^'"]+)['"]/g;

/**
 * Reads a source with its type-only imports and exports removed: the build erases them, so they inline nothing.
 *
 * @param {string} file The absolute path.
 * @returns {string}
 */
function readRuntimeSource(file) {
  return fs.readFileSync(file, 'utf8').replace(/^(import|export) type[^;]*;$/gm, '');
}

/**
 * Resolves a relative specifier the way the bundler does.
 *
 * @param {string} from The importing file.
 * @param {string} specifier The specifier.
 * @returns {string|null} The absolute path of the source, or `null` for a package or a missing file.
 */
function resolveSource(from, specifier) {
  if (!specifier.startsWith('.')) {
    return null;
  }

  const base = path.resolve(path.dirname(from), specifier);

  return [`${base}.ts`, `${base}.js`, path.join(base, 'index.ts'), path.join(base, 'index.js')]
    .find(candidate => fs.existsSync(candidate)) ?? null;
}

/**
 * Collects every source file the CDN build bundles, following the imports of the public entry.
 *
 * @returns {Set<string>} The absolute paths.
 */
function collectBundledSources() {
  const bundled = new Set();
  const queue = [ENTRY];

  while (queue.length > 0) {
    const file = queue.pop();

    if (!bundled.has(file) && !EXTERNALS.has(file)) {
      bundled.add(file);

      Array.from(readRuntimeSource(file).matchAll(IMPORT_SPECIFIER)).forEach(([, specifier]) => {
        const resolved = resolveSource(file, specifier);

        if (resolved !== null) {
          queue.push(ALIASES.get(resolved) ?? resolved);
        }
      });
    }
  }

  return bundled;
}

describe('settingsSchema registries', () => {
  describe('boundary', () => {
    it('should bundle no registry into the CDN file, however a module reaches it', () => {
      // The CDN file swaps `registries.ts` for `registries.umd.ts`. A module that reaches a registry another way
      // (a barrel such as `../plugins`, a re-export, a helper that imports it) gets the registry inlined with a second,
      // empty copy, and the file then reports every cell type and plugin as unregistered.
      const bundled = collectBundledSources();

      expect(bundled).toContain(ENTRY);
      expect(bundled).toContain(path.join(SRC_DIR, 'settingsSchema/validateSettings.ts'));
      expect(bundled).toContain(path.join(SRC_DIR, 'settingsSchema/registries.umd.ts'));
      expect(bundled).not.toContain(path.join(SRC_DIR, 'settingsSchema/registries.ts'));
      expect(REGISTRY_FILES.filter(file => bundled.has(file)).map(file => path.relative(SRC_DIR, file))).toEqual([]);
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

    it('should fail when the file loads, not in a later call, if the page has a Handsontable without the bridge', () => {
      // `schema.ts` reads the hooks when the file loads. A Handsontable of an older version has `hooks` and no
      // bridge, and a throw from a later call would be turned into one `invalidSettings` problem for every call.
      const adapter = loadAdapter({ hooks: {} });

      expect(() => adapter.getHooks()).toThrow('and use files of the same version');
      expect(() => adapter.hasPlugin('Filters')).toThrow('and use files of the same version');
    });
  });
});
