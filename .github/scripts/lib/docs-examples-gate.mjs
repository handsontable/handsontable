/**
 * Pure classifier for `docs-examples-sync.yml` (DEV-3029): does a changed file
 * under `docs/content/guides/**` or `docs/content/recipes/**` actually touch
 * example content, or only prose outside it? No git or filesystem access here
 * -- the CLI wrapper (`../docs-examples-gate.mjs`) supplies the blobs and diff.
 *
 * Example source is never inline in the `.md`: a guide embeds it by reference,
 *
 *   ::: example #example1 --js 1 --ts 2
 *   @[code](@/content/guides/category/feature/javascript/example1.js)
 *   @[code](@/content/guides/category/feature/javascript/example1.ts)
 *   :::
 *
 * with the actual source living in sibling files beside the guide. So a
 * non-`.md` file anywhere in scope is always relevant, and a `.md` file is
 * relevant only when a changed line falls inside a `::: example ... :::` (or
 * `::: example-without-tabs ... :::`) block -- including its fence/header line
 * and any `@[code]` reference line inside it.
 *
 * Every ambiguous case here defaults to "relevant": a wrong "not relevant"
 * silently drops a real example sync (the failure this ticket exists to
 * prevent), while a wrong "relevant" only costs one no-op dispatch.
 */

// Mirrors `processExampleBlocks()` in `docs/src/plugins/framework-loader.mjs`
// line for line, including its whitespace quirk: a nested fence only opens a
// new depth when `:::` is followed by whitespace and something else (so a
// tightly-written `:::tip` closes the *outer* block early, same as the
// renderer). Keep this in sync with that function -- if they drift, this gate
// and the actual page renderer disagree about what is inside a block.
const OPEN_RE = /^:::\s*(example(?:-without-tabs)?)\s*(.*)/;
const NESTED_OPEN_RE = /^:::\s+\S/;
const CLOSE_RE = /^:::\s*$/;

// A cheap pre-filter: any added/removed line that itself carries a fence or a
// reference is relevant with no line-range arithmetic needed. Excludes the
// unified-diff file-header lines (`+++ b/...`, `--- a/...`), which also start
// with a lone `+`/`-`.
const EXAMPLE_MARKER_RE = /^[+-](?!\+\+ )(?!-- ).*(:::\s*example|@\[code\])/m;

const IN_SCOPE_RE = /^docs\/content\/(guides|recipes)\//;
const MARKDOWN_RE = /\.md$/i;

/**
 * Line ranges (1-based, inclusive of both fence lines) covered by
 * `::: example ... :::` / `::: example-without-tabs ... :::` blocks.
 *
 * An unterminated block (no closing fence before EOF) is not an error -- like
 * the loader, this just runs the block to the end of the file, which biases
 * toward "relevant" rather than throwing.
 *
 * @param {string} text Markdown source.
 * @returns {{start: number, end: number}[]}
 */
export function parseExampleBlockRanges(text) {
  const lines = String(text ?? '').split('\n');
  const ranges = [];
  let i = 0;

  while (i < lines.length) {
    if (OPEN_RE.test(lines[i])) {
      const start = i + 1;
      let depth = 1;

      i++;

      while (i < lines.length && depth > 0) {
        if (NESTED_OPEN_RE.test(lines[i])) {
          depth++;
        } else if (CLOSE_RE.test(lines[i])) {
          depth--;
        }
        i++;
      }

      ranges.push({ start, end: i });
    } else {
      i++;
    }
  }

  return ranges;
}

/**
 * Added (new-side) and removed (old-side) line numbers from a single-file
 * unified diff (`git diff --unified=0`). Tracks both counters through each
 * `@@` hunk header -- unlike a plain "added lines" scan, this also recovers
 * old-side line numbers, which is what lets a whole-block *deletion* be
 * checked against the block ranges parsed from the before-side text.
 *
 * @param {string} diffText
 * @returns {{addedLines: Set<number>, removedLines: Set<number>}}
 */
