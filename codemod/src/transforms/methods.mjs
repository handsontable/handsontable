import { detectQuote } from '../adapters/js.mjs';
import { lineOfNode, memberName, pluginKeyOf, propertyName, unwrapNode } from '../lib/ast.mjs';
import { collectHotBindings, isUnresolvedReceiver } from '../lib/hot-bindings.mjs';
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
 * Names a variable or property that holds a grid has when its type cannot be confirmed: `hot`,
 * `hotInstance`, `this.grid`, `table`. A call on such a receiver is reported, never rewritten. Generic names
 * (`editor`, `history`, `instance`) are not listed on purpose, so an unrelated `.undo()` stays silent.
 */
const GRID_NAME = new RegExp('^[_$]*(hot|hotInstance|hotInst|hotTable|hotRef|hotGrid|grid|gridInstance|table'
  + '|handsontable|spreadsheet)$', 'i');

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
 * Last name of a receiver expression: `hot` for `hot` and for `this.hot`. Calls and `this` have none.
 *
 * @param {object} path The receiver NodePath.
 * @returns {string|null} The name, or `null`.
 */
function receiverName(path) {
  const node = unwrapNode(path.node);

  if (node.type === 'Identifier') {
    return node.name;
  }

  return MEMBER_TYPES.includes(node.type) ? memberName(node) : null;
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
 * @param {{isInstance: Function}} bindings Bindings of the file.
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

    return !declared.has(name) && isUnresolvedReceiver(receiver) ? 'manual' : 'skip';
  }

  if (bindings.isInstance(receiver)) {
    return 'rewrite';
  }

  if (spec.receiver === 'any') {
    return declared.has(name) ? 'skip' : 'rewrite';
  }

  const label = receiverName(receiver);

  return label !== null && GRID_NAME.test(label) ? 'manual' : 'skip';
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
 * @param {{isInstance: Function}} bindings Bindings of the file.
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
    return spec.rule.advice;
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
 * @param {{path: object, spec: Spec, name: string, decision: 'rewrite'|'manual', usage: object}} action The match.
 * @param {'single'|'double'} quote Quote style of the file.
 * @returns {void}
 */
function act(ctx, { path, spec, name, decision, usage }, quote) {
  const { rule } = spec;
  const line = lineOfNode(path.node);
  const isProperty = spec.properties.has(name);
  const manual = message => ctx.report({ ruleId: rule.id, severity: 'manual', line, message });

  if (decision === 'manual') {
    const subject = spec.pluginKeys
      ? `the ${spec.pluginKeys.join(' or ')} plugin`
      : 'a Handsontable instance';

    manual(`Could not confirm that this is ${subject}, so ${name}${isProperty ? '' : '()'} was left `
      + `alone. If it is: ${guidance(spec, name)}`);

    return;
  }

  if (!rewrites(rule)) {
    manual(`${name}${isProperty ? '' : '()'} needs a review. ${guidance(spec, name)}`);

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

  if (usage.role === 'reference' && !isProperty) {
    manual(`${name} is used without a call. ${guidance(spec, name)}`);

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

  if (usage.role !== 'call') {
    ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      line: lineOfNode(path.node),
      message: `${name} is used without a call. ${guidance(spec, name)}`,
    });

    return;
  }

  const { statement, braceless } = statementOf(usage.call);
  const effects = !isSimpleReceiver(path.node.object) || usage.call.node.arguments.length > 0;

  if (statement && !effects) {
    const line = lineOfNode(statement.node);

    pruneKeepingComments(statement);
    ctx.markChanged();
    ctx.report({
      ruleId: rule.id,
      severity: 'changed',
      line,
      message: `Removed the call to ${name}().${rule.message ? ` ${rule.message}` : ''}`,
    });

    return;
  }

  let reason = 'Its result is used here, so the call was kept.';
  let short = reason;

  if (effects) {
    reason = 'Its receiver or its arguments may do more than the removed call, so the call was kept.';
    short = 'Its receiver or arguments may have effects, so the call was kept.';
  } else if (braceless) {
    reason = 'It is the whole body of a statement without braces, so the call was kept.';
    short = 'It has no braces, so the call was kept.';
  }

  ctx.todo(enclosingStatement(usage.call), rule.id, `${name}() is removed. ${reason} ${guidance(spec, name)}`,
    `${name}() is removed. ${short}`);
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

    const bindings = collectHotBindings(j, root);

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

    for (const action of actions) {
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
