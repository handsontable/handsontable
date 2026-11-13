import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { readBlocks } from '../lib/leg-declarations.mjs';

/**
 * The proof that the declared legs are the legs Playwright runs (`tests/AGENTS.md`, "Declaring the
 * legs"). The static sweep reads the tags out of the source and the config greps for them; this spec
 * asks Playwright itself, through `--list --reporter=json`, which projects each test belongs to, and
 * compares that with a truth table written out here, independent of the lib the config uses. It
 * catches a grep that disagrees with a tag, a title that happens to contain a tag, and a declaration
 * that evaluates to `undefined` (a misspelled constant, a missing import): Playwright accepts
 * `{ tag: undefined }` without a word, and the spec then quietly runs on `e2e-main` only.
 *
 * No browser: each case spawns `playwright test --list` in a child process and reads JSON, the
 * `quarantine-policy.spec.ts` pattern. It carries no leg tag itself, so a pull request runs it on
 * `e2e-main`; the full matrix runs it six times, which is cheap.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const testsRoot = path.resolve(here, '..');
const require = createRequire(import.meta.url);
const playwrightCli = require.resolve('@playwright/test/cli');

// The truth table, written out on purpose rather than imported: a mistake in the lib must not be
// able to agree with itself here.
const ALL_PROJECTS = ['e2e-main', 'e2e-horizon', 'e2e-classic', 'e2e-main-min', 'e2e-horizon-min', 'e2e-classic-min'];
const PROJECTS_BY_DECLARATION: Record<string, string[]> = {
  '': ['e2e-main'],
  themes: ['e2e-main', 'e2e-horizon', 'e2e-classic'],
  bundles: ['e2e-main', 'e2e-main-min'],
  'themes+bundles': ALL_PROJECTS,
};
const LEG_TAGS = ['themes', 'bundles'];
const CLASSIC_PROJECTS = ['e2e-classic', 'e2e-classic-min'];

type ListedTest = { file: string, title: string, tags: string[], projects: string[] };

/**
 * Runs `playwright test --list --reporter=json` on this package in a child process.
 *
 * @param env Environment overrides; `HOT_E2E_FULL_MATRIX` is cleared first, so the parent's own
 * setting (the nightly runs this spec with it on) never decides what the child lists.
 * @returns The child's status, stdout and stderr.
 */
function listRun(env: Record<string, string> = {}) {
  const inherited = Object.fromEntries(Object.entries(process.env)
    .filter(([key]) => !/^(PW_|PLAYWRIGHT_|TEST_WORKER_|TEST_PARALLEL_)/.test(key) && key !== 'HOT_E2E_FULL_MATRIX'));
  const child = spawnSync(process.execPath, [playwrightCli, 'test', '--list', '--reporter=json', '-c', path.join(testsRoot, 'playwright.config.ts')], {
    cwd: testsRoot,
    env: { ...inherited, ...env, FORCE_COLOR: '0' },
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    // Under the describe's 60 s budget: `spawnSync` blocks the worker's event loop, so Playwright's own
    // timer cannot fire while the child runs, and a child that outlives the budget would end as a bare
    // timeout instead of a failure that shows the child's stderr.
    timeout: 50_000,
  });

  return { status: child.status, stdout: child.stdout ?? '', stderr: child.stderr ?? '' };
}

/**
 * Every test of a `--list` JSON report, with its file, its ` › `-joined title path, its tags (without
 * the `@`, as Playwright reports them) and the projects it runs on.
 */
function listedTests(json: string): ListedTest[] {
  const report = JSON.parse(json);
  const out: ListedTest[] = [];
  const walk = (suite: any, file: string, titles: string[]) => {
    const titlePath = suite.title && suite.title !== file ? [...titles, suite.title] : titles;

    (suite.specs ?? []).forEach((spec: any) => {
      out.push({
        file,
        title: [...titlePath, spec.title].join(' › '),
        tags: spec.tags ?? [],
        projects: spec.tests.map((entry: any) => entry.projectName).sort(),
      });
    });
    (suite.suites ?? []).forEach((child: any) => walk(child, file, titlePath));
  };

  (report.suites ?? []).forEach((fileSuite: any) => walk(fileSuite, fileSuite.file ?? fileSuite.title, []));

  return out;
}

const declarationOf = (tags: string[]) => LEG_TAGS.filter(tag => tags.includes(tag)).join('+');

/**
 * The projects a test runs on, given the projects its legs allow: a `motion` test checks a motion the
 * classic theme never runs, so both classic projects leave it out, on the full matrix too.
 */
