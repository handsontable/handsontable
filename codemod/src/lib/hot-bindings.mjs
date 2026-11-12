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
  memberName,
  pluginKeyOf,
  propertyName,
  stringValue,
  typeArguments,
  unwrapNode,
  unwrapPath,
} from './ast.mjs';
import { invalidateScope, lookup, moduleBindings, referenceSpace } from './scope.mjs';

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
 * one of those. An unrelated `.undo()` receiver gives `false`.
 * @property {(path: object, keys: string[]) => boolean} isPluginReceiver Whether an expression NodePath is a
 * plugin of one of the keys: a direct `<x>.getPlugin('<key>')` call (optional chaining included), or a variable
 * or `this` member that the file sets from such a call. One hop, and every value the name is set from must be a
 * listed plugin.
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
const MAX_PASSES = 5;
const MAX_DEPTH = 8;

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
 * Whether a receiver is unresolved: the file shows neither what it is nor that it is something else. A `this` or
 * `super` receiver, a member chain rooted at one, a local object, class, function, or import, and a plugin
 * looked up by key are resolved. A global, a parameter, and the result of another call are not.
 *
 * @param {object} path The receiver NodePath.
 * @returns {boolean} `true` when a call on it may still be on the thing a rule is about.
 */
export function isUnresolvedReceiver(path) {
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

  return !(binding.init && LOCAL_VALUE_TYPES.has(unwrapNode(binding.init).type));
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

    return binding ? namespaceIds.has(binding.idNode) : flags.global && path.node.name === 'Handsontable';
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
    const node = typeNode?.type === 'TSTypeAnnotation' ? typeNode.typeAnnotation : typeNode;

    if (node?.type !== 'TSTypeReference') {
      return false;
    }

    const name = node.typeName.type === 'TSQualifiedName' ? node.typeName.right.name : node.typeName.name;

    return HOLDER_TYPES.has(name) && isHotType(typeArguments(node)[0]);
  };

  const trackedIds = new Set();
  const holderIds = new Set();
  let additions = 0;
  const classTracked = new WeakMap();
  const classHolders = new WeakMap();

  /**
   * The class node that encloses a path, for `this.x` lookups.
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

  const classHas = (table, path, name) => {
    const classNode = enclosingClass(path);

    return Boolean(classNode && table.get(classNode)?.has(name));
  };

  /**
   * Add a name to a per-class set.
   *
   * @param {WeakMap<object, Set<string>>} table Per-class sets.
   * @param {object} classNode The class node.
   * @param {string} name The property name.
   */
  const classAdd = (table, classNode, name) => {
    if (!table.has(classNode)) {
      table.set(classNode, new Set());
    }

    if (!table.get(classNode).has(name)) {
      table.get(classNode).add(name);
      additions += 1;
    }
  };

  /**
   * Record a binding as a grid instance.
   *
   * @param {object} idNode The declaring identifier node.
   */
  const track = (idNode) => {
    if (!trackedIds.has(idNode)) {
      trackedIds.add(idNode);
      additions += 1;
    }
  };

  let isHolder;

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

        if (name === 'hotInstance') {
          return true;
        }

        if (name === 'current' || name === 'value') {
          return isHolder(target.get('object'), depth + 1);
        }

        return node.object.type === 'ThisExpression' && name !== null && classHas(classTracked, target, name);
      }
      case 'Identifier': {
        const binding = lookup(target, node.name, 'value');

        return Boolean(binding && trackedIds.has(binding.idNode));
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

      return Boolean(binding && holderIds.has(binding.idNode));
    }

    if ((node.type === 'MemberExpression' || node.type === 'OptionalMemberExpression')
      && node.object.type === 'ThisExpression') {
      const name = memberName(node);

      return name !== null && classHas(classHolders, target, name);
    }

    return false;
  };

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

  root.find(j.Identifier).forEach((path) => {
    const node = path.node;

    if (node.type !== 'Identifier' || !node.typeAnnotation) {
      return;
    }

    if (isHotType(node.typeAnnotation)) {
      track(node);
    } else if (isHolderType(node.typeAnnotation)) {
      holderIds.add(node);
    }
  });

  const declarators = root.find(j.VariableDeclarator).paths();
  const assignments = root.find(j.AssignmentExpression).paths();
  const classProperties = root.find(j.ClassProperty).paths();
  const parameterProperties = root.find(j.TSParameterProperty).paths();

  declarators.forEach((path) => {
    if (path.node.id.type === 'Identifier' && isHolderCall(path.node.init)) {
      holderIds.add(path.node.id);
    }
  });

  classProperties.forEach((path) => {
    const classNode = enclosingClass(path);
    const name = propertyName(path.node);

    if (!classNode || name === null) {
      return;
    }

    if (isHolderType(path.node.typeAnnotation) || isHolderCall(path.node.value)) {
      classAdd(classHolders, classNode, name);
    }

    if (isHotType(path.node.typeAnnotation)) {
      classAdd(classTracked, classNode, name);
    }
  });

  parameterProperties.forEach((path) => {
    const classNode = enclosingClass(path);
    const parameter = path.node.parameter?.type === 'AssignmentPattern' ? path.node.parameter.left
      : path.node.parameter;

    if (classNode && parameter?.type === 'Identifier' && isHotType(parameter.typeAnnotation)) {
      classAdd(classTracked, classNode, parameter.name);
    }
  });

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const before = additions;

    declarators.forEach((path) => {
      const id = path.node.id;

      if (id.type === 'Identifier' && path.node.init && classify(path.get('init'))) {
        track(id);
      }
    });

    classProperties.forEach((path) => {
      const classNode = enclosingClass(path);
      const name = propertyName(path.node);

      if (classNode && name !== null && path.node.value && classify(path.get('value'))) {
        classAdd(classTracked, classNode, name);
      }
    });

    assignments.forEach((path) => {
      if (path.node.operator !== '=') {
        return;
      }

      const left = unwrapPath(path.get('left'));

      if (!classify(path.get('right'))) {
        return;
      }

      if (left.node.type === 'Identifier') {
        const binding = lookup(left, left.node.name, 'value');

        if (binding) {
          track(binding.idNode);
        }
      } else if ((left.node.type === 'MemberExpression' || left.node.type === 'OptionalMemberExpression')
        && left.node.object.type === 'ThisExpression') {
        const classNode = enclosingClass(left);
        const name = memberName(left.node);

        if (classNode && name !== null) {
          classAdd(classTracked, classNode, name);
        }
      }
    });

    if (additions === before) {
      break;
    }
  }

  /**
   * Plugin keys each binding and each `this` member is set from, filled on the first query.
   *
   * @type {{ids: Map<object, Set<string>>, members: WeakMap<object, Map<string, Set<string>>>}|null}
   */
  let pluginTable = null;

  /**
   * Fill `pluginTable` from the declarators, assignments, and class properties of the file.
   *
   * @returns {{ids: Map<object, Set<string>>, members: WeakMap<object, Map<string, Set<string>>>}} The table.
   */
  const buildPluginTable = () => {
    const ids = new Map();
    const members = new WeakMap();
    const note = (table, key, pluginKey) => {
      if (!table.has(key)) {
        table.set(key, new Set());
      }

      table.get(key).add(pluginKey);
    };
    const noteMember = (classNode, name, pluginKey) => {
      if (!members.has(classNode)) {
        members.set(classNode, new Map());
      }

      note(members.get(classNode), name, pluginKey);
    };

    declarators.forEach((path) => {
      const pluginKey = pluginKeyOf(path.node.init);

      if (path.node.id.type === 'Identifier' && pluginKey !== null) {
        note(ids, path.node.id, pluginKey);
      }
    });

    assignments.forEach((path) => {
      const pluginKey = path.node.operator === '=' ? pluginKeyOf(path.node.right) : null;
      const left = unwrapPath(path.get('left'));

      if (pluginKey === null) {
        return;
      }

      if (left.node.type === 'Identifier') {
        const binding = lookup(left, left.node.name, 'value');

        if (binding) {
          note(ids, binding.idNode, pluginKey);
        }
      } else if ((left.node.type === 'MemberExpression' || left.node.type === 'OptionalMemberExpression')
        && left.node.object.type === 'ThisExpression') {
        const classNode = enclosingClass(left);
        const name = memberName(left.node);

        if (classNode && name !== null) {
          noteMember(classNode, name, pluginKey);
        }
      }
    });

    classProperties.forEach((path) => {
      const classNode = enclosingClass(path);
      const name = propertyName(path.node);
      const pluginKey = pluginKeyOf(path.node.value);

      if (classNode && name !== null && pluginKey !== null) {
        noteMember(classNode, name, pluginKey);
      }
    });

    return { ids, members };
  };

  /**
   * Whether an expression is a plugin of one of the given keys: a direct `<x>.getPlugin('<key>')` call, or a
   * variable or `this` member that the file sets from such a call. Every value the name
   * is set from must be a listed plugin.
   *
   * @param {object} path Expression NodePath.
   * @param {string[]} keys Plugin keys the receiver may be.
   * @returns {boolean} `true` when the file shows the receiver is one of those plugins.
   */
  const isPluginReceiver = (path, keys) => {
    const allowed = new Set(keys);
    const target = unwrapPath(path);
    const direct = pluginKeyOf(target.node);

    if (direct !== null) {
      return allowed.has(direct);
    }

    pluginTable = pluginTable ?? buildPluginTable();

    let found = null;

    if (target.node.type === 'Identifier') {
      const binding = lookup(target, target.node.name, 'value');

      found = binding ? pluginTable.ids.get(binding.idNode) : null;
    } else if ((target.node.type === 'MemberExpression' || target.node.type === 'OptionalMemberExpression')
      && target.node.object.type === 'ThisExpression') {
      const classNode = enclosingClass(target);
      const name = memberName(target.node);

      found = classNode && name !== null ? pluginTable.members.get(classNode)?.get(name) : null;
    }

    return Boolean(found) && [...found].every(key => allowed.has(key));
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

  return {
    namespace,
    components,
    angular: flags.angular,
    vue: flags.vue,
    isHotFile: flags.hotImport || namespace.length > 0 || componentIds.size > 0 || flags.angular || flags.vue,
    isModular: valueSources.has('base') && !valueSources.has('handsontable'),
    isInstance: path => classify(path),
    isPluginReceiver,
    resolveNamespaceMember,
    isNamespaceIdentifier,
    getComponent,
    resolveTypeName: typeName => resolveTypeNode(typeName.node ?? typeName),
  };
}
