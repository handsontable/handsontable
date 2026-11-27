import { enclosingAnchor, hasOwnLines } from '../lib/anchor.mjs';
import {
  attributeName,
  lineOfNode,
  memberName,
  propertyName,
  stringValue,
  unwrapNode,
  unwrapPath,
} from '../lib/ast.mjs';
import { createReaderFinder, describeReader, describeReaderLine } from '../lib/custom-reader.mjs';
import { hotBindingsOf, isUnresolvedReceiver, receiverOfGrid } from '../lib/hot-bindings.mjs';
import { dynamicOptionSites, templateOptionSites } from '../lib/option-sites.mjs';
import {
  GENERIC_OPTIONS,
  KNOWN_OPTIONS,
  analyzeOptionObjects,
  findJsxOptionAttributes,
  getProperties,
  getProperty,
  hasSpread as isSpreadObject,
  isClaimed,
} from '../lib/option-objects.mjs';
import { createHolders } from '../lib/holders.mjs';
import { printTree } from '../lib/print.mjs';
import { createHop, isReference } from '../lib/resolve.mjs';
import { invalidateScope } from '../lib/scope.mjs';
import { reportInstead, rewrites } from '../lib/safety.mjs';
import { removalAdvice, renameKey } from '../lib/rename-key.mjs';
import { problemsOf } from '../lib/validate.mjs';

const REPORT_BELOW_BAR = 'This object only looks like a Handsontable options object, so it was not changed. '
  + 'Re-run with --aggressive or edit by hand.';
const REPORT_UNCORROBORATED = 'This object only looks like a Handsontable options object and sets fewer than two '
  + 'other known options, so it was not changed. Edit by hand.';
const MEMBER_CALLS = new Set(['MemberExpression', 'OptionalMemberExpression']);
const WRAPPER_NODES = new Set([
  'TSAsExpression',
  'TSSatisfiesExpression',
  'TSNonNullExpression',
  'TSTypeAssertion',
  'ParenthesizedExpression',
]);

/**
 * Per-rule state passed between the helpers below.
 *
 * @typedef {object} Env
 * @property {import('../types.mjs').Ctx} ctx The part's context.
 * @property {object} j The jscodeshift API.
 * @property {import('../types.mjs').Rule} rule The rule being applied.
 * @property {boolean} aggressive Whether `--aggressive` is on, which lowers every rule's bar to `medium`.
 * @property {string[]|null} keys Known option names of the `heuristic` object being handled, or `null` for any
 * other object. Set by `apply()` before each handler call.
 * @property {string|null} level What the target configures (`Target.level`), `null` when it is not known. Set by
 * `apply()` before each handler call.
 * @property {ReturnType<import('../lib/resolve.mjs').createHop>} resolver The one-hop resolver of the file.
 * @property {ReturnType<import('../lib/custom-reader.mjs').createReaderFinder>} readers The finder of the code that
 * may read an option a rule deletes or moves.
 * @property {ReturnType<import('../lib/holders.mjs').createHolders>} holders What else holds an options object.
 */

/**
 * @typedef {import('../lib/custom-reader.mjs').Reader} Reader
 */

/**
 * One place a rule may act: an options object literal, or the opening element of a wrapper component.
 *
 * @typedef {object} Target
 * @property {'object'|'jsx'} type What the target is.
 * @property {object} path NodePath of the `ObjectExpression` or of the `JSXOpeningElement`.
 * @property {'high'|'medium'} confidence Confidence that it holds Handsontable options. JSX is always `high`.
 * @property {string[]|null} [keys] Known option names of a `heuristic` object, `null` for any other target.
 * @property {string} [level] What the object or element configures: `grid` (a settings object, `<HotTable>`),
 * `column` (an element of `columns`, `<HotColumn>`), `cell` (a `cells` return, an element of `cell`), or `hooks`.
 * @property {boolean} [annotated] A type annotation names the object as Handsontable's.
 */

/**
 * Whether a key can be a Handsontable option name: it is named in the rule's own fields.
 *
 * @param {string} source Text of the part.
 * @param {import('../types.mjs').Rule} rule The rule.
 * @returns {boolean} `false` when the text cannot hold what the rule looks for, so the rule is skipped.
 */
function mentions(source, rule) {
  if (rule.kind === 'optionMove') {
    return rule.from.split('.').every(segment => source.includes(segment));
  }

  return source.includes(rule.kind === 'optionRename' ? rule.from : rule.name);
}

/**
 * Check the fields of a rule that the manifest validator cannot express.
 *
 * @param {import('../types.mjs').Rule} rule The rule.
 * @returns {void}
 * @throws {Error} When the rule has a shape this transform cannot run.
 */
function assertRule(rule) {
  if (rule.kind === 'optionMove' && (rule.from.split('.').length !== 2 || rule.to.includes('.'))) {
    throw new Error(`Rule ${rule.id}: "from" must be "<option>.<key>" and "to" a sibling option name.`);
  }

  if (rule.levels !== undefined && (!Array.isArray(rule.levels) || rule.levels.length === 0
    || !rule.levels.every(level => ['grid', 'column', 'cell'].includes(level)))) {
    throw new Error(`Rule ${rule.id}: "levels" must be a non-empty list of "grid", "column", or "cell".`);
  }

  if (rule.onlyTypes !== undefined && (!Array.isArray(rule.onlyTypes) || rule.onlyTypes.length === 0
    || !rule.onlyTypes.every(type => typeof type === 'string' && type))) {
    throw new Error(`Rule ${rule.id}: "onlyTypes" must be a non-empty list of cell type names.`);
  }

  if (rule.typeAdvice !== undefined && typeof rule.typeAdvice !== 'string') {
    throw new Error(`Rule ${rule.id}: "typeAdvice" must be a string.`);
  }

  if (rule.kind === 'optionRename' && rule.context !== undefined && !Array.isArray(rule.context.callArg)) {
    throw new Error(`Rule ${rule.id}: "context" must be { "callArg": [method names] }.`);
  }

  if (rule.kind === 'optionRename' && rule.context?.receiver !== undefined && receiverKeys(rule) === null) {
    throw new Error(`Rule ${rule.id}: "context.receiver" must be { "plugin": <key or keys> }.`);
  }
}

/**
 * The plugin keys a `context.callArg` rule requires of the receiver.
 *
 * @param {import('../types.mjs').Rule} rule An `optionRename` rule.
 * @returns {string[]|null} The keys, or `null` when the rule names no receiver or names a malformed one.
 */
function receiverKeys(rule) {
  const plugin = rule.context?.receiver?.plugin;
  const keys = typeof plugin === 'string' ? [plugin] : plugin;

  return Array.isArray(keys) && keys.length > 0 && keys.every(key => typeof key === 'string' && key) ? keys : null;
}

/**
 * Whether a string is a syntactically valid BCP 47 language tag, as `Intl` sees it.
 *
 * @param {string} tag The text.
 * @returns {boolean} `true` for a tag `Intl.getCanonicalLocales` accepts.
 */
function isLocaleTag(tag) {
  try {
    return Intl.getCanonicalLocales(tag).length === 1;
  } catch {
    return false;
  }
}

/**
 * The option name a rule acts on, which does not count as evidence that an object holds Handsontable options.
 *
 * @param {import('../types.mjs').Rule} rule The rule.
 * @returns {string} The name: `from` of a rename, the parent of a move, `name` of a removal.
 */
function ownKey(rule) {
  if (rule.kind === 'optionMove') {
    return rule.from.split('.')[0];
  }

  return rule.kind === 'optionRename' ? rule.from : rule.name;
}

/**
 * Whether a `heuristic` object has enough company to be taken for settings: at least two known option names
 * other than the one the rule acts on, one of them not too common in unrelated objects (`GENERIC_OPTIONS`). An
 * object that did not come from the heuristic (a column below a settings object, say) always passes.
 *
 * @param {Env} env The state.
 * @returns {boolean} `true` when the evidence is enough.
 */
function corroborated(env) {
  if (!env.keys) {
    return true;
  }

  const others = env.keys.filter(key => key !== ownKey(env.rule));

  return others.length >= 2 && others.some(key => !GENERIC_OPTIONS.has(key));
}

/**
 * Whether a rule may rewrite an object of the given confidence. A `medium` object needs the rule's bar to be
 * `medium` (the rule's `minConfidence`, or `--aggressive`) and `corroborated()` evidence.
 *
 * @param {Env} env The state.
 * @param {'high'|'medium'} confidence Confidence of the object.
 * @returns {boolean} `true` when the object clears the rule's bar.
 */
function clearsBar(env, confidence) {
  const bar = env.aggressive ? 'medium' : (env.rule.minConfidence ?? 'high');

  return confidence === 'high' || (bar === 'medium' && corroborated(env));
}

/**
 * What the user does about an occurrence the tool leaves alone, as the first sentence of its entry.
 *
 * @param {import('../types.mjs').Rule} rule An option rule.
 * @returns {string} For example `Rename oldName to newName by hand.`.
 */
