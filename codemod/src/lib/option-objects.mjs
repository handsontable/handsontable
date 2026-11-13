/**
 * Finds the object literals in a file that hold Handsontable options (grid, column, and cell settings), with a
 * confidence for each, and the JSX attributes of the wrapper components that act as options. Option rules use
 * it to decide whether a key such as `correctFormat` is Handsontable's before they touch it.
 *
 * A match is `high` when the file shows it: the second argument of `new <namespace>(...)`, the argument of
 * `.updateSettings()`, `settings={...}` on a wrapper component, a `GridSettings` (or similar) annotation, and
 * what hangs below those (`columns`, `cell`, `cells`, also as props of a wrapper component). The elements of an
 * array annotated `ColumnSettings[]` (also `readonly ColumnSettings[]`, `Array<ColumnSettings>`, and `satisfies` one
 * of them) are column objects of the same confidence, and an object annotated `Events` is a map of hooks (role
 * `hooks`). It is `medium` when only the keys suggest it.
 *
 * @module lib/option-objects
 */

import { readFileSync } from 'node:fs';
import {
  calleeName,
  isFunctionNode,
  memberName,
  propertyName,
  typeArguments,
  unwrapPath,
} from './ast.mjs';
import { findReferences, invalidateScope, lookup } from './scope.mjs';

/**
 * One option object found in a file.
 *
 * @typedef {object} OptionObject
 * @property {object} path NodePath of the `ObjectExpression`.
 * @property {'high'|'medium'} confidence How sure the finder is that this is a Handsontable options object.
 * @property {'grid'|'column'|'cell'|'hooks'} role Which level of the cascade the object configures, or `hooks` for
 * a map of hook callbacks (an object annotated `Events`). A `medium` object that is not below another match is
 * reported as `grid`.
 * @property {string} origin Where the match came from: `new`, `updateSettings`, `jsx-settings`, `annotation`,
 * `columns`, `columns()`, `cell`, `cells()`, `spread`, or `heuristic`. A `:identifier` suffix means the object
 * was reached through a variable in the same file.
 * @property {string[]} [keys] For a `heuristic` object: the known option names it sets, in source order.
 */

/**
 * One option given as a JSX attribute of a wrapper component, or as a property of a spread object.
 *
 * @typedef {object} JsxOptionAttribute
 * @property {string} name Attribute or property name.
 * @property {object} attributePath NodePath of the `JSXAttribute`, or of the property for a spread object.
 * @property {object|null} valuePath NodePath of the value expression or string literal, `null` for a bare
 * boolean attribute (`<HotTable colHeaders />`), and the method itself for an object method.
 * @property {'grid'|'column'} elementRole `grid` for `HotTable`, `column` for `HotColumn`.
 * @property {boolean} viaSpread `true` for a property of a `{...settings}` spread that resolved to an object
 * literal in the same file.
 */

/**
 * Every known grid option name, from `known-options.json`.
 *
 * @type {Set<string>}
 */
export const KNOWN_OPTIONS = new Set(
  JSON.parse(readFileSync(new URL('./known-options.json', import.meta.url), 'utf8'))
);

/**
 * Option names too common in unrelated objects to count as evidence on their own. The `medium` heuristic needs
 * at least two known keys and at least one that is not in this set, so `{ width, height }` never matches.
 *
 * @type {Set<string>}
 */
export const GENERIC_OPTIONS = new Set([
  'data', 'type', 'title', 'label', 'width', 'height', 'className', 'source', 'language', 'locale', 'layout',
  'theme', 'themeName', 'density', 'colorScheme', 'search', 'filter', 'filters', 'dialog', 'loading',
  'notification', 'comments', 'undo', 'strict', 'editor', 'renderer', 'validator', 'placeholder', 'sanitizer',
  'tableClassName', 'headerClassName', 'initialState', 'pagination', 'selectionMode', 'rowId',
]);

/**
 * The renderer names that Handsontable registers (`RENDERER_TYPE` of every built-in renderer in the 17.1 and 18.x
 * packages). A string `renderer` outside this set names a renderer the project registered itself.
 *
 * @type {Set<string>}
 */
