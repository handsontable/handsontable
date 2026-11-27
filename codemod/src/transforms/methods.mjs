import { detectQuote } from '../adapters/js.mjs';
import {
  isFunctionNode,
  lineOfNode,
  memberName,
  pluginKeyOf,
  propertyName,
  stringValue,
  unwrapNode,
} from '../lib/ast.mjs';
import { hotBindingsOf, isGridNamed, isUnresolvedReceiver } from '../lib/hot-bindings.mjs';
import { rewrites } from '../lib/safety.mjs';
import { problemsOf } from '../lib/validate.mjs';

const RECEIVERS = new Set(['any', 'instance']);
const MEMBER_TYPES = ['MemberExpression', 'OptionalMemberExpression'];
const CALL_TYPES = new Set(['CallExpression', 'OptionalCallExpression']);
const WRAPPER_TYPES = new Set([
  'TSAsExpression',
  'TSSatisfiesExpression',
  'TSNonNullExpression',
  'TSTypeAssertion',
  'ParenthesizedExpression',
  'TypeCastExpression',
]);
const STATEMENT_LISTS = new Set(['Program', 'BlockStatement', 'StaticBlock', 'SwitchCase', 'TSModuleBlock']);

/**
 * One rule prepared for matching.
 *
 * @typedef {object} Spec
 * @property {import('../types.mjs').Rule} rule The manifest rule.
 * @property {'remove'|'move'} type Rule kind.
 * @property {'any'|'instance'|'plugin'} receiver Which receivers the rule may rewrite.
 * @property {string[]|null} pluginKeys Plugin keys a `plugin` receiver may be (`receiver: { plugin }`).
 * @property {Map<string, string>} methods Method name to its new name (`move`), or to itself (`remove`).
 * @property {Map<string, true>} properties Property name that becomes the `via` call (`move` only).
 * @property {{method: string, args: string[]}|null} via The call that reaches the new home (`move` only).
 */

/**
 * Check a rule's fields and turn it into a `Spec`.
 *
 * @param {import('../types.mjs').Rule} rule A `methodRemove` or `methodMove` rule.
 * @returns {Spec} The prepared rule.
 * @throws {Error} When a field the transform needs is missing or malformed.
 */
function prepare(rule) {
  const type = rule.kind === 'methodRemove' ? 'remove' : 'move';
  const plugin = rule.receiver !== null && typeof rule.receiver === 'object' ? rule.receiver.plugin : undefined;
  const pluginKeys = typeof plugin === 'string' ? [plugin] : plugin;

  if (plugin !== undefined) {
    if (!Array.isArray(pluginKeys) || pluginKeys.length === 0
      || !pluginKeys.every(key => typeof key === 'string' && key)) {
      throw new Error(`Rule ${rule.id}: "receiver.plugin" must be a plugin key or a list of plugin keys.`);
    }
  } else if (!RECEIVERS.has(rule.receiver) || (type === 'move' && rule.receiver === 'any')) {
    throw new Error(`Rule ${rule.id} needs "receiver" to be ${type === 'remove' ? '"any", ' : ''}"instance", `
      + 'or { "plugin": <key or keys> }.');
  }

  const spec = {
    rule,
    type,
    receiver: plugin === undefined ? rule.receiver : 'plugin',
    pluginKeys: plugin === undefined ? null : pluginKeys,
    methods: new Map(),
    properties: new Map(),
    via: null,
  };

  if (type === 'remove') {
    (rule.methods ?? []).forEach(name => spec.methods.set(name, name));

    return spec;
  }

  const { via } = rule;

  if (typeof via?.method !== 'string' || !Array.isArray(via.args) || !via.args.every(arg => typeof arg === 'string')) {
    throw new Error(`Rule ${rule.id} needs "via": { "method": string, "args": string[] }.`);
  }

  spec.via = { method: via.method, args: via.args };

  for (const [from, to] of Object.entries(rule.methods ?? {})) {
    if (typeof to !== 'string' || !to) {
      throw new Error(`Rule ${rule.id}: the new name of "${from}" must be a string.`);
    }

    spec.methods.set(from, to);
  }

  for (const [name, value] of Object.entries(rule.properties ?? {})) {
    if (value !== null) {
      throw new Error(`Rule ${rule.id}: property "${name}" must map to null (the "via" call itself).`);
    }

    spec.properties.set(name, true);
  }

  return spec;
}

