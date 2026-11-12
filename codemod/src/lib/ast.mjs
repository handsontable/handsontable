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

/**
 * The one-based line of a node, for a report entry.
 *
 * @param {object|null|undefined} node An AST node.
 * @returns {number|undefined} The line, `undefined` for a node another transform created.
 */
export function lineOfNode(node) {
  return node?.loc?.start?.line;
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