export const BUILT_IN_RENDERERS = new Set([
  'autocomplete', 'base', 'checkbox', 'date', 'dropdown', 'handsontable', 'html', 'intl-date', 'intl-datetime',
  'intl-time', 'multiselect', 'numeric', 'password', 'select', 'text', 'time',
]);

const IGNORED_ATTRIBUTES = new Set(['settings', 'ref', 'key']);
const TYPE_WRAPPERS = new Set(['Partial', 'Readonly', 'Required', 'Omit', 'Pick']);
const HOT_TYPE_ROLES = new Map([
  ['GridSettings', 'grid'],
  ['ColumnSettings', 'column'],
  ['CellProperties', 'cell'],
  ['CellMeta', 'cell'],
  ['Events', 'hooks'],
]);
const PROPERTY_TYPES = new Set(['ObjectProperty', 'Property', 'ObjectMethod']);
const MAX_RESOLVE_DEPTH = 4;

/**
 * Own named properties of an object literal.
 *
 * @param {object} objectPath NodePath of an `ObjectExpression`.
 * @returns {Array<{name: string, path: object}>} Properties with a plain or string-literal key, in source order.
 * Computed keys and spreads are left out.
 */
export function getProperties(objectPath) {
  const properties = [];

  objectPath.node.properties.forEach((node, index) => {
    const name = PROPERTY_TYPES.has(node.type) ? propertyName(node) : null;

    if (name !== null) {
      properties.push({ name, path: objectPath.get('properties', index) });
    }
  });

  return properties;
}

/**
 * Find a property of an object literal by name. Identifier and string-literal keys match, computed keys and
 * spreads are ignored. When the key appears twice, the last one wins, as it does at run time.
 *
 * @param {object} objectPath NodePath of an `ObjectExpression`.
 * @param {string} key Property name.
 * @returns {object|null} NodePath of the property (`ObjectProperty` or `ObjectMethod`), or `null`.
 */
export function getProperty(objectPath, key) {
  const matches = getProperties(objectPath).filter(property => property.name === key);

  return matches.length > 0 ? matches[matches.length - 1].path : null;
}

/**
 * Whether an object literal has a spread (`{...rest}`). When it does, a missing key may still come from the
 * spread, so a rule that needs to know a key is absent must not conclude it from `getProperty`.
 *
 * @param {object} objectPath NodePath of an `ObjectExpression`.
 * @returns {boolean} `true` when any property is a spread.
 */
export function hasSpread(objectPath) {
  return objectPath.node.properties.some(node => node.type === 'SpreadElement' || node.type === 'SpreadProperty'
    || node.type === 'ExperimentalSpreadProperty');
}

/**
 * The value of a property: its value expression, or the property itself for an object method.
 *
 * @param {object} propertyPath NodePath of an `ObjectProperty` or `ObjectMethod`.
 * @returns {object} NodePath of the value.
 */
export function getPropertyValue(propertyPath) {
  return propertyPath.node.type === 'ObjectMethod' ? propertyPath : propertyPath.get('value');
}

/**
 * Find a nested property by a dotted path, such as `numericFormat.culture`. Each step must be a plain object
 * literal (a type assertion or `satisfies` around it is fine).
 *
 * @param {object} objectPath NodePath of an `ObjectExpression`.
 * @param {string} dottedPath Property names joined by dots.
 * @returns {object|null} NodePath of the last property, or `null` when a step is missing or not an object
 * literal.
 */
export function getNestedProperty(objectPath, dottedPath) {
  const keys = dottedPath.split('.');
  let current = objectPath;

  for (let index = 0; index < keys.length; index++) {
    const property = getProperty(current, keys[index]);

    if (!property) {
      return null;
    }

    if (index === keys.length - 1) {
      return property;
    }

    const next = unwrapPath(getPropertyValue(property));

    if (next.node.type !== 'ObjectExpression') {
      return null;
    }

    current = next;
  }

  return null;
}

/**
 * Build the resolver that follows one identifier hop and function returns inside one file.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @returns {object} The resolver functions.
 */
