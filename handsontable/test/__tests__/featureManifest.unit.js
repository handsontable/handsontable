import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

import {
  EXPORT_FILE_CAPABILITY_IDS,
  IMPORT_FILE_CAPABILITY_IDS,
  XLSX_CAPABILITY_IDS,
  XLSX_FLAG_BY_ID,
  XLSX_TIERS_BY_ID,
} from '../../src/utils/xlsxEngine/licenseCapabilities.generated';

import {
  LICENSE_GUIDE_FILE,
  RELEASED_FILE,
  XLSX_LICENSE_MODULE_FILE,
  buildCommittedOutputs,
  buildManifest,
  checkRecordAgainstBase,
  checkReleased,
  checkSources,
  computeImplies,
  findStaleOutputs,
  indexEntries,
  listEntries,
  loadSources,
  renderTierMatrix,
  renderXlsxLicenseModule,
  toPluginDeps,
} from '../../scripts/utils/feature-manifest';

/**
 * The feature manifest has three parts that can drift apart: the `feature.json`/`features.json` sources, the
 * source code they describe, and the committed files generated from them (`feature.generated.ts`,
 * `licenseCapabilities.generated.ts`, `released-tokens.json`, and the tier matrix of the license key guide in
 * `docs/`). These tests pin all three together. The rules are in
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

/**
 * Returns a copy of the sources with one more tier, which the listed entries include. The tier is made up, so a
 * test built on it never depends on which feature a real tier sells.
 *
 * @param {object} sources What `loadSources()` returns.
 * @param {string} tier The name of the new tier.
 * @param {string[]} ids The entries that include it.
 * @returns {object}
 */