function actionFor(rule) {
  if (rule.kind === 'optionRename') {
    return `Rename ${rule.from} to ${rule.to} by hand.`;
  }

  if (rule.kind === 'optionMove') {
    return `Move ${rule.from} to ${rule.to} by hand.`;
  }

  return `Remove ${rule.name} by hand.`;
}

/**
 * Report an occurrence the rule did not rewrite because the object is below the bar.
 *
 * @param {Env} env The state.
 * @param {object} node The node that holds the key.
 * @param {string} what What was found, for example `correctFormat is set.`.
 * @returns {void}
 */
function reportBelowBar(env, node, what) {
  const { rule } = env;

  env.ctx.report({
    ruleId: rule.id,
    severity: 'manual',
    line: lineOfNode(node),
    message: [rule.advice ?? actionFor(rule), what, corroborated(env) ? REPORT_BELOW_BAR : REPORT_UNCORROBORATED]
      .filter(Boolean).join(' '),
  });
}

/**
 * Printed text of a node, with its original formatting when the node was not edited.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} node An AST node.
 * @returns {string} The text.
 */
function printed(j, node) {
  return printTree(j, node).trim();
}

/**
 * Whether two value nodes mean the same: equal strings, or equal printed text.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} first A value node.
 * @param {object} second A value node.
 * @returns {boolean} `true` when the values are textually identical.
 */
function sameValue(j, first, second) {
  const a = stringValue(first);
  const b = stringValue(second);

  if (a !== null && b !== null) {
    return a === b;
  }

  return printed(j, first) === printed(j, second);
}

/**
 * Value of a JSX attribute as an expression node.
 *
 * @param {object} attribute A `JSXAttribute` node.
 * @returns {object|null} The string literal or the expression inside `{}`, `null` for a bare attribute.
 */
function attributeValue(attribute) {
  return attribute.value?.type === 'JSXExpressionContainer' ? attribute.value.expression : attribute.value;
}

/**
 * Find the places the rules may act. Option objects come from `findOptionObjects`; wrapper elements and the
 * properties of a resolved `{...spread}` attribute come from `findJsxOptionAttributes`.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @param {import('../lib/hot-bindings.mjs').HotBindings} bindings Result of `collectHotBindings`.
 * @returns {{targets: Target[], claimed: Set<object>}} The targets in discovery order, and the object literals that
 * another receiver than the grid takes (`analyzeOptionObjects()`), which no rule reports on.
 */
function collectTargets(j, root, bindings) {
  const objects = new Map();
  const elements = new Map();
  const { objects: optionObjects, claimed } = analyzeOptionObjects(j, root, bindings);

  for (const item of optionObjects) {
    objects.set(item.path.node, {
      type: 'object',
      path: item.path,
      confidence: item.confidence,
      keys: item.keys ?? null,
      level: item.role,
      annotated: item.annotated === true,
    });
  }

  for (const entry of findJsxOptionAttributes(j, root, bindings)) {
    const parent = entry.attributePath.parent;

    if (entry.viaSpread) {
      objects.set(parent.node, {
        type: 'object',
        path: parent,
        confidence: 'high',
        level: objects.get(parent.node)?.level ?? entry.elementRole,
        annotated: objects.get(parent.node)?.annotated === true,
      });
    } else {
      elements.set(parent.node, { type: 'jsx', path: parent, confidence: 'high', level: entry.elementRole });
    }
  }

  return { targets: [...objects.values(), ...elements.values()], claimed };
}

/**
 * Move every comment of a removed node in front of the node that takes its place (the next property, else the
 * previous one, else the enclosing anchor), so no comment is lost. A comment may describe the removed node, but
 * the tool cannot tell, and deleting a comment is not its call. recast prints a trailing line comment before its
 * node anyway, so the moved comments are leading ones.
 *
 * @param {object} removed The removed node.
 * @param {object} anchor The node that takes the comments.
 * @returns {void}
 */
function carryComments(removed, anchor) {
  const carried = removed.comments ?? [];

  if (carried.length === 0) {
    return;
  }

  carried.forEach((comment) => {
    comment.leading = true;
    comment.trailing = false;
  });
  anchor.comments = [...carried, ...(anchor.comments ?? [])];
}

/**
 * Whether a value expression has no effect when the code that holds it is deleted: a literal, an identifier, a
 * member read, a function expression, or an operator, object, array, or template over such values. A call, `new`,
 * `await`, an assignment, or a tagged template is not.
 *
 * @param {object|null|undefined} value An expression node, a JSX attribute value, or `null` for a bare attribute.
 * @returns {boolean} `true` when deleting the value drops nothing but the value.
 */
function isInertValue(value) {
  const node = value ? unwrapNode(value) : null;

  if (!node) {
    return true;
  }

  switch (node.type) {
    case 'Identifier':
    case 'ThisExpression':
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
    case 'NullLiteral':
    case 'BigIntLiteral':
    case 'RegExpLiteral':
    case 'Literal':
    case 'FunctionExpression':
    case 'ArrowFunctionExpression':
      return true;
    case 'JSXExpressionContainer':
      return isInertValue(node.expression);
    case 'TemplateLiteral':
      return node.expressions.every(isInertValue);
    case 'MemberExpression':
    case 'OptionalMemberExpression':
      return isInertValue(node.object) && (!node.computed || isInertValue(node.property));
    case 'UnaryExpression':
      return node.operator !== 'delete' && isInertValue(node.argument);
    case 'BinaryExpression':
    case 'LogicalExpression':
      return isInertValue(node.left) && isInertValue(node.right);
    case 'ConditionalExpression':
      return isInertValue(node.test) && isInertValue(node.consequent) && isInertValue(node.alternate);
    case 'ObjectExpression':
      return node.properties.every((property) => {
        if (property.type === 'ObjectMethod') {
          return !property.computed || isInertValue(property.key);
        }

        if (property.type === 'SpreadElement' || property.type === 'SpreadProperty') {
          return isInertValue(property.argument);
        }

        return (!property.computed || isInertValue(property.key)) && isInertValue(property.value);
      });
    case 'ArrayExpression':
      return node.elements.every(element => element === null
        || isInertValue(element.type === 'SpreadElement' ? element.argument : element));
    default:
      return false;
  }
}

/**
 * Delete a property from an object literal and, when asked, leave a TODO comment where it stood: before the next
 * property, else before the previous one, else before the enclosing property, statement, or array element.
 *
 * @param {Env} env The state.
 * @param {object} objectPath NodePath of the `ObjectExpression`.
 * @param {object} node The property node to delete.
 * @param {string|null} commentText Text of the TODO comment, or `null` for no comment. The comment adds no report
 * entry: the entry of the removal carries the advice.
 * @returns {void}
 */
function removeProperty(env, objectPath, node, commentText) {
  const list = objectPath.node.properties;
  const index = list.indexOf(node);
  const next = list[index + 1];
  const previous = list[index - 1];
  const anchor = next ?? previous ?? enclosingAnchor(objectPath);

  list.splice(index, 1);
  carryComments(node, anchor);
  env.ctx.markChanged();

  if (commentText) {
    env.ctx.comment(anchor, env.rule.id, commentText);
  }
}

/**
 * The comment text for a removal that deleted the property. Only a comment that follows a deletion says so: the
 * advice never makes that claim, because a rule that is not safe leaves the property.
 *
 * @param {string} name The option name.
 * @param {string} advice The advice.
 * @returns {string} A first sentence that names the deletion, followed by the advice.
 */
function deletedComment(name, advice) {
  return `Deleted ${name} here. ${advice}`;
}

/**
 * Handle a removal that the rule does not apply: the property stays. With `todo` on, a TODO comment goes before
 * the property. Otherwise the occurrence is reported.
 *
 * @param {Env} env The state.
 * @param {object} target The node that takes the TODO: the property, or the statement that holds a wrapper element.
 * @param {number|undefined} line Line of the property.
 * @param {string} what What the rule would remove, for the report, for example `the correctFormat property`.
 * @param {string} [reason] Why the rule did not remove it, when the rule would have removed it.
 * @returns {void}
 */
function adviseRemoval(env, target, line, what, reason) {
  const { ctx, rule } = env;
  const advice = [reason, removalAdvice(rule, rule.name)].filter(Boolean).join(' ');

  if (rule.todo === false) {
    reportInstead(ctx, rule, line, `Remove ${what}. ${advice}`.trim());

    return;
  }

  ctx.todo(target, rule.id, advice);
}

const SPREAD_NODES = /^(?:Spread|ExperimentalSpread|JSXSpread)/;
const MAX_SPREAD_DEPTH = 4;

/**
 * Whether a spread follows a node in a list of properties or attributes. A later spread can set the key again and
 * win, so a rewrite of the key would change which value the code ends with.
 *
 * @param {object[]} list The `properties` of an object literal or the `attributes` of an element.
 * @param {object} node The property or attribute.
 * @returns {boolean} `true` when a spread stands after the node.
 */
function spreadFollows(list, node) {
  return list.slice(list.indexOf(node) + 1).some(item => SPREAD_NODES.test(item.type));
}

