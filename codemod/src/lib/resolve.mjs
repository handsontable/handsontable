/**
 * One hop in the same file: what an identifier or a member read such as `PRESET.chf` stands for, when a `const`
 * in this file holds it. It is the resolution limit of the tool. An import, a parameter, a destructured name, a
 * `let`, and a `var` are never followed, because they may hold another value at run time. A `const` that holds an
 * object or an array is followed, but a caller that must know what the object does not hold asks for an exact answer
 * (`{ exact: true }`), and gets `null` when the file writes to a member of it, calls a method on it that may change it,
 * or passes it to a call (`fmt.culture = x`, `list.push(x)`, `Object.assign(fmt, base)`): `const` fixes the binding,
 * not what the object holds. A caller that reports what it found does not ask, because a value it finds is there
 * however it changes later.
 *
 * @module lib/resolve
 */

import { isPatternTarget, memberName, propertyName, stringValue, unwrapPath } from './ast.mjs';
import { findReferences, identifierIndex, lookup } from './scope.mjs';

const MEMBERS = new Set(['MemberExpression', 'OptionalMemberExpression']);
const CALLS = new Set(['CallExpression', 'OptionalCallExpression']);

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
 * The built-ins that read the objects they get and never change them, as written (`Object.keys`).
 */
const READ_ONLY_CALLS = new Set([
  'Object.keys', 'Object.values', 'Object.entries', 'Object.getOwnPropertyNames', 'Object.hasOwn', 'Object.freeze',
  'Object.isFrozen', 'Object.is', 'Object.fromEntries', 'JSON.stringify', 'structuredClone', 'Array.isArray',
  'String', 'Number', 'Boolean',
]);

/**
 * The methods of arrays, strings, maps, sets, numbers, and objects that read the value they are called on and never
 * change it. A method call on a binding that is not one of these (`list.push(x)`, `list.sort()`, a method of the
 * object itself) may change what the binding holds.
 */
const READ_ONLY_METHODS = new Set([
  // Arrays and typed arrays.
  'at', 'concat', 'entries', 'every', 'filter', 'find', 'findIndex', 'findLast', 'findLastIndex', 'flat', 'flatMap',
  'forEach', 'includes', 'indexOf', 'join', 'keys', 'lastIndexOf', 'map', 'reduce', 'reduceRight', 'slice', 'some',
  'toReversed', 'toSorted', 'toSpliced', 'values', 'with',
  // Strings.
  'charAt', 'charCodeAt', 'codePointAt', 'endsWith', 'isWellFormed', 'localeCompare', 'match', 'matchAll', 'normalize',
  'padEnd', 'padStart', 'repeat', 'replace', 'replaceAll', 'search', 'split', 'startsWith', 'substr', 'substring',
  'toLocaleLowerCase', 'toLocaleUpperCase', 'toLowerCase', 'toUpperCase', 'toWellFormed', 'trim', 'trimEnd',
  'trimStart',
  // Maps and sets. `set`, `add`, `delete`, and `clear` change them and are not here.
  'difference', 'get', 'has', 'intersection', 'isDisjointFrom', 'isSubsetOf', 'isSupersetOf', 'symmetricDifference',
  'union',
  // Numbers, dates, and every object.
  'getTime', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toExponential', 'toFixed', 'toISOString',
  'toJSON', 'toLocaleString', 'toPrecision', 'toString', 'valueOf',
]);

/**
 * Whether a call only reads an argument: a built-in that never changes it, `Object.assign` for any argument but the
 * first (the target), and `console` methods.
 *
 * @param {object} call The `CallExpression` node.
 * @param {object} argument The argument node.
 * @returns {boolean} `true` when the call cannot change what the argument holds.
 */
function onlyReads(call, argument) {
  const { callee } = call;
  let name = callee.type === 'Identifier' ? callee.name : null;

  if (MEMBERS.has(callee.type) && callee.object.type === 'Identifier' && memberName(callee) !== null) {
    name = `${callee.object.name}.${memberName(callee)}`;
  }

  if (name === 'Object.assign') {
    return call.arguments[0] !== argument;
  }

  return name !== null && (READ_ONLY_CALLS.has(name) || name.startsWith('console.'));
}

