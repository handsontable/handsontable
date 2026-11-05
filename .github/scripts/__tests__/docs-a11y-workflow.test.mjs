import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';
import { job, jobIds, steps } from '../lib/workflow-text.mjs';
import { DOCS_A11Y_WORKFLOW, DOCS_AXE_ARTIFACT, sourcesOfWorkflow } from '../lib/a11y-ledger.mjs';

// tests/AGENTS.md ("A11y: the docs site scan"): the docs site scan is one report-only job, run on
// demand or by a workflow that calls it, never on a schedule or a pull request. Each link fails
// silently when it breaks: a workflow renamed away from the name the findings ledger records, an
// artifact renamed away from the one it downloads, a report renamed into the product report's
// artifact name, or a dispatch input interpolated into a script. This pins the chain.
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
    ['.github/workflows/docs-a11y.yml', 'tests/a11y/docs/**', 'tests/playwright.a11y-docs.config.ts'],
    `${DOCS}: a pull request runs the scan only when it changes the scan; a full scan is too long for every docs pull request. ${DOC}`);
  assert.match(triggers, /^ {6}base-url:\n(?: {8}.*\n)*? {8}type: string$/m, `${DOCS}: the dispatch names the deploy to scan`);
  assert.doesNotMatch(workflow, /^permissions:/m,
    `${DOCS}: no workflow-level permissions; a caller validates the job's grants against the token it hands down.`);
  assert.match(workflow, /^ {2}group: docs-a11y-\$\{\{ github\.ref \}\}$/m,
    `${DOCS}: a static concurrency prefix, never the workflow-name expression a called workflow resolves to the caller's.`);
});

test('docs-a11y.yml runs the docs config in the Playwright container, report-only, and uploads what the ledger reads', () => {
  const workflow = stripYamlComments(read(DOCS));

  assert.deepEqual(jobIds(workflow), ['scan'], `${DOCS}: one job. ${DOC}`);

  const scan = job(workflow, 'scan');
  const stepsOf = steps(scan);
  const step = name => stepsOf.find(entry => new RegExp(`^- name: ${name}$`, 'm').test(entry)) ?? '';
  const [, image] = /^ {6}image: (mcr\.microsoft\.com\/playwright:v[\d.]+-noble)$/m.exec(scan) ?? [];
  const [, productImage] = /^ {6}image: (mcr\.microsoft\.com\/playwright:v[\d.]+-noble)$/m.exec(job(stripYamlComments(read(A11Y)), 'axe')) ?? [];

  assert.match(scan, /^ {4}runs-on: ubuntu-26\.04$/m, `${DOCS}: the pinned runner image, like every workflow.`);
  assert.ok(image, `${DOCS}: the job runs inside the Playwright container.`);
  assert.equal(image, productImage, `${DOCS}: the same Chromium as the product scan, so a contrast result reads the same in both.`);
  assert.match(scan, /^ {4}continue-on-error: true$/m, `${DOCS}: report-only; a tooling failure never turns a caller red. ${DOC}`);
  assert.match(scan, /^ {4}permissions:\n {6}contents: read\n(?! {6})/m, `${DOCS}: the job reads the repository and writes nothing through the API.`);
  assert.match(scan, /^ {6}DOCS_A11Y_BASE_URL: \$\{\{ inputs\.base-url \}\}$/m, `${DOCS}: the deploy reaches the spec through the environment.`);
  assert.doesNotMatch(scan.replace(/^ {6}DOCS_A11Y_BASE_URL: .*$/m, ''), /inputs\./,
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
