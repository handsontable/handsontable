import { settingsSchema } from './schema';
import { internals } from './schema.generated';
import metaSchemaFactory from '../dataMap/metaManager/metaSchema';
import { REMOVED_HOOKS } from '../core/hooks/constants';
import {
  getHooks,
  getPlugin,
  getPluginsNames,
  hasCellType,
  hasEditor,
  hasPlugin,
  hasRenderer,
  hasValidator,
} from './registries';
import { findClosestMatch } from './closestMatch';
import type { HotInstance } from '../core/types';
import type {
  JsonSchemaObject,
  SettingsProblem,
  SettingsProblemCode,
  SettingsSchemaLevel,
  SettingsValidationResult,
  ValidateSettingsOptions,
} from './types';

/**
 * How many data rows the `columns[].data` check reads. A typo shows in the first rows, and
 * reading every row of a large data set would make the check as slow as the data is long.
 */
const DATA_SAMPLE_SIZE = 50;

/**
 * How deep nested settings objects (the `handsontable` cell type's grid) are followed.
 */
const MAX_DEPTH = 8;

/**
 * The keys the grid writes on its own settings object (`instance`, `_initOnlySettings`,
 * `_layoutDirection`), so the result of `getSettings()` passes. `__proto__` is not one of them.
 */
const RUNTIME_KEY = /^(_(?!_proto__$)|instance$)/;

/**
 * The schema node that describes a whole settings object at each level.
 */
const LEVEL_NODES: Record<SettingsSchemaLevel, JsonSchemaObject> = {
  grid: settingsSchema,
  columns: settingsSchema.$defs?.columnSettings ?? {},
  cells: settingsSchema.$defs?.cellSettings ?? {},
  cell: settingsSchema.$defs?.cellSettings ?? {},
};

/**
 * The `level` option's values: the level names the schema's `x-handsontable.levels` uses.
 */
const INPUT_LEVELS: Record<string, SettingsSchemaLevel> = {
  grid: 'grid',
  columns: 'columns',
  cells: 'cells',
  cell: 'cell',
};

/**
 * The `$ref` targets that describe a whole settings object, and the level they describe.
 */
const SETTINGS_REFS: Record<string, SettingsSchemaLevel> = {
  '#': 'grid',
  '#/$defs/columnSettings': 'columns',
  '#/$defs/cellSettings': 'cell',
};

/**
 * Tells whether a registered plugin provides an editor under the name. A plugin that ships an
 * editor of its own lists the aliases in a static `EDITORS` array (FormulaBuilder's `formula`) and
 * registers them when its first instance is built, so before any grid exists the editor registry
 * does not know them yet, while the plugin is already registered.
 *
 * @param {string} name The editor name.
 * @returns {boolean}
 */
function isEditorProvidedByPlugin(name: string): boolean {
  return getPluginsNames().some((pluginName) => {
    const editors = (getPlugin(pluginName) as { EDITORS?: unknown } | undefined)?.EDITORS;

    return Array.isArray(editors) && editors.includes(name);
  });
}

/**
 * The problem code and the noun of each registry an option's name comes from.
 */
const REGISTRIES = {
  cellType: { code: 'unknownCellType', noun: 'cell type', has: hasCellType },
  editor: {
    code: 'unknownEditor',
    noun: 'editor',
    has: (name: string) => hasEditor(name) || isEditorProvidedByPlugin(name),
  },
  renderer: { code: 'unknownRenderer', noun: 'renderer', has: hasRenderer },
  validator: { code: 'unknownValidator', noun: 'validator', has: hasValidator },
} as const;

/**
 * How each level is named in a message.
 */
const LEVEL_PHRASES: Record<SettingsSchemaLevel, string> = {
  grid: 'at the grid level',
  columns: 'inside \'columns\'',
  cells: 'in the object \'cells\' returns',
  cell: 'inside \'cell\'',
};

/**
 * The defaults of the options, read once, on the first validation that needs them.
 */
let defaults: Record<string, unknown> | null = null;

/**
 * The state of one validation.
 */
interface Context {
  problems: FoundProblem[];
  /**
   * The settings objects being walked, to stop on a cycle.
   */
  ancestors: Set<object>;
  depth: number;
  /**
   * The grid-level settings object the walk started from, or the nested grid's.
   */
  gridSettings: Record<string, unknown> | null;
  hot: HotInstance | undefined;
  /**
   * The keys third-party plugins declare, accepted at every level.
   */
  pluginKeys: Set<string>;
  /**
   * What the walk reads once per grid. The object is shared by every copy of the context made
   * for a branch or a column, so a value read for one column is there for the next.
   */
  cache: { dataSample: DataSample | null };
}

/**
 * A few data rows, and the schema of a row, for the `columns[].data` check.
 */
interface DataSample {
  rows: unknown[];
  /**
   * The keys of the object rows, for a "did you mean" hint.
   */
  rowKeys: string[];
  dataSchema: unknown;
  dotNotation: boolean;
}

/**
 * A problem as the checks find it; `validateSettings()` adds the severity from the code.
 */
type FoundProblem = Omit<SettingsProblem, 'severity'>;