/**
 * Source text of the call a `move` rule inserts, for messages: `getPlugin('undoRedo')`.
 *
 * @param {Spec} spec A `move` spec.
 * @returns {string} The call text.
 */
function viaText(spec) {
  return `${spec.via.method}(${spec.via.args.map(arg => `'${arg}'`).join(', ')})`;
}

/**
 * Collect the names a file declares itself: class members, object keys, functions, and variables. A call to such
 * a name on an unconfirmed receiver is most likely the file's own code, not the grid's.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The file's Collection.
 * @param {Set<string>} names Names to look for.
 * @returns {Set<string>} The names that the file declares.
 */
function declaredNames(j, root, names) {
  const found = new Set();
  const note = (name) => {
    if (typeof name === 'string' && names.has(name)) {
      found.add(name);
    }
  };

  [
    'ClassMethod',
    'ClassProperty',
    'ClassPrivateMethod',
    'ObjectMethod',
    'ObjectProperty',
    'TSMethodSignature',
    'TSPropertySignature',
    'TSDeclareMethod',
  ].forEach((type) => {
    root.find(j[type])
      .filter(path => path.parent.node.type !== 'ObjectPattern')
      .forEach(path => note(propertyName(path.node)));
  });
  root.find(j.FunctionDeclaration).forEach(path => note(path.node.id?.name));
  root.find(j.VariableDeclarator).forEach(path => note(path.node.id.type === 'Identifier' ? path.node.id.name : null));

  return found;
}

/**
 * Whether a receiver is a call to the `via` method, which means it already is the new home.
 *
 * @param {object} path The receiver NodePath.
 * @param {Spec} spec A `move` spec.
 * @returns {boolean} `true` for `x.getPlugin(...)`.
 */
function isViaCall(path, spec) {
  const node = unwrapNode(path.node);

  if (!CALL_TYPES.has(node.type)) {
    return false;
  }

  const callee = unwrapNode(node.callee);

  return MEMBER_TYPES.includes(callee.type) && memberName(callee) === spec.via.method;
}

/**
 * Decide what to do with a member access on a receiver.
 *
 * - `rewrite`: the receiver is a confirmed grid instance, or the name is distinctive enough to rewrite on any
 *   receiver (`receiver: "any"`) and the file does not declare the name itself. With
 *   `receiver: { plugin }` only a confirmed plugin of those keys rewrites.
 * - `manual`: the receiver is not confirmed but its name suggests a grid (for a `plugin` receiver: it is
 *   unresolved, see `isUnresolvedReceiver`).
 * - `skip`: anything else, silently.
 *
 * @param {Spec} spec The rule.
 * @param {string} name The member name.
 * @param {object} receiver The receiver NodePath.
 * @param {{isInstance: Function, isPluginReceiver: Function, isPartlyPlugin: Function}} bindings Bindings of the
 * file.
 * @param {Set<string>} declared Names the file declares itself.
 * @returns {'rewrite'|'manual'|'skip'} The decision.
 */
function decide(spec, name, receiver, bindings, declared) {
  if (spec.type === 'move' && isViaCall(receiver, spec)) {
    return 'skip';
  }

  if (spec.pluginKeys) {
    if (bindings.isPluginReceiver(receiver, spec.pluginKeys)) {
      return 'rewrite';
    }

    if (declared.has(name)) {
      return 'skip';
    }

    // A name that is a listed plugin on one path and something else on another is still the plugin sometimes.
    return isUnresolvedReceiver(receiver, bindings) || bindings.isPartlyPlugin(receiver, spec.pluginKeys)
      ? 'manual' : 'skip';
  }

  if (bindings.isInstance(receiver)) {
    return 'rewrite';
  }

  if (spec.receiver === 'any') {
    return declared.has(name) ? 'skip' : 'rewrite';
  }

  return isGridNamed(receiver) ? 'manual' : 'skip';
}

