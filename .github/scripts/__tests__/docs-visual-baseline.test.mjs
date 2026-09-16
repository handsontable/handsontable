import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { repoRoot } from '../lib/repo-root.mjs';

// docs/tests/paths.js is CommonJS, and this file is ESM.
const require = createRequire(import.meta.url);

// The docs visual suite (docs/tests/visualDocs.spec.ts, 441 full-page
// captures) had a baseline that was not one (DEV-2860): both CI entry points
// restored the goldens from actions/cache keyed on `github.ref` with a
// `refs/heads/develop` restore-key nothing ever saved, so commit 2 of a pull
// request was compared against commit 1 and never against develop (PR #13440),
// and a miss ran `--update-snapshots`, wrote the preview's own render as the
// goldens, and passed. The fix is the core suite's contract in the same R2
// bucket: probe `docs/base/<branch>/out.json`, compare, gate, comment, hold a
// `changed` verdict on the `docs-visual-approval` environment, and seed the
// baseline from the develop staging deploy. Every way that regresses without
// anything going red is pinned here:
//
//   1. a cache comes back, or a missing golden is written and passed again on
//      CI (`updateSnapshots`), or the snapshot path template moves and re-keys
//      every golden;
//   2. the probe reads a transport failure as "no baseline" and a pull request
//      seeds over the real records, or a seed lands with holes or empty;
//   3. the gate stops exporting the verdict, the approve job stops asserting a
//      recorded approval, or the functional project starts blocking merges
//      before its sprint of report-only runs is over;
//   4. the seed chain stops matching the deployed commit, cancels itself, or
//      seeds from a pull request's deploy.
//
// Text-based, like fork-guards.test.mjs: no YAML parser is a dependency of the
// repo root.

const root = repoRoot();
const read = rel => readFileSync(path.join(root, rel), 'utf8');
const action = read('.github/actions/docs-visual-run/action.yml');
const docs = read('.github/workflows/docs.yml');
const dispatch = read('.github/workflows/docs-visual-tests.yml');
const seed = read('.github/workflows/docs-visual-seed.yml');
const cleanup = read('.github/workflows/pr-cleanup.yml');

const GUARD_SAME_REPO = /github\.event\.pull_request\.head\.repo\.full_name == github\.repository/;
const GUARD_DEPENDABOT = /github\.actor != 'dependabot\[bot\]'/;

/**
 * One job's block, by the two-space indent that starts each job.
 *
 * @param {string} source The workflow file's contents.
 * @param {string} id The job id.
 * @returns {string} The job's text.
 */
function job(source, id) {
  const [, jobsBlock = ''] = source.split(/^jobs:$/m);
  const blocks = jobsBlock.split(/^ {2}(?=[A-Za-z0-9_-]+:$)/m);

  return blocks.find(block => block.startsWith(`${id}:`)) ?? '';
}

/**
 * A workflow job's steps, split on the six-space `- ` that starts each one.
 *
 * @param {string} jobBody One job's text, from `job()`.
 * @returns {string[]} One entry per step.
 */
function steps(jobBody) {
  const [, stepsBlock = ''] = jobBody.split(/^ {4}steps:$/m);

  return stepsBlock.split(/^ {6}(?=- )/m).filter(block => block.trim());
}

/**
 * The composite action's steps, split on the four-space `- ` that starts each
 * one under `runs.steps`.
 *
 * @returns {string[]} One entry per step.
 */
function actionSteps() {
  const [, stepsBlock = ''] = action.split(/^ {2}steps:$/m);

  return stepsBlock.split(/^ {4}(?=- )/m).filter(block => block.trim());
}

/**
 * The composite step with the given name.
 *
 * @param {string} name The step's `name:`.
 * @returns {string} The step's text.
 */
function actionStep(name) {
  const step = actionSteps().find(block => block.includes(`name: ${name}\n`));

  assert.ok(step, `the docs-visual-run action lost its "${name}" step`);

  return step;
}

/**
 * A step's folded `if:` expression, or null when the step has none. Shell
 * `if [ … ]` lines carry no colon, so they never match.
 *
 * @param {string} step One step's text.
 * @returns {string|null} The expression with its continuation lines joined.
 */
