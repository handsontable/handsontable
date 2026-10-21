/**
 * Generates the JSON Schema of the grid, column, and cell settings.
 *
 * Writes `src/settingsSchema/schema.generated.ts`, a TypeScript module that the public
 * `handsontable/settingsSchema` entry re-exports and `validateSettings()` reads. The file is
 * gitignored and written by the `build:settings-schema` task, which the ES, CommonJS, and
 * type builds, the `lint` pipeline, and the `test:unit` pipeline run first, so it cannot go
 * stale in a pull request.
 *
 * Two sources, read straight from `src/` (no core build needed):
 *   - `src/dataMap/metaManager/metaSchema.ts` gives the list of options and, from each
 *     option's JSDoc, its levels (`@configScope`), its plugin (`@category`), `@since`, and a
 *     short description. It is the runtime list of options, so it decides what is covered.
 *   - The `GridSettings` and `ColumnSettings` types give each option's value type, through
 *     the TypeScript compiler API, because the JSDoc `@type` is too coarse for enums
 *     (`stretchH` is `string` there and `'none' | 'all' | 'last'` in the type). An option the
 *     types do not declare falls back to its JSDoc `@type`.
 *
 * A value JSON cannot hold (a function, a class, a `RegExp`, a DOM element) is not part of
 * a schema node's `type`. It is listed in the node's `x-handsontable.runtimeTypes`, so a
 * JSON validator rejects it while `validateSettings()` still accepts it at runtime.
 *
 * Usage (from the repo root):
 *   npm run build:settings-schema --prefix handsontable
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

import { parseOptions } from './utils/option-levels.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const PACKAGE_DIR = resolve(currentDir, '..');
const META_SCHEMA = resolve(PACKAGE_DIR, 'src', 'dataMap', 'metaManager', 'metaSchema.ts');
const CORE_SETTINGS = resolve(PACKAGE_DIR, 'src', 'core', 'settings.ts');
const PUBLIC_SETTINGS = resolve(PACKAGE_DIR, 'src', 'settings.ts');
const OUTPUT = resolve(PACKAGE_DIR, 'src', 'settingsSchema', 'schema.generated.ts');

/**
 * How deep the converter follows nested object types. Deeper levels are emitted as `{}`
 * (any value), which keeps a recursive or very wide type from blowing up the output.
 */
const MAX_DEPTH = 4;

/**
 * Options that point back at a whole settings object. The converter emits a `$ref` for
 * these types instead of expanding them again.
 */
const SELF_REFERENCES = new Map([
  ['GridSettings', '#'],
  ['ColumnSettings', '#/$defs/columnSettings'],
  ['CellMeta', '#/$defs/columnSettings'],
  ['CellProperties', '#/$defs/columnSettings'],
]);

/**
 * Options whose string value names an item of a registry. `validateSettings()` checks such a
 * name against what is registered on the page.
 */
const REGISTRY_OPTIONS = {
  type: 'cellType',
  editor: 'editor',
  renderer: 'renderer',
  validator: 'validator',
};

/**
 * Options the types declare but `metaSchema.ts` does not, with the levels they are read at.
 * They are read from the cell meta, so every level accepts them.
 */
const TYPE_ONLY_OPTIONS = ['getValue', 'handsontable'];

/**
 * The plugins of the `CellMeta` keys that belong to one.
 */
const CELL_META_PLUGINS = {
  comment: 'Comments',
};

/**
 * The hook-shaped keys of `GridSettings`. Hooks are added to the schema at runtime from the
 * registered hook list, so the generator skips them. Mirrors `HookSettingKey` in `src/settings.ts`.
 */
const HOOK_KEY = /^(before|after|modify)[A-Z]/;
const NON_PREFIXED_HOOK_KEYS = ['construct', 'init', 'hasExternalDataSource', 'dialogFocusNextElement',
  'dialogFocusPreviousElement'];

/**
 * Object types that JSON cannot represent, mapped to the runtime type name `validateSettings()` checks.
 */
const RUNTIME_OBJECT_TYPES = new Map([
  ['RegExp', 'RegExp'],
  ['Date', 'Date'],
  ['Function', 'function'],
  ['Map', 'Map'],
  ['Set', 'Set'],
]);

