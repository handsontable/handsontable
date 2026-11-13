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
 * Tell whether a rule or at-rule block already declares a custom property directly.
 *
 * @param {object} container A postcss container.
 * @param {string} name Custom property name.
 * @returns {boolean} `true` when a declaration of that name is a direct child.
 */
function declares(container, name) {
  return (container.nodes ?? []).some(node => node.type === 'decl' && node.prop === name);
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
  const inValue = test.test(declaration.value);

  if (!inProp && !inValue) {
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

  if (declares(declaration.parent, rule.from) && declares(declaration.parent, rule.to)) {
    ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      line,
      message: `Merge ${rule.from} and ${rule.to} by hand: both are defined in this rule, so the codemod left it `
        + 'alone.',
    });

    return;
  }

  const edited = ctx.css.replaceInDeclaration(declaration, all, rule.to);

  if (edited === null) {
    return;
  }

  if (edited === false) {
    reportRename(ctx, rule, line);

    return;
  }

  ctx.markChanged();
  ctx.report({ ruleId: rule.id, severity: 'changed', line, message: `Renamed ${rule.from} to ${rule.to}.` });
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

  if (!test.test(atRule.params)) {
    return;
  }

  if (removed) {
    leaveTodo(ctx, atRule, rule);

    return;
  }

  if (!entry.edits) {
    reportRename(ctx, rule, atRule.source?.start?.line);

    return;
  }

  const edited = ctx.css.replaceInAtRule(atRule, all, rule.to);

  if (edited === false) {
    reportRename(ctx, rule, atRule.source?.start?.line);

    return;
  }

  ctx.markChanged();
  ctx.report({
    ruleId: rule.id,
    severity: 'changed',
    line: atRule.source?.start?.line,
    message: `Renamed ${rule.from} to ${rule.to}.`,
  });
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
 *   `style.setProperty('--from', v)`, `'var(--from)'`, and `'--from': '4px'` object keys. Identifiers never
 *   change. The original quote style is kept.
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
