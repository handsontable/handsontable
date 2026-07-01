/**
 * Layout-forcing DOM reads that must go through the Walkontable `GeometryReader` proxy instead of
 * being read straight off an element/window. Routing every such read through the port is what lets a
 * caching adapter memoize measurements per draw without touching call sites.
 */
const BANNED_PROPERTIES = new Set([
  'offsetWidth', 'offsetHeight', 'offsetTop', 'offsetLeft', 'offsetParent',
  'clientWidth', 'clientHeight',
  'scrollWidth', 'scrollHeight', 'scrollTop', 'scrollLeft',
  'innerWidth', 'innerHeight',
  'scrollX', 'scrollY', 'pageXOffset', 'pageYOffset',
]);

/**
 * Method reads (accessed then called) that must go through the proxy.
 */
const BANNED_METHODS = new Set([
  'getBoundingClientRect', 'getClientRects', 'getComputedStyle',
]);

/**
 * The `helpers/dom/element` geometry helpers, called as bare functions (e.g. `offset(el)`). These
 * are exactly what `LiveGeometryReader` wraps — calling them directly bypasses the proxy just like a
 * raw element read does. The proxy exposes the same names, so `geometryReader.offset(el)` is a member
 * call (allowed) while a bare `offset(el)` is not.
 */
const BANNED_HELPER_CALLS = new Set([
  'offset', 'outerWidth', 'outerHeight', 'innerWidth', 'innerHeight',
  'getScrollLeft', 'getScrollTop', 'getMaximumScrollTop', 'getMaximumScrollLeft',
  'getScrollbarWidth', 'getStyle',
]);

module.exports = {
  meta: {
    type: 'problem',

    docs: {
      description: 'Disallow direct layout-forcing DOM reads in Walkontable; use the GeometryReader proxy instead',
      category: 'Custom',
      recommended: false,
      fixable: false,
    },

    messages: {
      useGeometryReader:
        'Direct DOM read \'{{name}}\' bypasses the GeometryReader proxy. Read it through the injected ' +
        'geometry reader (e.g. `geometryReader.{{name}}(...)` / `this.#deps.geometryReader.{{name}}(...)`). ' +
        'If the proxy has no method for this read, add one to GeometryReader + LiveGeometryReader and use that.',
    },

    schema: [
      {
        type: 'object',
        properties: {
          excludeFiles: {
            type: 'array',
            items: { type: 'string' },
            description: 'Glob patterns to exclude (e.g. the GeometryReader adapter itself).',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    // The adapter/interface are the ONE place raw reads are correct — they define the proxy.
    const excludePatterns = options.excludeFiles || ['**/geometry/**'];
    const filename = context.getFilename().replace(/\\/g, '/');

    const globToRegex = (glob) => {
      const escaped = glob.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*/g, '<<STAR>>')
        .replace(/\*/g, '[^/]*')
        .replace(/<<STAR>>/g, '.*');

      return new RegExp(escaped);
    };

    if (excludePatterns.some(pattern => globToRegex(pattern).test(filename))) {
      return {};
    }

    // Allowed when the member is accessed on the geometry reader itself: a `geometryReader` identifier
    // (e.g. destructured `const { geometryReader } = this.#deps`) or any `<expr>.geometryReader`.
    const isGeometryReaderObject = (object) => {
      if (!object) {
        return false;
      }
      if (object.type === 'Identifier') {
        return object.name === 'geometryReader';
      }
      if (object.type === 'MemberExpression') {
        return object.property && object.property.name === 'geometryReader';
      }

      return false;
    };

    // The property name of a member access, handling both `el.scrollTop` and `el['scrollTop']`.
    const getPropertyName = (node) => {
      if (!node.computed) {
        return node.property && node.property.name;
      }
      if (node.property && node.property.type === 'Literal') {
        return node.property.value;
      }

      return undefined;
    };

    // A member expression that is the target of an assignment or update is a WRITE, not a read.
    const isWriteTarget = (node) => {
      const { parent } = node;

      if (parent.type === 'AssignmentExpression' && parent.left === node) {
        return true;
      }
      if (parent.type === 'UpdateExpression' && parent.argument === node) {
        return true;
      }

      return false;
    };

    return {
      MemberExpression(node) {
        const name = getPropertyName(node);

        if (name === undefined || isGeometryReaderObject(node.object)) {
          return;
        }

        // `this.<name>` reads/writes a class field of the same name (Walkontable stores measurements
        // like `clientHeight`/`scrollTop` on its instances), never a DOM element property.
        if (node.object.type === 'ThisExpression') {
          return;
        }

        if (!BANNED_PROPERTIES.has(name) && !BANNED_METHODS.has(name)) {
          return;
        }

        // A write target (`el.scrollTop = x`, `el.scrollTop++`) is not a layout-forcing read.
        if (isWriteTarget(node)) {
          return;
        }

        context.report({
          node,
          messageId: 'useGeometryReader',
          data: { name },
        });
      },

      CallExpression(node) {
        // Only bare calls (`offset(el)`), not member calls (`geometryReader.offset(el)` is allowed,
        // and `this.#getScrollTop()` is a private method, not the helper).
        if (node.callee.type !== 'Identifier' || !BANNED_HELPER_CALLS.has(node.callee.name)) {
          return;
        }

        context.report({
          node: node.callee,
          messageId: 'useGeometryReader',
          data: { name: node.callee.name },
        });
      },
    };
  },
};
