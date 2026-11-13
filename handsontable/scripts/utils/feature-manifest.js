/**
 * The feature manifest - loader, checks, and builders.
 *
 * Every Handsontable feature a license key can name, and every module a feature needs, is described in a
 * small JSON file next to its code: `feature.json` in each plugin folder, one `features.json` in each
 * registry folder (`cellTypes`, `editors`, `renderers`, `validators`), one for the XLSX sub-features in
 * `utils/xlsxEngine`, and `featureManifest/core.json`. This module reads them, checks them against the
 * source, and builds what is made from them:
 *   - `dist/manifest.json`, published with every release (the license portal reads it for the tiers of each
 *     feature);
 *   - the committed `feature.generated.ts` modules the plugins read their `PLUGIN_DEPS` and `LICENSE` from;
 *   - the committed `utils/xlsxEngine/licenseCapabilities.generated.ts`, the XLSX token lists the license check reads;
 *   - the committed `featureManifest/released-tokens.json`, which keeps ids from being removed or sold later;
 *   - the feature-to-tier matrix between the `license-tiers` markers of the license key guide in `docs/`.
 *
 * CommonJS on purpose, like `option-levels.js`: the CLI (`scripts/generate-feature-manifest.mjs`) imports it as
 * ESM and the Jest tests import it through Babel. The rules it enforces are documented in
 * `src/featureManifest/AGENTS.md`.
 */
const { existsSync, readdirSync, readFileSync } = require('fs');
const { join } = require('path');

/**
 * The license-key rule for a capability token (`CAPABILITY_TOKEN` in the `license-key` package). Its generator
 * refuses any other shape, so an id that fails it could never be issued in a key.
 */
const TOKEN_RULE = /^[a-z][a-z0-9_]*(?::[a-z0-9_]+(?:\.[a-z0-9_]+)*)?$/;

/**
 * The format version of `dist/manifest.json`. A new field or capability keeps it. Removing or renaming a field,
 * changing what a value means, or adding a `kind` or `licensing` value raises it.
 *
 * Version 2: a license key names tiers. Every capability lists its `tiers`, the manifest lists the tier names, and
 * the `keyFlag` and `implies` fields of version 1 are gone.
 */
const SCHEMA_VERSION = 2;

/**
 * The format version of the source files, separate from the published one. Only the generator reads the sources,
 * so raising it rewrites every source file in the same commit.
 */
const SOURCE_SCHEMA_VERSION = 1;
const PRODUCT = 'handsontable';

/**
 * The release that ships the first manifest. An entry without `since` inherits it, so only a feature added
 * later has to declare its own.
 */
const FIRST_RELEASE = '19.0.0';

const KINDS = ['core_area', 'plugin', 'cell_type', 'sub_feature', 'editor', 'renderer', 'validator'];
const LICENSING = ['token', 'none'];

/**
 * The `licensing` values `released-tokens.json` may hold: the current ones, and `core`, which every entry carried
 * that was always granted before tiers replaced it. A record never loses a value, so the old one stays readable.
 */
const RECORDED_LICENSING = ['core', 'token', 'none'];
// What the record of released ids lists for a tier: its key token (`tier:<name>`), with this one value.
const RECORDED_TIER = 'tier';
const TIER_TOKEN_PREFIX = 'tier:';
const STATUSES = ['stable', 'planned'];

/**
 * The gates a sold entry may declare, per kind. `enable`: checked when the plugin turns on. `call`: checked in
 * the plugin's public methods (a plugin that is always on). `degrade`: the sub-feature is left out of the result
 * and reported. `report`: listed in the message, keeps working.
 */
const GATES_BY_KIND = {
  plugin: ['enable', 'call'],
  cell_type: ['report'],
  sub_feature: ['call', 'degrade', 'report'],
  core_area: ['report'],
};

/**
 * The gates the runtime XLSX license check reads. A `report` entry is listed and never turned off, so it stays out
 * of the generated XLSX lists.
 */
const XLSX_CHECKED_GATES = ['call', 'degrade'];

/**
 * The tier names a sold entry may list, and the rule each name must pass: a key carries a tier as the token
 * `tier:<name>`, so the name must keep that token inside the license-key rule. The `tier` namespace is therefore
 * reserved for tier tokens, never a feature id.
 */
const TIERS_FILE = 'src/featureManifest/tiers.json';
const TIER_RULE = /^[a-z][a-z0-9_]*$/;
const TIER_NAMESPACE = 'tier';

/**
 * The registries a manifest entry can describe, with the folder they live in and the constant that names a
 * module in its source. `skip` lists the folders that hold no registered module, with the reason.
 */
const REGISTRIES = [
  {
    kind: 'plugin',
    namespace: 'feat',
    depType: 'plugin',
    dir: 'src/plugins',
    constant: 'PLUGIN_KEY',
    skip: { base: 'the class every plugin extends, not a plugin' },
  },
  {
    kind: 'cell_type',
    namespace: 'cell',
    depType: 'cell-type',
    dir: 'src/cellTypes',
    constant: 'CELL_TYPE',
    skip: {},
  },
  {
    kind: 'editor',
    namespace: 'editor',
    depType: 'editor',
    dir: 'src/editors',
    constant: 'EDITOR_TYPE',
    skip: { utils: 'helpers shared by the editors' },
  },
  {
    kind: 'renderer',
    namespace: 'renderer',
    depType: 'renderer',
    dir: 'src/renderers',
    constant: 'RENDERER_TYPE',
    skip: {},
  },
  {
    kind: 'validator',
    namespace: 'validator',
    depType: 'validator',
    dir: 'src/validators',
    constant: 'VALIDATOR_TYPE',
    skip: {
      maxLengthValidator: 'composed by `getCellValidator()` from the `maxLength` option, never registered',
      regExpValidator: 'the wrapper for a `RegExp` given as `validator`, never registered',
    },
  },
];

/**
 * The XLSX sub-features' source, and the module the runtime license check reads their token lists from.
 */
const XLSX_SOURCE_FILE = 'src/utils/xlsxEngine/features.json';
const XLSX_LICENSE_MODULE_FILE = 'src/utils/xlsxEngine/licenseCapabilities.generated.ts';
const XLSX_PLUGINS = { importFile: 'ImportFile', exportFile: 'ExportFile' };

/**
 * The files that hold the entries of one kind, other than the plugin folders.
 */
const SHARED_SOURCES = [
  { file: 'src/featureManifest/core.json', kind: 'core_area' },
  { file: 'src/cellTypes/features.json', kind: 'cell_type' },
  { file: 'src/editors/features.json', kind: 'editor' },
  { file: 'src/renderers/features.json', kind: 'renderer' },
  { file: 'src/validators/features.json', kind: 'validator' },
  { file: XLSX_SOURCE_FILE, kind: 'sub_feature' },
];