function createResolver(j, root) {
  const declarators = new Map();
  const declarations = new Map();

  invalidateScope();

  root.find(j.VariableDeclarator).forEach((path) => {
    declarators.set(path.node, path);
  });
  root.find(j.FunctionDeclaration).forEach((path) => {
    declarations.set(path.node, path);
  });

  /**
   * The expressions a function returns, without entering nested functions.
   *
   * @param {object} functionPath NodePath of a function.
   * @returns {object[]} NodePaths of the returned expressions.
   */
  const returned = (functionPath) => {
    const body = functionPath.get('body');

    if (body.node.type !== 'BlockStatement') {
      return [body];
    }

    return j(body).find(j.ReturnStatement)
      .filter((path) => {
        let current = path.parent;

        while (current && !isFunctionNode(current.node)) {
          current = current.parent;
        }

        return current?.node === functionPath.node;
      })
      .paths()
      .filter(path => path.node.argument)
      .map(path => path.get('argument'));
  };

  /**
   * The class property initializer behind `this.name`.
   *
   * @param {object} path NodePath of a `this.name` member expression.
   * @param {string} name Property name.
   * @returns {object|null} NodePath of the initializer, or `null`.
   */
  const classPropertyValue = (path, name) => {
    let current = path.parent;

    while (current && current.node.type !== 'ClassBody') {
      current = current.parent;
    }

    if (!current) {
      return null;
    }

    const index = current.node.body.findIndex(member => member.type === 'ClassProperty' && propertyName(member) === name
      && member.value);

    return index === -1 ? null : current.get('body', index, 'value');
  };

  /**
   * The initializer behind an identifier or `this.name`: one hop.
   *
   * @param {object} path NodePath of the reference.
   * @returns {object|null} NodePath of the initializer expression, or `null`.
   */
  const hop = (path) => {
    const node = path.node;

    if (node.type === 'Identifier') {
      const binding = lookup(path, node.name, 'value');
      const declarator = binding?.init && ['const', 'let', 'var'].includes(binding.kind)
        ? declarators.get(binding.node) : null;

      return declarator ? declarator.get('init') : null;
    }

    if ((node.type === 'MemberExpression' || node.type === 'OptionalMemberExpression')
      && node.object.type === 'ThisExpression') {
      const name = memberName(node);

      return name === null ? null : classPropertyValue(path, name);
    }

    return null;
  };

  /**
   * Resolve an expression to the object literals it stands for.
   *
   * @param {object} path NodePath of an expression.
   * @param {boolean} [hopped] Whether an identifier hop was already taken.
   * @param {number} [depth] Recursion guard.
   * @returns {Array<{objectPath: object, viaIdentifier: boolean}>} The literals.
   */
  const resolveObjects = (path, hopped = false, depth = 0) => {
    if (depth > MAX_RESOLVE_DEPTH) {
      return [];
    }

    const target = unwrapPath(path);
    const node = target.node;

    if (node.type === 'ObjectExpression') {
      return [{ objectPath: target, viaIdentifier: hopped }];
    }

    if (!hopped && (node.type === 'Identifier' || node.type === 'MemberExpression')) {
      const initializer = hop(target);

      return initializer ? resolveObjects(initializer, true, depth + 1) : [];
    }

    if (node.type === 'ConditionalExpression') {
      return [target.get('consequent'), target.get('alternate')]
        .flatMap(branch => resolveObjects(branch, hopped, depth + 1));
    }

    if ((node.type === 'CallExpression' || node.type === 'OptionalCallExpression')
      && calleeName(node.callee) === 'useMemo' && node.arguments[0] && isFunctionNode(node.arguments[0])) {
      return returned(target.get('arguments', 0)).flatMap(item => resolveObjects(item, hopped, depth + 1));
    }

    return [];
  };

  /**
   * The function an expression is: written there, or the callback of a `useCallback(fn, deps)` or
   * `React.useCallback(fn, deps)` call.
   *
   * @param {object} path NodePath of an expression.
   * @returns {object|null} NodePath of the function, or `null`.
   */
  const functionOf = (path) => {
    const target = unwrapPath(path);
    const node = target.node;

    if (isFunctionNode(node)) {
      return target;
    }

    return (node.type === 'CallExpression' || node.type === 'OptionalCallExpression')
      && calleeName(node.callee) === 'useCallback' && node.arguments[0] && isFunctionNode(node.arguments[0])
      ? target.get('arguments', 0) : null;
  };

  /**
   * Whether a name is assigned to or updated anywhere in the file, which makes it stand for more than its
   * declaration.
   *
   * @param {object} binding Binding of the name.
   * @returns {boolean} `true` when the name is written.
   */
  const isRewritten = binding => findReferences(j, root, binding).some((reference) => {
    const parent = reference.parent?.node;

    if (parent?.type === 'AssignmentExpression' || parent?.type === 'ForInStatement'
      || parent?.type === 'ForOfStatement') {
      return parent.left === reference.node;
    }

    return parent?.type === 'UpdateExpression';
  });

  /**
   * Resolve an expression to the function it stands for: the function itself, a `useCallback` callback, or one
   * identifier hop to a same-file initializer or declaration. A `const` initializer and a function declaration that
   * nothing assigns to are certain (`certain: true`). A `let`, a `var`, and a declaration that is assigned to
   * somewhere may hold another function at run time, so the function is returned with `certain: false` and the
   * caller treats its objects as a guess. An import, a parameter, and a destructured name are not resolved.
   *
   * @param {object} path NodePath of an expression.
   * @returns {{functionPath: object, viaIdentifier: boolean, certain: boolean}|null} The function, or `null`.
   */
  const resolveFunction = (path) => {
    const direct = functionOf(path);

    if (direct) {
      return { functionPath: direct, viaIdentifier: false, certain: true };
    }

    const target = unwrapPath(path);

    if (target.node.type !== 'Identifier') {
      return null;
    }

    const binding = lookup(target, target.node.name, 'value');
    let functionPath = null;
    let certain = false;

    if (binding?.kind === 'function' && declarations.has(binding.node)) {
      functionPath = declarations.get(binding.node);
      certain = !isRewritten(binding);
    } else if (['const', 'let', 'var'].includes(binding?.kind) && binding.init && declarators.has(binding.node)) {
      functionPath = functionOf(declarators.get(binding.node).get('init'));
      certain = binding.kind === 'const';
    }

    return functionPath ? { functionPath, viaIdentifier: true, certain } : null;
  };

  /**
   * The array literal an expression is, or the one a `useMemo(() => [...])` call returns when the callback has a
   * single return.
   *
   * @param {object} path NodePath of an expression.
   * @returns {object|null} NodePath of the `ArrayExpression`, or `null`.
   */
  const arrayOf = (path) => {
    const target = unwrapPath(path);
    const node = target.node;

    if (node.type === 'ArrayExpression') {
      return target;
    }

    if ((node.type === 'CallExpression' || node.type === 'OptionalCallExpression')
      && calleeName(node.callee) === 'useMemo' && node.arguments[0] && isFunctionNode(node.arguments[0])) {
      const items = returned(target.get('arguments', 0));
      const only = items.length === 1 ? unwrapPath(items[0]) : null;

      return only?.node.type === 'ArrayExpression' ? only : null;
    }

    return null;
  };

  /**
   * Resolve an expression to the array literal it stands for: written there, behind one identifier hop, or
   * returned by a `useMemo` callback.
   *
   * @param {object} path NodePath of an expression.
   * @returns {object|null} NodePath of the `ArrayExpression`, or `null`.
   */
  const resolveArray = (path) => {
    const target = unwrapPath(path);
    const direct = arrayOf(target);

    if (direct) {
      return direct;
    }

    const initializer = target.node.type === 'Identifier' || target.node.type === 'MemberExpression'
      ? hop(target) : null;

    return initializer ? arrayOf(initializer) : null;
  };

  return { returned, resolveObjects, resolveArray, resolveFunction };
}