/**
 * The codes of the problems that may be intended, reported with the `warning` severity.
 */
const WARNING_CODES: SettingsProblemCode[] = ['unknownDataProperty', 'pluginDisabled'];

/**
 * The result of reading a property that may throw.
 */
type Read = { ok: true, value: unknown } | { ok: false };

/**
 * Returns the defaults of the options.
 *
 * @returns {object}
 */
function getDefaults(): Record<string, unknown> {
  defaults ??= metaSchemaFactory();

  return defaults;
}

/**
 * Reads a property, and tells when the read throws (a getter or a Proxy trap).
 *
 * @param {object} object The object.
 * @param {string|number} key The property.
 * @returns {Read}
 */
function readProperty(object: object, key: string | number): Read {
  try {
    return { ok: true, value: Reflect.get(object, key) };
  } catch {
    return { ok: false };
  }
}

/**
 * Tells whether an object has a key of its own, without throwing: a Proxy may throw from the trap behind it.
 *
 * @param {object} object The object.
 * @param {string} key The property.
 * @returns {boolean}
 */
function hasOwnKey(object: object, key: string): boolean {
  try {
    return Object.hasOwn(object, key);
  } catch {
    return false;
  }
}

/**
 * Tells whether a value is an object that holds settings: not `null`, an array, or a function.
 *
 * @param {*} value The value.
 * @returns {boolean}
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Joins a key to a path, as `filters.searchMode` or `columns[3]`.
 *
 * @param {string} path The parent path.
 * @param {string|number} key The key.
 * @returns {string}
 */
function joinPath(path: string, key: string | number): string {
  if (typeof key === 'number') {
    return `${path}[${key}]`;
  }

  return path === '' ? key : `${path}.${key}`;
}

/**
 * Joins words into a list: `a`, `a or b`, `a, b, or c`.
 *
 * @param {string[]} words The words.
 * @param {string} conjunction The last conjunction.
 * @returns {string}
 */
function joinWords(words: string[], conjunction: string): string {
  if (words.length <= 2) {
    return words.join(` ${conjunction} `);
  }

  return `${words.slice(0, -1).join(', ')}, ${conjunction} ${words[words.length - 1]}`;
}

/**
 * Formats a literal value for a message: a string in quotes, anything else as JSON.
 *
 * @param {*} value The value.
 * @returns {string}
 */
function formatLiteral(value: unknown): string {
  return typeof value === 'string' ? `'${value}'` : String(value);
}

/**
 * Names the kind of a value with its article, for a message: `a string`, `an array`, `null`.
 *
 * @param {*} value The value.
 * @returns {string}
 */
function describeKind(value: unknown): string {
  if (value === null || value === undefined) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return 'an array';
  }

  const kind = typeof value;

  return kind === 'object' || kind === 'undefined' ? `an ${kind}` : `a ${kind}`;
}

/**
 * Names a JSON Schema type or a runtime type with its article.
 *
 * @param {string} type The type.
 * @returns {string}
 */
function describeType(type: string): string {
  if (type === 'null') {
    return 'null';
  }

  return /^[aeiouAEIOU]|^HTML/.test(type) ? `an ${type}` : `a ${type}`;
}

/**
 * Tells whether a value has a runtime type that JSON cannot hold.
 *
 * @param {*} value The value.
 * @param {string} type The runtime type: `function`, `RegExp`, `HTMLElement`, `Date`, `Map`, `Set`, or `object`.
 * @returns {boolean}
 */
function hasRuntimeType(value: unknown, type: string): boolean {
  if (type === 'function') {
    return typeof value === 'function';
  }

  if (typeof value !== 'object' || value === null) {
    return false;
  }

  // A class instance (a `ThemeBuilder`); a plain object or an array is checked against the JSON form.
  if (type === 'object') {
    const prototype: unknown = Object.getPrototypeOf(value);

    return !Array.isArray(value) && prototype !== Object.prototype && prototype !== null;
  }

  if (type === 'HTMLElement') {
    return 'nodeType' in value && value.nodeType === 1;
  }

  return Object.prototype.toString.call(value) === `[object ${type}]`;
}

/**
 * Tells whether a value has a JSON Schema type.
 *
 * @param {*} value The value.
 * @param {string} type The JSON Schema type.
 * @returns {boolean}
 */
function hasJsonType(value: unknown, type: string): boolean {
  switch (type) {
    case 'null': return value === null;
    case 'array': return Array.isArray(value);
    case 'object': return isRecord(value);
    case 'integer': return Number.isInteger(value);
    case 'number': return typeof value === 'number';
    case 'string': return typeof value === 'string';
    case 'boolean': return typeof value === 'boolean';
    default: return false;
  }
}

/**
 * Resolves a `$ref` to an option (`#/properties/name`) to the option's node.
 *
 * @param {object} node The node.
 * @returns {object}
 */