/**
 * Whether an object literal can set one of the names: it has the key, a computed key that is not a string, or a spread
 * that cannot be read or that can.
 *
 * @param {Env} env The state.
 * @param {object} literalPath NodePath of an `ObjectExpression`.
 * @param {Set<string>} names The option names.
 * @param {number} depth Recursion guard for a spread of a spread.
 * @returns {boolean} `true` when the object may set a name.
 */
function literalMaySet(env, literalPath, names, depth = 0) {
  const keys = literalPath.node.properties.filter(item => !SPREAD_NODES.test(item.type));

  if (keys.some(item => propertyName(item) === null || names.has(propertyName(item)))) {
    return true;
  }

  const spreads = env.resolver.spreadsOf(literalPath, { exact: true });

  return spreads === null || depth >= MAX_SPREAD_DEPTH
    || spreads.some(spread => literalMaySet(env, spread, names, depth + 1));
}

/**
 * Whether a spread in front of a key (in an object, or among the attributes of an element) can set one of the names.
 * A rename gives the key the new name, and the spread may set that name already: the key would then win over the
 * spread, where before the two were different options. A spread that is not an object literal of this file, or a
 * `const` that holds one that nothing changes, may set anything.
 *
 * @param {Env} env The state.
 * @param {object} holderPath NodePath of the object literal or of the `JSXOpeningElement`.
 * @param {object} node The property or attribute that the rule renames.
 * @param {string[]} names The names a spread must not set.
 * @returns {boolean} `true` when a spread before the key can set a name.
 */
function spreadBeforeMaySet(env, holderPath, node, names) {
  const isElement = holderPath.node.type === 'JSXOpeningElement';
  const field = isElement ? 'attributes' : 'properties';
  const list = holderPath.node[field];
  const wanted = new Set(names);

  return list.slice(0, list.indexOf(node)).some((item, index) => {
    if (!SPREAD_NODES.test(item.type)) {
      return false;
    }

    const argument = unwrapPath(holderPath.get(field, index, 'argument'));
    const resolved = argument.node.type === 'ObjectExpression' ? argument : env.resolver.hop(argument, { exact: true });

    return resolved?.node.type !== 'ObjectExpression' || literalMaySet(env, resolved, wanted);
  });
}

/**
 * Whether the object or element that spreads an object can set the option a rule edits, so the edit would change
 * what the receiver ends up with. A move always conflicts: the receiver may set the destination, and the moved value
 * would win or lose against it. A rename conflicts when the receiver sets the new name (anywhere) or the old one
 * after the spread. A removal never conflicts: the removed option is ignored where the rule runs, so no receiver can
 * give it a meaning, and a check on the receiver would also make a second run differ from the first (the first
 * run deletes the receiver's own key, so the second finds nothing to conflict with). The names are the ones the
 * receiver had before any rule edited it, so the answer does not depend on which object a rule reaches first.
 *
 * @param {import('../types.mjs').Rule} rule The rule.
 * @param {{names: {after: Set<string>, anywhere: Set<string>}}} spread The spread, with the names of its receiver.
 * @returns {boolean} `true` when the rule must leave the object alone.
 */
function spreadConflicts(rule, { names }) {
  if (rule.kind === 'optionMove') {
    return true;
  }

  return rule.kind === 'optionRename' && (names.anywhere.has(rule.to) || names.after.has(rule.from));
}

/**
 * Report an object that the rule must not edit because something else holds it: another consumer of the variable
 * that holds it, or an object that spreads it and may set the same key. An object that a type annotation names
 * (`GridSettings`, `ColumnSettings`) is Handsontable's by its type, so the compiler holds every other consumer to
 * that type and the check does not apply to it, nor to anything inside it (`heldBy()` answers `null`).
 *
 * @param {Env} env The state.
 * @param {object} objectPath NodePath of the options object.
 * @param {object} node The node that holds the key, for the line of the entry.
 * @returns {boolean} `true` when the object was reported and the rule must not edit it.
 */
function reportSharedObject(env, objectPath, node) {
  const held = env.holders.heldBy(objectPath);

  if (!held) {
    return false;
  }

  const { ctx, rule } = env;
  const line = lineOfNode(node);
  const say = (text) => {
    ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      line,
      message: `${actionFor(rule)} ${text} The tool left it alone.`,
    });

    return true;
  };

  if (held.other !== null) {
    // The lines the message names are lines of the file, like the line of the entry: the part may start below line 1.
    const otherLine = held.otherLine ? held.otherLine + (ctx.lineOffset ?? 0) : 0;

    return say(`This object is also ${held.other}${otherLine ? ` (line ${otherLine})` : ''}, so editing it `
      + 'here would change that use too.');
  }

  const spread = held.spreads.find(item => spreadConflicts(rule, item));

  if (spread) {
    const where = spread.spread.loc?.start?.line === undefined
      ? undefined : spread.spread.loc.start.line + (ctx.lineOffset ?? 0);

    return say(`This object is spread into another one${where ? ` (line ${where})` : ''}, which can set the same `
      + 'option and win.');
  }

  return false;
}

/**
 * Handle `optionRename` for one options object.
 *
 * @param {Env} env The state.
 * @param {object} objectPath NodePath of the `ObjectExpression`.
 * @param {'high'|'medium'} confidence Confidence of the object.
 * @returns {void}
 */
function renameInObject(env, objectPath, confidence) {
  const { ctx, j, rule } = env;
  const property = getProperty(objectPath, rule.from);

  if (!property) {
    return;
  }

  const line = lineOfNode(property.node);

  if (!rewrites(rule)) {
    reportInstead(ctx, rule, line, `Rename ${rule.from} to ${rule.to}.`);

    return;
  }

  if (!clearsBar(env, confidence)) {
    reportBelowBar(env, property.node, `${rule.from} is set.`);

    return;
  }

  if (reportSharedObject(env, objectPath, property.node)) {
    return;
  }

  if (getProperty(objectPath, rule.to)) {
    ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      line,
      message: `Remove ${rule.from} by hand: both ${rule.from} and ${rule.to} are set in this object.`,
    });

    return;
  }

  if (spreadFollows(objectPath.node.properties, property.node)) {
    ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      line,
      message: `Rename ${rule.from} to ${rule.to} by hand: a spread after it can set ${rule.from} again and win, `
        + 'so it was left alone.',
    });

    return;
  }

  if (spreadBeforeMaySet(env, objectPath, property.node, [rule.from, rule.to])) {
    ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      line,
      message: `Rename ${rule.from} to ${rule.to} by hand: a spread before it can set ${rule.to} or ${rule.from} `
        + 'already, and the renamed key would win over it, so it was left alone.',
    });

    return;
  }

  renameKey(j, property, rule.from, rule.to);
  ctx.markChanged();
  ctx.report({
    ruleId: rule.id,
    severity: 'changed',
    line,
    message: [`Renamed ${rule.from} to ${rule.to}.`, rule.message].filter(Boolean).join(' '),
  });
}

/**
 * Handle `optionRename` for one wrapper component element.
 *
 * @param {Env} env The state.
 * @param {object} openingPath NodePath of the `JSXOpeningElement`.
 * @returns {void}
 */
function renameOnElement(env, openingPath) {
  const { ctx, j, rule } = env;
  const attributes = openingPath.node.attributes;
  const attribute = attributes.find(item => attributeName(item) === rule.from);

  if (!attribute) {
    return;
  }

  if (!rewrites(rule)) {
    reportInstead(ctx, rule, lineOfNode(attribute), `Rename the ${rule.from} attribute to ${rule.to}.`);

    return;
  }

  if (attributes.some(item => attributeName(item) === rule.to)) {
    ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      line: lineOfNode(attribute),
      message: `Remove ${rule.from} by hand: both ${rule.from} and ${rule.to} are set on this element.`,
    });

    return;
  }

  if (spreadFollows(attributes, attribute)) {
    ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      line: lineOfNode(attribute),
      message: `Rename the ${rule.from} attribute to ${rule.to} by hand: a spread after it can set ${rule.from} `
        + 'again and win, so it was left alone.',
    });

    return;
  }

  if (spreadBeforeMaySet(env, openingPath, attribute, [rule.from, rule.to])) {
    ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      line: lineOfNode(attribute),
      message: `Rename the ${rule.from} attribute to ${rule.to} by hand: a spread attribute before it can set `
        + `${rule.to} or ${rule.from} already, and the renamed attribute would win over it, so it was left alone.`,
    });

    return;
  }

  attribute.name = j.jsxIdentifier(rule.to);
  ctx.markChanged();
  ctx.report({
    ruleId: rule.id,
    severity: 'changed',
    line: lineOfNode(attribute),
    message: [`Renamed the ${rule.from} attribute to ${rule.to}.`, rule.message].filter(Boolean).join(' '),
  });
}

/**
 * Report a call whose options argument is a variable (or a member of one) that holds an object literal of this file
 * with the key the rule renames. The object may be used elsewhere, so nothing is renamed in it: the entry is on the
 * call, and the TODO goes in front of its statement.
 *
 * @param {Env} env The state.
 * @param {object} call NodePath of the call.
 * @param {object} argument NodePath of the argument (type assertions stripped).
 * @returns {void}
 */
