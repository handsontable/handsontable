import { calleeName, edgeKey, memberName, propertyName, unwrapNode } from '../lib/ast.mjs';
import { reportInstead, rewrites } from '../lib/safety.mjs';
import { removalAdvice } from '../lib/rename-key.mjs';
import { templateRaw } from '../lib/literals.mjs';
import { replaceStringLiteral } from '../lib/string-literal.mjs';
import { assertRenameOrRemoval, problemsOf } from '../lib/validate.mjs';

/**
 * Escape a string for use inside a regular expression.
 *
 * @param {string} text Literal text.
 * @returns {string} Text safe to embed in a pattern.
 */
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build a pattern that matches a CSS custom property name as a whole token, so `--a` does not match inside
 * `--a-b` or `--xa`.
 *
 * @param {string} name Custom property name, for example `--ht-wrapper-border-radius`.
 * @param {string} [flags] Regular expression flags. Use `g` to replace or collect every match.
 * @returns {RegExp} The pattern.
 */
function tokenPattern(name, flags = '') {
  return new RegExp(`(?<![\\w-])${escapeRegExp(name)}(?![\\w-])`, flags);
}

/**
 * A rule with the patterns it needs, built once per `apply` call.
 *
 * @typedef {object} Entry
 * @property {import('../types.mjs').Rule} rule The manifest rule.
 * @property {boolean} removed Whether the variable is removed instead of renamed.
 * @property {boolean} edits Whether the rule may edit code. A rename of a rule that is not safe is only reported.
 * @property {RegExp} test Pattern without the `g` flag, safe for repeated `test`.
 * @property {RegExp} all Global pattern, for replacing and for collecting matches.
 */

/**
 * Turn the rules whose variable name appears in the source into entries. Rules with no match cost nothing
 * afterwards, so an untouched part is skipped after one string scan per rule.
 *
 * @param {import('../types.mjs').Rule[]} rules `cssVariable` rules.
 * @param {string} source Text of the part.
 * @returns {Entry[]} Entries for the rules that can match.
 * @throws {Error} When a rule has neither `to` nor `removed: true`.
 */
function buildEntries(rules, source) {
  return rules
    .filter((rule) => {
      assertRenameOrRemoval(rule);

      return source.includes(rule.from);
    })
    .map(rule => ({
      rule,
      removed: rule.removed === true,
      edits: rewrites(rule),
      test: tokenPattern(rule.from),
      all: tokenPattern(rule.from, 'g'),
    }));
}

/**
 * Leave a TODO before a CSS node that uses a removed variable, once, and report it.
 *
 * @param {import('../types.mjs').Ctx} ctx Context of a `css` part.
 * @param {object} node The declaration or at-rule.
 * @param {import('../types.mjs').Rule} rule A removal rule.
 * @returns {void}
 */
function leaveTodo(ctx, node, rule) {
  // A comment that an earlier run left is found by `addCssTodo()`, which looks through the run of comments before the node.
  ctx.todo(node, rule.id, cssRemovalAdvice(ctx, node, rule));
}

/**
 * A value that switches a declaration off: `0`, `0px`, or `none`.
 */
const ZERO_VALUE = /^(?:0(?:px)?|none)$/i;

/**
 * The stylesheet of an Angular component: its rules are scoped to the component by default.
 */
const ANGULAR_COMPONENT_STYLE = /\.component\.(?:css|scss|sass|less)$/i;

/**
 * The advice for a removed variable found in a stylesheet. A declaration that sets the variable to zero or `none`
 * gets the rule's `zeroAdvice` when it has one, because the user wanted no border and has nothing to draw. A rule
 * with a `scopedAdvice` adds it when the declaration sits in a stylesheet scoped to a component (a Vue `<style
 * scoped>` or `<style module>` block, or an Angular `*.component.css`), where the rule cannot reach an element that
 * Handsontable creates at runtime.
 *
 * @param {import('../types.mjs').Ctx} ctx Context of a `css` part.
 * @param {object} node The declaration or at-rule.
 * @param {import('../types.mjs').Rule} rule A removal rule.
 * @returns {string} The advice.
 */