function resolveOptionRef(node: JsonSchemaObject): JsonSchemaObject {
  const match = node.$ref?.match(/^#\/properties\/(.+)$/);

  return match ? (getOwnNode(settingsSchema.properties, match[1]) ?? {}) : node;
}

/**
 * Reads a node of a `properties` map by its own key only, so a key such as `__proto__` or
 * `constructor` never finds a member of `Object.prototype`.
 *
 * @param {object|undefined} properties The `properties` map.
 * @param {string} key The key.
 * @returns {object|undefined}
 */
function getOwnNode(
  properties: Record<string, JsonSchemaObject> | undefined,
  key: string,
): JsonSchemaObject | undefined {
  const isOwn = properties !== undefined && Object.prototype.hasOwnProperty.call(properties, key);

  return isOwn ? properties[key] : undefined;
}

/**
 * Returns the branches of a node: its `anyOf`, or the node itself.
 *
 * @param {object} node The node.
 * @returns {object[]}
 */
function getBranches(node: JsonSchemaObject): JsonSchemaObject[] {
  return (node.anyOf ?? [node]).map(resolveOptionRef);
}

/**
 * Tells whether a value has the kind a branch describes, before its contents are checked.
 *
 * @param {*} value The value.
 * @param {object} branch The branch.
 * @returns {boolean}
 */
function fitsBranch(value: unknown, branch: JsonSchemaObject): boolean {
  if (branch.not) {
    return false;
  }

  if (branch.$ref !== undefined) {
    return isRecord(value);
  }

  if (branch.enum) {
    return branch.enum.includes(value);
  }

  if (branch.minimum !== undefined && typeof value === 'number' && value < branch.minimum) {
    return false;
  }

  if (branch.type === undefined) {
    return true;
  }

  const types = Array.isArray(branch.type) ? branch.type : [branch.type];

  return types.some(type => hasJsonType(value, type));
}

/**
 * Builds the message of a value that fits no branch of its node.
 *
 * @param {*} value The value.
 * @param {object} node The node.
 * @returns {{code: SettingsProblemCode, message: string}}
 */
function describeMismatch(value: unknown, node: JsonSchemaObject): { code: SettingsProblemCode, message: string } {
  const expected: string[] = [];
  let literals: unknown[] = [];

  getBranches(node).forEach((branch) => {
    if (branch.enum) {
      literals = literals.concat(branch.enum);

    } else if (branch.$ref !== undefined) {
      expected.push('an object');

    } else if (branch.type !== undefined) {
      expected.push(...[branch.type].flat().map(describeType));
    }
  });

  expected.push(...(node['x-handsontable']?.runtimeTypes ?? []).map(describeType));
  expected.sort((a, b) => a.replace(/^an? /, '').localeCompare(b.replace(/^an? /, '')));

  if (literals.length > 0) {
    expected.push(`one of ${literals.map(formatLiteral).join(', ')}`);
  }

  const minimum = getBranches(node).find(branch => branch.minimum !== undefined)?.minimum;

  if (minimum !== undefined && typeof value === 'number' && value < minimum) {
    return { code: 'invalidValue', message: `Expected a number of at least ${minimum}, got ${value}.` };
  }

  const sameKindAsLiteral = literals.some(literal => typeof literal === typeof value);
  const got = sameKindAsLiteral ? formatLiteral(value) : describeKind(value);

  return {
    code: sameKindAsLiteral ? 'invalidValue' : 'invalidType',
    message: `Expected ${joinWords([...new Set(expected)], 'or')}, got ${got}.`,
  };
}

/**
 * Checks the contents of a value that fits a branch: the items of an array, the known
 * properties of an object, or a whole settings object.
 *
 * @param {*} value The value.
 * @param {object} branch The branch it fits.
 * @param {string} path The value's path.
 * @param {Context} context The validation state.
 */
function checkContents(value: unknown, branch: JsonSchemaObject, path: string, context: Context): void {
  if (branch.$ref !== undefined && isRecord(value)) {
    checkNestedSettings(value, SETTINGS_REFS[branch.$ref] ?? 'grid', path, context);

  } else if (Array.isArray(value) && branch.items) {
    const { items } = branch;

    // A hole (`[100, undefined, 200]`) gets the pass an unset property gets: the grid uses the default there.
    value.forEach((item, index) => {
      if (item !== undefined) {
        checkValue(item, items, joinPath(path, index), context);
      }
    });

  } else if (isRecord(value) && branch.properties) {
    const { properties } = branch;

    Object.keys(properties).forEach((key) => {
      if (!hasOwnKey(value, key)) {
        return;
      }

      const read = readProperty(value, key);
      const propertyPath = joinPath(path, key);

      if (!read.ok) {
        context.problems.push(unreadable(propertyPath));
      } else if (read.value !== undefined) {
        checkValue(read.value, properties[key], propertyPath, context);
      }
    });

    if (branch.additionalProperties === false) {
      reportUnknownKeys(value, Object.keys(properties), path, context);
    }
  }
}

/**
 * Checks a value against a schema node.
 *
 * @param {*} value The value.
 * @param {object} node The node.
 * @param {string} path The value's path.
 * @param {Context} context The validation state.
 */
function checkValue(value: unknown, node: JsonSchemaObject, path: string, context: Context): void {
  const resolved = resolveOptionRef(node);
  const runtimeTypes = resolved['x-handsontable']?.runtimeTypes ?? [];

  if (runtimeTypes.some(type => hasRuntimeType(value, type))) {
    return;
  }

  const candidates = getBranches(resolved).filter(branch => fitsBranch(value, branch));

  if (candidates.length === 0) {
    context.problems.push({ path, ...describeMismatch(value, resolved) });

    return;
  }

  // A value can fit several branches by kind (an array of arrays and an array of objects, for
  // `data`). It is valid when the contents of any one of them check out; otherwise the branch with
  // the fewest problems is the one the value meant, and its problems are reported.
  let closestProblems: FoundProblem[] | null = null;

  for (const branch of candidates) {
    const branchContext = { ...context, problems: [] };

    checkContents(value, branch, path, branchContext);

    if (branchContext.problems.length === 0) {
      return;
    }

    if (closestProblems === null || branchContext.problems.length < closestProblems.length) {
      closestProblems = branchContext.problems;
    }
  }

  // A loop, not `push(...problems)`: a long `data` array can hold more problems than a call takes arguments.
  (closestProblems ?? []).forEach(problem => context.problems.push(problem));
}

/**
 * Builds the problem of a property that throws when read.
 *
 * @param {string} path The property's path.
 * @returns {FoundProblem}
 */
function unreadable(path: string): FoundProblem {
  return { path, code: 'invalidValue', message: 'The value could not be read.' };
}

/**
 * Lists the option names that can be set at a level, for a "did you mean" hint.
 *
 * @param {SettingsSchemaLevel} level The level.
 * @returns {string[]}
 */
function getOptionNames(level: SettingsSchemaLevel): string[] {
  const names = Object.keys(LEVEL_NODES[level].properties ?? {});

  return level === 'grid' ? names : names.filter(name => name !== 'row' && name !== 'col');
}

/**
 * Describes the levels an option can be set at, for a message.
 *
 * @param {SettingsSchemaLevel[]} levels The levels.
 * @returns {string}
 */
function describeLevels(levels: SettingsSchemaLevel[]): string {
  return joinWords(levels.filter(level => level !== 'cells').map(level => LEVEL_PHRASES[level]), 'and');
}

/**
 * Builds the "did you mean" sentence of an unknown key, or an empty string when nothing is close.
 *
 * @param {string} key The unknown key.
 * @param {string[]} candidates The keys that are allowed there.
 * @returns {string}
 */
function getSuggestionHint(key: string, candidates: string[]): string {
  const suggestion = findClosestMatch(key, candidates);

  return suggestion === null ? '' : ` Did you mean '${suggestion}'?`;
}

/**
 * Lists the keys of the grid-level settings object of the option a path ends in, so a key that the grid
 * level reads but a column or cell level does not (`columns[0].filters.searchMode`) is not reported as a typo.
 *
 * @param {string} path The path of the settings object.
 * @returns {string[]}
 */
function getGridLevelKeys(path: string): string[] {
  const optionName = path.match(/([^.[\]]+)$/)?.[1];
  const node = optionName === undefined ? undefined : getOwnNode(settingsSchema.properties, optionName);
  const object = node && getBranches(node).find(branch => branch.additionalProperties === false);

  return Object.keys(object?.properties ?? {});
}

/**
 * Reports the own keys of a settings object that the schema node does not list. Only a node that
 * lists every key it accepts (`additionalProperties: false`) calls it. A key set to `undefined` is
 * unset, as it is at the top level, so it passes. A class instance is skipped, as for any other check
 * of its contents.
 *
 * @param {object} value The settings object.
 * @param {string[]} knownKeys The keys the node lists.
 * @param {string} path The object's path.
 * @param {Context} context The validation state.
 */
function reportUnknownKeys(value: Record<string, unknown>, knownKeys: string[], path: string, context: Context): void {
  let keys: string[];

  try {
    // A class instance (a `dataProvider` object with fields of its own) is not a settings literal.
    if (hasRuntimeType(value, 'object')) {
      return;
    }

    keys = Object.keys(value);
  } catch {
    // A Proxy may throw from `getPrototypeOf` or `ownKeys`; the keys it holds cannot be listed.
    context.problems.push(unreadable(path));

    return;
  }

  const gridKeys = getGridLevelKeys(path);

  keys.forEach((key) => {
    if (knownKeys.includes(key)) {
      return;
    }

    const read = readProperty(value, key);

    // A cleared key reads as `undefined` and is unset; one that cannot be read is still reported.
    if (read.ok && read.value === undefined) {
      return;
    }

    context.problems.push(gridKeys.includes(key) ? {
      path: joinPath(path, key),
      code: 'wrongLevel',
      message: `'${key}' can be set at the grid level only.`,
    } : {
      path: joinPath(path, key),
      code: 'unknownOption',
      message: `Unknown option '${key}'.${getSuggestionHint(key, knownKeys)}`,
    });
  });
}

/**
 * Reports a key that is not a known option at its level.
 *
 * @param {string} key The key.
 * @param {SettingsSchemaLevel} level The level.
 * @param {string} path The key's path.
 * @param {Context} context The validation state.
 */
function reportUnknownOption(key: string, level: SettingsSchemaLevel, path: string, context: Context): void {
  const candidates = level === 'grid' ?
    [...new Set(getOptionNames(level).concat(getHooks().getRegistered()))] :
    getOptionNames(level);
  const hint = getSuggestionHint(key, candidates);
  // A removed hook may also be a typo of an option (`hiddenColumn` for `hiddenColumns`).
  const removedIn = REMOVED_HOOKS.get(key);

  context.problems.push({
    path,
    code: 'unknownOption',
    message: removedIn === undefined ?
      `Unknown option '${key}'.${hint}` :
      `'${key}' is a hook that was removed in ${removedIn}.${hint}`,
  });
}

/**
 * Checks a hook callback: a function, or an array of functions, set at the grid level.
 *
 * @param {string} key The hook name.
 * @param {*} value The value.
 * @param {SettingsSchemaLevel} level The level.
 * @param {string} path The key's path.
 * @param {Context} context The validation state.
 */
function checkHook(key: string, value: unknown, level: SettingsSchemaLevel, path: string, context: Context): void {
  if (level !== 'grid') {
    context.problems.push({
      path,
      code: 'wrongLevel',
      message: `Hooks such as '${key}' can be set at the grid level only.`,
    });

  } else if (typeof value !== 'function' &&
             !(Array.isArray(value) && value.every(callback => typeof callback === 'function'))) {
    context.problems.push({
      path,
      code: 'invalidType',
      message: `Expected a function or an array of functions, got ${
        Array.isArray(value) ? 'an array that holds something else' : describeKind(value)}.`,
    });
  }
}

/**
 * Checks a name that must be registered: a cell type, an editor, a renderer, or a validator.
 *
 * @param {*} value The value.
 * @param {object} node The option's node.
 * @param {string} path The key's path.
 * @param {Context} context The validation state.
 */
function checkRegistryName(value: unknown, node: JsonSchemaObject, path: string, context: Context): void {
  const registryName = node['x-handsontable']?.registry;

  if (registryName === undefined || typeof value !== 'string') {
    return;
  }

  const registry = REGISTRIES[registryName];

  if (!registry.has(value)) {
    context.problems.push({
      path,
      code: registry.code,
      message: `'${value}' is not a registered ${registry.noun}.`,
    });
  }
}

/**
 * Tells whether a plugin is on: from the settings being checked when they set its key, else from
 * the instance, else from the key's default.
 *
 * @param {string} pluginName The plugin's registered name.
 * @param {string} pluginKey The plugin's settings key.
 * @param {Context} context The validation state.
 * @returns {boolean}
 */
function isPluginOn(pluginName: string, pluginKey: string, context: Context): boolean {
  const { gridSettings, hot } = context;

  if (gridSettings !== null && Object.prototype.hasOwnProperty.call(gridSettings, pluginKey)) {
    const read = readProperty(gridSettings, pluginKey);

    return !read.ok || Boolean(read.value);
  }

  if (hot) {
    try {
      return Boolean(hot.getPlugin(pluginName)?.isEnabled?.());
    } catch {
      // A destroyed instance: nothing to tell, so no problem to report.
      return true;
    }
  }

  return Boolean(getDefaults()[pluginKey]);
}

/**
 * Checks that the plugin an option belongs to is registered, and on when the option is not the
 * plugin's own switch.
 *
 * @param {string} key The option.
 * @param {*} value The value.
 * @param {object} node The option's node.
 * @param {string} path The key's path.
 * @param {Context} context The validation state.
 */
function checkPlugin(key: string, value: unknown, node: JsonSchemaObject, path: string, context: Context): void {
  const pluginName = node['x-handsontable']?.plugin;

  // `false`, `null` and `undefined` turn a plugin off, which needs no plugin.
  if (pluginName === undefined || value === false || value === null || value === undefined) {
    return;
  }

  if (!hasPlugin(pluginName)) {
    context.problems.push({
      path,
      code: 'pluginNotRegistered',
      message: `'${key}' has no effect: the ${pluginName} plugin is not registered.`,
    });

    return;
  }

  const pluginKey = getPlugin(pluginName)?.PLUGIN_KEY;
  // Only an option whose plugin is switched by another documented option of the same plugin
  // (`filterValueComparator` and `filters`). `undo` is the UndoRedo switch itself, even though
  // the plugin's key is `undoRedo`.
  const switchNode = pluginKey === undefined ? undefined : getOwnNode(settingsSchema.properties, pluginKey);

  if (pluginKey === undefined || pluginKey === key || switchNode?.['x-handsontable']?.plugin !== pluginName) {
    return;
  }

  // A single column or cell checked on its own (`level: 'columns'`) cannot know the grid's switches.
  if ((context.gridSettings !== null || context.hot !== undefined) && !isPluginOn(pluginName, pluginKey, context)) {
    context.problems.push({
      path,
      code: 'pluginDisabled',
      message: `'${key}' has no effect while the ${pluginName} plugin is off. Set '${pluginKey}' to enable it.`,
    });
  }
}

/**
 * Reads up to `DATA_SAMPLE_SIZE` data rows from the settings, or from the instance.
 *
 * @param {Context} context The validation state.
 * @returns {unknown[]}
 */
function readDataRows(context: Context): unknown[] {
  const { gridSettings, hot } = context;
  const data = gridSettings === null ? undefined : readProperty(gridSettings, 'data');

  if (data?.ok && Array.isArray(data.value)) {
    return data.value.slice(0, DATA_SAMPLE_SIZE);
  }

  if (data?.ok && data.value !== undefined) {
    return [];
  }

  const rows = [];

  try {
    const count = hot ? Math.min(hot.countSourceRows(), DATA_SAMPLE_SIZE) : 0;

    for (let row = 0; row < count; row += 1) {
      rows.push(hot?.getSourceDataAtRow(row));
    }
  } catch {
    // A destroyed instance has no rows to read.
  }

  return rows;
}

/**
 * Reads a setting from the settings being checked, else from the instance, else its default.
 *
 * @param {string} key The setting.
 * @param {Context} context The validation state.
 * @returns {*}
 */
function readSetting(key: string, context: Context): unknown {
  const { gridSettings, hot } = context;

  if (gridSettings !== null && Object.prototype.hasOwnProperty.call(gridSettings, key)) {
    const read = readProperty(gridSettings, key);

    return read.ok ? read.value : undefined;
  }

  try {
    return hot ? hot.getSettings()[key] : getDefaults()[key];
  } catch {
    return getDefaults()[key];
  }
}

/**
 * Returns the data sample, read on first use.
 *
 * @param {Context} context The validation state.
 * @returns {DataSample}
 */
function getDataSample(context: Context): DataSample {
  if (context.cache.dataSample === null) {
    const rows = readDataRows(context).filter(row => typeof row === 'object' && row !== null);
    const rowKeys = new Set<string>();

    rows.filter(isRecord).forEach((row) => {
      try {
        Object.keys(row).forEach(key => rowKeys.add(key));
      } catch {
        // A row whose keys cannot be listed adds no hint.
      }
    });

    context.cache.dataSample = {
      rows,
      rowKeys: [...rowKeys],
      dataSchema: readSetting('dataSchema', context),
      dotNotation: readSetting('dataDotNotation', context) !== false,
    };
  }

  return context.cache.dataSample;
}

/**
 * Tells whether a row holds a property, the way `DataMap#get` reads a cell: a key the row owns,
 * named exactly so, first; then a dotted path, whose steps are read with plain property access, so
 * a getter on a class of row objects counts there. A path through an array or an empty step counts.
 *
 * @param {*} row The row.
 * @param {string} property The property.
 * @param {boolean} dotNotation Whether a dotted property is a path.
 * @returns {boolean}
 */
function hasDataProperty(row: unknown, property: string, dotNotation: boolean): boolean {
  if (!isRecord(row)) {
    return false;
  }

  // A key the row only inherits renders an empty cell (`DataMap#get` tests `hasOwnProperty`).
  if (Object.prototype.hasOwnProperty.call(row, property) || !dotNotation || !property.includes('.')) {
    return Object.prototype.hasOwnProperty.call(row, property);
  }

  let current: unknown = row;

  for (const name of property.split('.')) {
    // `DataMap#get` stops at an empty step and renders an empty cell, so the path can still hold
    // a value in another row or later.
    if (current === null || current === undefined) {
      return true;
    }

    // A step may index into an array (`items.0.name`).
    const read = typeof current === 'object' && hasKey(current, name) ? readProperty(current, name) : null;

    if (read === null || !read.ok) {
      return false;
    }

    current = read.value;
  }

  return true;
}

/**
 * Tells whether an object's property lookup finds a key, without throwing.
 *
 * @param {object} object The object.
 * @param {string} key The key.
 * @returns {boolean}
 */
function hasKey(object: object, key: string): boolean {
  try {
    return key in object;
  } catch {
    return false;
  }
}

/**
 * Checks a `columns[].data` value against the data rows: a property some row has, or an index
 * inside the rows.
 *
 * @param {*} value The value.
 * @param {string} path The key's path.
 * @param {Context} context The validation state.
 */
function checkDataProperty(value: unknown, path: string, context: Context): void {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return;
  }

  const { rows, rowKeys, dataSchema, dotNotation } = getDataSample(context);

  // A `dataSchema` function builds each row's defaults from its index; reading it means calling it.
  if (typeof dataSchema === 'function') {
    return;
  }

  const objectRows = rows.filter(isRecord);
  const arrayRows = rows.filter(Array.isArray);

  if (typeof value === 'number' && arrayRows.length > 0 &&
      !arrayRows.some(row => value >= 0 && value < row.length)) {
    context.problems.push({
      path,
      code: 'unknownDataProperty',
      message: `No row of 'data' has a value at index ${value}.`,
    });

  } else if (typeof value === 'string' && objectRows.length > 0 &&
             !hasDataProperty(dataSchema, value, dotNotation) &&
             !objectRows.some(row => hasDataProperty(row, value, dotNotation))) {
    const suggestion = findClosestMatch(value, rowKeys);
    const hint = suggestion === null ? '' : ` Did you mean '${suggestion}'?`;

    context.problems.push({
      path,
      code: 'unknownDataProperty',
      message: `No row of 'data' has the property '${value}'.${hint}`,
    });
  }
}