function reportHeldObject(env, call, argument) {
  const { ctx, rule } = env;

  if (!isReference(argument.node)) {
    return;
  }

  const held = env.resolver.hop(argument);

  if (held?.node.type !== 'ObjectExpression' || !getProperty(held, rule.from)) {
    return;
  }

  ctx.report({
    ruleId: rule.id,
    severity: 'manual',
    line: lineOfNode(call.node),
    message: `Rename ${rule.from} to ${rule.to} in \`${printTree(env.j, argument.node).trim()}\` by hand: `
      + `the object is passed to ${memberName(unwrapNode(call.node.callee))}() from a variable, so it was left alone.`,
  });
}

/**
 * Handle `optionRename` with `context.callArg`: rename the key in object literals passed to the named methods,
 * and in the objects of a `sheets` array inside them. A bare function call is not a method call and is left alone.
 *
 * @param {Env} env The state.
 * @returns {void}
 */
function renameInCallArguments(env) {
  const { j, rule } = env;
  const names = rule.context.callArg;
  const pluginKeys = receiverKeys(rule);
  const bindings = pluginKeys ? hotBindingsOf(env.ctx) : null;
  const seen = new Set();
  const calls = [...env.ctx.root.find(j.CallExpression).paths(), ...env.ctx.root.find(j.OptionalCallExpression).paths()]
    .filter(call => !seen.has(call.node) && seen.add(call.node));

  for (const call of calls) {
    const callee = unwrapNode(call.node.callee);

    if (!MEMBER_CALLS.has(callee.type) || !names.includes(memberName(callee))) {
      continue;
    }

    const calleeObject = unwrapPath(call.get('callee')).get('object');
    const receiver = pluginKeys && !bindings.isPluginReceiver(calleeObject, pluginKeys) ? calleeObject : null;

    call.node.arguments.forEach((argument, index) => {
      const objectPath = unwrapPath(call.get('arguments', index));

      if (objectPath.node.type !== 'ObjectExpression') {
        if (!receiver) {
          reportHeldObject(env, call, objectPath);
        }

        return;
      }

      if (receiver) {
        const property = getProperty(objectPath, rule.from);

        if (property && bindings.isHotFile
          && (isUnresolvedReceiver(receiver, bindings) || bindings.isPartlyPlugin(receiver, pluginKeys))) {
          env.ctx.report({
            ruleId: rule.id,
            severity: 'manual',
            line: lineOfNode(property.node),
            message: `Rename ${rule.from} to ${rule.to} if this is the ${pluginKeys.join(' or ')} plugin: it could `
              + `not be confirmed, so ${rule.from} was left alone.`,
          });
        }

        return;
      }

      renameInObject(env, objectPath, 'high');

      const sheets = getProperty(objectPath, 'sheets');
      const list = sheets ? unwrapPath(sheets.get('value')) : null;

      if (list?.node.type === 'ArrayExpression') {
        list.node.elements.forEach((element, position) => {
          const sheetPath = element ? unwrapPath(list.get('elements', position)) : null;

          if (sheetPath?.node.type === 'ObjectExpression') {
            renameInObject(env, sheetPath, 'high');
          }
        });
      }
    });
  }
}

/**
 * Handle `optionRemove` for one options object: delete every property of that name.
 *
 * @param {Env} env The state.
 * @param {object} objectPath NodePath of the `ObjectExpression`.
 * @param {'high'|'medium'} confidence Confidence of the object.
 * @returns {void}
 */
function removeInObject(env, objectPath, confidence) {
  const { ctx, rule } = env;
  const nodes = getProperties(objectPath).filter(property => property.name === rule.name)
    .map(property => property.path.node);

  for (const node of nodes) {
    if (!rewrites(rule)) {
      adviseRemoval(env, hasOwnLines(objectPath.node, node) ? node : enclosingAnchor(objectPath), lineOfNode(node),
        `the ${rule.name} property`);

      continue;
    }

    if (!clearsBar(env, confidence)) {
      reportBelowBar(env, node, `${rule.name} is set.`);

      continue;
    }

    const reader = readerOf(env, rule.readerAdvice === undefined ? null : env.readers.ofObject(objectPath));

    if (reader) {
      adviseRemoval(env, hasOwnLines(objectPath.node, node) ? node : enclosingAnchor(objectPath), lineOfNode(node),
        `the ${rule.name} property`, readerReason(rule, reader, env.ctx.lineOffset));

      continue;
    }

    if (reportSharedObject(env, objectPath, node)) {
      continue;
    }

    if (!isInertValue(node.value)) {
      adviseRemoval(env, hasOwnLines(objectPath.node, node) ? node : enclosingAnchor(objectPath), lineOfNode(node),
        `the ${rule.name} property`, `${rule.name} is computed here, so it was kept.`);

      continue;
    }

    const line = lineOfNode(node);
    const text = removalAdvice(rule, rule.name);

    removeProperty(env, objectPath, node, rule.todo === false ? null : deletedComment(rule.name, text));
    ctx.report({
      ruleId: rule.id,
      severity: 'changed',
      line,
      message: rule.todo === false ? `Removed ${rule.name}.` : `Removed ${rule.name}. ${text}`,
    });
  }
}

/**
 * Handle `optionRemove` for one wrapper component element: delete the attribute and leave the TODO next to the
 * element (see `addJsxTodo` in `lib/todo.mjs`).
 *
 * @param {Env} env The state.
 * @param {object} openingPath NodePath of the `JSXOpeningElement`.
 * @returns {void}
 */
function removeOnElement(env, openingPath) {
  const { ctx, rule } = env;
  const attributes = openingPath.node.attributes;
  const found = attributes.filter(item => attributeName(item) === rule.name);

  if (!rewrites(rule) && found.length > 0) {
    // The attribute stays, so one TODO next to the element covers all of them.
    adviseRemoval(env, openingPath, lineOfNode(found[0]), `the ${rule.name} attribute`);

    return;
  }

  const reader = found.length > 0 && rule.readerAdvice !== undefined
    ? readerOf(env, env.readers.ofElement(openingPath)) : null;

  if (reader) {
    adviseRemoval(env, openingPath, lineOfNode(found[0]), `the ${rule.name} attribute`,
      readerReason(rule, reader, env.ctx.lineOffset));

    return;
  }

  for (const attribute of found) {
    const line = lineOfNode(attribute);
    const text = removalAdvice(rule, rule.name);

    if (!isInertValue(attribute.value)) {
      adviseRemoval(env, openingPath, line, `the ${rule.name} attribute`,
        `${rule.name} is computed here, so it was kept.`);

      continue;
    }

    attributes.splice(attributes.indexOf(attribute), 1);
    carryComments(attribute, enclosingAnchor(openingPath));
    ctx.markChanged();

    if (rule.todo !== false) {
      ctx.comment(openingPath, rule.id, deletedComment(rule.name, text));
    }

    const removed = `Removed the ${rule.name} attribute.`;

    ctx.report({
      ruleId: rule.id,
      severity: 'changed',
      line,
      message: rule.todo === false ? removed : `${removed} ${text}`,
    });
  }
}

/**
 * The custom code that may read the key a rule is about to move, or the option it is about to delete. Only a rule
 * with `readerAdvice` asks for the check. See `lib/custom-reader.mjs` for what counts.
 *
 * @param {Env} env The state.
 * @param {Reader|null} own The reader of the object or element and of everything that encloses it.
 * @returns {Reader|null} The reader that makes the rule report, or `null` when the rule may edit.
 */
function readerOf(env, own) {
  const { rule } = env;

  if (typeof rule.readerAdvice !== 'string') {
    return null;
  }

  if (own) {
    return own;
  }

  return rule.kind === 'optionMove' ? env.readers.readsNested(...rule.from.split('.')) : env.readers.reads(rule.name);
}

/**
 * The reason a removal was kept, as the lead of its TODO: it starts with what to check.
 *
 * @param {import('../types.mjs').Rule} rule The `optionRemove` rule.
 * @param {Reader} reader The code that may read the option.
 * @param {number} [lineOffset] The zero-based line of the part in its file.
 * @returns {string} The text, followed by the rule's `readerAdvice`.
 */
function readerReason(rule, reader, lineOffset = 0) {
  return `Check ${describeReader(reader, rule.name)} before you delete ${rule.name}.${
    describeReaderLine(reader, lineOffset)} ${
    rule.readerAdvice}`;
}

/**
 * Report a key that was kept because custom code may read it, and say what that code is. The entry starts with the
 * rule's `readerAdvice`, then names the code.
 *
 * @param {Env} env The state.
 * @param {Reader} reader The reader.
 * @param {number|undefined} line Line of the key.
 * @returns {void}
 */
function reportReader(env, reader, line) {
  const { ctx, rule } = env;
  const option = rule.kind === 'optionMove' ? rule.from : rule.name;

  ctx.report({
    ruleId: rule.id,
    severity: 'manual',
    line,
    message: `${rule.readerAdvice} The tool kept ${option} because of ${describeReader(reader, option)}.${
      describeReaderLine(reader, ctx.lineOffset)}`,
  });
}

