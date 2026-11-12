/**
 * Finds the object literals in a file that hold Handsontable options (grid, column, and cell settings), with a
 * confidence for each, and the JSX attributes of the wrapper components that act as options. Option rules use
 * it to decide whether a key such as `correctFormat` is Handsontable's before they touch it.
 *
 * A match is `high` when the file shows it: the second argument of `new <namespace>(...)`, the argument of
 * `.updateSettings()`, `settings={...}` on a wrapper component, a `GridSettings` (or similar) annotation, and
 * what hangs below those (`columns`, `cell`, `cells`). It is `medium` when only the keys suggest it.
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
import { invalidateScope, lookup } from './scope.mjs';

/**
 * One option object found in a file.
 *
 * @typedef {object} OptionObject
 * @property {object} path NodePath of the `ObjectExpression`.
 * @property {'high'|'medium'} confidence How sure the finder is that this is a Handsontable options object.
 * @property {'grid'|'column'|'cell'} role Which level of the cascade the object configures. A `medium` object
 * that is not below another match is reported as `grid`.
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

const IGNORED_ATTRIBUTES = new Set(['settings', 'ref', 'key']);
const TYPE_WRAPPERS = new Set(['Partial', 'Readonly', 'Required', 'Omit', 'Pick']);
const HOT_TYPE_ROLES = new Map([
  ['GridSettings', 'grid'],
  ['ColumnSettings', 'column'],
  ['CellProperties', 'cell'],
  ['CellMeta', 'cell'],
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

  invalidateScope();

  root.find(j.VariableDeclarator).forEach((path) => {
    declarators.set(path.node, path);
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

    if ((node.type === 'CallExpression' || node.type === 'OptionalCallExpression')
      && calleeName(node.callee) === 'useMemo' && node.arguments[0] && isFunctionNode(node.arguments[0])) {
      return returned(target.get('arguments', 0)).flatMap(item => resolveObjects(item, hopped, depth + 1));
    }

    return [];
  };

  /**
   * Resolve an expression to the array literal it stands for.
   *
   * @param {object} path NodePath of an expression.
   * @returns {object|null} NodePath of the `ArrayExpression`, or `null`.
   */
  const resolveArray = (path) => {
    const target = unwrapPath(path);

    if (target.node.type === 'ArrayExpression') {
      return target;
    }

    const initializer = target.node.type === 'Identifier' || target.node.type === 'MemberExpression'
      ? hop(target) : null;
    const resolved = initializer ? unwrapPath(initializer) : null;

    return resolved?.node.type === 'ArrayExpression' ? resolved : null;
  };

  return { returned, resolveObjects, resolveArray };
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
  const { returned, resolveObjects, resolveArray } = createResolver(j, root);
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

      const name = PROPERTY_TYPES.has(node.type) ? propertyName(node) : null;

      if (name !== 'columns' && name !== 'cell' && name !== 'cells') {
        return;
      }

      const value = getPropertyValue(propertyPath);
      const isFunction = isFunctionNode(value.node);

      if (name === 'cell') {
        addElements(isFunction ? null : resolveArray(value), 'cell', 'cell', confidence);
      } else if (isFunction) {
        const label = name === 'cells' ? 'cells()' : 'columns()';

        returned(value).forEach((item) => {
          resolveObjects(item).forEach(({ objectPath: child, viaIdentifier }) => {
            addObject(child, name === 'cells' ? 'cell' : 'column', viaIdentifier ? `${label}:identifier` : label,
              confidence);
          });
        });
      } else if (name === 'columns') {
        addElements(resolveArray(value), 'column', 'columns', confidence);
      }
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

  root.find(j.JSXElement).forEach((path) => {
    const component = bindings.getComponent(path);

    if (!component) {
      return;
    }

    path.node.openingElement.attributes.forEach((attribute, index) => {
      if (attribute.type === 'JSXAttribute' && attribute.name.name === 'settings'
        && attribute.value?.type === 'JSXExpressionContainer') {
        addFrom(path.get('openingElement', 'attributes', index, 'value', 'expression'),
          component === 'HotTable' ? 'grid' : 'column', 'jsx-settings');
      }
    });
  });

  root.find(j.VariableDeclarator).forEach((path) => {
    if (path.node.init && path.node.id.typeAnnotation) {
      addFrom(path.get('init'), roleOfType(path.node.id.typeAnnotation), 'annotation');
    }
  });

  root.find(j.ClassProperty).forEach((path) => {
    if (path.node.value && path.node.typeAnnotation) {
      addFrom(path.get('value'), roleOfType(path.node.typeAnnotation), 'annotation');
    }
  });

  root.find(j.Node).filter(path => ['TSAsExpression', 'TSSatisfiesExpression', 'TSTypeAssertion']
    .includes(path.node.type)).forEach((path) => {
    addFrom(path.get('expression'), roleOfType(path.node.typeAnnotation), 'annotation');
  });

  root.find(j.Node).filter(path => isFunctionNode(path.node) && path.node.returnType).forEach((path) => {
    const role = roleOfType(path.node.returnType);

    returned(path).forEach(item => addFrom(item, role, 'annotation'));
  });

  root.find(j.CallExpression).forEach((path) => {
    const [typeArgument] = typeArguments(path.node);

    if (typeArgument && path.node.arguments.length > 0) {
      addFrom(path.get('arguments', 0), roleOfType(typeArgument), 'annotation');
    }
  });

  if (bindings.isHotFile) {
    const isFound = node => found.has(node);

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
