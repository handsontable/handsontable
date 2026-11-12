import { access, readdir, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ManifestError } from './errors.mjs';

/**
 * Absolute path of the package root (the directory that holds `versions/`).
 */
export const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Absolute path of the directory with one subdirectory per version.
 */
export const VERSIONS_DIR = join(PACKAGE_ROOT, 'versions');

/**
 * Field types the validator knows.
 *
 * - `string`: a non-empty string.
 * - `strings`: an array of non-empty strings.
 * - `object`: a plain object.
 * - `boolean`: `true` or `false`.
 * - `objects`: an array whose items are all plain objects.
 */
const FIELD_TYPES = {
  string: value => typeof value === 'string' && value.length > 0,
  strings: value => Array.isArray(value) && value.length > 0 && value.every(item => typeof item === 'string' && item),
  object: value => value !== null && typeof value === 'object' && !Array.isArray(value),
  boolean: value => typeof value === 'boolean',
  objects: value => Array.isArray(value) && value.every(item => item !== null && typeof item === 'object'
    && !Array.isArray(item)),
};

/**
 * Fields every rule may carry. `id` and `kind` are required, the rest is optional.
 */
export const COMMON_FIELDS = {
  required: { id: 'string', kind: 'string' },
  optional: {
    guide: 'string',
    safe: 'boolean',
    minConfidence: 'string',
    message: 'string',
    advice: 'string',
  },
};

/**
 * The rule kinds and the fields each one requires on top of the common ones.
 *
 * The field sets are provisional. The author of a kind's transform owns its row: add the fields the
 * transform reads, and mirror the change in `manifest.schema.json`. Rules may carry extra properties that
 * are not listed here, so a transform can grow without breaking manifests that already exist. The
 * `manifest.test.mjs` parity test pins the kind list and each required list against the schema file.
 */
export const RULE_KINDS = {
  importSource: { required: { from: 'string', to: 'string' }, optional: { names: 'strings' } },
  exportRename: { required: { module: 'string', from: 'string', to: 'string' }, optional: {} },
  namespaceType: { required: { from: 'string', module: 'string' }, optional: { to: 'string' } },
  exportRemoved: { required: { module: 'string', name: 'string' }, optional: {} },
  optionRename: { required: { from: 'string', to: 'string' }, optional: {} },
  optionMove: { required: { from: 'string', to: 'string' }, optional: {} },
  optionRemove: { required: { name: 'string' }, optional: {} },
  methodRemove: { required: { name: 'string' }, optional: {} },
  methodMove: { required: { name: 'string', plugin: 'string' }, optional: { to: 'string' } },
  callUnwrap: { required: { callee: 'string' }, optional: {} },
  cssVariable: { required: { from: 'string' }, optional: { to: 'string', removed: 'boolean' } },
  themeToken: { required: { from: 'string' }, optional: { to: 'string', removed: 'boolean', callees: 'strings' } },
  dependency: {
    required: {},
    optional: { bump: 'object', replaced: 'object', add: 'objects', reportOnly: 'objects', facts: 'objects' },
  },
  detect: { required: { match: 'object' }, optional: { emits: 'string' } },
  custom: { required: { module: 'string' }, optional: {} },
};

const STATUSES = ['released', 'draft'];
const CONFIDENCES = ['high', 'medium'];
const SEMVER = /^\d+\.\d+\.\d+$/;

/**
 * Check one rule and return the problems found.
 *
 * @param {object} rule The raw rule from a manifest.
 * @param {string} version Version of the manifest that owns the rule.
 * @returns {string[]} Problem descriptions, empty when the rule is valid.
 */