/**
 * How a member expression is used.
 *
 * @param {object} path The member expression NodePath.
 * @returns {{role: 'call', call: object}|{role: 'write'|'reference'}} `call` when it is the callee of a call (the
 * call's NodePath is included), `write` for an assignment, update, or `delete` target, `reference` otherwise.
 */
function usageOf(path) {
  let current = path;

  while (current.parent && WRAPPER_TYPES.has(current.parent.node.type)
    && current.parent.node.expression === current.node) {
    current = current.parent;
  }

  const parent = current.parent?.node;

  if (!parent) {
    return { role: 'reference' };
  }

  if (CALL_TYPES.has(parent.type) && parent.callee === current.node) {
    return { role: 'call', call: current.parent };
  }

  if ((parent.type === 'AssignmentExpression' && parent.left === current.node)
    || parent.type === 'UpdateExpression'
    || (parent.type === 'UnaryExpression' && parent.operator === 'delete')) {
    return { role: 'write' };
  }

  return { role: 'reference' };
}

/**
 * A receiver as text, so two reads of the same member can be told to be on the same object: `hot`, `this.hot`,
 * `a.b.c`. A call, an index, or a computed key gives no text.
 *
 * @param {object} node An expression node.
 * @returns {string|null} The text, or `null` when the receiver is not a plain chain.
 */
function chainText(node) {
  const current = unwrapNode(node);

  switch (current.type) {
    case 'Identifier':
      return current.name;
    case 'ThisExpression':
      return 'this';
    case 'MemberExpression':
    case 'OptionalMemberExpression': {
      const name = memberName(current);
      const object = name === null ? null : chainText(current.object);

      return object === null ? null : `${object}.${name}`;
    }
    default:
      return null;
  }
}

/**
 * The function nodes around a path, nearest first, and the program at the end.
 *
 * @param {object} path Any NodePath.
 * @returns {object[]} The nodes.
 */
function enclosingFunctions(path) {
  const found = [];

  for (let current = path.parent; current; current = current.parent) {
    if (isFunctionNode(current.node) || current.node.type === 'Program') {
      found.push(current.node);
    }
  }

  return found;
}

/**
 * The function (or the program) a path sits in.
 *
 * @param {object} path Any NodePath.
 * @returns {object} The node.
 */
function functionOf(path) {
  return enclosingFunctions(path)[0];
}

/**
 * Whether a member read is the object of another member access: `hot.undoRedo` in `hot.undoRedo.clear()`.
 *
 * @param {object} path The member NodePath.
 * @returns {boolean} `true` when the value is only used to reach a member of it.
 */
function isMemberBase(path) {
  let current = path;

  while (current.parent && WRAPPER_TYPES.has(current.parent.node.type)
    && current.parent.node.expression === current.node) {
    current = current.parent;
  }

  const parent = current.parent?.node;

  return MEMBER_TYPES.includes(parent?.type) && parent.object === current.node;
}

/**
 * Whether a member read is the root of an optional chain: `hot.undoRedo?.clear()`.
 *
 * @param {object} path The member NodePath.
 * @returns {boolean} `true` when the next link of the chain is optional.
 */
function isChainRoot(path) {
  const parent = path.parent?.node;

  return parent?.type === 'OptionalMemberExpression' && parent.optional === true && parent.object === path.node;
}

/**
 * Whether a member read is a test: the value only decides what runs, as in the test of an `if`, a loop, or a
 * conditional, an operand of `&&`, `||`, or `??` (the left one), the operand of `!` or `typeof`, a comparison whose
 * answer changes when the read stops being `undefined` (`x == null`, `x != null`, a comparison with `undefined`),
 * `Boolean(x)`, or the root of an optional chain (`hot.undoRedo?.clear()`).
 *
 * @param {object} path The member NodePath.
 * @returns {boolean} `true` for a read in a test position.
 */