function withTier(sources, tier, ids) {
  let copy = { ...sources, tiers: [...sources.tiers, tier] };

  ids.forEach((id) => {
    copy = withEntry(copy, id, entry => ({ ...entry, tiers: [...entry.tiers, tier] }));
  });

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

    it('should keep the generated xlsx license module byte-identical to what the builder renders', () => {
      const output = buildCommittedOutputs(sources).find(({ file }) => file === XLSX_LICENSE_MODULE_FILE);

      expect(output).toBeDefined();
      expect(readPackageFile(XLSX_LICENSE_MODULE_FILE)).toBe(output.content);
      expect(output.content.startsWith('// Generated from `features.json` by `npm run generate:feature-manifest`. ' +
        'Do not edit it by hand.\n')).toBe(true);
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
          /import \{[^}]*\bPLUGIN_DEPS\b[^}]*\} from '\.\/feature\.generated';/.test(source);

        expect({ folder, declaresDeps, readsGenerated })
          .toEqual({ folder, declaresDeps: enforced.has(folder), readsGenerated: enforced.has(folder) });
      });
    });

    it('should give every sold plugin the LICENSE of its generated module, and no other plugin one', () => {
      const sold = new Set(listEntries(sources)
        .filter(({ entry }) => entry.kind === 'plugin' && entry.licensing === 'token')
        .map(({ folder }) => folder));

      sources.modules.filter(({ kind }) => kind === 'plugin').forEach(({ folder }) => {
        const files = readdirSync(resolve(PACKAGE_DIR, 'src/plugins', folder))
          .filter(fileName => fileName.endsWith('.ts') && fileName !== 'feature.generated.ts');
        const source = files.map(fileName => readPackageFile(`src/plugins/${folder}/${fileName}`)).join('\n');
        const declaresLicense = /static (get )?LICENSE\b/.test(source);
        const readsGenerated = /static get LICENSE\(\) \{\s+return LICENSE;\s+\}/.test(source) &&
          /import \{[^}]*\bLICENSE\b[^}]*\} from '\.\/feature\.generated';/.test(source);

        expect({ folder, declaresLicense, readsGenerated })
          .toEqual({ folder, declaresLicense: sold.has(folder), readsGenerated: sold.has(folder) });
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
      ['a plugin that is not sold', 'feat:search',
        entry => ({ ...entry, licensing: 'none', gate: undefined, tiers: undefined }), '"licensing" must be "token"'],
      ['enforceAtInit on a dependency PLUGIN_DEPS cannot name', 'feat:search',
        entry => ({ ...entry, requires: { allOf: ['xlsx:import'] }, enforceAtInit: true }),
        'cannot name "xlsx:import"'],
      ['a sub-feature that names an unknown plugin', 'xlsx:protection',
        entry => ({ ...entry, plugins: ['ImportFile', 'Spreadsheet'] }), 'unknown plugins: Spreadsheet'],
      // An id is permanent once merged, so a typo in it must fail before that.
      ['a registry id that does not match its module', 'feat:search', entry => ({ ...entry, id: 'feat:serch' }),
        'must be "feat:search", made from "module"'],
      ['a sub-feature id with no namespace', 'xlsx:protection', entry => ({ ...entry, id: 'protection' }),
        'needs a namespace of its own'],
      ['enforceAtInit with nothing for PLUGIN_DEPS to check', 'feat:search',
        entry => ({ ...entry, enforceAtInit: true }), 'needs a non-empty "requires.allOf"'],
      // `feat:loading` requires `feat:dialog`, and a planned id may still be renamed.
      ['a stable entry that requires a planned one', 'feat:dialog', entry => ({ ...entry, status: 'planned' }),
        'a stable entry cannot require "feat:dialog", which is planned'],
      ['a sold entry with no tiers', 'feat:search', ({ tiers, ...entry }) => entry,
        '"tiers" must be a non-empty list of tier names'],
      ['a sold entry with an empty tier list', 'feat:search', entry => ({ ...entry, tiers: [] }),
        '"tiers" must be a non-empty list of tier names'],
      ['a tier nobody declares', 'feat:search', entry => ({ ...entry, tiers: [...entry.tiers, 'gold'] }),
        'unknown tier "gold"'],
      ['a tier listed twice', 'feat:search', entry => ({ ...entry, tiers: [...entry.tiers, entry.tiers[0]] }),
        `tier "${entryOf('feat:search').tiers[0]}" is listed twice`],
      ['tiers on a building block that is not sold', 'editor:text',
        entry => ({ ...entry, tiers: [sources.tiers[0]] }), '"tiers" is only for sold entries'],
      ['the retired "core" licensing value', 'cell:text',
        entry => ({ ...entry, licensing: 'core', gate: undefined, tiers: undefined }),
        '"licensing" must be one of token, none'],
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

    // `xlsx:styles` requires any of `xlsx:import`, `xlsx:export`; a tier with neither sells a feature nothing can use.
    it('should report a tier that includes a feature and none of its "anyOf" requirements', () => {
      // The tier holds what is never switched off, and of the rest only `xlsx:styles`.
      const always = [...byId.values()].filter(entry => entry.gate === 'report').map(entry => entry.id);
      const problems = checkSources(withTier(sources, 'basic', [...always, 'xlsx:styles']));

      expect(problems).toEqual([expect.stringContaining(
        'tier "basic" includes "xlsx:styles" but none of "xlsx:import", "xlsx:export", one of which it requires')]);
    });

    // A made-up tier that sells every sold entry except `feat:comments`, which `xlsx:comments` requires.
    it('should report a tier that includes a feature and not one of its "allOf" requirements', () => {
      const sold = [...byId.values()].filter(entry => entry.licensing === 'token').map(entry => entry.id);
      const changed = withTier(sources, 'alpha', sold.filter(id => id !== 'feat:comments'));
      const requirers = sold.filter(id => entryOf(id).requires?.allOf?.includes('feat:comments'));

      expect(requirers).toContain('xlsx:comments');
      expect(checkSources(changed)).toEqual(requirers.map(id => expect.stringContaining(
        `tier "alpha" includes "${id}" but not "feat:comments", which it requires`)));
      expect(checkSources(withTier(sources, 'alpha', sold))).toEqual([]);
    });

    it('should require every tier on an entry the runtime never switches off', () => {
      const [first, ...rest] = sources.tiers;
      const reported = [...byId.values()].filter(entry => entry.gate === 'report').map(entry => entry.id);

      expect(reported).toEqual(expect.arrayContaining(['grid', 'cell:text', 'xlsx:import_report']));
      ['grid', 'cell:date', 'xlsx:import_report'].forEach((id) => {
        expect([id, checkSources(withEntry(sources, id, entry => ({ ...entry, tiers: rest })))]).toEqual([id, [
          expect.stringContaining('"gate": "report" is never switched off, so "tiers" must list every tier; ' +
            `"${first}" is missing`),
        ]]);
      });

      // A tier added to `tiers.json` alone is missing from every such entry.
      const added = { ...sources, tiers: [...sources.tiers, 'added_tier'] };

      expect(checkSources(added)).toHaveLength(reported.length);
      expect(checkSources(added).every(problem => problem.includes('"added_tier" is missing'))).toBe(true);
    });

    it('should check a requirement reached through another requirement', () => {
      // Filters requires the column menu, which requires AutoColumnSize: a tier with Filters needs all three.
      const sold = [...byId.values()].filter(entry => entry.licensing === 'token').map(entry => entry.id);

      expect(entryOf('feat:filters').requires.allOf).toContain('feat:dropdown_menu');
      expect(entryOf('feat:filters').requires.allOf).not.toContain('feat:auto_column_size');
      expect(entryOf('feat:dropdown_menu').requires.allOf).toContain('feat:auto_column_size');
      expect(checkSources(withTier(sources, 'alpha', sold.filter(id => id !== 'feat:auto_column_size'))))
        .toContainEqual(expect.stringContaining(
          'tier "alpha" includes "feat:filters" but not "feat:auto_column_size"'));
    });

    describe('tiers.json', () => {
      const FILE = 'src/featureManifest/tiers.json';
      const withTiersFile = tiersFile => ({ ...sources, tiersFile, tiers: tiersFile?.tiers });

      it('should report a missing file', () => {
        expect(checkSources(withTiersFile(null))).toContain(`${FILE}: the file is missing`);
      });

      it.each([
        ['a format version this generator does not read', { schemaVersion: 2 }, '"schemaVersion" must be 1, found 2'],
        ['a key it does not know', { order: [] }, 'unknown top-level key "order"'],
        ['an empty list', { tiers: [] }, '"tiers" must be a non-empty list of tier names'],
        ['a list that is not a list', { tiers: 'standard' }, '"tiers" must be a non-empty list of tier names'],
        ['a name listed twice', { tiers: ['standard', 'standard'] }, 'tier "standard" is listed twice'],
        ['a name that is not a string', { tiers: ['standard', 7] }, 'tier 7 must match /^[a-z][a-z0-9_]*$/'],
      ])('should report %s', (label, change, problem) => {
        expect(checkSources(withTiersFile({ ...sources.tiersFile, ...change }))).toContain(`${FILE}: ${problem}`);
      });
    });

    it('should report a tier name that cannot be written as a key token', () => {
      const problems = checkSources({ ...sources, tiers: [...sources.tiers, 'Pro Plus'] });

      expect(problems).toContain('src/featureManifest/tiers.json: tier "Pro Plus" must match /^[a-z][a-z0-9_]*$/');
    });

    it('should refuse a feature id in the "tier" namespace', () => {
      const changed = withEntry(sources, 'xlsx:protection', entry => ({ ...entry, id: 'tier:protection' }));
      const problems = checkSources(changed);

      expect(problems).toEqual([expect.stringContaining('the "tier" namespace is reserved for tier tokens')]);
    });

    it('should let a recorded id keep its name after its module is renamed', () => {
      // One module has one entry, so a renamed plugin keeps the id that keys already carry.
      const renamed = withEntry(sources, 'feat:search', entry => ({ ...entry, id: 'feat:find' }));

      expect(checkSources({ ...renamed, released: { ...renamed.released, 'feat:find': ['token'] } })).toEqual([]);
      expect(checkSources(renamed)).toEqual([expect.stringContaining('must be "feat:search", made from "module"')]);
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

    it('should record every tier as its key token', () => {
      sources.tiers.forEach((tier) => {
        expect([tier, sources.released[`tier:${tier}`]]).toEqual([tier, ['tier']]);
      });
    });

    it('should refuse to remove or rename a released tier, in every source file at once', () => {
      const [first, ...rest] = sources.tiers;
      const rename = tiers => tiers.map(tier => (tier === first ? 'renamed_tier' : tier));
      const renamed = {
        ...sources,
        tiers: rename(sources.tiers),
        tiersFile: { ...sources.tiersFile, tiers: rename(sources.tiers) },
        files: sources.files.map(file => ({
          ...file,
          data: {
            ...file.data,
            capabilities: file.data.capabilities
              .map(entry => (Array.isArray(entry.tiers) ? { ...entry, tiers: rename(entry.tiers) } : entry)),
          },
        })),
      };

      // The sources agree with each other, so only the record can tell that keys already name the old tier.
      expect(checkSources(renamed)).toEqual([]);
      expect(checkReleased(renamed)).toEqual([expect.stringContaining(`"tier:${first}" was released as a tier`)]);
      expect(checkReleased({ ...sources, tiers: rest })).toEqual([
        expect.stringContaining(`"tier:${first}" was released as a tier`),
      ]);
      expect(checkReleased({ ...sources, tiers: [...sources.tiers, 'added_tier'] })).toEqual([]);
    });

    it('should refuse a tier line of the record that lists anything but "tier"', () => {
      const [first] = sources.tiers;

      expect(checkReleased({ ...sources, released: { ...sources.released, [`tier:${first}`]: ['token'] } }))
        .toEqual([expect.stringContaining(`"tier:${first}" is a tier, so it must list "tier" and nothing else`)]);
    });

    it('should let an id recorded as core be sold in a tier', () => {
      expect(sources.released['cell:text']).toEqual(['core', 'token']);
      expect(checkReleased(sources)).toEqual([]);
    });

    it('should record every stable id and never drop a record', () => {
      const changed = withEntry(sources, 'renderer:html', () => null);
      const released = JSON.parse(buildCommittedOutputs(changed).find(({ file }) => file === RELEASED_FILE).content);

      expect(released['renderer:html']).toEqual(['none']);
      expect(Object.keys(released)).toEqual(expect.arrayContaining([...byId.keys()]));
    });

    it('should refuse to put a released id back to planned', () => {
      const changed = withEntry(sources, 'xlsx:protection', entry => ({ ...entry, status: 'planned' }));

      expect(checkReleased(changed)).toEqual(['"xlsx:protection" was released, so it cannot go back to "planned"']);
    });

    it('should name the way to drop an id that never reached the base branch', () => {
      const changed = withEntry(sources, 'feat:search', () => null);

      expect(checkReleased(changed)).toEqual([expect.stringContaining(`delete its line from ${RELEASED_FILE}`)]);
    });

    it('should refuse a record that does not list licensing values', () => {
      const changed = { ...sources, released: { ...sources.released, 'feat:search': 'token' } };

      expect(checkReleased(changed)).toEqual([`${RELEASED_FILE}: "feat:search" must list the licensing values it has ` +
        'had (core, token, none)']);
    });

    it('should read a record reformatted by hand as stale', () => {
      expect(findStaleOutputs({ ...sources, releasedText: JSON.stringify(sources.released) }))
        .toEqual([RELEASED_FILE]);
    });
  });

  describe('the xlsx license module', () => {
    // A `report` gate lists the feature and never turns it off, so the runtime gates read only the other two.
    const xlsxTokens = listEntries(sources)
      .filter(({ file, entry }) => file === 'src/utils/xlsxEngine/features.json' && entry.licensing === 'token' &&
        ['call', 'degrade'].includes(entry.gate))
      .map(({ entry }) => entry);

    it('should list exactly the gated "token" xlsx ids, in features.json order', () => {
      expect(XLSX_CAPABILITY_IDS).toEqual(xlsxTokens.map(entry => entry.id));
      expect(XLSX_CAPABILITY_IDS).toEqual([
        'xlsx:import', 'xlsx:export', 'xlsx:formulas', 'xlsx:layout', 'xlsx:number_formats', 'xlsx:comments',
        'xlsx:styles', 'xlsx:conditional_formatting', 'xlsx:data_validation', 'xlsx:protection',
      ]);
      // The import report is sold with `gate: "report"`: it is always produced, so no gate reads it.
      expect(XLSX_CAPABILITY_IDS).not.toContain('xlsx:import_report');
      expect(Object.isFrozen(XLSX_CAPABILITY_IDS)).toBe(true);
    });

    it('should give each plugin the token ids whose "plugins" name it', () => {
      const tokensOf = plugin => xlsxTokens.filter(entry => entry.plugins.includes(plugin)).map(entry => entry.id);

      expect(IMPORT_FILE_CAPABILITY_IDS).toEqual(tokensOf('ImportFile'));
      expect(EXPORT_FILE_CAPABILITY_IDS).toEqual(tokensOf('ExportFile'));
      // The import always reads number formats to infer cell types, so it never gates them.
      expect(IMPORT_FILE_CAPABILITY_IDS).not.toContain('xlsx:number_formats');
      expect(IMPORT_FILE_CAPABILITY_IDS).not.toContain('xlsx:export');
      expect(EXPORT_FILE_CAPABILITY_IDS).not.toContain('xlsx:import');
      expect(Object.isFrozen(IMPORT_FILE_CAPABILITY_IDS)).toBe(true);
      expect(Object.isFrozen(EXPORT_FILE_CAPABILITY_IDS)).toBe(true);
    });

    it('should name each token\'s flag in camelCase after its suffix', () => {
      expect(Object.keys(XLSX_FLAG_BY_ID)).toEqual(XLSX_CAPABILITY_IDS);
      expect(XLSX_FLAG_BY_ID['xlsx:import']).toBe('import');
      expect(XLSX_FLAG_BY_ID['xlsx:number_formats']).toBe('numberFormats');
      expect(XLSX_FLAG_BY_ID['xlsx:conditional_formatting']).toBe('conditionalFormatting');
      expect(XLSX_FLAG_BY_ID['xlsx:data_validation']).toBe('dataValidation');
      Object.values(XLSX_FLAG_BY_ID).forEach(flag => expect(flag).toMatch(/^[a-z][a-zA-Z0-9]*$/));
      expect(Object.isFrozen(XLSX_FLAG_BY_ID)).toBe(true);
    });

    it('should render from the sources, not from a fixed list', () => {
      const changed = withEntry(sources, 'xlsx:protection', entry => ({ ...entry, gate: 'report' }));
      const content = renderXlsxLicenseModule(changed);

      expect(content).not.toContain('\'xlsx:protection\'');
      expect(content).toContain('\'xlsx:styles\': \'styles\',');
      expect(renderXlsxLicenseModule(sources)).toBe(readPackageFile(XLSX_LICENSE_MODULE_FILE));
    });

    it('should read the module as stale when its content changes or it is missing', () => {
      expect(findStaleOutputs({ ...sources, xlsxLicenseModuleText: `${sources.xlsxLicenseModuleText}// edit\n` }))
        .toEqual([XLSX_LICENSE_MODULE_FILE]);
      expect(findStaleOutputs({ ...sources, xlsxLicenseModuleText: null })).toEqual([XLSX_LICENSE_MODULE_FILE]);
    });
  });

  describe('the license tiers matrix', () => {
    // The XLSX sub-features share names with plugins (Comments, Formulas), and the cell types read like plugins or
    // the product (Checkbox, Handsontable), so the matrix prefixes both.
    const rowNameOf = (entry) => {
      if (entry.kind === 'cell_type') {
        return `Cell type: ${entry.name}`;
      }

      return entry.id.startsWith('xlsx:') && !entry.name.startsWith('XLSX') ? `XLSX: ${entry.name}` : entry.name;
    };
    const rowOf = (name, cells) => `| ${name} | ${cells.join(' | ')} |`;

    it('should render one matrix row per sold feature and one column per tier', () => {
      const lines = renderTierMatrix(sources).trim().split('\n');
      const sold = [...byId.values()].filter(entry => entry.licensing === 'token');

      const titles = sources.tiers.map(tier => tier[0].toUpperCase() + tier.slice(1));

      expect(lines[0]).toBe(`| Feature | ${titles.join(' | ')} |`);
      // Header, separator, then one row per sold feature.
      expect(lines).toHaveLength(sold.length + 2);
      sold.forEach((entry) => {
        const row = lines.find(line => line.startsWith(`| ${rowNameOf(entry)} |`));

        expect({ id: entry.id, cells: row.split('|').slice(2, -1).map(cell => cell.trim()) })
          .toEqual({ id: entry.id, cells: sources.tiers.map(tier => (entry.tiers.includes(tier) ? 'Yes' : 'No')) });
      });
    });

    it('should give every row a name of its own and name no feature id', () => {
      const names = renderTierMatrix(sources).trim().split('\n').slice(2).map(line => line.split('|')[1].trim());

      expect(new Set(names).size).toBe(names.length);
      expect(names.filter(name => byId.has(name) || /^[a-z]+:/.test(name))).toEqual([]);
    });

    it('should label every cell type row as a cell type, so it does not read as a plugin or the product', () => {
      const names = renderTierMatrix(sources).trim().split('\n').slice(2).map(line => line.split('|')[1].trim());
      const cellTypes = [...byId.values()].filter(entry => entry.kind === 'cell_type' && entry.licensing === 'token');

      expect(cellTypes.length).toBeGreaterThan(0);
      cellTypes.forEach(entry => expect(names).toContain(`Cell type: ${entry.name}`));
      expect(names.filter(name => name.startsWith('Cell type: '))).toHaveLength(cellTypes.length);
      expect(names).not.toContain('Handsontable');
    });

    it('should follow a tier assignment changed in a source, with no code change', () => {
      const changed = withEntry(withTier(sources, 'alpha', []), 'feat:filters',
        entry => ({ ...entry, tiers: ['alpha'] }));
      const lines = renderTierMatrix(changed).split('\n');

      expect(lines[0]).toBe(`| Feature | ${[...sources.tiers, 'alpha']
        .map(tier => tier[0].toUpperCase() + tier.slice(1)).join(' | ')} |`);
      expect(lines).toContain(rowOf('Filters', [...sources.tiers.map(() => 'No'), 'Yes']));
      // The plugin's generated LICENSE carries its tiers too, and the record of released ids lists the new tier.
      expect(findStaleOutputs(changed))
        .toEqual(['src/plugins/filters/feature.generated.ts', RELEASED_FILE, LICENSE_GUIDE_FILE]);
    });

    it('should read the guide as stale when the block is edited, and keep the text around it', () => {
      const row = rowOf('Filters',
        sources.tiers.map(tier => (entryOf('feat:filters').tiers.includes(tier) ? 'Yes' : 'No')));
      const edited = sources.licenseGuideText.replace(row, rowOf('Filters', sources.tiers.map(() => 'No')));
      const output = buildCommittedOutputs(sources).find(({ file }) => file === LICENSE_GUIDE_FILE);

      expect(edited).not.toBe(sources.licenseGuideText);
      expect(findStaleOutputs({ ...sources, licenseGuideText: edited })).toEqual([LICENSE_GUIDE_FILE]);
      expect(output.content.startsWith(sources.licenseGuideText.split('<!-- license-tiers:start -->')[0]))
        .toBe(true);
      expect(output.content.endsWith(sources.licenseGuideText.split('<!-- license-tiers:end -->')[1])).toBe(true);
    });

    it('should refuse a guide without the markers', () => {
      const withoutMarkers = sources.licenseGuideText.replace('<!-- license-tiers:end -->', '');

      expect(() => buildCommittedOutputs({ ...sources, licenseGuideText: withoutMarkers }))
        .toThrow('license-tiers:end');
    });

    it('should refuse a guide without the start marker, and one whose end marker comes first', () => {
      const [before, rest] = sources.licenseGuideText.split('<!-- license-tiers:start -->');
      const [block, after] = rest.split('<!-- license-tiers:end -->');
      const build = licenseGuideText => () => buildCommittedOutputs({ ...sources, licenseGuideText });

      expect(build(`${before}${block}<!-- license-tiers:end -->${after}`)).toThrow('license-tiers:start');
      expect(build(`${before}<!-- license-tiers:end -->${block}<!-- license-tiers:start -->${after}`))
        .toThrow('license-tiers:start');
    });

    it('should name the guide file when it is missing, not ask for its markers', () => {
      const build = () => buildCommittedOutputs({ ...sources, licenseGuideText: null });

      expect(build).toThrow(`${LICENSE_GUIDE_FILE} is missing`);
      expect(build).not.toThrow('license-tiers:end');
    });

    it('should leave the guide out in a checkout without the docs directory, and never report it stale there', () => {
      const withoutDocs = { ...sources, hasDocs: false, licenseGuideText: null };

      expect(sources.hasDocs).toBe(true);
      expect(buildCommittedOutputs(withoutDocs).map(({ file }) => file)).not.toContain(LICENSE_GUIDE_FILE);
      expect(findStaleOutputs(withoutDocs)).toEqual([]);
    });
  });

  describe('checkRecordAgainstBase()', () => {
    const record = sources.released;

    it('should accept a record that keeps everything the base recorded', () => {
      expect(checkRecordAgainstBase({}, record)).toEqual([]);
      expect(checkRecordAgainstBase(record, record)).toEqual([]);
      expect(checkRecordAgainstBase(record, { ...record, 'feat:new_feature': ['token'] })).toEqual([]);
    });

    it('should refuse a record that drops an id the base recorded', () => {
      const { 'feat:search': removed, ...current } = record;

      expect(removed).toEqual(['token']);
      expect(checkRecordAgainstBase(record, current)).toEqual([
        `"feat:search" is in the base branch's ${RELEASED_FILE}, so it must stay in it`,
      ]);
    });

    it('should refuse a record that drops a tier the base recorded', () => {
      const [first] = sources.tiers;
      const { [`tier:${first}`]: removed, ...current } = record;

      expect(removed).toEqual(['tier']);
      expect(checkRecordAgainstBase(record, current)).toEqual([
        `"tier:${first}" is in the base branch's ${RELEASED_FILE}, so it must stay in it`,
      ]);
    });

    it('should refuse a record that loses a value the base recorded', () => {
      const base = { ...record, 'xlsx:protection': ['core', 'token'] };

      expect(checkRecordAgainstBase(base, record)).toEqual([
        '"xlsx:protection" was recorded as "core" on the base branch, and a record never loses a value',
      ]);
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
        schemaVersion: 2,
        product: 'handsontable',
        version: '19.0.0',
      });
      expect(Object.keys(manifest)).toEqual([
        'schemaVersion', 'product', 'version', 'tokenRule', 'tiers', 'capabilities',
      ]);
      expect(new RegExp(manifest.tokenRule).test('xlsx:conditional_formatting')).toBe(true);
      expect(manifest.capabilities).toHaveLength(byId.size);
      manifest.capabilities.forEach((capability) => {
        expect(Object.keys(capability)).toEqual([
          'id', 'kind', 'module', 'plugins', 'name', 'description', 'since', 'status', 'licensing', 'gate',
          'requires', 'enforceAtInit', 'packages', 'tiers',
        ]);
      });
    });

    it('should publish the tier names and the tiers of every capability', () => {
      const manifest = buildManifest(sources, '19.0.0');

      expect(manifest.schemaVersion).toBe(2);
      expect(manifest.tiers).toEqual(sources.tiers);
      manifest.capabilities.forEach((capability) => {
        expect({ id: capability.id, tiers: capability.tiers })
          .toEqual({ id: capability.id, tiers: entryOf(capability.id).tiers ?? [] });
        expect(capability.tiers.length > 0).toBe(capability.licensing === 'token');
      });
    });

    it('should give every sold plugin its tiers in the generated LICENSE', () => {
      listEntries(sources)
        .filter(({ entry }) => entry.kind === 'plugin' && entry.licensing === 'token')
        .forEach(({ entry, folder }) => {
          // eslint-disable-next-line global-require, import/no-dynamic-require
          const { LICENSE } = require(`../../src/plugins/${folder}/feature.generated`);

          expect({ id: entry.id, tiers: [...LICENSE.tiers] }).toEqual({ id: entry.id, tiers: entry.tiers });
        });
    });

    it('should publish no key flag and render no implies into a plugin LICENSE', () => {
      expect(buildManifest(sources, '19.0.0')).not.toHaveProperty('keyFlag');
      buildCommittedOutputs(sources)
        .filter(({ file }) => file.endsWith('feature.generated.ts'))
        .forEach(({ file, content }) => expect({ file, hasImplies: content.includes('implies') })
          .toEqual({ file, hasImplies: false }));
    });

    it('should give every xlsx id its tiers', () => {
      expect(Object.keys(XLSX_TIERS_BY_ID)).toEqual([...XLSX_CAPABILITY_IDS]);
      XLSX_CAPABILITY_IDS.forEach((id) => {
        expect({ id, tiers: [...XLSX_TIERS_BY_ID[id]] }).toEqual({ id, tiers: entryOf(id).tiers });
      });
    });
  });
});