export function validateRule(rule, version) {
  if (!FIELD_TYPES.object(rule)) {
    return ['the rule is not an object'];
  }

  const problems = [];
  const kindSpec = RULE_KINDS[rule.kind];

  if (!kindSpec) {
    problems.push(`unknown kind "${rule.kind}" (known: ${Object.keys(RULE_KINDS).join(', ')})`);
  }

  const required = { ...COMMON_FIELDS.required, ...kindSpec?.required };
  const optional = { ...COMMON_FIELDS.optional, ...kindSpec?.optional };

  for (const [field, type] of Object.entries(required)) {
    if (!(field in rule)) {
      problems.push(`missing required field "${field}"`);
    } else if (!FIELD_TYPES[type](rule[field])) {
      problems.push(`field "${field}" must be of type ${type}`);
    }
  }

  for (const [field, type] of Object.entries(optional)) {
    if (field in rule && !FIELD_TYPES[type](rule[field])) {
      problems.push(`field "${field}" must be of type ${type}`);
    }
  }

  if (typeof rule.id === 'string' && !rule.id.startsWith(`${version}/`)) {
    problems.push(`id "${rule.id}" must start with "${version}/"`);
  }

  if (typeof rule.id === 'string' && rule.id.startsWith(`${version}/`) && rule.id.length === version.length + 1) {
    problems.push('id has no slug after the version prefix');
  }

  if ('minConfidence' in rule && typeof rule.minConfidence === 'string' && !CONFIDENCES.includes(rule.minConfidence)) {
    problems.push(`minConfidence must be one of ${CONFIDENCES.join(', ')}`);
  }

  return problems;
}

/**
 * Check the top-level shape of a manifest, without its rules.
 *
 * @param {object} raw The parsed manifest.
 * @param {string} dirName Name of the version directory.
 * @returns {string[]} Problem descriptions.
 */
function validateHeader(raw, dirName) {
  const problems = [];

  if (!FIELD_TYPES.object(raw)) {
    return ['the manifest is not an object'];
  }

  if (raw.version !== dirName) {
    problems.push(`"version" is ${JSON.stringify(raw.version)} but the directory is "${dirName}"`);
  }

  if (!SEMVER.test(dirName)) {
    problems.push(`directory name "${dirName}" is not a full semver version`);
  }

  if (!STATUSES.includes(raw.status)) {
    problems.push(`"status" must be one of ${STATUSES.join(', ')}`);
  }

  if (!FIELD_TYPES.object(raw.guide) || !FIELD_TYPES.string(raw.guide.url) || !FIELD_TYPES.string(raw.guide.source)) {
    problems.push('"guide" must be an object with string fields "url" and "source"');
  }

  if ('include' in raw && !FIELD_TYPES.strings(raw.include)) {
    problems.push('"include" must be a non-empty array of relative file paths');
  }

  if ('rules' in raw && !Array.isArray(raw.rules)) {
    problems.push('"rules" must be an array');
  }

  return problems;
}

/**
 * Check whether a path exists.
 *
 * @param {string} path File or directory path.
 * @returns {Promise<boolean>} `true` when it exists.
 */
async function exists(path) {
  return access(path).then(() => true, () => false);
}

/**
 * Resolve a path that a manifest names against its version directory and refuse paths that leave it.
 *
 * @param {string} dir Version directory.
 * @param {string} name Relative path from the manifest.
 * @param {string} label Where the path came from, for the error message.
 * @returns {string} Absolute path.
 */
function resolveInside(dir, name, label) {
  const absolute = resolve(dir, name);
  const inside = relative(dir, absolute);

  if (isAbsolute(name) || inside.startsWith('..') || inside.split(sep)[0] === '..') {
    throw new ManifestError(`${label}: "${name}" must stay inside the version directory`);
  }

  return absolute;
}

/**
 * Load one `versions/<semver>/manifest.json`: validate it, merge the included files, and resolve custom
 * modules. Throws a `ManifestError` that lists every problem found.
 *
 * @param {string} dir Absolute path of the version directory.
 * @returns {Promise<import('./types.mjs').Manifest>} The loaded manifest.
 */
