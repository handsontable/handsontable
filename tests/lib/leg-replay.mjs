/**
 * The ledger replay: does the declared leg matrix still catch every red the full matrix caught?
 *
 * The flake ledger (`.github/workflows/test-health.yml`, published as `test-health/ledger.json`)
 * records every flaky or failed Playwright test of every red run, with the leg it was red on. Once a
 * spec declares its legs (`leg-declarations.mjs`), a test red on `e2e-horizon` is only ever seen on a
 * pull request if its spec declares `THEMES_TAG`; otherwise the nightly's full matrix is the first
 * to see it. This module replays the ledger against a declaration: for every run in which a test was
 * red on a Chromium leg other than `e2e-main`, it asks whether the declared tree would have run the
 * test on that leg, and lists the misses.
 *
 * Rules, per test and run:
 * - A run where `e2e-main` was red too is cross-leg evidence (the failure is not about the leg) and is
 *   never a reason to tag. The ledger holds red runs only, so a run with no `e2e-main` entry counts as
 *   main green; that over-tags in the safe direction.
 * - Otherwise the run is off-main evidence. `e2e-horizon`/`e2e-classic` need `THEMES_TAG`, `e2e-main-min`
 *   needs `BUNDLES_TAG`, and `e2e-horizon-min`/`e2e-classic-min` need both (the AND the `-min` theme
 *   legs grep for). A red on a `-min` theme leg alone therefore asks for both tags, strictly.
 * - The verdict says how much the evidence is worth: `strong` when the test was never red on `e2e-main`
 *   and has two or more off-main runs, a deterministic `failed`, or an axis-consistent pair in one run
 *   (horizon with horizon-min, classic with classic-min, main-min with another `-min`); `flaky-suspect`
 *   when it was red on `e2e-main` in another run (its home is the flake playbook, and it is first in
 *   line for untagging); `weak` for one flaky run on one leg.
 *
 * In proof mode the declared tree is Playwright's own `--list --reporter=json` of the tagged specs,
 * whose `projectName` membership is authoritative; a classification file (`file → { themes, bundles }`)
 * stands in for it before the tags are written. A test whose file is not in the tree is an orphan
 * (reported, never a miss); a test whose title the tree no longer has is checked at file level and
 * marked `title-drift`. No I/O in here; `tests/scripts/leg-replay.mjs` is the command.
 */
import { projectsOf } from './leg-declarations.mjs';

export const MAIN_LEG = 'e2e-main';
export const CHROMIUM_LEGS = Object.freeze([
  'e2e-main', 'e2e-horizon', 'e2e-classic', 'e2e-main-min', 'e2e-horizon-min', 'e2e-classic-min',
]);
const TITLE_SEPARATOR = ' › ';

/**
 * The declaration a spec needs for a test to run on `leg`.
 *
 * @param {string} leg A Chromium leg.
 * @returns {{themes: boolean, bundles: boolean}} The axes the leg greps for.
 */
export function legRequirement(leg) {
  if (!CHROMIUM_LEGS.includes(leg)) {
    throw new Error(`${JSON.stringify(leg)} is not one of the Chromium legs: ${CHROMIUM_LEGS.join(', ')}`);
  }

  return {
    themes: leg !== 'e2e-main' && leg !== 'e2e-main-min',
    bundles: leg.endsWith('-min'),
  };
}

/**
 * The smallest declaration under which every one of `legs` runs the test.
 *
 * @param {Iterable<string>} legs Chromium legs.
 * @returns {{themes: boolean, bundles: boolean}} The union of the legs' requirements.
 */
export function requiredLegs(legs) {
  const required = { themes: false, bundles: false };

  for (const leg of legs) {
    const requirement = legRequirement(leg);

    required.themes ||= requirement.themes;
    required.bundles ||= requirement.bundles;
  }

  return required;
}

/**
 * The ledger's Playwright Chromium entries grouped by test, then by run.
 *
 * @param {object[]} entries The ledger's `entries`.
 * @param {object} [options] Options.
 * @param {string} [options.since] An ISO date; entries seen before it are left out.
 * @returns {Map<string, {file: string, title: string, runs: Map<string, object>}>} Tests by `file|title`.
 */