const PLUGIN_SOURCE_NAME = 'feature.json';
const GENERATED_MODULE_NAME = 'feature.generated.ts';

/**
 * The record of released ids: each stable id with every `licensing` value it has had, sorted. It only grows,
 * and CI compares it with the base branch's copy, so an id counts as released once it is merged.
 */
const RELEASED_FILE = 'src/featureManifest/released-tokens.json';
const OUTPUT_FILE = 'dist/manifest.json';

/**
 * The license key guide, relative to `handsontable/`, and the markers around the feature-to-tier matrix it holds.
 * Everything between the markers is generated; the rest of the page is hand-written.
 */
const DOCS_DIR = '../docs';
const LICENSE_GUIDE_FILE = `${DOCS_DIR}/content/guides/getting-started/license-key/license-key.md`;
const TIER_MATRIX_START = '<!-- license-tiers:start -->';
const TIER_MATRIX_END = '<!-- license-tiers:end -->';

/**
 * Plugins that stay out of keys (D7): both are `@private`, have no option, and turn on by themselves on touch
 * devices, so a token would quietly break mobile scrolling and selection on a restricted key.
 */
const UNSOLD_PLUGINS = ['TouchScroll', 'MultipleSelectionHandles'];

const ENTRY_FIELDS = [
  'id', 'kind', 'module', 'plugins', 'name', 'description', 'since', 'status', 'licensing', 'gate', 'tiers',
  'requires', 'enforceAtInit', 'packages',
];
const REGISTRY_KINDS = REGISTRIES.map(registry => registry.kind);

/**
 * Turns a registered name into the part of an id after the namespace: `DropdownMenu` and `dropdownMenu` give
 * `dropdown_menu`, `intl-date` gives `intl_date`.
 *
 * @param {string} module The registered name.
 * @returns {string}
 */
function toIdName(module) {
  return module
    .replace(/^[A-Z]/, letter => letter.toLowerCase())
    .replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    .replace(/-/g, '_');
}

/**
 * Upper-cases the first letter, the way the plugin registry names a plugin after its `PLUGIN_KEY`.
 *
 * @param {string} value The plugin key.
 * @returns {string}
 */
