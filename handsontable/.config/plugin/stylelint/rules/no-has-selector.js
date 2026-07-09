const stylelint = require('stylelint');

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

const ruleName = 'handsontable/no-has-selector';

const messages = ruleMessages(ruleName, {
  rejected: selector =>
    `Unexpected ":has()" in selector "${selector}". The ":has()" relational pseudo-class forces Chrome ` +
    'to re-run style invalidation across the whole document on every matching DOM mutation (every grid ' +
    'scroll re-render), at a cost that scales with the host page. Drive the style from a class that JS ' +
    'toggles on the target element instead (see `SelectionManager` header-accent stamping for the pattern).',
});

const meta = {
  url: 'https://github.com/handsontable/handsontable/blob/develop/handsontable/src/3rdparty/walkontable/.ai/CONCERNS.md',
};

const HAS_PSEUDO = /:has\(/i;

/**
 * Disallows the CSS `:has()` relational pseudo-class in Handsontable stylesheets. Reports once per
 * selector list item that uses it (so `.a:has(.b), .c { … }` flags only `.a:has(.b)`), and marks the
 * exact `:has(` position for editor squiggles. Interpolation-only selectors (`#{$x}`) are left alone.
 */
const rule = (primary, _secondaryOptions, context) => {
  return (root, result) => {
    const validOptions = validateOptions(result, ruleName, { actual: primary });

    if (!validOptions || primary !== true) {
      return;
    }

    root.walkRules((ruleNode) => {
      const { selector } = ruleNode;

      if (!HAS_PSEUDO.test(selector)) {
        return;
      }

      // Report each offending selector-list item separately, at its own `:has(` offset, so a rule
      // with a mix of `:has()` and plain selectors points only at the bad ones.
      let cursor = 0;

      ruleNode.selectors.forEach((singleSelector) => {
        const itemIndex = selector.indexOf(singleSelector, cursor);

        cursor = itemIndex + singleSelector.length;

        const hasIndex = singleSelector.search(HAS_PSEUDO);

        if (hasIndex === -1) {
          return;
        }

        const index = (itemIndex === -1 ? 0 : itemIndex) + hasIndex;

        report({
          result,
          ruleName,
          message: messages.rejected(singleSelector.trim()),
          node: ruleNode,
          index,
          endIndex: index + ':has('.length,
        });
      });
    });

    // `context.fix` is intentionally unsupported: rewriting a `:has()` rule to a JS-toggled class
    // is a source change (add the class in JS, then rewrite the selector), not a mechanical fix.
    void context;
  };
};

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = meta;

module.exports = createPlugin(ruleName, rule);
