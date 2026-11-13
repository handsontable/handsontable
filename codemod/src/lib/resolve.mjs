/**
 * One hop in the same file: what an identifier or a member read such as `PRESET.chf` stands for, when a `const`
 * in this file holds it. It is the resolution limit of the tool. An import, a parameter, a destructured name, a
 * `let`, and a `var` are never followed, because they may hold another value at run time.
 *
 * @module lib/resolve
 */

import { memberName, propertyName, stringValue, unwrapPath } from './ast.mjs';
import { lookup } from './scope.mjs';

const MEMBERS = new Set(['MemberExpression', 'OptionalMemberExpression']);

/**
 * The reference shapes a resolver follows: an identifier, or a member read of one.
 *
 * @param {object} node An expression node (unwrapped).
 * @returns {boolean} `true` for an identifier or a member expression.
 */
export function isReference(node) {
  return node.type === 'Identifier' || MEMBERS.has(node.type);
}

/**
 * Build the one-hop resolver of a file.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @returns {{hop: (path: object) => object|null, stringOf: (path: object) => string|null,
 * spreadsOf: (objectPath: object) => object[]|null}} The resolver. `hop()` returns the NodePath of the value behind a
 * reference (type assertions stripped), or `null` when the reference is not resolved. `stringOf()` returns the string
 * a literal or a resolved reference holds, else `null`. `spreadsOf()` returns the object literals that the spread
 * elements of an object stand for, or `null` when any spread is not an object literal or a resolved reference to one.
 */
export function createHop(j, root) {
  let declarators = null;

  const declaratorOf = (node) => {
    if (declarators === null) {
      declarators = new Map();
      root.find(j.VariableDeclarator).forEach((path) => {
        declarators.set(path.node, path);
      });
    }

    return declarators.get(node) ?? null;
  };

  /**
   * The value behind a reference, one hop.
   *
   * @param {object} path NodePath of an expression.
   * @returns {object|null} NodePath of the value (type assertions stripped), or `null`.
   */
  const hop = (path) => {
    const target = unwrapPath(path);
    const { node } = target;

    if (node.type === 'Identifier') {
      const binding = lookup(target, node.name, 'value');

      if (binding?.kind !== 'const' || !binding.init) {
        return null;
      }

      const declarator = declaratorOf(binding.node);

      return declarator?.node.id.type === 'Identifier' ? unwrapPath(declarator.get('init')) : null;
    }

    if (MEMBERS.has(node.type)) {
      const name = memberName(node);
      const holder = name === null ? null : hop(target.get('object'));

      if (holder?.node.type !== 'ObjectExpression') {
        return null;
      }

      const matches = holder.node.properties
        .map((property, index) => ({ property, index }))
        .filter(({ property }) => property.type === 'ObjectProperty' && propertyName(property) === name);
      const last = matches[matches.length - 1];

      return last ? unwrapPath(holder.get('properties', last.index, 'value')) : null;
    }

    return null;
  };

  const stringOf = (path) => {
    const target = unwrapPath(path);
    const direct = stringValue(target.node);

    if (direct !== null) {
      return direct;
    }

    const resolved = isReference(target.node) ? hop(target) : null;

    return resolved ? stringValue(resolved.node) : null;
  };

  const spreadsOf = (objectPath) => {
    const objects = [];

    for (let index = 0; index < objectPath.node.properties.length; index++) {
      const property = objectPath.node.properties[index];

      if (property.type !== 'SpreadElement' && property.type !== 'SpreadProperty'
        && property.type !== 'ExperimentalSpreadProperty') {
        continue;
      }

      const argument = unwrapPath(objectPath.get('properties', index, 'argument'));
      const resolved = argument.node.type === 'ObjectExpression' ? argument : hop(argument);

      if (resolved?.node.type !== 'ObjectExpression') {
        return null;
      }

      objects.push(resolved);
    }

    return objects;
  };

  return { hop, stringOf, spreadsOf };
}