function cssRemovalAdvice(ctx, node, rule) {
  const zero = typeof rule.zeroAdvice === 'string' && node.type === 'decl' && node.prop === rule.from
    && ZERO_VALUE.test(node.value.trim());
  const scoped = typeof rule.scopedAdvice === 'string'
    && (ctx.cssScope !== null || ANGULAR_COMPONENT_STYLE.test(ctx.filePath));

  return [zero ? rule.zeroAdvice : removalAdvice(rule, rule.from), scoped ? rule.scopedAdvice : null]
    .filter(Boolean).join(' ');
}

/**
 * Report a rename that the rule does not apply because it is not safe.
 *
 * @param {import('../types.mjs').Ctx} ctx Context of a `css` or `js` part.
 * @param {import('../types.mjs').Rule} rule A rename rule.
 * @param {number|undefined} line One-based line.
 * @param {number} [markLine] The line the TODO marker is placed from, when `line` is inside a literal.
 * @returns {void}
 */
function reportRename(ctx, rule, line, markLine) {
  reportInstead(ctx, rule, line, `Rename ${rule.from} to ${rule.to} here.`, null, undefined, markLine);
}

/**
 * How many declarations of a container an earlier rename of the run gave each name, per container.
 *
 * @type {WeakMap<object, Map<string, number>>}
 */
const renamedInto = new WeakMap();

/**
 * Tell whether a rule or at-rule block declared a custom property directly when the run began. A name that an earlier
 * rename of this run gave to a declaration does not count: `--ht-a: 1px; margin: var(--ht-a);` renames both, and the
 * second must not take the first for a clash.
 *
 * @param {object} container A postcss container.
 * @param {string} name Custom property name.
 * @returns {boolean} `true` when a declaration of that name was a direct child at the start.
 */
function declaredAtStart(container, name) {
  return (propertyCounts(container).get(name) ?? 0) - (renamedInto.get(container)?.get(name) ?? 0) > 0;
}

/**
 * How many declarations of each custom property name a container holds directly, per container. A rule with thousands of
 * declarations asks once per declaration, so the answer is counted once and kept in step with the renames of
 * `renamed()`.
 *
 * @type {WeakMap<object, Map<string, number>>}
 */
const propertyCountsByContainer = new WeakMap();

/**
 * The counts of declared property names of a container.
 *
 * @param {object} container A postcss container.
 * @returns {Map<string, number>} Property name to the number of direct declarations of it.
 */
function propertyCounts(container) {
  if (!propertyCountsByContainer.has(container)) {
    const counts = new Map();

    for (const node of container.nodes ?? []) {
      if (node.type === 'decl') {
        counts.set(node.prop, (counts.get(node.prop) ?? 0) + 1);
      }
    }

    propertyCountsByContainer.set(container, counts);
  }

  return propertyCountsByContainer.get(container);
}

/**
 * Tell `declaredAtStart()` that a declaration of a container got another property name.
 *
 * @param {object} container A postcss container.
 * @param {string} from The name it had.
 * @param {string} to The name it has.
 * @returns {void}
 */
function renamed(container, from, to) {
  if (from === to) {
    return;
  }

  const counts = propertyCounts(container);

  const into = renamedInto.get(container) ?? new Map();

  counts.set(from, (counts.get(from) ?? 1) - 1);
  counts.set(to, (counts.get(to) ?? 0) + 1);
  into.set(to, (into.get(to) ?? 0) + 1);
  renamedInto.set(container, into);
}

/**
 * The parts of a declaration value where a name is not a reference to a custom property: the inside of a quoted string
 * and the inside of `url(...)`, quoted or not. `url(--ht-x.png)` is a file name and `content: "--ht-x"` is text.
 *
 * @param {string} text A declaration value.
 * @returns {Array<[number, number]>} Start (inclusive) and end (exclusive) of each such part.
 */
