import { memberName, stringValue, unwrapNode, unwrapPath } from '../lib/ast.mjs';
import { collectHotBindings } from '../lib/hot-bindings.mjs';
import {
  findJsxOptionAttributes,
  findOptionObjects,
  getProperties,
  getProperty,
} from '../lib/option-objects.mjs';
import { invalidateScope, lookup } from '../lib/scope.mjs';
import { reportInstead, rewrites } from '../lib/safety.mjs';
import { replaceStringLiteral } from '../lib/string-literal.mjs';
import { TODO_PREFIX } from '../lib/todo.mjs';

const REPORT_BELOW_BAR = 'This object only looks like a Handsontable options object, so it was not changed. '
  + 'Re-run with --aggressive or edit by hand.';
const MEMBER_CALLS = new Set(['MemberExpression', 'OptionalMemberExpression']);
const ANCHOR_NODES = new Set(['ObjectProperty', 'ObjectMethod', 'Property', 'ClassProperty', 'ClassMethod']);

/**
 * Per-rule state passed between the helpers below.
 *
 * @typedef {object} Env
 * @property {import('../types.mjs').Ctx} ctx The part's context.
 * @property {object} j The jscodeshift API.
 * @property {import('../types.mjs').Rule} rule The rule being applied.
 * @property {boolean} aggressive Whether `--aggressive` is on, which lowers every rule's bar to `medium`.
 */

/**
 * One place a rule may act: an options object literal, or the opening element of a wrapper component.
 *
 * @typedef {object} Target
 * @property {'object'|'jsx'} type What the target is.
 * @property {object} path NodePath of the `ObjectExpression` or of the `JSXOpeningElement`.
 * @property {'high'|'medium'} confidence Confidence that it holds Handsontable options. JSX is always `high`.
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
}

/**
 * Line of a node.
 *
 * @param {object} node An AST node.
 * @returns {number|undefined} One-based line.
 */
