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
 * A plugin option listed in `CLOSED_OPTIONS` also gets `additionalProperties: false` on its object, so
 * `validateSettings()` reports a key inside it that the schema does not list. For an option the
 * public types declare as a bare `object`, the key list comes from an interface the plugin exports.
 *
 * A value JSON cannot hold (a function, a class, a `RegExp`, a DOM element) is not part of
 * a schema node's `type`. It is listed in the node's `x-handsontable.runtimeTypes`, so a
 * JSON validator rejects it while `validateSettings()` still accepts it at runtime.
 *
 * Usage (from `handsontable/`):
 *   node scripts/run.mjs build:settings-schema
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

import { LEVELS, parseOptions } from './utils/option-levels.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const PACKAGE_DIR = resolve(currentDir, '..');
const META_SCHEMA = resolve(PACKAGE_DIR, 'src', 'dataMap', 'metaManager', 'metaSchema.ts');
const CORE_SETTINGS = resolve(PACKAGE_DIR, 'src', 'core', 'settings.ts');
const PUBLIC_SETTINGS = resolve(PACKAGE_DIR, 'src', 'settings.ts');
const OUTPUT = resolve(PACKAGE_DIR, 'src', 'settingsSchema', 'schema.generated.ts');
const PLUGINS_DIR = resolve(PACKAGE_DIR, 'src', 'plugins');
const SRC_DIR = resolve(PACKAGE_DIR, 'src');
/**
 * Touched after every run. While it is newer than everything the generator reads, the next run
 * exits early instead of building a TypeScript program over the settings types again.
 */
const STAMP = resolve(PACKAGE_DIR, 'node_modules', '.cache', 'settings-schema.stamp');
/**
 * Generated files under `src/` that the settings types never import: this script's own output,
 * and the stylesheet modules `build:styles` rewrites on every run, which would defeat the stamp.
 */
const IGNORED_INPUTS = [
  OUTPUT,
  resolve(SRC_DIR, 'styles', 'handsontableStyles.js'),
  resolve(SRC_DIR, 'styles', 'handsontableStyles.ts'),
];

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
 * The plugin options whose settings object lists every key it reads, so `validateSettings()` reports
 * any other key inside it as `unknownOption`. An option is closed plugin by plugin, never by default:
 * a type that is incomplete or open-ended (an index signature, a bare `object`) would flag a valid
 * configuration. A value names the interface that lists the keys of an option the public types declare
 * as a bare `object`, by the file it is exported from (relative to `src/`) and its name.
 */
const CLOSED_OPTIONS = new Map([
  ['asyncValues', undefined],
  ['autoLink', undefined],
  ['dataProvider', undefined],
  ['dragToScroll', undefined],
  ['fillHandle', undefined],
  ['filters', undefined],
  ['manualColumnFreeze', undefined],
  ['rowSelection', undefined],
  ['sheetsBar', undefined],
  ['dropdownMenu', { file: 'plugins/dropdownMenu/dropdownMenu.ts', name: 'DropdownMenuSettings' }],
  ['pagination', { file: 'plugins/pagination/pagination.ts', name: 'PaginationSettings' }],
]);

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
  // A class instance. Its `#private` fields would otherwise land in the schema as properties.
  ['ThemeBuilder', 'object'],
]);

/**
 * Finds the object literal the `metaSchema.ts` factory returns.
 *
 * @param {ts.SourceFile} source The parsed `metaSchema.ts`.
 * @returns {ts.ObjectLiteralExpression}
 */
function findOptionsLiteral(source) {
  let literal = null;

  const visit = (node) => {
    if (literal === null && ts.isReturnStatement(node) && node.expression &&
        ts.isObjectLiteralExpression(node.expression) && ts.isExportAssignment(node.parent.parent.parent)) {
      literal = node.expression;
    }

    ts.forEachChild(node, visit);
  };

  visit(source);

  if (literal === null) {
    throw new Error(`No options object found in ${META_SCHEMA}: the factory must return an object literal.`);
  }

  return literal;
}

