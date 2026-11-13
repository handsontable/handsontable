import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';
import { job, jobIds, steps } from '../lib/workflow-text.mjs';
import { WEBSITE_A11Y_WORKFLOW, WEBSITE_AXE_ARTIFACT, WEBSITE_CHECKS_ARTIFACT, sourcesOfWorkflow } from '../lib/a11y-ledger.mjs';

// tests/AGENTS.md ("A11y: the website scan" and "A11y: the site checks beyond axe"): the website scan and the
// website site checks are report-only jobs, run on demand or by a workflow that calls it, never on a schedule; a
// pull request that changes the scan runs the scan alone. The same chain as the docs site's
// (`docs-a11y-workflow.test.mjs`), with the website's names. Each link fails silently when it breaks: a workflow
// renamed away from the name the findings ledger records, an artifact renamed away from the one it downloads, a
// report renamed into the product report's artifact name, a dispatch input interpolated into a script, or a
// check run the verdict job does not expect. This pins the chain.
//
// Text-based, like the other workflow pins: the tooling job installs no dependencies.

const ROOT = repoRoot();
const read = file => readFileSync(path.join(ROOT, file), 'utf8');
const stripYamlComments = source => source.replace(/(^|\s)#.*$/gm, '$1');

const WEBSITE = '.github/workflows/website-a11y.yml';
const A11Y = '.github/workflows/a11y.yml';
const CONFIG = 'tests/playwright.a11y-website.config.ts';
const DOC = 'See tests/AGENTS.md, "A11y: the website scan".';

test('website-a11y.yml is the Website a11y workflow the ledger records, started by a dispatch, a caller, or a change to the scan itself', () => {
  const workflow = stripYamlComments(read(WEBSITE));
  const [, triggers] = /^on:\n([\s\S]*?)^\S/m.exec(workflow) ?? [];

  assert.match(workflow, new RegExp(`^name: ${WEBSITE_A11Y_WORKFLOW}$`, 'm'),
    `${WEBSITE}: the name is what isA11yRun and test-health.yml's trigger list read. ${DOC}`);
  assert.deepEqual(sourcesOfWorkflow(WEBSITE_A11Y_WORKFLOW), ['website']);
  assert.ok(triggers, `${WEBSITE}: lost the on: block`);
  assert.deepEqual([...triggers.matchAll(/^ {2}([a-z_]+):/gm)].map(([, name]) => name), ['workflow_dispatch', 'pull_request', 'workflow_call'],
    `${WEBSITE}: on demand, from a caller, and on a change to the scan itself; the scan has no schedule. ${DOC}`);
  const [, paths = ''] = /^ {2}pull_request:\n {4}paths:\n((?: {6}- .*\n)+)/m.exec(triggers) ?? [];

  assert.deepEqual([...paths.matchAll(/- '([^']+)'/g)].map(([, file]) => file),
    ['.github/workflows/website-a11y.yml', 'tests/a11y/website/**', 'tests/a11y/axe-scan.ts', 'tests/a11y/issues.json',
      'tests/playwright.a11y-website.config.ts', 'tests/reporters/a11y.ts', 'tests/lib/a11y-baseline.*', 'tests/lib/a11y-findings.*',
      'tests/lib/a11y-report.*', 'tests/lib/a11y-suites.*', 'tests/lib/a11y-check-run.*', 'tests/lib/a11y-docs-drift.*',
      'tests/lib/a11y-issues.*', 'tests/lib/a11y-evidence.*', 'tests/lib/a11y-site-checks.*', 'tests/lib/a11y-subset.*',
      'tests/lib/a11y-verdict.*', 'tests/lib/a11y-verdict-inputs.*', 'tests/lib/github-check-run.*', 'tests/lib/website-pages.*',
      'tests/scripts/a11y-check-run.mjs'],
    `${WEBSITE}: a pull request runs the scan only when it changes the scan's own code. ${DOC}`);
  // Every module of tests/lib the spec, its reporter and the check run's poster reach, import by import, is in the
  // list, so a change to the scan's code, its verdict or its poster runs the scan.
  const modules = new Set();
  const pending = ['tests/a11y/website/website-axe.spec.ts', 'tests/reporters/a11y.ts', 'tests/scripts/a11y-check-run.mjs'];

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
    assert.ok(paths.includes(`'tests/lib/${module}.*'`), `${WEBSITE}: the scan reaches tests/lib/${module}.mjs, so a change there runs it`);
  }
  assert.match(triggers, /^ {6}base-url:\n(?: {8}.*\n)*? {8}type: string$/m, `${WEBSITE}: the dispatch names the deploy to scan`);
  assert.doesNotMatch(workflow, /^permissions:/m,
    `${WEBSITE}: no workflow-level permissions; a caller validates the job's grants against the token it hands down.`);
  assert.match(workflow, /^ {2}group: website-a11y-\$\{\{ github\.ref \}\}$/m,
    `${WEBSITE}: a static concurrency prefix, never the workflow-name expression a called workflow resolves to the caller's.`);
});