/**
 * What an option value that is not an object literal says about the nested key, one hop in the same file.
 *
 * @param {Env} env The state.
 * @param {object} objectPath NodePath of an object literal that should hold the nested key.
 * @param {string} childKey The nested key.
 * @returns {'sets'|'unknown'|'clear'} `sets` when the object or a spread of it (itself without a spread) sets the
 * key, `unknown` when a spread cannot be read, `clear` when the key is certainly not set.
 */
function nestedKeyState(env, objectPath, childKey) {
  if (getProperty(objectPath, childKey)) {
    return 'sets';
  }

  if (!isSpreadObject(objectPath)) {
    return 'clear';
  }

  const spreads = env.resolver.spreadsOf(objectPath, { exact: true });

  if (spreads === null || spreads.some(isSpreadObject)) {
    return 'unknown';
  }

  return spreads.some(spread => getProperty(spread, childKey)) ? 'sets' : 'clear';
}

/**
 * Report an option whose value the tool cannot move the nested key out of: a reference to a variable, a member read
 * such as `PRESET.chf`, or an object that spreads another object. The reference is resolved one hop in the same
 * file. An object that certainly lacks the nested key is silent, and every case the tool cannot read is reported,
 * whatever the confidence of the object that holds the option: nothing is rewritten here.
 *
 * @param {Env} env The state.
 * @param {object} holder NodePath of the option value.
 * @param {object} node Node whose line the entry names.
 * @param {boolean} hasDestination Whether the object or element already sets the option the key moves to. Its value
 * wins in 18.x whatever the unreadable source holds, so the source is not reported: a second run over migrated code
 * stays silent.
 * @returns {void}
 */
function reportNestedHolder(env, holder, node, hasDestination) {
  const { ctx, rule } = env;
  const [parentKey, childKey] = rule.from.split('.');
  const reference = isReference(holder.node);

  if (!reference && holder.node.type !== 'ObjectExpression') {
    return;
  }

  const resolved = reference ? env.resolver.hop(holder, { exact: true }) : holder;

  if (resolved && resolved.node.type !== 'ObjectExpression') {
    return;
  }

  const state = resolved ? nestedKeyState(env, resolved, childKey) : 'unknown';
  const origin = reference ? 'a variable' : 'a spread';
  const line = lineOfNode(node);

  if (state === 'clear' || (state === 'unknown' && hasDestination)) {
    return;
  }

  ctx.report({
    ruleId: rule.id,
    severity: 'manual',
    line,
    message: state === 'sets'
      ? `Move ${rule.from} to ${rule.to} by hand: ${parentKey} ${reference ? 'comes from a variable that sets'
        : 'spreads an object that sets'} ${childKey}.`
      : `Move ${rule.from} to ${rule.to} by hand if it sets ${childKey}. ${parentKey} comes from ${origin} here, so `
        + 'the tool cannot read its keys.',
  });
}

/**
 * Whether an expression can be `undefined` or `null` by its form: the word, `void 0`, a conditional with such a branch,
 * a `??` or `||` whose right side is one, and any `&&` (it gives its left side when that is falsy). Another expression
 * is taken as a value: whether a name holds one is not known here.
 *
 * @param {object|null|undefined} node An expression node.
 * @returns {boolean} `true` when the form can yield `undefined` or `null`.
 */
function canBeEmpty(node) {
  const value = node ? unwrapNode(node) : null;

  switch (value?.type) {
    case 'NullLiteral':
      return true;
    case 'Literal':
      return value.value === null;
    case 'Identifier':
      return value.name === 'undefined';
    case 'UnaryExpression':
      return value.operator === 'void';
    case 'ConditionalExpression':
      return canBeEmpty(value.consequent) || canBeEmpty(value.alternate);
    case 'LogicalExpression':
      return value.operator === '&&' || canBeEmpty(value.right);
    default:
      return false;
  }
}

/**
 * Check a move and decide whether it can run. Reports every case that stops it.
 *
 * @param {Env} env The state.
 * @param {object} child The nested property node (`culture`).
 * @param {object|null} existing The node of the value already set at the destination, or `null`.
 * @param {boolean} hasSpread Whether the object or element that receives the destination holds a spread.
 * @returns {'move'|'dedupe'|null} What to do: move the key, drop it because the destination has the same value,
 * or nothing.
 */
function planMove(env, child, existing, hasSpread) {
  const { ctx, j, rule } = env;
  const line = lineOfNode(child);

  if (child.type !== 'ObjectProperty') {
    ctx.report({ ruleId: rule.id, severity: 'manual', line, message: `Move ${rule.from} to ${rule.to} by hand.` });

    return null;
  }

  if (hasSpread) {
    ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      line,
      message: `${rule.from} was not moved, because a spread may already set ${rule.to} here. Move it by hand.`,
    });

    return null;
  }

  const text = stringValue(child.value);

  if (text !== null && !isLocaleTag(text)) {
    ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      line,
      message: `${rule.from} is "${text}", which is not a valid BCP 47 locale tag. Pick the ${rule.to} by hand.`,
    });

    return null;
  }

  if (canBeEmpty(child.value)) {
    ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      line,
      message: `${rule.from} can be undefined or null here, so the tool did not move it: an own ${rule.to} of `
        + `undefined would override the ${rule.to} of the grid, where 17.x read an undefined culture as none. Move it `
        + 'by hand.',
    });

    return null;
  }

  if (existing === null) {
    return 'move';
  }

  if (sameValue(j, existing, child.value)) {
    return 'dedupe';
  }

  const key = rule.from.split('.').pop();
  const kept = stringValue(existing);

  ctx.report({
    ruleId: rule.id,
    severity: 'manual',
    line,
    message: text !== null && kept !== null
      ? `Set ${rule.to} to '${text}' if that was intended, then remove ${key}. 18.0 formats this column with `
        + `${rule.to} '${kept}' and ignores ${rule.from} '${text}', so the output changed from ${text} to ${kept}.`
      : `Keep one of ${rule.to} and ${rule.from} by hand: 18.0 uses ${rule.to} and ignores ${key}, so the output may `
        + 'differ from 17.x.',
  });

  return null;
}

/**
 * Report a successful move, and a follow-up when the value is not a string literal or the rule asks for one.
 *
 * @param {Env} env The state.
 * @param {object} child The nested property node that moved.
 * @param {string} done What was done, for the `changed` entry.
 * @param {object} holder NodePath of the object literal that held the nested key.
 * @returns {void}
 */
function reportMove(env, child, done, holder) {
  const { ctx, rule } = env;
  const line = lineOfNode(child);

  ctx.report({ ruleId: rule.id, severity: 'changed', line, message: done });

  if (stringValue(child.value) === null && child.value) {
    ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      line,
      message: `Check that ${rule.from} is a BCP 47 tag such as de-DE: its value is not a string literal.`,
    });
  }

  // `reportWithout` names a key of the holder that makes the note unnecessary: the holder has it, so its own rule
  // speaks (`numericFormat.pattern`, which the `numbro-pattern` rule reports).
  if (rule.report && !(rule.reportWithout && getProperty(holder, rule.reportWithout))) {
    ctx.report({ ruleId: rule.id, severity: 'manual', line, message: rule.report });
  }
}

/**
 * Report a move that was left alone because it would change what other options configure: the rule says at which
 * levels the key may move (`levels`), and this object or element is at another one.
 *
 * @param {Env} env The state.
 * @param {object} child The node of the nested key.
 * @returns {boolean} `true` when the move is wrong at this level and was reported.
 */
function reportWrongLevel(env, child) {
  const { ctx, rule } = env;

  if (!rule.levels || rule.levels.includes(env.level)) {
    return false;
  }

  ctx.report({
    ruleId: rule.id,
    severity: 'manual',
    line: lineOfNode(child),
    message: rule.levelAdvice ?? `Move ${rule.from} to ${rule.to} by hand: the tool does not set ${rule.to} at the `
      + `${env.level ?? 'unknown'} level.`,
  });

  return true;
}

/**
 * What a `type` value says about a column: the cell type is one the rule names, another one, or not known here.
 *
 * @param {Env} env The state.
 * @param {object|null} valuePath NodePath of the value, `null` for a bare attribute.
 * @returns {'match'|'other'|'unknown'} `match` for a type the rule lists, `other` for any other string.
 */
function typeOfValue(env, valuePath) {
  const text = valuePath ? env.resolver.stringOf(unwrapPath(valuePath)) : null;

  if (text === null) {
    return 'unknown';
  }

  return env.rule.onlyTypes.includes(text) ? 'match' : 'other';
}

/**
 * The `type` that an object sets for itself.
 *
 * @param {Env} env The state.
 * @param {object} objectPath NodePath of an `ObjectExpression`.
 * @returns {'match'|'other'|'unknown'|null} `null` when the object sets no type and nothing in it can.
 */