function toPluginName(value) {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

/**
 * Reads the module name a registry folder declares in its source.
 *
 * @param {string} packageDir The `handsontable/` directory.
 * @param {object} registry An entry of `REGISTRIES`.
 * @param {string} folder The folder name.
 * @returns {string|null} The module name, or `null` when the source declares none.
 */
function readModuleName(packageDir, registry, folder) {
  const pattern = new RegExp(`export const ${registry.constant}(?:\\s*:\\s*'[^']*')?\\s*=\\s*'([^']+)'`);
  const candidates = [`${folder}.ts`, 'constants.ts'].map(fileName => join(packageDir, registry.dir, folder, fileName));

  for (const file of candidates) {
    const name = existsSync(file) ? readFileSync(file, 'utf8').match(pattern)?.[1] : undefined;

    if (name !== undefined) {
      return registry.kind === 'plugin' ? toPluginName(name) : name;
    }
  }

  return null;
}

/**
 * Lists the folders of every registry with the module each one declares.
 *
 * @param {string} packageDir The `handsontable/` directory.
 * @returns {Array<{kind: string, folder: string, module: string|null}>}
 */
function scanRegistries(packageDir) {
  return REGISTRIES.flatMap(registry => readdirSync(join(packageDir, registry.dir), { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('__') && !(entry.name in registry.skip))
    .map(entry => entry.name)
    .sort()
    .map(folder => ({ kind: registry.kind, folder, module: readModuleName(packageDir, registry, folder) })));
}

/**
 * Reads one source file. A file that is not valid JSON throws, naming the file.
 *
 * @param {string} packageDir The `handsontable/` directory.
 * @param {string} file The file, relative to `packageDir`.
 * @returns {object|null} The parsed file, or `null` when it does not exist.
 */
function readSourceFile(packageDir, file) {
  const path = join(packageDir, file);

  if (!existsSync(path)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(path, 'utf8'));

  } catch (error) {
    throw new Error(`${file} is not valid JSON: ${error.message}`);
  }
}

/**
 * Reads every manifest source, the registry folders, the committed outputs, and the released ids.
 *
 * @param {string} packageDir The `handsontable/` directory.
 * @returns {object} The sources, as `checkSources()` and the builders take them.
 */
function loadSources(packageDir) {
  const modules = scanRegistries(packageDir);
  const pluginFolders = modules.filter(module => module.kind === 'plugin');
  const files = [
    ...SHARED_SOURCES.map(source => ({ ...source, folder: null })),
    ...pluginFolders.map(({ folder }) => ({
      file: `src/plugins/${folder}/${PLUGIN_SOURCE_NAME}`,
      kind: 'plugin',
      folder,
    })),
  ].map(source => ({ ...source, data: readSourceFile(packageDir, source.file) }));
  const generatedModules = pluginFolders
    .map(({ folder }) => `src/plugins/${folder}/${GENERATED_MODULE_NAME}`)
    .filter(file => existsSync(join(packageDir, file)))
    .map(file => ({ file, content: readFileSync(join(packageDir, file), 'utf8') }));

  const readText = (file) => {
    const path = join(packageDir, file);

    return existsSync(path) ? readFileSync(path, 'utf8') : null;
  };
  const tiersFile = readSourceFile(packageDir, TIERS_FILE);

  return {
    files,
    modules,
    generatedModules,
    // The checks read the names from `tiers`, and the file's own shape from `tiersFile`.
    tiersFile,
    tiers: tiersFile?.tiers,
    released: readSourceFile(packageDir, RELEASED_FILE) ?? {},
    releasedText: readText(RELEASED_FILE),
    xlsxLicenseModuleText: readText(XLSX_LICENSE_MODULE_FILE),
    licenseGuideText: readText(LICENSE_GUIDE_FILE),
    // Whether the checkout holds the docs site at all: without it the license key guide is not generated.
    hasDocs: existsSync(join(packageDir, DOCS_DIR)),
  };
}

/**
 * Lists every entry of the sources with the file it came from.
 *
 * @param {object} sources What `loadSources()` returns.
 * @returns {Array<{file: string, folder: string|null, entry: object}>}
 */
function listEntries(sources) {
  return sources.files.flatMap(({ file, folder, data }) => (Array.isArray(data?.capabilities) ?
    data.capabilities.map(entry => ({ file, folder, entry })) : []));
}

/**
 * Indexes the entries by id. The first entry wins when an id repeats; `checkSources()` reports the repeat.
 *
 * @param {object} sources What `loadSources()` returns.
 * @returns {Map<string, object>}
 */
function indexEntries(sources) {
  const byId = new Map();

  listEntries(sources).forEach(({ entry }) => {
    if (typeof entry?.id === 'string' && !byId.has(entry.id)) {
      byId.set(entry.id, entry);
    }
  });

  return byId;
}

/**
 * The licensing an entry must declare, by the rule decided for the manifest (D7): every feature is sold in a tier,
 * and only the building blocks (editors, renderers, validators) and the two unsold plugins stay out of keys.
 *
 * @param {object} entry A manifest entry.
 * @returns {string}
 */
function expectedLicensing(entry) {
  switch (entry.kind) {
    case 'plugin':
      return UNSOLD_PLUGINS.includes(entry.module) ? 'none' : 'token';
    case 'cell_type':
    case 'core_area':
    case 'sub_feature':
      return 'token';
    default:
      return 'none';
  }
}

/**
 * Tells whether a value is an array of distinct non-empty strings.
 *
 * @param {*} value The value.
 * @returns {boolean}
 */
function isStringList(value) {
  return Array.isArray(value) && value.every(item => typeof item === 'string' && item !== '') &&
    new Set(value).size === value.length;
}

/**
 * Lists the ids an entry requires, `allOf` first.
 *
 * @param {object} entry A manifest entry.
 * @returns {string[]}
 */
function requiredIds(entry) {
  return [...(entry.requires?.allOf ?? []), ...(entry.requires?.anyOf ?? [])];
}

/**
 * Checks the shape of one source file.
 *
 * @param {object} source A file of `loadSources()`.
 * @param {string} source.file The file, relative to `handsontable/`.
 * @param {object|null} source.data The parsed file, `null` when it does not exist.
 * @returns {string[]} The problems.
 */
function checkFileShape({ file, data }) {
  if (data === null) {
    return [`${file}: the file is missing`];
  }

  const problems = Object.keys(data)
    .filter(key => key !== 'schemaVersion' && key !== 'capabilities')
    .map(key => `${file}: unknown top-level key "${key}"`);

  if (data.schemaVersion !== SOURCE_SCHEMA_VERSION) {
    const found = JSON.stringify(data.schemaVersion);

    problems.push(`${file}: "schemaVersion" must be ${SOURCE_SCHEMA_VERSION}, found ${found}`);
  }

  if (!Array.isArray(data.capabilities) || data.capabilities.length === 0) {
    problems.push(`${file}: "capabilities" must be a non-empty array`);
  }

  return problems;
}

/**
 * Checks the fields of one entry that need no other entry to judge.
 *
 * @param {object} entry A manifest entry.
 * @param {string} kind The kind the file holds.
 * @returns {string[]} The problems, without the file name.
 */
function checkEntryFields(entry, kind) {
  const problems = Object.keys(entry)
    .filter(key => !ENTRY_FIELDS.includes(key))
    .map(key => `unknown field "${key}"`);
  const textFields = ['id', 'name', 'description'].filter(key => typeof entry[key] !== 'string' || entry[key] === '');

  problems.push(...textFields.map(key => `"${key}" must be a non-empty string`));

  if (entry.kind !== kind) {
    problems.push(`"kind" must be "${kind}" in this file`);
  }
  if (!STATUSES.includes(entry.status)) {
    problems.push(`"status" must be one of ${STATUSES.join(', ')}`);
  }
  if (entry.since !== undefined && !/^\d+\.\d+\.\d+$/.test(entry.since)) {
    problems.push('"since" must be a version such as "19.1.0"');
  }

  return problems;
}

/**
 * Checks the id of one entry: the key-token rule, the namespace of its kind, and the reserved names.
 *
 * @param {object} entry A manifest entry.
 * @param {Set<string>} recorded The ids `released-tokens.json` holds.
 * @returns {string[]} The problems, without the file name.
 */
function checkId(entry, recorded) {
  if (typeof entry.id !== 'string') {
    return [];
  }

  const problems = [];
  const [namespace, name] = entry.id.includes(':') ? entry.id.split(':') : [null, entry.id];
  const registry = REGISTRIES.find(item => item.kind === entry.kind);

  if (!TOKEN_RULE.test(entry.id)) {
    problems.push(`id "${entry.id}" fails the license-key token rule ${TOKEN_RULE}`);
  }
  if (name === 'all') {
    // Keys issued before tiers can carry `<namespace>:all`. The library ignores that token now, but a feature with
    // that id would collide with what those keys hold, so the name stays reserved.
    problems.push(`id "${entry.id}" is reserved: keys issued before tiers used "<namespace>:all"`);
  }
  if (namespace === TIER_NAMESPACE) {
    problems.push(`id "${entry.id}" is reserved: the "${TIER_NAMESPACE}" namespace is reserved for tier tokens`);
  }
  if (registry && namespace !== registry.namespace) {
    problems.push(`id "${entry.id}" must start with "${registry.namespace}:"`);

  } else if (registry && typeof entry.module === 'string' && TOKEN_RULE.test(entry.id) && !recorded.has(entry.id) &&
      entry.id !== `${registry.namespace}:${toIdName(entry.module)}`) {
    // An id is permanent once recorded, so a typo in it is too. A recorded id keeps its name when its module is
    // renamed: one module has one entry, so the old id could not stay next to a new one.
    problems.push(`id "${entry.id}" must be "${registry.namespace}:${toIdName(entry.module)}", made from "module"`);
  }
  if (entry.kind === 'sub_feature' && (namespace === null || REGISTRIES.some(item => item.namespace === namespace))) {
    problems.push(`id "${entry.id}" needs a namespace of its own: a sub-feature cannot use none or a registry one`);
  }
  if (entry.kind === 'core_area' && namespace !== null) {
    problems.push(`id "${entry.id}" of a core area takes no namespace`);
  }

  return problems;
}

/**
 * Checks `licensing` and `gate` against the rule for the entry's kind.
 *
 * @param {object} entry A manifest entry.
 * @returns {string[]} The problems, without the file name.
 */
function checkLicensing(entry) {
  const problems = [];
  const expected = expectedLicensing(entry);
  const gates = GATES_BY_KIND[entry.kind] ?? [];

  if (!LICENSING.includes(entry.licensing)) {
    problems.push(`"licensing" must be one of ${LICENSING.join(', ')}`);

  } else if (entry.licensing !== expected) {
    problems.push(`"licensing" must be "${expected}" for this ${entry.kind} (see src/featureManifest/AGENTS.md)`);
  }

  if (entry.licensing === 'token' && !gates.includes(entry.gate)) {
    problems.push(`"gate" must be one of ${gates.join(', ')} for a sold ${entry.kind}`);
  }
  if (entry.licensing !== 'token' && entry.gate !== undefined) {
    problems.push('"gate" is only for a sold entry ("licensing": "token")');
  }

  return problems;
}

/**
 * Checks the fields that only some kinds may carry.
 *
 * @param {object} entry A manifest entry.
 * @param {Set<string>} pluginModules The plugin names the registry scan found.
 * @returns {string[]} The problems, without the file name.
 */
function checkKindFields(entry, pluginModules) {
  const problems = [];
  const isRegistryKind = REGISTRY_KINDS.includes(entry.kind);

  if (isRegistryKind !== (typeof entry.module === 'string')) {
    problems.push(isRegistryKind ?
      '"module" must name the registered module' : '"module" is only for a registry entry');
  }
  if (entry.kind === 'sub_feature') {
    const unknown = isStringList(entry.plugins) ? entry.plugins.filter(name => !pluginModules.has(name)) : null;

    if (unknown === null || entry.plugins.length === 0) {
      problems.push('"plugins" must list the plugins the sub-feature changes');

    } else if (unknown.length > 0) {
      problems.push(`"plugins" names unknown plugins: ${unknown.join(', ')}`);
    }

  } else if (entry.plugins !== undefined) {
    problems.push('"plugins" is only for a sub-feature');
  }

  if (entry.enforceAtInit !== undefined && (entry.kind !== 'plugin' || typeof entry.enforceAtInit !== 'boolean')) {
    problems.push('"enforceAtInit" is a boolean, and only for a plugin');

  } else if (entry.enforceAtInit === true &&
      !(isStringList(entry.requires?.allOf) && entry.requires.allOf.length > 0)) {
    problems.push('"enforceAtInit" needs a non-empty "requires.allOf": that list is what PLUGIN_DEPS checks');
  }

  return problems;
}

/**
 * Checks `requires` and `packages` of one entry against the other entries.
 *
 * @param {object} entry A manifest entry.
 * @param {Map<string, object>} byId Every entry, by id.
 * @returns {string[]} The problems, without the file name.
 */
function checkReferences(entry, byId) {
  const problems = [];
  const { requires } = entry;

  if (requires !== undefined) {
    const keys = requires !== null && typeof requires === 'object' ? Object.keys(requires) : null;

    if (keys === null || keys.some(key => key !== 'allOf' && key !== 'anyOf') ||
        keys.some(key => !isStringList(requires[key]))) {
      problems.push('"requires" takes "allOf" and "anyOf", each a list of distinct ids');
    }
  }
  if (entry.packages !== undefined && !isStringList(entry.packages)) {
    problems.push('"packages" must be a list of distinct strings');
  }

  const referenced = [...(isStringList(requires?.allOf) ? requires.allOf : []),
    ...(isStringList(requires?.anyOf) ? requires.anyOf : [])];

  referenced.forEach((id) => {
    if (id === entry.id) {
      problems.push(`"${id}" refers to itself`);

    } else if (!byId.has(id)) {
      problems.push(`refers to "${id}", which no manifest file declares`);
    }
  });

  return problems;
}

/**
 * Checks what an entry requires against the entries it names: a stable entry names no planned one, and an
 * `enforceAtInit` entry names only what `PLUGIN_DEPS` can hold.
 *
 * @param {object} entry A manifest entry.
 * @param {Map<string, object>} byId Every entry, by id.
 * @returns {string[]} The problems, without the file name.
 */
function checkRequiredLicensing(entry, byId) {
  const problems = [];
  const direct = requiredIds(entry);

  if (entry.status === 'stable') {
    direct.filter(id => byId.get(id)?.status === 'planned').forEach((id) => {
      problems.push(`a stable entry cannot require "${id}", which is planned and may still be renamed`);
    });
  }
  if (entry.enforceAtInit === true) {
    (entry.requires?.allOf ?? []).filter(id => byId.has(id) && !REGISTRY_KINDS.includes(byId.get(id).kind))
      .forEach((id) => {
        problems.push(`"enforceAtInit" turns "requires.allOf" into PLUGIN_DEPS, which cannot name "${id}"`);
      });
  }

  return problems;
}

/**
 * Lists the problems of a list of tier names that need no other entry to judge: each name listed once.
 *
 * @param {string[]} names The names.
 * @returns {string[]} The problems.
 */
function findRepeatedTiers(names) {
  const repeated = new Set(names.filter((name, index) => names.indexOf(name) !== index));

  return [...repeated].map(name => `tier "${name}" is listed twice`);
}

/**
 * Checks `tiers.json`: the format version, no other key, and a non-empty list of distinct names that each fit
 * the `tier:<name>` key token. The list is read from `sources.tiers`.
 *
 * @param {object} sources What `loadSources()` returns.
 * @returns {string[]} The problems, each naming the file.
 */
function checkTiersFile(sources) {
  const { tiersFile, tiers } = sources;

  if (tiersFile === null || tiersFile === undefined) {
    return [`${TIERS_FILE}: the file is missing`];
  }

  const problems = Object.keys(tiersFile)
    .filter(key => key !== 'schemaVersion' && key !== 'tiers')
    .map(key => `unknown top-level key "${key}"`);

  if (tiersFile.schemaVersion !== SOURCE_SCHEMA_VERSION) {
    problems.push(`"schemaVersion" must be ${SOURCE_SCHEMA_VERSION}, found ${JSON.stringify(tiersFile.schemaVersion)}`);
  }

  if (!Array.isArray(tiers) || tiers.length === 0) {
    problems.push('"tiers" must be a non-empty list of tier names');

  } else {
    tiers.filter(name => typeof name !== 'string' || !TIER_RULE.test(name))
      .forEach(name => problems.push(`tier ${JSON.stringify(name)} must match ${TIER_RULE}`));
    problems.push(...findRepeatedTiers(tiers));
  }

  return problems.map(problem => `${TIERS_FILE}: ${problem}`);
}

/**
 * Tells whether an entry is sold in a tier: a required entry that is not sold (`none`) is needed by no key, and
 * one whose `tiers` is broken is reported on its own, so neither is reported again on the entry that needs it.
 *
 * @param {object} required The required entry.
 * @param {string} tier The tier.
 * @returns {boolean}
 */
function isAvailableInTier(required, tier) {
  return required.licensing !== 'token' || !Array.isArray(required.tiers) || required.tiers.includes(tier);
}

/**
 * Checks that every tier an entry is sold in also sells what the entry needs: every sold entry `requires.allOf`
 * reaches, and at least one member of a non-empty `requires.anyOf`.
 *
 * @param {object} entry A sold manifest entry with a valid `tiers` list.
 * @param {Map<string, object>} byId Every entry, by id.
 * @param {string[]} tiers The entry's tiers that `tiers.json` declares.
 * @returns {string[]} The problems, without the file name.
 */
function checkTierClosure(entry, byId, tiers) {
  const problems = [];
  const implied = computeImplies(entry, byId);
  const anyOf = isStringList(entry.requires?.anyOf) ? entry.requires.anyOf : [];
  const anyOfEntries = anyOf.map(id => byId.get(id)).filter(required => required !== undefined);

  tiers.forEach((tier) => {
    implied.filter(id => !isAvailableInTier(byId.get(id), tier)).forEach((id) => {
      problems.push(`tier "${tier}" includes "${entry.id}" but not "${id}", which it requires`);
    });

    if (anyOfEntries.length > 0 && !anyOfEntries.some(required => isAvailableInTier(required, tier))) {
      problems.push(`tier "${tier}" includes "${entry.id}" but none of ${anyOf.map(id => `"${id}"`).join(', ')}, ` +
        'one of which it requires');
    }
  });

  return problems;
}

/**
 * Checks the `tiers` of one entry: a sold entry lists one or more distinct tiers that `tiers.json` declares, an
 * entry that is not sold lists none, an entry the runtime never switches off lists every tier, and every tier
 * sells what the entry requires.
 *
 * @param {object} entry A manifest entry.
 * @param {Map<string, object>} byId Every entry, by id.
 * @param {string[]} tierNames The names `tiers.json` declares.
 * @returns {string[]} The problems, without the file name.
 */
function checkTiers(entry, byId, tierNames) {
  const { tiers } = entry;

  if (entry.licensing !== 'token') {
    return tiers === undefined ? [] : ['"tiers" is only for sold entries ("licensing": "token")'];
  }
  if (!Array.isArray(tiers) || tiers.length === 0 || tiers.some(name => typeof name !== 'string')) {
    return ['"tiers" must be a non-empty list of tier names'];
  }

  const known = tiers.filter(name => tierNames.includes(name));
  const problems = [
    ...tiers.filter(name => !tierNames.includes(name)).map(name => `unknown tier "${name}"`),
    ...findRepeatedTiers(tiers),
  ];

  // The runtime never switches a `report` entry off (the grid, a cell type, the import report), so the manifest and
  // the guide must not say a tier lacks it.
  if (entry.gate === 'report') {
    problems.push(...tierNames.filter(name => !tiers.includes(name))
      .map(name => `"gate": "report" is never switched off, so "tiers" must list every tier; "${name}" is missing`));
  }

  problems.push(...checkTierClosure(entry, byId, [...new Set(known)]));

  return problems;
}

/**
 * Checks that every registry folder has exactly one entry and every registry entry names a folder.
 *
 * @param {object} sources What `loadSources()` returns.
 * @returns {string[]} The problems.
 */
function checkCompleteness(sources) {
  const problems = [];
  const entries = listEntries(sources);

  sources.modules.forEach(({ kind, folder, module }) => {
    const registry = REGISTRIES.find(item => item.kind === kind);

    if (module === null) {
      problems.push(`${registry.dir}/${folder}: declares no ${registry.constant}; add it, or list the folder in ` +
        'REGISTRIES[].skip with the reason');

      return;
    }

    const found = entries.filter(({ entry }) => entry.kind === kind && entry.module === module);

    if (found.length !== 1) {
      problems.push(`${registry.dir}/${folder}: needs exactly one "${kind}" entry for "${module}", found ` +
        `${found.length}`);

    } else if (kind === 'plugin' && found[0].folder !== folder) {
      problems.push(`${found[0].file}: the entry for "${module}" belongs in ${registry.dir}/${folder}`);
    }
  });

  entries.filter(({ entry }) => REGISTRY_KINDS.includes(entry.kind) && typeof entry.module === 'string')
    .forEach(({ file, entry }) => {
      if (!sources.modules.some(({ kind, module }) => kind === entry.kind && module === entry.module)) {
        problems.push(`${file}: "${entry.id}" names "${entry.module}", which no ${entry.kind} folder declares`);
      }
    });

  return problems;
}

/**
 * Finds a cycle in `requires`, if there is one.
 *
 * @param {Map<string, object>} byId Every entry, by id.
 * @returns {string[]|null} The ids of the first cycle found, its first id repeated at the end.
 */
function findCycle(byId) {
  const state = new Map();
  const stack = [];

  const visit = (id) => {
    if (state.get(id) === 'done' || !byId.has(id)) {
      return null;
    }
    if (state.get(id) === 'open') {
      return [...stack.slice(stack.indexOf(id)), id];
    }

    state.set(id, 'open');
    stack.push(id);

    for (const next of requiredIds(byId.get(id))) {
      const cycle = visit(next);

      if (cycle !== null) {
        return cycle;
      }
    }

    stack.pop();
    state.set(id, 'done');

    return null;
  };

  for (const id of [...byId.keys()].sort()) {
    const cycle = visit(id);

    if (cycle !== null) {
      return cycle;
    }
  }

  return null;
}

/**
 * Checks every source. An empty list means the manifest can be built.
 *
 * @param {object} sources What `loadSources()` returns.
 * @returns {string[]} The problems, each naming the file it is in.
 */
function checkSources(sources) {
  const problems = [...checkTiersFile(sources), ...sources.files.flatMap(checkFileShape)];
  const byId = indexEntries(sources);
  const tierNames = Array.isArray(sources.tiers) ? sources.tiers : [];
  const pluginModules = new Set(sources.modules.filter(({ kind }) => kind === 'plugin').map(({ module }) => module));
  const recorded = new Set(Object.keys(sources.released ?? {}));
  const seen = new Set();

  listEntries(sources).forEach(({ file, entry, folder }) => {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      problems.push(`${file}: every capability must be an object`);

      return;
    }

    const kind = sources.files.find(source => source.file === file && source.folder === folder).kind;

    if (seen.has(entry.id)) {
      problems.push(`${file}: id "${entry.id}" is declared twice`);
    }
    seen.add(entry.id);

    problems.push(...[
      ...checkEntryFields(entry, kind),
      ...checkId(entry, recorded),
      ...checkLicensing(entry),
      ...checkKindFields(entry, pluginModules),
      ...checkReferences(entry, byId),
      ...checkRequiredLicensing(entry, byId),
      ...checkTiers(entry, byId, tierNames),
    ].map(problem => `${file}: ${entry.id ?? '(no id)'}: ${problem}`));
  });

  if (problems.length === 0) {
    problems.push(...checkCompleteness(sources));

    const cycle = findCycle(byId);

    if (cycle !== null) {
      problems.push(`"requires" has a cycle: ${cycle.join(' -> ')}`);
    }
  }

  return problems;
}