test('website-a11y.yml runs the website config in the Playwright container, report-only, and uploads what the ledger reads', () => {
  const workflow = stripYamlComments(read(WEBSITE));

  assert.deepEqual(jobIds(workflow), ['check-inputs', 'scan', 'checks', 'verdict'],
    `${WEBSITE}: the inputs refused before a runner, the scan, the site checks and the run's verdict. ${DOC}`);

  const scan = job(workflow, 'scan');
  const stepsOf = steps(scan);
  const step = name => stepsOf.find(entry => new RegExp(`^- name: ${name}$`, 'm').test(entry)) ?? '';
  const [, image] = /^ {6}image: (mcr\.microsoft\.com\/playwright:v[\d.]+-noble)$/m.exec(scan) ?? [];
  const [, productImage] = /^ {6}image: (mcr\.microsoft\.com\/playwright:v[\d.]+-noble)$/m.exec(job(stripYamlComments(read(A11Y)), 'axe')) ?? [];

  assert.match(scan, /^ {4}runs-on: ubuntu-26\.04$/m, `${WEBSITE}: the pinned runner image, like every workflow.`);
  assert.ok(image, `${WEBSITE}: the job runs inside the Playwright container.`);
  assert.equal(image, productImage, `${WEBSITE}: the same Chromium as the product scan, so a contrast result reads the same in both.`);
  assert.match(scan, /^ {4}continue-on-error: true$/m, `${WEBSITE}: report-only; a tooling failure never turns a caller red. ${DOC}`);
  assert.match(scan, /^ {4}permissions:\n {6}contents: read\n {6}checks: write\n(?! {6})/m,
    `${WEBSITE}: the job reads the repository and writes its check run, nothing else.`);
  assert.match(scan, /^ {4}needs: \[ check-inputs \]$/m, `${WEBSITE}: the scan starts once the inputs were read.`);
  assert.match(scan, /^ {6}WEBSITE_A11Y_BASE_URL: \$\{\{ inputs\.base-url \}\}$/m, `${WEBSITE}: the deploy reaches the spec through the environment.`);
  assert.doesNotMatch(scan.replace(/^ {6}WEBSITE_A11Y_BASE_URL: .*$/m, '').replace(/^ {8}A11Y_REPORT_URL: .*$/m, ''), /inputs\./,
    `${WEBSITE}: a dispatch input is free text; it is never interpolated into a script.`);
  assert.match(step('Run the website scan'), /^ {8}run: cd tests && npx playwright test --config playwright\.a11y-website\.config\.ts$/m,
    `${WEBSITE}: the run step runs the website config and nothing else. ${DOC}`);

  const upload = step('Upload the scan results');

  assert.match(upload, /^ {8}if: \$\{\{ !cancelled\(\) \}\}$/m, `${WEBSITE}: the results upload on a red run too.`);
  assert.match(upload, new RegExp(`^ {10}name: ${WEBSITE_AXE_ARTIFACT}$`, 'm'),
    `${WEBSITE}: the artifact the findings ledger downloads, outside the playwright-report-* glob. ${DOC}`);
  assert.match(upload, /^ {10}path: tests\/test-results\/a11y-website$/m,
    `${WEBSITE}: the config's outputDir, so a11y-findings.json sits at the artifact's root where the ledger reads it.`);
  assert.match(read(CONFIG), /^ {2}outputDir: 'test-results\/a11y-website',$/m, `${CONFIG}: the outputDir the upload names.`);

  const report = step('Upload the HTML report');

  assert.match(report, /^ {10}path: tests\/test-results\/a11y-website\/website-a11y-report\.html$/m,
    `${WEBSITE}: an unzipped artifact is named after its file; the product report is a11y-report.html, and a run that calls both scans uploads both.`);
  assert.match(report, /^ {10}archive: false$/m, `${WEBSITE}: one file, unzipped, so the browser opens it from the run page.`);
  assert.match(read('tests/lib/a11y-suites.mjs'), /reportFile: 'website-a11y-report\.html',/, 'the reporter writes the file the upload names');
});

