import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// The stability matrix is the acceptance instrument for visual-suite flakes: it
// renders one commit on N runners and reports what differed. Two properties make
// it safe to dispatch from any branch without a fork guard, and both are the kind
// that erode silently:
//
//   1. it must stay credential-free and write nothing: no secret, no comment, no
//      label, no publish — the verdict goes to the job summary only. The moment a
//      step writes through the API it needs the canonical fork guard and a place
//      in fork-guards.test.mjs;
//   2. it must stay a probe, not a second suite: only the spec groups under
//      investigation render, or a dispatch costs ten full renders.
//
// Text-based, like fork-guards.test.mjs: no YAML parser is a dependency of the
// repo root.

const root = repoRoot();
const read = (rel) => readFileSync(path.join(root, rel), 'utf8');
const workflow = read('.github/workflows/visual-stability.yml');

test('the stability matrix is dispatch-only and reads nothing but the repository', () => {
  assert.match(workflow, /^on:\n  workflow_dispatch:/m, 'the matrix must be dispatch-only');
  assert.doesNotMatch(workflow, /^\s+(push|pull_request|schedule):/m, 'a scheduled or event-driven '
    + 'trigger turns the probe into a suite; the nightly full render is a separate workflow');
  assert.match(workflow, /^permissions:\n  contents: read\n/m, 'the workflow must ask for read access only');
  assert.doesNotMatch(workflow, /secrets\./, 'the matrix must not read a secret — it renders and compares, '
    + 'it never publishes to R2');
  assert.doesNotMatch(workflow, /sticky-pull-request-comment|gh pr edit|gh api .*(comments|labels)|aws s3/,
    'the matrix must not comment, label, or publish; the verdict belongs in the job summary');
  assert.match(workflow, /GITHUB_STEP_SUMMARY/, 'the verdict must reach the job summary');
});

test('the matrix renders only the spec groups under investigation', () => {
  assert.match(workflow, /MULTI_SPECS: tests\/multi-frameworks\/filters/, 'the multi-framework render must stay '
    + 'scoped to the filters family');
  assert.match(workflow, /CROSS_SPECS: selection/, 'the cross-browser render must stay scoped to the selection spec');
  assert.doesNotMatch(workflow, /npm run in visual-tests test(:cross-browser)?\b/, 'the matrix must not run '
    + 'the full suite through run-tests.mjs');
});

test('the render job composes the screenshot tree the way visual.yml does', () => {
  // partial-packaging.test.mjs asserts the types and language packs; this pins
  // that the job builds the package at all rather than expecting artifacts a
  // dispatch never has.
  assert.match(workflow, /build:es\b/);
  assert.match(workflow, /postbuild:partial/);
  assert.match(workflow, /examples:install next\/visual-tests/);
});

test('the verdict step runs the checked-in script, and the script exists', () => {
  assert.match(workflow, /node \.\/visual-tests\/scripts\/stability-verdict\.mjs runs/);
  assert.ok(existsSync(path.join(root, 'visual-tests/scripts/stability-verdict.mjs')));
  assert.ok(existsSync(path.join(root, 'visual-tests/lib/tolerance-flags.mjs')));
  assert.ok(existsSync(path.join(root, 'visual-tests/lib/stability-report.mjs')));
});

test('the concurrency group carries a static prefix and never cancels a sibling dispatch', () => {
  // A measurement means something only when all N renders finish, so a second dispatch on the same
  // branch — `main-dark`, then `horizon` — must queue beside the first rather than throw away ten
  // runners mid-render. Keyed on the run, that cannot happen; keyed on the ref, it is the default.
  assert.match(workflow, /group: visual-stability-\$\{\{ github\.run_id \}\}/);
  assert.doesNotMatch(workflow, /group: visual-stability-\$\{\{ github\.ref \}\}/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.doesNotMatch(workflow, /\$\{\{ github\.workflow \}\}/);
});

test('the matrix measures what it renders: no retries, every render attempted, artifacts overwritable', () => {
  const [, renderBlock = ''] = workflow.split('Render the specs under investigation');

  // A retry overwrites the same screenshot path, so an iteration would keep the retry's clean capture
  // and the matrix would under-report the flakiness it exists to measure.
  assert.equal((renderBlock.match(/--retries=0/g) || []).length, 3,
    'all three renders must run with --retries=0');
  // Actions runs the block with -e: without collecting a status, one failing render ends the step and
  // the rest never run, which the verdict then reports as missing captures rather than as a skip.
  assert.match(renderBlock, /status=0/);
  assert.match(renderBlock, /exit \$status/);
  assert.equal((renderBlock.match(/\|\| status=1/g) || []).length, 3);
  // "Re-run failed jobs" re-uploads under a name the first attempt published. Sliced to the upload
  // step and asserted with two flat patterns rather than one spanning regex: `(?:\s+.*\n)*?` between
  // them is ambiguous (`\s` matches the newline `.*\n` already consumed), which is exponential
  // backtracking on the right input and a CodeQL `js/redos` alert.
  // `indexOf` asserted before the slice. On a miss `slice(-1)` returns the block's
  // last character — truthy — so asserting after the slice could never fail with
  // the message below; a renamed step fell through to the `assert.match` instead.
  const uploadAt = renderBlock.indexOf('name: Upload the screenshots');

  assert.notEqual(uploadAt, -1, 'the render job lost its upload step');

  const upload = renderBlock.slice(uploadAt);

  assert.match(upload, /name: stability-\$\{\{ matrix\.iteration \}\}/);
  assert.match(upload, /overwrite: true/);
});

test('the cross-browser render owns the port before the shared server starts', () => {
  // playwright-cross-browser.config.ts declares a webServer on 8082 with reuseExistingServer
  // off under CI, so it must run before `serve-example` binds the port — the other order
  // fails every iteration before a spec renders.
  const [, renderBlock = ''] = workflow.split('Render the specs under investigation');
  const cross = renderBlock.indexOf('playwright-cross-browser.config.ts');
  const serve = renderBlock.indexOf('npm run serve-example &');

  assert.ok(cross > -1 && serve > -1, 'the render step lost one of its two phases');
  assert.ok(cross < serve, 'the cross-browser config must run before the shared server is started');
  assert.doesNotMatch(renderBlock, /^\s+sleep \d+\s*$/m, 'server readiness is polled, not slept on');
  assert.match(renderBlock, /curl -sf http:\/\/localhost:8082\//, 'the readiness poll is missing');
});

test('the browser install matches the cache key it saves under', () => {
  // The key is visual.yml's `all` key. Saving a two-browser cache under it would leave the
  // cross-browser leg without webkit on its next cache hit.
  assert.match(workflow, /key: playwright-all-/);
  assert.match(workflow, /playwright install chromium firefox webkit/);
});

test('a red iteration still uploads what it rendered', () => {
  assert.match(workflow, /name: Upload the screenshots\n\s+if: steps\.gate\.outputs\.run == 'true' && !cancelled\(\)/);
});
