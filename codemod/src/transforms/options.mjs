import { enclosingAnchor, hasOwnLines } from '../lib/anchor.mjs';
import { attributeName, lineOfNode, memberName, stringValue, unwrapNode, unwrapPath } from '../lib/ast.mjs';
import { collectHotBindings, isUnresolvedReceiver } from '../lib/hot-bindings.mjs';
import { dynamicOptionSites, templateOptionSites } from '../lib/option-sites.mjs';
import {
  GENERIC_OPTIONS,
  findJsxOptionAttributes,
  findOptionObjects,
  getProperties,
  getProperty,
} from '../lib/option-objects.mjs';
import { invalidateScope, lookup } from '../lib/scope.mjs';
import { reportInstead, rewrites } from '../lib/safety.mjs';
import { removalAdvice, renameKey } from '../lib/rename-key.mjs';
import { problemsOf } from '../lib/validate.mjs';

const REPORT_BELOW_BAR = 'This object only looks like a Handsontable options object, so it was not changed. '
  + 'Re-run with --aggressive or edit by hand.';
const REPORT_UNCORROBORATED = 'This object only looks like a Handsontable options object and sets fewer than two '
  + 'other known options, so it was not changed. Edit by hand.';
const MEMBER_CALLS = new Set(['MemberExpression', 'OptionalMemberExpression']);

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
 */

/**
 * One place a rule may act: an options object literal, or the opening element of a wrapper component.
 *
 * @typedef {object} Target
 * @property {'object'|'jsx'} type What the target is.
 * @property {object} path NodePath of the `ObjectExpression` or of the `JSXOpeningElement`.
 * @property {'high'|'medium'} confidence Confidence that it holds Handsontable options. JSX is always `high`.
 * @property {string[]|null} [keys] Known option names of a `heuristic` object, `null` for any other target.
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
    message: [what, corroborated(env) ? REPORT_BELOW_BAR : REPORT_UNCORROBORATED, rule.advice]
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
  return j(node).toSource().trim();
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
 * @returns {Target[]} The targets in discovery order.
 */