function textRanges(text) {
  const ranges = [];

  for (let at = 0; at < text.length; at += 1) {
    const char = text[at];

    if (char === '"' || char === '\'') {
      let end = at + 1;

      while (end < text.length && text[end] !== char) {
        end += text[end] === '\\' ? 2 : 1;
      }

      ranges.push([at, Math.min(end + 1, text.length)]);
      at = end;
    } else if (/^url\(/i.test(text.slice(at, at + 4)) && !/[\w-]/.test(text[at - 1] ?? '')) {
      const end = text.indexOf(')', at);

      ranges.push([at, end === -1 ? text.length : end + 1]);
      at = end === -1 ? text.length : end;
    }
  }

  return ranges;
}

/**
 * Whether an occurrence of a name in a declaration value is a custom property reference: it is the first argument of a
 * `var()` call outside every string and `url()`.
 *
 * @param {string} value The declaration value.
 * @param {number} offset Where the name starts.
 * @returns {boolean} `true` for a `var(--name ...)` reference.
 */
function isReference(value, offset) {
  return followsVarOpen(value, offset) && !insideText(rangesOf(value), offset);
}

/**
 * The text ranges of the value asked about last. A value with thousands of names is asked about once per name, and the
 * ranges do not change in between.
 */
let lastRanges = { text: null, ranges: [] };

/**
 * `textRanges()` with the last answer kept.
 *
 * @param {string} text A declaration value.
 * @returns {Array<[number, number]>} The ranges, sorted and apart.
 */
function rangesOf(text) {
  if (lastRanges.text !== text) {
    lastRanges = { text, ranges: textRanges(text) };
  }

  return lastRanges.ranges;
}

/**
 * Tell whether an offset sits inside one of the ranges. The ranges are sorted and do not overlap, so a binary search
 * answers.
 *
 * @param {Array<[number, number]>} ranges The ranges from `textRanges()`.
 * @param {number} offset The offset.
 * @returns {boolean} `true` when a range holds the offset.
 */
function insideText(ranges, offset) {
  let low = 0;
  let high = ranges.length - 1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const [start, end] = ranges[middle];

    if (offset < start) {
      high = middle - 1;
    } else if (offset >= end) {
      low = middle + 1;
    } else {
      return true;
    }
  }

  return false;
}

/**
 * Tell whether the text right before an offset is `var(` and white space, with a word boundary in front of `var`. It
 * reads backward from the offset: a regular expression with `$` on a slice would read the whole value from its start
 * for every name, which is quadratic in a value that holds many.
 *
 * @param {string} value The declaration value.
 * @param {number} offset Where the name starts.
 * @returns {boolean} `true` when a `var(` opens the offset.
 */
function followsVarOpen(value, offset) {
  let at = offset;

  while (at > 0 && /\s/.test(value[at - 1])) {
    at -= 1;
  }

  return at >= 4 && value.slice(at - 4, at).toLowerCase() === 'var(' && !/\w/.test(value[at - 5] ?? '');
}

/**
 * Say that a name stays in a string or a `url()` of a value the tool did edit or would edit. The note is the same
 * whether the value held a reference too or not, so a second run, which sees only the text, finds its TODO already
 * there and changes nothing.
 *
 * @param {import('../types.mjs').Ctx} ctx Context of a `css` part.
 * @param {import('../types.mjs').Rule} rule The rename rule.
 * @param {number|undefined} line One-based line.
 * @returns {void}
 */
function reportTextOnly(ctx, rule, line) {
  ctx.report({
    ruleId: rule.id,
    severity: 'manual',
    line,
    message: `Check this text by hand: it names ${rule.from} in a string, a url(), or outside var(), so the tool `
      + 'did not change it.',
  });
}