function isTestRead(path) {
  let current = path;

  while (current.parent && WRAPPER_TYPES.has(current.parent.node.type)
    && current.parent.node.expression === current.node) {
    current = current.parent;
  }

  const parent = current.parent?.node;

  switch (parent?.type) {
    case 'IfStatement':
    case 'WhileStatement':
    case 'DoWhileStatement':
    case 'ForStatement':
    case 'ConditionalExpression':
      return parent.test === current.node;
    case 'LogicalExpression':
      return parent.left === current.node;
    case 'UnaryExpression':
      return parent.operator === '!' || parent.operator === 'typeof';
    case 'BinaryExpression': {
      const other = unwrapNode(parent.left === current.node ? parent.right : parent.left);

      if (!['==', '!=', '===', '!=='].includes(parent.operator)) {
        return false;
      }

      // On 17.x the read was `undefined`, and it is a function now. A comparison is a test only when that changes its
      // answer: `x == null` and `x != null` (`undefined` is loosely equal to `null`, a function is not), and every
      // comparison with `undefined`. `x === null` and a comparison with a string are false before and after.
      if (other.type === 'NullLiteral' || (other.type === 'Literal' && other.value === null)) {
        return parent.operator === '==' || parent.operator === '!=';
      }

      return (other.type === 'Identifier' && other.name === 'undefined')
        || (other.type === 'UnaryExpression' && (other.operator === 'void' || other.operator === 'typeof'));
    }
    case 'CallExpression':
      return parent.callee.type === 'Identifier' && parent.callee.name === 'Boolean'
        && parent.arguments[0] === current.node;
    case 'OptionalMemberExpression':
      // `hot.undo?.()` is an optional call, which `act()` reports on its own.
      return parent.optional === true && parent.object === current.node;
    default:
      return false;
  }
}

/**
 * The nearest statement that sits in a statement list (a block, a program, a `case`), so a TODO comment lands
 * on a line of its own even when the call is nested in an expression or in a braceless `if`.
 *
 * @param {object} path Any NodePath inside the statement.
 * @returns {object} The statement NodePath.
 */
function enclosingStatement(path) {
  for (let current = path; current; current = current.parent) {
    if (current.parent && STATEMENT_LISTS.has(current.parent.node.type) && typeof current.name === 'number') {
      return current;
    }
  }

  return path;
}

/**
 * The expression statement a call forms on its own, when its result is not used. `await call()`, `void call()`,
 * and type assertions around the call do not count as using it.
 *
 * @param {object} callPath The call NodePath.
 * @returns {{statement: object|null, braceless: boolean}} The statement NodePath when the call is the whole
 * statement and the statement sits in a statement list. `braceless` is `true` when it is the whole statement but
 * the body of an `if`, a loop, or a label, so removing it would leave an empty statement.
 */
function statementOf(callPath) {
  let current = callPath;

  while (current.parent) {
    const { node } = current.parent;
    const transparent = node.type === 'AwaitExpression' || WRAPPER_TYPES.has(node.type)
      || (node.type === 'UnaryExpression' && node.operator === 'void');

    if (!transparent) {
      break;
    }

    current = current.parent;
  }

  const holder = current.parent;

  if (!holder || holder.node.type !== 'ExpressionStatement') {
    return { statement: null, braceless: false };
  }

  const inList = holder.parent && STATEMENT_LISTS.has(holder.parent.node.type);

  return { statement: inList ? holder : null, braceless: !inList };
}

/**
 * Build `<object>.<via.method>('<arg>', ...)` in the right node family. Inside an optional chain the new links are
 * optional-chain nodes, and the first link takes over the `?.` of the member it replaces.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} object The receiver node.
 * @param {Spec} spec A `move` spec.
 * @param {{chain: boolean, optional: boolean}} chain Whether the new call sits in an optional chain and whether its
 * first link is the `?.` one.
 * @param {'single'|'double'} quote Quote style of the file.
 * @returns {object} The call expression node.
 */
function buildViaCall(j, object, spec, { chain, optional }, quote) {
  const args = spec.via.args.map((arg) => {
    const literal = j.literal(arg);

    literal.extra = { raw: quote === 'double' ? `"${arg}"` : `'${arg}'`, rawValue: arg };

    return literal;
  });
  const name = j.identifier(spec.via.method);

  return chain
    ? j.optionalCallExpression(j.optionalMemberExpression(object, name, false, optional), args, false)
    : j.callExpression(j.memberExpression(object, name), args);
}