/**
 * Build the one-hop resolver of a file.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @param {object} [options] Options.
 * @param {boolean} [options.stable] The caller never edits the tree while it uses the resolver (a report-only transform
 * such as `detect`). The identifiers of the tree are then indexed by name once, and `exact` answers for any number of
 * bindings cost one traversal and not one each. Leave it off when the tree is edited, because the index holds the
 * paths of the tree as it was when it was built.
 * @returns {{hop: (path: object, options?: {exact?: boolean}) => object|null, stringOf: (path: object) => string|null,
 * spreadsOf: (objectPath: object, options?: {exact?: boolean}) => object[]|null}} The resolver. `hop()` returns the
 * NodePath of the value behind a reference (type assertions stripped), or `null` when the reference is not resolved
 * (with `exact`, also when the object it holds may have been changed). `stringOf()` returns the string
 * a literal or a resolved reference holds, else `null`. `spreadsOf()` returns the object literals that the spread
 * elements of an object stand for, or `null` when any spread is not an object literal or a resolved reference to one.
 */
export function createHop(j, root, { stable = false } = {}) {
  let declarators = null;
  let identifiers = null;
  const mutated = new Map();

  /**
   * Whether the file may change the object or array a `const` holds: it writes to a member of the binding
   * (assignment, update, `delete`, a destructuring target), calls a method on it that is not a known read
   * (`push`, `sort`, `reset`), or passes the binding to a call (not `new`, which the
   * grid itself is: `new Handsontable(el, config)` reads the object).
   *
   * @param {object} binding The binding of the `const`.
   * @returns {boolean} `true` when the contents can differ from the literal.
   */
  const isMutated = (binding) => {
    if (!mutated.has(binding.idNode)) {
      const index = stable ? (identifiers ??= identifierIndex(j, root)) : undefined;

      mutated.set(binding.idNode, findReferences(j, root, binding, index).some((reference) => {
        const parent = reference.parent?.node;

        if (CALLS.has(parent?.type)) {
          return parent.callee !== reference.node && !onlyReads(parent, reference.node);
        }

        if (!MEMBERS.has(parent?.type) || parent.object !== reference.node) {
          return false;
        }

        // `fmt.a.b = x` writes below `fmt` too, so climb the member chain to the node that is written or deleted.
        let top = reference.parent;

        while (MEMBERS.has(top.parent?.node.type) && top.parent.node.object === top.node) {
          top = top.parent;
        }

        const holder = top.parent?.node;

        // `list.push(x)`: a method call on the binding or on a member of it, unless the method only reads.
        if (CALLS.has(holder?.type) && holder.callee === top.node) {
          return !READ_ONLY_METHODS.has(memberName(top.node));
        }

        return (holder?.type === 'AssignmentExpression' && holder.left === top.node)
          || holder?.type === 'UpdateExpression'
          || (holder?.type === 'UnaryExpression' && holder.operator === 'delete')
          || isPatternTarget(top);
      }));
    }

    return mutated.get(binding.idNode);
  };

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
   * @param {{exact?: boolean}} [options] `exact` gives `null` for an object that the file may change.
   * @returns {object|null} NodePath of the value (type assertions stripped), or `null`.
   */
  const hop = (path, options = {}) => {
    const { exact = false } = options;
    const target = unwrapPath(path);
    const { node } = target;

    if (node.type === 'Identifier') {
      const binding = lookup(target, node.name, 'value');

      if (binding?.kind !== 'const' || !binding.init) {
        return null;
      }

      const declarator = declaratorOf(binding.node);
      const value = declarator?.node.id.type === 'Identifier' ? unwrapPath(declarator.get('init')) : null;

      return exact && value && ['ObjectExpression', 'ArrayExpression'].includes(value.node.type)
        && isMutated(binding) ? null : value;
    }

    if (MEMBERS.has(node.type)) {
      const name = memberName(node);
      const holder = name === null ? null : hop(target.get('object'), options);

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

  const spreadsOf = (objectPath, options) => {
    const objects = [];

    for (let index = 0; index < objectPath.node.properties.length; index++) {
      const property = objectPath.node.properties[index];

      if (property.type !== 'SpreadElement' && property.type !== 'SpreadProperty'
        && property.type !== 'ExperimentalSpreadProperty') {
        continue;
      }

      const argument = unwrapPath(objectPath.get('properties', index, 'argument'));
      const resolved = argument.node.type === 'ObjectExpression' ? argument : hop(argument, options);

      if (resolved?.node.type !== 'ObjectExpression') {
        return null;
      }

      objects.push(resolved);
    }

    return objects;
  };

  return { hop, stringOf, spreadsOf };
}