/**
 * The tokens an entry brings with it: every sold entry `requires.allOf` reaches, directly or through other
 * entries. `anyOf` is left out, because no single member of it is needed.
 *
 * @param {object} entry A manifest entry.
 * @param {Map<string, object>} byId Every entry, by id.
 * @returns {string[]} The tokens, sorted.
 */
function computeImplies(entry, byId) {
  const reached = new Set();
  const pending = [...(entry.requires?.allOf ?? [])];

  while (pending.length > 0) {
    const id = pending.shift();

    // An id no entry declares is reported by `checkReferences()`; the tier check runs beside it, so skip it here.
    if (!reached.has(id) && id !== entry.id) {
      reached.add(id);
      pending.push(...(byId.get(id)?.requires?.allOf ?? []));
    }
  }

  return [...reached].filter(id => byId.get(id)?.licensing === 'token').sort();
}

/**
 * Turns the `requires.allOf` of an `enforceAtInit` entry into the `PLUGIN_DEPS` strings `BasePlugin` checks at
 * init, in the declared order.
 *
 * @param {object} entry A manifest entry.
 * @param {Map<string, object>} byId Every entry, by id.
 * @returns {string[]}
 */
function toPluginDeps(entry, byId) {
  return (entry.requires?.allOf ?? []).map((id) => {
    const required = byId.get(id);
    const { depType } = REGISTRIES.find(registry => registry.kind === required.kind);

    return `${depType}:${required.module}`;
  });
}