/**
 * Collect every option object in a file.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @param {import('./hot-bindings.mjs').HotBindings} bindings Result of `collectHotBindings`.
 * @returns {OptionObject[]} The objects in source order of discovery, each once, at its highest confidence.
 */
export function findOptionObjects(j, root, bindings) {
  const { returned, resolveObjects, resolveArray, resolveFunction } = createResolver(j, root);
  const found = new Map();

  /**
   * Role named by a type node: `GridSettings` is `grid`, `ColumnSettings` is `column`, `CellProperties` and
   * `CellMeta` are `cell`. `Partial<...>` and its relatives, and unions with `null` or `undefined`, are seen
   * through.
   *
   * @param {object|null|undefined} typeNode A type node.
   * @returns {string|null} The role, or `null`.
   */
  const roleOfType = (typeNode) => {
    if (!typeNode) {
      return null;
    }

    if (typeNode.type === 'TSTypeAnnotation' || typeNode.type === 'TSParenthesizedType') {
      return roleOfType(typeNode.typeAnnotation);
    }

    if (typeNode.type === 'TSUnionType') {
      const roles = typeNode.types
        .filter(item => item.type !== 'TSNullKeyword' && item.type !== 'TSUndefinedKeyword')
        .map(roleOfType);

      return roles.length > 0 && roles.every(role => role && role === roles[0]) ? roles[0] : null;
    }

    if (typeNode.type !== 'TSTypeReference') {
      return null;
    }

    const resolved = bindings.resolveTypeName(typeNode.typeName);

    if (resolved) {
      return HOT_TYPE_ROLES.get(resolved) ?? null;
    }

    return typeNode.typeName.type === 'Identifier' && TYPE_WRAPPERS.has(typeNode.typeName.name)
      ? roleOfType(typeArguments(typeNode)[0]) : null;
  };

  /**
   * Role of the elements of an array type: `ColumnSettings[]`, `readonly ColumnSettings[]`, `Array<ColumnSettings>`,
   * and `ReadonlyArray<ColumnSettings>`.
   *
   * @param {object|null|undefined} typeNode A type node.
   * @returns {string|null} The role of the elements, or `null`.
   */
  const elementRoleOfType = (typeNode) => {
    if (!typeNode) {
      return null;
    }

    switch (typeNode.type) {
      case 'TSTypeAnnotation':
      case 'TSParenthesizedType':
        return elementRoleOfType(typeNode.typeAnnotation);
      case 'TSTypeOperator':
        return typeNode.operator === 'readonly' ? elementRoleOfType(typeNode.typeAnnotation) : null;
      case 'TSArrayType':
        return roleOfType(typeNode.elementType);
      case 'TSTypeReference':
        return typeNode.typeName.type === 'Identifier' && ['Array', 'ReadonlyArray'].includes(typeNode.typeName.name)
          ? roleOfType(typeArguments(typeNode)[0]) : null;
      default:
        return null;
    }
  };

  let addObject;

  /**
   * Add the elements of an array expression as option objects.
   *
   * @param {object|null} arrayPath NodePath of an `ArrayExpression`.
   * @param {string} role Role of the elements.
   * @param {string} origin Origin label.
   * @param {'high'|'medium'} confidence Confidence.
   */
  const addElements = (arrayPath, role, origin, confidence) => {
    arrayPath?.node.elements.forEach((element, index) => {
      if (element && element.type !== 'SpreadElement') {
        resolveObjects(arrayPath.get('elements', index)).forEach(({ objectPath, viaIdentifier }) => {
          addObject(objectPath, role, viaIdentifier ? `${origin}:identifier` : origin, confidence);
        });
      }
    });
  };

  /**
   * Add what one `columns`, `cell`, or `cells` option holds: the elements of an array, or what a function
   * returns. A `cells` function may also be named, one hop, for a same-file arrow or function expression, a
   * function declaration, or a `useCallback` callback (`resolveFunction()`); its objects are `medium` when the name
   * may hold another function. Any other option name is left alone. The option is a property of an option object or a JSX
   * attribute of a wrapper component, and both nest the same way.
   *
   * @param {string|null} name Option name.
   * @param {object} value NodePath of the option value (the function itself for an object method).
   * @param {'high'|'medium'} confidence Confidence of the object or element that holds the option.
   */
  const expandOption = (name, value, confidence) => {
    if (name !== 'columns' && name !== 'cell' && name !== 'cells') {
      return;
    }

    const isFunction = isFunctionNode(value.node);

    if (name === 'cell') {
      addElements(isFunction ? null : resolveArray(value), 'cell', 'cell', confidence);

      return;
    }

    let resolved = null;

    if (isFunction) {
      resolved = { functionPath: value, viaIdentifier: false, certain: true };
    } else if (name === 'cells') {
      resolved = resolveFunction(value);
    }

    if (resolved) {
      const label = `${name === 'cells' ? 'cells()' : 'columns()'}${resolved.viaIdentifier ? ':identifier' : ''}`;

      returned(resolved.functionPath).forEach((item) => {
        resolveObjects(item).forEach(({ objectPath: child, viaIdentifier }) => {
          addObject(child, name === 'cells' ? 'cell' : 'column', viaIdentifier && !resolved.viaIdentifier
            ? `${label}:identifier` : label, resolved.certain ? confidence : 'medium');
        });
      });
    } else if (name === 'columns') {
      addElements(resolveArray(value), 'column', 'columns', confidence);
    }
  };

  /**
   * Add what hangs below an option object: `columns`, `cell`, `cells`, and spreads.
   *
   * @param {object} objectPath NodePath of an option object.
   * @param {string} role Role of the parent.
   * @param {'high'|'medium'} confidence Confidence of the parent.
   */
  const expand = (objectPath, role, confidence) => {
    objectPath.node.properties.forEach((node, index) => {
      const propertyPath = objectPath.get('properties', index);

      if (node.type === 'SpreadElement') {
        resolveObjects(propertyPath.get('argument')).forEach(({ objectPath: spread, viaIdentifier }) => {
          addObject(spread, role, viaIdentifier ? 'spread:identifier' : 'spread', confidence);
        });

        return;
      }

      expandOption(PROPERTY_TYPES.has(node.type) ? propertyName(node) : null, getPropertyValue(propertyPath),
        confidence);
    });
  };

  addObject = (objectPath, role, origin, confidence) => {
    if (found.has(objectPath.node)) {
      return;
    }

    found.set(objectPath.node, { path: objectPath, confidence, role, origin });
    expand(objectPath, role, confidence);
  };

  /**
   * Add every object an expression stands for as a high-confidence option object.
   *
   * @param {object|undefined} path NodePath of the expression.
   * @param {string} role Role of the object.
   * @param {string} origin Origin label.
   */
  const addFrom = (path, role, origin) => {
    if (!path || !role) {
      return;
    }

    resolveObjects(path).forEach(({ objectPath, viaIdentifier }) => {
      addObject(objectPath, role, viaIdentifier ? `${origin}:identifier` : origin, 'high');
    });
  };

  /**
   * Add what a type annotation says about an expression: an object of a known role, or an array whose elements
   * are objects of one.
   *
   * @param {object|undefined} path NodePath of the annotated expression.
   * @param {object|null|undefined} typeNode The annotation, an `as` or `satisfies` type, or a return type.
   */
  const addAnnotated = (path, typeNode) => {
    if (!path) {
      return;
    }

    const role = roleOfType(typeNode);

    if (role) {
      addFrom(path, role, 'annotation');

      return;
    }

    const elementRole = elementRoleOfType(typeNode);

    if (elementRole) {
      addElements(resolveArray(path), elementRole, 'annotation', 'high');
    }
  };

  root.find(j.NewExpression).forEach((path) => {
    if (bindings.isInstance(path) && path.node.arguments.length > 1) {
      addFrom(path.get('arguments', 1), 'grid', 'new');
    }
  });

  root.find(j.CallExpression).forEach((path) => {
    if (memberName(path.node.callee) === 'updateSettings' && path.node.arguments.length > 0) {
      addFrom(path.get('arguments', 0), 'grid', 'updateSettings');
    }
  });

  const claimed = new Set();
  const calls = new Set();

  [...root.find(j.CallExpression).paths(), ...root.find(j.OptionalCallExpression).paths()].forEach((path) => {
    const callee = path.node.callee;

    if (calls.has(path.node) || !calls.add(path.node) || memberName(callee) !== 'setCellMetaObject'
      || path.node.arguments.length < 3) {
      return;
    }

    const objectPath = unwrapPath(path.get('arguments', 2));

    if (objectPath.node.type !== 'ObjectExpression') {
      return;
    }

    if (bindings.isInstance(unwrapPath(path.get('callee')).get('object'))) {
      addObject(objectPath, 'cell', 'setCellMetaObject', 'high');
    } else {
      // The site is reported as a dynamic option set, so the key heuristic must not report the object again.
      claimed.add(objectPath.node);
    }
  });

  root.find(j.JSXElement).forEach((path) => {
    const component = bindings.getComponent(path);

    if (!component) {
      return;
    }

    path.node.openingElement.attributes.forEach((attribute, index) => {
      if (attribute.type !== 'JSXAttribute' || attribute.value?.type !== 'JSXExpressionContainer') {
        return;
      }

      const expression = path.get('openingElement', 'attributes', index, 'value', 'expression');

      if (attribute.name.name === 'settings') {
        addFrom(expression, component === 'HotTable' ? 'grid' : 'column', 'jsx-settings');
      } else {
        // An attribute of a wrapper component is an option position, like a key of a settings object.
        expandOption(attribute.name.name ?? null, expression, 'high');
      }
    });
  });

  root.find(j.VariableDeclarator).forEach((path) => {
    if (path.node.init && path.node.id.typeAnnotation) {
      addAnnotated(path.get('init'), path.node.id.typeAnnotation);
    }
  });

  root.find(j.ClassProperty).forEach((path) => {
    if (path.node.value && path.node.typeAnnotation) {
      addAnnotated(path.get('value'), path.node.typeAnnotation);
    }
  });

  root.find(j.Node).filter(path => ['TSAsExpression', 'TSSatisfiesExpression', 'TSTypeAssertion']
    .includes(path.node.type)).forEach((path) => {
    addAnnotated(path.get('expression'), path.node.typeAnnotation);
  });

  root.find(j.Node).filter(path => isFunctionNode(path.node) && path.node.returnType).forEach((path) => {
    returned(path).forEach(item => addAnnotated(item, path.node.returnType));
  });

  root.find(j.CallExpression).forEach((path) => {
    const [typeArgument] = typeArguments(path.node);

    if (typeArgument && path.node.arguments.length > 0) {
      addAnnotated(path.get('arguments', 0), typeArgument);
    }
  });

  if (bindings.isHotFile) {
    const isFound = node => found.has(node) || claimed.has(node);

    root.find(j.ObjectExpression).forEach((path) => {
      if (isFound(path.node)) {
        return;
      }

      for (let ancestor = path.parent; ancestor; ancestor = ancestor.parent) {
        if (ancestor.node.type === 'ObjectExpression' && isFound(ancestor.node)) {
          return;
        }
      }

      const names = new Set(getProperties(path).map(property => property.name).filter(name => KNOWN_OPTIONS.has(name)));

      if (names.size >= 2 && [...names].some(name => !GENERIC_OPTIONS.has(name))) {
        addObject(path, 'grid', 'heuristic', 'medium');
        found.get(path.node).keys = [...names];
      }
    });
  }

  return [...found.values()];
}

