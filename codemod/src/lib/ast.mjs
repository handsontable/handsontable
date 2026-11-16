/**
 * Small AST helpers shared by the context libraries. They work on plain nodes and on jscodeshift NodePaths and
 * know the node shapes of all three jscodeshift parsers (`babylon`, `ts`, `tsx`), which share the Babel AST.
 *
 * @module lib/ast
 */

const WRAPPER_TYPES = new Set([
  'TSAsExpression',
  'TSSatisfiesExpression',
  'TSNonNullExpression',
  'TSTypeAssertion',
  'TSInstantiationExpression',
  'ParenthesizedExpression',
  'TypeCastExpression',
]);

const MEMBER_TYPES = new Set(['MemberExpression', 'OptionalMemberExpression']);

/**
 * Value of a node that is a plain string: a string literal, or a template literal without expressions.
 *
 * @param {object|null|undefined} node An AST node.
 * @returns {string|null} The string, or `null` for any other node.
 */
export function stringValue(node) {
  if (!node) {
    return null;
  }

  if ((node.type === 'StringLiteral' || node.type === 'Literal') && typeof node.value === 'string') {
    return node.value;
  }

  if (node.type === 'TemplateLiteral' && node.expressions.length === 0 && node.quasis.length === 1) {
    return node.quasis[0].value.cooked ?? null;
  }

  return null;
}

/**
 * The name an import specifier takes from the module: `Name` for `import { Name }` and `import { Name as Local }`,
 * and the decoded text for a string literal name (`import { 'Name' as Local }`, which ES2022 allows for any name).
 *
 * @param {object|null|undefined} specifier An `ImportSpecifier` node.
 * @returns {string|null} The imported name, or `null` when the node has none.
 */
export function importedName(specifier) {
  const imported = specifier?.imported;

  return imported ? imported.name ?? stringValue(imported) : null;
}

/**
 * Name of a property-like node (`ObjectProperty`, `ObjectMethod`, `ClassProperty`, `TSPropertySignature` and
 * friends). A computed key has no name, even when it holds a string literal.
 *
 * @param {object} node A property-like node.
 * @returns {string|null} The key name, or `null` for a computed key, a spread, or an unnamed node.
 */
export function propertyName(node) {
  if (!node || node.computed || !node.key) {
    return null;
  }

  if (node.key.type === 'Identifier') {
    return node.key.name;
  }

  return stringValue(node.key);
}

/**
 * Strip type assertions, `satisfies`, non-null assertions, and parentheses from an expression node.
 *
 * @param {object} node An expression node.
 * @returns {object} The inner expression.
 */
export function unwrapNode(node) {
  let current = node;

  while (current && WRAPPER_TYPES.has(current.type)) {
    current = current.expression;
  }

  return current;
}

/**
 * Same as `unwrapNode`, on a NodePath.
 *
 * @param {object} path A NodePath of an expression.
 * @returns {object} The NodePath of the inner expression.
 */
export function unwrapPath(path) {
  let current = path;

  while (current && WRAPPER_TYPES.has(current.node.type)) {
    current = current.get('expression');
  }

  return current;
}

/**
 * Name of the property a member expression reads, for `a.b` and `a['b']`.
 *
 * @param {object} node A `MemberExpression` or `OptionalMemberExpression`.
 * @returns {string|null} The name, or `null` for a computed access that is not a string literal.
 */
export function memberName(node) {
  if (!MEMBER_TYPES.has(node.type)) {
    return null;
  }

  if (!node.computed) {
    return node.property.type === 'Identifier' ? node.property.name : null;
  }

  return stringValue(node.property);
}

/**
 * Name of the property of the parent node that holds `path`, even when `path` is an array item.
 *
 * @param {object} path A NodePath.
 * @returns {string|null} Parent field name (`params`, `key`, `value`), or `null` for the root.
 */
export function edgeKey(path) {
  if (!path.parentPath) {
    return null;
  }

  return typeof path.name === 'number' ? path.parentPath.name : path.name;
}

/**
 * Whether a node is a function of any form.
 *
 * @param {object} node An AST node.
 * @returns {boolean} `true` for declarations, expressions, arrows, and object or class methods.
 */
export function isFunctionNode(node) {
  return node.type === 'FunctionDeclaration'
    || node.type === 'FunctionExpression'
    || node.type === 'ArrowFunctionExpression'
    || node.type === 'ObjectMethod'
    || node.type === 'ClassMethod'
    || node.type === 'ClassPrivateMethod';
}

/**
 * Name of the last segment of a callee: `useRef` for `useRef(...)` and for `React.useRef(...)`.
 *
 * @param {object} callee A callee node.
 * @returns {string|null} The name, or `null`.
 */
export function calleeName(callee) {
  const node = unwrapNode(callee);

  if (node.type === 'Identifier') {
    return node.name;
  }

  return memberName(node);
}

