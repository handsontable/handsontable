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

const REFACTOR_TRAILER = /^Refactor-only:\s*\S/i;
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
 * Is a source change present?
 *
 * @param {{status: string, path: string}} change A parsed diff entry.
 * @returns {boolean} True when the change is production source needing a test.
 */
export function isSource({ path }) {
  return classify(path) === 'source';
}

/**
 * Is a pure refactor declared in these trailer lines?
 * A `Refactor-only:` trailer with a non-empty reason.
 *
 * @param {string[]} trailers Commit trailer lines.
 * @returns {boolean} True when a non-empty Refactor-only trailer is present.
 */
export function refactorDeclared(trailers) {
  return trailers.some(t => REFACTOR_TRAILER.test(t.trim()));
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
 * The files a declaration waives: those that every commit touching them
 * declares a refactor or a revert. A file changed by one refactor commit and
 * one ordinary commit is not waived — the ordinary commit's change needs a test.
 *
 * @param {{message: string, files: string[]}[]} commits The range's commits.
 * @returns {Set<string>} The waived paths.
 */
export function waivedFiles(commits) {
  const touches = new Map();

  for (const { message, files } of commits) {
    const refactor = isRefactorCommit(message) || isRevertCommit(message);

    for (const file of files) {
      if (!touches.has(file)) {
        touches.set(file, []);
      }
      touches.get(file).push(refactor);
    }
  }

  return new Set([...touches].filter(([, flags]) => flags.every(Boolean)).map(([file]) => file));
}

/**
 * Strip the comments out of JavaScript or TypeScript source, and report which
 * lines hold code. A small lexer: `//` and `/* … *\/` are comments, except
 * inside a string or template literal, whose contents are kept verbatim.
 * Whitespace outside literals collapses to one space, so a comment that sat
 * between two tokens leaves the same text as no comment at all.
 *
 * It does not recognize regular-expression literals, or `${…}` inside a
 * template (the whole template is kept as text, so a comment in there reads as
 * code — the safe direction). A regex literal that contains a comment opener
 * can derail it; `complete` is false when the file ends inside a comment or
 * a literal, and callers must then treat the file as code.
 *
 * @param {string} text The file's contents.
 * @returns {{text: string, codeLines: Set<number>, complete: boolean}} The
 *   stripped text, the 1-based numbers of lines holding code, and whether the
 *   lexer ended outside every comment and literal.
 */
export function stripComments(text) {
  const codeLines = new Set();
  let out = '';
  let state = 'code';
  let line = 1;
  let gap = false;
  let broken = false;
  let i = 0;

  while (i < text.length) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '\n') {
      if (state === 'line') {
        state = 'code';
      }
      if (state === 'code') {
        gap = true;
      } else if (state === 'tpl') {
        out += c;
      } else if (state === 'sq' || state === 'dq') {
        broken = true;
      }
      line += 1;
      i += 1;
    } else if (state === 'line') {
      i += 1;
    } else if (state === 'block') {
      if (c === '*' && next === '/') {
        state = 'code';
        gap = true;
        i += 2;
      } else {
        i += 1;
      }
    } else if (state === 'code') {
      if (c === '/' && next === '/') {
        state = 'line';
        i += 2;
      } else if (c === '/' && next === '*') {
        state = 'block';
        i += 2;
      } else if (/\s/.test(c)) {
        gap = true;
        i += 1;
      } else {
        if (gap && out.length > 0) {
          out += ' ';
        }
        gap = false;
        out += c;
        codeLines.add(line);
        state = { "'": 'sq', '"': 'dq', '`': 'tpl' }[c] ?? 'code';
        i += 1;
      }
    } else {
      // Inside a string or template literal: kept verbatim.
      out += c;
      codeLines.add(line);
      if (c === '\\') {
        if (next === '\n') {
          line += 1;
        }
        out += next ?? '';
        i += 2;
      } else {
        if ((state === 'sq' && c === "'") || (state === 'dq' && c === '"') || (state === 'tpl' && c === '`')) {
          state = 'code';
        }
        i += 1;
      }
    }
  }

  return { text: out, codeLines, complete: !broken && (state === 'code' || state === 'line') };
}

/**
 * Does a diff change comments and whitespace only? True only when all of
 * these hold, so a lexer slip can make the gate stricter but never looser:
 * both versions lex completely, their comment-stripped texts are identical,
 * and no removed or added line holds code in its own version.
 *
 * @param {{baseText: string, headText: string, removed: number[], added: number[]}} change
 *   Both versions of the file, and the 1-based numbers of the lines the diff
 *   removed (in the base) and added (in the head).
 * @returns {boolean} True when the change cannot alter behavior.
 */
export function isCommentOnlyChange({ baseText, headText, removed, added }) {
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
 * @param {{commentOnly?: string[]}} [options] `commentOnly`: source files whose
 *   diff changes comments and whitespace only (see isCommentOnlyChange). They
 *   need no test.
 * @returns {{ pass: boolean, sourceFiles: string[], newJasmine: string[],
 *   uncovered: {group: string, files: string[]}[], waived: string[],
 *   commentOnly: string[], reason: string }} Verdict and the data needed to
 *   build a PR comment.
 */
export function evaluate(changes, commits = [], { commentOnly = [] } = {}) {
  const sourceFiles = changes.filter(isSource).map(c => c.path);
  const newJasmine = changes.filter(isNewJasmineSpec).map(c => c.path);

  // New Jasmine specs are always a violation (steer to Playwright), independent
  // of whether other coverage exists.
  if (newJasmine.length > 0) {
    return {
      pass: false, sourceFiles, newJasmine, uncovered: [], waived: [], commentOnly: [], reason: 'new-jasmine-spec',
    };
  }

  const covered = new Set(changes.filter(isCoverage).flatMap(c => coverageGroups(c.path)));
  const refactorFiles = waivedFiles(toCommits(changes, commits));
  const commentFiles = new Set(commentOnly);
  const byGroup = new Map();
  const waived = [];
  const comments = [];

  for (const file of sourceFiles) {
    const group = sourceGroup(file);

    if (covered.has(group)) {
      continue;
    }
    if (commentFiles.has(file)) {
      comments.push(file);
      continue;
    }
    if (refactorFiles.has(file)) {
      waived.push(file);
      continue;
    }
    if (!byGroup.has(group)) {
      byGroup.set(group, []);
    }
    byGroup.get(group).push(file);
  }

  const uncovered = [...byGroup].map(([group, files]) => ({ group, files }));

  const verdict = { sourceFiles, newJasmine, uncovered, waived, commentOnly: comments };

  if (uncovered.length > 0) {
    return { pass: false, ...verdict, reason: 'missing-coverage' };
  }
  if (waived.length > 0) {
    return { pass: true, ...verdict, reason: 'refactor-declared' };
  }
  if (comments.length > 0) {
    return { pass: true, ...verdict, reason: 'comments-only' };
  }

  return { pass: true, ...verdict, reason: 'ok' };
}
