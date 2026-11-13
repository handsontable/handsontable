import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';
import { job, jobIds, steps } from '../lib/workflow-text.mjs';
import { DOCS_A11Y_WORKFLOW, DOCS_AXE_ARTIFACT, DOCS_CHECKS_ARTIFACT, sourcesOfWorkflow } from '../lib/a11y-ledger.mjs';

// tests/AGENTS.md ("A11y: the docs site scan" and "A11y: the site checks beyond axe"): the docs site scan and
// the docs site checks are report-only jobs, run on demand or by a workflow that calls it, never on a schedule;
// a pull request that changes the scan runs the scan alone. Each link fails silently when it breaks: a workflow
// renamed away from the name the findings ledger records, an artifact renamed away from the one it downloads, a
// report renamed into the product report's artifact name, a dispatch input interpolated into a script, or a
// check run the verdict job does not expect. This pins the chain.
//
// Text-based, like the other workflow pins: the tooling job installs no dependencies.

const ROOT = repoRoot();
const read = file => readFileSync(path.join(ROOT, file), 'utf8');
const stripYamlComments = source => source.replace(/(^|\s)#.*$/gm, '$1');

const DOCS = '.github/workflows/docs-a11y.yml';
const A11Y = '.github/workflows/a11y.yml';
const CONFIG = 'tests/playwright.a11y-docs.config.ts';
const DOC = 'See tests/AGENTS.md, "A11y: the docs site scan".';

test('docs-a11y.yml is the Docs a11y workflow the ledger records, started by a dispatch, a caller, or a change to the scan itself', () => {
  const workflow = stripYamlComments(read(DOCS));
  const [, triggers] = /^on:\n([\s\S]*?)^\S/m.exec(workflow) ?? [];

  assert.match(workflow, new RegExp(`^name: ${DOCS_A11Y_WORKFLOW}$`, 'm'),
    `${DOCS}: the name is what isA11yRun and test-health.yml's trigger list read. ${DOC}`);
  assert.deepEqual(sourcesOfWorkflow(DOCS_A11Y_WORKFLOW), ['docs']);
  assert.ok(triggers, `${DOCS}: lost the on: block`);
  assert.deepEqual([...triggers.matchAll(/^ {2}([a-z_]+):/gm)].map(([, name]) => name), ['workflow_dispatch', 'pull_request', 'workflow_call'],
    `${DOCS}: on demand, from a caller, and on a change to the scan itself; the scan has no schedule. ${DOC}`);
  const [, paths = ''] = /^ {2}pull_request:\n {4}paths:\n((?: {6}- .*\n)+)/m.exec(triggers) ?? [];

  assert.deepEqual([...paths.matchAll(/- '([^']+)'/g)].map(([, file]) => file),
    ['.github/workflows/docs-a11y.yml', 'tests/a11y/docs/**', 'tests/a11y/axe-scan.ts', 'tests/a11y/issues.json',
      'tests/playwright.a11y-docs.config.ts', 'tests/reporters/a11y.ts', 'tests/lib/a11y-baseline.*', 'tests/lib/a11y-findings.*',
      'tests/lib/a11y-report.*', 'tests/lib/a11y-suites.*', 'tests/lib/a11y-check-run.*', 'tests/lib/a11y-docs-drift.*',
      'tests/lib/a11y-issues.*', 'tests/lib/a11y-evidence.*', 'tests/lib/a11y-site-checks.*', 'tests/lib/a11y-subset.*',
      'tests/lib/a11y-verdict.*', 'tests/lib/a11y-verdict-inputs.*', 'tests/lib/github-check-run.*',
      'tests/scripts/a11y-check-run.mjs', 'docs/tests/paths.js'],
    `${DOCS}: a pull request runs the scan only when it changes the scan's own code; a full scan is too long for every docs pull request. ${DOC}`);
  // Every module of tests/lib the spec, its reporter and the check run's poster reach, import by import, is in the
  // list, so a change to the scan's code, its verdict or its poster runs the scan.
  const modules = new Set();
  const pending = ['tests/a11y/docs/docs-axe.spec.ts', 'tests/reporters/a11y.ts', 'tests/scripts/a11y-check-run.mjs'];

  while (pending.length > 0) {
    for (const [, name] of read(pending.shift()).matchAll(/from '(?:(?:\.\.\/)+lib\/|\.\/)([a-z0-9-]+)\.mjs'/g)) {
      if (!modules.has(name) && existsSync(path.join(repoRoot(), `tests/lib/${name}.mjs`))) {
        modules.add(name);
        pending.push(`tests/lib/${name}.mjs`);
      }
    }
  }

  assert.ok(modules.has('github-check-run') && modules.has('a11y-issues'), 'read the imports, the poster\'s among them');
  for (const module of modules) {
    assert.ok(paths.includes(`'tests/lib/${module}.*'`), `${DOCS}: the scan reaches tests/lib/${module}.mjs, so a change there runs it`);
  }
  assert.match(triggers, /^ {6}base-url:\n(?: {8}.*\n)*? {8}type: string$/m, `${DOCS}: the dispatch names the deploy to scan`);
  assert.doesNotMatch(workflow, /^permissions:/m,
    `${DOCS}: no workflow-level permissions; a caller validates the job's grants against the token it hands down.`);
  assert.match(workflow, /^ {2}group: docs-a11y-\$\{\{ github\.ref \}\}$/m,
    `${DOCS}: a static concurrency prefix, never the workflow-name expression a called workflow resolves to the caller's.`);
});

test('docs-a11y.yml runs the docs config in the Playwright container, report-only, and uploads what the ledger reads', () => {
  const workflow = stripYamlComments(read(DOCS));

  assert.deepEqual(jobIds(workflow), ['check-inputs', 'scan', 'checks', 'verdict'],
    `${DOCS}: the inputs refused before a runner, the scan, the site checks and the run's verdict. ${DOC}`);

  const scan = job(workflow, 'scan');
  const stepsOf = steps(scan);
  const step = name => stepsOf.find(entry => new RegExp(`^- name: ${name}$`, 'm').test(entry)) ?? '';
  const [, image] = /^ {6}image: (mcr\.microsoft\.com\/playwright:v[\d.]+-noble)$/m.exec(scan) ?? [];
  const [, productImage] = /^ {6}image: (mcr\.microsoft\.com\/playwright:v[\d.]+-noble)$/m.exec(job(stripYamlComments(read(A11Y)), 'axe')) ?? [];

  assert.match(scan, /^ {4}runs-on: ubuntu-26\.04$/m, `${DOCS}: the pinned runner image, like every workflow.`);
  assert.ok(image, `${DOCS}: the job runs inside the Playwright container.`);
  assert.equal(image, productImage, `${DOCS}: the same Chromium as the product scan, so a contrast result reads the same in both.`);
  assert.match(scan, /^ {4}continue-on-error: true$/m, `${DOCS}: report-only; a tooling failure never turns a caller red. ${DOC}`);
  assert.match(scan, /^ {4}permissions:\n {6}contents: read\n {6}checks: write\n {6}actions: read\n(?! {6})/m,
    `${DOCS}: the job reads the repository, writes its check run, and reads when the staging deploy last finished, nothing else.`);
  assert.match(scan, /^ {4}needs: \[ check-inputs \]$/m, `${DOCS}: the scan starts once the inputs were read.`);
  assert.match(scan, /^ {6}DOCS_A11Y_BASE_URL: \$\{\{ inputs\.base-url \}\}$/m, `${DOCS}: the deploy reaches the spec through the environment.`);
  assert.doesNotMatch(scan.replace(/^ {6}DOCS_A11Y_BASE_URL: .*$/m, '').replace(/^ {8}A11Y_REPORT_URL: .*$/m, ''), /inputs\./,
    `${DOCS}: a dispatch input is free text; it is never interpolated into a script.`);
  assert.match(step('Run the docs site scan'), /^ {8}run: cd tests && npx playwright test --config playwright\.a11y-docs\.config\.ts$/m,
    `${DOCS}: the run step runs the docs config and nothing else. ${DOC}`);

  const upload = step('Upload the scan results');

  assert.match(upload, /^ {8}if: \$\{\{ !cancelled\(\) \}\}$/m, `${DOCS}: the results upload on a red run too.`);
  assert.match(upload, new RegExp(`^ {10}name: ${DOCS_AXE_ARTIFACT}$`, 'm'),
    `${DOCS}: the artifact the findings ledger downloads, outside the playwright-report-* glob. ${DOC}`);
  assert.match(upload, /^ {10}path: tests\/test-results\/a11y-docs$/m,
    `${DOCS}: the config's outputDir, so a11y-findings.json sits at the artifact's root where the ledger reads it.`);
  assert.match(read(CONFIG), /^ {2}outputDir: 'test-results\/a11y-docs',$/m, `${CONFIG}: the outputDir the upload names.`);

  const report = step('Upload the HTML report');

  assert.match(report, /^ {10}path: tests\/test-results\/a11y-docs\/docs-a11y-report\.html$/m,
    `${DOCS}: an unzipped artifact is named after its file; the product report is a11y-report.html, and a run that calls both scans uploads both.`);
  assert.match(report, /^ {10}archive: false$/m, `${DOCS}: one file, unzipped, so the browser opens it from the run page.`);
  assert.match(read('tests/lib/a11y-suites.mjs'), /reportFile: 'docs-a11y-report\.html',/, 'the reporter writes the file the upload names');
});

test('docs-a11y.yml posts the docs axe check run, runs the site checks on a dispatch or a call, and ends on the verdict', () => {
  const workflow = stripYamlComments(read(DOCS));
  const scan = job(workflow, 'scan');
  const post = steps(scan).find(entry => /^- name: Post the docs axe check run$/m.test(entry)) ?? '';
  const guard = '!cancelled() && (github.event_name != \'pull_request\' || (github.event.pull_request.head.repo.full_name == github.repository && github.actor != \'dependabot[bot]\'))';

  assert.ok(post.includes(`if: \${{ ${guard} }}`), `${DOCS}: the check run is posted behind the canonical fork guard.`);
  assert.match(post, /^ {8}continue-on-error: true$/m, `${DOCS}: a refused check run never fails the scan.`);
  assert.match(post, /^ {8}run: node tests\/scripts\/a11y-check-run\.mjs --suite docs$/m, `${DOCS}: the docs scan's check run, A11y / docs-axe report.`);

  const inputs = job(workflow, 'check-inputs');

  assert.match(inputs, /^ {10}A11Y_CHECKS: \$\{\{ inputs\.checks \}\}$/m, `${DOCS}: the checks input reaches the guard through the environment.`);
  assert.match(inputs, /run: node tests\/scripts\/a11y-dispatch-inputs\.mjs --ref "\$GITHUB_REF" --site docs --site-checks "\$A11Y_CHECKS"$/m,
    `${DOCS}: a subset on develop and an unknown check are refused before a runner is spent. ${DOC}`);

  const checks = job(workflow, 'checks');
  const stepOf = name => steps(checks).find(entry => new RegExp(`^- name: ${name}$`, 'm').test(entry)) ?? '';

  assert.match(checks, /^ {4}if: \$\{\{ github\.event_name != 'pull_request' \}\}$/m,
    `${DOCS}: the checks run on a dispatch or a call; a pull request runs the scan alone. ${DOC}`);
  assert.match(checks, /^ {4}continue-on-error: true$/m, `${DOCS}: report-only; a tooling failure never turns a caller red.`);
  assert.match(checks, /^ {6}HOT_A11Y_SITE: docs$/m, `${DOCS}: the site config reads the docs.`);
  assert.match(checks, /^ {6}A11Y_CHECKS: \$\{\{ inputs\.checks \}\}$/m, `${DOCS}: a subset reaches the config through the environment.`);
  assert.match(stepOf('Run the docs site checks'), /^ {8}run: cd tests && npx playwright test --config playwright\.a11y-sites\.config\.ts$/m);
  assert.match(stepOf('Upload the evidence'), new RegExp(`^ {10}name: ${DOCS_CHECKS_ARTIFACT}$`, 'm'),
    `${DOCS}: the artifact the findings ledger downloads, outside the playwright-report-* glob.`);
  assert.match(stepOf('Upload the evidence'), /^ {10}path: tests\/test-results\/a11y-docs-checks$/m,
    `${DOCS}: the documents sit at the artifact's root, where the ledger reads them.`);
  assert.match(stepOf('Post the docs check runs'), /^ {8}run: node tests\/scripts\/a11y-evidence-report\.mjs --check-run$/m);

  const verdict = job(workflow, 'verdict');

  assert.match(verdict, /^ {4}needs: \[ scan, checks \]$/m, `${DOCS}: the verdict waits for every job.`);
  assert.match(verdict, /^ {4}if: \$\{\{ !cancelled\(\) && github\.event_name != 'pull_request' \}\}$/m);
  assert.match(verdict, /run: node tests\/scripts\/a11y-run-verdict\.mjs --prefix "A11y \/ docs-" --expect "A11y \/ docs-axe report" --ref "\$GITHUB_REF" --site docs --site-checks "\$A11Y_CHECKS"$/m,
    `${DOCS}: the verdict expects the docs scan's check run and one per docs site check (or per check of the subset). ${DOC}`);
});
