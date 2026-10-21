/**
 * Presence gate — pure classifier and evaluator.
 *
 * Decides whether a set of changed files satisfies the "source changed ⇒ a
 * matching test changed" rule, which kind of new coverage is valid, and whether
 * a new Jasmine spec was added (which is not allowed — the Jasmine suite is
 * frozen; new E2E is Playwright). No git or filesystem access lives here so the
 * logic is unit-testable; the CLI wrapper feeds it a parsed diff and the
 * range's commits.
 *
 * A "change" is `{ status, path }` where status is a git name-status letter
 * (A added, M modified, R renamed, D deleted, ...). A "commit" is
 * `{ message, files }`: its full message and the paths it changed.
 *
 * "Matching" means three things (DEV-3066):
 *
 * - **A deleted test is not coverage.** Removing a failing test next to a
 *   source change used to pass the gate, because the coverage patterns ignored
 *   the git status.
 * - **Coverage comes from the changed package's own tests.** A core source
 *   change needs a core test (a unit or type test under `handsontable/`, an edit
 *   to an existing Jasmine spec, or a Playwright spec under `tests/`); a
 *   wrapper's source needs a test in that wrapper. A test in another package,
 *   `docs/tests/`, `evals/`, `examples/`, or `performance-tests/` covers no
 *   library source. A visual spec still counts for every package — whether a
 *   screenshot alone should is the visual-only-coverage advisory's open
 *   question (`lib/presence-warnings.mjs`), not this gate's.
 * - **A `Refactor-only:` trailer waives only its own commit's files.** A source
 *   file with no coverage passes when every commit in the range that changed it
 *   carries the trailer; one trailer no longer waives a whole branch. A commit
 *   `git revert` wrote (`This reverts commit <sha>.`) waives its files the same
 *   way: it restores code that was tested before, and the revert usually
 *   deletes the reverted feature's test, which is no longer coverage. Measured
 *   before the change: the one verdict the new rules flipped in 300 develop
 *   commits was such a revert (#13508).
 * - **A change to comments only needs no test.** A source file whose diff
 *   changes nothing but comments and whitespace (a JSDoc edit, typically)
 *   changes no behavior. isCommentOnlyChange() decides it conservatively, and
 *   the CLI reads both versions of the file to feed it. Replayed over develop,
 *   JSDoc-only docs PRs were nearly all of the gate's failures.
 * - **A waiver follows the file, not the name.** A file renamed in a refactor
 *   commit is still judged on the ordinary commits that edited it under its old
 *   name, and a merge commit's own edits (a conflict resolution) never waive.
 * - **The PR description can waive what a pushed commit cannot.** A pushed
 *   commit takes no trailer without a force-push, which a PR branch must not
 *   do, so `[refactor-only: <reason>]` in the live PR body waives the PR's
 *   uncovered files, the way `[skip changelog]` skips the changelog gate. It is
 *   visible in review, which is the point.
 * - **Translation dictionaries need no test.** `handsontable/src/i18n/languages/`
 *   holds text, which the testing rules list as needing no test; the changelog
 *   gate still sees them, because classify() does not change.
 */

/**
 * Source paths that, when changed, require a matching test change.
 */
const SOURCE = [
  /^handsontable\/src\/.*\.(ts|js|tsx)$/,
  /^wrappers\/(react-wrapper|vue3)\/src\/.*\.(ts|tsx|vue)$/,
  /^wrappers\/angular-wrapper\/projects\/hot-table\/src\/lib\/.*\.ts$/,
];

/**
 * A source candidate is excluded if it is itself a test, a type declaration, or
 * a test helper. Exclusions are by filename and directory marker, not directory
 * alone, because specs are co-located inside `src/**\/__tests__/`.
 */
const NOT_SOURCE = [
  /\.spec\.[jt]sx?$/, /\.unit\.[jt]sx?$/, /\.types\.ts$/, /\.d\.ts$/,
  /\/__tests__\//, /\/test\//, /\/test-helpers\//, /\/spec\//,
];

/**
 * Test file patterns that count as coverage at any git status except `D`
 * (deleted), inside one of the COVERAGE_ROOTS below.
 */
const COVERAGE_ANY_STATUS = [
  /\.unit\.[jt]sx?$/,       // Jest unit
  /\.types\.ts$/,           // public-API type-surface tests
  /\.spec\.tsx?$/,          // Playwright (tests/), wrapper (.spec.tsx/.ts), visual (.spec.ts)
];

/**
 * The package each production source file belongs to. Order matters only for
 * readability — the prefixes do not overlap.
 */