/**
 * Rewrite `<x>.<name>(...)` into `<x>.<via>.<newName>(...)` in place.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} member The callee member node.
 * @param {Spec} spec A `move` spec.
 * @param {string} newName New method name.
 * @param {'single'|'double'} quote Quote style of the file.
 * @returns {void}
 */
function moveMethod(j, member, spec, newName, quote) {
  const chain = member.type === 'OptionalMemberExpression';

  member.object = buildViaCall(j, member.object, spec, { chain, optional: chain && member.optional === true }, quote);

  if (chain) {
    member.optional = false;
  }

  if (member.property.name !== newName) {
    member.property = j.identifier(newName);
  }
}

/**
 * Report a destructuring such as `const { undo } = hot`, which takes a method off a grid without a call.
 *
 * @param {import('../types.mjs').Ctx} ctx Context.
 * @param {object} path The `VariableDeclarator` NodePath whose `id` is an object pattern.
 * @param {Spec[]} specs Prepared rules.
 * @param {{isInstance: Function, isPluginReceiver: Function, isPartlyPlugin: Function}} bindings Bindings of the
 * file.
 * @param {Set<string>} declared Names the file declares itself.
 * @returns {void}
 */
function reportDestructuring(ctx, path, specs, bindings, declared) {
  for (const property of path.node.id.properties) {
    const name = property.type === 'RestElement' ? null : propertyName(property);
    const spec = name === null ? null : specs.find(item => item.methods.has(name) || item.properties.has(name));

    if (spec && decide(spec, name, path.get('init'), bindings, declared) !== 'skip') {
      ctx.report({
        ruleId: spec.rule.id,
        severity: 'manual',
        line: lineOfNode(property),
        message: `${name} is taken off the grid here without a call. ${guidance(spec, name)}`,
      });
    }
  }
}

/**
 * The text that tells a user what to do about a name.
 *
 * @param {Spec} spec The rule.
 * @param {string} name The member name.
 * @returns {string} The guidance.
 */
function guidance(spec, name) {
  if (spec.rule.advice) {
    return spec.rule.advice.replaceAll('{name}', `${name}()`);
  }

  if (spec.type === 'move') {
    const target = spec.methods.get(name);

    return target
      ? `Use ${viaText(spec)}.${target}() instead.`
      : `Use ${viaText(spec)} instead.`;
  }

  return `${name}() was removed.`;
}

/**
 * Act on one matched member access.
 *
 * @param {import('../types.mjs').Ctx} ctx Context.
 * @param {{path: object, spec: Spec, name: string, decision: 'rewrite'|'manual', usage: object,
 * guard?: 'test'|'guarded'}} action The match. `guard` says the member is read in a test, or sits in a function that
 * tests it, so a rewrite would make code run that never ran.
 * @param {'single'|'double'} quote Quote style of the file.
 * @returns {void}
 */