/**
 * Rename or flag the variable in one declaration.
 *
 * @param {import('../types.mjs').Ctx} ctx Context of a `css` part.
 * @param {object} declaration A postcss declaration.
 * @param {Entry} entry The rule entry.
 * @returns {void}
 */
function applyToDeclaration(ctx, declaration, entry) {
  const { rule, removed, test, all } = entry;
  const line = declaration.source?.start?.line;
  const inProp = test.test(declaration.prop);
  const hits = [...declaration.value.matchAll(all)].map(match => match.index);
  const references = hits.filter(at => isReference(declaration.value, at));

  if (!inProp && hits.length === 0) {
    return;
  }

  // A name in a string, in `url()`, or outside `var()` is no reference to the variable, and is left alone.
  if (!inProp && references.length === 0) {
    reportTextOnly(ctx, rule, line);

    return;
  }

  if (removed) {
    leaveTodo(ctx, declaration, rule);

    return;
  }

  if (!entry.edits) {
    reportRename(ctx, rule, line);

    return;
  }

  // A rule that defines the new name already would end with one name for two things: the old name's value replaces
  // or shadows the new one (`--new: var(--old)` becomes a reference to itself, and `var(--old)` next to `--new: 1px`
  // reads the new value). Only a definition that stood there at the start counts, not one this run made.
  if (declaredAtStart(declaration.parent, rule.to)) {
    ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      line,
      message: declaredAtStart(declaration.parent, rule.from)
        ? `Merge ${rule.from} and ${rule.to} by hand: both are defined in this rule, so the codemod left it alone.`
        : `Rename ${rule.from} by hand: this rule already defines ${rule.to}, and renaming would make the two `
          + 'names one, so the codemod left it alone.',
    });

    return;
  }

  const prop = declaration.prop;
  const edited = ctx.css.replaceInDeclaration(declaration, all,
    (match, offset, text) => (text === prop || isReference(text, offset) ? rule.to : match));

  if (edited === null) {
    return;
  }

  if (edited === false) {
    reportRename(ctx, rule, line);

    return;
  }

  renamed(declaration.parent, prop, declaration.prop);
  ctx.markChanged();
  ctx.report({ ruleId: rule.id, severity: 'changed', line, message: `Renamed ${rule.from} to ${rule.to}.` });

  // The name that is left in a string of the same value is no reference. Say so now, so the second run, which sees only
  // that text, has nothing new to add.
  if (hits.length > references.length) {
    reportTextOnly(ctx, rule, line);
  }
}

/**
 * Rename or flag the variable in the parameters of one at-rule.
 *
 * @param {import('../types.mjs').Ctx} ctx Context of a `css` part.
 * @param {object} atRule A postcss at-rule.
 * @param {Entry} entry The rule entry.
 * @returns {void}
 */
function applyToAtRule(ctx, atRule, entry) {
  const { rule, removed, test, all } = entry;
  const line = atRule.source?.start?.line;

  if (!test.test(atRule.params)) {
    return;
  }

  // As in a declaration value, a name in a string or in `url()` is text, and the tool leaves it alone.
  const ranges = textRanges(atRule.params);

  const matches = [...atRule.params.matchAll(all)];

  if (matches.every(match => insideText(ranges, match.index))) {
    reportTextOnly(ctx, rule, line);

    return;
  }

  if (removed) {
    leaveTodo(ctx, atRule, rule);

    return;
  }

  if (!entry.edits) {
    reportRename(ctx, rule, line);

    return;
  }

  const edited = ctx.css.replaceInAtRule(atRule, all,
    (match, offset, text) => (insideText(rangesOf(text), offset) ? match : rule.to));

  if (edited === false) {
    reportRename(ctx, rule, line);

    return;
  }

  ctx.markChanged();
  ctx.report({ ruleId: rule.id, severity: 'changed', line, message: `Renamed ${rule.from} to ${rule.to}.` });

  if (matches.some(match => insideText(ranges, match.index))) {
    reportTextOnly(ctx, rule, line);
  }
}

