/**
 * The feature manifest - loader, checks, and builders.
 *
 * Every Handsontable feature a license key can name, and every module a feature needs, is described in a
 * small JSON file next to its code: `feature.json` in each plugin folder, one `features.json` in each
 * registry folder (`cellTypes`, `editors`, `renderers`, `validators`), one for the XLSX sub-features in
 * `utils/xlsxEngine`, and `featureManifest/core.json`. This module reads them, checks them against the
 * source, and builds what is made from them:
 *   - `dist/manifest.json`, published with every release (the license portal reads it to build keys);
 *   - the committed `feature.generated.ts` modules the plugins read their `PLUGIN_DEPS` from;
 *   - the committed `featureManifest/released-tokens.json`, which keeps ids from being removed or sold later.
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
 * The per-product key flag that marks a key whose capability list is complete. Without it, a key unlocks every
 * feature, which is how every key issued before the manifest keeps working.
 */
const KEY_FLAG = 'listed-capabilities';

const SCHEMA_VERSION = 1;
const PRODUCT = 'handsontable';

/**
 * The release that ships the first manifest. An entry without `since` inherits it, so only a feature added
 * later has to declare its own.
 */
const FIRST_RELEASE = '19.0.0';

const KINDS = ['core_area', 'plugin', 'cell_type', 'sub_feature', 'editor', 'renderer', 'validator'];
const LICENSING = ['core', 'token', 'none'];
const STATUSES = ['stable', 'planned'];

/**
 * The gates a sold entry may declare, per kind. `enable`: checked when the plugin turns on. `call`: checked in
 * the plugin's public methods (a plugin that is always on). `degrade`: the sub-feature is left out of the result
 * and reported. `report`: listed in the message, keeps working.
 */
const GATES_BY_KIND = {
  plugin: ['enable', 'call'],
  cell_type: ['report'],
  sub_feature: ['call', 'degrade'],
};

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
 * The files that hold the entries of one kind, other than the plugin folders.
 */
const SHARED_SOURCES = [
  { file: 'src/featureManifest/core.json', kind: 'core_area' },
  { file: 'src/cellTypes/features.json', kind: 'cell_type' },
  { file: 'src/editors/features.json', kind: 'editor' },
  { file: 'src/renderers/features.json', kind: 'renderer' },
  { file: 'src/validators/features.json', kind: 'validator' },
  { file: 'src/utils/xlsxEngine/features.json', kind: 'sub_feature' },
];

const PLUGIN_SOURCE_NAME = 'feature.json';
const GENERATED_MODULE_NAME = 'feature.generated.ts';
const RELEASED_FILE = 'src/featureManifest/released-tokens.json';
const OUTPUT_FILE = 'dist/manifest.json';

/**
 * Plugins that stay out of keys (D7): both are `@private`, have no option, and turn on by themselves on touch
 * devices, so a token would quietly break mobile scrolling and selection on a restricted key.
 */
const UNSOLD_PLUGINS = ['TouchScroll', 'MultipleSelectionHandles'];

/**
 * Cell types that belong to `core`: every key carries them.
 */
const CORE_CELL_TYPES = ['text'];