export async function loadManifest(dir) {
  const dirName = dir.split(sep).pop();
  const file = join(dir, 'manifest.json');
  const label = `versions/${dirName}/manifest.json`;
  let raw;

  try {
    raw = JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    throw new ManifestError(`${label}: cannot read or parse the file (${error.message})`);
  }

  const problems = validateHeader(raw, dirName).map(problem => `${label}: ${problem}`);
  const rawRules = [...(Array.isArray(raw.rules) ? raw.rules : [])];

  for (const include of FIELD_TYPES.strings(raw.include) ? raw.include : []) {
    const includeLabel = `${label} include "${include}"`;
    const includePath = resolveInside(dir, include, includeLabel);
    let included;

    try {
      included = JSON.parse(await readFile(includePath, 'utf8'));
    } catch (error) {
      problems.push(`${includeLabel}: cannot read or parse the file (${error.message})`);
      continue;
    }

    if (!FIELD_TYPES.object(included) || !Array.isArray(included.rules)) {
      problems.push(`${includeLabel}: the file must be an object with a "rules" array`);
      continue;
    }

    rawRules.push(...included.rules);
  }

  const seen = new Set();
  const rules = [];

  rawRules.forEach((rule, index) => {
    const ruleLabel = `${label} rules[${index}]${typeof rule?.id === 'string' ? ` (${rule.id})` : ''}`;

    for (const problem of validateRule(rule, dirName)) {
      problems.push(`${ruleLabel}: ${problem}`);
    }

    if (typeof rule?.id === 'string') {
      if (seen.has(rule.id)) {
        problems.push(`${ruleLabel}: duplicate id`);
      }

      seen.add(rule.id);
    }

    rules.push(rule);
  });

  const guideUrl = raw.guide?.url ?? null;

  const loadedRules = await Promise.all(rules.map(async(rule) => {
    const loaded = {
      safe: false,
      ...rule,
      version: dirName,
      guideUrl: guideUrl && rule?.guide ? `${guideUrl}#${rule.guide}` : guideUrl,
    };

    if (rule?.kind === 'custom' && typeof rule.module === 'string') {
      try {
        loaded.modulePath = resolveInside(dir, rule.module, `${label} (${rule.id})`);

        if (!(await exists(loaded.modulePath))) {
          problems.push(`${label} (${rule.id}): custom module "${rule.module}" does not exist`);
        }
      } catch (error) {
        problems.push(error.message);
      }
    }

    return loaded;
  }));

  if (problems.length > 0) {
    throw new ManifestError(problems.join('\n'));
  }

  return {
    version: dirName,
    status: raw.status,
    guide: raw.guide,
    rules: loadedRules,
    dir,
  };
}

/**
 * Discover and load every manifest under a versions directory, in ascending version order.
 *
 * @param {string} [versionsDir] Directory that holds one subdirectory per version.
 * @returns {Promise<import('./types.mjs').Manifest[]>} The loaded manifests.
 */
export async function loadManifests(versionsDir = VERSIONS_DIR) {
  const entries = await readdir(versionsDir, { withFileTypes: true });
  const dirs = entries.filter(entry => entry.isDirectory() && SEMVER.test(entry.name)).map(entry => entry.name);
  const manifests = [];

  for (const name of dirs) {
    manifests.push(await loadManifest(join(versionsDir, name)));
  }

  const numeric = version => version.split('.').map(Number);

  return manifests.sort((a, b) => {
    const [x, y] = [numeric(a.version), numeric(b.version)];

    return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
  });
}

/**
 * Group the rules of the selected manifests into a plan, optionally keeping only some rule ids.
 *
 * @param {import('./types.mjs').Manifest[]} manifests Selected manifests in ascending version order.
 * @param {string[]} [only] Rule ids to keep. Empty or absent keeps every rule.
 * @returns {import('./types.mjs').Plan} The plan. Versions left without rules are dropped.
 */
export function buildPlan(manifests, only = []) {
  const keep = only.length > 0 ? new Set(only) : null;
  const rulesById = new Map();
  const versions = [];

  for (const manifest of manifests) {
    const rules = manifest.rules.filter(rule => !keep || keep.has(rule.id));

    rules.forEach(rule => rulesById.set(rule.id, rule));

    if (rules.length > 0) {
      versions.push({ version: manifest.version, rules });
    }
  }

  return { versions, rulesById };
}