test('website-a11y.yml posts the website axe check run, runs the site checks on a dispatch or a call, and ends on the verdict', () => {
  const workflow = stripYamlComments(read(WEBSITE));
  const scan = job(workflow, 'scan');
  const post = steps(scan).find(entry => /^- name: Post the website axe check run$/m.test(entry)) ?? '';
  const guard = '!cancelled() && (github.event_name != \'pull_request\' || (github.event.pull_request.head.repo.full_name == github.repository && github.actor != \'dependabot[bot]\'))';

  assert.ok(post.includes(`if: \${{ ${guard} }}`), `${WEBSITE}: the check run is posted behind the canonical fork guard.`);
  assert.match(post, /^ {8}continue-on-error: true$/m, `${WEBSITE}: a refused check run never fails the scan.`);
  assert.match(post, /^ {8}run: node tests\/scripts\/a11y-check-run\.mjs --suite website$/m, `${WEBSITE}: the website scan's check run, A11y / website-axe report.`);

  const inputs = job(workflow, 'check-inputs');

  assert.match(inputs, /^ {10}A11Y_CHECKS: \$\{\{ inputs\.checks \}\}$/m, `${WEBSITE}: the checks input reaches the guard through the environment.`);
  assert.match(inputs, /run: node tests\/scripts\/a11y-dispatch-inputs\.mjs --ref "\$GITHUB_REF" --site website --site-checks "\$A11Y_CHECKS"$/m,
    `${WEBSITE}: a subset on develop and an unknown check are refused before a runner is spent. ${DOC}`);

  const checks = job(workflow, 'checks');
  const stepOf = name => steps(checks).find(entry => new RegExp(`^- name: ${name}$`, 'm').test(entry)) ?? '';

  assert.match(checks, /^ {4}if: \$\{\{ github\.event_name != 'pull_request' \}\}$/m,
    `${WEBSITE}: the checks run on a dispatch or a call; a pull request runs the scan alone. ${DOC}`);
  assert.match(checks, /^ {4}continue-on-error: true$/m, `${WEBSITE}: report-only; a tooling failure never turns a caller red.`);
  assert.match(checks, /^ {6}HOT_A11Y_SITE: website$/m, `${WEBSITE}: the site config reads the website.`);
  assert.match(checks, /^ {6}A11Y_CHECKS: \$\{\{ inputs\.checks \}\}$/m, `${WEBSITE}: a subset reaches the config through the environment.`);
  assert.match(stepOf('Run the website site checks'), /^ {8}run: cd tests && npx playwright test --config playwright\.a11y-sites\.config\.ts$/m);
  assert.match(stepOf('Upload the evidence'), new RegExp(`^ {10}name: ${WEBSITE_CHECKS_ARTIFACT}$`, 'm'),
    `${WEBSITE}: the artifact the findings ledger downloads, outside the playwright-report-* glob.`);
  assert.match(stepOf('Upload the evidence'), /^ {10}path: tests\/test-results\/a11y-website-checks$/m,
    `${WEBSITE}: the documents sit at the artifact's root, where the ledger reads them.`);
  assert.match(stepOf('Post the website check runs'), /^ {8}run: node tests\/scripts\/a11y-evidence-report\.mjs --check-run$/m);

  const verdict = job(workflow, 'verdict');

  assert.match(verdict, /^ {4}needs: \[ scan, checks \]$/m, `${WEBSITE}: the verdict waits for every job.`);
  assert.match(verdict, /^ {4}if: \$\{\{ !cancelled\(\) && github\.event_name != 'pull_request' \}\}$/m);
  assert.match(verdict, /run: node tests\/scripts\/a11y-run-verdict\.mjs --prefix "A11y \/ website-" --expect "A11y \/ website-axe report" --ref "\$GITHUB_REF" --site website --site-checks "\$A11Y_CHECKS"$/m,
    `${WEBSITE}: the verdict expects the website scan's check run and one per website site check (or per check of the subset). ${DOC}`);
});