export function parseUnifiedDiffHunks(diffText) {
  const addedLines = new Set();
  const removedLines = new Set();
  let oldLine = 0;
  let newLine = 0;

  for (const line of String(diffText ?? '').split('\n')) {
    const hunk = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);

    if (hunk) {
      oldLine = Number(hunk[1]);
      newLine = Number(hunk[2]);
    } else if (line.startsWith('+++ ') || line.startsWith('--- ')) {
      // file header lines, not content
    } else if (line.startsWith('+')) {
      addedLines.add(newLine);
      newLine += 1;
    } else if (line.startsWith('-')) {
      removedLines.add(oldLine);
      oldLine += 1;
    }
    // `--unified=0` emits no context lines, so nothing else advances a counter.
  }

  return { addedLines, removedLines };
}

/**
 * @param {Set<number>} lineNumbers
 * @param {{start: number, end: number}[]} ranges
 * @returns {boolean}
 */
function intersects(lineNumbers, ranges) {
  for (const line of lineNumbers) {
    if (ranges.some((range) => line >= range.start && line <= range.end)) {
      return true;
    }
  }

  return false;
}

/**
 * Decide whether one changed file, under the workflow's path filter, touches
 * example content.
 *
 * @param {object} input
 * @param {string} input.path The (new-side) path, e.g. `docs/content/guides/x/y.md`.
 * @param {'added'|'modified'|'removed'|'renamed'|'copied'} input.status
 * @param {string} [input.diffText] `git diff --unified=0` output for this file
 *   (modified `.md` files only).
 * @param {string|null} [input.beforeText] Full file text at the before SHA, or
 *   `null` when unavailable (added files, or a read failure).
 * @param {string|null} [input.afterText] Full file text at the after SHA, or
 *   `null` when unavailable (removed files, or a read failure).
 * @returns {boolean}
 */
export function isExampleRelevant({ path, status, diffText = '', beforeText = null, afterText = null }) {
  if (status === 'renamed' || status === 'copied') {
    // Assumption: the importer is plausibly path-keyed, so a rename/copy
    // changes what an `@[code]` reference or example id resolves against
    // even with byte-identical content. Always relevant.
    //
    // Checked before the scope filter below defensively, for a direct caller
    // that passes an out-of-scope `path` alongside this status. In practice
    // the CLI (`../docs-examples-gate.mjs`) never constructs that combination:
    // a `git diff -- <pathspec>` restricted to the scoped directories cannot
    // pair a rename/copy whose new side falls outside them -- verified
    // empirically, it degrades to a plain delete of the OLD (in-scope) path
    // instead, which the 'removed' branch below already handles correctly by
    // checking whether the departing content had an example block.
    return true;
  }

  if (!IN_SCOPE_RE.test(path)) {
    return false;
  }

  if (!MARKDOWN_RE.test(path)) {
    return true; // a sibling example asset (.ts/.js/.tsx/.vue/.html/.css/...)
  }

  if (status === 'added') {
    return afterText == null ? true : parseExampleBlockRanges(afterText).length > 0;
  }

  if (status === 'removed') {
    return beforeText == null ? true : parseExampleBlockRanges(beforeText).length > 0;
  }

  // Modified. Fail open when either side's full text could not be read.
  if (beforeText == null || afterText == null) {
    return true;
  }

  if (EXAMPLE_MARKER_RE.test(diffText ?? '')) {
    return true;
  }

  const { addedLines, removedLines } = parseUnifiedDiffHunks(diffText);
  const afterRanges = parseExampleBlockRanges(afterText);
  const beforeRanges = parseExampleBlockRanges(beforeText);

  // Check both sides: an added-line hit catches a block being edited or added,
  // and a removed-line hit (against the BEFORE-side ranges) catches a whole
  // block being deleted, which leaves nothing on the after side to intersect.
  return intersects(addedLines, afterRanges) || intersects(removedLines, beforeRanges);
}
