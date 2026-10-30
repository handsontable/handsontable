import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

import {
  RELEASED_FILE,
  buildCommittedOutputs,
  buildManifest,
  checkReleased,
  checkSources,
  computeImplies,
  findStaleOutputs,
  indexEntries,
  listEntries,
  loadSources,
  toPluginDeps,
} from '../../scripts/utils/feature-manifest';

/**
 * The feature manifest has three parts that can drift apart: the `feature.json`/`features.json` sources, the
 * source code they describe, and the committed files generated from them (`feature.generated.ts`,
 * `released-tokens.json`). These tests pin all three together. The rules are in
 * `src/featureManifest/AGENTS.md`; regenerate with `npm run generate:feature-manifest --prefix handsontable`.
 */

const PACKAGE_DIR = resolve(__dirname, '../..');
const readPackageFile = relativePath => readFileSync(resolve(PACKAGE_DIR, relativePath), 'utf8');

/**
 * Returns a copy of the sources with one entry changed (or removed, when `change` returns `null`).
 *
 * @param {object} sources What `loadSources()` returns.
 * @param {string} id The id of the entry to change.
 * @param {Function} change Gets a copy of the entry, returns the new entry or `null`.
 * @returns {object}
 */
function withEntry(sources, id, change) {
  const copy = JSON.parse(JSON.stringify(sources));

  copy.files.forEach((file) => {
    if (Array.isArray(file.data?.capabilities)) {
      file.data.capabilities = file.data.capabilities
        .map(entry => (entry.id === id ? change(entry) : entry))
        .filter(entry => entry !== null);
    }
  });

  return copy;
}

/**
 * Returns a copy of the sources with the top level of one file changed.
 *
 * @param {object} sources What `loadSources()` returns.
 * @param {string} file The file, relative to `handsontable/`.
 * @param {Function} change Gets a copy of the parsed file, returns the new one.
 * @returns {object}
 */
function withFile(sources, file, change) {
  const copy = JSON.parse(JSON.stringify(sources));
  const source = copy.files.find(item => item.file === file);

  source.data = change(source.data);

  return copy;
}