/**
 * Builds one capability of `dist/manifest.json`. Every key is always present, so consumers need no defaults.
 *
 * @param {object} entry A manifest entry.
 * @returns {object}
 */
function toPublishedCapability(entry) {
  return {
    id: entry.id,
    kind: entry.kind,
    module: entry.module ?? null,
    plugins: entry.plugins ?? [],
    name: entry.name,
    description: entry.description,
    since: entry.since ?? FIRST_RELEASE,
    status: entry.status,
    licensing: entry.licensing,
    gate: entry.gate ?? null,
    requires: {
      allOf: entry.requires?.allOf ?? [],
      anyOf: entry.requires?.anyOf ?? [],
    },
    enforceAtInit: entry.enforceAtInit ?? false,
    packages: entry.packages ?? [],
    tiers: entry.tiers ?? [],
  };
}

/**
 * Builds `dist/manifest.json`. The same sources always give the same bytes: no timestamp, a fixed key order,
 * and capabilities sorted by kind, then id.
 *
 * @param {object} sources What `loadSources()` returns, already checked.
 * @param {string} version The package version.
 * @returns {object}
 */
function buildManifest(sources, version) {
  const byId = indexEntries(sources);
  const capabilities = [...byId.values()]
    .sort((a, b) => (KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind)) || (a.id < b.id ? -1 : 1))
    .map(entry => toPublishedCapability(entry));

  return {
    schemaVersion: SCHEMA_VERSION,
    product: PRODUCT,
    version,
    tokenRule: TOKEN_RULE.source,
    tiers: sources.tiers,
    capabilities,
  };
}

