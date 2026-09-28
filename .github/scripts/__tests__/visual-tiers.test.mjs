import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';
import * as visualConfig from '../../../visual-tests/src/config.mjs';

// The visual stage renders by tier (DEV-2797): every pull request renders the
// `pr` tier (js × {main, main-dark} on chromium), a base-branch push renders
// the `seed` tier (everything the golden records hold, wrappers copied from js)
// and the weekday nightly renders the `full` tier (everything, wrappers for
// real) without ever writing the goldens. The table is `VISUAL_TIERS` in
// visual-tests/src/config.mjs; the workflows carry a second copy of two of its
// facts — the render matrix's shape and which tier writes `base/` — because
// `strategy` cannot read `env`. This pins the two copies to each other and the
// wiring between the callers and the module, the places a future edit drifts
// without anything going red:
//
//   1. a matrix JSON shape stops parsing, or the pr shape grows a cross-browser
//      leg whose artifact the compare job then downloads and never finds;
//   2. a wrapper build step loses its tier guard — the seed pays for three
//      wrapper builds nothing reads, or a pull request renders a wrapper nobody
//      asked for against a baseline that is a js copy;
//   3. the nightly starts writing `base/`, or Reconcile keys on the event again
//      and a full render becomes the baseline every pull request compares with;
//   4. a caller stops passing its tier — the input is required, so that is a
//      startup failure on the next develop push or nightly, not on the pull
//      request that broke it.
//
// Text-based, like fork-guards.test.mjs: no YAML parser is a dependency of the
// repo root.

const root = repoRoot();
const read = rel => readFileSync(path.join(root, rel), 'utf8');
const visual = read('.github/workflows/visual.yml');
const tests = read('.github/workflows/test.yml');
const seed = read('.github/workflows/visual-seed.yml');
const nightly = read('.github/workflows/visual-nightly.yml');

/**
 * The jobs a workflow declares, by the two-space indent that starts each one.
 *
 * @param {string} source The workflow file's contents.
 * @returns {string[]} Job ids in order.
 */
function jobIds(source) {
  const [, jobsBlock = ''] = source.split(/^jobs:$/m);

  return [...jobsBlock.matchAll(/^ {2}([A-Za-z0-9_-]+):$/gm)].map(([, id]) => id);
}

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
 * A job's steps, split on the six-space `- ` that starts each one. The comment
 * block above a step stays with the step before it, which is harmless here: no
 * comment carries an `if:` key.
 *
 * @param {string} jobBody One job's text, from `job()`.
 * @returns {string[]} One entry per step, its leading indent removed.
 */
function steps(jobBody) {
  const [, stepsBlock = ''] = jobBody.split(/^ {4}steps:$/m);

  return stepsBlock.split(/^ {6}(?=- )/m).filter(block => block.trim());
}

/**
 * A step's folded `if:` expression, or null when the step has none. The key
 * may open the step (`- if:`, at column 0 after `steps()`) or follow its name.
 * Shell `if [ … ]` lines carry no colon, so they never match.
 *
 * @param {string} step One step's text, from `steps()`.
 * @returns {string|null} The expression with its continuation lines joined.
 */
function stepIf(step) {
  const match = step.match(/^\s*(?:- )?if: (.*(?:\n\s+(?:&&|\|\||\().*)*)/m);

  return match ? match[1].replace(/\s+/g, ' ') : null;
}

/**
 * The two matrix shapes the render job spells out, parsed. `strategy` cannot
 * read `env`, so the shapes are JSON literals inside a `fromJSON` over the tier.
 *
 * @returns {{ expression: string, pr: object[], rest: object[] }} The whole
 * expression and the parsed pr and non-pr shapes.
 */
function matrixShapes() {
  const render = job(visual, 'render');
  const start = render.indexOf('config: ${{ fromJSON(');

  assert.notEqual(start, -1, 'the render matrix is no longer a fromJSON over the tier');

  const expression = render.slice(start, render.indexOf(') }}', start) + 4);
  const shapes = [...expression.matchAll(/'(\[[^']*\])'/g)].map(([, json]) => JSON.parse(json));

  assert.equal(shapes.length, 2, 'expected exactly two matrix shapes: the pr tier, and everything else');

  return { expression, pr: shapes[0], rest: shapes[1] };
}

