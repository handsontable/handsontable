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
 * The waiver the PR description declares: `[refactor-only: <reason>]`, outside
 * HTML comments (the caller strips them), with a non-empty reason.
 *
 * @param {string|undefined|null} body The live PR body, comments stripped.
 * @returns {string|null} The reason, or null when no waiver is declared.
 */
export function bodyWaiver(body) {
  const hit = /\[refactor-only:\s*([^\]]*?\S)\s*\]/i.exec(String(body ?? ''));

  return hit ? hit[1] : null;
}

/**
 * A `/` in code starts a regular-expression literal after these characters,
 * and is division after anything else (an identifier, a number, `)` or `]`).
 * `}` counts as a regex start: when it is wrong, the lexer keeps a division's
 * operand as literal text, which reads as code — the safe direction.
 */
const REGEX_AFTER_CHARS = new Set([...'(,=:[!&|?{};+-*%<>~^}']);
const REGEX_AFTER_WORDS = new Set([
  'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield',
  'await',
]);
const IDENTIFIER_CHAR = /[\w$]/;

/**
 * Strip the comments out of JavaScript or TypeScript source, and report which
 * lines hold code. A small lexer: `//` and `/* … *\/` are comments, except
 * inside a string, template, or regular-expression literal, whose contents are
 * kept verbatim. A template's `${…}` is lexed as code again, nested templates
 * included, so a comment opener inside one cannot start a comment. Whitespace
 * outside literals collapses to one space, so a comment that sat between two
 * tokens leaves the same text as no comment at all.
 *
 * A `/` is a regex literal after an operator, punctuation, or a keyword such
 * as `return`, and division after an identifier, a number, `)` or `]` (see
 * REGEX_AFTER_CHARS). It is not a JSX parser: text inside JSX reads as code
 * or as comments by accident, which is why the CLI does not ask it about
 * `.tsx` files. `complete` is false when the file ends inside a comment or a
 * literal, when a string or a regex runs into a line break, or when a comment
 * opens right after a backslash — any sign it lost its place — and callers
 * must then treat the file as code.
 *
 * @param {string} text The file's contents.
 * @returns {{text: string, codeLines: Set<number>, complete: boolean}} The
 *   stripped text, the 1-based numbers of lines holding code, and whether the
 *   lexer ended outside every comment and literal.
 */
export function stripComments(text) {
  const codeLines = new Set();
  // One entry per open `${`: how many `{` are open inside it.
  const braces = [];
  let out = '';
  let state = 'code';
  let line = 1;
  let gap = false;
  let broken = false;
  let last = '';
  let word = '';
  let i = 0;

  // Emit a code character, turning any whitespace before it into one space.
  const emit = (c) => {
    const joined = !gap && IDENTIFIER_CHAR.test(last);

    if (gap && out.length > 0) {
      out += ' ';
    }
    gap = false;
    out += c;
    codeLines.add(line);
    if (IDENTIFIER_CHAR.test(c)) {
      word = joined ? word + c : c;
    }
    last = c;
  };
  // Emit a literal's character verbatim.
  const raw = (c) => {
    out += c;
    codeLines.add(line);
  };

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
      } else if (state !== 'block') {
        // A string, a regex, or a regex class does not span lines.
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
        if (text[i - 1] === '\\') {
          broken = true;
        }
        state = 'block';
        i += 2;
      } else if (/\s/.test(c)) {
        gap = true;
        i += 1;
      } else if (c === '/') {
        const regex = last === '' || REGEX_AFTER_CHARS.has(last)
          || (IDENTIFIER_CHAR.test(last) && REGEX_AFTER_WORDS.has(word));

        emit(c);
        if (regex) {
          state = 'regex';
        }
        i += 1;
      } else if (c === '}' && braces.length > 0 && braces[braces.length - 1] === 0) {
        // The end of a template's `${…}`: back to the template's text.
        braces.pop();
        emit(c);
        state = 'tpl';
        i += 1;
      } else {
        if (c === '{' && braces.length > 0) {
          braces[braces.length - 1] += 1;
        } else if (c === '}' && braces.length > 0) {
          braces[braces.length - 1] -= 1;
        }
        emit(c);
        state = { "'": 'sq', '"': 'dq', '`': 'tpl' }[c] ?? 'code';
        i += 1;
      }
    } else if (state === 'tpl') {
      if (c === '\\') {
        raw(c);
        raw(next ?? '');
        line += next === '\n' ? 1 : 0;
        i += 2;
      } else if (c === '`') {
        raw(c);
        last = c;
        state = 'code';
        i += 1;
      } else if (c === '$' && next === '{') {
        raw('${');
        last = '{';
        braces.push(0);
        state = 'code';
        i += 2;
      } else {
        raw(c);
        i += 1;
      }
    } else {
      // A string ('sq', 'dq'), a regex, or a regex character class ('class').
      raw(c);
      if (c === '\\') {
        raw(next ?? '');
        line += next === '\n' ? 1 : 0;
        i += 2;
      } else {
        const closes = { sq: "'", dq: '"', regex: '/', class: ']' }[state];

        if (c === closes) {
          last = c;
          state = state === 'class' ? 'regex' : 'code';
        } else if (state === 'regex' && c === '[') {
          state = 'class';
        }
        i += 1;
      }
    }
  }

  return {
    text: out,
    codeLines,
    complete: !broken && braces.length === 0 && (state === 'code' || state === 'line'),
  };
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
