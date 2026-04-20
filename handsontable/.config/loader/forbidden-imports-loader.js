/**
 * Rspack loader that enforces an allow-list of importable modules in E2E test
 * builds. Replaces `babel-plugin-forbidden-imports` for the Rspack/SWC pipeline.
 *
 * Uses `@swc/core.parseSync` so comments, string literals, template literals,
 * JSDoc `@example` blocks and regex literals cannot produce false positives
 * (the regex-based approach this loader used earlier matched text anywhere in
 * the source, including inside quoted strings).
 *
 * Covers:
 *  - `import 'm'` / `import X from 'm'` / `import { X } from 'm'` / `import * as X from 'm'`
 *  - `export { X } from 'm'` / `export * from 'm'`
 *  - `require('m')`
 *  - `import('m')` (dynamic import with a string literal)
 *
 * Options:
 *   allowedModules: string[] - allow-list patterns (trailing '*' = prefix wildcard)
 *
 * @param {string} source The module source code.
 * @returns {string} The source unchanged (the loader is read-only; violations
 *   are reported through `this.emitError`).
 */
const swc = require('@swc/core');

module.exports = function forbiddenImportsLoader(source) {
  const { allowedModules = [] } = this.getOptions();
  const resourcePath = this.resourcePath;

  let ast;

  try {
    ast = swc.parseSync(source, {
      syntax: 'ecmascript',
      jsx: true,
    });
  } catch (err) {
    // If the source fails to parse let `builtin:swc-loader` report the real
    // syntax error; emit a non-fatal warning so the E2E guardrail does not
    // fail silently when surfacing parse problems.
    this.emitWarning(
      new Error(
        `forbidden-imports-loader: failed to parse source, skipping check.\n`
        + `  File: ${resourcePath}\n`
        + `  ${err.message}`
      )
    );

    return source;
  }

  const violations = collectModuleSpecifiers(ast)
    .filter(name => !isAllowed(allowedModules, name));

  violations.forEach((moduleName) => {
    this.emitError(
      new Error(
        `Forbidden import: "${moduleName}" is not allowed in E2E test builds.\n`
        + `  File: ${resourcePath}\n`
        + `  Allowed modules: ${allowedModules.join(', ')}`
      )
    );
  });

  return source;
};

/**
 * Walk the AST body (recursively) and collect every static module specifier
 * used by `import`, `export … from`, `require('…')`, and `import('…')`.
 * Non-string arguments (`require(expr)`, `import(expr)`) are intentionally
 * skipped: we only gate statically declared dependencies, matching the
 * original `babel-plugin-forbidden-imports` semantics.
 *
 * @param {object} ast SWC Program AST.
 * @returns {string[]} Module specifiers in source order.
 */
function collectModuleSpecifiers(ast) {
  const names = [];

  walk(ast, (node) => {
    if (!node || typeof node.type !== 'string') {
      return;
    }

    if (
      (node.type === 'ImportDeclaration'
        || node.type === 'ExportNamedDeclaration'
        || node.type === 'ExportAllDeclaration')
      && node.source
      && typeof node.source.value === 'string'
    ) {
      names.push(node.source.value);

      return;
    }

    if (node.type === 'CallExpression' && node.arguments && node.arguments.length > 0) {
      const callee = node.callee;
      const isRequire = callee && callee.type === 'Identifier' && callee.value === 'require';
      const isDynamicImport = callee && callee.type === 'Import';

      if (isRequire || isDynamicImport) {
        const arg = node.arguments[0] && node.arguments[0].expression;

        if (arg && arg.type === 'StringLiteral') {
          names.push(arg.value);
        }
      }
    }
  });

  return names;
}

/**
 * Depth-first traversal of an SWC AST. Visits every child node (array or
 * object) reachable from `root`.
 *
 * @param {object} root AST node.
 * @param {(node: object) => void} visitor Called for every node.
 */
function walk(root, visitor) {
  const stack = [root];

  while (stack.length > 0) {
    const node = stack.pop();

    if (!node || typeof node !== 'object') {
      continue;
    }

    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        stack.push(node[i]);
      }
      continue;
    }

    visitor(node);

    for (const key of Object.keys(node)) {
      if (key === 'type' || key === 'span' || key === 'ctxt') {
        continue;
      }

      const child = node[key];

      if (child && typeof child === 'object') {
        stack.push(child);
      }
    }
  }
}

/**
 * Check if a module specifier matches any pattern in the allow-list. Mirrors
 * `babel-plugin-forbidden-imports`' `isMatches` exactly: literal string
 * equality, with trailing '*' acting as a prefix wildcard. Relative paths are
 * NOT auto-allowed -- specs must declare every helper they pull in, otherwise
 * drive-by relative imports into `src/` or arbitrary test helpers would
 * silently bloat the E2E bundle.
 *
 * @param {string[]} patterns Array of allowed module patterns.
 * @param {string} moduleName The import path to check.
 * @returns {boolean} True if the import is allowed.
 */
function isAllowed(patterns, moduleName) {
  return patterns.some((pattern) => {
    if (pattern.indexOf('*') > -1) {
      return moduleName.startsWith(pattern.split('*')[0]);
    }

    return moduleName === pattern;
  });
}
