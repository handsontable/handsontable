/**
 * Helpers for the `validate(rule)` hook of a transform. The hook returns the problems of one rule, and the manifest
 * loader calls it, so a malformed rule fails when the manifests load and never as a per-file `transform-error`.
 *
 * @module lib/validate
 */

/**
 * Check that a `cssVariable` or `themeToken` rule is a rename (`to`) or a removal (`removed: true`). The manifest
 * validator cannot express "`to` or `removed`".
 *
 * @param {{id: string, to?: unknown, removed?: unknown}} rule The rule.
 * @returns {void}
 * @throws {Error} When the rule has neither.
 */
export function assertRenameOrRemoval(rule) {
  if (rule.removed !== true && typeof rule.to !== 'string') {
    throw new Error(`Rule ${rule.id} needs "to" or "removed": true.`);
  }
}

/**
 * Run a check that throws on a malformed rule and turn the error into a list of problems. The leading
 * `Rule <id>` of the message is dropped, because the loader names the rule itself.
 *
 * @param {() => void} check A function that throws an `Error` when the rule is malformed.
 * @returns {string[]} An empty list, or the one problem the check threw.
 */
export function problemsOf(check) {
  try {
    check();

    return [];
  } catch (error) {
    return [error.message.replace(/^Rule \S+? /, '')];
  }
}