function act(ctx, { path, spec, name, decision, usage, guard }, quote) {
  const { rule } = spec;
  const line = lineOfNode(path.node);
  const isProperty = spec.properties.has(name);
  const manual = message => ctx.report({ ruleId: rule.id, severity: 'manual', line, message });

  if (decision === 'manual') {
    const subject = spec.pluginKeys
      ? `the ${spec.pluginKeys.join(' or ')} plugin`
      : 'a Handsontable instance';

    manual(`${guidance(spec, name)} Do this only if it is ${subject}: it could not be confirmed, so `
      + `${name}${isProperty ? '' : '()'} was left alone.`);

    return;
  }

  if (!rewrites(rule)) {
    manual(`${name}${isProperty ? '' : '()'} needs a review. ${guidance(spec, name)}`);

    return;
  }

  if (guard) {
    const why = guard === 'test' ? 'it is read in a test here' : `a test of ${name} on the same receiver guards it`;

    manual(`${guidance(spec, name)} The tool left ${name}${isProperty ? '' : '()'} alone: ${why}, and ${name} was `
      + `undefined on 17.x, because core had no ${name}. The plugin always exists, so a rewrite would change what that `
      + 'test answers and which code it guards runs.');

    return;
  }

  if (usage.role === 'write' || (path.node.computed && !isProperty) || (isProperty && usage.role === 'call')) {
    manual(`${name} is used in a form the tool does not rewrite. ${guidance(spec, name)}`);

    return;
  }

  if (spec.type === 'remove') {
    removeCall(ctx, path, usage, spec, name);

    return;
  }

  // `hot.undo?.()` runs only where the method exists, and the plugin method always does, so the rewritten call would
  // run where the old one did nothing (`hot.undo?.() ?? hot.getPlugin('undoRedo').undo()` would undo twice).
  if (usage.role === 'call' && usage.call.node.type === 'OptionalCallExpression' && usage.call.node.optional === true) {
    manual(`${name}?.() is an optional call, which the tool does not rewrite: the plugin method always exists, so the `
      + `new call would run where this one does not. ${guidance(spec, name)}`);

    return;
  }

  if (usage.role === 'reference' && !isProperty) {
    manual(`${guidance(spec, name)} ${name} is used without a call.`);

    return;
  }

  if (isProperty && !isMemberBase(path)) {
    // `hot.undoRedo.clear()` threw on 17.x, so moving it makes it work. A value that is stored, passed, or compared
    // was `undefined` there, and the plugin is not, so code that tests it later would take another branch.
    manual(`${guidance(spec, name)} ${name} is read here as a value, and it was undefined on 17.x, so the tool left `
      + 'it alone: the plugin is not undefined, and code that stores, passes, or tests the value would behave '
      + 'differently.');

    return;
  }

  if (isProperty) {
    moveProperty(ctx, path, spec, name, quote);

    return;
  }

  const target = spec.methods.get(name);

  moveMethod(ctx.j, path.node, spec, target, quote);
  ctx.markChanged();
  ctx.report({
    ruleId: rule.id,
    severity: 'changed',
    line,
    message: `Moved ${name}() to ${viaText(spec)}.${target}().${rule.message ? ` ${rule.message}` : ''}`,
  });
}

/**
 * Replace a property read such as `<x>.undoRedo` with the `via` call.
 *
 * @param {import('../types.mjs').Ctx} ctx Context.
 * @param {object} path The member NodePath.
 * @param {Spec} spec A `move` spec.
 * @param {string} name The property name.
 * @param {'single'|'double'} quote Quote style of the file.
 * @returns {void}
 */
function moveProperty(ctx, path, spec, name, quote) {
  const { node } = path;
  const chain = node.type === 'OptionalMemberExpression';
  const call = buildViaCall(ctx.j, node.object, spec, { chain, optional: chain && node.optional === true }, quote);

  call.comments = node.comments;
  path.replace(call);
  ctx.markChanged();
  ctx.report({
    ruleId: spec.rule.id,
    severity: 'changed',
    line: lineOfNode(node),
    message: `Replaced .${name} with ${viaText(spec)}.${spec.rule.message ? ` ${spec.rule.message}` : ''}`,
  });
}

/**
 * Whether a receiver is a plain chain: identifiers, `this`, member reads, and `getPlugin('<literal>')` calls. Such a
 * chain has no effects of its own, so dropping the statement that calls a no-op method on it loses nothing.
 *
 * @param {object} node The receiver node.
 * @returns {boolean} `true` for a chain without other calls, `new`, `await`, or operators.
 */
function isSimpleReceiver(node) {
  const current = unwrapNode(node);

  switch (current.type) {
    case 'Identifier':
    case 'ThisExpression':
      return true;
    case 'MemberExpression':
    case 'OptionalMemberExpression':
      return (!current.computed || memberName(current) !== null || current.property.type === 'NumericLiteral')
        && isSimpleReceiver(current.object);
    case 'CallExpression':
    case 'OptionalCallExpression':
      return pluginKeyOf(current) !== null && current.arguments.length === 1
        && isSimpleReceiver(unwrapNode(current.callee).object);
    default:
      return false;
  }
}

/**
 * Remove a statement and keep its comments. They move to the next statement, or to the previous one when there is
 * none, or to the enclosing node when it was the only statement.
 *
 * @param {object} statement The statement NodePath, an item of a statement list.
 * @returns {void}
 */
