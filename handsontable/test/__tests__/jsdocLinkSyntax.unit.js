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
 * API reference does not document – an unresolvable link tag silently points at a page that
 * does not exist. A guide page links the same target the long way round, as
 * `[label](@/api/<page>.md#<anchor>)`.
 *
 * Only identifier-shaped targets are reported, so `[[1, 2], [3, 4]]` and the other array
 * literals the examples are full of stay legal. In source, only comment lines are scanned;
 * an `@example` block counts as a comment, so an example that writes `[[value]]` trips this
 * test – name the array in a variable instead.
 */

const REPO_ROOT = resolve(__dirname, '../..', '..');
const CORE_SRC = 'handsontable/src';
const DOCS_CONTENT = 'docs/content';

// Vendored output rather than authored source.
const SKIPPED_DIRS = [
  join('handsontable', 'src', '3rdparty', 'walkontable', 'dist'),
];

// `docs/content/api` is regenerated from the core source on every docs build, so scanning it
// would only re-report what the core-source case already covers. Its `.gitignore` un-ignores
// three files, though (`/content/api/*` followed by `!introduction.md`, `!plugins.md`,
// `!sidebar.js`): those are hand-authored and tracked, they are the likeliest place for a
// hand-written API cross-reference, and they must stay in the scan.
const GENERATED_API_DIR = join('docs', 'content', 'api');
const AUTHORED_API_FILES = ['introduction.md', 'plugins.md', 'sidebar.js'];

const TYPEDOC_LINK = /\[\[[A-Za-z_#][A-Za-z0-9_#+.]*\]\]/;
// A JSDoc block: its opening line and its continuation lines. `//` is deliberately absent –
// jsdoc parses `/**` blocks only, so a `[[Target]]` in a line comment cannot reach a page,
// and including it would flag commented-out code such as `// data: [[ISO_DATE]]`.
const COMMENT_LINE = /^\s*(?:\/\*|\*)/;
// VuePress table-of-contents directive, carried by every generated and legacy page.
const TOC_DIRECTIVE = /^\s*\[\[\s*toc\s*\]\]\s*$/i;

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

      if (SKIPPED_DIRS.includes(relativePath)) {
        continue;
      }

      if (entry.isDirectory()) {
        queue.push(path);
        continue;
      }

      const isGeneratedApiPage = relative(REPO_ROOT, current) === GENERATED_API_DIR
        && !AUTHORED_API_FILES.includes(entry.name);

      if (isGeneratedApiPage) {
        continue;
      }

      if (extensions.some(extension => entry.name.endsWith(extension))) {
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