const LOCATION_KEYS = new Set([
  'loc', 'tokens', 'comments', 'extra', 'leadingComments', 'trailingComments', 'original',
]);

/**
 * The line of the first node below `node` that starts where `node` does and has a location. recast takes the location
 * off an expression that is the direct child of `export default`, but the first node inside it (the callee of a call,
 * the object of a member) starts at the same offset and keeps its own.
 *
 * @param {object} node A node without a location, with a `start` offset.
 * @returns {number|undefined} The line, or `undefined` when no such node exists.
 */
function lineOfFirstChild(node) {
  for (const key of Object.keys(node)) {
    const value = node[key];

    if (LOCATION_KEYS.has(key) || !value || typeof value !== 'object') {
      continue;
    }

    for (const child of Array.isArray(value) ? value : [value]) {
      if (child && typeof child.type === 'string' && child.start === node.start) {
        const line = child.loc?.start?.line ?? lineOfFirstChild(child);

        if (line !== undefined) {
          return line;
        }
      }
    }
  }

  return undefined;
}

/**
 * The one-based line of a node, for a report entry. A node recast gave no location (the expression right after
 * `export default`) gets the line of the first node inside it that starts at the same offset.
 *
 * @param {object|null|undefined} node An AST node.
 * @returns {number|undefined} The line, `undefined` for a node another transform created.
 */
export function lineOfNode(node) {
  const line = node?.loc?.start?.line;

  return line === undefined && typeof node?.start === 'number' ? lineOfFirstChild(node) : line;
}

/**
 * Name of a JSX attribute.
 *
 * @param {object} node A `JSXAttribute` or `JSXSpreadAttribute` node.
 * @returns {string|null} The name, or `null` for a spread or a namespaced name.
 */
export function attributeName(node) {
  return node.type === 'JSXAttribute' && node.name.type === 'JSXIdentifier' ? node.name.name : null;
}

/**
 * The plugin key of a `<x>.getPlugin('<key>')` call, optional chaining included.
 *
 * @param {object|null|undefined} node An expression node.
 * @returns {string|null} The key, or `null` when the node is not such a call or the key is not a literal.
 */
export function pluginKeyOf(node) {
  const call = node ? unwrapNode(node) : null;

  if (!call || (call.type !== 'CallExpression' && call.type !== 'OptionalCallExpression')) {
    return null;
  }

  const callee = unwrapNode(call.callee);

  if (!MEMBER_TYPES.has(callee.type) || memberName(callee) !== 'getPlugin') {
    return null;
  }

  return stringValue(call.arguments[0]);
}

/**
 * The type arguments of a call or `new` expression.
 *
 * @param {object} node A `CallExpression`, `OptionalCallExpression`, or `NewExpression`.
 * @returns {object[]} Type nodes, empty when there are none.
 */
export function typeArguments(node) {
  const holder = node.typeParameters ?? node.typeArguments;

  return holder?.params ?? [];
}

/**
 * Whether an expression is the target of a destructuring or of a `for` head: `[a.x] = list`, `({ k: a.x } = bag)`,
 * `[...a.x] = list`, and `for (a.x of list)`. (`({ a.x = 1 } = bag)` is not valid.)
 *
 * @param {object} path NodePath of the expression.
 * @returns {boolean} `true` when the expression is written.
 */
export function isPatternTarget(path) {
  const parent = path.parent?.node;

  switch (parent?.type) {
    case 'ArrayPattern':
    case 'RestElement':
      return true;
    case 'AssignmentPattern':
    case 'ForInStatement':
    case 'ForOfStatement':
      return parent.left === path.node;
    case 'ObjectProperty':
    case 'Property':
      return parent.value === path.node && path.parent.parent?.node.type === 'ObjectPattern';
    default:
      return false;
  }
}

/**
 * Whether an expression is only written, never read, where it stands: the target of a plain `=` assignment, the
 * operand of `delete`, or a destructuring or `for` head target, through parentheses and type assertions
 * (`(a.x as T) = 1`). A compound assignment (`a.x += 1`, `a.x ||= 1`) and an update (`a.x++`) read the value too,
 * so they are not write-only.
 *
 * @param {object} path NodePath of the expression, usually a member expression.
 * @returns {boolean} `true` when the code at this place never reads the value.
 */
export function isWriteOnly(path) {
  let current = path;

  while (current.parent && WRAPPER_TYPES.has(current.parent.node.type)
    && current.parent.node.expression === current.node) {
    current = current.parent;
  }

  const parent = current.parent?.node;

  switch (parent?.type) {
    case undefined:
      return false;
    case 'AssignmentExpression':
      return parent.operator === '=' && parent.left === current.node;
    case 'UnaryExpression':
      return parent.operator === 'delete';
    default:
      return isPatternTarget(current);
  }
}