/**
 * Tells whether a plugin entry gets a `feature.generated.ts` module: one whose dependencies are checked at init
 * (`PLUGIN_DEPS`), or one a license key can name (`LICENSE`).
 *
 * @param {object} entry A manifest entry.
 * @returns {boolean}
 */
function hasGeneratedModule(entry) {
  return entry.kind === 'plugin' && (entry.enforceAtInit === true || entry.licensing === 'token');
}

/**
 * Writes a value as a single-quoted TypeScript string literal.
 *
 * @param {string} value The value.
 * @returns {string}
 */
function toStringLiteral(value) {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'')}'`;
}

/**
 * Builds the `LICENSE` a plugin a license key can name exposes (`PluginLicense` in
 * `src/utils/licenseCapabilities/types.ts`).
 *
 * @param {object} entry The plugin's entry.
 * @returns {{capability: string, name: string, gate: string, tiers: string[]}}
 */
function toPluginLicense(entry) {
  return {
    capability: entry.id,
    name: entry.name,
    gate: entry.gate,
    tiers: entry.tiers,
  };
}

/**
 * Renders the `LICENSE` export of a plugin a license key can name.
 *
 * @param {object} entry The plugin's entry.
 * @returns {string[]} The lines.
 */
function renderLicense(entry) {
  const { capability, name, gate, tiers } = toPluginLicense(entry);
  const tiersLines = tiers.length === 0 ? ['  tiers: Object.freeze([]),'] : [
    '  tiers: Object.freeze([',
    ...tiers.map(tier => `    ${toStringLiteral(tier)},`),
    '  ]),',
  ];

  return [
    `// The license token of the ${entry.module} plugin, its display name, where it is checked (\`gate\`), and the`,
    '// license tiers that include it (`tiers`).',
    'export const LICENSE: PluginLicense = Object.freeze({',
    `  capability: ${toStringLiteral(capability)},`,
    `  name: ${toStringLiteral(name)},`,
    `  gate: ${toStringLiteral(gate)},`,
    ...tiersLines,
    '});',
    '',
  ];
}

/**
 * Renders the `feature.generated.ts` module of a plugin: its `PLUGIN_DEPS` when its dependencies are checked at
 * init, and its `LICENSE` when a license key can name it.
 *
 * @param {object} entry The plugin's entry.
 * @param {Map<string, object>} byId Every entry, by id.
 * @returns {string}
 */
function renderPluginModule(entry, byId) {
  const sold = entry.licensing === 'token';
  // Line comments only: the API reference generator reads every documented symbol in `tmp/plugins/*/*.js`.
  const lines = [
    `// Generated from \`${PLUGIN_SOURCE_NAME}\` by \`npm run generate:feature-manifest\`. Do not edit it by hand.`,
    '',
  ];

  if (sold) {
    lines.push('import type { PluginLicense } from \'../../utils/licenseCapabilities/types\';', '');
  }

  if (entry.enforceAtInit === true) {
    lines.push(
      `// The modules the ${entry.module} plugin needs registered, in the \`PLUGIN_DEPS\` format (\`type:Name\`).`,
      'export const PLUGIN_DEPS: readonly string[] = [',
      ...toPluginDeps(entry, byId).map(dep => `  '${dep}',`),
      '];',
      '',
    );
  }

  if (sold) {
    lines.push(...renderLicense(entry));
  }

  return lines.join('\n');
}

/**
 * Turns the part of an xlsx id after the namespace into the name of its `XlsxEntitlement` flag:
 * `xlsx:number_formats` gives `numberFormats`.
 *
 * @param {string} id The id.
 * @returns {string}
 */
function toXlsxFlagName(id) {
  return id.slice(id.indexOf(':') + 1).replace(/_([a-z0-9])/g, (match, letter) => letter.toUpperCase());
}

/**
 * Renders a frozen list of ids as TypeScript lines.
 *
 * @param {string} name The constant.
 * @param {string[]} ids The ids.
 * @returns {string[]}
 */
function renderIdList(name, ids) {
  return [
    `export const ${name}: readonly string[] = Object.freeze([`,
    ...ids.map(id => `  '${id}',`),
    ']);',
  ];
}

