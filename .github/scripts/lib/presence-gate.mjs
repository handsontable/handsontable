/**
 * Presence gate — pure classifier and evaluator.
 *
 * Decides whether a set of changed files satisfies the "source changed ⇒ a
 * matching test changed" rule, which kind of new coverage is valid, and whether
 * a new Jasmine spec was added (which is not allowed — the Jasmine suite is
 * frozen; new E2E is Playwright). No git or filesystem access lives here so the
 * logic is unit-testable; the CLI wrapper feeds it a parsed diff.
 *
 * A "change" is `{ status, path }` where status is a git name-status letter
 * (A added, M modified, R renamed, D deleted, ...).
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
 * Test files that count as coverage regardless of git status.
 */
const COVERAGE_ANY_STATUS = [
  /\.unit\.[jt]sx?$/,       // Jest unit
  /\.types\.ts$/,           // public-API type-surface tests
  /\.spec\.tsx?$/,          // Playwright (tests/), wrapper (.spec.tsx/.ts), visual (.spec.ts)
];

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

/**
 * Classify a single path as 'source', 'test', or 'neither' (status-independent
 * view, used by tests and reporting).
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
 * Does this change count as coverage that satisfies the gate?
 * Modified `*.spec.js` counts; a newly added `*.spec.js` does not.
 *
 * @param {{status: string, path: string}} change A parsed diff entry.
 * @returns {boolean} True when the change satisfies the "a test changed" rule.
 */
export function isCoverage({ status, path }) {
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
 * Is a pure refactor declared for this change set?
 * A `Refactor-only:` commit trailer with a non-empty reason.
 *
 * @param {string[]} trailers Commit trailer lines from the PR range.
 * @returns {boolean} True when a non-empty Refactor-only trailer is present.
 */
export function refactorDeclared(trailers) {
  return trailers.some(t => /^Refactor-only:\s*\S/i.test(t.trim()));
}

/**
 * Evaluate a change set against the gate.
 *
 * @param {{status: string, path: string}[]} changes Parsed diff entries.
 * @param {string[]} [trailers] Commit trailer lines from the PR range.
 * @returns {{ pass: boolean, sourceFiles: string[], newJasmine: string[],
 *   reason: string }} Verdict and the data needed to build a PR comment.
 */
export function evaluate(changes, trailers = []) {
  const sourceFiles = changes.filter(isSource).map(c => c.path);
  const newJasmine = changes.filter(isNewJasmineSpec).map(c => c.path);
  const hasCoverage = changes.some(isCoverage);
  const declared = refactorDeclared(trailers);

  // New Jasmine specs are always a violation (steer to Playwright), independent
  // of whether other coverage exists.
  if (newJasmine.length > 0) {
    return {
      pass: false,
      sourceFiles,
      newJasmine,
      reason: 'new-jasmine-spec',
    };
  }

  if (sourceFiles.length > 0 && !hasCoverage) {
    if (declared) {
      return { pass: true, sourceFiles, newJasmine, reason: 'refactor-declared' };
    }
    return { pass: false, sourceFiles, newJasmine, reason: 'missing-coverage' };
  }

  return { pass: true, sourceFiles, newJasmine, reason: 'ok' };
}