export function groupEvidence(entries, { since } = {}) {
  const tests = new Map();

  for (const entry of entries) {
    if (entry.tier !== 'playwright' || !CHROMIUM_LEGS.includes(entry.leg)) {
      continue;
    }
    if (since && entry.seenAt < since) {
      continue;
    }

    const key = `${entry.file}|${entry.title}`;
    const test = tests.get(key) ?? { file: entry.file, title: entry.title, runs: new Map() };
    const runId = String(entry.runId);
    const run = test.runs.get(runId) ?? {
      runId,
      legs: new Set(),
      statuses: new Set(),
      branch: entry.branch,
      runUrl: entry.runUrl,
      seenAt: entry.seenAt,
    };

    run.legs.add(entry.leg);
    run.statuses.add(entry.status);
    if (entry.seenAt > run.seenAt) {
      run.seenAt = entry.seenAt;
    }
    test.runs.set(runId, run);
    tests.set(key, test);
  }

  return tests;
}

/**
 * Whether one run's red legs pair up along one axis: both legs of a theme, or two `-min` legs.
 *
 * @param {Set<string>} legs The run's red legs.
 * @returns {boolean} `true` for an axis-consistent pair.
 */
function axisConsistent(legs) {
  const hasBoth = (a, b) => legs.has(a) && legs.has(b);
  const minLegs = [...legs].filter(leg => leg.endsWith('-min'));

  return hasBoth('e2e-horizon', 'e2e-horizon-min') || hasBoth('e2e-classic', 'e2e-classic-min')
    || (legs.has('e2e-main-min') && minLegs.length >= 2);
}

/**
 * One test's evidence, sorted into main, cross-leg and off-main runs, with the verdict and the
 * declaration the off-main runs require.
 *
 * @param {{file: string, title: string, runs: Map<string, object>}} test A grouped test.
 * @returns {object} The assessment.
 */
export function assessTest(test) {
  const runs = [...test.runs.values()].sort((a, b) => a.seenAt.localeCompare(b.seenAt));
  const mainRuns = runs.filter(run => run.legs.has(MAIN_LEG));
  const offMainRuns = runs.filter(run => !run.legs.has(MAIN_LEG));
  const required = requiredLegs(offMainRuns.flatMap(run => [...run.legs]));
  let verdict = null;

  if (offMainRuns.length > 0) {
    if (mainRuns.length > 0) {
      verdict = 'flaky-suspect';
    } else if (offMainRuns.length >= 2
      || offMainRuns.some(run => run.statuses.has('failed'))
      || offMainRuns.some(run => axisConsistent(run.legs))) {
      verdict = 'strong';
    } else {
      verdict = 'weak';
    }
  }

  return {
    file: test.file,
    title: test.title,
    mainRuns,
    crossLegRuns: mainRuns.filter(run => run.legs.size > 1),
    offMainRuns,
    required,
    verdict,
  };
}

/**
 * The projects every file and every test of a Playwright `--list --reporter=json` run on.
 *
 * @param {object} list The JSON report of `npx playwright test --list --reporter=json`.
 * @returns {{files: Map<string, Set<string>>, tests: Map<string, Set<string>>}} Projects by file, and by
 * `file|title path` with the path joined by ` › ` as the ledger writes it.
 */
export function projectsFromList(list) {
  const files = new Map();
  const tests = new Map();
  const walk = (suite, file, titles) => {
    const path = suite.title && suite.title !== file ? [...titles, suite.title] : titles;

    (suite.specs ?? []).forEach((spec) => {
      const key = `${file}|${[...path, spec.title].join(TITLE_SEPARATOR)}`;
      const projects = tests.get(key) ?? new Set();

      spec.tests.forEach(entry => projects.add(entry.projectName ?? entry.projectId));
      tests.set(key, projects);
      const fileProjects = files.get(file) ?? new Set();

      projects.forEach(project => fileProjects.add(project));
      files.set(file, fileProjects);
    });
    (suite.suites ?? []).forEach(child => walk(child, file, path));
  };

  (list.suites ?? []).forEach(fileSuite => walk(fileSuite, fileSuite.file ?? fileSuite.title, []));

  return { files, tests };
}

