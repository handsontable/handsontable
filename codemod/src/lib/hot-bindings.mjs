/**
 * Detects what a file binds to Handsontable: the namespace (`Handsontable`), the wrapper components, which
 * wrapper the file uses, and which expressions are grid instances. Transforms use it to decide whether a name
 * in a file is Handsontable's before they rewrite it.
 *
 * Everything here answers "yes" only on evidence in the same file. Anything else is "no", so a transform that
 * rewrites only on "yes" degrades to leaving code alone.
 *
 * @module lib/hot-bindings
 */

import {
  calleeName,
  edgeKey,
  isFunctionNode,
  memberName,
  pluginKeyOf,
  propertyName,
  stringValue,
  typeArguments,
  typeMembers,
  unwrapNode,
  unwrapPath,
} from './ast.mjs';
import { declarationsOf, invalidateScope, lookup, moduleBindings, referenceSpace } from './scope.mjs';

/**
 * The name `getPlugin()` looks a plugin up by: it upper-cases the first letter of its argument.
 *
 * @param {string} key A plugin key as written.
 * @returns {string} The key with an upper-case first letter.
 */
function registryName(key) {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/**
 * What `collectHotBindings` returns.
 *
 * @typedef {object} HotBindings
 * @property {string[]} namespace Local names bound to the Handsontable default export or namespace: a default or
 * `import * as` import of `handsontable` or `handsontable/base`, `const X = require('handsontable')`, and
 * `Handsontable` itself when the file uses it without declaring it (a UMD or global build).
 * @property {{HotTable: string[], HotColumn: string[]}} components Local names of the React wrapper components.
 * @property {boolean} angular The file imports the Angular wrapper.
 * @property {boolean} vue The file imports the Vue 3 wrapper.
 * @property {boolean} isHotFile The file imports anything from Handsontable or a wrapper, or uses the namespace.
 * @property {boolean} isModular The file imports `handsontable/base` and has no bare `handsontable` value import.
 * @property {(path: object) => boolean} isInstance Whether an expression NodePath is a grid instance that the
 * file shows evidence of: a variable set from `new <namespace>(...)`, anything ending in `.hotInstance`
 * (optional chains included), a variable, parameter, or class property annotated `Handsontable`,
 * `Handsontable.Core`, or a `Core` or `HotInstance` type imported from Handsontable, `this.x` assigned from
 * `new <namespace>(...)`, and `ref.current` or `ref.value` of a `useRef`, `createRef`, or `ref` holder typed as
 * one of those. A name that is not annotated counts only when every value it can hold is an instance (the
 * initializer and every assignment, in any scope), and `this.x` only when `this` is the instance of the class and
 * every assignment to the member in the class is one. An unrelated `.undo()` receiver gives `false`.
 * @property {(path: object, keys: string[]) => boolean} isPluginReceiver Whether an expression NodePath is a
 * plugin of one of the keys: a direct `<x>.getPlugin('<key>')` call (optional chaining included), or a variable
 * or `this` member that the file sets from such a call. One hop, and every value the name is set from must be a
 * listed plugin.
 * @property {(path: object) => boolean} isPlugin Whether an expression NodePath is a plugin of any key: a direct
 * `<x>.getPlugin('<key>')` call, or a variable or `this` member that the file sets only from such calls.
 * @property {(path: object, keys: string[]) => boolean} isPartlyPlugin Whether a name or `this` member is set from a
 * `getPlugin()` call of one of the keys somewhere, whether or not every value is. A rule reports such a receiver.
 * @property {(path: object) => ({values: object[], opaque: boolean, variable: boolean}|null)} valuesOf Everything the
 * file sets a name or a `this` member from: the NodePaths of the initializer and of every assignment in any scope
 * (a write of `null`, `undefined`, or `void 0` is no value), and whether some write is one the file does not show (a compound assignment, a destructuring target, a `for`
 * head, an update). `null` for a global. A parameter, an import, a function, and a class are not `variable`.
 * @property {(path: object) => string|null} resolveNamespaceMember For a `MemberExpression`,
 * `OptionalMemberExpression`, or `TSQualifiedName` chain rooted at a namespace binding, the dotted path after
 * the root (`helper.sanitize`, `plugins.ColumnSorting.Settings`). `null` for any other expression, for a
 * computed access that is not a string literal, and for a shadowed root.
 * @property {(path: object) => boolean} isNamespaceIdentifier Whether an `Identifier` NodePath refers to a
 * namespace binding (not a shadowing local).
 * @property {(path: object) => 'HotTable'|'HotColumn'|null} getComponent The wrapper component a JSX element
 * name resolves to. Takes the NodePath of a `JSXElement`, a `JSXOpeningElement`, or the name's `JSXIdentifier`.
 * @property {(typeName: object) => string|null} resolveTypeName For the `typeName` of a type reference
 * (an `Identifier` or `TSQualifiedName`, as a node or a NodePath), the Handsontable type it names: the imported name of a
 * named import from a Handsontable module (`GridSettings`), or the dotted path under the namespace
 * (`GridSettings` for `Handsontable.GridSettings`). `null` for every other type.
 */

const CORE_SOURCES = new Set(['handsontable', 'handsontable/base']);
const CORE_DIST_PATTERN = /^handsontable\/dist\/handsontable(\.full)?(\.min)?(\.js)?$/;
const REACT_SOURCES = new Set(['@handsontable/react-wrapper', '@handsontable/react']);
const ANGULAR_SOURCES = new Set(['@handsontable/angular-wrapper', '@handsontable/angular']);
const VUE_SOURCES = new Set(['@handsontable/vue3', '@handsontable/vue']);
const HOT_TYPE_NAMES = new Set(['Core', 'HotInstance']);
const HOLDER_CALLEES = new Set(['useRef', 'createRef', 'ref', 'shallowRef']);
const HOLDER_TYPES = new Set(['RefObject', 'MutableRefObject', 'Ref', 'ShallowRef']);
const COMPONENT_NAMES = new Set(['HotTable', 'HotColumn']);
const MAX_DEPTH = 8;
const MEMBER_TYPES = new Set(['MemberExpression', 'OptionalMemberExpression']);
const VARIABLE_KINDS = new Set(['var', 'let', 'const']);
const NEUTRAL_TYPES = new Set(['TSAnyKeyword', 'TSUnknownKeyword', 'TSNeverKeyword']);
const WRAPPER_NODES = new Set([
  'TSAsExpression',
  'TSSatisfiesExpression',
  'TSNonNullExpression',
  'TSTypeAssertion',
  'TSInstantiationExpression',
  'ParenthesizedExpression',
  'TypeCastExpression',
]);

/**
 * The assignment operators that can leave the right side in the variable: `=` and the three logical ones. Any
 * other operator (`+=`, `**=`) makes a value the file does not show.
 */
const VALUE_OPERATORS = new Set(['=', '||=', '&&=', '??=']);

/**
 * Calls that set members of their first argument by name. `Object.assign(this, x)` can set any member of the class.
 */
const SETS_MEMBERS = new Set([
  'Object.assign',
  'Object.defineProperty',
  'Object.defineProperties',
  'Object.setPrototypeOf',
  'Reflect.set',
  'Reflect.defineProperty',
]);

/**
 * Names a variable or property that holds a grid has when its type cannot be confirmed: `hot`, `hotInstance`,
 * `this.grid`, `table`. A call on such a receiver is reported, or taken for the grid where a rule says so. Generic
 * names (`editor`, `history`, `instance`) are not listed on purpose, so an unrelated `.undo()` stays silent.
 */
export const GRID_NAME = new RegExp('^[_$]*(hot|hotInstance|hotInst|hotTable|hotRef|hotGrid|grid|gridInstance|table'
  + '|handsontable|spreadsheet)$', 'i');

/**
 * The last name of a receiver expression: `hot` for `hot` and for `this.hot`. Calls and `this` have none.
 *
 * @param {object} path The receiver NodePath.
 * @returns {string|null} The name, or `null`.
 */
export function receiverLabel(path) {
  const node = unwrapNode(path.node);

  if (node.type === 'Identifier') {
    return node.name;
  }

  return MEMBER_TYPES.has(node.type) ? memberName(node) : null;
}

/**
 * Whether a receiver is named like a grid.
 *
 * @param {object} path The receiver NodePath.
 * @returns {boolean} `true` when its last name is on the grid-name list (`GRID_NAME`).
 */
export function isGridNamed(path) {
  const label = receiverLabel(path);

  return label !== null && GRID_NAME.test(label);
}

/**
 * Whether a module name is a Handsontable package or a subpath of one.
 *
 * @param {string} source Module name.
 * @returns {boolean} `true` for `handsontable`, `handsontable/...`, and `@handsontable/...`.
 */
function isHotSource(source) {
  return source === 'handsontable' || source.startsWith('handsontable/') || source.startsWith('@handsontable/');
}

/**
 * Whether a module name is the Handsontable core entry (its default export is the namespace).
 *
 * @param {string} source Module name.
 * @returns {boolean} `true` for the core entry points.
 */
function isCoreSource(source) {
  return CORE_SOURCES.has(source) || CORE_DIST_PATTERN.test(source);
}

/**
 * The Identifier nodes and module names a `require` initializer gives a declarator.
 *
 * @param {object} init The initializer node.
 * @returns {{source: string, viaDefault: boolean}|null} The required module, or `null`.
 */
function requireOf(init) {
  let node = unwrapNode(init);
  let viaDefault = false;

  if (node?.type === 'MemberExpression' && memberName(node) === 'default') {
    node = unwrapNode(node.object);
    viaDefault = true;
  }

  if (node?.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'require') {
    const source = stringValue(node.arguments[0]);

    return source === null ? null : { source, viaDefault };
  }

  return null;
}

const LOCAL_VALUE_TYPES = new Set([
  'ObjectExpression',
  'NewExpression',
  'ClassExpression',
  'ArrayExpression',
  'StringLiteral',
  'NumericLiteral',
  'BooleanLiteral',
  'Literal',
  'TemplateLiteral',
]);

/**
 * Whether a value that a name is set from is local to the file: an object, a class, a literal, or a `getPlugin()`
 * call on a host that the file shows to be a local object (a mock that stands in for the grid).
 *
 * @param {object} value NodePath of the value.
 * @param {HotBindings} [bindings] The bindings of the file.
 * @returns {boolean} `true` when the value is something the file shows.
 */
function isLocalValue(value, bindings) {
  return LOCAL_VALUE_TYPES.has(unwrapNode(value.node).type) || bindings?.pluginCallOf(value)?.host === 'other';
}

/**
 * Whether a receiver is unresolved: the file shows neither what it is nor that it is something else. A `this` or
 * `super` receiver, a member chain rooted at one, a local object, class, function, or import, and a plugin
 * looked up by key are resolved. A global, a parameter, and the result of another call are not. A variable is
 * resolved only when every value it can hold is a local value: with `bindings`, an assignment anywhere counts, and
 * one that is not a local value (or one the file does not show) leaves the variable unresolved.
 *
 * @param {object} path The receiver NodePath.
 * @param {HotBindings} [bindings] The bindings of the file, which know every assignment of a variable.
 * @returns {boolean} `true` when a call on it may still be on the thing a rule is about.
 */
export function isUnresolvedReceiver(path, bindings) {
  let current = unwrapPath(path);

  while (current.node.type === 'MemberExpression' || current.node.type === 'OptionalMemberExpression') {
    current = unwrapPath(current.get('object'));
  }

  const { node } = current;

  if (node.type === 'ThisExpression' || node.type === 'Super' || pluginKeyOf(node) !== null) {
    return false;
  }

  if (node.type !== 'Identifier') {
    return true;
  }

  const binding = lookup(current, node.name, 'value');

  if (!binding) {
    return true;
  }

  if (['function', 'class', 'import'].includes(binding.kind)) {
    return false;
  }

  const history = binding.kind !== 'param' ? bindings?.valuesOf(current) : null;

  if (history?.variable) {
    return history.opaque || history.values.length === 0
      || !history.values.every(value => isLocalValue(value, bindings));
  }

  return !(binding.init && LOCAL_VALUE_TYPES.has(unwrapNode(binding.init).type));
}

/**
 * What the file shows about the receiver of a call that only the grid answers to (`updateSettings()`):
 *
 * - `instance`: `isInstance()` confirms it.
 * - `other`: the file shows it is something else. A plugin (a `getPlugin()` call, or a name set only from such
 *   calls), `this` and `super` themselves, a `this` member whose every value is a local object, class, or literal,
 *   a local object, class, function, or import.
 * - `unknown`: nothing shows it. A global, a parameter, the result of a call, a name with a value the file does not
 *   show, a `this` member the class never sets, and a longer chain below `this`.
 *
 * @param {object} path The receiver NodePath.
 * @param {HotBindings} bindings The bindings of the file.
 * @returns {'instance'|'other'|'unknown'} The kind.
 */
export function receiverOfGrid(path, bindings) {
  const target = unwrapPath(path);

  if (bindings.isInstance(target)) {
    return 'instance';
  }

  if (bindings.isPlugin(target)) {
    return 'other';
  }

  let root = target;

  while (MEMBER_TYPES.has(root.node.type)) {
    root = unwrapPath(root.get('object'));
  }

  if (root.node.type === 'ThisExpression' && root.node !== target.node) {
    const direct = unwrapPath(target.get('object')).node === root.node;
    const history = direct ? bindings.valuesOf(target) : null;
    const local = Boolean(history?.variable) && !history.opaque && history.values.length > 0
      && history.values.every(value => isLocalValue(value, bindings));

    return local ? 'other' : 'unknown';
  }

  return isUnresolvedReceiver(target, bindings) ? 'unknown' : 'other';
}

/**
 * Collect what a file binds to Handsontable. See `HotBindings` for the shape. The result is a snapshot of the
 * tree: after an edit that adds, removes, or renames a declaration, collect it again.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @returns {HotBindings} The bindings and the query functions.
 */
export function collectHotBindings(j, root) {
  invalidateScope();

  const programPath = root.find(j.Program).paths()[0];
  const namespaceIds = new Set();
  const typeIds = new Set();
  const namedImports = new Map();
  const componentIds = new Map();
  const valueSources = new Set();
  const flags = { angular: false, vue: false, hotImport: false, global: false };

  /**
   * Note what a module reference tells about the file.
   *
   * @param {string} source Module name.
   * @param {boolean} isValue Whether the reference is a value import (not `import type`).
   */
  const noteSource = (source, isValue) => {
    flags.hotImport = flags.hotImport || isHotSource(source);
    flags.angular = flags.angular || ANGULAR_SOURCES.has(source);
    flags.vue = flags.vue || VUE_SOURCES.has(source);

    if (isValue && source === 'handsontable') {
      valueSources.add('handsontable');
    } else if (isValue && source === 'handsontable/base') {
      valueSources.add('base');
    }
  };

  root.find(j.ImportDeclaration).filter(path => path.parent.node.type === 'Program').forEach((path) => {
    const source = String(path.node.source.value);
    const isValue = path.node.importKind !== 'type'
      && (path.node.specifiers.length === 0 || path.node.specifiers.some(item => item.importKind !== 'type'));

    noteSource(source, isValue);

    path.node.specifiers.forEach((specifier) => {
      const imported = specifier.type === 'ImportSpecifier'
        ? specifier.imported.name ?? stringValue(specifier.imported) : null;

      if (isHotSource(source) && imported) {
        namedImports.set(specifier.local, { source, imported });
      }

      if (isCoreSource(source)) {
        if (specifier.type !== 'ImportSpecifier' || imported === 'default') {
          namespaceIds.add(specifier.local);
        } else if (HOT_TYPE_NAMES.has(imported)) {
          typeIds.add(specifier.local);
        }
      } else if (REACT_SOURCES.has(source)) {
        if (COMPONENT_NAMES.has(imported)) {
          componentIds.set(specifier.local, imported);
        } else if (specifier.type === 'ImportDefaultSpecifier' && source === '@handsontable/react') {
          componentIds.set(specifier.local, 'HotTable');
        }
      }
    });
  });

  // A module that only re-exports a module of the package (`export * from 'handsontable/languages/sr-SP'`) uses it as
  // much as an import does. It adds no binding, so only what the reference says about the file counts.
  [j.ExportNamedDeclaration, j.ExportAllDeclaration].forEach(type => root.find(type).forEach((path) => {
    const source = path.node.source ? String(path.node.source.value) : null;

    if (source !== null && path.parent.node.type === 'Program') {
      flags.hotImport = flags.hotImport || isHotSource(source);
      flags.angular = flags.angular || ANGULAR_SOURCES.has(source);
      flags.vue = flags.vue || VUE_SOURCES.has(source);
    }
  }));

  root.find(j.TSImportEqualsDeclaration).forEach((path) => {
    const reference = path.node.moduleReference;
    const source = reference.type === 'TSExternalModuleReference' ? stringValue(reference.expression) : null;

    if (source !== null) {
      noteSource(source, path.node.importKind !== 'type');

      if (isCoreSource(source)) {
        namespaceIds.add(path.node.id);
      }
    }
  });

  root.find(j.CallExpression).forEach((path) => {
    const isImport = path.node.callee.type === 'Import';
    const isRequire = path.node.callee.type === 'Identifier' && path.node.callee.name === 'require'
      && lookup(path.get('callee'), 'require') === null;
    const source = isImport || isRequire ? stringValue(path.node.arguments[0]) : null;

    if (source !== null) {
      noteSource(source, isRequire);
    }
  });

  root.find(j.VariableDeclarator).forEach((path) => {
    const required = path.node.init ? requireOf(path.node.init) : null;

    if (!required) {
      return;
    }

    const { source, viaDefault } = required;
    const id = path.node.id;

    if (id.type === 'Identifier' && isCoreSource(source)) {
      namespaceIds.add(id);
    } else if (id.type === 'Identifier' && viaDefault && source === '@handsontable/react') {
      componentIds.set(id, 'HotTable');
    } else if (id.type === 'ObjectPattern') {
      id.properties.forEach((property) => {
        const key = propertyName(property);

        if (property.type === 'RestElement' || property.value?.type !== 'Identifier') {
          return;
        }

        if (isCoreSource(source) && key === 'default') {
          namespaceIds.add(property.value);
        } else if (REACT_SOURCES.has(source) && COMPONENT_NAMES.has(key)) {
          componentIds.set(property.value, key);
        }
      });
    }
  });

  root.find(j.Identifier, { name: 'Handsontable' }).forEach((path) => {
    const space = path.node.type === 'Identifier' ? referenceSpace(path) : null;

    if (space && lookup(path, 'Handsontable', space) === null) {
      flags.global = true;
    }
  });

  /**
   * Whether a binding is a module-level `const` that holds the namespace under another name
   * (`const HT = Handsontable;`), one hop, as an identifier and not as a destructured name.
   *
   * @param {object} binding A binding from `lookup()`.
   * @returns {boolean} `true` for an alias of the namespace.
   */
  const isNamespaceAlias = (binding) => {
    if (binding.kind !== 'const' || binding.scope?.type !== 'Program' || binding.node?.id !== binding.idNode
      || binding.init?.type !== 'Identifier') {
      return false;
    }

    const target = (moduleBindings(programPath.node).get(binding.init.name) ?? [])
      .find(item => item.kind !== 'type' && item.kind !== 'typeParam');

    return target ? namespaceIds.has(target.idNode) : flags.global && binding.init.name === 'Handsontable';
  };

  /**
   * Whether an identifier path refers to a namespace binding.
   *
   * @param {object} path An `Identifier` NodePath.
   * @returns {boolean} `true` for the namespace.
   */
  const isNamespaceIdentifier = (path) => {
    if (path.node.type !== 'Identifier') {
      return false;
    }

    const space = referenceSpace(path);

    if (!space) {
      return false;
    }

    const binding = lookup(path, path.node.name, space);

    return binding ? namespaceIds.has(binding.idNode) || isNamespaceAlias(binding)
      : flags.global && path.node.name === 'Handsontable';
  };

  /**
   * Walk a member or qualified-name chain down to its root.
   *
   * @param {object} path A NodePath.
   * @returns {{rootPath: object, parts: string[]}|null} The root path and the member names, or `null`.
   */
  const chainOf = (path) => {
    const parts = [];
    let current = unwrapPath(path);

    while (['MemberExpression', 'OptionalMemberExpression', 'TSQualifiedName'].includes(current.node.type)) {
      const node = current.node;

      if (node.type === 'TSQualifiedName') {
        parts.unshift(node.right.name);
        current = current.get('left');
      } else {
        const name = memberName(node);

        if (name === null) {
          return null;
        }

        parts.unshift(name);
        current = unwrapPath(current.get('object'));
      }
    }

    return { rootPath: current, parts };
  };

  const resolveNamespaceMember = (path) => {
    const chain = chainOf(path);

    if (!chain || chain.parts.length === 0 || !isNamespaceIdentifier(chain.rootPath)) {
      return null;
    }

    return chain.parts.join('.');
  };

  const moduleLevel = name => (moduleBindings(programPath.node).get(name) ?? [])
    .find(binding => binding.kind !== 'type' && binding.kind !== 'typeParam');

  /**
   * Resolve the root of a type name at module level. Type annotations are matched against the module's own
   * imports, which is where a Handsontable type comes from.
   *
   * @param {object} typeName An `Identifier` or `TSQualifiedName` node.
   * @returns {string|null} The Handsontable type name, or `null`.
   */
  const resolveTypeNode = (typeName) => {
    const parts = [];
    let current = typeName;

    while (current.type === 'TSQualifiedName') {
      parts.unshift(current.right.name);
      current = current.left;
    }

    if (current.type !== 'Identifier') {
      return null;
    }

    const binding = moduleLevel(current.name);

    if (parts.length === 0) {
      const named = binding ? namedImports.get(binding.idNode) : null;

      return named ? named.imported : null;
    }

    const isNamespace = binding ? namespaceIds.has(binding.idNode) : flags.global && current.name === 'Handsontable';

    return isNamespace ? parts.join('.') : null;
  };

  /**
   * Whether a type node (or a type annotation) names a grid instance type.
   *
   * @param {object|null|undefined} typeNode The type node.
   * @returns {boolean} `true` for `Handsontable`, `Handsontable.Core`, `Core`, `HotInstance`, and a union of
   * those with `null` or `undefined`.
   */
  const isHotType = (typeNode) => {
    if (!typeNode) {
      return false;
    }

    switch (typeNode.type) {
      case 'TSTypeAnnotation':
      case 'TSParenthesizedType':
        return isHotType(typeNode.typeAnnotation);
      case 'TSUnionType': {
        const members = typeNode.types.filter(item => item.type !== 'TSNullKeyword'
          && item.type !== 'TSUndefinedKeyword');

        return members.length > 0 && members.every(isHotType);
      }
      case 'TSTypeReference': {
        const name = typeNode.typeName;

        if (name.type === 'TSQualifiedName') {
          return resolveTypeNode(name) === 'Core';
        }

        const binding = moduleLevel(name.name);

        if (!binding) {
          return flags.global && name.name === 'Handsontable';
        }

        return namespaceIds.has(binding.idNode) || typeIds.has(binding.idNode);
      }
      default:
        return false;
    }
  };

  /**
   * Whether a type node is a ref holder of a grid instance, such as `RefObject<Handsontable | null>`.
   *
   * @param {object|null|undefined} typeNode The type node.
   * @returns {boolean} `true` for a ref type whose first argument is a grid instance type.
   */
  const isHolderType = (typeNode) => {
    const node = typeNode?.type === 'TSTypeAnnotation' || typeNode?.type === 'TSParenthesizedType'
      ? typeNode.typeAnnotation : typeNode;

    // A holder that may also be absent (`RefObject<Handsontable | null> | null`) is a holder.
    if (node?.type === 'TSUnionType') {
      const members = typeMembers(node);

      return members.length > 0 && members.every(isHolderType);
    }

    if (node?.type !== 'TSTypeReference') {
      return false;
    }

    const name = node.typeName.type === 'TSQualifiedName' ? node.typeName.right.name : node.typeName.name;

    return HOLDER_TYPES.has(name) && isHotType(typeArguments(node)[0]);
  };

  /**
   * Whether a type node names a type of the project, one that is neither a grid instance type nor a ref holder of
   * one nor a type that says nothing (`any`, `unknown`, `never`, `as const`). A value that the compiler holds to such a
   * type is read through that type, so `hot.undo()` on a `MyUndo` is the project's method and not the grid's.
   *
   * @param {object|null|undefined} typeNode The type node, or a type annotation.
   * @returns {boolean} `true` for a type of the project.
   */
  const isForeignType = (typeNode) => {
    const node = typeNode?.type === 'TSTypeAnnotation' || typeNode?.type === 'TSParenthesizedType'
      ? typeNode.typeAnnotation : typeNode;

    if (!node || NEUTRAL_TYPES.has(node.type)) {
      return false;
    }

    if (node.type === 'TSTypeReference' && node.typeName.type === 'Identifier' && node.typeName.name === 'const') {
      return false;
    }

    // The same reading of a union and an intersection as `createHolders()` has: what may be absent is held to the
    // members that are not.
    if (node.type === 'TSUnionType' || node.type === 'TSIntersectionType') {
      return typeMembers(node).some(isForeignType);
    }

    return !isHotType(node) && !isHolderType(node);
  };

  /**
   * Whether an expression is cast to a type of the project on its way to the value: `new Handsontable(el) as MyUndo`,
   * also under other wrappers (`(x as MyUndo)!`). `satisfies` does not change the type of the value and is passed.
   *
   * @param {object} node An expression node.
   * @returns {boolean} `true` when a cast of the chain names a type of the project.
   */
  const castsToForeign = (node) => {
    let current = node;

    while (current && WRAPPER_NODES.has(current.type)) {
      if ((current.type === 'TSAsExpression' || current.type === 'TSTypeAssertion')
        && isForeignType(current.typeAnnotation)) {
        return true;
      }

      current = current.expression;
    }

    return false;
  };

  /**
   * What one name can hold, over its whole life: the initializer and every later write, in any scope. A write the
   * tool cannot read (a compound assignment, a destructuring target, a `for` head, an update) makes the history
   * opaque, and an opaque name is never trusted.
   *
   * @typedef {object} History
   * @property {object[]} values NodePaths of every expression the name is set from.
   * @property {boolean} opaque A write of a value the file does not show.
   * @property {boolean} foreign The name is declared with a type of the project, so it is never a grid instance, but
   * its values are still the values of the name (`valuesOf()`).
   * @property {boolean} variable A `var`, `let`, `const`, or a class member (not a parameter, import, or function).
   * @property {object|null} guard For a class member, the class node whose members the file may set in a way it
   * cannot name (`this[key] = x`, `Object.assign(this, x)`).
   * @property {string} [member] For a class member, its name: every write of that name in the file counts (see
   * `NameWrites`).
   * @property {boolean} qualified Every value is a grid instance (the fixpoint of `settle()`).
   */

  const seededIds = new Set();
  const holderSeededIds = new Set();
  // Keyed by the declaring identifier node: a scope cache that is rebuilt hands out new binding objects.
  const bindingHistories = new Map();
  const memberHistories = new WeakMap();
  const memberSeeds = new WeakMap();
  const holderMemberSeeds = new WeakMap();
  const unreadableClasses = new WeakSet();
  const histories = [];

  /**
   * The class node that encloses a path, for member declarations.
   *
   * @param {object} path A NodePath.
   * @returns {object|null} The `ClassDeclaration` or `ClassExpression` node.
   */
  const enclosingClass = (path) => {
    for (let current = path.parent; current; current = current.parent) {
      if (current.node.type === 'ClassBody') {
        return current.parent.node;
      }
    }

    return null;
  };

  /**
   * The class a `this` expression stands for, and whether it is the class itself (a static member) or an instance.
   * An arrow function keeps the `this` of its parent. A function, an object method, and a getter or setter of an
   * object literal have a `this` of their own, which the file does not show, so they have no owner.
   *
   * @param {object} thisPath NodePath of a `ThisExpression`.
   * @returns {{classNode: object, isStatic: boolean}|null} The owner, or `null`.
   */
  const thisOwner = (thisPath) => {
    let child = thisPath;

    for (let current = thisPath.parent; current; child = current, current = current.parent) {
      const { type } = current.node;
      const edge = edgeKey(child);

      if (type === 'ArrowFunctionExpression') {
        continue;
      }

      if (type === 'ClassMethod' || type === 'ClassPrivateMethod') {
        if (edge === 'body' || edge === 'params') {
          return { classNode: current.parent.parent.node, isStatic: Boolean(current.node.static) };
        }

        continue;
      }

      if (type === 'ClassProperty' || type === 'ClassPrivateProperty' || type === 'ClassAccessorProperty') {
        if (edge === 'value') {
          return { classNode: current.parent.parent.node, isStatic: Boolean(current.node.static) };
        }

        continue;
      }

      if (type === 'StaticBlock') {
        return { classNode: current.parent.parent.node, isStatic: true };
      }

      if (isFunctionNode(current.node) || type === 'ClassDeclaration' || type === 'ClassExpression'
        || type === 'Program') {
        return null;
      }
    }

    return null;
  };

  /**
   * The class and member key a `this.x` member expression names.
   *
   * @param {object} path NodePath of a member expression.
   * @returns {{classNode: object, key: string}|null} The class and the key (`static ` prefix for a static one),
   * or `null` when the object is not the `this` of a class or the name is computed.
   */
  const memberOf = (path) => {
    if (!MEMBER_TYPES.has(path.node.type)) {
      return null;
    }

    const object = unwrapPath(path.get('object'));
    const name = memberName(path.node);
    const owner = object.node.type === 'ThisExpression' && name !== null ? thisOwner(object) : null;

    return owner ? { classNode: owner.classNode, key: `${owner.isStatic ? 'static ' : ''}${name}` } : null;
  };

  /**
   * The history of a class member, created on the first sighting.
   *
   * @param {object} classNode The class node.
   * @param {string} key The member key.
   * @returns {History} The history.
   */
  const memberHistory = (classNode, key) => {
    if (!memberHistories.has(classNode)) {
      memberHistories.set(classNode, new Map());
    }

    const table = memberHistories.get(classNode);

    if (!table.has(key)) {
      const history = {
        values: [],
        opaque: false,
        variable: true,
        guard: classNode,
        qualified: false,
        foreign: false,
        member: key.replace(/^static /, ''),
      };

      table.set(key, history);
      histories.push(history);
    }

    return table.get(key);
  };

  /**
   * Add a key to a per-class set.
   *
   * @param {WeakMap<object, Set<string>>} table Per-class sets.
   * @param {object} classNode The class node.
   * @param {string} key The member key.
   */
  const addSeed = (table, classNode, key) => {
    if (!table.has(classNode)) {
      table.set(classNode, new Set());
    }

    table.get(classNode).add(key);
  };

  /**
   * The binding every declaration of a name in one scope stands for: the first one. `var` can declare a name
   * twice. A name that a parameter, a function, or a class also declares is not a plain variable.
   *
   * @param {object} binding A binding found by `lookup`.
   * @returns {{canonical: object, mixed: boolean}} The first value binding and whether kinds are mixed.
   */
  const canonicalOf = (binding) => {
    const list = binding.scope ? declarationsOf(binding.scope).get(binding.name) ?? [] : [];
    const own = list.filter(item => item.space === 'both' || item.space === 'value');

    return { canonical: own[0] ?? binding, mixed: own.length > 1 && own.some(item => item.kind !== 'var') };
  };

  /**
   * The history of a binding, created on the first sighting.
   *
   * @param {object} binding A binding found by `lookup`.
   * @returns {History} The history.
   */
  const bindingHistory = (binding) => {
    const { canonical, mixed } = canonicalOf(binding);

    if (!bindingHistories.has(canonical.idNode)) {
      const history = {
        values: [],
        opaque: false,
        variable: VARIABLE_KINDS.has(canonical.kind) && !mixed,
        guard: null,
        qualified: false,
        foreign: false,
      };

      bindingHistories.set(canonical.idNode, history);
      histories.push(history);
    }

    return bindingHistories.get(canonical.idNode);
  };

  /**
   * Whether an expression is `null`, `undefined` (the global), or `void 0`. A method call on such a value throws
   * before and after a rewrite alike, so a write of one tells nothing about what the name is.
   *
   * @param {object} path Expression NodePath.
   * @returns {boolean} `true` for a value that is no object.
   */
  const isNeutral = (path) => {
    const node = unwrapNode(path.node);

    switch (node.type) {
      case 'NullLiteral':
        return true;
      case 'Literal':
        return node.value === null && !node.regex;
      case 'Identifier':
        return node.name === 'undefined' && lookup(unwrapPath(path), 'undefined', 'value') === null;
      case 'UnaryExpression':
        return node.operator === 'void' && node.argument.type !== 'CallExpression';
      default:
        return false;
    }
  };

  /**
   * Everything the file writes to a member of one name, on any object: `x.name = value`, `x['name'] = value`, a key
   * `name:` of an object literal (so `Object.assign(x, { name })` too), a field, accessor, or method of a class, and
   * a `defineProperty`. A `this.name` member is trusted only when every write of its name qualifies, because the
   * class is not the only code that can set it (`wrapper.name = mock`, a subclass, an `Object.assign`).
   *
   * @typedef {object} NameWrites
   * @property {object[]} values NodePaths of every value written to a member of the name (`null` and `undefined` are
   * no value).
   * @property {boolean} opaque A write of a value the file does not show, or a `defineProperty`, or an accessor.
   */

  /**
   * @type {Map<string, NameWrites>}
   */
  const nameWrites = new Map();

  /**
   * Member names that some write in the file does not qualify, so no `this.<name>` member of that name is a grid.
   * Filled by `settleAll()`.
   *
   * @type {Set<string>}
   */
  const blockedNames = new Set();

  /**
   * Whether `.hotInstance` counts as the grid by its name. The wrappers expose it read-only, so a file that writes
   * a value to a member of that name that is not a grid, or declares a method or accessor of that name, is defining
   * something else. A declaration with no value, `null`, or `undefined` (a Vue `data()` that returns
   * `{ hotInstance: null }`) is neutral, like a variable's.
   *
   * @returns {boolean} `true` when no write of the name takes the trust away.
   */
  const hotInstanceTrusted = () => !blockedNames.has('hotInstance');

  /**
   * The writes of a member name, created on the first sighting.
   *
   * @param {string} name The member name.
   * @returns {NameWrites} The writes.
   */
  const nameEntry = (name) => {
    if (!nameWrites.has(name)) {
      nameWrites.set(name, { values: [], opaque: false });
    }

    return nameWrites.get(name);
  };

  /**
   * Record a write of a member name.
   *
   * @param {string} name The member name.
   * @param {object|null} valuePath NodePath of the value, `null` when the file does not show it.
   */
  const noteNameWrite = (name, valuePath) => {
    const entry = nameEntry(name);

    if (!valuePath) {
      entry.opaque = true;
    } else if (!isNeutral(valuePath)) {
      entry.values.push(valuePath);
    }
  };

  /**
   * Record a write to a binding or a `this` member.
   *
   * @param {object} targetPath NodePath of the write target.
   * @param {object|null} valuePath NodePath of the value, `null` when the file does not show it.
   */
  const noteWrite = (targetPath, valuePath) => {
    const target = unwrapPath(targetPath);
    let history = null;

    if (target.node.type === 'Identifier') {
      const binding = lookup(target, target.node.name, 'value');

      history = binding ? bindingHistory(binding) : null;
    } else if (MEMBER_TYPES.has(target.node.type)) {
      const object = unwrapPath(target.get('object'));
      const member = memberOf(target);
      const written = memberName(target.node);

      if (written !== null) {
        noteNameWrite(written, valuePath);
      }

      if (member) {
        history = memberHistory(member.classNode, member.key);
      } else if (object.node.type === 'ThisExpression' && memberName(target.node) === null) {
        // `this[key] = value` can set any member.
        const owner = thisOwner(object);

        if (owner) {
          unreadableClasses.add(owner.classNode);
        }
      }
    }

    if (!history || (valuePath && isNeutral(valuePath))) {
      return;
    }

    if (valuePath) {
      history.values.push(valuePath);
    } else {
      history.opaque = true;
    }
  };

  /**
   * The targets a destructuring or plain assignment target writes.
   *
   * @param {object} path NodePath of a target or pattern.
   * @param {object[]} [out] Accumulator.
   * @returns {object[]} NodePaths of identifiers and member expressions.
   */
  const targetsOf = (path, out = []) => {
    const target = unwrapPath(path);

    switch (target.node.type) {
      case 'Identifier':
      case 'MemberExpression':
      case 'OptionalMemberExpression':
        out.push(target);
        break;
      case 'ObjectPattern':
        target.node.properties.forEach((property, index) => targetsOf(property.type === 'RestElement'
          || property.type === 'RestProperty' ? target.get('properties', index, 'argument')
          : target.get('properties', index, 'value'), out));
        break;
      case 'ArrayPattern':
        target.node.elements.forEach((element, index) => element && targetsOf(target.get('elements', index), out));
        break;
      case 'AssignmentPattern':
        targetsOf(target.get('left'), out);
        break;
      case 'RestElement':
        targetsOf(target.get('argument'), out);
        break;
      default:
        break;
    }

    return out;
  };

  /**
   * Record a write of a value the file does not show to every target of a pattern.
   *
   * @param {object} path NodePath of a target or pattern.
   * @returns {void}
   */
  const noteOpaque = path => targetsOf(path).forEach(target => noteWrite(target, null));

  let isHolder;

  /**
   * Whether an initializer expression creates a ref holder typed as a grid instance, such as
   * `useRef<Handsontable>(null)`.
   *
   * @param {object|null} init The initializer node.
   * @returns {boolean} `true` for a typed holder call.
   */
  const isHolderCall = (init) => {
    const node = init ? unwrapNode(init) : null;

    return Boolean(node && (node.type === 'CallExpression' || node.type === 'OptionalCallExpression')
      && HOLDER_CALLEES.has(calleeName(node.callee)) && isHotType(typeArguments(node)[0]));
  };

  /**
   * Whether a history qualifies as a grid instance holder, once its values are known.
   *
   * @param {History|undefined} history The history.
   * @returns {boolean} `true` when every value was set from a holder call.
   */
  const holdsOnlyHolders = history => Boolean(history && history.variable && !history.opaque
    && history.values.length > 0 && history.values.every(path => isHolderCall(path.node)));

  /**
   * Classify an expression path as a grid instance.
   *
   * @param {object} path Expression NodePath.
   * @param {number} depth Recursion guard.
   * @returns {boolean} `true` for a grid instance.
   */
  const classify = (path, depth = 0) => {
    if (depth > MAX_DEPTH || !path || !path.node) {
      return false;
    }

    if (castsToForeign(path.node)) {
      return false;
    }

    const target = unwrapPath(path);
    const node = target.node;

    switch (node.type) {
      case 'NewExpression': {
        const callee = unwrapPath(target.get('callee'));

        return callee.node.type === 'Identifier' ? isNamespaceIdentifier(callee)
          : ['default', 'Core'].includes(resolveNamespaceMember(callee));
      }
      case 'MemberExpression':
      case 'OptionalMemberExpression': {
        const name = memberName(node);

        if (name === 'hotInstance' && hotInstanceTrusted()) {
          return true;
        }

        if (name === 'current' || name === 'value') {
          return isHolder(target.get('object'), depth + 1);
        }

        const member = memberOf(target);

        if (!member || unreadableClasses.has(member.classNode)) {
          return false;
        }

        return Boolean(memberSeeds.get(member.classNode)?.has(member.key)
          || memberHistories.get(member.classNode)?.get(member.key)?.qualified);
      }
      case 'Identifier': {
        const binding = lookup(target, node.name, 'value');

        if (!binding) {
          return false;
        }

        const { canonical } = canonicalOf(binding);

        return seededIds.has(binding.idNode) || seededIds.has(canonical.idNode)
          || Boolean(bindingHistories.get(canonical.idNode)?.qualified);
      }
      case 'AssignmentExpression':
        return node.operator === '=' && classify(target.get('right'), depth + 1);
      default:
        return false;
    }
  };

  isHolder = (path) => {
    const target = unwrapPath(path);
    const node = target.node;

    if (node.type === 'Identifier') {
      const binding = lookup(target, node.name, 'value');

      if (!binding) {
        return false;
      }

      const { canonical } = canonicalOf(binding);

      return holderSeededIds.has(binding.idNode) || holderSeededIds.has(canonical.idNode)
        || holdsOnlyHolders(bindingHistories.get(canonical.idNode));
    }

    const member = memberOf(target);

    if (!member || unreadableClasses.has(member.classNode)) {
      return false;
    }

    return Boolean(holderMemberSeeds.get(member.classNode)?.has(member.key)
      || holdsOnlyHolders(memberHistories.get(member.classNode)?.get(member.key)));
  };

  root.find(j.Identifier).forEach((path) => {
    const node = path.node;

    if (node.type !== 'Identifier' || !node.typeAnnotation) {
      return;
    }

    if (isHotType(node.typeAnnotation)) {
      seededIds.add(node);
    } else if (isHolderType(node.typeAnnotation)) {
      holderSeededIds.add(node);
    }
  });

  // Every write of the file is read once. A name is trusted only when every value it can hold is shown.
  root.find(j.VariableDeclarator).forEach((path) => {
    if (path.node.id.type === 'Identifier') {
      if (path.node.init) {
        noteWrite(path.get('id'), path.get('init'));
      }

      // The compiler holds every value of the name to its type: a type of the project makes the name the project's.
      if (isForeignType(path.node.id.typeAnnotation)) {
        const binding = lookup(path.get('id'), path.node.id.name, 'value');

        if (binding) {
          bindingHistory(binding).foreign = true;
        }
      }
    } else {
      noteOpaque(path.get('id'));
    }
  });

  root.find(j.AssignmentExpression).forEach((path) => {
    const left = unwrapPath(path.get('left'));
    const plain = left.node.type === 'Identifier' || MEMBER_TYPES.has(left.node.type);

    if (plain && VALUE_OPERATORS.has(path.node.operator)) {
      noteWrite(left, path.get('right'));
    } else {
      noteOpaque(left);
    }
  });

  root.find(j.UpdateExpression).forEach(path => noteOpaque(path.get('argument')));

  [...root.find(j.ForInStatement).paths(), ...root.find(j.ForOfStatement).paths()].forEach((path) => {
    if (path.node.left.type === 'VariableDeclaration') {
      path.node.left.declarations.forEach((declarator, index) => noteOpaque(path.get('left', 'declarations', index,
        'id')));
    } else {
      noteOpaque(path.get('left'));
    }
  });

  root.find(j.CallExpression).forEach((path) => {
    const callee = unwrapNode(path.node.callee);
    const name = MEMBER_TYPES.has(callee?.type) && callee.object?.type === 'Identifier'
      ? `${callee.object.name}.${memberName(callee)}` : null;

    if (name && SETS_MEMBERS.has(name) && path.node.arguments.length > 0) {
      const subject = unwrapPath(path.get('arguments', 0));
      const owner = subject.node.type === 'ThisExpression' ? thisOwner(subject) : null;

      if (owner) {
        unreadableClasses.add(owner.classNode);
      }
    }
  });

  root.find(j.ClassProperty).forEach((path) => {
    const classNode = enclosingClass(path);
    const name = propertyName(path.node);

    if (!classNode) {
      return;
    }

    if (name === null) {
      unreadableClasses.add(classNode);

      return;
    }

    const key = `${path.node.static ? 'static ' : ''}${name}`;

    if (path.node.value && !isNeutral(path.get('value'))) {
      memberHistory(classNode, key).values.push(path.get('value'));
    }

    // A field of any class of the file is a write of its name, whichever class reads it.
    if (path.node.value) {
      noteNameWrite(name, path.get('value'));
    }

    if (isHolderType(path.node.typeAnnotation)) {
      addSeed(holderMemberSeeds, classNode, key);
    }

    if (isHotType(path.node.typeAnnotation)) {
      addSeed(memberSeeds, classNode, key);
    } else if (isForeignType(path.node.typeAnnotation)) {
      memberHistory(classNode, key).foreign = true;
    }
  });

  [...root.find(j.ClassMethod).paths(), ...root.find(j.ClassPrivateMethod).paths()].forEach((path) => {
    const classNode = enclosingClass(path);
    const name = path.node.type === 'ClassMethod' ? propertyName(path.node) : null;

    if (!classNode || path.node.kind === 'constructor') {
      return;
    }

    if (name === null) {
      if (path.node.type === 'ClassMethod') {
        unreadableClasses.add(classNode);
      }

      return;
    }

    // A method or an accessor of the same name stands in for the member.
    memberHistory(classNode, `${path.node.static ? 'static ' : ''}${name}`).opaque = true;
    noteNameWrite(name, null);
  });

  root.find(j.TSParameterProperty).forEach((path) => {
    const classNode = enclosingClass(path);
    const parameter = path.node.parameter?.type === 'AssignmentPattern' ? path.node.parameter.left
      : path.node.parameter;

    if (!classNode || parameter?.type !== 'Identifier') {
      return;
    }

    if (isHotType(parameter.typeAnnotation)) {
      addSeed(memberSeeds, classNode, parameter.name);
    } else if (isHolderType(parameter.typeAnnotation)) {
      addSeed(holderMemberSeeds, classNode, parameter.name);
    } else {
      memberHistory(classNode, parameter.name).opaque = true;
      noteNameWrite(parameter.name, null);
    }
  });

  // An object literal key is a write of its name. `Object.assign(wrapper, { hot: mock })` and a literal that a
  // function returns set a member as much as `wrapper.hot = mock` does.
  root.find(j.ObjectExpression).forEach((path) => {
    path.node.properties.forEach((property, index) => {
      const name = propertyName(property) ?? (property.computed ? stringValue(property.key) : null);

      if (name === null) {
        return;
      }

      if (property.type === 'ObjectProperty' || property.type === 'Property') {
        noteNameWrite(name, path.get('properties', index, 'value'));
      } else if (property.type === 'ObjectMethod') {
        noteNameWrite(name, null);
      }
    });
  });

  // `Object.defineProperty(x, 'name', ...)` and `Reflect.set(x, 'name', value)` write a name the file shows.
  root.find(j.CallExpression).forEach((path) => {
    const callee = unwrapNode(path.node.callee);
    const label = MEMBER_TYPES.has(callee?.type) && callee.object?.type === 'Identifier'
      ? `${callee.object.name}.${memberName(callee)}` : null;

    if (label && SETS_MEMBERS.has(label)) {
      const written = stringValue(path.node.arguments[1]);

      if (written !== null) {
        noteNameWrite(written, null);
      }
    }
  });

  /**
   * Mark every history whose values are all grid instances. A name that is set from another name counts once the
   * other one does, and a cycle never does.
   */
  const settle = () => {
    for (let changed = true; changed;) {
      changed = false;

      for (const history of histories) {
        if (!history.qualified && history.variable && !history.opaque && !history.foreign
          && history.values.length > 0 && !(history.guard && unreadableClasses.has(history.guard))
          && !(history.member && blockedNames.has(history.member))
          && history.values.every(value => classify(value))) {
          history.qualified = true;
          changed = true;
        }
      }
    }
  };

  /**
   * Whether a value written to a member name leaves the member a grid: `null` and `undefined` never reach here, a
   * read of a member of the same name is a copy of what the name already holds, and anything else must be a grid.
   *
   * @param {object} value NodePath of the value.
   * @param {string} name The member name.
   * @returns {boolean} `true` when the write qualifies.
   */
  const qualifiesAs = (value, name) => {
    const node = unwrapNode(value.node);

    return (MEMBER_TYPES.has(node.type) && memberName(node) === name) || classify(value);
  };

  /**
   * Settle the histories, then take the trust away from every member name that some write in the file does not
   * qualify (an outside `wrapper.hot = mock`, an `Object.assign(wrapper, { hot: mock })`, a subclass that sets it),
   * and settle again without those members. A blocked name only grows, so the loop ends. A name is judged only when
   * a member history or `.hotInstance` asks for it.
   */
  const settleAll = () => {
    const judged = new Set(['hotInstance']);

    histories.forEach((history) => {
      if (history.member) {
        judged.add(history.member);
      }
    });

    for (;;) {
      histories.forEach((history) => {
        history.qualified = false;
      });
      settle();

      let grew = false;

      for (const name of judged) {
        const entry = nameWrites.get(name);

        if (entry && !blockedNames.has(name)
          && (entry.opaque || !entry.values.every(value => qualifiesAs(value, name)))) {
          blockedNames.add(name);
          grew = true;
        }
      }

      if (!grew) {
        return;
      }
    }
  };

  settleAll();

  /**
   * Whether a value is a read of a member of the given name, which copies what the name already holds.
   *
   * @param {object} value NodePath of the value.
   * @param {string} name The member name.
   * @returns {boolean} `true` for `x.<name>`.
   */
  const readsSameName = (value, name) => {
    const node = unwrapNode(value.node);

    return MEMBER_TYPES.has(node.type) && memberName(node) === name;
  };

  /**
   * The keys that every value of a name or `this` member gives, or `null` when any value gives none, the history is
   * opaque, or the name is not a plain variable. A `this` member also answers for every write of its name in the
   * file (see `NameWrites`).
   *
   * @param {object} target Unwrapped expression NodePath of the name or the member.
   * @param {(value: object) => (string|null)} accept The key a value gives, `null` when it gives none.
   * @returns {string[]|null} The keys.
   */
  const keysAt = (target, accept) => {
    let history;

    if (target.node.type === 'Identifier') {
      const binding = lookup(target, target.node.name, 'value');

      history = binding ? bindingHistories.get(canonicalOf(binding).canonical.idNode) : null;
    } else {
      const member = memberOf(target);

      history = member ? memberHistories.get(member.classNode)?.get(member.key) : null;
    }

    if (!history || !history.variable || history.opaque || history.values.length === 0
      || (history.guard && unreadableClasses.has(history.guard))) {
      return null;
    }

    const keys = [];

    for (const value of history.values) {
      const key = accept(value);

      if (key === null) {
        return null;
      }

      keys.push(key);
    }

    const entry = history.member ? nameWrites.get(history.member) : null;

    if (entry) {
      if (entry.opaque) {
        return null;
      }

      for (const value of entry.values) {
        if (history.values.some(own => own.node === value.node) || readsSameName(value, history.member)) {
          continue;
        }

        const key = accept(value);

        if (key === null) {
          return null;
        }

        keys.push(key);
      }
    }

    return keys;
  };

  /**
   * Whether a host of a `getPlugin()` call counts as the grid: only an instance the file shows, as for the method
   * rules of the core instance. A receiver that the file shows to be something else (a local object, a class, an
   * import) and a receiver that the file does not show (a parameter, a global, a call result) do not. `isGridNamed()`
   * is the looser choice, a parameter named `hot` taken for the grid: `confirmsHost` is the one place to make it.
   *
   * @param {'instance'|'unknown'|'other'} host The host.
   * @returns {boolean} `true` when a `getPlugin()` call on it gives a plugin.
   */
  const confirmsHost = host => host === 'instance';

  /**
   * The receivers whose host is being worked out, so `plugin = plugin.getPlugin('k')` ends.
   *
   * @type {Set<object>}
   */
  const resolvingHosts = new Set();
  let api = null;

  /**
   * A `<x>.getPlugin('<key>')` call and what `<x>` is: `instance` when `isInstance()` confirms it, `other` when the
   * file shows it is something else (a local object that stands in for the grid), and `unknown` for any other
   * receiver.
   *
   * @param {object} path Expression NodePath.
   * @returns {{key: string, host: 'instance'|'unknown'|'other'}|null} The call, or `null` for any other expression.
   */
  const pluginCallOf = (path) => {
    const target = unwrapPath(path);
    const key = pluginKeyOf(target.node);

    if (key === null) {
      return null;
    }

    const object = unwrapPath(unwrapPath(target.get('callee')).get('object'));

    if (resolvingHosts.has(object.node)) {
      return { key, host: 'unknown' };
    }

    resolvingHosts.add(object.node);

    try {
      return { key, host: receiverOfGrid(object, api) };
    } finally {
      resolvingHosts.delete(object.node);
    }
  };

  /**
   * The key of a value that is a `getPlugin()` call on a host that counts as the grid.
   *
   * @param {object} value NodePath of the value.
   * @returns {string|null} The key, or `null`.
   */
  const confirmedKeyOf = (value) => {
    const call = pluginCallOf(value);

    return call && confirmsHost(call.host) ? call.key : null;
  };

  /**
   * The plugin keys a name or `this` member is set from, or `null` when some value is not a `getPlugin()` call on a
   * host that counts as the grid.
   *
   * @param {object} target Unwrapped expression NodePath.
   * @returns {string[]|null} The plugin keys.
   */
  const pluginKeysAt = target => keysAt(target, confirmedKeyOf);

  /**
   * Whether an expression is a plugin of one of the given keys: a direct `<x>.getPlugin('<key>')` call, or a
   * variable or `this` member that the file sets from such a call. In both, `<x>` must be an instance the file shows.
   * A local object that stands in for the grid (`fake.getPlugin('k')`) is not, and neither is a receiver the file
   * does not show. Every value the name can hold, the initializer and every assignment anywhere, must be a listed plugin.
   * `getPlugin()` upper-cases the first letter of its argument, so `'exportFile'` and `'ExportFile'` name the same
   * plugin.
   *
   * @param {object} path Expression NodePath.
   * @param {string[]} keys Plugin keys the receiver may be.
   * @returns {boolean} `true` when the file shows the receiver is one of those plugins.
   */
  const isPluginReceiver = (path, keys) => {
    const allowed = new Set(keys.map(registryName));
    const target = unwrapPath(path);
    const direct = pluginCallOf(target);

    if (direct !== null) {
      return allowed.has(registryName(direct.key)) && confirmsHost(direct.host);
    }

    const found = pluginKeysAt(target);

    return Boolean(found) && found.every(key => allowed.has(registryName(key)));
  };

  /**
   * Whether an expression is a plugin of any key, whatever it is called on: a direct `getPlugin()` call, or a name
   * or `this` member that the file sets only from such calls. It tells a plugin from the grid, so a mock host does
   * not matter.
   *
   * @param {object} path Expression NodePath.
   * @returns {boolean} `true` when the file shows the expression is a plugin.
   */
  const isPlugin = (path) => {
    const target = unwrapPath(path);

    return pluginKeyOf(target.node) !== null || keysAt(target, value => pluginKeyOf(value.node)) !== null;
  };

  /**
   * Everything the file sets a name or a `this` member from.
   *
   * @param {object} path NodePath of an `Identifier`, or of a member expression on `this`.
   * @returns {{values: object[], opaque: boolean, variable: boolean}|null} The history, or `null` for a global
   * and for an expression that is neither.
   */
  const valuesOf = (path) => {
    const target = unwrapPath(path);

    if (target.node.type === 'Identifier') {
      const binding = lookup(target, target.node.name, 'value');

      if (!binding) {
        return null;
      }

      const history = bindingHistories.get(canonicalOf(binding).canonical.idNode);

      return history ? { values: history.values, opaque: history.opaque, variable: history.variable }
        : { values: [], opaque: false, variable: VARIABLE_KINDS.has(binding.kind) };
    }

    const member = memberOf(target);
    const history = member ? memberHistories.get(member.classNode)?.get(member.key) : null;

    if (!history) {
      return null;
    }

    // Every write of the name counts, wherever it is: `wrapper.hot = mock` is a value of `this.hot` too.
    const entry = history.member ? nameWrites.get(history.member) : null;
    const outside = entry ? entry.values.filter(value => !history.values.some(own => own.node === value.node)) : [];

    return {
      values: outside.length > 0 ? [...history.values, ...outside] : history.values,
      opaque: history.opaque || unreadableClasses.has(member.classNode) || Boolean(entry?.opaque),
      variable: true,
    };
  };

  /**
   * Whether an expression is, or can be by a branch, a `getPlugin()` call of a listed key. It reads the syntax only: the
   * host of the call is not checked.
   *
   * @param {object} node An expression node.
   * @param {Set<string>} allowed The registry names of the listed keys.
   * @returns {boolean} `true` for such a call.
   */
  const listsNode = (node, allowed) => {
    const value = unwrapNode(node);

    if (value.type === 'ConditionalExpression') {
      return listsNode(value.consequent, allowed) || listsNode(value.alternate, allowed);
    }

    if (value.type === 'LogicalExpression') {
      return listsNode(value.left, allowed) || listsNode(value.right, allowed);
    }

    const key = pluginKeyOf(value);

    return key !== null && allowed.has(registryName(key));
  };

  /**
   * Whether a member read (`o.p`) names a property of a module-level `const` object literal whose value passes the
   * test. One hop: the object is the literal the `const` holds, and the property is a plain key of it.
   *
   * @param {object} target The member NodePath.
   * @param {(node: object) => boolean} test The test on the value of the property.
   * @returns {boolean} `true` when such a property exists.
   */
  const heldInObject = (target, test) => {
    if (!MEMBER_TYPES.has(target.node.type)) {
      return false;
    }

    const name = memberName(target.node);
    const holder = unwrapPath(target.get('object'));

    if (name === null || holder.node.type !== 'Identifier') {
      return false;
    }

    const binding = lookup(holder, holder.node.name, 'value');
    const plain = binding?.kind === 'const' && binding.node?.id === binding.idNode && binding.init;
    const init = plain ? unwrapNode(binding.init) : null;

    return init?.type === 'ObjectExpression' && init.properties.some(property => property.type === 'ObjectProperty'
      && !property.computed && propertyName(property) === name && test(property.value));
  };

  /**
   * Whether a name or `this` member is a plugin of one of the keys on at least one path, without being one on
   * every path. A call on it may be on the plugin, so a rule reports it instead of leaving it silent.
   *
   * @param {object} path Expression NodePath.
   * @param {string[]} keys Plugin keys.
   * @returns {boolean} `true` when some value of the name is a `getPlugin()` call of a listed key.
   */
  const isPartlyPlugin = (path, keys) => {
    const allowed = new Set(keys.map(registryName));
    const lists = (value) => {
      const target = unwrapPath(value);

      // A branch of a conditional, or an operand of `||`, `&&`, and `??`, can be the value of the name.
      if (target.node.type === 'ConditionalExpression') {
        return lists(target.get('consequent')) || lists(target.get('alternate'));
      }

      if (target.node.type === 'LogicalExpression') {
        return lists(target.get('left')) || lists(target.get('right'));
      }

      const call = pluginCallOf(target);

      return call !== null && call.host !== 'other' && allowed.has(registryName(call.key));
    };
    const target = unwrapPath(path);

    if (pluginKeyOf(target.node) !== null) {
      return lists(target);
    }

    if (heldInObject(target, node => listsNode(node, allowed))) {
      return true;
    }

    const history = valuesOf(target);

    return Boolean(history?.variable) && history.values.some(lists);
  };

  const getComponent = (path) => {
    let target = path;

    if (target.node.type === 'JSXElement') {
      target = target.get('openingElement', 'name');
    } else if (target.node.type === 'JSXOpeningElement') {
      target = target.get('name');
    }

    if (target.node.type !== 'JSXIdentifier') {
      return null;
    }

    const binding = lookup(target, target.node.name, 'value');

    return binding ? componentIds.get(binding.idNode) ?? null : null;
  };

  const namespace = [...new Set([...namespaceIds].map(node => node.name))];

  if (flags.global && !namespace.includes('Handsontable')) {
    namespace.push('Handsontable');
  }

  const components = { HotTable: [], HotColumn: [] };

  componentIds.forEach((component, node) => {
    if (!components[component].includes(node.name)) {
      components[component].push(node.name);
    }
  });

  api = {
    namespace,
    components,
    angular: flags.angular,
    vue: flags.vue,
    isHotFile: flags.hotImport || namespace.length > 0 || componentIds.size > 0 || flags.angular || flags.vue,
    isModular: valueSources.has('base') && !valueSources.has('handsontable'),
    isInstance: path => classify(path),
    isPluginReceiver,
    isPlugin,
    isPartlyPlugin,
    pluginCallOf,
    valuesOf,
    resolveNamespaceMember,
    isNamespaceIdentifier,
    getComponent,
    resolveTypeName: typeName => resolveTypeNode(typeName.node ?? typeName),
  };

  return api;
}

/**
 * The bindings of a part, read once while no edit is recorded: the same value goes to every transform and every
 * version that asks (see `ctx.derived()`). A caller that edits the tree calls `ctx.markChanged()`, and the next call
 * reads the tree again. A context without `derived` (a test that builds its own) reads it each time.
 *
 * @param {object} ctx The transform context of a js part.
 * @returns {HotBindings} What the file binds to Handsontable.
 */
export function hotBindingsOf(ctx) {
  const compute = () => collectHotBindings(ctx.j, ctx.root);

  return ctx.derived ? ctx.derived('hotBindings', compute) : compute();
}