/**
 * Reads the text of a JSDoc tag: the type of a `@type` tag, the comment of any other.
 *
 * @param {ts.JSDocTag} tag The tag.
 * @param {ts.SourceFile} source The file the tag is in.
 * @returns {string}
 */
function readTagText(tag, source) {
  if (ts.isJSDocTypeTag(tag)) {
    // The source text of a type wrapped onto two lines still holds the second line's ` * `.
    return tag.typeExpression.type.getText(source).replace(/\s*\n\s*\*?\s*/g, ' ').trim();
  }

  return (ts.getTextOfJSDocComment(tag.comment) ?? '').trim();
}

/**
 * Reads every key of the options object in `metaSchema.ts` with its JSDoc, through the TypeScript
 * parser, so a tag wrapped onto two lines reads whole.
 *
 * A key that starts with `_` or carries `@private` is internal. Every other key must carry
 * `@memberof Options#` and a `@configScope` with known levels, or the build fails: an option
 * the generator cannot read must not be accepted unchecked.
 *
 * @returns {{options: object[], internalOptions: string[]}}
 */
function readMetaOptions() {
  const source = ts.createSourceFile(META_SCHEMA, readFileSync(META_SCHEMA, 'utf8'), ts.ScriptTarget.Latest, true);
  const options = [];
  const internalOptions = [];

  findOptionsLiteral(source).properties.forEach((property) => {
    const name = property.name.getText(source);
    const docs = ts.getJSDocCommentsAndTags(property).filter(ts.isJSDoc);
    const doc = docs[docs.length - 1];
    const tags = new Map((doc?.tags ?? []).map(tag => [tag.tagName.text, readTagText(tag, source)]));

    if (name.startsWith('_') || tags.has('private')) {
      internalOptions.push(name);

      return;
    }

    const levels = (tags.get('configScope') ?? '').split(/\s+/).filter(Boolean);
    const problem = (tags.get('memberof') !== 'Options#' && 'it has no `@memberof Options#` tag') ||
      (levels.length === 0 && 'it has no `@configScope` tag') ||
      (levels.some(level => !LEVELS.includes(level)) && `its \`@configScope\` names an unknown level (${levels})`);

    if (problem) {
      throw new Error(`Option \`${name}\` in metaSchema.ts cannot be read: ${problem}. Document it as an ` +
        'option, or mark it `@private`.');
    }

    options.push({
      name,
      levels,
      category: tags.get('category') || 'Core',
      since: tags.get('since') || null,
      type: tags.get('type'),
      description: readDescription(ts.getTextOfJSDocComment(doc?.comment) || tags.get('description') || ''),
      nullDefault: ts.isPropertyAssignment(property) && property.initializer.kind === ts.SyntaxKind.NullKeyword,
    });
  });

  return { options, internalOptions: internalOptions.sort() };
}

/**
 * Fails when `scripts/utils/option-levels.js`, which feeds the option-levels docs page with a
 * regular expression, reads an option's levels differently from the TypeScript parser.
 *
 * @param {object[]} options The options read through the TypeScript parser.
 */
function assertOptionLevelsAgree(options) {
  const regexOptions = new Map(parseOptions(readFileSync(META_SCHEMA, 'utf8')).map(option => [option.name, option]));
  const disagreements = options
    .filter(({ name, levels }) => regexOptions.get(name)?.levels.join(' ') !== levels.join(' '))
    .map(({ name, levels }) => `${name}: ${levels.join(' ')} vs ${regexOptions.get(name)?.levels.join(' ')}`);

  if (disagreements.length > 0) {
    throw new Error('scripts/utils/option-levels.js reads these option levels differently (parser vs regex): ' +
      `${disagreements.join('; ')}. Keep each \`@configScope\` tag on one line.`);
  }
}

/**
 * Returns the first paragraph of a JSDoc block as plain text, for the schema `description`.
 *
 * @param {string} block The JSDoc block.
 * @returns {string} The description, or an empty string.
 */