/**
 * The projects every file runs on under an assumed classification, before the tags are written.
 *
 * @param {Record<string, {themes: boolean, bundles: boolean}>} assumed Declarations by file; a file not
 * listed is the default (`e2e-main` only).
 * @param {string[]} [knownFiles] Every file of the tree, so an unlisted one is the default rather than
 * an orphan; when omitted, the listed files are the tree.
 * @returns {{files: Map<string, Set<string>>, tests: Map<string, Set<string>>}} Projects by file; no
 * test-level entries.
 */
export function projectsFromAssumption(assumed, knownFiles = Object.keys(assumed)) {
  const files = new Map();

  for (const file of new Set([...knownFiles, ...Object.keys(assumed)])) {
    files.set(file, new Set(projectsOf(assumed[file] ?? { themes: false, bundles: false })));
  }

  return { files, tests: new Map() };
}

/**
 * Replays the ledger against a declared tree.
 *
 * @param {object} input The replay input.
 * @param {object[]} input.entries The ledger's `entries`.
 * @param {{files: Map<string, Set<string>>, tests: Map<string, Set<string>>}|null} [input.declared] The
 * declared tree, from `projectsFromList()` or `projectsFromAssumption()`; `null` reports the needs only.
 * @param {string} [input.since] An ISO date; entries seen before it are left out.
 * @returns {object} The tests with off-main evidence, their coverage, the misses and a summary.
 */
export function replay({ entries, declared = null, since }) {
  const assessments = [...groupEvidence(entries, { since }).values()].map(assessTest);
  const considered = assessments.filter(assessment => assessment.verdict !== null)
    .sort((a, b) => a.file.localeCompare(b.file) || a.title.localeCompare(b.title));
  const crossLegOnly = assessments.filter(assessment => assessment.verdict === null && assessment.mainRuns.length > 0);
  const misses = [];
  const orphans = new Set();
  const distinctRuns = new Set();
  let caught = 0;
  let offMainRuns = 0;

  const tests = considered.map((assessment) => {
    let projects = null;
    let note = null;

    if (declared) {
      if (declared.tests.has(`${assessment.file}|${assessment.title}`)) {
        projects = declared.tests.get(`${assessment.file}|${assessment.title}`);
      } else if (declared.files.has(assessment.file)) {
        projects = declared.files.get(assessment.file);
        note = declared.tests.size > 0 ? 'title-drift' : null;
      } else {
        note = 'orphan';
        orphans.add(assessment.file);
      }
    }

    const runs = assessment.offMainRuns.map((run) => {
      offMainRuns += 1;
      distinctRuns.add(run.runId);

      const missing = projects ? [...run.legs].filter(leg => !projects.has(leg)) : [];
      const covered = projects !== null && missing.length === 0;

      if (covered) {
        caught += 1;
      } else if (projects !== null) {
        misses.push({
          file: assessment.file, title: assessment.title, runId: run.runId, runUrl: run.runUrl, legs: [...run.legs], missing,
        });
      }

      return {
        runId: run.runId, runUrl: run.runUrl, branch: run.branch, seenAt: run.seenAt, legs: [...run.legs].sort(),
        statuses: [...run.statuses].sort(), covered: projects === null ? null : covered, missing,
      };
    });

    return {
      file: assessment.file,
      title: assessment.title,
      verdict: assessment.verdict,
      required: assessment.required,
      mainRuns: assessment.mainRuns.length,
      declaredProjects: projects ? [...projects].sort() : null,
      note,
      runs,
    };
  });

  const filesNeedingTags = new Map();

  tests.forEach((test) => {
    const current = filesNeedingTags.get(test.file) ?? { themes: false, bundles: false };

    filesNeedingTags.set(test.file, {
      themes: current.themes || test.required.themes,
      bundles: current.bundles || test.required.bundles,
    });
  });

  return {
    tests,
    misses,
    orphans: [...orphans].sort(),
    filesNeedingTags,
    summary: {
      testsConsidered: tests.length,
      filesConsidered: filesNeedingTags.size,
      offMainRuns,
      offMainDistinctRuns: distinctRuns.size,
      caught: declared ? caught : null,
      missed: declared ? misses.length : null,
      orphanRuns: declared ? tests.filter(test => test.note === 'orphan').reduce((sum, test) => sum + test.runs.length, 0) : null,
      crossLegTests: crossLegOnly.length,
      strong: tests.filter(test => test.verdict === 'strong').length,
      flakySuspects: tests.filter(test => test.verdict === 'flaky-suspect').length,
      weak: tests.filter(test => test.verdict === 'weak').length,
    },
  };
}