function stepIf(step) {
  const match = step.match(/^\s*(?:- )?if: (.*(?:\n\s+(?:&&|\|\||\().*)*)/m);

  return match ? match[1].replace(/\s+/g, ' ') : null;
}

test('no docs visual entry point restores or saves an actions/cache baseline', () => {
  for (const [file, source] of [
    ['.github/workflows/docs.yml', docs],
    ['.github/workflows/docs-visual-tests.yml', dispatch],
    ['.github/workflows/docs-visual-seed.yml', seed],
    ['.github/actions/docs-visual-run/action.yml', action],
  ]) {
    // A `uses:`, not a mention: the headers name the cache they replaced.
    assert.doesNotMatch(source, /uses:\s*actions\/cache/,
      `${file} uses actions/cache — a pull request's cache is scoped to that pull request, so it can only ever `
        + 'compare a commit against the same pull request\'s earlier commit');
  }
});

test('the action probes <base-key>/out.json, bootstraps only on a definite 404, and refuses to guess otherwise', () => {
  const probe = actionStep('Check for golden records');

  assert.match(probe, /curl [^\n]*\n(?:[^\n]*\n)*?[^\n]*"https:\/\/\$REPORT_DOMAIN\/\$BASE_KEY\/out\.json"/,
    'the probe must HEAD the manifest under base-key on the public domain');
  assert.match(probe, /REPORT_DOMAIN: \$\{\{ inputs\.report-domain \}\}/);
  assert.match(probe, /BASE_KEY: \$\{\{ inputs\.base-key \}\}/, 'the key goes through env, never into the script body');
  assert.match(probe, /2\?\?\)\n\s+echo "DOCS_VISUAL_BOOTSTRAP=false" >> "\$GITHUB_ENV"/);
  assert.match(probe, /404\)\n\s+echo "DOCS_VISUAL_BOOTSTRAP=true" >> "\$GITHUB_ENV"/,
    'only a 404 may bootstrap');
  assert.match(probe, /\*\)\n(?:\s+echo[^\n]*\n)+\s+exit 1/,
    'any other status must exit 1 — seeding on a transient failure would overwrite the baseline');
  assert.match(probe, /--retry 3 --retry-all-errors/);
});

test('a visual difference does not red the compare step, and a hole in a rendered baseline does fail the render', () => {
  const compare = actionStep('Compare against the golden records');
  const render = actionStep('Render the baseline');

  assert.match(compare, /\n\s+continue-on-error: true\n/, 'a failing test is a difference the gate reports, not a job failure');
  assert.match(compare, /run: npx playwright test --project=visual$/m);
  // The `run:` line, not the step text: the next step's leading comment
  // (which names the flag) is attached to this step by the splitter.
  assert.doesNotMatch(compare, /run: .*--update-snapshots/, 'a compare must never write a golden');
  assert.match(stepIf(compare), /inputs\.mode == 'compare' && env\.DOCS_VISUAL_BOOTSTRAP != 'true'/);

  assert.doesNotMatch(render, /continue-on-error/, 'a seed with holes must not land');
  assert.match(render, /run: npx playwright test --project=visual --update-snapshots$/m);
  assert.match(stepIf(render), /inputs\.mode == 'seed' \|\| env\.DOCS_VISUAL_BOOTSTRAP == 'true'/);

  for (const step of [compare, render]) {
    assert.match(step, /BASE_URL: \$\{\{ inputs\.test-url \}\}/, 'the URL goes through env, never into the script body');
    assert.match(step, /PASS_COOKIE: \$\{\{ inputs\.pass-cookie \}\}/);
  }
});