/**
 * Reads the JSDoc blocks of `metaSchema.ts`, keyed by option name.
 *
 * @param {string} src The contents of `metaSchema.ts`.
 * @returns {Map<string, string>} The block text of each option, with the leading `*` stripped.
 */
function readDocBlocks(src) {
  // The same pattern `parseOptions()` uses, so both read the same block for each option.
  const blockRe = /\/\*\*([\s\S]*?)\*\/\s*\n {4}([a-zA-Z_][a-zA-Z0-9_]*)\s*[:(]/g;
  const blocks = new Map();

  for (const [, rawBlock, name] of src.matchAll(blockRe)) {
    blocks.set(name, rawBlock.split('\n').map(line => line.replace(/^\s*\*\s?/, '')).join('\n'));
  }

  return blocks;
}

/**
 * Returns the first paragraph of a JSDoc block as plain text, for the schema `description`.
 *
 * @param {string} block The JSDoc block.
 * @returns {string} The description, or an empty string.
 */
function readDescription(block) {
  const paragraph = block.trim().split(/\n\s*\n/)[0] ?? '';

  if (paragraph.startsWith('@')) {
    return '';
  }

  return paragraph
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converts a JSDoc `@type` expression into a schema node. Used only for the options the
 * TypeScript types do not declare.
 *
 * @param {string|undefined} expression The `@type` expression, e.g. `boolean|object`.
 * @returns {object} The schema node.
 */
function fromJsDocType(expression) {
  if (!expression || expression.trim() === '*') {
    return {};
  }

  const members = [];

  expression.split('|').map(part => part.trim()).forEach((part) => {
    if (/^function\b|^Function$/.test(part)) {
      members.push({ runtimeTypes: ['function'] });

    } else if (['string', 'number', 'boolean', 'object', 'null'].includes(part)) {
      members.push({ type: part });

    } else if (/\[\]$|^Array/.test(part)) {
      members.push({ type: 'array' });

    } else if (part !== 'undefined') {
      // A class instance, such as a `ThemeBuilder`. JSON has no way to hold one.
      members.push({ runtimeTypes: ['object'] });
    }
  });

  return mergeMembers(members);
}

/**
 * Tells whether a type has any of the given type flags.
 *
 * @param {ts.Type} type The type.
 * @param {...number} flags The flags.
 * @returns {boolean}
 */
function hasFlag(type, ...flags) {
  // TypeScript's type flags are a bit field.
  // eslint-disable-next-line no-bitwise
  return flags.some(flag => (type.flags & flag) !== 0);
}

/**
 * Merges the converted members of a union into one schema node: plain types into one `type`
 * list, literals into one `enum`, runtime types into `x-handsontable.runtimeTypes`, and
 * anything else into `anyOf`.
 *
 * @param {object[]} members The converted members. A member may carry `runtimeTypes`.
 * @returns {object} The schema node.
 */
function mergeMembers(members) {
  const types = new Set();
  const enumValues = [];
  const runtimeTypes = new Set();
  const others = [];
  let isAny = false;

  members.forEach((member) => {
    (member.runtimeTypes ?? []).forEach(type => runtimeTypes.add(type));

    const { runtimeTypes: _runtimeTypes, ...rest } = member;
    const keys = Object.keys(rest);

    if (member.any) {
      isAny = true;

    } else if (keys.length === 1 && keys[0] === 'type' && typeof rest.type === 'string') {
      types.add(rest.type);

    } else if (keys.length === 1 && keys[0] === 'enum') {
      enumValues.push(...rest.enum);

    } else if (keys.length > 0) {
      others.push(rest);
    }
  });

  if (isAny) {
    return {};
  }

  // A literal of a type the union also accepts whole (`'auto' | string`) adds nothing.
  const literals = [...new Set(enumValues)].filter(value => !types.has(typeof value));
  const branches = [];

  if (types.size > 0) {
    branches.push({ type: types.size === 1 ? [...types][0] : [...types].sort() });
  }

  if (literals.length > 0) {
    branches.push({ enum: literals });
  }

  branches.push(...others);

  let node;

  if (branches.length === 0) {
    // Nothing JSON can hold: a function-only option, for example.
    node = runtimeTypes.size > 0 ? { not: {} } : {};

  } else if (branches.length === 1) {
    node = { ...branches[0] };

  } else {
    node = { anyOf: branches };
  }

  if (runtimeTypes.size > 0) {
    node['x-handsontable'] = { runtimeTypes: [...runtimeTypes].sort() };
  }

  return node;
}

/**
 * Adds `null` to the values a node accepts. Used for an option whose default is `null`, which
 * its type does not always list (`colHeaders`).
 *
 * @param {object} node The schema node.
 * @returns {object} The node that also accepts `null`.
 */
function allowNull(node) {
  const { 'x-handsontable': annotations, description, ...accepted } = node;
  let merged;

  if (accepted.anyOf) {
    merged = { anyOf: [...accepted.anyOf, { type: 'null' }] };

  } else if (accepted.not) {
    // Nothing JSON can hold but `null`.
    merged = { type: 'null' };

  } else {
    merged = mergeMembers([accepted, { type: 'null' }]);
  }

  return {
    ...(description ? { description } : {}),
    ...merged,
    ...(annotations ? { 'x-handsontable': annotations } : {}),
  };
}

/**
 * Tells whether a node accepts `null`.
 *
 * @param {object} node The schema node.
 * @returns {boolean}
 */
function acceptsNull(node) {
  const branches = node.anyOf ?? [node];

  return Object.keys(node).every(key => key === 'x-handsontable' || key === 'description') ||
    branches.some(branch => [branch.type].flat().includes('null'));
}

/**
 * Converts TypeScript types into schema nodes.
 */
class TypeConverter {
  /**
   * The type checker of the program the types come from.
   *
   * @type {ts.TypeChecker}
   */
  checker;

  /**
   * @param {ts.TypeChecker} checker The type checker.
   */
  constructor(checker) {
    this.checker = checker;
  }

  /**
   * Converts a type into a schema node.
   *
   * @param {ts.Type} type The type to convert.
   * @param {number} depth How many object levels deep the type is.
   * @returns {object} The schema node.
   */
  convert(type, depth = 0) {
    return mergeMembers(this.#toMembers(type, depth));
  }

  /**
   * Converts a type into the list of union members `mergeMembers()` combines.
   *
   * @param {ts.Type} type The type to convert.
   * @param {number} depth How many object levels deep the type is.
   * @returns {object[]} The members.
   */
  #toMembers(type, depth) {
    if (type.isUnion()) {
      return type.types.flatMap(member => this.#toMembers(member, depth));
    }

    if (hasFlag(type, ts.TypeFlags.Any, ts.TypeFlags.Unknown)) {
      return [{ any: true }];
    }

    if (hasFlag(type, ts.TypeFlags.Undefined, ts.TypeFlags.Void, ts.TypeFlags.Never)) {
      return [];
    }

    if (hasFlag(type, ts.TypeFlags.Null)) {
      return [{ type: 'null' }];
    }

    if (hasFlag(type, ts.TypeFlags.StringLiteral)) {
      return [{ enum: [type.value] }];
    }

    if (hasFlag(type, ts.TypeFlags.NumberLiteral)) {
      return [{ enum: [type.value] }];
    }

    if (hasFlag(type, ts.TypeFlags.BooleanLiteral)) {
      // `boolean` reaches here as `true | false`; the merge folds the pair back into one type.
      return [{ type: 'boolean' }];
    }

    if (hasFlag(type, ts.TypeFlags.StringLike)) {
      return [{ type: 'string' }];
    }

    if (hasFlag(type, ts.TypeFlags.NumberLike)) {
      return [{ type: 'number' }];
    }

    if (hasFlag(type, ts.TypeFlags.BooleanLike)) {
      return [{ type: 'boolean' }];
    }

    if (hasFlag(type, ts.TypeFlags.NonPrimitive)) {
      return [{ type: 'object' }];
    }

    if (type.isIntersection()) {
      return this.#fromIntersection(type, depth);
    }

    if (hasFlag(type, ts.TypeFlags.Object)) {
      return [this.#fromObject(type, depth)];
    }

    return [{ any: true }];
  }

  /**
   * Converts an intersection. `string & {}` (the widening idiom for string unions) is a string.
   *
   * @param {ts.IntersectionType} type The intersection.
   * @param {number} depth How many object levels deep the type is.
   * @returns {object[]} The members.
   */
  #fromIntersection(type, depth) {
    const primitive = type.types.find(member => hasFlag(member, ts.TypeFlags.Primitive));

    if (primitive) {
      return this.#toMembers(primitive, depth);
    }

    return [this.#fromObject(type, depth)];
  }

  /**
   * Converts an object type: a function, an array, a known non-JSON class, or a plain object
   * with named properties.
   *
   * @param {ts.Type} type The object type.
   * @param {number} depth How many object levels deep the type is.
   * @returns {object} The member.
   */
  #fromObject(type, depth) {
    const { checker } = this;
    const name = type.aliasSymbol?.getName() ?? type.getSymbol()?.getName();

    if (SELF_REFERENCES.has(name)) {
      return { $ref: SELF_REFERENCES.get(name) };
    }

    if (RUNTIME_OBJECT_TYPES.has(name)) {
      return { runtimeTypes: [RUNTIME_OBJECT_TYPES.get(name)] };
    }

    if (type.getCallSignatures().length > 0 || type.getConstructSignatures().length > 0) {
      return { runtimeTypes: ['function'] };
    }

    if (checker.isArrayType(type) || checker.isTupleType(type)) {
      const elements = checker.getTypeArguments(type);
      const items = elements.length > 0 ? mergeMembers(elements.map(element => this.convert(element, depth + 1))) : {};

      return Object.keys(items).length > 0 ? { type: 'array', items } : { type: 'array' };
    }

    if (this.#isDomOrLibClass(type)) {
      return { runtimeTypes: [name === 'Intl' ? 'object' : this.#runtimeName(type)] };
    }

    return this.#fromPlainObject(type, depth);
  }

  /**
   * Converts an object type with named properties.
   *
   * @param {ts.Type} type The object type.
   * @param {number} depth How many object levels deep the type is.
   * @returns {object} The member.
   */
  #fromPlainObject(type, depth) {
    const { checker } = this;

    if (depth >= MAX_DEPTH) {
      return { type: 'object' };
    }

    const properties = {};

    checker.getPropertiesOfType(type)
      .filter(property => !property.getName().startsWith('_'))
      .sort((a, b) => a.getName().localeCompare(b.getName()))
      .forEach((property) => {
        properties[property.getName()] = this.convert(checker.getTypeOfSymbol(property), depth + 1);
      });

    const node = { type: 'object' };

    if (Object.keys(properties).length > 0) {
      node.properties = properties;
    }

    return node;
  }

  /**
   * Tells whether an object type is a class from the DOM or the ECMAScript library (an
   * `HTMLElement`, a `KeyboardEvent`, an `Intl` options bag excluded).
   *
   * @param {ts.Type} type The object type.
   * @returns {boolean}
   */
  #isDomOrLibClass(type) {
    const declarations = type.getSymbol()?.getDeclarations() ?? [];
    const fromLib = declarations.length > 0 &&
      declarations.every(declaration => /[\\/]typescript[\\/]lib[\\/]lib\./.test(declaration.getSourceFile().fileName));

    // An `Intl.*Options` bag is a plain object of strings, numbers and booleans, which JSON can hold.
    return fromLib && !/Options$/.test(type.getSymbol().getName());
  }

  /**
   * Returns the runtime type name a lib class is checked as.
   *
   * @param {ts.Type} type The object type.
   * @returns {string}
   */
  #runtimeName(type) {
    const name = type.getSymbol().getName();

    return /^(HTML|SVG)?Element$|^HTML\w*Element$|^Node$/.test(name) ? 'HTMLElement' : 'object';
  }
}

/**
 * Creates a program over the settings types and returns the properties of an interface.
 *
 * @returns {{converter: TypeConverter, grid: Map<string, ts.Type>, column: Map<string, ts.Type>,
 *   cellMeta: Map<string, ts.Type>}}
 */
function readSettingsTypes() {
  const configPath = resolve(PACKAGE_DIR, 'tsconfig.json');
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  const { options } = ts.parseJsonConfigFileContent(config.config, ts.sys, PACKAGE_DIR);
  const program = ts.createProgram([CORE_SETTINGS, PUBLIC_SETTINGS], { ...options, noEmit: true });
  const checker = program.getTypeChecker();

  /**
   * Reads the properties of an exported interface.
   *
   * @param {string} file The file that declares the interface.
   * @param {string} name The interface name.
   * @returns {Map<string, ts.Type>}
   */
  const readInterface = (file, name) => {
    const sourceFile = program.getSourceFile(file);
    const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
    const symbol = checker.getExportsOfModule(moduleSymbol).find(exported => exported.getName() === name);

    if (!symbol) {
      throw new Error(`${name} is not exported from ${file}.`);
    }

    const declared = checker.getDeclaredTypeOfSymbol(symbol);

    return new Map(checker.getPropertiesOfType(declared)
      .map(property => [property.getName(), checker.getTypeOfSymbol(property)]));
  };

  return {
    converter: new TypeConverter(checker),
    grid: readInterface(CORE_SETTINGS, 'GridSettings'),
    column: readInterface(PUBLIC_SETTINGS, 'ColumnSettings'),
    cellMeta: readInterface(PUBLIC_SETTINGS, 'CellMeta'),
  };
}

/**
 * Tells whether a `GridSettings` key is a hook callback.
 *
 * @param {string} key The key.
 * @returns {boolean}
 */
function isHookKey(key) {
  return HOOK_KEY.test(key) || NON_PREFIXED_HOOK_KEYS.includes(key);
}

/**
 * Builds the schema object.
 *
 * @returns {object} The JSON Schema.
 */
export function buildSettingsSchema() {
  const metaSource = readFileSync(META_SCHEMA, 'utf8');
  const options = parseOptions(metaSource);
  const blocks = readDocBlocks(metaSource);
  const { converter, grid, column, cellMeta } = readSettingsTypes();
  const properties = {};
  const columnProperties = {};
  const cellProperties = {};
  // `@private` options (`preventWheel`) and the meta bookkeeping keys (`_userDefinedMetaProps`)
  // are real keys of the settings object but not part of the documented options. The schema
  // lists them by name only, so `validateSettings()` does not report them as unknown.
  const internalOptions = [...blocks]
    .filter(([, block]) => /^@private\s*$/m.test(block) || !/@memberof Options#/.test(block))
    .map(([name]) => name)
    .sort();
  const known = new Set([...options.map(option => option.name), ...internalOptions]);

  /**
   * Builds the schema node of one option.
   *
   * @param {string} name The option name.
   * @param {ts.Type|undefined} type The option's type, when the types declare it.
   * @param {object} annotations The `x-handsontable` annotations.
   * @returns {object}
   */
  const buildNode = (name, type, annotations) => {
    const block = blocks.get(name) ?? '';
    const node = type ? converter.convert(type) : fromJsDocType((block.match(/@type\s+\{(.+)\}/) || [])[1]);
    const description = readDescription(block);
    const nullable = new RegExp(`\\n {4}${name}: null,`).test(metaSource);

    if (nullable && !acceptsNull(node)) {
      return allowNull({
        ...(description ? { description } : {}),
        ...node,
        'x-handsontable': { ...annotations, ...node['x-handsontable'] },
      });
    }

    return {
      ...(description ? { description } : {}),
      ...node,
      'x-handsontable': { ...annotations, ...node['x-handsontable'] },
    };
  };

  options.forEach(({ name, category, levels, since }) => {
    properties[name] = buildNode(name, grid.get(name), {
      levels,
      ...(category === 'Core' ? {} : { plugin: category }),
      ...(since ? { since } : {}),
      ...(REGISTRY_OPTIONS[name] ? { registry: REGISTRY_OPTIONS[name] } : {}),
    });
  });

  TYPE_ONLY_OPTIONS.forEach((name) => {
    known.add(name);
    properties[name] = buildNode(name, grid.get(name), { levels: ['grid', 'columns', 'cells', 'cell'] });
  });

  // `CellMeta` adds a few cell-level keys that are not options of the grid (`comment`, `valid`).
  // A `cell` entry or a `cells` function may set them, so they are known at those levels.
  [...cellMeta.keys()].filter(name => !grid.has(name)).forEach((name) => {
    known.add(name);
    properties[name] = buildNode(name, cellMeta.get(name), {
      levels: ['columns', 'cells', 'cell'],
      ...(CELL_META_PLUGINS[name] ? { plugin: CELL_META_PLUGINS[name] } : {}),
    });
  });

  const uncovered = [...grid.keys()].filter(key => !known.has(key) && !isHookKey(key));

  if (uncovered.length > 0) {
    throw new Error(`GridSettings declares option(s) metaSchema.ts does not: ${uncovered.join(', ')}. ` +
      'Document them in metaSchema.ts, or list them in TYPE_ONLY_OPTIONS in this script.');
  }

  Object.keys(properties).sort().forEach((name) => {
    const { levels } = properties[name]['x-handsontable'];

    if (levels.includes('columns')) {
      // `ColumnSettings` redeclares a few options (`data`, `filters`) with a column meaning.
      const columnType = column.get(name);
      const sameAsGrid = !columnType || columnType === grid.get(name);

      if (sameAsGrid) {
        columnProperties[name] = { $ref: `#/properties/${name}` };
      } else {
        const columnNode = converter.convert(columnType);
        // Keep the option's levels and plugin, but the runtime types of the column-level type.
        const { runtimeTypes: _gridRuntimeTypes, ...annotations } = properties[name]['x-handsontable'];

        columnProperties[name] = {
          ...columnNode,
          'x-handsontable': { ...annotations, ...columnNode['x-handsontable'] },
        };
      }
    }

    if (levels.includes('cell')) {
      cellProperties[name] = columnProperties[name] ?? { $ref: `#/properties/${name}` };
    }
  });

  cellProperties.row = { type: 'integer', minimum: 0 };
  cellProperties.col = { type: 'integer', minimum: 0 };

  // `cell` is typed `object[]`; its entries are cell settings with a position.
  properties.cell.type = 'array';
  properties.cell.items = { $ref: '#/$defs/cellSettings' };

  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://handsontable.com/schemas/settings.json',
    title: 'Handsontable settings',
    description: 'The configuration options of a Handsontable instance. Generated from the option ' +
      'definitions. A value JSON cannot hold (a function, a class instance) is listed in ' +
      '`x-handsontable.runtimeTypes` instead of `type`.',
    type: 'object',
    properties,
    'x-handsontable': { internalOptions },
    $defs: {
      columnSettings: {
        description: 'The options of one entry of the `columns` option.',
        type: 'object',
        properties: columnProperties,
      },
      cellSettings: {
        description: 'The options of one entry of the `cell` option.',
        type: 'object',
        properties: cellProperties,
        required: ['row', 'col'],
      },
    },
  };
}

/**
 * Renders the schema as the TypeScript module the package compiles.
 *
 * @param {object} schema The schema.
 * @returns {string} The module source.
 */
export function renderModule(schema) {
  return [
    '// Generated by scripts/generate-settings-schema.mjs from metaSchema.ts and the settings types.',
    '// Do not edit: the build regenerates it, and the file is not committed.',
    'import type { JsonSchemaObject } from \'./types\';',
    '',
    '/**',
    ' * The JSON Schema of the grid, column, and cell settings, without the hooks.',
    ' */',
    `const schema: JsonSchemaObject = ${JSON.stringify(schema, null, 2)};`,
    '',
    'export default schema;',
    '',
  ].join('\n');
}

/**
 * Entry point: builds the schema and writes the module, unless it would not change.
 */
function main() {
  const source = renderModule(buildSettingsSchema());
  let current = null;

  try {
    current = readFileSync(OUTPUT, 'utf8');
  } catch {
    // Not generated yet.
  }

  // Leaving an unchanged file untouched keeps its mtime, so watchers and incremental builds
  // do not see a change on every run.
  if (current !== source) {
    mkdirSync(dirname(OUTPUT), { recursive: true });
    writeFileSync(OUTPUT, source, 'utf8');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
