import { readdirSync, readFileSync } from 'fs';
import { join, relative, resolve, sep } from 'path';

/**
 * `[[Target]]` is TypeDoc's legacy cross-reference syntax. The API reference is built with
 * `jsdoc-to-markdown` and `dmd` (`docs/scripts/jsdoc-convert/`), and neither one understands it,
 * so a `[[Target]]` written in a JSDoc comment reaches the published page as literal text
 * instead of a link (DEV-2728). The docs site has no handler for it either, so the same
 * shorthand leaks the same way out of a guide page.
 *
 * The only cross-reference syntax the API pipeline resolves is an inline `link` tag, which
 * `docs/scripts/jsdoc-convert/renderer/postProcessors/jsdocLinksFixer.mjs` rewrites into an
 * `@/api/<page>.md#<anchor>` link. Write it in the qualified form, naming the class that owns
 * the reference page and the member (`Core#getCellMeta`), and use inline code for anything the
 * API reference does not document - an unresolvable link tag silently points at a page that
 * does not exist. A guide page links the same target the long way round, as
 * `[label](@/api/<page>.md#<anchor>)`.
 *
 * Only identifier-shaped targets are reported, so `[[1, 2], [3, 4]]` and the other array
 * literals the examples are full of stay legal. In source, only comment lines are scanned;
 * an `@example` block counts as a comment, so an example that writes `[[value]]` trips this
 * test - name the array in a variable instead.
 */

const REPO_ROOT = resolve(__dirname, '../..', '..');
const CORE_SRC = 'handsontable/src';
const DOCS_CONTENT = 'docs/content';

// Directories that hold generated or vendored output rather than authored files.
const SKIPPED_DIRS = [
  join('handsontable', 'src', '3rdparty', 'walkontable', 'dist'),
  // Regenerated from the core source on every docs build, and gitignored.
  join('docs', 'content', 'api'),
];

const TYPEDOC_LINK = /\[\[[A-Za-z_#][A-Za-z0-9_#+.]*\]\]/;
const COMMENT_LINE = /^\s*\*/;
// VuePress table-of-contents directive, carried by every generated and legacy page.
const TOC_DIRECTIVE = /^\s*\[\[\s*toc\s*\]\]\s*$/;

/**
 * Lists the files under `dir` whose name ends with one of `extensions`, recursively.
 *
 * The walk reads the filesystem rather than the git index so it also sees a brand-new file
 * that has not been staged yet, and so it does not depend on the suite running inside a
 * git checkout.
 *
 * @param {string} dir Directory to walk, relative to the repository root.
 * @param {string[]} extensions File extensions to keep, leading dot included.
 * @returns {string[]} Repository-relative paths, using forward slashes.
 */
function walk(dir, extensions) {
  const found = [];
  const queue = [resolve(REPO_ROOT, dir)];

  while (queue.length > 0) {
    const current = queue.pop();

    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      const relativePath = relative(REPO_ROOT, path);

      if (SKIPPED_DIRS.some(skipped => relativePath === skipped)) {
        continue;
      }

      if (entry.isDirectory()) {
        queue.push(path);
      } else if (extensions.some(extension => entry.name.endsWith(extension))) {
        found.push(relativePath.split(sep).join('/'));
      }
    }
  }

  return found;
}

/**
 * Collects every `[[Target]]` reference in the given files.
 *
 * @param {string[]} files Repository-relative paths to scan.
 * @param {boolean} commentsOnly Whether to consider comment lines only (source files).
 * @returns {string[]} Matches as `<path>:<line>: <content>`, empty when everything is clean.
 */
function findTypeDocLinks(files, commentsOnly) {
  const matches = [];

  for (const file of files) {
    const lines = readFileSync(resolve(REPO_ROOT, file), 'utf8').split('\n');

    lines.forEach((line, index) => {
      if (commentsOnly && !COMMENT_LINE.test(line)) {
        return;
      }
      if (TOC_DIRECTIVE.test(line) || !TYPEDOC_LINK.test(line)) {
        return;
      }

      matches.push(`${file}:${index + 1}: ${line.trim()}`);
    });
  }

  return matches;
}

describe('cross-reference link syntax', () => {
  it('should not use TypeDoc `[[Target]]` links in core JSDoc comments', () => {
    const files = walk(CORE_SRC, ['.ts', '.js']);

    expect(files.length).toBeGreaterThan(500);
    expect(findTypeDocLinks(files, true)).toEqual([]);
  });

  it('should not use TypeDoc `[[Target]]` links in documentation pages', () => {
    const files = walk(DOCS_CONTENT, ['.md']);

    expect(files.length).toBeGreaterThan(100);
    expect(findTypeDocLinks(files, false)).toEqual([]);
  });
});
