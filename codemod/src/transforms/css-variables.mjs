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
 * @returns {RegExp} Global pattern.
 */
function tokenPattern(name) {
  return new RegExp(`(?<![\\w-])${escapeRegExp(name)}(?![\\w-])`, 'g');
}

/**
 * Renames CSS custom properties in CSS and SCSS files, both the declaration (`--from: 1px`) and every use
 * (`var(--from, 1px)`). It is the reference transform of the pipeline: it handles `css` parts only. Vue style
 * blocks and JS strings are added by extending `fileKinds` and the walk below.
 *
 * @type {import('../types.mjs').Transform}
 */
const cssVariables = {
  kinds: ['cssVariable'],
  fileKinds: ['css'],

  /**
   * @param {import('../types.mjs').Ctx} ctx Context of a `css` part.
   * @param {import('../types.mjs').Rule[]} rules `cssVariable` rules with `from` and `to`.
   * @returns {void}
   */
  apply(ctx, rules) {
    for (const rule of rules) {
      const pattern = tokenPattern(rule.from);

      ctx.root.walkDecls((declaration) => {
        const prop = declaration.prop.replace(pattern, rule.to);
        const value = declaration.value.replace(pattern, rule.to);

        if (prop === declaration.prop && value === declaration.value) {
          return;
        }

        const line = declaration.source?.start?.line;

        declaration.prop = prop;
        declaration.value = value;
        ctx.markChanged();
        ctx.report({
          ruleId: rule.id,
          severity: 'changed',
          line,
          message: `Renamed ${rule.from} to ${rule.to}.`,
        });
      });
    }
  },
};

export default cssVariables;
