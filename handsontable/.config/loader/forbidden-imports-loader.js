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

  // Match import declarations and require() calls
  const importRegex = /(?:import\s+[\s\S]*?from\s+['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\))/g;
  let match;

  while ((match = importRegex.exec(source)) !== null) { // eslint-disable-line no-cond-assign
    const moduleName = match[1] || match[2];

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

  return source;
};

/**
 * Check if a module name matches any pattern in the allowlist.
 * Patterns support trailing '*' as a glob wildcard.
 * Local relative imports (starting with '.') that are not explicitly listed are always allowed.
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