function ownObjectType(env, objectPath) {
  const list = objectPath.node.properties;
  const stateOf = (name) => {
    const property = getProperty(objectPath, name);

    if (!property) {
      return null;
    }

    return property.node.type === 'ObjectProperty' ? typeOfValue(env, property.get('value')) : 'unknown';
  };
  const states = [stateOf('type'), stateOf('renderer')];
  const keyed = ['type', 'renderer'].map(name => getProperty(objectPath, name)).filter(Boolean);
  const laterSpread = keyed.some(property => list.some((item, index) => /^(Spread|ExperimentalSpread)/.test(item.type)
    && index > list.indexOf(property.node)));
  const spreads = list.some(item => /^(Spread|ExperimentalSpread)/.test(item.type));

  // A spread can set the type, and one after the key can replace it.
  if (laterSpread || (keyed.length === 0 && spreads)) {
    return 'unknown';
  }

  // The numeric renderer formats with `numericFormat` in a column of any type, so a renderer the rule names makes the
  // column one. A renderer it does not name says nothing about the type, which may still come from above.
  if (states.includes('match')) {
    return 'match';
  }

  if (states.includes('unknown')) {
    return 'unknown';
  }

  return states[0] === null ? null : 'other';
}

/**
 * The object an element of `columns` or `cell` sits in, found in the text: the element is in an array that is the
 * value of the key.
 *
 * @param {object} objectPath NodePath of the element.
 * @returns {object|null} NodePath of the object that holds the array, or `null` when the element does not sit in one.
 */
function ownerOfElement(objectPath) {
  const above = (path) => {
    let current = path.parent;

    while (current && WRAPPER_NODES.has(current.node.type)) {
      current = current.parent;
    }

    return current;
  };
  const array = above(objectPath);
  const property = array?.node.type === 'ArrayExpression' ? above(array) : null;
  const owner = property && (property.node.type === 'ObjectProperty' || property.node.type === 'Property')
    ? property.parent : null;

  return owner?.node.type === 'ObjectExpression' && ['columns', 'cell'].includes(propertyName(property.node))
    ? owner : null;
}

/**
 * The cell type an object stands for. A column with no `type` of its own takes the one of the settings object it sits
 * in, so the object is read first and then the objects around it. Nothing else is followed: an element that is
 * reached through a variable has no object around it that the tool can see.
 *
 * @param {Env} env The state.
 * @param {object} objectPath NodePath of an options object.
 * @returns {'match'|'other'|'unknown'} The state. An object that sets no type anywhere is `unknown`, because the
 * cell type of a column may come from the code the tool cannot see.
 */
function objectCellType(env, objectPath) {
  let current = objectPath;

  for (let depth = 0; current && depth < 4; depth += 1) {
    const own = ownObjectType(env, current);

    if (own !== null) {
      return own;
    }

    current = ownerOfElement(current);
  }

  return 'unknown';
}

/**
 * The cell type of a wrapper element: its `type` attribute, else the one of the `HotTable` it sits in.
 *
 * @param {Env} env The state.
 * @param {object} openingPath NodePath of a `JSXOpeningElement`.
 * @returns {'match'|'other'|'unknown'} The state.
 */
function elementCellType(env, openingPath) {
  /**
   * The state one attribute of an opening element says.
   *
   * @param {object} opening NodePath of the opening element.
   * @param {string} name The attribute name.
   * @returns {'match'|'other'|'unknown'|null} `null` when the element has no such attribute.
   */
  const stateOf = (opening, name) => {
    const { attributes } = opening.node;
    const index = attributes.findIndex(item => attributeName(item) === name);

    if (index === -1) {
      return null;
    }

    const value = opening.get('attributes', index, 'value');

    if (attributes[index].type !== 'JSXAttribute' || !value.node) {
      return 'unknown';
    }

    return typeOfValue(env, value.node.type === 'JSXExpressionContainer'
      ? opening.get('attributes', index, 'value', 'expression') : value);
  };
  let opening = openingPath;

  for (let depth = 0; opening && depth < 3; depth += 1) {
    if (opening.node.attributes.some(item => item.type === 'JSXSpreadAttribute')) {
      return 'unknown';
    }

    const states = [stateOf(opening, 'type'), stateOf(opening, 'renderer')];

    if (states.includes('match')) {
      return 'match';
    }

    if (states.includes('unknown')) {
      return 'unknown';
    }

    if (states[0] !== null) {
      return 'other';
    }

    let parent = opening.parent?.parent;

    while (parent && !['JSXElement', 'JSXFragment'].includes(parent.node.type)) {
      parent = parent.parent;
    }

    opening = parent?.node.type === 'JSXElement' ? parent.get('openingElement') : null;
  }

  return 'unknown';
}

/**
 * Report a move that was left alone because the key means something only for some cell types (`onlyTypes`), and the
 * column is not one of them or the tool cannot tell: `numericFormat` is ignored by a text column, and `locale` is not.
 *
 * @param {Env} env The state.
 * @param {'match'|'other'|'unknown'} state The cell type of the object or element.
 * @param {object} child The node of the nested key.
 * @returns {boolean} `true` when the move is wrong for this cell type and was reported.
 */
function reportWrongType(env, state, child) {
  const { ctx, rule } = env;

  if (!rule.onlyTypes || state === 'match') {
    return false;
  }

  ctx.report({
    ruleId: rule.id,
    severity: 'manual',
    line: lineOfNode(child),
    message: rule.typeAdvice ?? `Move ${rule.from} to ${rule.to} by hand if the cell type is `
      + `${rule.onlyTypes.join(' or ')}: the tool did not find one here.`,
  });

  return true;
}

/**
 * Quote a new key the way a neighboring key is quoted.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} model The key node of the property next to it.
 * @param {string} name The new key name.
 * @returns {object} The key node.
 */
function keyLike(j, model, name) {
  const raw = model.extra?.raw ?? model.raw;

  if (model.type === 'Identifier' || typeof raw !== 'string') {
    return j.identifier(name);
  }

  const key = j.literal(name);

  key.extra = { raw: `${raw[0]}${name}${raw[0]}`, rawValue: name };

  return key;
}

/**
 * Report a nested key that was left in place because a spread after it can set it again.
 *
 * @param {Env} env The state.
 * @param {object} child The node of the nested key.
 * @param {string} parentKey The option that holds it.
 * @param {string} childKey The nested key.
 * @returns {void}
 */
function reportLaterSpread(env, child, parentKey, childKey) {
  const { ctx, rule } = env;

  ctx.report({
    ruleId: rule.id,
    severity: 'manual',
    line: lineOfNode(child),
    message: `Move ${rule.from} to ${rule.to} by hand: a spread after ${childKey} in ${parentKey} can set `
      + `${childKey} again and win, so it was left alone.`,
  });
}

/**
 * Handle `optionMove` for one options object: take `<option>.<key>` out of the object that `<option>` holds and
 * put it beside `<option>`.
 *
 * @param {Env} env The state.
 * @param {object} objectPath NodePath of the `ObjectExpression`.
 * @param {'high'|'medium'} confidence Confidence of the object.
 * @returns {void}
 */
function moveInObject(env, objectPath, confidence) {
  const { ctx, j, rule } = env;
  const [parentKey, childKey] = rule.from.split('.');
  const parent = getProperty(objectPath, parentKey);

  if (!parent || parent.node.type !== 'ObjectProperty') {
    return;
  }

  const holder = unwrapPath(parent.get('value'));
  const child = holder.node.type === 'ObjectExpression' ? getProperty(holder, childKey) : null;

  if (!child) {
    reportNestedHolder(env, holder, parent.node, getProperty(objectPath, rule.to) !== null);

    return;
  }

  if (!rewrites(rule)) {
    reportInstead(ctx, rule, lineOfNode(child.node), `Move ${rule.from} to ${rule.to}.`);

    return;
  }

  const reader = readerOf(env, rule.readerAdvice === undefined ? null : env.readers.ofObject(objectPath));

  if (reader) {
    reportReader(env, reader, lineOfNode(child.node));

    return;
  }

  if (!clearsBar(env, confidence)) {
    reportBelowBar(env, child.node, `${rule.from} is set.`);

    return;
  }

  if (reportWrongLevel(env, child.node)) {
    return;
  }

  if (reportSharedObject(env, objectPath, child.node)) {
    return;
  }

  if (rule.onlyTypes && reportWrongType(env, objectCellType(env, objectPath), child.node)) {
    return;
  }

  if (spreadFollows(holder.node.properties, child.node)) {
    reportLaterSpread(env, child.node, parentKey, childKey);

    return;
  }

  const existingProperty = getProperty(objectPath, rule.to);
  const hasSpread = objectPath.node.properties.some(item => /^(Spread|ExperimentalSpread)/.test(item.type));
  const plan = planMove(env, child.node, existingProperty ? existingProperty.node.value : null, hasSpread);

  if (plan === null) {
    return;
  }

  const moved = child.node;

  if (plan === 'move') {
    const property = j.objectProperty(keyLike(j, parent.node.key, rule.to), moved.value);
    const list = objectPath.node.properties;

    property.comments = moved.comments;
    moved.comments = null;
    list.splice(list.indexOf(parent.node), 0, property);
  }

  removeProperty(env, holder, moved, null);
  reportMove(env, moved, plan === 'move'
    ? `Moved ${rule.from} to ${rule.to}.`
    : `Removed ${rule.from}: ${rule.to} is already set to the same value.`, holder);
}