function pruneKeepingComments(statement) {
  const comments = statement.node.comments ?? [];
  const list = statement.parentPath.value;
  const next = list[statement.name + 1];
  const previous = list[statement.name - 1];

  if (comments.length > 0) {
    if (next) {
      comments.forEach((comment) => {
        comment.leading = true;
        comment.trailing = false;
      });
      next.comments = [...comments, ...(next.comments ?? [])];
    } else if (previous) {
      comments.forEach((comment) => {
        comment.leading = false;
        comment.trailing = true;
      });
      previous.comments = [...(previous.comments ?? []), ...comments];
    } else {
      const holder = enclosingStatement(statement.parentPath.parentPath).node;

      comments.forEach((comment) => {
        comment.leading = true;
        comment.trailing = false;
      });
      holder.comments = [...comments, ...(holder.comments ?? [])];
    }
  }

  statement.prune();
}

/**
 * Delete a removed method's call when it is a whole statement, or leave a TODO when it is not.
 *
 * @param {import('../types.mjs').Ctx} ctx Context.
 * @param {object} path The callee member NodePath.
 * @param {{role: string, call?: object}} usage How the member is used.
 * @param {Spec} spec A `remove` spec.
 * @param {string} name The method name.
 * @returns {void}
 */
function removeCall(ctx, path, usage, spec, name) {
  const { rule } = spec;
  const named = typeof rule.message === 'string' && rule.message.includes('{name}');
  const message = typeof rule.message === 'string' ? rule.message.replaceAll('{name}', `${name}()`) : '';

  if (usage.role !== 'call') {
    ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      line: lineOfNode(path.node),
      message: `${guidance(spec, name)} ${name} is used without a call.`,
    });

    return;
  }

  const { statement, braceless } = statementOf(usage.call);
  const effects = !isSimpleReceiver(path.node.object) || usage.call.node.arguments.length > 0;

  if (statement && !effects) {
    const line = lineOfNode(statement.node);

    // The statement is cut out of the printed text when it can be, so its neighbors keep their lines, and its comments
    // stay where they stand. Otherwise it leaves the tree and its comments move on.
    if (!ctx.removeStatement(statement)) {
      pruneKeepingComments(statement);
    }

    ctx.markChanged();
    ctx.report({
      ruleId: rule.id,
      severity: 'changed',
      line,
      message: `Removed the call to ${name}().${message ? ` ${message}` : ''}`,
    });

    return;
  }

  let reason = 'Its result is used here, so the call was kept.';
  let short = 'its result is used here, so the call was kept';

  if (effects) {
    reason = 'Its receiver or its arguments may do more than the removed call, so the call was kept.';
    short = 'its receiver or arguments may have effects, so the call was kept';
  } else if (braceless) {
    reason = 'It is the whole body of a statement without braces, so the call was kept.';
    short = 'it has no braces, so the call was kept';
  }

  const action = `Remove ${name}() by hand.`;
  const lead = named ? message : `${name}() is removed.`;

  ctx.todo(enclosingStatement(usage.call), rule.id, `${action} ${lead} ${reason} ${guidance(spec, name)}`,
    `Remove ${name}() by hand: ${short}.`);
}

/**
 * Handles removed and moved Core and plugin methods.
 *
 * - `methodRemove`: a call that is a whole expression statement is deleted together with the comments attached to
 *   the statement. A call whose result is used, the body of an arrow function, or the body of a braceless `if` is
 *   left alone and gets a TODO on its statement. A reference without a call (`const f = x.method`) is reported.
 * - `methodMove`: `<x>.<method>(...)` becomes `<x>.<via.method>(<via.args>).<new name>(...)`, and a property read
 *   such as `<x>.undoRedo` becomes the `via` call. Optional chaining, `await`, arguments, and the file's quote style
 *   are kept. A reference without a call, a computed access, and an assignment target are reported.
 *
 * The receiver is the whole safety story, because there is no type information (see `decide`). With
 * `receiver: "instance"` a call is rewritten only on a receiver `isInstance` confirms. An unconfirmed receiver is
 * reported when its name looks like a grid and ignored otherwise. A rule with `receiver: { plugin }` rewrites only on
 * a receiver `isPluginReceiver` confirms and reports an unresolved one. A `methodRemove` rule with
 * `receiver: "any"` rewrites on any receiver unless the file declares the name itself. A file that is not a
 * Handsontable file is never touched. A rule whose `safe` is not `true` never edits: every match is reported as
 * `manual`.
 *
 * @type {import('../types.mjs').Transform}
 */