/**
 * Tells whether a key is accepted without being a documented option: an internal key, a key the
 * grid writes on its own settings object, or a key a registered third-party plugin declares.
 *
 * @param {string} key The key.
 * @param {Context} context The validation state.
 * @returns {boolean}
 */
function isAcceptedKey(key: string, context: Context): boolean {
  return context.pluginKeys.has(key) || RUNTIME_KEY.test(key) ||
    internals.internalOptions.includes(key);
}

/**
 * Checks one key of a settings object.
 *
 * @param {string} key The key.
 * @param {*} value The value.
 * @param {SettingsSchemaLevel} level The level of the settings object.
 * @param {string} path The key's path.
 * @param {Context} context The validation state.
 */
function checkOption(key: string, value: unknown, level: SettingsSchemaLevel, path: string, context: Context): void {
  const option = getOwnNode(settingsSchema.properties, key);
  const levelNode = getOwnNode(LEVEL_NODES[level].properties, key);

  // `row` and `col` of a `cell` entry are positions, not options.
  if (option === undefined && levelNode !== undefined) {
    checkValue(value, levelNode, path, context);

    return;
  }

  const isHook = option?.['x-handsontable']?.hook || (option === undefined && getHooks().isRegistered(key));

  // An unset value is never a problem, whatever the key or the level. Core skips a hook set to
  // anything but a function, so `afterChange: enabled && callback` is fine too.
  if (value === undefined || (isHook && (value === null || value === false))) {
    return;
  }

  if (isHook) {
    checkHook(key, value, level, path, context);

    return;
  }

  if (option === undefined) {
    if (!isAcceptedKey(key, context)) {
      reportUnknownOption(key, level, path, context);
    }

    return;
  }

  const levels = option['x-handsontable']?.levels ?? [];

  if (!levels.includes(level)) {
    context.problems.push({ path, code: 'wrongLevel', message: `'${key}' can be set ${describeLevels(levels)} only.` });

    return;
  }

  // Every row of a large `data` set would make the check as slow as the data is long; the rows
  // past the sample are not type-checked, as the `columns[].data` check reads the sample only.
  const checked = key === 'data' && level === 'grid' && Array.isArray(value) ? value.slice(0, DATA_SAMPLE_SIZE) : value;

  const problemCount = context.problems.length;

  checkValue(checked, levelNode ?? option, path, context);

  // A value of the wrong type gets one problem, not one more for each check that follows. A problem
  // deeper inside the value (`filters.searchMode`) does not stop them: the plugin may still be missing.
  if (context.problems.slice(problemCount).some(problem => problem.path === path)) {
    return;
  }

  checkRegistryName(value, option, path, context);
  checkPlugin(key, value, option, path, context);

  if (key === 'data' && level === 'columns') {
    checkDataProperty(value, path, context);
  }
}