describe('feature manifest', () => {
  const sources = loadSources(PACKAGE_DIR);
  const byId = indexEntries(sources);
  const entryOf = id => byId.get(id);

  describe('sources', () => {
    it('should find every registry folder (positive control for the completeness check)', () => {
      const count = kind => sources.modules.filter(module => module.kind === kind).length;

      expect(count('plugin')).toBeGreaterThan(40);
      expect(count('cell_type')).toBeGreaterThan(10);
      expect(count('editor')).toBeGreaterThan(10);
      expect(count('renderer')).toBeGreaterThan(10);
      expect(count('validator')).toBeGreaterThan(5);
    });

    it('should pass every check', () => {
      expect(checkSources(sources)).toEqual([]);
      expect(checkReleased(sources)).toEqual([]);
    });

    it('should keep the committed generated files in sync with the sources', () => {
      // A stale file means a source changed without `npm run generate:feature-manifest`.
      expect(findStaleOutputs(sources)).toEqual([]);
    });

    it('should list the parts each cell type imports, and nothing else', () => {
      const moduleOf = new Map(sources.modules.map(({ kind, folder, module }) => [`${kind}:${folder}`, module]));
      const partKinds = { editors: 'editor', renderers: 'renderer', validators: 'validator' };

      sources.modules.filter(({ kind }) => kind === 'cell_type').forEach(({ folder, module }) => {
        const source = readPackageFile(`src/cellTypes/${folder}/${folder}.ts`);
        const imported = [...source.matchAll(/from '\.\.\/\.\.\/(editors|renderers|validators)\/(\w+)'/g)]
          .map(([, dir, partFolder]) => {
            const kind = partKinds[dir];

            return [...byId.values()].find(entry => entry.kind === kind &&
              entry.module === moduleOf.get(`${kind}:${partFolder}`)).id;
          })
          .sort();
        const entry = [...byId.values()].find(item => item.kind === 'cell_type' && item.module === module);
        const declared = entry.requires.allOf.filter(id => /^(editor|renderer|validator):/.test(id)).sort();

        expect({ module, parts: declared }).toEqual({ module, parts: imported });
      });
    });

    it('should leave no hand-written PLUGIN_DEPS list in a plugin', () => {
      const enforced = new Set(listEntries(sources)
        .filter(({ entry }) => entry.kind === 'plugin' && entry.enforceAtInit === true)
        .map(({ folder }) => folder));

      sources.modules.filter(({ kind }) => kind === 'plugin').forEach(({ folder }) => {
        const files = readdirSync(resolve(PACKAGE_DIR, 'src/plugins', folder))
          .filter(fileName => fileName.endsWith('.ts') && fileName !== 'feature.generated.ts');
        const source = files.map(fileName => readPackageFile(`src/plugins/${folder}/${fileName}`)).join('\n');
        const declaresDeps = /static (get )?PLUGIN_DEPS\b/.test(source);
        const readsGenerated = /return \[\.\.\.PLUGIN_DEPS\];/.test(source) &&
          /import \{ PLUGIN_DEPS \} from '\.\/feature\.generated';/.test(source);

        expect({ folder, declaresDeps, readsGenerated })
          .toEqual({ folder, declaresDeps: enforced.has(folder), readsGenerated: enforced.has(folder) });
      });
    });
  });

  describe('checkSources()', () => {
    it.each([
      ['an id that fails the license-key token rule', 'feat:search', entry => ({ ...entry, id: 'feat:Search' }),
        'fails the license-key token rule'],
      ['an id in the namespace of another kind', 'feat:search', entry => ({ ...entry, id: 'cell:search' }),
        'must start with "feat:"'],
      ['a reserved "<namespace>:all" id', 'xlsx:protection', entry => ({ ...entry, id: 'xlsx:all' }),
        'is reserved'],
      ['an unknown field', 'feat:search', entry => ({ ...entry, price: 10 }), 'unknown field "price"'],
      // Whether a plugin is on by default is the option's default in metaSchema.ts and the plugin's isEnabled().
      ['a copy of a default the source already declares', 'feat:copy_paste',
        entry => ({ ...entry, enabledByDefault: true }), 'unknown field "enabledByDefault"'],
      // Only what an entry needs is recorded; a list of plugins it merely works with is noise.
      ['a list of soft links', 'feat:filters', entry => ({ ...entry, worksWith: ['feat:pagination'] }),
        'unknown field "worksWith"'],
      ['a reference to an id nobody declares', 'feat:search',
        entry => ({ ...entry, requires: { allOf: ['feat:does_not_exist'] } }), 'which no manifest file declares'],
      ['a plugin that is not sold', 'feat:search', entry => ({ ...entry, licensing: 'core', gate: undefined }),
        '"licensing" must be "token"'],
      ['a gate on an entry no key lists', 'cell:text', entry => ({ ...entry, gate: 'report' }),
        '"gate" is only for'],
      ['a core entry that requires a token', 'cell:text',
        entry => ({ ...entry, requires: { allOf: ['editor:text', 'renderer:text', 'feat:search'] } }),
        'a core entry cannot require "feat:search"'],
      ['enforceAtInit on a dependency PLUGIN_DEPS cannot name', 'feat:search',
        entry => ({ ...entry, requires: { allOf: ['xlsx:import'] }, enforceAtInit: true }),
        'cannot name "xlsx:import"'],
      ['a sub-feature that names an unknown plugin', 'xlsx:protection',
        entry => ({ ...entry, plugins: ['ImportFile', 'Spreadsheet'] }), 'unknown plugins: Spreadsheet'],
    ])('should report %s', (_, id, change, message) => {
      const problems = checkSources(withEntry(sources, id, change));

      expect(problems).toEqual([expect.stringContaining(message)]);
    });

    it.each([
      ['no format version', ({ schemaVersion, ...data }) => data, '"schemaVersion" must be 1, found undefined'],
      ['a format version this generator does not read', data => ({ ...data, schemaVersion: 2 }),
        '"schemaVersion" must be 1, found 2'],
      ['a format version written as a string', data => ({ ...data, schemaVersion: '1' }),
        '"schemaVersion" must be 1, found "1"'],
      ['an unknown top-level key', data => ({ ...data, $schema: './feature.schema.json' }),
        'unknown top-level key "$schema"'],
    ])('should report a source file with %s', (_, change, message) => {
      const problems = checkSources(withFile(sources, 'src/plugins/search/feature.json', change));

      expect(problems).toEqual([`src/plugins/search/feature.json: ${message}`]);
    });

    it('should report a registry folder with no entry', () => {
      const problems = checkSources(withEntry(sources, 'renderer:html', () => null));

      expect(problems).toEqual(['src/renderers/htmlRenderer: needs exactly one "renderer" entry for "html", found 0']);
    });

    it('should report a plugin folder whose feature.json lists nothing', () => {
      const problems = checkSources(withEntry(sources, 'feat:search', () => null));

      expect(problems).toEqual(['src/plugins/search/feature.json: "capabilities" must be a non-empty array']);
    });

    it('should report a cycle in "requires"', () => {
      const problems = checkSources(withEntry(sources, 'feat:auto_column_size',
        entry => ({ ...entry, requires: { allOf: ['feat:dropdown_menu'] } })));

      expect(problems).toEqual([
        '"requires" has a cycle: feat:auto_column_size -> feat:dropdown_menu -> feat:auto_column_size',
      ]);
    });
  });

  describe('checkReleased()', () => {
    it('should refuse to remove an id released as a token', () => {
      const changed = withEntry(sources, 'feat:search', () => null);

      expect(checkReleased(changed)).toEqual([expect.stringContaining('"feat:search" was released as a token')]);
    });

    it('should refuse to sell an id released as core', () => {
      const changed = withEntry(sources, 'cell:text', entry => ({ ...entry, licensing: 'token', gate: 'report' }));

      expect(checkReleased(changed)).toEqual([expect.stringContaining('"cell:text" was released as "core"')]);
    });

    it('should let a token become core', () => {
      const changed = withEntry(sources, 'feat:search', entry => ({ ...entry, licensing: 'core', gate: undefined }));

      expect(checkReleased(changed)).toEqual([]);
    });

    it('should record every stable id and never drop a record', () => {
      const changed = withEntry(sources, 'renderer:html', () => null);
      const released = JSON.parse(buildCommittedOutputs(changed).find(({ file }) => file === RELEASED_FILE).content);

      expect(released['renderer:html']).toBe('none');
      expect(Object.keys(released)).toEqual(expect.arrayContaining([...byId.keys()]));
    });
  });

  describe('builders', () => {
    it('should generate the PLUGIN_DEPS strings the plugins shipped with before the manifest', () => {
      // The custom-build service reads these strings from each plugin class, so they must not change.
      expect(toPluginDeps(entryOf('feat:filters'), byId))
        .toEqual(['plugin:DropdownMenu', 'plugin:HiddenRows', 'cell-type:checkbox']);
      expect(toPluginDeps(entryOf('feat:dropdown_menu'), byId)).toEqual(['plugin:AutoColumnSize']);
      expect(toPluginDeps(entryOf('feat:context_menu'), byId)).toEqual(['plugin:AutoColumnSize']);
      expect(toPluginDeps(entryOf('feat:collapsible_columns'), byId)).toEqual(['plugin:NestedHeaders']);
    });

    it('should generate PLUGIN_DEPS for the plugins that cannot work without their dependency', () => {
      // FormulaBuilder and CheckboxHeader are new in 19.0. Loading does nothing without Dialog, so it throws too.
      expect(toPluginDeps(entryOf('feat:formula_builder'), byId)).toEqual(['plugin:Formulas']);
      expect(toPluginDeps(entryOf('feat:checkbox_header'), byId)).toEqual(['cell-type:checkbox']);
      expect(toPluginDeps(entryOf('feat:loading'), byId)).toEqual(['plugin:Dialog']);
    });

    it('should imply every sold entry "requires.allOf" reaches, and nothing else', () => {
      // Filters needs DropdownMenu, which needs AutoColumnSize. Parts (licensing "none") and "anyOf" stay out.
      expect(computeImplies(entryOf('feat:filters'), byId))
        .toEqual(['cell:checkbox', 'feat:auto_column_size', 'feat:dropdown_menu', 'feat:hidden_rows']);
      expect(computeImplies(entryOf('cell:date'), byId)).toEqual([]);
      expect(computeImplies(entryOf('xlsx:data_validation'), byId)).toEqual(['cell:dropdown']);
      // Formulas and comments in a file are read into, and written from, their plugins.
      expect(computeImplies(entryOf('xlsx:formulas'), byId)).toEqual(['feat:formulas']);
      expect(computeImplies(entryOf('xlsx:comments'), byId)).toEqual(['feat:comments']);
    });

    it('should build the same bytes every time, with every field on every capability', () => {
      const first = JSON.stringify(buildManifest(sources, '19.0.0'));
      const manifest = buildManifest(loadSources(PACKAGE_DIR), '19.0.0');

      expect(JSON.stringify(manifest)).toBe(first);
      expect(manifest).toMatchObject({
        schemaVersion: 1,
        product: 'handsontable',
        version: '19.0.0',
        keyFlag: 'listed-capabilities',
      });
      expect(new RegExp(manifest.tokenRule).test('xlsx:conditional_formatting')).toBe(true);
      expect(manifest.capabilities).toHaveLength(byId.size);
      manifest.capabilities.forEach((capability) => {
        expect(Object.keys(capability)).toEqual([
          'id', 'kind', 'module', 'plugins', 'name', 'description', 'since', 'status', 'licensing', 'gate',
          'requires', 'enforceAtInit', 'packages', 'implies',
        ]);
      });
    });
  });
});