test('the manifest adapter is called with the usage the docs CLI fixes, and the gate reads its output', () => {
  const manifest = actionStep('Write the manifest');

  assert.match(manifest, /if: \$\{\{ !cancelled\(\) \}\}/, '`always()` would run on a canceled job');
  assert.match(manifest, new RegExp([
    'node \\./tests/scripts/visual-manifest\\.mjs compare \\\\',
    '\\./tests/test-artifacts/report\\.json \\\\',
    '\\./tests/test-artifacts/screenshots \\\\',
    '\\./tests/test-artifacts/out\\.json \\\\',
    '\\./tests/test-artifacts/baseline\\.txt',
  ].join('\\n\\s+')), 'compare <report.json> <screenshots-dir> <out.json> <baseline.txt>');
  assert.match(manifest, /node \.\/tests\/scripts\/visual-manifest\.mjs seed \\\n\s+\.\/tests\/test-artifacts\/screenshots \\\n\s+\.\/tests\/test-artifacts\/seed\.json/,
    'seed <screenshots-dir> <manifest>');

  // The baseline list is written between the sync and the run, from the tree
  // the sync produced, or emptied when nothing came down.
  const fetch = actionStep('Fetch the golden records');
  const empty = actionStep('Start from an empty baseline');

  assert.match(fetch, /aws s3 sync "s3:\/\/\$BUCKET\/\$BASE_KEY\/screenshots" \.\/tests\/test-artifacts\/screenshots/);
  assert.match(fetch, /find \.\/tests\/test-artifacts\/screenshots -name '\*\.png'[\s\S]*> \.\/tests\/test-artifacts\/baseline\.txt/);
  assert.match(stepIf(fetch), /inputs\.mode == 'compare' && env\.DOCS_VISUAL_BOOTSTRAP != 'true'/,
    'a seed renders into an empty tree, or the --delete reconcile could never remove a golden');
  assert.match(empty, /: > \.\/tests\/test-artifacts\/baseline\.txt/);

  const gate = actionStep('Docs visual verdict');

  assert.match(gate, /\n\s+id: gate\n/, 'the action outputs read steps.gate');
  assert.match(gate, /if: \$\{\{ !cancelled\(\) && inputs\.mode == 'compare' \}\}/);
  assert.match(gate, /VISUAL_GATE_DIR: \.\/tests\/test-artifacts$/m);
  assert.match(gate, /VISUAL_GATE_TITLE: Docs visual tests$/m);
  assert.match(gate, /VISUAL_GATE_ENVIRONMENT: docs-visual-approval$/m);
  assert.match(gate, /VISUAL_GATE_ARTIFACT: docs-visual-report$/m);
  assert.match(gate, /VISUAL_GATE_REPORT_PATH: results\/index\.html$/m);
  assert.match(gate, /REG_ACTUAL_KEY: \$\{\{ inputs\.actual-key \}\}/);
  assert.match(gate, /VISUAL_BOOTSTRAP: \$\{\{ env\.DOCS_VISUAL_BOOTSTRAP \}\}/);
  assert.match(gate, /node \.\.\/visual-tests\/scripts\/visual-gate\.mjs$/m, 'the docs gate is the core gate, not a copy');

  assert.match(action, /^outputs:\n\s+verdict:\n(?:\s+description:.*\n)?\s+value: \$\{\{ steps\.gate\.outputs\.verdict \}\}/m);
  assert.match(action, /^\s+report-url:\n(?:\s+description:.*\n)?\s+value: \$\{\{ steps\.gate\.outputs\.report-url \}\}/m);
});

