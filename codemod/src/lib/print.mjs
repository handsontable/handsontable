/**
 * The one way the product prints a node or a collection outside `printJsPart()`. recast ends a line with `os.EOL`
 * unless it is told otherwise, which is `\r\n` on Windows, so a direct `toSource()` call would give the same tree a
 * different text there. Every call in `src/` goes through this module or passes `lineTerminator` itself, and a test
 * enforces it.
 */

/**
 * Print a node or a collection, with `\n` ending every line whatever the host.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} target An AST node or a jscodeshift Collection.
 * @param {object} [options] More recast print options. `lineTerminator` is always `\n`.
 * @returns {string} The printed text.
 */
export function printTree(j, target, options = {}) {
  return j(target).toSource({ ...options, lineTerminator: '\n' });
}