/**
 * The tags a required declaration spells.
 *
 * @param {{themes: boolean, bundles: boolean}} required The declaration.
 * @returns {string} `THEMES_TAG`, `BUNDLES_TAG`, both, or `none`.
 */
export function tagsLabel({ themes, bundles }) {
  const tags = [themes ? 'THEMES_TAG' : null, bundles ? 'BUNDLES_TAG' : null].filter(Boolean);

  return tags.length > 0 ? tags.join(' + ') : 'none';
}

/**
 * A test title or file as one Markdown table cell: backslashes escaped first (so an escaped pipe
 * cannot be read back as a bare one), then pipes, and line breaks flattened.
 *
 * @param {string} text The text.
 * @returns {string} The cell.
 */
export function markdownCell(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');
}

/**
 * A Markdown report: the summary, then one row per test with off-main evidence.
 *
 * @param {ReturnType<typeof replay>} result The replay.
 * @param {object} [options] Options.
 * @param {string} [options.heading] A heading line.
 * @returns {string} The Markdown.
 */
export function renderReplay(result, { heading = 'Ledger replay' } = {}) {
  const { summary } = result;
  const lines = [`### ${heading}`, ''];
  const scope = `${summary.offMainRuns} off-main red test-run(s) (${summary.offMainDistinctRuns} distinct run(s)) over `
    + `${summary.testsConsidered} test(s) in ${summary.filesConsidered} file(s)`;
  const coverage = summary.caught === null
    ? `${scope}; no declared tree given, so the needs are listed without coverage.`
    : `${scope}: ${summary.caught} caught, ${summary.missed} missed, ${summary.orphanRuns} on orphan file(s) not in the tree.`;

  lines.push(coverage, '', `Verdicts: ${summary.strong} strong, ${summary.flakySuspects} flaky suspect(s) (red on e2e-main `
    + `in another run; first in line for untagging), ${summary.weak} weak (one flaky run on one leg). `
    + `${summary.crossLegTests} test(s) were red on e2e-main together with another leg and are not leg evidence.`, '');

  if (result.orphans.length > 0) {
    lines.push(`Orphans (declare when they merge): ${result.orphans.join(', ')}`, '');
  }

  lines.push('| File | Test | Verdict | Off-main runs | Legs | Needs | Result |', '|---|---|---|---|---|---|---|');
  result.tests.forEach((test) => {
    const legs = [...new Set(test.runs.flatMap(run => run.legs))].sort().join(', ');
    const outcome = test.note === 'orphan'
      ? 'orphan'
      : test.declaredProjects === null
        ? '–'
        : `${test.runs.filter(run => run.covered).length}/${test.runs.length} caught${test.note ? ` (${test.note})` : ''}`;

    lines.push(`| \`${markdownCell(test.file)}\` | ${markdownCell(test.title)} | ${test.verdict} | ${test.runs.length} | ${legs} `
      + `| ${tagsLabel(test.required)} | ${outcome} |`);
  });

  if (result.misses.length > 0) {
    lines.push('', 'Misses:');
    result.misses.forEach((miss) => {
      lines.push(`- \`${markdownCell(miss.file)}\` › ${markdownCell(miss.title)}: red on ${miss.legs.join(', ')} in run ${miss.runId}, `
        + `and the declared tree does not run it on ${miss.missing.join(', ')} (${miss.runUrl})`);
    });
  }

  return `${lines.join('\n')}\n`;
}