/**
 * Renders `utils/xlsxEngine/licenseCapabilities.generated.ts`: the XLSX tokens the runtime gates check
 * (`licensing: "token"` in `features.json` with a `call` or `degrade` gate, in that file's order), the ones each
 * file plugin gates, the `XlsxEntitlement` flag each token drives, and the tiers that include
 * each token. `licenseCapabilities.ts` re-exports them. A `report` entry (the import report) is never turned off, so it stays out.
 *
 * @param {object} sources What `loadSources()` returns, already checked.
 * @returns {string}
 */
function renderXlsxLicenseModule(sources) {
  const tokens = listEntries(sources)
    .filter(({ file, entry }) => file === XLSX_SOURCE_FILE && entry.licensing === 'token' &&
      XLSX_CHECKED_GATES.includes(entry.gate))
    .map(({ entry }) => entry);
  const idsOf = plugin => tokens.filter(entry => entry.plugins.includes(plugin)).map(entry => entry.id);

  return [
    '// Generated from `features.json` by `npm run generate:feature-manifest`. Do not edit it by hand.',
    '',
    '// The XLSX tokens a gate checks (`licensing: "token"`, `gate` "call" or "degrade"), in the order',
    '// `features.json` declares them.',
    ...renderIdList('XLSX_CAPABILITY_IDS', tokens.map(entry => entry.id)),
    '',
    `// The tokens the ${XLSX_PLUGINS.importFile} plugin gates (\`plugins\` names it), in the same order.`,
    ...renderIdList('IMPORT_FILE_CAPABILITY_IDS', idsOf(XLSX_PLUGINS.importFile)),
    '',
    `// The tokens the ${XLSX_PLUGINS.exportFile} plugin gates (\`plugins\` names it), in the same order.`,
    ...renderIdList('EXPORT_FILE_CAPABILITY_IDS', idsOf(XLSX_PLUGINS.exportFile)),
    '',
    '// The `XlsxEntitlement` flag each token drives: the id\'s suffix in camelCase.',
    'export const XLSX_FLAG_BY_ID: Readonly<Record<string, string>> = Object.freeze({',
    ...tokens.map(({ id }) => `  '${id}': '${toXlsxFlagName(id)}',`),
    '});',
    '',
    '// The license tiers that include each feature.',
    'export const XLSX_TIERS_BY_ID: Readonly<Record<string, readonly string[]>> = Object.freeze({',
    ...tokens.flatMap(({ id, tiers }) => [
      `  '${id}': Object.freeze([`,
      ...tiers.map(tier => `    ${toStringLiteral(tier)},`),
      '  ]),',
    ]),
    '});',
    '',
  ].join('\n');
}

/**
 * The name a sold entry has in the feature-to-tier matrix. An XLSX sub-feature can share its name with a plugin
 * (`Comments`, `Formulas`), so it reads `XLSX: <name>`, unless its name already starts with `XLSX`. A cell type's
 * name reads like a plugin or the product (`Checkbox`, `Date`, `Handsontable`), so it reads `Cell type: <name>`.
 *
 * @param {string} file The source file of the entry.
 * @param {object} entry A manifest entry.
 * @returns {string}
 */
function toMatrixName(file, entry) {
  if (entry.kind === 'cell_type') {
    return `Cell type: ${entry.name}`;
  }

  return file === XLSX_SOURCE_FILE && !entry.name.startsWith('XLSX') ? `XLSX: ${entry.name}` : entry.name;
}

/**
 * Renders the feature-to-tier matrix of the license key guide as a Markdown table: one row per sold entry, sorted by
 * kind (in `KINDS` order), then by name, and one column per tier, in the order `tiers.json` declares them. A cell
 * reads `Yes` when the tier includes the feature, and is empty otherwise. The table names no ids.
 *
 * @param {object} sources What `loadSources()` returns, already checked.
 * @returns {string}
 */
function renderTierMatrix(sources) {
  const rows = listEntries(sources)
    .filter(({ entry }) => entry.licensing === 'token')
    .map(({ file, entry }) => ({ entry, name: toMatrixName(file, entry) }))
    .sort((a, b) => (KINDS.indexOf(a.entry.kind) - KINDS.indexOf(b.entry.kind)) ||
      (a.name < b.name ? -1 : Number(a.name > b.name)));
  const titles = sources.tiers.map(tier => `${tier[0].toUpperCase()}${tier.slice(1)}`);

  return [
    `| Feature | ${titles.join(' | ')} |`,
    `| --- | ${titles.map(() => ':---:').join(' | ')} |`,
    ...rows.map(({ entry, name }) => `| ${name} | ${sources.tiers
      .map(tier => (entry.tiers.includes(tier) ? 'Yes' : 'No')).join(' | ')} |`),
    '',
  ].join('\n');
}

/**
 * Renders the license key guide with the feature-to-tier matrix between its markers replaced.
 *
 * @param {object} sources What `loadSources()` returns, already checked.
 * @returns {string}
 */
function renderLicenseGuide(sources) {
  const page = sources.licenseGuideText;

  if (typeof page !== 'string') {
    throw new Error(`${LICENSE_GUIDE_FILE} is missing: the feature-to-tier matrix is written into it, so restore the ` +
      'license key guide before you generate');
  }

  const start = page.indexOf(TIER_MATRIX_START);
  const end = page.indexOf(TIER_MATRIX_END);

  if (start === -1 || end < start) {
    throw new Error(`${LICENSE_GUIDE_FILE} must hold ${TIER_MATRIX_START} followed by ${TIER_MATRIX_END}`);
  }

  return `${page.slice(0, start + TIER_MATRIX_START.length)}\n\n${renderTierMatrix(sources)}\n` +
    `${page.slice(end)}`;
}

/**
 * Checks the shape of a record of released ids: every id lists the distinct `licensing` values it has had.
 *
 * @param {object} record The parsed record.
 * @returns {string[]} The problems.
 */
function checkRecordShape(record) {
  if (record === null || typeof record !== 'object' || Array.isArray(record)) {
    return [`${RELEASED_FILE} must be an object of ids`];
  }

  return Object.entries(record).flatMap(([id, values]) => {
    if (id.startsWith(TIER_TOKEN_PREFIX)) {
      return isStringList(values) && values.length === 1 && values[0] === RECORDED_TIER ? [] :
        [`${RELEASED_FILE}: "${id}" is a tier, so it must list "${RECORDED_TIER}" and nothing else`];
    }

    return !isStringList(values) || values.length === 0 || values.some(value => !RECORDED_LICENSING.includes(value)) ?
      [`${RELEASED_FILE}: "${id}" must list the licensing values it has had (${RECORDED_LICENSING.join(', ')})`] : [];
  });
}

/**
 * Builds the record of released ids: every stable id, with every licensing value it has had, and every tier as its
 * key token (`tier:<name>`). A value is never dropped, so an id once sold, and a tier once released, can never be
 * removed.
 *
 * @param {object} sources What `loadSources()` returns, already checked.
 * @returns {object} The record, keys and values sorted.
 */