const ENTRY_FIELDS = [
  'id', 'kind', 'module', 'plugins', 'name', 'description', 'since', 'status', 'licensing', 'gate',
  'enabledByDefault', 'requires', 'enforceAtInit', 'worksWith', 'packages',
];
const REGISTRY_KINDS = REGISTRIES.map(registry => registry.kind);

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

  return {
    files,
    modules,
    generatedModules,
    released: readSourceFile(packageDir, RELEASED_FILE) ?? {},
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
 * The licensing an entry must declare, by the rule decided for the manifest (D7). `null` for a sub-feature,
 * which is decided per entry.
 *
 * @param {object} entry A manifest entry.
 * @returns {string|null}
 */
function expectedLicensing(entry) {
  switch (entry.kind) {
    case 'plugin':
      return UNSOLD_PLUGINS.includes(entry.module) ? 'none' : 'token';
    case 'cell_type':
      return CORE_CELL_TYPES.includes(entry.module) ? 'core' : 'token';
    case 'core_area':
      return 'core';
    case 'sub_feature':
      return null;
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
    .filter(key => key !== '$schema' && key !== 'capabilities')
    .map(key => `${file}: unknown top-level key "${key}"`);

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
 * @returns {string[]} The problems, without the file name.
 */
function checkId(entry) {
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
    problems.push(`id "${entry.id}" is reserved: "<namespace>:all" grants a whole namespace`);
  }
  if (registry && namespace !== registry.namespace) {
    problems.push(`id "${entry.id}" must start with "${registry.namespace}:"`);
  }
  if (entry.kind === 'sub_feature' && REGISTRIES.some(item => item.namespace === namespace)) {
    problems.push(`id "${entry.id}" uses a registry namespace; a sub-feature needs a namespace of its own`);
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

  } else if (expected !== null && entry.licensing !== expected) {
    problems.push(`"licensing" must be "${expected}" for this ${entry.kind} (see src/featureManifest/AGENTS.md)`);

  } else if (expected === null && entry.licensing === 'none') {
    problems.push('"licensing" of a sub-feature must be "token" or "core"');
  }

  if (entry.licensing === 'token' && !gates.includes(entry.gate)) {
    problems.push(`"gate" must be one of ${gates.join(', ')} for a sold ${entry.kind}`);
  }
  if (entry.licensing !== 'token' && entry.gate !== undefined) {
    problems.push('"gate" is only for an entry a key must list ("licensing": "token")');
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

  ['enabledByDefault', 'enforceAtInit'].forEach((key) => {
    if (entry[key] !== undefined && (entry.kind !== 'plugin' || typeof entry[key] !== 'boolean')) {
      problems.push(`"${key}" is a boolean, and only for a plugin`);
    }
  });

  return problems;
}

/**
 * Checks `requires`, `worksWith`, and `packages` of one entry against the other entries.
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
  ['worksWith', 'packages'].forEach((key) => {
    if (entry[key] !== undefined && !isStringList(entry[key])) {
      problems.push(`"${key}" must be a list of distinct strings`);
    }
  });

  const referenced = [...(isStringList(requires?.allOf) ? requires.allOf : []),
    ...(isStringList(requires?.anyOf) ? requires.anyOf : []),
    ...(isStringList(entry.worksWith) ? entry.worksWith : [])];

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
 * Checks what an entry requires against the licensing of the entries it names, and what an `enforceAtInit`
 * entry can turn into `PLUGIN_DEPS`.
 *
 * @param {object} entry A manifest entry.
 * @param {Map<string, object>} byId Every entry, by id.
 * @returns {string[]} The problems, without the file name.
 */
function checkRequiredLicensing(entry, byId) {
  const problems = [];

  if (entry.licensing === 'core') {
    requiredIds(entry).filter(id => byId.get(id)?.licensing === 'token').forEach((id) => {
      problems.push(`a core entry cannot require "${id}", which a key must list`);
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
  const problems = sources.files.flatMap(checkFileShape);
  const byId = indexEntries(sources);
  const pluginModules = new Set(sources.modules.filter(({ kind }) => kind === 'plugin').map(({ module }) => module));
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
      ...checkId(entry),
      ...checkLicensing(entry),
      ...checkKindFields(entry, pluginModules),
      ...checkReferences(entry, byId),
      ...checkRequiredLicensing(entry, byId),
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

    if (!reached.has(id) && id !== entry.id) {
      reached.add(id);
      pending.push(...(byId.get(id).requires?.allOf ?? []));
    }
  }

  return [...reached].filter(id => byId.get(id).licensing === 'token').sort();
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
 * @param {Map<string, object>} byId Every entry, by id.
 * @returns {object}
 */
function toPublishedCapability(entry, byId) {
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
    enabledByDefault: entry.enabledByDefault ?? false,
    requires: {
      allOf: entry.requires?.allOf ?? [],
      anyOf: entry.requires?.anyOf ?? [],
    },
    enforceAtInit: entry.enforceAtInit ?? false,
    worksWith: entry.worksWith ?? [],
    packages: entry.packages ?? [],
    implies: computeImplies(entry, byId),
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
    .map(entry => toPublishedCapability(entry, byId));

  return {
    schemaVersion: SCHEMA_VERSION,
    product: PRODUCT,
    version,
    tokenRule: TOKEN_RULE.source,
    keyFlag: KEY_FLAG,
    capabilities,
  };
}

/**
 * Renders the `feature.generated.ts` module of a plugin whose dependencies are checked at init.
 *
 * @param {object} entry The plugin's entry.
 * @param {Map<string, object>} byId Every entry, by id.
 * @returns {string}
 */
function renderPluginModule(entry, byId) {
  // Line comments only: the API reference generator reads every documented symbol in `tmp/plugins/*/*.js`.
  return [
    `// Generated from \`${PLUGIN_SOURCE_NAME}\` by \`npm run generate:feature-manifest\`. Do not edit it by hand.`,
    '',
    `// The modules the ${entry.module} plugin needs registered, in the \`PLUGIN_DEPS\` format (\`type:Name\`).`,
    'export const PLUGIN_DEPS: readonly string[] = [',
    ...toPluginDeps(entry, byId).map(dep => `  '${dep}',`),
    '];',
    '',
  ].join('\n');
}

/**
 * Builds the record of released ids: every stable id, with its licensing. A record is never dropped, so an id
 * that left the manifest still cannot come back as a token.
 *
 * @param {object} sources What `loadSources()` returns, already checked.
 * @returns {object} The record, keys sorted.
 */
function buildReleased(sources) {
  const record = { ...sources.released };

  indexEntries(sources).forEach((entry) => {
    if (entry.status === 'stable') {
      record[entry.id] = entry.licensing;
    }
  });

  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => (a < b ? -1 : 1)));
}

/**
 * Checks the manifest against the released ids. A sold id may never be removed, and an id released as `core`
 * or `none` may never become sold: a restricted key issued before would not list it, and the feature would
 * turn off for that customer on upgrade.
 *
 * @param {object} sources What `loadSources()` returns, already checked.
 * @returns {string[]} The problems.
 */
function checkReleased(sources) {
  const byId = indexEntries(sources);

  return Object.entries(sources.released).flatMap(([id, licensing]) => {
    const entry = byId.get(id);

    if (licensing === 'token' && entry === undefined) {
      return [`"${id}" was released as a token, so it can never be removed (keys already carry it)`];
    }
    if (licensing !== 'token' && entry?.licensing === 'token') {
      return [`"${id}" was released as "${licensing}", so it can never become a token (restricted keys issued ` +
        'before would lose it)'];
    }

    return [];
  });
}

/**
 * Lists the committed files the sources generate: one module per plugin whose dependencies are checked at init,
 * and the record of released ids.
 *
 * @param {object} sources What `loadSources()` returns, already checked.
 * @returns {Array<{file: string, content: string}>}
 */
function buildCommittedOutputs(sources) {
  const byId = indexEntries(sources);
  const modules = listEntries(sources)
    .filter(({ entry }) => entry.kind === 'plugin' && entry.enforceAtInit === true)
    .map(({ folder, entry }) => ({
      file: `src/plugins/${folder}/${GENERATED_MODULE_NAME}`,
      content: renderPluginModule(entry, byId),
    }));

  return [
    ...modules,
    { file: RELEASED_FILE, content: `${JSON.stringify(buildReleased(sources), null, 2)}\n` },
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
  const releasedContent = `${JSON.stringify(sources.released, null, 2)}\n`;

  current.set(RELEASED_FILE, releasedContent);

  const stale = expected.filter(({ file, content }) => current.get(file) !== content).map(({ file }) => file);
  const orphaned = sources.generatedModules.map(({ file }) => file)
    .filter(file => !expected.some(output => output.file === file));

  return [...stale, ...orphaned.map(file => `${file} (no longer generated; delete it)`)];
}

exports.TOKEN_RULE = TOKEN_RULE;
exports.KEY_FLAG = KEY_FLAG;
exports.FIRST_RELEASE = FIRST_RELEASE;
exports.REGISTRIES = REGISTRIES;
exports.GENERATED_MODULE_NAME = GENERATED_MODULE_NAME;
exports.RELEASED_FILE = RELEASED_FILE;
exports.OUTPUT_FILE = OUTPUT_FILE;
exports.loadSources = loadSources;
exports.listEntries = listEntries;
exports.indexEntries = indexEntries;
exports.checkSources = checkSources;
exports.checkReleased = checkReleased;
exports.computeImplies = computeImplies;
exports.toPluginDeps = toPluginDeps;
exports.buildManifest = buildManifest;
exports.buildCommittedOutputs = buildCommittedOutputs;
exports.findStaleOutputs = findStaleOutputs;