/**
 * Checks every key of a settings object.
 *
 * @param {object} settings The settings object.
 * @param {SettingsSchemaLevel} level Its level.
 * @param {string} path Its path.
 * @param {Context} context The validation state.
 */
function checkSettingsObject(
  settings: Record<string, unknown>,
  level: SettingsSchemaLevel,
  path: string,
  context: Context,
): void {
  const keys = Object.keys(settings);

  keys.forEach((key) => {
    const read = readProperty(settings, key);
    const keyPath = joinPath(path, key);

    if (read.ok) {
      checkOption(key, read.value, level, keyPath, context);
    } else {
      context.problems.push(unreadable(keyPath));
    }
  });

  const required = LEVEL_NODES[level].required ?? [];

  // Only an entry of the `cell` option needs a position; the `level: 'cell'` input does not.
  if (path !== '' && required.some(key => !keys.includes(key))) {
    context.problems.push({
      path,
      code: 'invalidValue',
      message: `A 'cell' entry needs ${joinWords(required.map(key => `'${key}'`), 'and')}.`,
    });
  }
}

/**
 * Checks a settings object nested in another: an entry of `columns` or `cell`, or the grid of
 * the `handsontable` cell type.
 *
 * @param {object} settings The settings object.
 * @param {SettingsSchemaLevel} level Its level.
 * @param {string} path Its path.
 * @param {Context} context The validation state.
 */