const STYLE_NAME = /style/i;
const STYLE_TYPE = /(?:CSSProperties|CSSStyleDeclaration|StyleDeclaration|CSSStyleSheet)$/;
const TS_WRAPPERS = new Set(['TSAsExpression', 'TSSatisfiesExpression', 'ParenthesizedExpression']);
const MEMBER_TYPES = new Set(['MemberExpression', 'OptionalMemberExpression']);

/**
 * Whether an expression is a style object by its form: `el.style`, a name that has "style" in it, or
 * `getComputedStyle(el)`.
 *
 * @param {object|null|undefined} node An expression node.
 * @returns {boolean} `true` for something the code uses as a style.
 */
function isStyleLike(node) {
  const target = node ? unwrapNode(node) : null;

  if (!target) {
    return false;
  }

  if (target.type === 'Identifier') {
    return STYLE_NAME.test(target.name);
  }

  if (MEMBER_TYPES.has(target.type)) {
    return STYLE_NAME.test(memberName(target) ?? '');
  }

  return target.type === 'CallExpression' && calleeName(target.callee) === 'getComputedStyle';
}

/**
 * Whether a type annotation names a CSS style type (`React.CSSProperties`, `CSSStyleDeclaration`).
 *
 * @param {object|null|undefined} annotation A type annotation node or the type inside it.
 * @returns {boolean} `true` for a style type.
 */
function isStyleType(annotation) {
  const type = annotation?.type === 'TSTypeAnnotation' ? annotation.typeAnnotation : annotation;
  const name = type?.type === 'TSTypeReference' ? type.typeName : null;
  const last = name?.type === 'TSQualifiedName' ? name.right.name : name?.name;

  return typeof last === 'string' && STYLE_TYPE.test(last);
}

/**
 * Whether an object literal holds styles: the value of a `style` prop or key, an object a style-named variable
 * holds, an `as` or `satisfies` of a style type, or the argument of `Object.assign(<style>, ...)` or `.css({ ... })`.
 *
 * @param {object} objectPath NodePath of the `ObjectExpression`.
 * @returns {boolean} `true` when the object is a style.
 */
function isStyleObject(objectPath) {
  let current = objectPath;

  while (current.parent && TS_WRAPPERS.has(current.parent.node.type)) {
    if (isStyleType(current.parent.node.typeAnnotation)) {
      return true;
    }

    current = current.parent;
  }

  const parent = current.parent?.node;

  switch (parent?.type) {
    case 'JSXExpressionContainer': {
      const attribute = current.parent.parent?.node;

      return attribute?.type === 'JSXAttribute' && STYLE_NAME.test(attribute.name.name ?? '');
    }
    case 'ObjectProperty':
    case 'Property':
      return parent.value === current.node && STYLE_NAME.test(propertyName(parent) ?? '');
    case 'VariableDeclarator':
      return parent.init === current.node && parent.id.type === 'Identifier'
        && (STYLE_NAME.test(parent.id.name) || isStyleType(parent.id.typeAnnotation));
    case 'AssignmentExpression':
      return parent.right === current.node && isStyleLike(parent.left);
    case 'CallExpression':
    case 'OptionalCallExpression':
      return parent.arguments.includes(current.node) && (calleeName(parent.callee) === 'css'
        || (calleeName(parent.callee) === 'assign' && parent.arguments[0] !== current.node
          && isStyleLike(parent.arguments[0])));
    default:
      return false;
  }
}

/**
 * Whether a string literal is a key that the project's own code reads by name: the key of an object literal that is
 * not a style, or the computed member key of an object that is not a style (`cssVars['--ht-x']`). A variable name
 * written as the key of a style (`style: { '--ht-x': 1 }`, `el.style['--ht-x']`) is not.
 *
 * @param {object} path NodePath of a string `Literal`.
 * @returns {boolean} `true` for the key of an object that is not a style.
 */
