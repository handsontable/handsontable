/**
 * Rspack loader that enforces an allowlist of importable modules in E2E test builds.
 * Replaces babel-plugin-forbidden-imports for Rspack/SWC builds.
 *
 * Options:
 *   allowedModules: string[] - glob patterns of allowed module names (e.g. 'hyperformula*')
 *
 * @param {string} source The module source code.
 * @returns {string} The unchanged source (throws on violation).
 */
module.exports = function forbiddenImportsLoader(source) {
  const options = this.getOptions();
  const allowedModules = options.allowedModules || [];
  const resourcePath = this.resourcePath;

  // Match side-effect imports: import 'module';
  const sideEffectImportRegex = /import\s+['"]([^'"]+)['"]/g;
  // Match named/default imports: import X from 'module'; import { X } from 'module';
  // Use a lazy [\s\S]*? segment to tolerate quoted comments between import and from,
  // e.g. `import { /* it's */ foo } from 'module'`.
  const namedImportRegex = /import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;
  // Match export-from re-exports: export { X } from 'module'; export * from 'module';
  // Same quoted-comment tolerance as above.
  const exportFromRegex = /export\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;
  // Match require() calls: require('module')
  const requireRegex = /require\(\s*['"]([^'"]+)['"]\s*\)/g;

  [sideEffectImportRegex, namedImportRegex, exportFromRegex, requireRegex].forEach((regex) => {
    let match;

    while ((match = regex.exec(source)) !== null) { // eslint-disable-line no-cond-assign
      const moduleName = match[1];

      if (!isAllowed(allowedModules, moduleName)) {
        this.emitError(
          new Error(
            `Forbidden import: "${moduleName}" is not allowed in E2E test builds.\n`
            + `  File: ${resourcePath}\n`
            + `  Allowed modules: ${allowedModules.join(', ')}`
          )
        );
      }
    }
  });

  return source;
};

/**
 * Check if a module specifier matches any pattern in the allow-list.
 * Mirrors `babel-plugin-forbidden-imports`' `isMatches` semantics exactly:
 * literal string equality, with trailing '*' acting as a prefix wildcard.
 * Relative paths are NOT auto-allowed -- specs must declare every helper
 * they pull in, otherwise drive-by relative imports into src/ or arbitrary
 * test helpers would silently bloat the E2E bundle.
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