function collectTargets(j, root) {
  const bindings = collectHotBindings(j, root);
  const objects = new Map();
  const elements = new Map();

  for (const item of findOptionObjects(j, root, bindings)) {
    objects.set(item.path.node, {
      type: 'object',
      path: item.path,
      confidence: item.confidence,
      keys: item.keys ?? null,
    });
  }

  for (const entry of findJsxOptionAttributes(j, root, bindings)) {
    const parent = entry.attributePath.parent;

    if (entry.viaSpread) {
      objects.set(parent.node, { type: 'object', path: parent, confidence: 'high' });
    } else {
      elements.set(parent.node, { type: 'jsx', path: parent, confidence: 'high' });
    }
  }

  return [...objects.values(), ...elements.values()];
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

  if (getProperty(objectPath, rule.to)) {
    ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      line,
      message: `Both ${rule.from} and ${rule.to} are set in this object. Remove ${rule.from} by hand.`,
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
      message: `Both ${rule.from} and ${rule.to} are set on this element. Remove ${rule.from} by hand.`,
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
  const bindings = pluginKeys ? collectHotBindings(j, env.ctx.root) : null;
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
        return;
      }

      if (receiver) {
        const property = getProperty(objectPath, rule.from);

        if (property && bindings.isHotFile && isUnresolvedReceiver(receiver)) {
          env.ctx.report({
            ruleId: rule.id,
            severity: 'manual',
            line: lineOfNode(property.node),
            message: `Could not confirm that this is the ${pluginKeys.join(' or ')} plugin, so ${rule.from} was `
              + `left alone. If it is: rename ${rule.from} to ${rule.to}.`,
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
 * Resolve an identifier to the object literal it was declared with, one hop, in the same file.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @param {object} path NodePath of an `Identifier`.
 * @returns {object|null} NodePath of the `ObjectExpression`, or `null`.
 */
function declaredObject(j, root, path) {
  const binding = lookup(path, path.node.name, 'value');

  if (!binding?.init) {
    return null;
  }

  const declarator = root.find(j.VariableDeclarator).filter(item => item.node === binding.node).paths()[0];
  const init = declarator ? unwrapPath(declarator.get('init')) : null;

  return init?.node.type === 'ObjectExpression' ? init : null;
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

  if (existing === null) {
    return 'move';
  }

  if (sameValue(j, existing, child.value)) {
    return 'dedupe';
  }

  ctx.report({
    ruleId: rule.id,
    severity: 'manual',
    line,
    message: `${rule.to} is already set to a different value than ${rule.from}. Keep one by hand.`,
  });

  return null;
}

/**
 * Report a successful move, and a follow-up when the value is not a string literal or the rule asks for one.
 *
 * @param {Env} env The state.
 * @param {object} child The nested property node that moved.
 * @param {string} done What was done, for the `changed` entry.
 * @returns {void}
 */
function reportMove(env, child, done) {
  const { ctx, rule } = env;
  const line = lineOfNode(child);

  ctx.report({ ruleId: rule.id, severity: 'changed', line, message: done });

  if (stringValue(child.value) === null && child.value) {
    ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      line,
      message: `The value of ${rule.from} is not a string literal. Check that it is a BCP 47 tag such as de-DE.`,
    });
  }

  if (rule.report) {
    ctx.report({ ruleId: rule.id, severity: 'manual', line, message: rule.report });
  }
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

  let holder = unwrapPath(parent.get('value'));

  if (holder.node.type === 'Identifier') {
    invalidateScope();
    holder = declaredObject(j, ctx.root, holder);

    if (holder && getProperty(holder, childKey)) {
      ctx.report({
        ruleId: rule.id,
        severity: 'manual',
        line: lineOfNode(parent.node),
        message: `${parentKey} comes from a variable that sets ${childKey}. Move ${rule.from} to ${rule.to} by hand.`,
      });
    }

    return;
  }

  if (holder.node.type !== 'ObjectExpression') {
    return;
  }

  const child = getProperty(holder, childKey);

  if (!child) {
    return;
  }

  if (!rewrites(rule)) {
    reportInstead(ctx, rule, lineOfNode(child.node), `Move ${rule.from} to ${rule.to}.`);

    return;
  }

  if (!clearsBar(env, confidence)) {
    reportBelowBar(env, child.node, `${rule.from} is set.`);

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
    : `Removed ${rule.from}: ${rule.to} is already set to the same value.`);
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

  if (holder.node.type !== 'ObjectExpression') {
    if (holder.node.type === 'Identifier') {
      invalidateScope();

      const declared = declaredObject(j, ctx.root, holder);

      if (declared && getProperty(declared, childKey)) {
        ctx.report({
          ruleId: rule.id,
          severity: 'manual',
          line: lineOfNode(attributes[index]),
          message: `${parentKey} comes from a variable that sets ${childKey}. Move ${rule.from} to ${rule.to} by hand.`,
        });
      }
    }

    return;
  }

  const child = getProperty(holder, childKey);

  if (!child) {
    return;
  }

  if (!rewrites(rule)) {
    reportInstead(ctx, rule, lineOfNode(child.node), `Move ${rule.from} to the ${rule.to} attribute.`);

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
    : `Removed ${rule.from}: ${rule.to} is already set to the same value.`);
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

  const bindings = targets.length === 0 ? null : collectHotBindings(ctx.j, ctx.root);

  if (!bindings?.isHotFile) {
    return;
  }

  for (const site of dynamicOptionSites(ctx.j, ctx.root)) {
    if (site.form === 'setCellMetaObject' && bindings.isInstance(site.receiver)) {
      // The object of a call on a confirmed grid instance is a cell option object, which the rules handle.
      continue;
    }

    for (const { rule, site: target } of targets.filter(item => item.site.name === site.name)) {
      ctx.report({
        ruleId: rule.id,
        severity: 'manual',
        line: site.line,
        message: `${site.name} is set by ${site.form === 'assignment' ? 'an assignment' : `${site.form}()`} here, `
          + `so the tool cannot rewrite it. ${target.instruction}`,
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
 *   the `Intl.NumberFormat` defaults (grouping on) for an empty object. A value read through a variable is only
 *   reported. An optional `report` text is added as a
 *   `manual` entry after every move.
 * - `optionRemove` (`name`, `todo`, `advice`): every property or attribute of that name goes. Unless `todo` is
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
    const targets = collectTargets(j, ctx.root);

    for (const rule of active) {
      const env = { ctx, j, rule, aggressive, keys: null };

      if (rule.kind === 'optionRename' && rule.context) {
        renameInCallArguments(env);

        continue;
      }

      for (const target of targets) {
        if (target.type === 'object') {
          const handler = { optionRename: renameInObject, optionMove: moveInObject, optionRemove: removeInObject };

          env.keys = target.keys ?? null;
          handler[rule.kind](env, target.path, target.confidence);
          env.keys = null;
        } else {
          const handler = { optionRename: renameOnElement, optionMove: moveOnElement, optionRemove: removeOnElement };

          handler[rule.kind](env, target.path);
        }
      }
    }
  },
};

export default options;