function isOwnKey(path) {
  const parent = path.parent?.node;

  if ((parent?.type === 'ObjectProperty' || parent?.type === 'Property') && edgeKey(path) === 'key') {
    return path.parent.parent?.node.type === 'ObjectExpression' && !isStyleObject(path.parent.parent);
  }

  if (MEMBER_TYPES.has(parent?.type) && parent.computed && parent.property === path.node) {
    return !isStyleLike(parent.object);
  }

  return false;
}

/**
 * Apply the entries to a `css` part: definitions, `var()` uses, and at-rule parameters.
 *
 * @param {import('../types.mjs').Ctx} ctx Context of a `css` part.
 * @param {Entry[]} entries Rule entries.
 * @returns {void}
 */
function applyToCss(ctx, entries) {
  for (const entry of entries) {
    ctx.root.walk((node) => {
      if (node.type === 'decl') {
        applyToDeclaration(ctx, node, entry);
      } else if (node.type === 'atrule') {
        applyToAtRule(ctx, node, entry);
      }
    });
  }
}

/**
 * Apply the entries to a `js` part: string literals and template literal text. Identifiers are never
 * touched. A removed variable is only reported, because a string cannot hold a comment.
 *
 * @param {import('../types.mjs').Ctx} ctx Context of a `js` part.
 * @param {Entry[]} entries Rule entries.
 * @returns {void}
 */
function applyToJs(ctx, entries) {
  const { j, root } = ctx;
  const rename = entries.filter(entry => !entry.removed && entry.edits);

  for (const { rule, test, removed, all } of entries.filter(entry => entry.removed || !entry.edits)) {
    const report = (line, markLine) => {
      if (removed) {
        ctx.report({ ruleId: rule.id, severity: 'manual', line, markLine, message: removalAdvice(rule, rule.from) });
      } else {
        reportRename(ctx, rule, line, markLine);
      }
    };

    root.find(j.Literal).forEach((path) => {
      if (typeof path.node.value === 'string' && test.test(path.node.value)) {
        report(path.node.loc?.start?.line);
      }
    });
    root.find(j.TemplateElement).forEach((path) => {
      matchLines(path.node, all).forEach(line => report(line, path.node.loc?.start?.line));
    });
  }

  if (rename.length === 0) {
    return;
  }

  const edit = text => rename.reduce((current, { rule, all }) => current.replace(all, rule.to), text);
  const hits = text => rename.filter(({ test }) => test.test(text));
  const note = (hit, line) => {
    ctx.markChanged();
    ctx.report({
      ruleId: hit.rule.id,
      severity: 'changed',
      line,
      message: `Renamed ${hit.rule.from} to ${hit.rule.to}.`,
    });
  };

  root.find(j.Literal).forEach((path) => {
    const { node } = path;

    if (typeof node.value !== 'string' || hits(node.value).length === 0) {
      return;
    }

    const line = node.loc?.start?.line;
    const matched = hits(node.value);

    if (isOwnKey(path)) {
      // A map of the project is read by name somewhere else, in code the tool does not see.
      matched.forEach(hit => ctx.report({
        ruleId: hit.rule.id,
        severity: 'manual',
        line,
        message: `Rename ${hit.rule.from} to ${hit.rule.to} here by hand if this key names the CSS variable. It is the `
          + 'key of an object that is not a style, which other code may read by the old name, so it was left alone.',
      }));

      return;
    }

    replaceStringLiteral(j, path, edit);
    matched.forEach(hit => note(hit, line));
  });

  root.find(j.TemplateElement).forEach((path) => {
    const { value } = path.node;
    const matched = hits(value.raw);

    if (matched.length === 0) {
      return;
    }

    const lines = matched.map(hit => matchLines(path.node, hit.all));

    value.raw = edit(templateRaw(path.node));

    if (typeof value.cooked === 'string') {
      value.cooked = edit(value.cooked);
    }

    matched.forEach((hit, index) => lines[index].forEach(line => note(hit, line)));
  });
}

