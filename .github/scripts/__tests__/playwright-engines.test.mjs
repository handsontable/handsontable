import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// tests/AGENTS.md ("The engine legs"): the specs tagged @cross-browser run on Firefox and WebKit too,
// through tests/playwright-engines.config.ts in one job of .github/workflows/e2e.yml. They are the
// only Firefox and WebKit run a pull request gets, and every link in that chain fails silently when
// it breaks: a job that stops running the config, a config that stops filtering by the tag (or
// stops inheriting the CI flake settings), or a spec that loses its tag all leave every check
// green while an engine goes untested. This pins the chain.
//
// Text-based, like the flake-settings pin: the tooling job installs no dependencies, so neither the
// config nor Playwright can be imported.

const ROOT = repoRoot();
const read = file => readFileSync(path.join(ROOT, file), 'utf8');
// Comments are dropped, so a commented-out line neither satisfies a pin nor hides a change. A line
// comment must follow whitespace or start the line, which keeps `http://` intact.
const stripTsComments = source => source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|\s)\/\/.*$/gm, '$1');
const stripYamlComments = source => source.replace(/(^|\s)#.*$/gm, '$1');

const ENGINES_CONFIG = 'tests/playwright-engines.config.ts';
const DOC = 'See tests/AGENTS.md, "The engine legs".';

// The specs that took over what the cross-browser visual specs photographed (DEV-3257), plus the
// column-move spec that asserts the header drag one of them showed. Each must stay tagged; a new
// tagged spec may join without touching this list.
const TAGGED_SPECS = [
  'clipboard-between-grids.spec.ts',
  'clipboard-scrolled-range.spec.ts',
  'column-move-sorting.spec.ts',
  'fill-handle-merged-cells.spec.ts',
  'filters-search-then-condition.spec.ts',
  'header-range-selection.spec.ts',
  'hidden-columns-context-menu.spec.ts',
  'manual-resize-drag-distance.spec.ts',
  'pagination-filter-sort.spec.ts',
  'tab-navigation-two-grids.spec.ts',
  'undo-redo-keyboard.spec.ts',
];

test('the engines config runs only tagged tests on Firefox and WebKit, inheriting the rest', () => {
  const config = stripTsComments(read(ENGINES_CONFIG));

  assert.match(config, /import base from '\.\/playwright\.config';/,
    `${ENGINES_CONFIG} must build on tests/playwright.config.ts. ${DOC}`);
  assert.match(config, /\.\.\.base,/, `${ENGINES_CONFIG} must spread the base config. ${DOC}`);
  assert.match(config, /engine\('e2e-firefox', 'Desktop Firefox'\)/, `e2e-firefox must run Desktop Firefox. ${DOC}`);
  assert.match(config, /engine\('e2e-webkit', 'Desktop Safari'\)/, `e2e-webkit must run Desktop Safari. ${DOC}`);
  assert.match(config, /grep: new RegExp\(CROSS_BROWSER_TAG\)/,
    `the engine projects must run only the tagged tests. ${DOC}`);
  // On the Linux runner Playwright's WebKit copies, cuts and pastes nothing on a real shortcut, so
  // a clipboard test there fails every run; dropping the exclusion turns the job red, not silent,
  // but the reason belongs next to the line that would be dropped.
  assert.match(config, /\{ \.\.\.engine\('e2e-webkit', 'Desktop Safari'\), grepInvert: new RegExp\(CLIPBOARD_SHORTCUT_TAG\) \}/,
    `e2e-webkit must leave out the tests tagged @clipboard-shortcut. ${DOC}`);
  assert.match(config, /theme: 'main', bundle: 'umd'/, `the engine projects run one theme and one bundle. ${DOC}`);

  // The CI flake settings and the reporters (the quarantine reporter decides the exit status) come
  // from the base config; an override here would decide the engine legs alone, unpinned.
  ['retries', 'failOnFlakyTests', 'forbidOnly', 'reporter', 'webServer'].forEach((key) => {
    assert.doesNotMatch(config, new RegExp(`\\b${key}\\s*:`),
      `${ENGINES_CONFIG} must inherit ${key} from tests/playwright.config.ts. ${DOC}`);
  });
});

test('the tags the config filters by are the ones the fixtures export', () => {
  const fixtures = read('tests/fixtures/test.ts');

  assert.match(fixtures, /export const CROSS_BROWSER_TAG = '@cross-browser';/,
    `tests/fixtures/test.ts must export CROSS_BROWSER_TAG. ${DOC}`);
  assert.match(fixtures, /export const CLIPBOARD_SHORTCUT_TAG = '@clipboard-shortcut';/,
    `tests/fixtures/test.ts must export CLIPBOARD_SHORTCUT_TAG. ${DOC}`);
});

test('e2e.yml runs the engines config in the same container, on the Playwright scope, and uploads its report', () => {
  const workflow = stripYamlComments(read('.github/workflows/e2e.yml'));
  const start = workflow.indexOf('\n  playwright-engines:');

  assert.ok(start > 0, `e2e.yml must keep the playwright-engines job. ${DOC}`);

  // The job runs to the next job key (two-space indent) or to the end of the file.
  const next = workflow.slice(start + 1).search(/\n {2}[\w-]+:\s*\n/);
  const job = next < 0 ? workflow.slice(start) : workflow.slice(start, start + 1 + next);
  const image = workflow.match(/\n {2}playwright:[\s\S]*?image: (\S+)/)[1];

  assert.ok(job.includes(`image: ${image}`), `the engines job must run the Chromium legs' container (${image}). ${DOC}`);
  assert.match(job, /if: inputs\.run-all \|\| inputs\.run-playwright/,
    `the engines job must run whenever the Playwright legs do. ${DOC}`);
  assert.match(job, /npx playwright test --config playwright-engines\.config\.ts/,
    `the engines job must run tests/playwright-engines.config.ts. ${DOC}`);
  // The container runs as root under a HOME owned by another user, where Firefox refuses to start:
  // without this every Firefox test fails at launch (the job's first CI run, 36 of 36).
  assert.match(job, /env:\s*\n\s*HOME: \/root\s*\n\s*run: cd tests && npx playwright test --config playwright-engines\.config\.ts/,
    `the engines job must run Playwright with HOME=/root, or Firefox cannot launch in the container. ${DOC}`);
  assert.match(job, /name: playwright-report-engines/,
    `the engines report keeps the playwright-report- prefix the flake ledger collects. ${DOC}`);
  assert.match(job, /if: failure\(\) \|\| steps\.playwright\.outputs\.quarantined-flaky == 'true'/,
    `the engines report uploads on the same condition as the Chromium legs'. ${DOC}`);
});

test('the specs that cover what the cross-browser captures showed stay tagged', () => {
  const dir = path.join(ROOT, 'tests/e2e');
  const present = new Set(readdirSync(dir));

  TAGGED_SPECS.forEach((spec) => {
    assert.ok(present.has(spec), `tests/e2e/${spec} is gone; update TAGGED_SPECS in this file. ${DOC}`);
    assert.match(stripTsComments(read(`tests/e2e/${spec}`)), /\{ tag: (CROSS_BROWSER_TAG|\[[^\]]*\bCROSS_BROWSER_TAG\b[^\]]*\]) \}/,
      `tests/e2e/${spec} must keep { tag: CROSS_BROWSER_TAG }, or Firefox and WebKit stop running it. ${DOC}`);
  });
});