/**
 * Build the JSX attribute for a moved value: a quoted attribute for a string literal, `{expression}` otherwise.
 *
 * @param {object} j The jscodeshift API.
 * @param {string} name The attribute name.
 * @param {object} value The value node.
 * @returns {object} The `JSXAttribute`.
 */
function attributeFor(j, name, value) {
  const text = value.type === 'StringLiteral' || value.type === 'Literal' ? stringValue(value) : null;

  if (text === null) {
    return j.jsxAttribute(j.jsxIdentifier(name), j.jsxExpressionContainer(value));
  }

  const literal = j.literal(text);

  literal.extra = { raw: `"${text}"`, rawValue: text };

  return j.jsxAttribute(j.jsxIdentifier(name), literal);
}

/**
 * Handle `optionMove` for one wrapper component element: `numericFormat={{ culture: 'de-DE' }}` becomes a
 * `locale="de-DE"` attribute before it, and the nested key goes.
 *
 * @param {Env} env The state.
 * @param {object} openingPath NodePath of the `JSXOpeningElement`.
 * @returns {void}
 */
function moveOnElement(env, openingPath) {
  const { ctx, j, rule } = env;
  const [parentKey, childKey] = rule.from.split('.');
  const attributes = openingPath.node.attributes;
  const index = attributes.findIndex(item => attributeName(item) === parentKey);

  if (index === -1 || attributes[index].value?.type !== 'JSXExpressionContainer') {
    return;
  }

  const holder = unwrapPath(openingPath.get('attributes', index, 'value', 'expression'));
  const child = holder.node.type === 'ObjectExpression' ? getProperty(holder, childKey) : null;

  if (!child) {
    reportNestedHolder(env, holder, attributes[index], attributes.some(item => attributeName(item) === rule.to));

    return;
  }

  if (!rewrites(rule)) {
    reportInstead(ctx, rule, lineOfNode(child.node), `Move ${rule.from} to the ${rule.to} attribute.`);

    return;
  }

  const reader = readerOf(env, rule.readerAdvice === undefined ? null : env.readers.ofElement(openingPath));

  if (reader) {
    reportReader(env, reader, lineOfNode(child.node));

    return;
  }

  if (reportWrongLevel(env, child.node)) {
    return;
  }

  if (rule.onlyTypes && reportWrongType(env, elementCellType(env, openingPath), child.node)) {
    return;
  }

  if (spreadFollows(holder.node.properties, child.node)) {
    reportLaterSpread(env, child.node, parentKey, childKey);

    return;
  }

  const existingAttribute = attributes.find(item => attributeName(item) === rule.to);
  const existing = existingAttribute ? (attributeValue(existingAttribute) ?? j.identifier('true')) : null;
  const hasSpread = attributes.some(item => item.type === 'JSXSpreadAttribute');
  const plan = planMove(env, child.node, existing, hasSpread);

  if (plan === null) {
    return;
  }

  const moved = child.node;

  if (plan === 'move') {
    attributes.splice(index, 0, attributeFor(j, rule.to, moved.value));
  }

  removeProperty(env, holder, moved, null);
  reportMove(env, moved, plan === 'move'
    ? `Moved ${rule.from} to the ${rule.to} attribute.`
    : `Removed ${rule.from}: ${rule.to} is already set to the same value.`, holder);
}

/**
 * The tag of a JSX element as text, for a message.
 *
 * @param {object} nameNode A `JSXIdentifier` or `JSXMemberExpression` node.
 * @returns {string|null} The tag, or `null` for a namespaced name.
 */
function tagText(nameNode) {
  if (nameNode.type === 'JSXIdentifier') {
    return nameNode.name;
  }

  if (nameNode.type === 'JSXMemberExpression') {
    const object = tagText(nameNode.object);

    return object === null ? null : `${object}.${nameNode.property.name}`;
  }

  return null;
}

/**
 * Report what the option rules would act on in code that holds Handsontable options without being recognized as
 * holding them, in a file that belongs to Handsontable. Nothing is rewritten.
 *
 * - An `optionMove` rule reports an object literal that sets `<option>: { <key>: ... }` (`numericFormat: { culture }`)
 *   outside every option object, and a component element (not a DOM tag) with such an attribute. The pair is specific
 *   enough on its own.
 * - An `optionRename` and `optionRemove` rule report an attribute of a component element that is not a wrapper, when
 *   the element sets at least two other known options and one of them is not a common name.
 *
 * @param {Env} env The state.
 * @param {Set<object>} handled The object literals that `findOptionObjects` recognized, at any confidence.
 * @param {import('../lib/hot-bindings.mjs').HotBindings} bindings Result of `collectHotBindings`.
 * @param {Set<object>} claimed The object literals that another receiver than the grid takes. They are not
 * Handsontable options, so an object in one is never reported.
 * @returns {void}
 */
function reportUnrecognized(env, handled, bindings, claimed) {
  const { ctx, j, rule } = env;

  if (!bindings.isHotFile || (rule.kind === 'optionRename' && rule.context)) {
    return;
  }

  const [parentKey, childKey] = rule.kind === 'optionMove' ? rule.from.split('.') : [ownKey(rule), null];
  const holds = value => value?.type === 'ObjectExpression'
    && value.properties.some(property => propertyName(property) === childKey);

  if (rule.kind === 'optionMove') {
    ctx.root.find(j.ObjectProperty).forEach((path) => {
      const value = unwrapNode(path.node.value);

      if (propertyName(path.node) !== parentKey || !holds(value) || handled.has(path.parent.node)
        || isClaimed(path, claimed)) {
        return;
      }

      const child = value.properties.find(property => propertyName(property) === childKey);

      ctx.report({
        ruleId: rule.id,
        severity: 'manual',
        line: lineOfNode(child),
        message: `Move ${rule.from} to ${rule.to} by hand if this object holds Handsontable options. It was not `
          + `recognized as one, so ${parentKey} was left alone.`,
      });
    });
  }

  ctx.root.find(j.JSXElement).forEach((path) => {
    const opening = path.node.openingElement;
    const tag = tagText(opening.name);

    if (tag === null || (opening.name.type === 'JSXIdentifier' && /^[a-z]/.test(tag)) || bindings.getComponent(path)) {
      return;
    }

    const attribute = opening.attributes.find(item => attributeName(item) === parentKey);

    if (!attribute) {
      return;
    }

    const where = `<${tag}> is a Handsontable component. It was not recognized as one`;

    if (rule.kind === 'optionMove') {
      const value = attribute.value?.type === 'JSXExpressionContainer' ? unwrapNode(attribute.value.expression) : null;

      if (holds(value)) {
        ctx.report({
          ruleId: rule.id,
          severity: 'manual',
          line: lineOfNode(value.properties.find(property => propertyName(property) === childKey)),
          message: `Move ${rule.from} to ${rule.to} by hand if ${where}, so ${parentKey} was left alone.`,
        });
      }

      return;
    }

    const keys = opening.attributes.map(item => attributeName(item)).filter(name => KNOWN_OPTIONS.has(name));

    env.keys = keys;

    if (corroborated(env)) {
      const left = `by hand if ${where}, so the attribute was left alone.`;

      ctx.report({
        ruleId: rule.id,
        severity: 'manual',
        line: lineOfNode(attribute),
        message: rule.kind === 'optionRename'
          ? `Rename ${rule.from} to ${rule.to} ${left}`
          : `Remove ${rule.name} ${left} ${removalAdvice(rule, rule.name)}`.trim(),
      });
    }

    env.keys = null;
  });
}

/**
 * The option a rule acts on, as it is written in a template or an assignment, and what to do about it. A rename
 * that acts on call arguments (`context.callArg`) has no template or assignment form, so it gives `null`.
 *
 * @param {import('../types.mjs').Rule} rule An option rule.
 * @returns {{name: string, instruction: string}|null} The option name and the instruction for the user.
 */
function siteOf(rule) {
  if (rule.kind === 'optionRename') {
    return rule.context ? null : { name: rule.from, instruction: `Rename ${rule.from} to ${rule.to}.` };
  }

  if (rule.kind === 'optionMove') {
    return {
      name: rule.from.split('.')[0],
      instruction: `If it sets ${rule.from.split('.')[1]}, move ${rule.from} to ${rule.to}.`,
    };
  }

  return { name: rule.name, instruction: `Remove ${rule.name}. ${removalAdvice(rule, rule.name)}`.trim() };
}

/**
 * Report the wrapper tags of a template that set an option a rule targets. A template is read-only for the tool,
 * so every site is a `manual` entry that names the option and the line.
 *
 * @param {import('../types.mjs').Ctx} ctx Context of a `template` part.
 * @param {import('../types.mjs').Rule[]} rules Option rules of one version.
 * @returns {void}
 */