/**
 * The lines of a template literal text where a pattern matches, one per match. The text of a template literal spans
 * lines, so a match is on the line of the quasi start plus the line breaks before it, not on the line where the
 * literal opens.
 *
 * @param {object} quasi A `TemplateElement` node.
 * @param {RegExp} all Global pattern.
 * @returns {Array<number|undefined>} One-based lines, `undefined` when the node has no position.
 */
function matchLines(quasi, all) {
  const start = quasi.loc?.start?.line;
  const raw = quasi.value.raw;
  const lines = [...raw.matchAll(all)].map(match => (start === undefined ? undefined
    : start + (raw.slice(0, match.index).match(/\n/g) ?? []).length));

  return [...new Set(lines)];
}

/**
 * Report every place a template mentions a variable. Templates are not rewritten, so each mention is left to
 * the user.
 *
 * @param {import('../types.mjs').Ctx} ctx Context of a `template` part.
 * @param {Entry[]} entries Rule entries.
 * @returns {void}
 */
function reportInTemplate(ctx, entries) {
  for (const { rule, removed, all } of entries) {
    for (const match of ctx.source.matchAll(all)) {
      const line = ctx.source.slice(0, match.index).split('\n').length;
      const message = removed
        ? removalAdvice(rule, rule.from)
        : `Rename ${rule.from} to ${rule.to} here. The codemod does not rewrite templates.`;

      ctx.report({ ruleId: rule.id, severity: 'manual', line, message });
    }
  }
}

/**
 * The Sass interpolation that builds a Handsontable variable name at compile time: `--ht-#{$name}`.
 */
const INTERPOLATED_PREFIX = '--ht-#{';

/**
 * Replace the comments of a stylesheet snippet with spaces of the same length, so offsets and line breaks stay. A
 * `//` inside a string or a `url()` is not a comment.
 *
 * @param {string} text The snippet.
 * @returns {string} The snippet without comment text.
 */
function blankComments(text) {
  let output = '';
  let quote = null;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    const next = text[index + 1];

    if (quote && char === '\\') {
      // An escape takes the next character with it, so `\\"` ends the string and `\"` does not.
      output += char + (next ?? '');
      index += 1;
    } else if (quote) {
      output += char;
      quote = char === quote ? null : quote;
    } else if (char === '\'' || char === '"') {
      output += char;
      quote = char;
    } else if (char === '/' && next === '*') {
      const end = text.indexOf('*/', index + 2);
      const stop = end === -1 ? text.length : end + 2;

      output += text.slice(index, stop).replace(/[^\n]/g, ' ');
      index = stop - 1;
    } else if (char === '/' && next === '/' && text[index - 1] !== ':') {
      const end = text.indexOf('\n', index);
      const stop = end === -1 ? text.length : end;

      output += ' '.repeat(stop - index);
      index = stop - 1;
    } else {
      output += char;
    }
  }

  return output;
}

/**
 * Report the Sass map keys and strings that name a variable the rules rename or remove, in a stylesheet that builds
 * its variable names with `--ht-#{...}`. The name never appears whole in the file, so the rules cannot find the
 * variable, and the key is the only place the name is written: `'wrapper-border-radius': 6px` or an unquoted
 * `wrapper-border-width: 1px` in a map. Nothing is edited.
 *
 * @param {import('../types.mjs').Ctx} ctx Context of a `css` part.
 * @param {import('../types.mjs').Rule[]} rules `cssVariable` rules.
 * @returns {void}
 */