const methods = {
  kinds: ['methodRemove', 'methodMove'],
  fileKinds: ['js'],

  /**
   * @param {import('../types.mjs').Rule} rule A `methodRemove` or `methodMove` rule.
   * @returns {string[]} The problems of the rule.
   */
  validate(rule) {
    return problemsOf(() => prepare(rule));
  },

  /**
   * @param {import('../types.mjs').Ctx} ctx Context of a `js` part.
   * @param {import('../types.mjs').Rule[]} rules `methodRemove` and `methodMove` rules.
   * @returns {void}
   */
  apply(ctx, rules) {
    const { j, root } = ctx;
    const specs = rules.map(prepare);
    const names = new Set(specs.flatMap(spec => [...spec.methods.keys(), ...spec.properties.keys()]));

    if (![...names].some(name => ctx.source.includes(name))) {
      return;
    }

    const bindings = hotBindingsOf(ctx);

    if (!bindings.isHotFile) {
      return;
    }

    const declared = declaredNames(j, root, names);
    const quote = detectQuote(ctx.source);
    const seen = new Set();
    const actions = [];

    const handle = (path, specFor) => {
      const name = memberName(path.node);
      const spec = name === null ? null : specFor(name);

      if (!spec || seen.has(path.node)) {
        return;
      }

      seen.add(path.node);

      const decision = decide(spec, name, path.get('object'), bindings, declared);

      if (decision !== 'skip') {
        actions.push({ path, spec, name, decision, usage: usageOf(path) });
      }
    };

    const specForMember = name => specs.find(spec => spec.methods.has(name) || spec.properties.has(name));

    MEMBER_TYPES.forEach(type => root.find(j[type]).forEach(path => handle(path, specForMember)));

    // A test of a moved member (`if (hot.undoRedo)`, `typeof hot.undo`, `'undo' in hot`) never passed where the member
    // did not exist, and the plugin always exists, so a rewrite would run the guarded code for the first time.
    const tests = new Map();
    const noteTest = (receiver, name, anchor) => {
      const key = `${chainText(receiver.node) ?? '?'}.${name}`;

      tests.set(key, [...(tests.get(key) ?? []), functionOf(anchor)]);
    };

    for (const action of actions) {
      if (action.spec.type === 'move' && action.decision === 'rewrite' && isTestRead(action.path)) {
        action.guard = 'test';

        // The root of an optional chain only skips its own call: it guards nothing else.
        if (!isChainRoot(action.path)) {
          noteTest(action.path.get('object'), action.name, action.path);
        }
      }
    }

    root.find(j.BinaryExpression, { operator: 'in' }).forEach((path) => {
      const name = stringValue(path.node.left);
      const spec = name === null ? null : specForMember(name);

      if (spec?.type === 'move' && decide(spec, name, path.get('right'), bindings, declared) === 'rewrite') {
        noteTest(path.get('right'), name, path);
        ctx.report({
          ruleId: spec.rule.id,
          severity: 'manual',
          line: lineOfNode(path.node),
          message: `${guidance(spec, name)} '${name}' in ${chainText(path.node.right) ?? 'the grid'} is a test `
            + `that never passed on 17.x, because core had no ${name}, and it passes now: the tool left it alone.`,
        });
      }
    });

    for (const action of actions) {
      if (action.spec.type === 'move' && action.decision === 'rewrite' && !action.guard) {
        const scopes = tests.get(`${chainText(action.path.node.object) ?? '?'}.${action.name}`) ?? [];

        if (scopes.length > 0 && enclosingFunctions(action.path).some(node => scopes.includes(node))) {
          action.guard = 'guarded';
        }
      }

      act(ctx, action, quote);
    }

    root.find(j.VariableDeclarator).forEach((path) => {
      if (path.node.id.type === 'ObjectPattern' && path.node.init) {
        reportDestructuring(ctx, path, specs, bindings, declared);
      }
    });
  },
};

export default methods;
