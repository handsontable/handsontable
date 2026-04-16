module.exports = {
  meta: {
    type: 'problem',

    docs: {
      description:
        'Disallow `.pickByDensity()` and `.e2ePickForDensity()` in E2E spec files, '
        + 'and disallow density-triplet object literals `{ compact, default, comfortable }` '
        + 'with numeric values in any file.',
      category: 'Custom',
      recommended: false,
      fixable: false,
    },

    messages: {
      useNamedHelpers:
        'Do not call `.pickByDensity()` from E2E specs. Use `getThemeLayout().e2ePickForDensity({...})` '
        + 'or other named helpers on `getThemeLayout()` (e.g. `e2e*()`, `e2eGcr_*()`, or token formulas).',
      usePickForDensity:
        'Do not call `.e2ePickForDensity()` from E2E specs. Use named `e2e*()` / `e2eGcr_*()` helpers '
        + 'on `getThemeLayout()`, or derive the value from token formulas in `themeLayoutE2eHelpers.js`.',
      useDensityLiteralTriplet:
        'Density-triplet objects `{ compact, default, comfortable }` with literal values are forbidden. '
        + 'Derive the value from theme tokens instead, or add a named `e2e*()` helper in '
        + '`themeLayoutE2eHelpers.js`.',
    },

    schema: [],
  },

  create(context) {
    /**
     * Returns true when the node is a "literal-like" value: a numeric/string Literal,
     * or a UnaryExpression (e.g. -1) whose argument is a Literal.
     */
    function isLiteralLike(node) {
      if (!node) return false;

      if (node.type === 'Literal') return true;

      if (
        node.type === 'UnaryExpression' &&
        (node.operator === '-' || node.operator === '+') &&
        node.argument &&
        node.argument.type === 'Literal'
      ) {
        return true;
      }

      return false;
    }

    /**
     * Check whether an ObjectExpression contains all three density keys
     * (`compact`, `default`, `comfortable`) and all three values are literal-like.
     */
    function isDensityTripletLiteral(node) {
      if (node.type !== 'ObjectExpression') return false;

      const DENSITY_KEYS = new Set(['compact', 'default', 'comfortable']);
      const found = new Map();

      for (const prop of node.properties) {
        // Only handle regular (non-computed, non-spread) properties.
        if (prop.type !== 'Property' || prop.computed) continue;

        const keyName =
          prop.key.type === 'Identifier'
            ? prop.key.name
            : prop.key.type === 'Literal'
              ? String(prop.key.value)
              : null;

        if (keyName !== null && DENSITY_KEYS.has(keyName)) {
          found.set(keyName, prop.value);
        }
      }

      if (found.size !== 3) return false;

      // All three values must be literal-like.
      return [...found.values()].every(isLiteralLike);
    }

    const filename = context.getFilename();
    const isSpecFile = filename.endsWith('.spec.js');

    return {
      // -----------------------------------------------------------------
      // Check 1: `.pickByDensity()` in *.spec.js files (original rule)
      // Check 2: `.e2ePickForDensity()` in *.spec.js files (new)
      // -----------------------------------------------------------------
      CallExpression(node) {
        if (!isSpecFile) return;

        const { callee } = node;

        if (
          callee.type !== 'MemberExpression' ||
          callee.computed ||
          callee.property.type !== 'Identifier'
        ) {
          return;
        }

        const methodName = callee.property.name;

        if (methodName === 'pickByDensity') {
          context.report({
            node: callee.property,
            messageId: 'useNamedHelpers',
          });
        } else if (methodName === 'e2ePickForDensity') {
          context.report({
            node: callee.property,
            messageId: 'usePickForDensity',
          });
        }
      },

      // -----------------------------------------------------------------
      // Check 3: Density-triplet object literals in ANY file
      // -----------------------------------------------------------------
      ObjectExpression(node) {
        if (isDensityTripletLiteral(node)) {
          context.report({
            node,
            messageId: 'useDensityLiteralTriplet',
          });
        }
      },
    };
  },
};