function reportInterpolatedNames(ctx, rules) {
  const named = rules.filter(rule => rule.from.startsWith('--ht-')).map((rule) => {
    const name = rule.from.slice('--ht-'.length);
    const escaped = escapeRegExp(name);

    return {
      rule,
      name,
      pattern: new RegExp(`(['"])${escaped}\\1|(?<![\\w$#{.@-])${escaped}(?=\\s*:)`, 'g'),
    };
  });

  ctx.root.walk((node) => {
    const start = node.source?.start;
    const end = node.source?.end;

    const isLeaf = node.type === 'decl' || (node.type === 'atrule' && !node.nodes);

    if (!isLeaf || !start || !end || start.offset === undefined) {
      return;
    }

    const text = blankComments(ctx.source.slice(start.offset, end.offset + 1));

    for (const { rule, name, pattern } of named) {
      for (const match of text.matchAll(pattern)) {
        if (match.index === 0) {
          continue;
        }

        const line = start.line + (text.slice(0, match.index).match(/\n/g) ?? []).length;
        const built = 'This stylesheet builds variable names at compile time with --ht-#{...}, so the tool cannot '
          + `rename or find ${rule.from}.`;

        ctx.report({
          ruleId: rule.id,
          severity: 'manual',
          line,
          markLine: start.line,
          message: rule.removed === true
            ? `${removalAdvice(rule, rule.from)} The key "${name}" names ${rule.from}. ${built}`
            : `Rename the ${name} key to ${rule.to.slice('--ht-'.length)} by hand. ${built}`,
        });
      }
    }
  });
}

/**
 * Renames CSS custom properties (`--from` to `--to`) and flags removed ones.
 *
 * - `css` parts (CSS, SCSS, Vue style blocks): the definition (`--from: 1px`), every `var(--from)` and
 *   `var(--from, fallback)` in a declaration value, and at-rule parameters. Matching is by whole token, so
 *   `--from-extra` is left alone. When one rule already defines both the old and the new name, none of that
 *   rule's declarations that mention the old name is renamed, and each gets a `manual` entry.
 * - `js` parts (JavaScript, TypeScript, Vue script blocks): string literals and template literal text, such as
 *   `style.setProperty('--from', v)`, `'var(--from)'`, and `'--from': '4px'` keys of a style (`style={{ ... }}`,
 *   `el.style['--from']`). Identifiers never change. The original quote style is kept. A string that is the key of an
 *   object that is not a style (`cssVars['--from']`, `{ '--from': 1 }` in a map of the project) is reported, because
 *   the code that reads the map is not in sight.
 * - `template` parts: report only.
 *
 * A removed variable (`removed: true`) is never deleted. In CSS it gets a TODO comment with the rule's advice,
 * once, before the declaration that defines or uses it. In JavaScript and templates it is reported.
 *
 * A rule whose `safe` is not `true` never edits code. It reports `manual` entries instead, and leaves a TODO comment
 * when the rule asks for one (see `lib/safety.mjs`).
 *
 * @type {import('../types.mjs').Transform}
 */
const cssVariables = {
  kinds: ['cssVariable'],
  fileKinds: ['css', 'js', 'template'],

  /**
   * @param {import('../types.mjs').Rule} rule A `cssVariable` rule.
   * @returns {string[]} The problems of the rule.
   */
  validate(rule) {
    return problemsOf(() => assertRenameOrRemoval(rule));
  },

  /**
   * @param {import('../types.mjs').Ctx} ctx Context of a `css`, `js`, or `template` part.
   * @param {import('../types.mjs').Rule[]} rules `cssVariable` rules.
   * @returns {void}
   */
  apply(ctx, rules) {
    if (ctx.fileKind === 'css' && ctx.source.includes(INTERPOLATED_PREFIX)
      && blankComments(ctx.source).includes(INTERPOLATED_PREFIX)) {
      reportInterpolatedNames(ctx, rules.filter(rule => typeof rule.from === 'string'));
    }

    const entries = buildEntries(rules, ctx.source);

    if (entries.length === 0) {
      return;
    }

    if (ctx.fileKind === 'css') {
      applyToCss(ctx, entries);
    } else if (ctx.fileKind === 'js') {
      applyToJs(ctx, entries);
    } else {
      reportInTemplate(ctx, entries);
    }
  },
};

export default cssVariables;
