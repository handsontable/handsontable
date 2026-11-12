import { reportInstead, rewrites } from '../lib/safety.mjs';
import { replaceStringLiteral } from '../lib/string-literal.mjs';
import { TODO_PREFIX } from '../lib/todo.mjs';

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
      if (rule.removed !== true && typeof rule.to !== 'string') {
        throw new Error(`Rule ${rule.id} needs "to" or "removed": true.`);
      }

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
 * Text for a TODO comment or a manual entry about a removed variable.
 *
 * @param {import('../types.mjs').Rule} rule A removal rule.
 * @returns {string} The advice of the rule, or a generic sentence.
 */
function removalAdvice(rule) {
  return rule.advice ?? rule.message ?? `${rule.from} was removed.`;
}

/**
 * Tell whether a CSS node already has this rule's TODO comment in the run of comments right before it. Two
 * removed variables in one declaration leave two comments, so checking only the nearest one is not enough to
 * stay idempotent.
 *
 * @param {object} node A postcss node.
 * @param {string} ruleId Rule id.
 * @returns {boolean} `true` when the comment exists.
 */
function hasTodo(node, ruleId) {
  const marker = `${TODO_PREFIX} ${ruleId})`;

  for (let previous = node.prev(); previous?.type === 'comment'; previous = previous.prev()) {
    if (previous.text.trim().startsWith(marker)) {
      return true;
    }
  }

  return false;
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
  if (hasTodo(node, rule.id)) {
    ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      line: node.source?.start?.line,
      message: removalAdvice(rule),
    });

    return;
  }

  ctx.todo(node, rule.id, removalAdvice(rule));
}

/**
 * Report a rename that the rule does not apply because it is not safe.
 *
 * @param {import('../types.mjs').Ctx} ctx Context of a `css` or `js` part.
 * @param {import('../types.mjs').Rule} rule A rename rule.
 * @param {number|undefined} line One-based line.
 * @returns {void}
 */
function reportRename(ctx, rule, line) {
  reportInstead(ctx, rule, line, `Rename ${rule.from} to ${rule.to} here.`);
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
      message: `Both ${rule.from} and ${rule.to} are defined in this rule, so the codemod left it alone. `
        + 'Merge them by hand.',
    });

    return;
  }

  const prop = declaration.prop.replace(all, rule.to);
  const value = declaration.value.replace(all, rule.to);

  if (prop === declaration.prop && value === declaration.value) {
    return;
  }

  declaration.prop = prop;
  declaration.value = value;
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

  atRule.params = atRule.params.replace(all, rule.to);
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

  for (const { rule, test, removed } of entries.filter(entry => entry.removed || !entry.edits)) {
    const report = (line) => {
      if (removed) {
        ctx.report({ ruleId: rule.id, severity: 'manual', line, message: removalAdvice(rule) });
      } else {
        reportRename(ctx, rule, line);
      }
    };

    root.find(j.Literal).forEach((path) => {
      if (typeof path.node.value === 'string' && test.test(path.node.value)) {
        report(path.node.loc?.start?.line);
      }
    });
    root.find(j.TemplateElement).forEach((path) => {
      if (test.test(path.node.value.raw)) {
        report(path.node.loc?.start?.line);
      }
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

    const line = path.node.loc?.start?.line;

    value.raw = edit(value.raw);

    if (typeof value.cooked === 'string') {
      value.cooked = edit(value.cooked);
    }

    matched.forEach(hit => note(hit, line));
  });
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
        ? removalAdvice(rule)
        : `Rename ${rule.from} to ${rule.to} here. The codemod does not rewrite templates.`;

      ctx.report({ ruleId: rule.id, severity: 'manual', line, message });
    }
  }
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
   * @param {import('../types.mjs').Ctx} ctx Context of a `css`, `js`, or `template` part.
   * @param {import('../types.mjs').Rule[]} rules `cssVariable` rules.
   * @returns {void}
   */
  apply(ctx, rules) {
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