/**
 * A script with its comments removed, so a prose mention of a retired command
 * cannot pass or fail an assertion about the code.
 *
 * @param {string} source The script's contents.
 * @returns {string} The code lines only.
 */
function code(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

test('visual.yml takes the tier as a required input and hands it to every script as environment', () => {
  assert.match(visual, /^on:\n {2}workflow_call:\n {4}inputs:\n {6}tier:\n(?: {8}.*\n)*? {8}required: true$/m,
    'the tier input must be required — a caller that forgets it must fail at startup, not render a default');
  assert.match(visual, /^ {6}wrappers:\n(?: {8}.*\n)*? {8}type: string$/m);
  assert.match(visual, /^env:\n(?: {2}.*\n)*? {2}VISUAL_TIER: \$\{\{ inputs\.tier \}\}$/m,
    'VISUAL_TIER must be workflow-level env, so build.mjs, run-tests.mjs, compare.mjs and seed-report.mjs '
      + 'all resolve the same tier');
  assert.match(visual, /^ {2}VISUAL_WRAPPERS: \$\{\{ inputs\.wrappers \}\}$/m);
});

test('the render matrix keys on the tier, and both shapes are valid JSON with the keys the steps read', () => {
  const { expression, pr, rest } = matrixShapes();

  assert.match(expression, /inputs\.tier == 'pr'/);
  assert.deepEqual(pr.map(leg => leg.name), ['multi-framework']);
  assert.deepEqual(rest.map(leg => leg.name), ['multi-framework', 'cross-browser']);
  assert.deepEqual(pr[0], rest[0], 'the multi-framework leg must be the same object in both shapes');

  [...pr, ...rest].forEach((leg) => {
    ['name', 'browsers', 'cache', 'test', 'artifact', 'tar', 'demos'].forEach((key) => {
      assert.ok(key in leg, `matrix leg ${leg.name} lacks the ${key} key`);
    });
  });
  // `demos` is what the wrapper steps and the build step branch on.
  assert.equal(rest[0].demos, 'tier');
  assert.equal(rest[1].demos, 'js');
  assert.equal(rest[1].artifact, 'vt-screenshots-cross');
});

test('the config table and the workflow agree that the pr tier has no cross-browser leg', () => {
  const { VISUAL_TIERS } = visualConfig;

  assert.ok(VISUAL_TIERS, 'visual-tests/src/config.mjs exports no VISUAL_TIERS');
  assert.deepEqual(Object.keys(VISUAL_TIERS), ['pr', 'seed', 'full']);
  assert.deepEqual(VISUAL_TIERS.pr.browsers, [],
    'the pr tier renders no browser leg — the workflow drops it on that basis');
  assert.equal(VISUAL_TIERS.pr.classic, false, 'the pr tier renders no bare "classic" js pass');

  const { pr } = matrixShapes();

  assert.ok(!pr.some(leg => leg.name === 'cross-browser'),
    'the pr matrix shape has a cross-browser leg while VISUAL_TIERS.pr.browsers is empty — the two must agree');
});

test('a wrapper build is fetched or built only where the tier renders that wrapper', () => {
  const render = steps(job(visual, 'render'));

  [
    ['angular-wrapper-build', 'angular-wrapper'],
    ['react-wrapper-build', 'react-wrapper'],
    ['vue3-build', 'vue3'],
  ].forEach(([artifact, dir]) => {
    const found = render.filter(step => step.includes(artifact));

    assert.equal(found.length, 2,
      `${artifact}: expected the download step and its fallback, found ${found.length}`);

    found.forEach((step) => {
      const condition = stepIf(step);

      assert.ok(condition,
        `${artifact}: a step carries no if:, so the seed tier would build a wrapper it never renders`);
      assert.match(condition, /matrix\.config\.demos == 'tier'/, `${artifact}: the cross-browser leg serves js only`);
      assert.match(condition, /inputs\.tier == 'full'/, `${artifact}: the full tier renders every wrapper`);
      assert.match(condition, /inputs\.tier == 'pr'/);
      assert.match(condition, new RegExp(`contains\\(inputs\\.wrappers, '${dir}'\\)`),
        `${artifact}: the pr tier renders a wrapper only when the scope router's matrix names it`);
      assert.doesNotMatch(condition, /inputs\.tier != 'pr'/,
        `${artifact}: \`!= 'pr'\` keeps the build for the seed tier, which copies js and renders no wrapper`);
    });
  });

  // The core artifacts stay unconditional: every leg and every tier renders js.
  ['handsontable-build-es-cjs', 'handsontable-build-umd'].forEach((artifact) => {
    render.filter(step => step.includes(artifact)).forEach((step) => {
      assert.equal(stepIf(step), null, `${artifact}: the core build must not be tier-gated`);
    });
  });
});

test('the build step serves the tier\'s demos on the multi-framework leg and js alone on the cross-browser leg', () => {
  const build = steps(job(visual, 'render')).find(step => step.includes('name: Build visual test examples'));

  assert.ok(build, 'the render job lost its build step');
  assert.match(build, /DEMOS: \$\{\{ matrix\.config\.demos \}\}/,
    'the matrix value goes through env, never into the script body');
  assert.doesNotMatch(build, /run: \|[\s\S]*\$\{\{/, 'no expression may be interpolated into the script body');
  assert.match(build, /npm run in visual-tests build/);
  // The two commands visual-stability.yml uses for the js demo alone.
  assert.match(build, /npm run examples:install next\/visual-tests\/js$/m);
  assert.match(build, /npm --prefix examples\/next\/visual-tests\/js\/demo run build$/m);
});

test('the compare job downloads the cross-browser screenshots only when a tier rendered them', () => {
  const compare = steps(job(visual, 'compare'));
  const download = compare.find(step => step.includes('name: Download cross-browser screenshots'));
  const untar = compare.find(step => step.includes('screenshots-cross.tar.gz') && step.includes('run:'));
  const multi = compare.find(step => step.includes('name: Download multi-framework screenshots'));

  assert.ok(download && untar, 'the compare job lost the cross-browser download or its untar');
  assert.match(stepIf(download), /inputs\.tier != 'pr'/,
    'download-artifact fails on a missing name, and the pr tier uploads none');
  assert.match(stepIf(untar), /inputs\.tier != 'pr'/);
  assert.equal(stepIf(multi), null, 'every tier renders the multi-framework leg');
});

test('only the seed tier writes the baseline', () => {
  const compare = steps(job(visual, 'compare'));
  const resolve = compare.find(step => step.includes('name: Resolve the snapshot keys'));
  const write = (name, value) => `echo "${name}=${value}" >> "\\$GITHUB_ENV"`;

  assert.ok(resolve, 'the compare job lost its key-resolution step');
  assert.match(resolve, /TIER: \$\{\{ inputs\.tier \}\}/, 'the tier goes through env, never into the script body');
  // The nightly's full render is compared against the goldens and published under
  // its own fixed key, and it is never the baseline.
  assert.match(resolve, new RegExp(`if \\[ "\\$TIER" = "full" \\]; then\\n(?:\\s+#.*\\n)*\\s+${
    write('REG_EXPECTED_KEY', 'base/\\$REF_NAME')}\\n\\s+${
    write('REG_ACTUAL_KEY', 'nightly/\\$REF_NAME')}\\n\\s+${
    write('VISUAL_WRITES_BASE', 'false')}`),
  'the full tier must publish under nightly/<branch> and declare that it never writes base/');
  assert.match(resolve, new RegExp(`else\\n\\s+${
    write('REG_EXPECTED_KEY', 'base/\\$REF_NAME')}\\n\\s+${
    write('REG_ACTUAL_KEY', 'base/\\$REF_NAME')}\\n\\s+${
    write('VISUAL_WRITES_BASE', 'true')}`),
  'the seed tier is the one that writes base/<branch>');
  // The pull request branch says so explicitly, and a pr tier on a push, a
  // schedule or a dispatch is a caller bug rather than a subset seed.
  assert.match(resolve, new RegExp(`${write('REG_ACTUAL_KEY', 'pr-\\$PR_NUMBER/\\$PR_HEAD_SHA')}\\n\\s+${
    write('VISUAL_WRITES_BASE', 'false')}`));
  assert.match(resolve, /if \[ "\$TIER" = "pr" \]; then\n\s+echo "::error::[^\n]*\n\s+exit 1/,
    'a pr tier on a non-pull-request event would reconcile the baseline down to two themes');

  const reconcile = compare.find(step => step.includes('name: Reconcile the golden records'));
  const condition = stepIf(reconcile);

  assert.ok(condition, 'the Reconcile step lost its if:');
  assert.match(condition, /env\.VISUAL_WRITES_BASE == 'true'/, 'Reconcile must key on the tier that writes base/');
  assert.doesNotMatch(condition, /github\.event_name/,
    'Reconcile keys on the event again — the nightly (a schedule) would sync its full render over the baseline');
  assert.match(condition, /env\.VISUAL_SKIP != 'true'/);
});

test('a non-pull-request build reports its differences before it reconciles, and a nightly keeps its images', () => {
  const compare = steps(job(visual, 'compare'));
  const at = name => compare.findIndex(step => step.includes(`name: ${name}`));
  const report = compare[at('Report this build\'s differences')];

  assert.ok(report, 'the compare job has no report step; a seed\'s differences and the nightly\'s verdict go unread');
  assert.match(report, /\n\s+id: report\n/, 'the upload step reads steps.report.outputs.verdict');
  assert.match(stepIf(report), /github\.event_name != 'pull_request'/,
    'pull requests have the gate; this is the other events\' verdict');
  assert.match(stepIf(report), /!cancelled\(\)/);
  assert.match(stepIf(report), /env\.VISUAL_SKIP != 'true'/);
  assert.match(report, /run: node \.\/visual-tests\/scripts\/seed-report\.mjs$/m);
  assert.match(report, /HEAD_COMMIT_MESSAGE: \$\{\{ github\.event\.head_commit\.message \}\}/,
    'the commit message goes through env: it can contain shell');
  assert.match(report, /VISUAL_RUN_URL: \$\{\{ github\.server_url \}\}/);

  assert.ok(at('Compare against the golden records (no credentials)') < at('Report this build\'s differences'),
    'the report must read the comparison that ran before it');
  assert.ok(at('Report this build\'s differences') < at('Reconcile the golden records'),
    'the report sits before Reconcile so a seed still reconciles after reporting');

  // The seed's out-of-tier differences are the merged pull request's, and its own
  // check never showed them: they go onto that pull request. Push only (a seed is
  // always one, and the step then never runs under a fork's token), keyed on the
  // report script's outputs, sticky so a re-run edits, and never able to block
  // the seed from landing.
  const comment = compare[at('Comment the seed\'s out-of-tier differences on the merged pull request')];

  assert.ok(comment, 'the compare job lost the seed comment step');
  assert.match(stepIf(comment), /github\.event_name == 'push'/);
  assert.match(stepIf(comment), /steps\.report\.outputs\.comment == 'true'/);
  assert.match(comment, /\n\s+continue-on-error: true\n/, 'a failed comment must not keep the seed from landing');
  assert.match(comment, /uses: marocchino\/sticky-pull-request-comment@/);
  assert.match(comment, /header: visual-seed\n\s+number: \$\{\{ steps\.report\.outputs\.pull \}\}\n\s+path: visual-tests\/\.reg\/seed-comment\.md/);
  assert.ok(at('Report this build\'s differences') < at('Comment the seed\'s out-of-tier differences on the merged pull request'));
  assert.ok(at('Comment the seed\'s out-of-tier differences on the merged pull request') < at('Reconcile the golden records'));

  const script = read('visual-tests/scripts/seed-report.mjs');

  assert.match(script, /seed-comment\.md/, 'the script no longer writes the comment body the step posts');
  assert.match(script, /comment=\$\{result\.comment \? 'true' : 'false'\}/);
  assert.match(script, /pull=\$\{result\.pull \?\? ''\}/);

  assert.ok(existsSync(path.join(root, 'visual-tests/scripts/seed-report.mjs')),
    'visual-tests/scripts/seed-report.mjs is missing');
  assert.ok(existsSync(path.join(root, 'visual-tests/lib/seed-report.mjs')),
    'visual-tests/lib/seed-report.mjs is missing');

  const upload = stepIf(compare[at('Upload the visual diff report')]);

  assert.match(upload, /steps\.report\.outputs\.verdict == 'changed'/,
    'a nightly with differences must keep its images');
  assert.match(upload, /failure\(\)/);
  // `== 'changed'`, not `!= 'clean'`: the latter also matched `bootstrap`, a run
  // that compared nothing and seeded the baseline, so it uploaded a `.reg` tree
  // with nothing in it to review. `error` still uploads through `failure()`.
  assert.match(upload, /github\.event_name == 'pull_request' && steps\.gate\.outputs\.verdict == 'changed'/);
  assert.doesNotMatch(upload, /verdict != 'clean'/,
    'the bootstrap verdict would upload a report of a comparison that never happened');
});

test('test.yml passes the tier by event and scope, and the wrappers whose own tree changed', () => {
  const visualJob = job(tests, 'visual');

  assert.ok(visualJob, 'test.yml lost its visual job');
  assert.match(visualJob, /uses: \.\/\.github\/workflows\/visual\.yml\n\s+with:\n/);

  const tier = visualJob.match(/^\s+tier: (.*)$/m)?.[1] ?? '';

  assert.match(tier, /github\.event_name != 'pull_request' && 'seed'/,
    'the master push and the RC path seed their branch');
  assert.match(tier, /needs\.checks\.outputs\.visual-full == 'true' && 'full'/,
    'a visual-tier pull request renders everything — keyed on visual-full, not test-visual, which also '
      + 'carries the lockfiles and would render the full tier on every Dependabot pull request');
  assert.doesNotMatch(tier, /test-visual/);
  assert.match(tier, /\|\| 'pr'\)/, 'every other pull request renders the pr tier');
  assert.match(visualJob, /^\s+wrappers: \$\{\{ needs\.checks\.outputs\.visual-wrappers \}\}$/m,
    'the pr tier renders a wrapper only when its own tree changed (visual-wrappers) — the Integration '
      + 'wrapper matrix lights all three on any core change');
  assert.doesNotMatch(visualJob, /wrappers: \$\{\{ needs\.checks\.outputs\.wrapper-matrix \}\}/);
  assert.match(visualJob, /secrets: inherit/);
});

test('the scope router keeps the visual routing narrower than the test scopes', () => {
  const checks = read('.github/workflows/checks.yml');
  const filters = checks.slice(checks.indexOf('filters: |'), checks.indexOf('- id: wrappers'));
  const filter = (name) => {
    const match = filters.match(new RegExp(`^ {12}${name}:\\n((?: {14}.*\\n)+)`, 'm'));

    assert.ok(match, `checks.yml has no ${name} path filter`);

    return match[1].split('\n').filter(line => line.trim() && !line.trim().startsWith('#')).map(line => line.trim());
  };

  // A full render on a pull request is for the visual tier's own files. The
  // lockfiles stay out: a path filter cannot tell a Playwright bump from any
  // other dependency bump, and the pr tier exists to stop paying for a full
  // render on every one of those.
  // Through the shared anchor, so the two filters cannot drift: `test-visual`
  // carries the same pair plus the lockfiles, and the demos have moved once
  // already. Editing only `test-visual` would still run the Visual module while
  // quietly dropping the pull request from `full` to `pr`.
  assert.deepEqual(filter('visual-full'), ['- *visual-sources']);
  // The anchor carries the anchor name on its key line, so `filter()` cannot read it.
  assert.match(
    filters,
    /visual-sources: &visual-sources\n\s+- '\.\/examples\/next\/visual-tests\/\*\*'\n\s+- '\.\/visual-tests\/\*\*'\n/,
    'the anchor must define exactly the visual tier\'s own two paths'
  );
  assert.match(filters, /test-visual:\n\s+- \*visual-sources\n/,
    'test-visual must take the same anchor, or the copies drift apart again');
  // Per wrapper, its own tree only — never the `*hot-shared` anchor the
  // Integration scopes carry, or a core change renders all three wrappers.
  assert.deepEqual(filter('visual-angular-wrapper'), ['- \'wrappers/angular-wrapper/**\'']);
  assert.deepEqual(filter('visual-react-wrapper'), ['- \'wrappers/react-wrapper/**\'']);
  assert.deepEqual(filter('visual-vue3'), ['- \'wrappers/vue3/**\'']);

  // Both reach test.yml: job outputs and the workflow_call re-export.
  assert.match(checks, /^ {6}visual-full: \$\{\{ steps\.path-filter\.outputs\.visual-full \}\}$/m);
  assert.match(checks, /^ {6}visual-wrappers: \$\{\{ steps\.visual-wrappers\.outputs\.list \}\}$/m);
  assert.match(checks, /^ {6}visual-full: \{ value: '\$\{\{ jobs\.scope\.outputs\.visual-full \}\}' \}$/m);
  assert.match(checks, /^ {6}visual-wrappers: \{ value: '\$\{\{ jobs\.scope\.outputs\.visual-wrappers \}\}' \}$/m);

  // The list is the wrapper directory names parseWrappers() accepts.
  const step = checks.slice(checks.indexOf('- id: visual-wrappers'), checks.indexOf('- id: manual-qa'));

  ['angular-wrapper', 'react-wrapper', 'vue3'].forEach((dir) => {
    assert.match(step, new RegExp(`w\\.push\\("${dir}"\\)`), `the visual-wrappers step no longer emits ${dir}`);
  });
  assert.match(step, /steps\.path-filter\.outputs\.visual-angular-wrapper/);
  assert.match(step, /steps\.path-filter\.outputs\.visual-react-wrapper/);
  assert.match(step, /steps\.path-filter\.outputs\.visual-vue3/);
});

test('the develop seed renders the seed tier', () => {
  assert.match(seed, /uses: \.\/\.github\/workflows\/visual\.yml\n\s+with:\n\s+tier: seed\n\s+secrets: inherit/);
});

test('the nightly renders the full tier on a weekday schedule and never writes the goldens', () => {
  // 02:00 UTC Tuesday to Saturday: the night after each weekday's merges.
  assert.match(nightly, /^on:\n {2}schedule:\n(?:\s+#.*\n)*\s+- cron: '0 2 \* \* 2-6'$/m);
  assert.match(nightly, /^\s+workflow_dispatch:/m, 'the nightly must be runnable by hand after a fix');
  // The self-validation trigger visual-seed.yml also carries, and the skip that
  // keeps a pull request from rendering the nightly.
  assert.match(nightly, /pull_request:\n\s+paths: \[ '\.github\/workflows\/visual-nightly\.yml' \]/);
  assert.match(nightly, new RegExp([
    'if: github\\.event_name != \'pull_request\' && github\\.ref_name == \'develop\'',
    'uses: \\./\\.github/workflows/visual\\.yml',
    'with:',
    'tier: full',
    'secrets: inherit',
  ].join('\\n\\s+')), 'the nightly must call visual.yml with tier: full, and skip itself on a pull request');
  // A dispatch can come from ANY ref, and visual.yml only checks the branch in
  // `compare` — after both render legs. Without a guard before the call, a
  // dispatch from a feature branch spends ~15 minutes on two runners rendering
  // the full matrix and then compares nothing. Same shape as visual-seed.yml's.
  assert.match(nightly, /^\s+if: github\.event_name == 'workflow_dispatch' && github\.ref_name != 'develop'$/m,
    'a wrong-ref dispatch must hit a job that fails, not render the whole matrix and discard it');

  const guard = nightly.slice(nightly.indexOf('  guard:'), nightly.indexOf('  visual:'));

  assert.match(guard, /exit 1/, 'the guard job must fail the run');
  assert.match(guard, /::error::/, 'the guard job must say why');
  assert.match(guard, /REF_NAME: \$\{\{ github\.ref_name \}\}/, 'the ref goes through env, never into the script body');
  // Parity with visual-seed.yml and develop.yml: no caller-level permissions
  // block, or the nested grant in visual.yml is validated against a second ceiling.
  assert.doesNotMatch(nightly, /^permissions:/m, 'visual-nightly.yml must not declare a permissions block');
  assert.match(nightly,
    /concurrency:\n(?:\s+#.*\n)*\s+group: visual-nightly-\$\{\{ github\.ref \}\}\n\s+cancel-in-progress: false/,
    'the nightly group must keep a static prefix and never cancel a render');
  assert.doesNotMatch(nightly, /\$\{\{ github\.workflow \}\}/);
  // The full render is never written anywhere by this file: visual.yml owns the
  // keys, and this caller adds no bucket write of its own.
  assert.doesNotMatch(nightly, /aws s3/, 'the nightly must never write to the bucket itself');
  assert.match(nightly, /if: env\.SLACK_WEBHOOK_URL != ''\n\s+uses: slackapi\/slack-github-action@/,
    'the Slack step must skip itself when the webhook secret is absent');
  assert.match(nightly, /if: \$\{\{ failure\(\) && github\.event_name != 'pull_request' \}\}/);
  assert.deepEqual(jobIds(nightly), ['guard', 'visual', 'notify']);
});

test('the comparison scripts run the tiered pipeline', () => {
  const compare = code(read('visual-tests/scripts/compare.mjs'));
  const fork = code(read('visual-tests/scripts/compare-fork.mjs'));

  // sync-expected → prune → compare → publish: the prune between the first two is
  // what turns a subset render into an exact subset comparison instead of ~1178
  // phantom deletions.
  assert.match(compare, /sync-expected/);
  assert.match(compare, /'compare'/);
  assert.match(compare, /'publish'/);

  // ORDER, not just presence. The sequence is the whole change: a prune moved
  // after `regSuit('compare')`, or a publish hoisted above it, leaves every
  // assertion above green while restoring the phantom deletions the prune exists
  // to remove — the expected tree would be trimmed after the comparison had
  // already read it. Indexes of the call sites, so a reorder fails here.
  const callAt = (needle) => {
    const at = compare.indexOf(needle);

    assert.notEqual(at, -1, `compare.mjs no longer contains ${needle}`);

    return at;
  };
  const syncAt = callAt("regSuit('sync-expected')");
  const pruneAt = callAt('pruneExpected(');
  const compareAt = callAt("regSuit('compare')");
  const publishAt = callAt("regSuit('publish')");

  assert.ok(syncAt < pruneAt,
    'the expected tree must be fetched before it is pruned, or the prune finds nothing');
  assert.ok(pruneAt < compareAt,
    'the prune must run before the comparison, or the subset render is compared against the full '
      + 'baseline and reports ~1178 phantom deletions');
  assert.ok(compareAt < publishAt,
    'the comparison must run before the publish, or the report published describes nothing');
  assert.doesNotMatch(compare, /'reg-suit',\s*'run'|reg-suit run/,
    'a bare `reg-suit run` fetches, compares and publishes in one go, leaving nowhere to prune the expected tree');
  assert.match(compare, /import \{[^}]*\bpruneExpected\b[^}]*\} from '[^']*visual-tiers\.mjs'/);
  assert.match(fork, /import \{[^}]*\bisInTier\b[^}]*\} from '[^']*visual-tiers\.mjs'/,
    'the credential-free comparison must filter the manifest to the tier as well');
  assert.ok(existsSync(path.join(root, 'visual-tests/lib/visual-tiers.mjs')));
});