test('the seed step refuses an empty manifest, reconciles with --delete, and both R2 writes carry the canonical fork guard', () => {
  const seedStep = actionStep('Seed the golden records');
  const publish = actionStep('Publish the report');

  assert.match(seedStep, /rendered=\$\(jq '\.actualItems \| length' \.\/tests\/test-artifacts\/seed\.json\)/);
  assert.match(seedStep, /if \[ "\$rendered" = "0" \]; then\n(?:\s+echo[^\n]*\n)+\s+exit 1/,
    'a blank manifest makes the probe return 200 forever');
  assert.match(seedStep, /aws s3 sync \.\/tests\/test-artifacts\/screenshots "s3:\/\/\$BUCKET\/\$BASE_KEY\/screenshots" \\\n\s+--delete/,
    'a seed reconciles: a page removed from paths.js leaves the baseline');
  assert.match(seedStep, /aws s3 cp \.\/tests\/test-artifacts\/seed\.json "s3:\/\/\$BUCKET\/\$BASE_KEY\/out\.json"/,
    'the manifest lands under the name the probe checks');
  assert.doesNotMatch(stepIf(seedStep), /cancelled\(\)|always\(\)/,
    'a status function here would seed after a failed render');

  assert.match(publish, /aws s3 cp \.\/tests\/test-artifacts\/results "s3:\/\/\$BUCKET\/\$ACTUAL_KEY\/results" \\\n\s+--recursive/);
  assert.match(publish, /aws s3 cp \.\/tests\/test-artifacts\/out\.json "s3:\/\/\$BUCKET\/\$ACTUAL_KEY\/out\.json"/);

  for (const [name, step] of [['Publish the report', publish], ['Seed the golden records', seedStep]]) {
    const condition = stepIf(step);

    assert.ok(condition, `${name}: no if: condition`);
    assert.match(condition, GUARD_SAME_REPO, `${name}: missing the same-repo half of the guard`);
    assert.match(condition, GUARD_DEPENDABOT, `${name}: missing the Dependabot half of the guard`);
    assert.match(condition, /github\.event_name (!=|==) 'pull_request'/, `${name}: guard has no event check`);
  }
  assert.match(stepIf(seedStep), /inputs\.mode == 'seed' \|\| \(env\.DOCS_VISUAL_BOOTSTRAP == 'true' && github\.event_name == 'pull_request'/,
    'a pull request seeds only when no baseline existed');

  // A composite action cannot read secrets; the credentials arrive as inputs.
  assert.doesNotMatch(action, /\$\{\{[^}]*secrets\./, 'a composite action has no secrets context');
  for (const step of [actionStep('Fetch the golden records'), publish, seedStep]) {
    assert.match(step, /AWS_ACCESS_KEY_ID: \$\{\{ inputs\.r2-access-key-id \}\}/);
    assert.match(step, /AWS_SECRET_ACCESS_KEY: \$\{\{ inputs\.r2-secret-access-key \}\}/);
    assert.match(step, /R2_ENDPOINT: https:\/\/\$\{\{ inputs\.r2-account-id \}\}\.r2\.cloudflarestorage\.com/);
  }
});

test('the docs Playwright config fails a missing golden on CI, keeps the snapshot path, and splits the two projects', () => {
  const config = read('docs/playwright.config.ts');

  assert.match(config, /updateSnapshots:\s*isCI\s*\?\s*'none'\s*:\s*'missing'/,
    'on CI a missing golden must fail its test instead of being written and passed');
  // Byte for byte: the template has no {projectName}, and adding one would
  // re-key every golden under a new path.
  assert.ok(config.includes("snapshotPathTemplate: './tests/test-artifacts/screenshots/{testFilePath}/{arg}{ext}'"),
    'the snapshot path template changed — every golden in docs/base/<branch>/screenshots is now unreachable');
  assert.match(config, /name: 'visual'/, 'the visual project is missing');
  assert.match(config, /name: 'functional'/, 'the functional project is missing');
  assert.match(config, /testMatch: \/visualDocs\\\.spec\\\.ts\//);
  assert.match(config, /testIgnore: \/visualDocs\\\.spec\\\.ts\//);
  assert.match(config, /\['json',\s*\{\s*outputFile:\s*'\.\/tests\/test-artifacts\/report\.json'/,
    'the manifest adapter reads the JSON report');
});

test('every visual page declares its golden before it can be fixme\'d, so a fixme never reads as a deletion', () => {
  // Comments stripped first: the annotation's own comment explains itself by naming `test.fixme()`,
  // and an ordering assertion that counted prose would read that mention as the call.
  const spec = read('docs/tests/visualDocs.spec.ts')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  const annotation = spec.indexOf("type: 'snapshot'");
  const fixme = spec.indexOf('test.fixme()');

  assert.notEqual(annotation, -1, 'visualDocs.spec.ts pushes no `snapshot` annotation; the adapter cannot map its tests to goldens');
  assert.notEqual(fixme, -1, 'visualDocs.spec.ts lost its fixme check; the ordering below has nothing to pin');
  assert.ok(annotation < fixme, 'the `snapshot` annotation must be pushed BEFORE test.fixme()');
  assert.match(spec, /description: `visualDocs\.spec\.ts\/\$\{screenshotName\}`/);
});

test('the annotated key names the file Playwright actually writes, for every page', () => {
  // The equality that IS the manifest adapter. `visual-manifest.mjs` diffs the
  // annotation strings against the `baseline.txt` keys, so if the name the spec
  // builds and the path Playwright resolves drift apart, every affected page
  // reports as a deleted golden PLUS a new render and the verdict is `changed`
  // forever, with nothing to fix and nothing red. Asserting the template and the
  // annotation prefix independently — which is all this file used to do — cannot
  // see that.
  //
  // This is not hypothetical: `snapshotPath()` runs its argument through
  // `sanitizeForFilePath` before substituting `{arg}`, so the 35 `migration-from-X.Y-to-Z.0`
  // pages were written as `migration-from-X-Y-to-Z-0.png` while the annotation kept
  // the dots. Measured on @playwright/test 1.61.1; 1.45 did not sanitize, so the
  // behaviour is version-sensitive and worth a test rather than a comment.
  const config = read('docs/playwright.config.ts');
  const spec = read('docs/tests/visualDocs.spec.ts');

  // The template is resolved relative to configDir and must stay single-valued:
  // Playwright resolves {testFilePath} against the PROJECT's testDir, so a
  // project-level override would change the answer while a regex kept reading the
  // top-level one.
  assert.equal((config.match(/^\s*testDir:/gm) || []).length, 1,
    'a second testDir means {testFilePath} may resolve against a project override this test cannot see');

  const template = config.match(/snapshotPathTemplate:\s*'([^']+)'/);

  assert.ok(template, 'the snapshot path template is gone');

  // {testFilePath} is the spec path relative to testDir — `visualDocs.spec.ts`.
  const prefix = template[1].split('{testFilePath}')[1].split('{arg}')[0];

  assert.equal(prefix, '/', 'the template puts something between {testFilePath} and {arg}; the annotation prefix must follow');

  const annotated = spec.match(/description: `(visualDocs\.spec\.ts)\/\$\{screenshotName\}`/);

  assert.ok(annotated, 'the annotation no longer names visualDocs.spec.ts/<name>');

  // Playwright's own rule, from playwright-core's `sanitizeForFilePath`.
  const sanitize = value => value.replace(/[\x00-\x2C\x2E-\x2F\x3A-\x40\x5B-\x60\x7B-\x7F]+/g, '-');
  const built = spec.match(/const screenshotName = `\$\{prefix\}-\$\{slug\.replace\(([^)]+)\)\}\.png`/);

  assert.ok(built,
    'the spec no longer sanitizes the slug into the screenshot name, so a page whose slug contains a '
      + 'dot annotates a file Playwright never wrote — 35 pages do');

  // And prove the spec's expression agrees with Playwright's on the real slugs,
  // rather than merely being present.
  const specSanitize = new Function('slug', `return slug.replace(${built[1]});`);
  const paths = require(path.join(root, 'docs/tests/paths.js'));
  const slugs = Object.values(paths)
    .filter(Array.isArray)
    .flatMap(list => list.map(entry => entry.path.split('/').pop()));
  const disagree = slugs.filter(slug => specSanitize(slug) !== sanitize(slug));

  assert.ok(slugs.length > 100, `only ${slugs.length} slugs found; paths.js is not being read`);
  assert.deepEqual(disagree, [],
    'the spec sanitizes these slugs differently from Playwright, so their annotations name files it '
      + `never wrote: ${disagree.slice(0, 5).join(', ')}`);
});

test('docs.yml compares a pull request against its base branch and exports the verdict the approval keys on', () => {
  const visual = job(docs, 'visual');

  assert.ok(visual, 'docs.yml lost its visual job');
  assert.match(visual, /needs: \[ visual-label, preview \]/);
  assert.match(visual, /needs\.visual-label\.outputs\.run == 'true'/, 'the suite stays opt-in through the label in this PR');
  assert.match(visual, /permissions:\n\s+contents: read\n\s+pull-requests: write/, 'the sticky comment needs the job-level grant');
  assert.match(visual, /outputs:\n\s+verdict: \$\{\{ steps\.run\.outputs\.verdict \}\}\n\s+report-url: \$\{\{ steps\.run\.outputs\.report-url \}\}/);
  assert.match(visual, /- id: run\n\s+uses: \.\/\.github\/actions\/docs-visual-run\n/, 'the action step must carry the id the outputs read');
  assert.match(visual, /mode: compare$/m);
  assert.match(visual, /base-key: docs\/base\/\$\{\{ github\.base_ref \}\}$/m, 'a pull request compares against the branch it targets');
  assert.match(visual, /actual-key: docs\/pr-\$\{\{ github\.event\.pull_request\.number \}\}\/\$\{\{ github\.event\.pull_request\.head\.sha \}\}$/m);
  assert.match(visual, /test-url: \$\{\{ needs\.preview\.outputs\.preview-url \}\}/);
  for (const secret of ['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_ACCOUNT_ID', 'PASS_COOKIE']) {
    assert.match(visual, new RegExp(`\\$\\{\\{ secrets\\.${secret} \\}\\}`), `the visual job no longer passes secrets.${secret} to the action`);
  }

  const comment = steps(visual).find(step => step.includes('name: Comment the docs visual verdict on the pull request'));

  assert.ok(comment, 'docs.yml lost the sticky comment step');
  assert.match(comment, /uses: marocchino\/sticky-pull-request-comment@/);
  assert.match(comment, /header: docs-visual-tests\n\s+path: docs\/tests\/test-artifacts\/comment\.md/,
    'the comment path is where the gate writes comment.md (VISUAL_GATE_DIR under ./docs)');
  assert.match(stepIf(comment), /!cancelled\(\)/, 'the previous push\'s verdict must be rewritten even after a failure');
});

test('the docs approval job waits on docs-visual-approval only for a changed verdict, and asserts a recorded approval', () => {
  const approve = job(docs, 'approve');

  assert.ok(approve, 'docs.yml has no approve job; a changed docs verdict would pass with nothing reviewed');
  assert.match(approve, /needs: \[ visual \]/);
  assert.match(approve, /github\.event_name == 'pull_request'/);
  assert.match(approve, /needs\.visual\.outputs\.verdict == 'changed'/);
  assert.match(approve, /environment:\n\s+name: docs-visual-approval\n\s+url: \$\{\{ needs\.visual\.outputs\.report-url \}\}/);
  assert.match(approve, /actions\/runs\/\{run_id\}\/approvals/, 'the approve job no longer reads the run approvals — it would fail OPEN on environment drift');
  assert.match(approve, /environment\.name === 'docs-visual-approval'/);
  assert.match(approve, /core\.setFailed/, 'the approve job no longer fails closed when no approval is recorded');
});

test('manual-qa, the visual approval and the docs visual approval assert their approvals the same way', () => {
  // One mechanism, three environments. If manual-qa.yml's assertion shape
  // changes, both approve jobs must change with it.
  const manualQa = read('.github/workflows/manual-qa.yml');
  const visualApprove = job(read('.github/workflows/visual.yml'), 'approve');
  const docsApprove = job(docs, 'approve');

  for (const source of [manualQa, visualApprove, docsApprove]) {
    assert.match(source, /actions\/runs\/\{run_id\}\/approvals/);
    assert.match(source, /state === 'approved'/);
  }
});

test('the functional docs specs run on every docs pull request, report-only for now', () => {
  const functional = job(docs, 'functional');

  assert.ok(functional, 'docs.yml has no functional job; the 11 functional specs would again run only under the visual label');
  assert.match(functional, /needs: \[ preview \]/);
  assert.match(functional, /needs\.preview\.result == 'success'/);
  assert.doesNotMatch(functional, /visual-label/, 'the functional specs must not depend on the visual label');

  const run = steps(functional).find(step => step.includes('--project=functional'));

  assert.ok(run, 'the functional job does not run --project=functional');
  assert.match(run, /\n\s+continue-on-error: true\n/,
    'report-only for one sprint: flip this off deliberately, after a sprint of green runs, not by accident');
  assert.match(run, /BASE_URL: \$\{\{ needs\.preview\.outputs\.preview-url \}\}/);
  assert.match(run, /PASS_COOKIE: \$\{\{ secrets\.PASS_COOKIE \}\}/);
  assert.match(functional, /Docs functional specs: /, 'the one-line outcome must reach the job summary');
  assert.match(functional, /name: docs-functional-report\n\s+path: \.\/docs\/tests\/test-artifacts\/results\n\s+retention-days: 7/);
});

test('pr-cleanup purges the docs suite\'s prefix alongside the core suite\'s', () => {
  const purge = job(cleanup, 'purge-visual-screenshots');

  assert.ok(purge, 'pr-cleanup.yml lost its purge job');
  assert.match(purge, /aws s3 rm "s3:\/\/\$R2_BUCKET_NAME\/pr-\$PR_NUMBER\/"/);
  assert.match(purge, /aws s3 rm "s3:\/\/\$R2_BUCKET_NAME\/docs\/pr-\$PR_NUMBER\/"/,
    'docs/pr-<n>/ is never purged, so every docs pull request leaves its report in the bucket forever');
  // Context values reach the script through `env:`, never interpolated into the
  // body — the convention the fork guards rely on being greppable, and the shape
  // every other R2 step here uses.
  assert.match(purge, /PR_NUMBER: \$\{\{ github\.event\.number \}\}/,
    'the pull request number must travel through env, not into the shell body');
  assert.match(purge, /R2_ENDPOINT: https:\/\/\$\{\{ secrets\.R2_ACCOUNT_ID \}\}/,
    'the endpoint must travel through env, like visual.yml and docs-visual-run do');
  const [, body = ''] = purge.split('run: |');

  assert.doesNotMatch(body, /\$\{\{/,
    'no `${{ }}` may appear in the run body — route it through env: instead');
});

test('the docs seed chains on the staging deploy, seeds only a successful push build, and matches the deployed commit', () => {
  assert.match(seed, /^on:\n {2}workflow_run:\n {4}workflows: \['Docs Staging Deployment'\]\n {4}types: \[completed\]/m,
    'the seed must chain on the staging deploy — the only build of the docs from a base branch');
  assert.match(seed, /^\s+workflow_dispatch:\n\s+inputs:\n\s+branch:/m, 'the seed must be dispatchable for a poisoned baseline');

  const seedJob = job(seed, 'seed');
  const condition = seedJob.match(/^\s+if: ([\s\S]*?)\n\s+(?:#|permissions:|runs-on:|steps:)/m)?.[1].replace(/\s+/g, ' ');

  assert.ok(condition, 'the seed job has no if:');
  assert.match(condition, /github\.event\.workflow_run\.conclusion == 'success'/, 'a failed deploy has nothing to seed from');
  assert.match(condition, /github\.event\.workflow_run\.event == 'push'/, 'a pull request\'s deploy is not a base branch\'s');
  assert.match(condition, /github\.event_name == 'workflow_dispatch'/);

  assert.match(seedJob, /ref: \$\{\{ github\.event\.workflow_run\.head_sha \|\| inputs\.branch \}\}/,
    'the specs must be the deployed commit\'s');
  assert.match(seedJob, /BRANCH: \$\{\{ github\.event\.workflow_run\.head_branch \|\| inputs\.branch \}\}/,
    'the branch goes through env, never into the script body');
  assert.match(seedJob, /url="https:\/\/handsontable-docs-staging\.pages\.dev\/docs"/, 'develop is the apex deploy');
  assert.match(seedJob, /url="https:\/\/rc-\$\{version\/\/\.\/-\}\.handsontable-docs-staging\.pages\.dev\/docs"/,
    'release/x.y.z deploys to rc-x-y-z, dots to dashes, as docs-staging.yml\'s cf-target does');
  assert.match(seedJob, /else\n\s+echo "::error::[^\n]*\n\s+exit 1/, 'any other branch has no baseline to seed');
  assert.match(seedJob, /mode: seed$/m);
  assert.match(seedJob, /base-key: docs\/base\/\$\{\{ steps\.target\.outputs\.branch \}\}\n\s+actual-key: docs\/base\/\$\{\{ steps\.target\.outputs\.branch \}\}/,
    'a seed publishes under the key it writes');
  assert.match(seedJob, /permissions:\n\s+contents: read/);
  assert.doesNotMatch(seed, /aws s3/, 'the seed workflow writes nothing itself; the action owns the bucket writes');

  assert.match(seed,
    /concurrency:\n(?:\s+#.*\n)*\s+group: docs-visual-seed-\$\{\{ github\.event\.workflow_run\.head_branch \|\| inputs\.branch \}\}\n\s+cancel-in-progress: false/,
    'the seed group must never cancel a seed halfway through its --delete reconcile');
});

test('the dispatch workflow is a thin caller of the action: no workflow_call, no label, no cache', () => {
  // The trigger key, not a mention: the header names the fragment mode it replaced.
  assert.doesNotMatch(dispatch, /^\s*workflow_call:/m, 'nothing calls docs-visual-tests.yml — docs.yml uses the action');
  assert.doesNotMatch(dispatch, /run-docs-visual|pulls\.get/, 'the label gate belongs to docs.yml');
  assert.match(dispatch, /^\s+update-snapshots:\n\s+description: 'Re-seed docs\/base\/<this branch> from the chosen environment'\n\s+type: boolean/m);
  assert.match(dispatch, /uses: \.\/\.github\/actions\/docs-visual-run/);
  assert.match(dispatch, /mode: \$\{\{ inputs\.update-snapshots && 'seed' \|\| 'compare' \}\}/);
  assert.match(dispatch, /base-key: docs\/base\/\$\{\{ github\.ref_name \}\}/);
  assert.match(dispatch, /format\('docs\/dispatch\/\{0\}\/\{1\}', github\.ref_name, github\.run_id\)/,
    'a dispatch compare publishes under a per-run key');
  // The key splits on the mode. A SEEDING dispatch reconciles `docs/base/<branch>`
  // with `aws s3 sync --delete`, so it joins the seed workflow's key and must never
  // be cancelled mid-reconcile — a killed run leaves a torn baseline the probe still
  // reports as present. A COMPARING dispatch writes only `docs/dispatch/...`, so it
  // keeps cancelling: a newer dispatch should supersede it.
  assert.match(dispatch, /group: \$\{\{ inputs\.update-snapshots && format\('docs-visual-seed-\{0\}'/,
    'a seeding dispatch must share the seed workflow key, or two runs can write docs/base/<branch> at once');
  assert.match(dispatch, /cancel-in-progress: \$\{\{ !inputs\.update-snapshots \}\}/,
    'a seeding dispatch must not be cancellable — it reconciles the baseline with --delete');
  assert.doesNotMatch(dispatch, /cancel-in-progress: true/,
    'an unconditional cancel puts the torn-baseline hole back');
});

test('the core gate script honors the variables the docs suite reuses it through', () => {
  const gate = read('visual-tests/scripts/visual-gate.mjs');

  for (const variable of [
    'VISUAL_GATE_DIR', 'VISUAL_GATE_TITLE', 'VISUAL_GATE_ENVIRONMENT', 'VISUAL_GATE_ARTIFACT', 'VISUAL_GATE_REPORT_PATH',
  ]) {
    assert.match(gate, new RegExp(`process\\.env\\.${variable}`),
      `visual-gate.mjs no longer reads ${variable}; the docs gate would write to the core suite's .reg/ under the core labels`);
  }
});

test('the manifest adapter and its tests exist, and the tooling suite runs them', () => {
  for (const file of [
    'docs/tests/lib/visual-manifest.mjs',
    'docs/tests/scripts/visual-manifest.mjs',
    'docs/tests/lib/__tests__/visual-manifest.test.mjs',
  ]) {
    assert.ok(existsSync(path.join(root, file)), `${file} is missing`);
  }

  const { scripts } = JSON.parse(read('package.json'));

  assert.ok(scripts['test:tooling'].includes('docs/tests/lib/__tests__/*.test.mjs'),
    'root package.json test:tooling does not run the docs manifest tests');
});