const SOURCE_GROUPS = [
  ['core', /^handsontable\/src\//],
  ['react-wrapper', /^wrappers\/react-wrapper\//],
  ['vue3', /^wrappers\/vue3\//],
  ['angular-wrapper', /^wrappers\/angular-wrapper\//],
];

const ALL_GROUPS = SOURCE_GROUPS.map(([group]) => group);

/**
 * Where a test file must live to cover each package. First match wins. A test
 * file outside every root (`docs/tests/`, `evals/`, `examples/`,
 * `performance-tests/`) covers nothing.
 */
const COVERAGE_ROOTS = [
  [/^handsontable\//, ['core']],
  // The Playwright functional tier drives the core bundles.
  [/^tests\//, ['core']],
  [/^wrappers\/react-wrapper\//, ['react-wrapper']],
  [/^wrappers\/vue3\//, ['vue3']],
  [/^wrappers\/angular-wrapper\//, ['angular-wrapper']],
  // A capture spec renders every package; the visual-only-coverage advisory,
  // not this gate, decides whether a screenshot alone is enough.
  [/^visual-tests\//, ALL_GROUPS],
];

/**
 * Where to add a test for each package, for the CLI's missing-coverage message.
 */
export const COVERAGE_HINTS = {
  core: 'a Jest `*.unit.ts` or a `*.types.ts` under `handsontable/`, a Playwright spec in `tests/e2e/`, '
    + 'or a case in an existing Jasmine `*.spec.js`',
  'react-wrapper': 'a test in `wrappers/react-wrapper/`',
  vue3: 'a test in `wrappers/vue3/`',
  'angular-wrapper': 'a test in `wrappers/angular-wrapper/`',
};

/**
 * A newly added Jasmine spec (`*.spec.js` under a Jasmine tree). New Jasmine
 * files do not satisfy the gate and are flagged — new E2E goes to Playwright.
 */
const JASMINE_SPEC = /\.spec\.js$/;
// The frozen Jasmine suites. Walkontable is now INCLUDED — it has a Playwright
// home (tests/e2e/walkontable), so it follows the same freeze as the main
// suite: edit existing specs, but new/flaky ones move to Playwright.
const JASMINE_TREE = [
  // The intermediate directory is optional — specs live both at
  // `src/__tests__/` and at `src/<any>/.../__tests__/`.
  /^handsontable\/src\/(.*\/)?__tests__\//,
  /^handsontable\/test\//,
  /^handsontable\/src\/3rdparty\/walkontable\/test\//,
];

const REFACTOR_TRAILER = /^Refactor-only:\s*(.*\S)/i;
// The reason may hold one level of brackets: a Markdown link, an index.
const BODY_WAIVER = /\[refactor-only:\s*((?:[^[\]]|\[[^[\]]*\])*?\S)\s*\]/gi;
// A reason copied from the docs or from the gate's own red verdict (`<reason>`,
// or an elided `…`) is a placeholder, not a declaration: pasting the
// instruction must not waive.
const PLACEHOLDER_REASON = /^(<[^<>]*>|&lt;.*&gt;|…|\.{3})$/;
// A reason names what the change is: "TBD", "x", or "reason" is not one. 86 of
// the 89 reasons in develop's history have four words or more.
const MIN_REASON_WORDS = 3;
// The body line `git revert` writes.
const REVERT_LINE = /^This reverts commit [0-9a-f]{7,40}\.?$/m;

/**
 * Classify a single path as 'source', 'test', or 'neither' (status-independent
 * view, used by tests and reporting). A path's classification says nothing
 * about which package it can cover — see coverageGroups().
 *
 * @param {string} p Repo-relative path.
 * @returns {'source'|'test'|'neither'} The classification.
 */
export function classify(p) {
  const isSource = SOURCE.some(r => r.test(p)) && !NOT_SOURCE.some(r => r.test(p));
  if (isSource) {
    return 'source';
  }
  const isTest = COVERAGE_ANY_STATUS.some(r => r.test(p)) || JASMINE_SPEC.test(p);
  return isTest ? 'test' : 'neither';
}

/**
 * The package a production source file belongs to.
 *
 * @param {string} p Repo-relative path of a file classify() calls 'source'.
 * @returns {string|null} 'core', 'react-wrapper', 'vue3', 'angular-wrapper', or null.
 */
export function sourceGroup(p) {
  const hit = SOURCE_GROUPS.find(([, re]) => re.test(p));

  return hit ? hit[0] : null;
}

/**
 * The packages a test file can cover, by where it lives.
 *
 * @param {string} p Repo-relative path.
 * @returns {string[]} The package names; empty outside every coverage root.
 */
export function coverageGroups(p) {
  const hit = COVERAGE_ROOTS.find(([re]) => re.test(p));

  return hit ? hit[1] : [];
}

/**
 * Does this change count as coverage that satisfies the gate?
 * A deleted test never counts. A modified `*.spec.js` counts; a newly added one
 * does not. The file must also live under a coverage root.
 *
 * @param {{status: string, path: string}} change A parsed diff entry.
 * @returns {boolean} True when the change satisfies the "a test changed" rule.
 */
export function isCoverage({ status, path }) {
  if (status === 'D' || coverageGroups(path).length === 0) {
    return false;
  }
  if (COVERAGE_ANY_STATUS.some(r => r.test(path))) {
    return true;
  }
  // A modified (not newly added) Jasmine spec counts — bug-fix cases on a frozen
  // spec are allowed (main suite and walkontable alike). A newly added one does
  // not (see isNewJasmineSpec).
  return JASMINE_SPEC.test(path) && status !== 'A';
}

/**
 * Is this path a spec of the frozen Jasmine suite (`*.spec.js` under a Jasmine
 * tree), whatever its git status? Status-independent so the advisory warnings
 * (lib/presence-warnings.mjs) can reason about *modified* frozen specs, which
 * the gate itself accepts as coverage.
 *
 * @param {string} p Repo-relative path.
 * @returns {boolean} True for a `*.spec.js` inside one of the frozen trees.
 */
export function isFrozenJasmineSpec(p) {
  return JASMINE_SPEC.test(p) && JASMINE_TREE.some(r => r.test(p));
}

/**
 * Is this a newly added Jasmine spec — the frozen-set violation?
 *
 * @param {{status: string, path: string}} change A parsed diff entry.
 * @returns {boolean} True for an added `*.spec.js` under a Jasmine tree.
 */
export function isNewJasmineSpec({ status, path }) {
  return status === 'A' && isFrozenJasmineSpec(path);
}

/**
 * Production source that needs no test: data the testing rules exempt. Kept
 * out of isSource() only, so classify() — which the changelog gate uses — still
 * calls these files source.
 */
const NO_TEST_SOURCE = [
  /^handsontable\/src\/i18n\/languages\//,
];

/**
 * Is a source change present that needs a test?
 *
 * @param {{status: string, path: string}} change A parsed diff entry.
 * @returns {boolean} True when the change is production source needing a test.
 */
export function isSource({ path }) {
  return classify(path) === 'source' && !NO_TEST_SOURCE.some(r => r.test(path));
}

/**
 * Source files a build step rewrites as text, comments included: the theme UMD
 * build (`handsontable/.config/themes-umd-development.js`) runs
 * string-replace-loader over them, so a comment edit there changes the bundle.
 * These are the loader rules' own `test` patterns, pinned against that file.
 */
export const TEXT_REWRITTEN_SOURCE = Object.freeze([/theme\/[\w-]+\.ts$/, /static\/variables\/.*\.ts$/]);

/**
 * May this change be judged comment-only? Only an in-place edit (status M) of
 * a `.ts` or `.js` file that no build step rewrites as text. A rename or a copy
 * moves code, so it counts as code however little its text changed; `.tsx` is
 * left out because the lexer is not a JSX parser.
 *
 * @param {{status: string, path: string}} change A parsed diff entry.
 * @returns {boolean} True when isCommentOnlyChange() may judge it.
 */
export function commentOnlyCandidate({ status, path }) {
  return status === 'M' && /\.(ts|js)$/.test(path)
    && !(path.startsWith('handsontable/src/') && TEXT_REWRITTEN_SOURCE.some(r => r.test(path)));
}

/**
 * Is this waiver reason a real one: at least MIN_REASON_WORDS words, and not
 * the `<reason>` placeholder?
 *
 * @param {string} reason The reason text after `Refactor-only:`.
 * @returns {boolean} True when the reason says what the change is.
 */
function isRealReason(reason) {
  const text = reason.trim();

  return !PLACEHOLDER_REASON.test(text) && (text.match(/\p{L}{2,}/gu) ?? []).length >= MIN_REASON_WORDS;
}

/**
 * Is a pure refactor declared in these trailer lines?
 * A `Refactor-only:` trailer whose reason is a real one (see isRealReason).
 *
 * @param {string[]} trailers Commit trailer lines.
 * @returns {boolean} True when a real Refactor-only trailer is present.
 */
export function refactorDeclared(trailers) {
  return trailers.some((line) => {
    const hit = REFACTOR_TRAILER.exec(line.trim());

    return hit !== null && isRealReason(hit[1]);
  });
}

/**
 * Does this commit message declare a pure refactor?
 *
 * @param {string} message The full commit message.
 * @returns {boolean} True when a line is a non-empty `Refactor-only:` trailer.
 */
export function isRefactorCommit(message) {
  return refactorDeclared(String(message ?? '').split('\n'));
}

/**
 * Did `git revert` write this commit?
 *
 * @param {string} message The full commit message.
 * @returns {boolean} True when the message carries `This reverts commit <sha>.`
 */
export function isRevertCommit(message) {
  return REVERT_LINE.test(String(message ?? ''));
}

/**
 * Does this commit declare its own changes a refactor (a trailer) or a
 * restoration (`git revert`)? A merge commit's own edits never do.
 *
 * @param {{message: string, merge?: boolean}} commit A commit.
 * @returns {boolean} True when the commit waives the files it changed.
 */
function isDeclaredCommit(commit) {
  return !commit.merge && (isRefactorCommit(commit.message) || isRevertCommit(commit.message));
}

/**
 * The commits that changed a file under any of its names. Commits come in
 * `git log` order, newest first, so a rename is met before the edits made
 * under the old name: a commit that renames `old` to a name in the lineage
 * adds `old` to it.
 *
 * @param {string} path The file's name at the head of the range.
 * @param {{files: string[], renames?: string[][]}[]} commits The range's commits, newest first.
 * @param {string[]} [aliases] Other names the file had (a rename across the whole range).
 * @returns {object[]} The commits that touched the file.
 */
export function commitsTouching(path, commits, aliases = []) {
  const names = new Set([path, ...aliases]);
  const touching = [];

  for (const commit of commits) {
    for (const [from, to] of commit.renames ?? []) {
      if (names.has(to)) {
        names.add(from);
      }
    }
    if (commit.files.some(file => names.has(file))) {
      touching.push(commit);
    }
  }

  return touching;
}

/**
 * The commits that changed a file without declaring it: what makes the file
 * need a test. The CLI names them in the missing-coverage message.
 *
 * @param {string} path The file's name at the head of the range.
 * @param {object[]} commits The range's commits, newest first.
 * @param {string[]} [aliases] Other names the file had.
 * @returns {object[]} The undeclared commits.
 */
export function undeclaredCommits(path, commits, aliases = []) {
  return commitsTouching(path, commits, aliases).filter(commit => !isDeclaredCommit(commit));
}

/**
 * Is a file waived: did every commit that changed it, under any name, declare
 * a refactor or a revert? A file changed by one refactor commit and one
 * ordinary commit is not waived — the ordinary commit's change needs a test.
 *
 * @param {string} path The file's name at the head of the range.
 * @param {object[]} commits The range's commits, newest first.
 * @param {string[]} [aliases] Other names the file had.
 * @returns {boolean} True when the file is waived.
 */
export function isWaived(path, commits, aliases = []) {
  const touching = commitsTouching(path, commits, aliases);

  return touching.length > 0 && touching.every(isDeclaredCommit);
}

/**
 * Every file the range's declarations waive (see isWaived).
 *
 * @param {object[]} commits The range's commits, newest first.
 * @returns {Set<string>} The waived paths.
 */
export function waivedFiles(commits) {
  const all = new Set(commits.flatMap(commit => commit.files));

  return new Set([...all].filter(file => isWaived(file, commits)));
}

/**
 * Mark the inline code spans between `from` and `to` (one paragraph) as
 * hidden. A span opens at a run of backticks and closes at the next run of the
 * same length; a run with no partner is text. A backslash escapes the first
 * backtick of a run.
 *
 * @param {string} src The description.
 * @param {number} from Where the paragraph starts.
 * @param {number} to Where it ends.
 * @param {Uint8Array} hidden The mask to fill.
 */
function markCodeSpans(src, from, to, hidden) {
  const runEnd = (at) => {
    let end = at;

    while (end < to && src[end] === '`') {
      end += 1;
    }

    return end;
  };
  let i = from;

  while (i < to) {
    if (src[i] !== '`') {
      i += 1;
      continue; // eslint-disable-line no-continue
    }

    const end = runEnd(i);
    let slashes = 0;

    while (i - slashes - 1 >= from && src[i - slashes - 1] === '\\') {
      slashes += 1;
    }

    const open = slashes % 2 === 1 ? i + 1 : i;
    const length = end - open;
    let close = -1;

    for (let k = end; length > 0 && k < to;) {
      if (src[k] === '`') {
        const kEnd = runEnd(k);

        if (kEnd - k === length) {
          close = kEnd;
          break;
        }
        k = kEnd;
      } else {
        k += 1;
      }
    }
    if (close === -1) {
      i = end;
    } else {
      hidden.fill(1, open, close);
      i = close;
    }
  }
}

/**
 * Mark the parts of a PR description that GitHub renders as code: fenced
 * blocks (``` or ~~~, also inside a quote or a list item), indented code
 * blocks, inline code spans, and `<code>`, `<pre>`, `<kbd>`, `<samp>`, and
 * `<tt>` elements. Line endings may be CR LF: the GitHub editor writes them.
 * Characters already hidden (by an HTML comment) are read as blanks. Reading
 * too much as code only makes the gate stricter, so the rules lean that way.
 *
 * @param {string} text The description.
 * @param {Uint8Array} hidden The mask to fill.
 */
function markMarkdownCode(text, hidden) {
  const src = text.split('').map((c, i) => (hidden[i] === 1 && c !== '\n' ? ' ' : c)).join('');
  // Blockquote markers and list markers in front of a line's content.
  const container = /^(?:[ \t]{0,3}(?:>[ \t]?|(?:[-*+]|\d{1,9}[.)])(?=[ \t]|\r?$)[ \t]*))*/;
  let fence = null;
  let paragraph = -1;
  let previous = 'blank';
  const endParagraph = (at) => {
    if (paragraph !== -1) {
      markCodeSpans(src, paragraph, at, hidden);
    }
    paragraph = -1;
  };

  for (let start = 0; start <= src.length;) {
    const newline = src.indexOf('\n', start);
    const end = newline === -1 ? src.length : newline;
    const line = src.slice(start, end);
    const inner = line.slice(container.exec(line)[0].length);
    const opener = /^ {0,3}(`{3,}|~{3,})(.*?)\r?$/.exec(inner);

    if (fence !== null) {
      const closer = /^ {0,3}(`{3,}|~{3,})[ \t]*\r?$/.exec(inner);
      const column = line.length - inner.trimStart().length;

      if (closer && closer[1][0] === fence.run[0] && closer[1].length >= fence.run.length) {
        // A closer indented less than its opener may instead end the list item
        // the fence sat in and open a new fence; that reading hides more, so
        // it is the one taken.
        fence = column < fence.column ? { run: closer[1], column } : null;
      }
      hidden.fill(1, start, end);
    } else if (opener && !(opener[1][0] === '`' && opener[2].includes('`'))) {
      endParagraph(start);
      // The column the fence starts at, list and quote markers included.
      fence = { run: opener[1], column: line.length - inner.trimStart().length };
      hidden.fill(1, start, end);
      previous = 'code';
    } else if (inner.trim() === '') {
      endParagraph(start);
      previous = previous === 'indented' ? 'indented' : 'blank';
    } else if (/^(?: {4}|\t)/.test(inner) && (previous === 'blank' || previous === 'indented')) {
      // An indented code block: it cannot interrupt a paragraph.
      hidden.fill(1, start, end);
      previous = 'indented';
    } else {
      if (paragraph === -1) {
        paragraph = start;
      }
      previous = 'text';
      if (/^ {0,3}#{1,6}(?:[ \t]|\r?$)/.test(inner)) {
        // A heading is a block of its own: a code span cannot leave it.
        endParagraph(end);
      }
    }
    if (newline === -1) {
      break;
    }
    start = newline + 1;
  }
  endParagraph(src.length);

  for (const tag of src.matchAll(/<(code|pre|kbd|samp|tt)\b[^>]*>/gi)) {
    const closer = new RegExp(`</${tag[1]}\\s*>`, 'i').exec(src.slice(tag.index));

    hidden.fill(1, tag.index, closer ? tag.index + closer.index + closer[0].length : src.length);
  }
}

/**
 * Mark the HTML comments of a PR description, as stripHtmlComments() removes
 * them: repeated until nothing reassembles, and an unterminated `<!--` hides
 * the rest. Characters already hidden (by code) are left out of the text the
 * comments are found in.
 *
 * @param {string} text The description.
 * @param {Uint8Array} hidden The mask to fill.
 */
function markHtmlComments(text, hidden) {
  let kept = [];

  for (let i = 0; i < text.length; i += 1) {
    if (hidden[i] !== 1) {
      kept.push(i);
    }
  }
  for (;;) {
    const visible = kept.map(i => text[i]).join('');
    const drop = new Set();

    for (const comment of visible.matchAll(/<!--[\s\S]*?-->/g)) {
      for (let k = comment.index; k < comment.index + comment[0].length; k += 1) {
        drop.add(k);
      }
    }
    if (drop.size === 0) {
      const open = visible.indexOf('<!--');

      if (open !== -1) {
        kept.slice(open).forEach((i) => {
          hidden[i] = 1;
        });
      }

      return;
    }
    kept.forEach((i, k) => {
      if (drop.has(k)) {
        hidden[i] = 1;
      }
    });
    kept = kept.filter((_, k) => !drop.has(k));
  }
}

/**
 * The waiver the PR description declares: `[refactor-only: <reason>]` as
 * prose, with a real reason (see isRealReason). A waiver GitHub shows as code
 * (see markMarkdownCode) or hides in an HTML comment is a quotation – a pasted
 * CI log, an example – and waives nothing. Markdown lets each hide the other
 * (`<!--` inside code is text; a fence inside a comment is hidden), so both
 * orders are read, and the waiver must be prose in both. A pasted instruction
 * or red verdict carries the `<reason>` placeholder, which waives nothing; a
 * real waiver elsewhere in the same body still counts.
 *
 * @param {string|undefined|null} body The live PR description.
 * @returns {string|null} The reason, or null when no waiver is declared.
 */
export function bodyWaiver(body) {
  const text = String(body ?? '');
  const codeFirst = new Uint8Array(text.length);
  const commentsFirst = new Uint8Array(text.length);

  markMarkdownCode(text, codeFirst);
  markHtmlComments(text, codeFirst);
  markHtmlComments(text, commentsFirst);
  markMarkdownCode(text, commentsFirst);

  for (const hit of text.matchAll(BODY_WAIVER)) {
    const last = hit.index + hit[0].length - 1;
    const prose = [hit.index, last].every(at => codeFirst[at] === 0 && commentsFirst[at] === 0);

    if (prose && isRealReason(hit[1])) {
      return hit[1];
    }
  }

  return null;
}

/**
 * Where a `/` in code sits, a regular-expression literal and a division can
 * both be possible. These rules settle the cases that have one answer; every
 * other `/` is read both ways (see stripComments), because a wrong guess lets a
 * comment opener that is really part of a literal hide the code after it.
 *
 * A regex follows these punctuation characters: each needs an operand next.
 */
const REGEX_AFTER_PUNCTUATION = new Set([...'(,=:[&|?{;*%<~^']);
// A regex follows these keywords, which an expression or a new statement
// follows. After `.` or `#` they are property names, and a division follows.
const REGEX_AFTER_KEYWORDS = new Set([
  'return', 'typeof', 'instanceof', 'in', 'new', 'delete', 'throw', 'case', 'do', 'else', 'extends', 'default',
  'break', 'continue', 'debugger',
]);
// Either reading after these words: each is a keyword before an expression in
// one place and something a division can follow in another – a plain
// identifier (`of`, `yield`, `await`), or a type (`x satisfies void / 2`).
const EITHER_AFTER_KEYWORDS = new Set(['of', 'yield', 'await', 'void']);
// A `)` that closes one of these statement heads is followed by a statement,
// so a regex; any other `)` ends an expression, so a division.
const STATEMENT_HEADS = new Set(['if', 'while', 'for', 'with']);
// An identifier character, as JavaScript defines one (`ñreturn` is one word).
const IDENTIFIER_CHAR = /[$\p{ID_Continue}\u200C\u200D]/u;
// A Unicode escape inside an identifier (`a`, `\u{61}`): the only
// backslash code may hold outside a literal.
const IDENTIFIER_ESCAPE = /\\u(?:[0-9a-fA-F]{4}|\{[0-9a-fA-F]+\})/y;
// Line terminators git does not count as line breaks. JavaScript ends a `//`
// comment at each, so code after one would sit on a "comment" line; no source
// file holds one, and a file that does is judged as code.
const UNCOUNTED_LINE_BREAK = /\r(?!\n)|[\u2028\u2029]/;
// Comments a tool in this repo acts on: a `#__PURE__` annotation makes the
// minifier drop the call, a `/// <reference>` changes type checking, a bundler
// or source-map comment changes the bundle, a coverage hint changes the
// coverage floor. They are code, not prose.
const DIRECTIVE_COMMENT = new RegExp([
  String.raw`[@#]__[A-Z][A-Z_]*__`,
  String.raw`^\/\/\/\s*<`,
  String.raw`[@#]\s*source(?:Mapping)?URL\s*=`,
  String.raw`webpack[A-Z]\w*\s*:`,
  String.raw`@vite-ignore`,
  String.raw`@jsx\w*`,
  String.raw`@ts-(?:ignore|expect-error|nocheck|check)\b`,
  String.raw`\b(?:istanbul|c8|v8)\s+ignore\b`,
].join('|'));
const QUOTE_STATES = { "'": 'sq', '"': 'dq', '`': 'tpl' };
const CLOSERS = { sq: "'", dq: '"', regex: '/', class: ']' };
// The most readings the lexer follows at once, and the most times it may fork
// in one file, before it gives up and the file counts as code.
const MAX_READINGS = 64;
const MAX_FORKS = 20000;

/**
 * How a `/` in code reads at this point of one reading, before a line break is
 * taken into account (see slashReading).
 *
 * @param {object} b The reading (see stripComments).
 * @returns {'regex'|'division'|'either'} The reading, or 'either' when both are possible.
 */
function readingOnOneLine(b) {
  if (b.lastKind === '') {
    return 'regex';
  }
  if (b.lastKind === 'word') {
    // An identifier, a number, `this`, a property name, or a keyword.
    const keyword = REGEX_AFTER_KEYWORDS.has(b.word) || EITHER_AFTER_KEYWORDS.has(b.word);

    if (!keyword || b.wordAfter === '.' || b.wordAfter === '#') {
      return 'division';
    }
    if (b.wordAfter === '1.') {
      // `1. in /re/` (the operator) or `1..in / 2` (a property of `1.`).
      return 'either';
    }

    return REGEX_AFTER_KEYWORDS.has(b.word) ? 'regex' : 'either';
  }
  if (b.lastKind === 'literal') {
    // After a string, a template, or a regex literal.
    return 'division';
  }
  if (b.lastKind === 'slash') {
    // After a division.
    return 'regex';
  }
  if (b.last === ')') {
    const head = b.closed;

    if (head === null || head.word === 'await') {
      // An unmatched `)`, or `for await (…)` versus `await (…) / 2`.
      return 'either';
    }
    if (head.property) {
      return 'division';
    }

    return STATEMENT_HEADS.has(head.word) ? 'regex' : 'division';
  }
  if (b.last === ']') {
    return 'division';
  }
  if (b.last === '+' || b.last === '-') {
    // `a++ / 2` divides; `a + /re/` and `-/re/` do not.
    return b.last2 === b.last ? 'either' : 'regex';
  }
  if (b.last === '>') {
    // `=> /re/` is a regex; `>` closing a type argument (`x as A<B> / 2`) is not.
    return b.last2 === '=' ? 'regex' : 'either';
  }

  // `}` (a block or an object), `!` (`!/re/` or TypeScript's `x! / 2`), `.`
  // (`...`/`1.`), and anything unexpected.
  return REGEX_AFTER_PUNCTUATION.has(b.last) ? 'regex' : 'either';
}

/**
 * How a `/` in code reads at this point of one reading. A line break before it
 * can end the statement (ASI: `let x` or `type A = B`, then `/re/.test(s)` on
 * the next line), so across one a division is never certain.
 *
 * @param {object} b The reading (see stripComments).
 * @returns {'regex'|'division'|'either'} The reading, or 'either' when both are possible.
 */
function slashReading(b) {
  const reading = readingOnOneLine(b);

  return reading === 'division' && b.lineBreak ? 'either' : reading;
}

/**
 * Record that the reading's current line holds code.
 *
 * @param {object} b The reading.
 */
function markLine(b) {
  if (b.segLines[b.segLines.length - 1] !== b.line) {
    b.segLines.push(b.line);
  }
}

/**
 * Emit a code character, turning any whitespace before it into one space.
 *
 * @param {object} b The reading.
 * @param {string} c The character.
 * @param {string} [kind] What it is: 'slash' for a division, 'word' for part of
 *   an identifier escape; by default 'word' for an identifier character and
 *   'punct' for anything else.
 */
function emit(b, c, kind) {
  const isWord = kind === 'word' || (kind === undefined && IDENTIFIER_CHAR.test(c));

  if (isWord && (b.lastKind !== 'word' || b.gap)) {
    // A new word: remember what came before it, to tell `a.return` from `return`.
    b.word = '';
    b.numeric = /[0-9]/.test(c);
    if (b.lastKind !== 'punct') {
      b.wordAfter = '';
    } else if (b.last === '.' && b.numberDot) {
      b.wordAfter = '1.';
    } else {
      b.wordAfter = b.last === '.' && b.last2 === '.' ? '...' : b.last;
    }
  }
  if (c === '.' && !b.gap) {
    // A dot right after a number may belong to it (`1.`), so the word after it
    // is not surely a property name.
    b.numberDot = (b.lastKind === 'word' && b.numeric) || (b.last === '.' && b.numberDot);
  } else if (c === '.') {
    b.numberDot = false;
  }
  if (isWord) {
    b.word += c;
  }
  if (b.gap && b.any) {
    b.seg += ' ';
  }
  b.last2 = b.gap ? '' : b.last;
  b.gap = false;
  b.lineBreak = false;
  b.seg += c;
  b.any = true;
  markLine(b);
  b.last = c;
  b.lastKind = isWord ? 'word' : (kind ?? 'punct');
}

/**
 * Emit a literal's character verbatim.
 *
 * @param {object} b The reading.
 * @param {string} c The character.
 */
function raw(b, c) {
  b.seg += c;
  b.any = true;
  markLine(b);
}

/**
 * Emit a stretch of source verbatim, counting the lines it spans.
 *
 * @param {object} b The reading.
 * @param {string} text The stretch.
 */
function rawText(b, text) {
  for (const c of text) {
    if (c === '\n') {
      b.seg += c;
      b.line += 1;
    } else {
      raw(b, c);
    }
  }
}

/**
 * The reading has just closed a string, template, or regex literal.
 *
 * @param {object} b The reading.
 * @param {string} c The closing character.
 */
function closeLiteral(b, c) {
  b.last = c;
  b.last2 = '';
  b.lastKind = 'literal';
  b.lineBreak = false;
  b.state = 'code';
}

/**
 * Handle a `//` or `/*` comment that starts at b.i. A directive comment (see
 * DIRECTIVE_COMMENT) is code, emitted verbatim; any other comment is skipped.
 *
 * @param {object} b The reading; mutated.
 * @param {string} text The file's contents.
 * @param {boolean} block True for `/*`, false for `//`.
 */
function openComment(b, text, block) {
  const close = block ? text.indexOf('*/', b.i + 2) : text.indexOf('\n', b.i);
  const end = close === -1 ? text.length : close + (block ? 2 : 0);
  const comment = text.slice(b.i, end);

  if (DIRECTIVE_COMMENT.test(comment) && (close !== -1 || !block)) {
    if (b.gap && b.any) {
      b.seg += ' ';
    }
    b.gap = true;
    rawText(b, comment);
    b.i = end;

    return;
  }
  b.state = block ? 'block' : 'line';
  b.i += 2;
}

/**
 * Advance one reading through the rest of its current line.
 *
 * @param {object} b The reading; mutated.
 * @param {string} text The file's contents.
 * @returns {'line'|'end'|'fork'|'dead'} 'line' after a line break, 'end' at
 *   the end of the file, 'fork' at a `/` that can read either way (b.i stays on
 *   it), 'dead' when this reading cannot be how the file lexes.
 */
function advance(b, text) {
  while (b.i < text.length) {
    const c = text[b.i];
    const next = text[b.i + 1];

    if (c === '\n') {
      if (b.state === 'line' || b.state === 'hashbang') {
        b.state = 'code';
      }
      if (b.state === 'code') {
        b.gap = true;
        b.lineBreak = true;
      } else if (b.state === 'block') {
        // A comment holding a line break is one for ASI.
        b.lineBreak = true;
      } else if (b.state === 'tpl') {
        b.seg += c;
      } else {
        // A string, a regex, or a regex class does not span lines.
        return 'dead';
      }
      b.line += 1;
      b.i += 1;

      return 'line';
    }

    if (b.state === 'line') {
      b.i += 1;
    } else if (b.state === 'hashbang') {
      // `#!…` on the first line: a comment to JavaScript, but the shell reads
      // it, so it is kept verbatim as code.
      raw(b, c);
      b.i += 1;
    } else if (b.state === 'block') {
      if (c === '*' && next === '/') {
        b.state = 'code';
        b.gap = true;
        b.i += 2;
      } else {
        b.i += 1;
      }
    } else if (b.state === 'code') {
      if (c === '/' && (next === '/' || next === '*')) {
        if (text[b.i - 1] === '\\') {
          return 'dead';
        }
        openComment(b, text, next === '*');
      } else if (/\s/.test(c)) {
        b.gap = true;
        b.i += 1;
      } else if (c === '\\') {
        IDENTIFIER_ESCAPE.lastIndex = b.i;

        const escape = IDENTIFIER_ESCAPE.exec(text);

        if (escape === null) {
          // Outside a literal, a backslash can only start an identifier escape.
          return 'dead';
        }
        for (const e of escape[0]) {
          emit(b, e, 'word');
        }
        b.i += escape[0].length;
      } else if (c === '/') {
        const reading = b.forced ?? slashReading(b);

        if (reading === 'either') {
          return 'fork';
        }
        b.forced = null;
        if (reading === 'regex') {
          emit(b, c);
          b.state = 'regex';
        } else {
          emit(b, c, 'slash');
        }
        b.i += 1;
      } else if (c === '}' && b.braces.length > 0 && b.braces[b.braces.length - 1] === 0) {
        // The end of a template's `${…}`: back to the template's text.
        b.braces.pop();
        emit(b, c);
        b.state = 'tpl';
        b.i += 1;
      } else {
        if (c === '{' && b.braces.length > 0) {
          b.braces[b.braces.length - 1] += 1;
        } else if (c === '}' && b.braces.length > 0) {
          b.braces[b.braces.length - 1] -= 1;
        }
        if (c === '(') {
          const word = b.lastKind === 'word';

          b.parens.push({
            word: word ? b.word : '',
            property: word && (b.wordAfter === '.' || b.wordAfter === '#'),
          });
        }

        const closed = c === ')' ? (b.parens.pop() ?? null) : undefined;

        emit(b, c);
        if (closed !== undefined) {
          b.closed = closed;
        }
        b.state = QUOTE_STATES[c] ?? 'code';
        b.i += 1;
      }
    } else if (b.state === 'tpl') {
      if (c === '\\') {
        // An escape; `\` before CR LF continues the line.
        const width = next === '\r' && text[b.i + 2] === '\n' ? 3 : 2;

        rawText(b, text.slice(b.i, b.i + width));
        b.i += width;
      } else if (c === '`') {
        raw(b, c);
        closeLiteral(b, c);
        b.i += 1;
      } else if (c === '$' && next === '{') {
        raw(b, '$');
        raw(b, '{');
        b.last = '{';
        b.last2 = '';
        b.lastKind = 'punct';
        b.braces.push(0);
        b.state = 'code';
        b.i += 2;
      } else {
        raw(b, c);
        b.i += 1;
      }
    } else if (c === '\\') {
      // An escape in a string ('sq', 'dq'), a regex, or a regex character
      // class ('class'). A string may continue past a line break (CR LF
      // included); a regex may not.
      if ((next === '\n' || next === '\r') && (b.state === 'regex' || b.state === 'class')) {
        return 'dead';
      }

      const width = next === '\r' && text[b.i + 2] === '\n' ? 3 : 2;

      rawText(b, text.slice(b.i, b.i + width));
      b.i += width;
    } else {
      raw(b, c);
      if (c === CLOSERS[b.state]) {
        if (b.state === 'class') {
          b.state = 'regex';
        } else {
          closeLiteral(b, c);
        }
      } else if (b.state === 'regex' && c === '[') {
        b.state = 'class';
      }
      b.i += 1;
    }
  }

  return 'end';
}

/**
 * Copy a reading, so that two readings can go separate ways from a fork. The
 * objects on the parenthesis stack are never mutated, so they are shared.
 *
 * @param {object} b The reading.
 * @param {'regex'|'division'} forced How the copy reads the `/` it stands on.
 * @returns {object} The copy.
 */
function forkReading(b, forced) {
  return {
    ...b, braces: b.braces.slice(), parens: b.parens.slice(), segLines: b.segLines.slice(), forced,
  };
}

/**
 * The state that decides how a reading lexes from here on.
 *
 * @param {object} b The reading.
 * @returns {string} A key that two readings share only when they will lex the rest alike.
 */
function readingKey(b) {
  return JSON.stringify([
    b.state, b.braces, b.parens, b.closed, b.gap, b.lineBreak, b.last, b.last2, b.lastKind, b.word, b.wordAfter,
    b.numeric, b.numberDot, b.forced,
  ]);
}

/**
 * Can a reading that reached the end of the file be how a file that parses
 * lexes? Not if it is still inside a comment, a literal, or a `${…}`.
 *
 * @param {object} b The reading.
 * @returns {boolean} True when the reading ended cleanly.
 */
function endedCleanly(b) {
  return b.braces.length === 0 && ['code', 'line', 'hashbang'].includes(b.state);
}

/**
 * Strip the comments out of JavaScript or TypeScript source, and report which
 * lines hold code. A small lexer: `//` and `/* … *\/` are comments, except
 * inside a string, template, or regular-expression literal, whose contents are
 * kept verbatim. A template's `${…}` is lexed as code again, nested templates
 * included, so a comment opener inside one cannot start a comment. Whitespace
 * outside literals collapses to one space, so a comment that sat between two
 * tokens leaves the same text as no comment at all. A comment a tool acts on
 * (DIRECTIVE_COMMENT) and a leading `#!` line are kept as code.
 *
 * It never guesses whether a `/` starts a regex or divides. Where the rules in
 * slashReading() have one answer it takes it; everywhere else it follows both
 * readings, drops a reading that breaks (a regex running into a line break, a
 * backslash outside a literal), and requires every reading still standing to
 * produce the same text for each line. The file's real lexing is always one of
 * the readings, so their agreement proves the text; when they disagree,
 * `complete` is false.
 *
 * It is not a JSX parser: text inside JSX reads as code or as comments by
 * accident, which is why the CLI does not ask it about `.tsx` files.
 * `complete` is false when the readings disagree or all break, when the file
 * ends inside a comment or a literal, when the file holds a line terminator git
 * does not count (UNCOUNTED_LINE_BREAK), or past MAX_READINGS readings or
 * MAX_FORKS forks – any sign it lost its place – and callers must then treat
 * the file as code.
 *
 * @param {string} text The file's contents.
 * @returns {{text: string, codeLines: Set<number>, complete: boolean}} The
 *   stripped text, the 1-based numbers of lines holding code, and whether the
 *   lexer ended outside every comment and literal.
 */
export function stripComments(text) {
  const codeLines = new Set();
  let out = '';
  let forks = 0;
  let readings = [{
    i: 0, line: 1, state: text.startsWith('#!') ? 'hashbang' : 'code', braces: [], parens: [], closed: null,
    gap: false, lineBreak: false, any: false, last: '', last2: '', lastKind: '', word: '', wordAfter: '',
    numeric: false, numberDot: false, forced: null, seg: '', segLines: [],
  }];
  const incomplete = () => ({ text: out, codeLines, complete: false });

  if (UNCOUNTED_LINE_BREAK.test(text)) {
    return incomplete();
  }

  for (;;) {
    const ended = [];
    const work = readings;

    while (work.length > 0) {
      const b = work.pop();
      const status = advance(b, text);

      if (status === 'fork') {
        forks += 1;
        if (forks > MAX_FORKS || ended.length + work.length + 2 > MAX_READINGS) {
          return incomplete();
        }
        work.push(forkReading(b, 'regex'), forkReading(b, 'division'));
      } else if (status === 'line' || (status === 'end' && endedCleanly(b))) {
        // A dead reading, or one that ends inside a comment or a literal,
        // cannot be how a file that parses lexes.
        ended.push({ b, status });
      }
    }
    if (ended.length === 0) {
      return incomplete();
    }

    const [{ b: first, status }] = ended;
    const lines = first.segLines.join();

    if (ended.some(({ b }) => b.i !== first.i || b.seg !== first.seg || b.segLines.join() !== lines)) {
      return incomplete();
    }
    out += first.seg;
    first.segLines.forEach(n => codeLines.add(n));
    if (status === 'end') {
      return { text: out, codeLines, complete: true };
    }

    const seen = new Set();

    readings = [];
    for (const { b } of ended) {
      const key = ended.length > 1 ? readingKey(b) : '';

      if (!seen.has(key)) {
        seen.add(key);
        b.seg = '';
        b.segLines = [];
        readings.push(b);
      }
    }
  }
}

/**
 * Does a diff change comments and whitespace only? True only when all of
 * these hold, so a lexer slip can make the gate stricter but never looser:
 * both versions lex completely, their comment-stripped texts are identical,
 * the diff names the lines it changed (a diff git calls binary names none), and
 * no removed or added line holds code in its own version.
 *
 * @param {{baseText: string, headText: string, removed: number[], added: number[]}} change
 *   Both versions of the file, and the 1-based numbers of the lines the diff
 *   removed (in the base) and added (in the head).
 * @returns {boolean} True when the change cannot alter behavior.
 */
export function isCommentOnlyChange({ baseText, headText, removed, added }) {
  if (baseText !== headText && removed.length === 0 && added.length === 0) {
    return false;
  }

  const base = stripComments(baseText);
  const head = stripComments(headText);

  if (!base.complete || !head.complete || base.text !== head.text) {
    return false;
  }

  return !removed.some(n => base.codeLines.has(n)) && !added.some(n => head.codeLines.has(n));
}

/**
 * Normalize the second argument of evaluate(). An array of strings is the
 * squashed form — one message for the whole change set (trailer lines, or a
 * squash commit's body) — and waives every changed file it declares a refactor
 * for, which is exactly one commit's worth. Replaying develop's squash history
 * needs it; the CLI passes real commits.
 *
 * @param {{status: string, path: string}[]} changes Parsed diff entries.
 * @param {Array<{message: string, files: string[]}>|string[]} commits Commits, or message lines.
 * @returns {{message: string, files: string[]}[]} Commits.
 */
function toCommits(changes, commits) {
  if (commits.length > 0 && typeof commits[0] === 'string') {
    return [{ message: commits.join('\n'), files: changes.map(c => c.path) }];
  }

  return commits;
}

/**
 * Evaluate a change set against the gate.
 *
 * @param {{status: string, path: string}[]} changes Parsed diff entries.
 * @param {Array<{message: string, files: string[]}>|string[]} [commits] The
 *   range's commits, or the squashed form (see toCommits).
 * @param {{commentOnly?: string[], bodyWaiver?: string|null}} [options]
 *   `commentOnly`: source files whose diff changes comments and whitespace only
 *   (see isCommentOnlyChange) — they need no test. `bodyWaiver`: the reason
 *   the PR description gives in `[refactor-only: <reason>]` (see bodyWaiver())
 *   — it waives every file a commit trailer did not.
 * @returns {{ pass: boolean, sourceFiles: string[], newJasmine: string[],
 *   uncovered: {group: string, files: string[]}[], waived: string[],
 *   bodyWaived: string[], bodyWaiver: string|null, commentOnly: string[],
 *   reason: string }} Verdict and the data needed to build a PR comment.
 */
export function evaluate(changes, commits = [], { commentOnly = [], bodyWaiver: bodyReason = null } = {}) {
  const sourceFiles = changes.filter(isSource).map(c => c.path);
  const newJasmine = changes.filter(isNewJasmineSpec).map(c => c.path);

  // New Jasmine specs are always a violation (steer to Playwright), independent
  // of whether other coverage exists.
  if (newJasmine.length > 0) {
    return {
      pass: false,
      sourceFiles,
      newJasmine,
      uncovered: [],
      waived: [],
      bodyWaived: [],
      bodyWaiver: bodyReason,
      commentOnly: [],
      reason: 'new-jasmine-spec',
    };
  }

  const covered = new Set(changes.filter(isCoverage).flatMap(c => coverageGroups(c.path)));
  const allCommits = toCommits(changes, commits);
  const commentFiles = new Set(commentOnly);
  const byGroup = new Map();
  const waived = [];
  const bodyWaived = [];
  const comments = [];

  for (const change of changes.filter(isSource)) {
    const file = change.path;
    const group = sourceGroup(file);
    const aliases = change.oldPath && change.oldPath !== file ? [change.oldPath] : [];

    if (covered.has(group)) {
      continue;
    }
    if (commentFiles.has(file)) {
      comments.push(file);
      continue;
    }
    if (isWaived(file, allCommits, aliases)) {
      waived.push(file);
      continue;
    }
    if (bodyReason) {
      bodyWaived.push(file);
      continue;
    }
    if (!byGroup.has(group)) {
      byGroup.set(group, []);
    }
    byGroup.get(group).push(file);
  }

  const uncovered = [...byGroup].map(([group, files]) => ({ group, files }));

  const verdict = {
    sourceFiles, newJasmine, uncovered, waived, bodyWaived, bodyWaiver: bodyReason, commentOnly: comments,
  };

  if (uncovered.length > 0) {
    return { pass: false, ...verdict, reason: 'missing-coverage' };
  }
  if (waived.length > 0 || bodyWaived.length > 0) {
    return { pass: true, ...verdict, reason: 'refactor-declared' };
  }
  if (comments.length > 0) {
    return { pass: true, ...verdict, reason: 'comments-only' };
  }

  return { pass: true, ...verdict, reason: 'ok' };
}