function checkNestedSettings(
  settings: Record<string, unknown>,
  level: SettingsSchemaLevel,
  path: string,
  context: Context,
): void {
  if (context.ancestors.has(settings) || context.depth >= MAX_DEPTH) {
    return;
  }

  // A nested grid has its own data and plugins; a column or a cell shares the enclosing grid's.
  const nestedContext: Context = level === 'grid' ? {
    ...context,
    gridSettings: settings,
    hot: undefined,
    cache: { dataSample: null },
  } : { ...context };

  nestedContext.depth += 1;
  context.ancestors.add(settings);
  checkSettingsObject(settings, level, path, nestedContext);
  context.ancestors.delete(settings);
}

/**
 * Lists the settings keys the registered third-party plugins declare.
 *
 * @returns {Set<string>}
 */
function readPluginKeys(): Set<string> {
  const keys = new Set<string>();

  const { builtInPlugins } = internals;

  getPluginsNames().forEach((name) => {
    const pluginClass = getPlugin(name);
    const settingKeys = pluginClass?.SETTING_KEYS;

    // A plugin that does not declare its own key inherits `BasePlugin`'s `'base'`, which says
    // nothing about where it comes from.
    const ownKey = pluginClass !== undefined && Object.prototype.hasOwnProperty.call(pluginClass, 'PLUGIN_KEY') ?
      pluginClass.PLUGIN_KEY : undefined;

    // A built-in plugin's options are in the schema. Its key is not always one of them (UndoRedo's
    // key is `undoRedo`, its option `undo`), so accepting it would let a no-op key pass.
    if (pluginClass === undefined || (ownKey !== undefined && builtInPlugins.includes(ownKey))) {
      return;
    }

    if (ownKey) {
      keys.add(ownKey);
    }

    if (Array.isArray(settingKeys)) {
      settingKeys.forEach(key => keys.add(key));
    }
  });

  return keys;
}