function readDescription(block) {
  // Most blocks open with the text; some open with a `@description` tag that holds it.
  const text = block.trim().replace(/^@description\s*/, '');
  // A markdown table carries no sentence, and its rows would run into the text, so the first
  // paragraph with text outside a table is the description.
  const paragraph = text.split(/\n\s*\n/)
    .map(part => part.split('\n').filter(line => !line.trim().startsWith('|')).join('\n').trim())
    // A footnote of the table (`\* The exact key ...`) is no description either.
    .find(part => part !== '' && !part.startsWith('\\*')) ?? '';

  if (paragraph.startsWith('@')) {
    return '';
  }

  return paragraph
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<\/?kbd>/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converts a JSDoc `@type` expression into a schema node. Used only for the options the
 * TypeScript types do not declare.
 *
 * @param {string} name The option name, for the error a member the parser cannot read throws.
 * @param {string|undefined} expression The `@type` expression, e.g. `boolean|object`.
 * @returns {object} The schema node.
 */
function fromJsDocType(name, expression) {
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

    } else if (/^[A-Z][\w.]*$/.test(part)) {
      // A class instance, such as a `ThemeBuilder`. JSON has no way to hold one.
      members.push({ runtimeTypes: ['object'] });

    } else if (part !== 'undefined') {
      throw new Error(`Option \`${name}\` in metaSchema.ts: cannot read \`${part}\` in its \`@type\` tag.`);
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
 * Options whose TypeScript `object` also means an array. TypeScript's `object` takes arrays, but
 * for most options (`hiddenColumns`, `copyPaste`) an array is a mistake, so only these widen.
 */
const OBJECT_OR_ARRAY_OPTIONS = ['dataSchema'];

/**
 * Widens the `object` type of an option listed in `OBJECT_OR_ARRAY_OPTIONS` to take an array.
 *
 * @param {string} name The option name.
 * @param {object} node The option's schema node.
 * @returns {object}
 */
function widenNode(name, node) {
  if (!OBJECT_OR_ARRAY_OPTIONS.includes(name) || node.type !== 'object') {
    return node;
  }

  return { ...node, type: ['array', 'object'] };
}

/**
 * Fails the build when an object type of a closed option has an index signature, because such a type
 * accepts any key and no list can be exhaustive. A bare `Record<string, unknown>` member and an
 * intersection with one count too.
 *
 * @param {ts.TypeChecker} checker The type checker.
 * @param {ts.Type} type The option's type, or the interface that lists its keys.
 * @param {string} name The option name.
 */
function assertNoIndexSignature(checker, type, name) {
  const members = type.isUnion() ? type.types : [type];

  members
    .filter(member => hasFlag(member, ts.TypeFlags.Object, ts.TypeFlags.Intersection) && !checker.isArrayType(member))
    .forEach((member) => {
      if (checker.getIndexInfosOfType(member).length > 0) {
        throw new Error(`${name} is in CLOSED_OPTIONS but its type has an index signature, so it accepts any key.`);
      }
    });
}

/**
 * Closes the object type of one branch of a closed option's node.
 *
 * @param {string} name The option name.
 * @param {object} branch A branch of the option's node.
 * @param {object|undefined} listed The converted interface that lists the keys, for an option typed as `object`.
 * @returns {object[]|null} The branches that replace it, or `null` when it holds no object type to close.
 */
function closeBranch(name, branch, listed) {
  const types = [branch.type ?? []].flat();
  // A bare `object` (no key list yet) takes the interface's keys; a typed object keeps its own.
  const hasKeyList = branch.properties !== undefined;

  if (!types.includes('object') || hasKeyList === Boolean(listed)) {
    return null;
  }

  const properties = listed ? listed.properties : branch.properties;

  if (!properties) {
    throw new Error(`${name} is in CLOSED_OPTIONS but no key list was found for it.`);
  }

  const others = types.filter(branchType => branchType !== 'object');
  const closed = { ...branch, type: 'object', properties, additionalProperties: false };

  if (others.length === 0) {
    return [closed];
  }

  return [{ type: others.length === 1 ? others[0] : others }, closed];
}

/**
 * Marks the object branch of an option in `CLOSED_OPTIONS` as listing every key it accepts
 * (`additionalProperties: false`). An option typed as a bare `object` takes its key list from
 * the interface in `listedType`.
 *
 * @param {string} name The option name.
 * @param {object} node The option's schema node.
 * @param {TypeConverter} converter The type converter.
 * @param {ts.Type|undefined} type The option's type, when the types declare it.
 * @param {ts.Type|undefined} listedType The interface that lists the keys, for an option typed as `object`.
 * @returns {object} The node, with its object branch closed.
 */
function closeOptionNode(name, node, converter, type, listedType) {
  if (!CLOSED_OPTIONS.has(name)) {
    return node;
  }

  if (!type) {
    throw new Error(`${name} is in CLOSED_OPTIONS but the settings types do not declare it.`);
  }

  assertNoIndexSignature(converter.checker, listedType ?? type, name);

  const { anyOf, 'x-handsontable': annotations, ...single } = node;
  const listed = listedType && converter.convert(listedType);
  const replaced = (anyOf ?? [single]).map(branch => closeBranch(name, branch, listed));

  if (replaced.every(branches => branches === null)) {
    throw new Error(`${name} is in CLOSED_OPTIONS but has no object type to close.`);
  }

  const branches = (anyOf ?? [single]).flatMap((branch, index) => replaced[index] ?? [branch]);

  // An open `object` branch beside a closed one matches any key, so the option would only look closed.
  if (branches.some(branch => [branch.type ?? []].flat().includes('object') && branch.additionalProperties !== false)) {
    throw new Error(`${name} is in CLOSED_OPTIONS but keeps an object branch that accepts any key.`);
  }

  const closed = branches.length === 1 ? branches[0] : { anyOf: branches };

  return annotations ? { ...closed, 'x-handsontable': annotations } : closed;
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
    // A mapped type (`Partial<GridSettings>`, `Omit<...>`, `Record<...>`) is a plain object whose
    // symbol comes from the library, so the declaration test below would take it for a class.
    // eslint-disable-next-line no-bitwise
    if (((type.objectFlags ?? 0) & ts.ObjectFlags.Mapped) !== 0) {
      return false;
    }

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
 *   cellMeta: Map<string, ts.Type>, listed: Map<string, ts.Type>, typeDocs: Map<string, string>}}
 */
function readSettingsTypes() {
  const configPath = resolve(PACKAGE_DIR, 'tsconfig.json');
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  const { options } = ts.parseJsonConfigFileContent(config.config, ts.sys, PACKAGE_DIR);
  const listedFiles = [...CLOSED_OPTIONS.values()].filter(Boolean).map(({ file }) => resolve(SRC_DIR, file));
  const program = ts.createProgram([CORE_SETTINGS, PUBLIC_SETTINGS, ...listedFiles], { ...options, noEmit: true });
  const checker = program.getTypeChecker();
  // The documentation comment of each declared property, for the options `metaSchema.ts` does not document.
  const typeDocs = new Map();

  /**
   * Finds an exported interface.
   *
   * @param {string} file The file that declares the interface.
   * @param {string} name The interface name.
   * @returns {ts.Type}
   */
  const readDeclaredType = (file, name) => {
    const sourceFile = program.getSourceFile(file);
    const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
    const symbol = checker.getExportsOfModule(moduleSymbol).find(exported => exported.getName() === name);

    if (!symbol) {
      throw new Error(`${name} is not exported from ${file}.`);
    }

    return checker.getDeclaredTypeOfSymbol(symbol);
  };

  /**
   * Reads the properties of an exported interface.
   *
   * @param {string} file The file that declares the interface.
   * @param {string} name The interface name.
   * @returns {Map<string, ts.Type>}
   */
  const readInterface = (file, name) => {
    const declared = readDeclaredType(file, name);

    checker.getPropertiesOfType(declared).forEach((property) => {
      const documentation = ts.displayPartsToString(property.getDocumentationComment(checker));

      if (documentation !== '' && !typeDocs.has(property.getName())) {
        typeDocs.set(property.getName(), documentation);
      }
    });

    return new Map(checker.getPropertiesOfType(declared)
      .map(property => [property.getName(), checker.getTypeOfSymbol(property)]));
  };

  // The interface that lists the keys of each closed option the public types declare as a bare `object`.
  const listed = new Map([...CLOSED_OPTIONS]
    .filter(([, source]) => source !== undefined)
    .map(([name, { file, name: typeName }]) => [name, readDeclaredType(resolve(SRC_DIR, file), typeName)]));

  return {
    converter: new TypeConverter(checker),
    grid: readInterface(CORE_SETTINGS, 'GridSettings'),
    column: readInterface(PUBLIC_SETTINGS, 'ColumnSettings'),
    cellMeta: readInterface(PUBLIC_SETTINGS, 'CellMeta'),
    listed,
    typeDocs,
  };
}

/**
 * Reads the plugins that ship with Handsontable: each one's `PLUGIN_KEY`, and the option it
 * owns under another name (`const SETTING_KEY = 'fillHandle'` in Autofill).
 *
 * @returns {{builtInPlugins: string[], ownerOf: Map<string, string>}} The plugin keys, and the
 * registered plugin name for each option a plugin owns.
 */
function readBuiltInPlugins() {
  const builtInPlugins = new Set();
  const ownerOf = new Map();

  readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .forEach((entry) => {
      // The key is declared in the plugin's own file, or in its `constants.ts` (`dataProvider`).
      [`${entry.name}.ts`, 'constants.ts'].forEach((fileName) => {
        const file = resolve(PLUGINS_DIR, entry.name, fileName);
        const source = existsSync(file) ? readFileSync(file, 'utf8') : '';
        const pluginKey = source.match(/export const PLUGIN_KEY = '(\w+)'/)?.[1];

        if (pluginKey === undefined) {
          return;
        }

        // The registry stores a plugin under its key with the first letter upper-cased.
        const pluginName = `${pluginKey[0].toUpperCase()}${pluginKey.slice(1)}`;
        const settingKey = source.match(/const SETTING_KEY = '(\w+)'/)?.[1];

        builtInPlugins.add(pluginKey);
        ownerOf.set(pluginKey, pluginName);

        if (settingKey !== undefined) {
          ownerOf.set(settingKey, pluginName);
        }
      });
    });

  return { builtInPlugins: [...builtInPlugins].sort(), ownerOf };
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
 * @returns {{schema: object, internals: object, fromJsDoc: string[]}} The JSON Schema, the lists
 * `validateSettings()` reads that are not part of it, and the options whose type the settings types do
 * not declare, which the schema takes from their JSDoc `@type` instead.
 */
export function buildSettingsSchema() {
  // `@private` options (`preventWheel`) and the meta bookkeeping keys (`_userDefinedMetaProps`)
  // are real keys of the settings object but not documented options. They stay out of the
  // schema, in the internals `validateSettings()` reads so it does not report them as unknown.
  const { options, internalOptions } = readMetaOptions();
  const { builtInPlugins, ownerOf } = readBuiltInPlugins();
  const { converter, grid, column, cellMeta, listed, typeDocs } = readSettingsTypes();
  const properties = {};
  const columnProperties = {};
  const cellProperties = {};
  const known = new Set([...options.map(option => option.name), ...internalOptions]);
  const fromJsDoc = new Set();
  const optionsByName = new Map(options.map(option => [option.name, option]));

  assertOptionLevelsAgree(options);

  /**
   * Builds the schema node of one option.
   *
   * @param {string} name The option name.
   * @param {ts.Type|undefined} type The option's type, when the types declare it.
   * @param {object} annotations The `x-handsontable` annotations.
   * @returns {object}
   */
  const buildNode = (name, type, annotations) => {
    const option = optionsByName.get(name);

    if (!type) {
      fromJsDoc.add(name);
    }

    const node = closeOptionNode(
      name,
      widenNode(name, type ? converter.convert(type) : fromJsDocType(name, option?.type)),
      converter,
      type,
      listed.get(name),
    );
    // An option `metaSchema.ts` does not document takes the comment of its TypeScript declaration.
    const description = option?.description || readDescription(typeDocs.get(name) ?? '') ||
      (annotations.levels.includes('grid') ? '' : `The \`${name}\` property of the cell meta.`);
    const nullable = option?.nullDefault ?? false;

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
    // A plugin's own switch can sit in the Core category (`moveCells`, `fillHandle`), so the plugin
    // that declares the key decides when the category does not.
    const plugin = category === 'Core' ? ownerOf.get(name) : category;

    properties[name] = buildNode(name, grid.get(name), {
      levels,
      ...(plugin === undefined ? {} : { plugin }),
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

  // `ColumnSettings` can declare a key of its own; one that `metaSchema.ts` does not document would
  // drop out of `$defs.columnSettings` and read as unknown in every `columns` entry.
  const uncovered = [...new Set([...grid.keys(), ...column.keys()])]
    .filter(key => !known.has(key) && !isHookKey(key));

  if (uncovered.length > 0) {
    throw new Error(`The settings types declare option(s) metaSchema.ts does not: ${uncovered.join(', ')}. ` +
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
        // Keep the option's levels and plugin, but the runtime types of the column-level type.
        const { runtimeTypes: _gridRuntimeTypes, ...annotations } = properties[name]['x-handsontable'];

        columnProperties[name] = buildNode(name, columnType, annotations);
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

  const schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Handsontable settings',
    description: 'The configuration options of a Handsontable instance. Generated from the option ' +
      'definitions. A value JSON cannot hold (a function, a class instance) is listed in ' +
      '`x-handsontable.runtimeTypes` instead of `type`.',
    type: 'object',
    properties,
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

  return { schema, internals: { internalOptions, builtInPlugins }, fromJsDoc: [...fromJsDoc] };
}

/**
 * Renders the schema as the TypeScript module the package compiles.
 *
 * @param {object} generated The schema and its internals, from `buildSettingsSchema()`.
 * @param {object} generated.schema The JSON Schema.
 * @param {object} generated.internals The lists `validateSettings()` reads that are not part of it.
 * @returns {string} The module source.
 */
export function renderModule({ schema, internals }) {
  return [
    '// Generated by scripts/generate-settings-schema.mjs from metaSchema.ts and the settings types.',
    '// Do not edit: the build regenerates it, and the file is not committed.',
    'import type { GeneratedSchemaInternals, JsonSchemaObject } from \'./types\';',
    '',
    '/**',
    ' * The JSON Schema of the grid, column, and cell settings, without the hooks.',
    ' */',
    `const schema: JsonSchemaObject = ${JSON.stringify(schema, null, 2)};`,
    '',
    '/**',
    ' * The keys `validateSettings()` accepts without a schema entry. Not published with the schema.',
    ' */',
    `export const internals: GeneratedSchemaInternals = ${JSON.stringify(internals, null, 2)};`,
    '',
    'export default schema;',
    '',
  ].join('\n');
}

/**
 * Returns the newest modification time among the files and directories the generator reads: the
 * source tree (the settings types import across it, and a directory's time moves when a file in it
 * is added or deleted), this script, its parser, the TypeScript config, and the compiler version.
 *
 * @returns {number} The time in milliseconds.
 */
function readNewestInputTime() {
  let newest = 0;

  const visit = (dir) => {
    newest = Math.max(newest, statSync(dir).mtimeMs);

    readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const path = resolve(dir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name !== '__tests__') {
          visit(path);
        }
      } else if (!IGNORED_INPUTS.includes(path)) {
        newest = Math.max(newest, statSync(path).mtimeMs);
      }
    });
  };

  visit(SRC_DIR);
  [
    fileURLToPath(import.meta.url),
    resolve(currentDir, 'utils', 'option-levels.js'),
    resolve(PACKAGE_DIR, 'tsconfig.json'),
    resolve(PACKAGE_DIR, 'node_modules', 'typescript', 'package.json'),
  ].forEach((file) => {
    newest = Math.max(newest, statSync(file).mtimeMs);
  });

  return newest;
}

/**
 * Entry point: builds the schema and writes the module, unless it would not change.
 */
function main() {
  if (existsSync(OUTPUT) && existsSync(STAMP) && statSync(STAMP).mtimeMs >= readNewestInputTime()) {
    return;
  }

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

  mkdirSync(dirname(STAMP), { recursive: true });
  writeFileSync(STAMP, '', 'utf8');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