function buildReleased(sources) {
  const record = {};

  Object.entries(sources.released).forEach(([id, values]) => {
    record[id] = [...values];
  });
  indexEntries(sources).forEach((entry) => {
    if (entry.status === 'stable') {
      record[entry.id] = [...new Set([...(record[entry.id] ?? []), entry.licensing])].sort();
    }
  });
  sources.tiers.forEach((tier) => {
    record[`${TIER_TOKEN_PREFIX}${tier}`] = [RECORDED_TIER];
  });

  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => (a < b ? -1 : 1)));
}

/**
 * Checks the manifest against the released ids. A sold id may never be removed, and a released id never goes
 * back to `planned`. An id released as `core` or `none` may be sold: a key names tiers, not features, so no key
 * issued before lists the features it unlocks one by one. A released tier may never be removed or renamed: keys
 * name it, and a key whose tier no feature lists turns every gated feature off.
 *
 * @param {object} sources What `loadSources()` returns, already checked.
 * @returns {string[]} The problems.
 */
function checkReleased(sources) {
  const shapeProblems = checkRecordShape(sources.released);

  if (shapeProblems.length > 0) {
    return shapeProblems;
  }

  const byId = indexEntries(sources);

  return Object.entries(sources.released).flatMap(([id, values]) => {
    if (id.startsWith(TIER_TOKEN_PREFIX)) {
      return sources.tiers.includes(id.slice(TIER_TOKEN_PREFIX.length)) ? [] : [`"${id}" was released as a tier, ` +
        `so it can never be removed or renamed (keys already name it). Restore it in ${TIERS_FILE}. If it never ` +
        `reached the base branch, delete its line from ${RELEASED_FILE} instead.`];
    }

    const entry = byId.get(id);

    if (entry === undefined) {
      return values.includes('token') ? [`"${id}" was released as a token, so it can never be removed (keys ` +
        `already carry it). If it never reached the base branch, delete its line from ${RELEASED_FILE} instead.`] : [];
    }

    return entry.status === 'planned' ? [`"${id}" was released, so it cannot go back to "planned"`] : [];
  });
}

/**
 * Compares the record of released ids with the base branch's copy. The record only grows: every id of the base
 * stays, with every licensing value it had there. This is what makes an id released once it is merged: a
 * feature branch may still drop an id the base never had, and nothing else.
 *
 * @param {object} base The base branch's record (`{}` before the record existed there).
 * @param {object} current The record on this branch.
 * @returns {string[]} The problems.
 */
function checkRecordAgainstBase(base, current) {
  const shapeProblems = [...checkRecordShape(base), ...checkRecordShape(current)];

  if (shapeProblems.length > 0) {
    return shapeProblems;
  }

  return Object.entries(base).flatMap(([id, values]) => {
    if (current[id] === undefined) {
      return [`"${id}" is in the base branch's ${RELEASED_FILE}, so it must stay in it`];
    }

    const lost = values.filter(value => !current[id].includes(value));

    return lost.length > 0 ?
      [`"${id}" was recorded as "${lost.join('" and "')}" on the base branch, and a record never loses a value`] : [];
  });
}

/**
 * Lists the committed files the sources generate: one module per plugin whose dependencies are checked at init
 * or that a license key can name, the XLSX license token module, the record of released ids, and the license key
 * guide with its feature-to-tier matrix. Every path is relative to `handsontable/`, so the guide's starts with `../`.
 * A checkout without the `docs/` directory leaves the guide out; one with `docs/` and no guide still throws.
 *
 * @param {object} sources What `loadSources()` returns, already checked.
 * @returns {Array<{file: string, content: string}>}
 */
function buildCommittedOutputs(sources) {
  const byId = indexEntries(sources);
  const modules = listEntries(sources)
    .filter(({ entry }) => hasGeneratedModule(entry))
    .map(({ folder, entry }) => ({
      file: `src/plugins/${folder}/${GENERATED_MODULE_NAME}`,
      content: renderPluginModule(entry, byId),
    }));

  return [
    ...modules,
    { file: XLSX_LICENSE_MODULE_FILE, content: renderXlsxLicenseModule(sources) },
    { file: RELEASED_FILE, content: `${JSON.stringify(buildReleased(sources), null, 2)}\n` },
    // A checkout without `docs/` (a sparse one, or the published package) has no guide to write the matrix into.
    ...(sources.hasDocs ? [{ file: LICENSE_GUIDE_FILE, content: renderLicenseGuide(sources) }] : []),
  ];
}

/**
 * Compares the committed outputs with what the sources generate.
 *
 * @param {object} sources What `loadSources()` returns, already checked.
 * @returns {string[]} The files that are stale, missing, or no longer generated.
 */
function findStaleOutputs(sources) {
  const expected = buildCommittedOutputs(sources);
  const current = new Map(sources.generatedModules.map(({ file, content }) => [file, content]));

  // The file's own bytes, so a record reordered or reformatted by hand reads as stale too.
  current.set(RELEASED_FILE, sources.releasedText);
  current.set(XLSX_LICENSE_MODULE_FILE, sources.xlsxLicenseModuleText);
  current.set(LICENSE_GUIDE_FILE, sources.licenseGuideText);

  const stale = expected.filter(({ file, content }) => current.get(file) !== content).map(({ file }) => file);
  const orphaned = sources.generatedModules.map(({ file }) => file)
    .filter(file => !expected.some(output => output.file === file));

  return [...stale, ...orphaned.map(file => `${file} (no longer generated; delete it)`)];
}

exports.TOKEN_RULE = TOKEN_RULE;
exports.FIRST_RELEASE = FIRST_RELEASE;
exports.REGISTRIES = REGISTRIES;
exports.GENERATED_MODULE_NAME = GENERATED_MODULE_NAME;
exports.RELEASED_FILE = RELEASED_FILE;
exports.TIERS_FILE = TIERS_FILE;
exports.XLSX_LICENSE_MODULE_FILE = XLSX_LICENSE_MODULE_FILE;
exports.OUTPUT_FILE = OUTPUT_FILE;
exports.LICENSE_GUIDE_FILE = LICENSE_GUIDE_FILE;
exports.loadSources = loadSources;
exports.listEntries = listEntries;
exports.indexEntries = indexEntries;
exports.checkSources = checkSources;
exports.checkReleased = checkReleased;
exports.checkRecordAgainstBase = checkRecordAgainstBase;
exports.computeImplies = computeImplies;
exports.toPluginDeps = toPluginDeps;
exports.toPluginLicense = toPluginLicense;
exports.buildManifest = buildManifest;
exports.renderXlsxLicenseModule = renderXlsxLicenseModule;
exports.renderTierMatrix = renderTierMatrix;
exports.buildCommittedOutputs = buildCommittedOutputs;
exports.findStaleOutputs = findStaleOutputs;