/**
 * Checks a settings object against the settings schema and against what is registered on the
 * page, without applying anything. Use it before passing a stored, user-edited, or generated
 * configuration to `new Handsontable()` or `updateSettings()`.
 *
 * Each problem has a `path` (`columns[3].type`), a `code`, a `severity`, and a `message`. A `warning`
 * (`unknownDataProperty`, `pluginDisabled`) is a likely mistake that may be intended, and does not make
 * the settings invalid; every other code is an `error`. A minor release can add a code. The codes are:
 * `unknownOption` (with a "did you mean" hint when an option is close; also a misspelled key inside the
 * settings object of a plugin option that lists every key, as in `filters.serchMode`), `wrongLevel` (a grid-only
 * option inside `columns`, for example), `invalidType` and `invalidValue` (a value of the wrong
 * type, or outside the allowed set), `unknownCellType`, `unknownEditor`, `unknownRenderer` and
 * `unknownValidator` (a name that is not registered), `pluginNotRegistered` (an option of a
 * plugin the page does not register), `pluginDisabled` (an option of a plugin that is off),
 * `unknownDataProperty` (a `columns[].data` property that no data row has), and
 * `invalidSettings` (the input is not a settings object).
 *
 * The check never throws and never calls a function it finds in the settings (`columns`,
 * `cells`, a renderer). Custom keys stored in the cell meta are reported as `unknownOption`;
 * filter them out by `code` and `path` if your application uses them.
 *
 * ```js
 * import { validateSettings } from 'handsontable/settingsSchema';
 *
 * const { valid, problems } = validateSettings(JSON.parse(storedConfig));
 *
 * if (valid) {
 *   hot.updateSettings(JSON.parse(storedConfig));
 * }
 * ```
 *
 * @since 19.0.0
 * @param {*} settings The settings object to check.
 * @param {object} [options] The validation options.
 * @param {Core} [options.hot] The instance the settings are meant for. Its data rows and its
 * plugins' state are used when the settings do not carry them, as for an `updateSettings()` payload.
 * @param {'grid'|'columns'|'cells'|'cell'} [options.level='grid'] What the object is, named as in the
 * schema's levels: the grid settings, one entry of `columns`, the object a `cells` function returns, or
 * one entry of `cell`.
 * @returns {object} An object with `valid` (`true` when no problem of the `error` severity was found) and
 * `problems`, an array of `{ path, code, severity, message }`.
 */
