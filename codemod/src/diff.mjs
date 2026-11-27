import { createTwoFilesPatch } from 'diff';

/**
 * Build a unified diff of one file, for `--dry-run`.
 *
 * @param {string} filePath Project-relative path with forward slashes.
 * @param {string} before Original text.
 * @param {string} after Transformed text.
 * @returns {string} The unified diff with `a/` and `b/` headers.
 */
export function unifiedDiff(filePath, before, after) {
  return createTwoFilesPatch(`a/${filePath}`, `b/${filePath}`, before, after, '', '', { context: 3 });
}