function reportTemplateOptions(ctx, rules) {
  const targets = rules.map(rule => ({ rule, site: siteOf(rule) })).filter(item => item.site);
  const sites = templateOptionSites(ctx.source, targets.map(item => item.site.name));

  for (const site of sites) {
    for (const { rule, site: target } of targets.filter(item => item.site.name === site.name)) {
      ctx.report({
        ruleId: rule.id,
        severity: 'manual',
        line: site.line,
        message: `${site.attribute} on <${site.tag}> sets ${site.name} in a template. The tool does not rewrite `
          + `templates. ${target.instruction}`,
      });
    }
  }
}

/**
 * Report the places where a file sets an option a rule targets without an options object: an assignment to
 * `x.numericFormat`, `setCellMeta(row, col, 'correctFormat', ...)`, and `setCellMetaObject(row, col, {...})`. Only a
 * file that belongs to Handsontable is read. Each site is a `manual` entry, and nothing is rewritten.
 *
 * @param {import('../types.mjs').Ctx} ctx Context of a `js` part.
 * @param {import('../types.mjs').Rule[]} rules Option rules of one version.
 * @returns {void}
 */
function reportDynamicOptions(ctx, rules) {
  const targets = rules.map(rule => ({ rule, site: siteOf(rule) }))
    .filter(item => item.site && ctx.source.includes(item.site.name));

  const bindings = targets.length === 0 ? null : hotBindingsOf(ctx);

  if (!bindings?.isHotFile) {
    return;
  }

  for (const site of dynamicOptionSites(ctx.j, ctx.root)) {
    if (site.form === 'setCellMetaObject' && bindings.isInstance(site.receiver)) {
      // The object of a call on a confirmed grid instance is a cell option object, which the rules handle.
      continue;
    }

    if (site.receiver && receiverOfGrid(site.receiver, bindings) === 'other') {
      // The file shows that the receiver is another object (a local one, a library, a plugin): not the grid.
      continue;
    }

    for (const { rule, site: target } of targets.filter(item => item.site.name === site.name)) {
      const how = site.form === 'assignment' ? 'an assignment' : `${site.form}()`;

      ctx.report({
        ruleId: rule.id,
        severity: 'manual',
        line: site.line,
        message: `${target.instruction} ${site.name} is set by ${how} here, so the tool cannot rewrite it.`,
      });
    }
  }
}

/**
 * Renames, moves, and removes options (`optionRename`, `optionMove`, `optionRemove`).
 *
 * Where it acts: object literals that `findOptionObjects` recognizes as Handsontable options (grid, column, and
 * cell level, reached through `new Handsontable()`, `updateSettings()`, `settings={...}`, type annotations, and
 * `columns`, `cell`, `cells`), and the attributes of `<HotTable>` and `<HotColumn>`. A rule rewrites an object
 * when its confidence reaches the rule's `minConfidence` (default `high`); `--aggressive` lowers every bar to
 * `medium`. Even then a `medium` object that sets fewer than two known options besides the one the rule acts on
 * stays below the bar, and a file with no Handsontable import or global holds no `medium` object at all. An object
 * below the bar is reported as `manual` and left alone. A key set twice, or a missing key, is never guessed: the
 * first case is reported, the second is skipped.
 *
 * - `optionRename` (`from`, `to`): the key changes, the value and the key's quoting stay, a shorthand property
 *   becomes `to: from`. When `to` is already set the object is reported. With `context: { callArg: [names] }`
 *   the rule acts on object-literal arguments of method calls with those names (and on the objects of a `sheets`
 *   array inside them) instead, whatever the option-object finder says.
 * - `optionMove` (`from` = `<option>.<key>`, `to` = sibling option name): the nested key moves, value verbatim,
 *   to a property before `<option>`. An existing `to` with the same value only drops the nested key, a different
 *   one is reported. A literal value that is not a BCP 47 tag is reported and not moved. An emptied `<option>`
 *   object stays: `numericFormat: {}` is not the same as no `numericFormat`, because the 18.x numeric renderer
 *   falls back to its own defaults (`DEFAULT_INTL_FORMAT`, no grouping) only for a nullish value, and formats with
 *   the `Intl.NumberFormat` defaults (grouping on) for an empty object. A value that is not an object literal (a
 *   variable, a member read such as `PRESET.chf`) and an object literal that spreads another object are resolved one
 *   hop in the same file: when the key is set there, or the source cannot be read, the option is only reported.
 *   A rule with `readerAdvice` does not move the key when custom code may read it (see `lib/custom-reader.mjs`): the
 *   object, an enclosing option object, or the element sets an editor, renderer, validator, or cell type that is not a
 *   built-in name, has a spread or a computed key the tool cannot read, or the file reads the nested key
 *   (`numericFormat.culture`). It reports `readerAdvice` instead, at every confidence and under `--aggressive`. An optional `report` text is added as a
 *   `manual` entry after every move.
 * - `optionRemove` (`name`, `todo`, `advice`, `readerAdvice`): every property or attribute of that name goes, unless
 *   the rule has `readerAdvice` and custom code may read the option (the same check as for a move): the property
 *   stays and a TODO says what to check. Unless `todo` is
 *   `false`, a TODO comment with the advice is left before the next property (else the previous one, else the
 *   enclosing property, statement, or array element). A run that finds no such property adds nothing, so the
 *   comment is never written twice. Comments on the removed property go with it, except a section header
 *   (followed by a blank line) and a TODO of this tool, which move to the anchor.
 *
 * Two places that cannot be rewritten are reported as `manual` entries from the same rules: the attributes of
 * `<hot-table>`, `<hot-column>`, `<HotTable>`, and `<HotColumn>` in a `template` part (Vue, Angular, and HTML
 * templates, kebab-case and camel-case names, with `:`, `v-bind:`, and `[...]` prefixes, and `settings` bindings that
 * name the option), and, in a Handsontable file, assignments and `setCellMeta()` calls that set the option.
 *
 * Code that holds the option without being recognized is reported too, in a Handsontable file (`reportUnrecognized()`).
 * An `optionMove` rule reports an object literal that sets `<option>: { <key> }` outside every option object, and a
 * component element that is not a known wrapper with such an attribute. An `optionRename` and `optionRemove` rule
 * report an attribute on such a component when it sets at least two other known options. A DOM tag never counts.
 * Nothing is rewritten there, so a re-exported `HotTable` under another name gets entries and no edit.
 *
 * A rule whose `safe` is not `true` never edits code. It reports `manual` entries instead, and leaves a TODO comment
 * when the rule asks for one (see `lib/safety.mjs`).
 *
 * @type {import('../types.mjs').Transform}
 */
const options = {
  kinds: ['optionRename', 'optionMove', 'optionRemove'],
  fileKinds: ['js', 'template'],

  /**
   * @param {import('../types.mjs').Rule} rule An `optionRename`, `optionMove`, or `optionRemove` rule.
   * @returns {string[]} The problems of the rule.
   */
  validate(rule) {
    return problemsOf(() => assertRule(rule));
  },

  /**
   * @param {import('../types.mjs').Ctx} ctx Context of a `js` or `template` part.
   * @param {import('../types.mjs').Rule[]} rules Option rules of one version in manifest order.
   * @returns {void}
   */
  apply(ctx, rules) {
    if (ctx.fileKind === 'template') {
      reportTemplateOptions(ctx, rules);

      return;
    }

    const active = rules.filter(rule => mentions(ctx.source, rule));

    reportDynamicOptions(ctx, rules);

    if (active.length === 0) {
      return;
    }

    active.forEach(assertRule);
    invalidateScope();

    const { j } = ctx;
    const aggressive = Boolean(ctx.options?.aggressive);
    const bindings = hotBindingsOf(ctx);
    const { targets, claimed } = collectTargets(j, ctx.root, bindings);
    const handled = new Set(targets.filter(target => target.type === 'object').map(target => target.path.node));
    const resolver = createHop(j, ctx.root);
    const readers = createReaderFinder({
      j,
      root: ctx.root,
      resolver,
      optionNodes: new Set(targets.filter(target => target.type === 'object').map(target => target.path.node)),
    });

    const annotated = new Set(targets.filter(target => target.type === 'object' && target.annotated)
      .map(target => target.path.node));
    const holders = createHolders({
      j,
      root: ctx.root,
      bindings,
      isOptionObject: node => handled.has(node),
      isAnnotated: node => annotated.has(node),
      aggressive,
    });

    for (const rule of active) {
      const env = { ctx, j, rule, aggressive, keys: null, level: null, resolver, readers, holders };

      if (rule.kind === 'optionRename' && rule.context) {
        renameInCallArguments(env);

        continue;
      }

      for (const target of targets) {
        env.level = target.level ?? null;

        if (target.type === 'object') {
          const handler = { optionRename: renameInObject, optionMove: moveInObject, optionRemove: removeInObject };

          env.keys = target.keys ?? null;
          handler[rule.kind](env, target.path, target.confidence);
          env.keys = null;
        } else {
          const handler = { optionRename: renameOnElement, optionMove: moveOnElement, optionRemove: removeOnElement };

          handler[rule.kind](env, target.path);
        }

        env.level = null;
      }

      reportUnrecognized(env, handled, bindings, claimed);
    }
  },
};

export default options;