/**
 * List the JSX attributes of `<HotTable>` and `<HotColumn>` elements as options. The `settings`, `ref`, and
 * `key` attributes are not options and are left out; `settings={{...}}` is covered by `findOptionObjects`. A
 * spread attribute `{...settings}` is resolved one hop to an object literal in the same file and its
 * properties are listed with `viaSpread: true`.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @param {import('./hot-bindings.mjs').HotBindings} bindings Result of `collectHotBindings`.
 * @returns {JsxOptionAttribute[]} The attributes in source order.
 */
export function findJsxOptionAttributes(j, root, bindings) {
  const { resolveObjects } = createResolver(j, root);
  const entries = [];

  root.find(j.JSXElement).forEach((path) => {
    const component = bindings.getComponent(path);

    if (!component) {
      return;
    }

    const elementRole = component === 'HotTable' ? 'grid' : 'column';

    path.node.openingElement.attributes.forEach((attribute, index) => {
      const attributePath = path.get('openingElement', 'attributes', index);

      if (attribute.type === 'JSXSpreadAttribute') {
        resolveObjects(attributePath.get('argument')).forEach(({ objectPath }) => {
          getProperties(objectPath).forEach(({ name, path: propertyPath }) => {
            entries.push({
              name,
              attributePath: propertyPath,
              valuePath: getPropertyValue(propertyPath),
              elementRole,
              viaSpread: true,
            });
          });
        });

        return;
      }

      if (attribute.type !== 'JSXAttribute' || attribute.name.type !== 'JSXIdentifier'
        || IGNORED_ATTRIBUTES.has(attribute.name.name)) {
        return;
      }

      let valuePath = null;

      if (attribute.value?.type === 'JSXExpressionContainer') {
        valuePath = attributePath.get('value', 'expression');
      } else if (attribute.value) {
        valuePath = attributePath.get('value');
      }

      entries.push({ name: attribute.name.name, attributePath, valuePath, elementRole, viaSpread: false });
    });
  });

  return entries;
}