function lineOf(node) {
  return node?.loc?.start?.line;
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
 * Whether a rule may rewrite an object of the given confidence.
 *
 * @param {Env} env The state.
 * @param {'high'|'medium'} confidence Confidence of the object.
 * @returns {boolean} `true` when the object clears the rule's bar.
 */
function clearsBar(env, confidence) {
  const bar = env.aggressive ? 'medium' : (env.rule.minConfidence ?? 'high');

  return confidence === 'high' || bar === 'medium';
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
    line: lineOf(node),
    message: [what, REPORT_BELOW_BAR, rule.advice].filter(Boolean).join(' '),
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
 * Name of a JSX attribute.
 *
 * @param {object} attribute A `JSXAttribute` or `JSXSpreadAttribute` node.
 * @returns {string|null} The name, or `null` for a spread or a namespaced name.
 */
function attributeName(attribute) {
  return attribute.type === 'JSXAttribute' && attribute.name.type === 'JSXIdentifier' ? attribute.name.name : null;
}

/**
 * Find the places the rules may act. Option objects come from `findOptionObjects`; wrapper elements and the
 * properties of a resolved `{...spread}` attribute come from `findJsxOptionAttributes`.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @param {boolean} aggressive Whether `--aggressive` is on.
 * @returns {Target[]} The targets in discovery order.
 */
function collectTargets(j, root, aggressive) {
  const bindings = collectHotBindings(j, root);
  const objects = new Map();
  const elements = new Map();

  for (const item of findOptionObjects(j, root, bindings, { aggressive })) {
    objects.set(item.path.node, { type: 'object', path: item.path, confidence: item.confidence });
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
 * Rename the key of a property, keeping the quote style of a quoted key and the value. A shorthand property
 * (`{ columnHeaders }`) becomes `colHeaders: columnHeaders`.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} path NodePath of the property.
 * @param {string} from Old key.
 * @param {string} to New key.
 * @returns {void}
 */
function renameKey(j, path, from, to) {
  const { node } = path;

  if (node.shorthand) {
    node.shorthand = false;
    node.value = j.identifier(from);
    node.key = j.identifier(to);
  } else if (node.key.type === 'Identifier') {
    node.key = j.identifier(to);
  } else {
    replaceStringLiteral(j, path.get('key'), text => text.replace(from, to));
  }
}

/**
 * Where a comment about a removed property can sit without changing the code around it: before the nearest
 * enclosing property, statement, declaration, or array element. Never before the object itself, because
 * `return // comment` followed by `{` would end the statement.
 *
 * @param {object} path NodePath to start from.
 * @returns {object} The node that takes the comment.
 */
function enclosingAnchor(path) {
  for (let current = path; current; current = current.parent) {
    const { type } = current.node;

    if (current.parent?.node.type === 'ArrayExpression' || ANCHOR_NODES.has(type)
      || /(?:Statement|Declaration)$/.test(type)) {
      const parentType = current.parent?.node.type;

      return parentType === 'ExportNamedDeclaration' || parentType === 'ExportDefaultDeclaration'
        ? current.parent.node : current.node;
    }
  }

  return path.node;
}

/**
 * Whether a comment is one this tool wrote.
 *
 * @param {object} comment A comment node.
 * @returns {boolean} `true` for a `TODO(handsontable-codemod ...)` comment.
 */
function isCodemodTodo(comment) {
  return comment.value.trim().startsWith(TODO_PREFIX);
}

/**
 * Comments of a removed property that survive it. A comment on the lines right above the property or at the end
 * of its line describes the property and goes with it. A leading comment followed by a blank line is a section
 * header and survives. A TODO comment from this tool always survives, so removing the property it was attached
 * to does not lose the instruction.
 *
 * @param {object} node The removed property.
 * @returns {object[]} The comments to keep, in source order.
 */
function survivingComments(node) {
  return (node.comments ?? []).filter((comment) => {
    if (isCodemodTodo(comment)) {
      return true;
    }

    return comment.leading !== false && comment.trailing !== true && comment.loc && node.loc
      && node.loc.start.line - comment.loc.end.line > 1;
  });
}

/**
 * Put surviving comments of a removed node in front of the node that takes its place.
 *
 * @param {object} removed The removed node.
 * @param {object} anchor The node that takes the comments.
 * @param {boolean} adjacent Whether the anchor is the node that follows the removed one. Section headers only
 * move to a following node.
 * @returns {void}
 */
function carryComments(removed, anchor, adjacent) {
  const carried = survivingComments(removed).filter(comment => adjacent || isCodemodTodo(comment));

  if (carried.length > 0) {
    anchor.comments = [...carried, ...(anchor.comments ?? [])];
  }
}

/**
 * Delete a property from an object literal and, when asked, leave a TODO comment where it stood: before the next
 * property, else before the previous one, else before the enclosing property, statement, or array element.
 *
 * @param {Env} env The state.
 * @param {object} objectPath NodePath of the `ObjectExpression`.
 * @param {object} node The property node to delete.
 * @param {string|null} todoText Text of the TODO report entry, or `null` for no TODO.
 * @param {string} [comment] Short text of the TODO comment, when it differs from `todoText`.
 * @returns {void}
 */
function removeProperty(env, objectPath, node, todoText, comment) {
  const list = objectPath.node.properties;
  const index = list.indexOf(node);
  const next = list[index + 1];
  const previous = list[index - 1];
  const anchor = next ?? previous ?? enclosingAnchor(objectPath);

  list.splice(index, 1);
  carryComments(node, anchor, anchor === next);
  env.ctx.markChanged();

  if (todoText) {
    env.ctx.todo(anchor, env.rule.id, todoText, comment);
  }
}

/**
 * The advice of a removal rule, as the text of its report entry.
 *
 * @param {import('../types.mjs').Rule} rule An `optionRemove` rule.
 * @returns {string} The advice, or a generic sentence.
 */
function removalAdvice(rule) {
  return rule.advice ?? rule.message ?? `${rule.name} was removed.`;
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
 * Whether a property of an object literal sits on lines of its own, so a comment before it does not land in the
 * middle of a line.
 *
 * @param {object} objectPath NodePath of the `ObjectExpression`.
 * @param {object} node The property node.
 * @returns {boolean} `true` when no other property or brace shares a line with it.
 */
function hasOwnLines(objectPath, node) {
  const list = objectPath.node.properties;
  const index = list.indexOf(node);
  const before = list[index - 1]?.loc?.end.line ?? objectPath.node.loc?.start.line;
  const after = list[index + 1]?.loc?.start.line ?? objectPath.node.loc?.end.line;

  return Boolean(node.loc) && before < node.loc.start.line && after > node.loc.end.line;
}

/**
 * Handle a removal that the rule does not apply: the property stays. With `todo` on, a TODO comment goes before
 * the property. Otherwise the occurrence is reported.
 *
 * @param {Env} env The state.
 * @param {object} target The node that takes the TODO: the property, or the statement that holds a wrapper element.
 * @param {number|undefined} line Line of the property.
 * @param {string} what What the rule would remove, for the report, for example `the correctFormat property`.
 * @returns {void}
 */
function adviseRemoval(env, target, line, what) {
  const { ctx, rule } = env;

  if (rule.todo === false) {
    reportInstead(ctx, rule, line, `Remove ${what}. ${removalAdvice(rule)}`.trim());

    return;
  }

  ctx.todo(target, rule.id, removalAdvice(rule));
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

  const line = lineOf(property.node);

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
    reportInstead(ctx, rule, lineOf(attribute), `Rename the ${rule.from} attribute to ${rule.to}.`);

    return;
  }

  if (attributes.some(item => attributeName(item) === rule.to)) {
    ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      line: lineOf(attribute),
      message: `Both ${rule.from} and ${rule.to} are set on this element. Remove ${rule.from} by hand.`,
    });

    return;
  }

  attribute.name = j.jsxIdentifier(rule.to);
  ctx.markChanged();
  ctx.report({
    ruleId: rule.id,
    severity: 'changed',
    line: lineOf(attribute),
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
  const seen = new Set();
  const calls = [...env.ctx.root.find(j.CallExpression).paths(), ...env.ctx.root.find(j.OptionalCallExpression).paths()]
    .filter(call => !seen.has(call.node) && seen.add(call.node));

  for (const call of calls) {
    const callee = unwrapNode(call.node.callee);

    if (!MEMBER_CALLS.has(callee.type) || !names.includes(memberName(callee))) {
      continue;
    }

    call.node.arguments.forEach((argument, index) => {
      const objectPath = unwrapPath(call.get('arguments', index));

      if (objectPath.node.type !== 'ObjectExpression') {
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
      adviseRemoval(env, hasOwnLines(objectPath, node) ? node : enclosingAnchor(objectPath), lineOf(node),
        `the ${rule.name} property`);

      continue;
    }

    if (!clearsBar(env, confidence)) {
      reportBelowBar(env, node, `${rule.name} is set.`);

      continue;
    }

    const line = lineOf(node);
    const text = removalAdvice(rule);

    removeProperty(env, objectPath, node, rule.todo === false ? null : text, deletedComment(rule.name, text));
    ctx.report({ ruleId: rule.id, severity: 'changed', line, message: `Removed ${rule.name}.` });
  }
}

/**
 * Handle `optionRemove` for one wrapper component element: delete the attribute and leave the TODO before the
 * statement that holds the element.
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
    // The attribute stays, so a TODO anchored on the statement is left once for the whole element.
    adviseRemoval(env, enclosingAnchor(openingPath), lineOf(found[0]), `the ${rule.name} attribute`);

    return;
  }

  for (const attribute of found) {
    const line = lineOf(attribute);
    const text = removalAdvice(rule);

    attributes.splice(attributes.indexOf(attribute), 1);
    carryComments(attribute, enclosingAnchor(openingPath), false);
    ctx.markChanged();

    if (rule.todo !== false) {
      ctx.todo(enclosingAnchor(openingPath), rule.id, text, deletedComment(rule.name, text));
    }

    ctx.report({ ruleId: rule.id, severity: 'changed', line, message: `Removed the ${rule.name} attribute.` });
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
 * @returns {'move'|'dedupe'|null} What to do: move the key, drop it because the destination has the same value,
 * or nothing.
 */
function planMove(env, child, existing) {
  const { ctx, j, rule } = env;
  const line = lineOf(child);

  if (child.type !== 'ObjectProperty') {
    ctx.report({ ruleId: rule.id, severity: 'manual', line, message: `Move ${rule.from} to ${rule.to} by hand.` });

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
  const line = lineOf(child);

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
        line: lineOf(parent.node),
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
    reportInstead(ctx, rule, lineOf(child.node), `Move ${rule.from} to ${rule.to}.`);

    return;
  }

  if (!clearsBar(env, confidence)) {
    reportBelowBar(env, child.node, `${rule.from} is set.`);

    return;
  }

  const existingProperty = getProperty(objectPath, rule.to);
  const plan = planMove(env, child.node, existingProperty ? existingProperty.node.value : null);

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
          line: lineOf(attributes[index]),
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
    reportInstead(ctx, rule, lineOf(child.node), `Move ${rule.from} to the ${rule.to} attribute.`);

    return;
  }

  const existingAttribute = attributes.find(item => attributeName(item) === rule.to);
  const existing = existingAttribute ? (attributeValue(existingAttribute) ?? j.identifier('true')) : null;
  const plan = planMove(env, child.node, existing);

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
 * Renames, moves, and removes options (`optionRename`, `optionMove`, `optionRemove`).
 *
 * Where it acts: object literals that `findOptionObjects` recognizes as Handsontable options (grid, column, and
 * cell level, reached through `new Handsontable()`, `updateSettings()`, `settings={...}`, type annotations, and
 * `columns`, `cell`, `cells`), and the attributes of `<HotTable>` and `<HotColumn>`. A rule rewrites an object
 * when its confidence reaches the rule's `minConfidence` (default `high`); `--aggressive` lowers every bar to
 * `medium`. An object below the bar is reported as `manual` and left alone. A key set twice, or a missing key,
 * is never guessed: the first case is reported, the second is skipped.
 *
 * - `optionRename` (`from`, `to`): the key changes, the value and the key's quoting stay, a shorthand property
 *   becomes `to: from`. When `to` is already set the object is reported. With `context: { callArg: [names] }`
 *   the rule acts on object-literal arguments of method calls with those names (and on the objects of a `sheets`
 *   array inside them) instead, whatever the option-object finder says.
 * - `optionMove` (`from` = `<option>.<key>`, `to` = sibling option name): the nested key moves, value verbatim,
 *   to a property before `<option>`. An existing `to` with the same value only drops the nested key, a different
 *   one is reported. A literal value that is not a BCP 47 tag is reported and not moved. An emptied `<option>`
 *   object stays. A value read through a variable is only reported. An optional `report` text is added as a
 *   `manual` entry after every move.
 * - `optionRemove` (`name`, `todo`, `advice`): every property or attribute of that name goes. Unless `todo` is
 *   `false`, a TODO comment with the advice is left before the next property (else the previous one, else the
 *   enclosing property, statement, or array element). A run that finds no such property adds nothing, so the
 *   comment is never written twice. Comments on the removed property go with it, except a section header
 *   (followed by a blank line) and a TODO of this tool, which move to the anchor.
 *
 * A rule whose `safe` is not `true` never edits code. It reports `manual` entries instead, and leaves a TODO comment
 * when the rule asks for one (see `lib/safety.mjs`).
 *
 * @type {import('../types.mjs').Transform}
 */
const options = {
  kinds: ['optionRename', 'optionMove', 'optionRemove'],
  fileKinds: ['js'],

  /**
   * @param {import('../types.mjs').Ctx} ctx Context of a `js` part.
   * @param {import('../types.mjs').Rule[]} rules Option rules of one version in manifest order.
   * @returns {void}
   */
  apply(ctx, rules) {
    const active = rules.filter(rule => mentions(ctx.source, rule));

    if (active.length === 0) {
      return;
    }

    active.forEach(assertRule);
    invalidateScope();

    const { j } = ctx;
    const aggressive = Boolean(ctx.options?.aggressive);
    const targets = collectTargets(j, ctx.root, aggressive);

    for (const rule of active) {
      const env = { ctx, j, rule, aggressive };

      if (rule.kind === 'optionRename' && rule.context) {
        renameInCallArguments(env);

        continue;
      }

      for (const target of targets) {
        if (target.type === 'object') {
          const handler = { optionRename: renameInObject, optionMove: moveInObject, optionRemove: removeInObject };

          handler[rule.kind](env, target.path, target.confidence);
        } else {
          const handler = { optionRename: renameOnElement, optionMove: moveOnElement, optionRemove: removeOnElement };

          handler[rule.kind](env, target.path);
        }
      }
    }
  },
};

export default options;