const withoutMotionOnClassic = (tags: string[], projects: string[]) => [...projects]
  .filter(project => !tags.includes('motion') || !CLASSIC_PROJECTS.includes(project))
  .sort();

test.describe('leg declarations', () => {
  // The declared list is spawned once per file, in `beforeAll`: serial mode keeps the four tests in one
  // worker, so the three tests that read it share one child of about 3 s instead of spawning their own.
  // Each test then runs at most one more child, so 60 s is room enough on a busy runner.
  test.describe.configure({ mode: 'serial', timeout: 60_000 });

  let declaredList: ListedTest[] = [];

  test.beforeAll(() => {
    const run = listRun();

    expect(run.status, run.stderr).toBe(0);
    declaredList = listedTests(run.stdout);
  });

  test('every test runs on exactly the projects its tags declare', async() => {
    const tests = declaredList;

    // Vacuity: a filter that matched nothing would make the loop below prove nothing.
    expect(tests.length).toBeGreaterThan(2000);

    const wrong = tests
      .filter(entry => JSON.stringify(entry.projects) !==
        JSON.stringify(withoutMotionOnClassic(entry.tags, PROJECTS_BY_DECLARATION[declarationOf(entry.tags)])))
      .map(entry => `${entry.file} › ${entry.title}: tags [${entry.tags.join(', ')}] but projects [${entry.projects.join(', ')}]`);

    expect(wrong, wrong.slice(0, 10).join('\n')).toEqual([]);

    // No leg may be empty: a project whose grep matches nothing fails the run with "No tests found", by
    // design, so the tree has to keep at least one spec of each declaration shape.
    for (const project of ALL_PROJECTS) {
      expect(tests.some(entry => entry.projects.includes(project)), `${project} would run no test`).toBe(true);
    }
    expect(tests.some(entry => declarationOf(entry.tags) === ''), 'the default (e2e-main only) is in use').toBe(true);
  });

  test('the full matrix runs every test on every project its tags allow and loses no test', async() => {
    const full = listRun({ HOT_E2E_FULL_MATRIX: '1' });

    expect(full.status, full.stderr).toBe(0);

    const declaredTests = declaredList;
    const fullTests = listedTests(full.stdout);
    const key = (entry: ListedTest) => `${entry.file}|${entry.title}`;

    expect(new Set(fullTests.map(key))).toEqual(new Set(declaredTests.map(key)));
    const partial = fullTests
      .filter(entry => JSON.stringify(entry.projects) !== JSON.stringify(withoutMotionOnClassic(entry.tags, ALL_PROJECTS)));

    expect(partial.map(entry => `${entry.file} › ${entry.title}`), 'every test on every project its tags allow').toEqual([]);
  });

  test('the tags Playwright sees are the tags written in the source, so a misspelled constant cannot drop a spec off its legs', async() => {
    const byFile = new Map<string, Set<string>>();

    declaredList.forEach((entry) => {
      const tags = byFile.get(entry.file) ?? new Set<string>();

      entry.tags.filter(tag => LEG_TAGS.includes(tag)).forEach(tag => tags.add(tag));
      byFile.set(entry.file, tags);
    });

    const walk = (dir: string, out: string[]): string[] => {
      readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
        const full = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          walk(full, out);
        } else if (entry.name.endsWith('.spec.ts')) {
          out.push(full);
        }
      });

      return out;
    };
    const disagreements: string[] = [];
    const specs = walk(path.join(testsRoot, 'e2e'), []);

    expect(specs.length).toBeGreaterThan(200);
    specs.forEach((full) => {
      const file = path.relative(testsRoot, full).split(path.sep).join('/');
      const written = new Set<string>();

      readBlocks(readFileSync(full, 'utf8'), file).filter(block => block.depth === 0).forEach((block) => {
        block.tags.filter(tag => LEG_TAGS.some(leg => tag === `@${leg}`)).forEach(tag => written.add(tag.slice(1)));
      });
      const seen = byFile.get(file) ?? new Set<string>();

      if ([...written].sort().join() !== [...seen].sort().join()) {
        disagreements.push(`${file}: source declares [${[...written].join(', ')}], Playwright sees [${[...seen].join(', ')}]`);
      }
    });

    expect(disagreements, disagreements.join('\n')).toEqual([]);
  });

  test('a value of HOT_E2E_FULL_MATRIX the config does not know fails the run instead of picking a shape', async() => {
    const run = listRun({ HOT_E2E_FULL_MATRIX: 'true' });

    expect(run.status).not.toBe(0);
    expect(`${run.stdout}\n${run.stderr}`).toContain('HOT_E2E_FULL_MATRIX must be "1"');
  });
});