export function validateSettings(
  settings: unknown,
  options: ValidateSettingsOptions | null = {},
): SettingsValidationResult {
  const problems: FoundProblem[] = [];

  try {
    const { hot, level: levelOption = 'grid' }: ValidateSettingsOptions = options ?? {};
    const levelName = String(levelOption);
    const level = Object.prototype.hasOwnProperty.call(INPUT_LEVELS, levelName) ? INPUT_LEVELS[levelName] : undefined;

    if (level === undefined) {
      problems.push({
        path: '',
        code: 'invalidSettings',
        message: `Unknown level ${formatLiteral(levelOption)}. Expected 'grid', 'columns', 'cells', or 'cell'.`,
      });

    } else if (!isRecord(settings)) {
      problems.push({
        path: '',
        code: 'invalidSettings',
        message: `Expected a settings object, got ${describeKind(settings)}.`,
      });

    } else {
      checkSettingsObject(settings, level, '', {
        problems,
        ancestors: new Set([settings]),
        depth: 0,
        gridSettings: level === 'grid' ? settings : null,
        hot,
        pluginKeys: readPluginKeys(),
        cache: { dataSample: null },
      });
    }
  } catch {
    // A read the checks do not guard threw: a revoked Proxy as the settings object, or a Proxy
    // nested deeper whose traps throw. The problems found before it are kept.
    problems.push({ path: '', code: 'invalidSettings', message: 'The settings object could not be read.' });
  }

  const results: SettingsProblem[] = problems.map(problem => ({
    ...problem,
    severity: WARNING_CODES.includes(problem.code) ? 'warning' : 'error',
  }));

  return { valid: results.every(({ severity }) => severity === 'warning'), problems: results };
}
