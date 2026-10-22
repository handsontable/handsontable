/**
 * The screen reader report: the job summary and the `Screen reader / <project> report` check run,
 * built from the transcripts one job left (`screenreader/screenreader.spec.ts` writes one per scenario
 * into `test-results/screenreader/transcripts/`).
 *
 * The job itself is green whatever the announcements were (`continue-on-error`, and the test never
 * fails on a token group in report mode), so this check run is the visible verdict: `neutral` when a
 * token group is missing, a golden differs or none is recorded yet, `success` when every step carries
 * its tokens and matches its golden, `failure` for a tooling failure (no transcript for a scenario,
 * none at all) or, in gate mode, a missing token group. Its annotations sit on the step's line in the
 * scenario file. Pure: `scripts/screenreader-report.mjs` reads the files and posts.
 */
import { escapeMarkdownText, isSafeLink } from './a11y-baseline.mjs';
import { SCREENREADER_MODE, describeAction, transcriptCounts } from './screenreader-transcript.mjs';

export const CHECK_RUN_PREFIX = 'Screen reader / ';
export const SCENARIOS_DIR = 'tests/screenreader/scenarios';
// The Checks API refuses an output summary over 65,535 characters.
const SUMMARY_LIMIT = 65000;

/**
 * The check run's name for a project.
 *
 * @param {string} project The Playwright project (`nvda-chromium`).
 * @returns {string} The name.
 */
export function checkRunName(project) {
  return `${CHECK_RUN_PREFIX}${project} report`;
}

/**
 * The line of each step's `"id"` in a scenario file, by step id.
 *
 * @param {string} source The file's text.
 * @returns {Map<string, number>} The 1-based lines.
 */
export function stepLines(source) {
  const lines = new Map();

  source.split('\n').forEach((line, index) => {
    const match = /^\s*"id":\s*"([a-z0-9-]+)"/.exec(line);

    if (match && !lines.has(match[1])) {
      lines.set(match[1], index + 1);
    }
  });

  return lines;
}

/**
 * The report of one job.
 *
 * @param {object} input What the job left.
 * @param {object[]} input.transcripts The transcripts found.
 * @param {string[]} [input.expectedScenarios] The scenario ids the run should have produced.
 * @param {string} [input.project] The project the job ran; defaults to the transcripts' project.
 * @param {string} [input.mode] The mode; defaults to `SCREENREADER_MODE`.
 * @param {string[]} [input.problems] Tooling problems found while reading.
 * @param {string} [input.reportUrl] The Playwright report's URL.
 * @param {string} [input.runUrl] The workflow run's URL.
 * @param {Map<string, Map<string, number>>} [input.lines] Step lines per scenario id, for the annotations.
 * @returns {{name: string, conclusion: string, title: string, headline: string, summary: string, annotations: object[], counts: object}} The report.
 */
export function buildReport({
  transcripts, expectedScenarios = [], project, mode = SCREENREADER_MODE, problems = [], reportUrl, runUrl, lines = new Map(),
}) {
  const sorted = [...transcripts].sort((a, b) => a.scenario.localeCompare(b.scenario));
  const name = checkRunName(project ?? sorted[0]?.project ?? 'unknown');
  const found = new Set(sorted.map(item => item.scenario));
  const missing = expectedScenarios.filter(id => !found.has(id));
  const tooling = [
    ...problems,
    ...missing.map(id => `no transcript for "${id}": the test did not reach the end of the scenario`),
    ...(sorted.length === 0 && missing.length === 0 ? ['the run left no transcript'] : []),
  ];
  const counts = countAll(sorted);
  let conclusion = 'success';

  if (tooling.length > 0 || (mode === 'gate' && counts.tokenFailures > 0)) {
    conclusion = 'failure';
  } else if (counts.tokenFailures > 0 || counts.goldenDifferences > 0 || counts.goldenMissing > 0) {
    conclusion = 'neutral';
  }

  const headline = tooling.length > 0 ? `Tooling failure: ${tooling[0]}` : headlineOf(counts, mode);
  const icon = { success: '✔', neutral: '⚠', failure: '✖' }[conclusion];
  const lead = [
    mode === 'gate'
      ? '**Gate mode:** a missing token group fails this check and the test; a golden difference stays advisory.'
      : '**Report mode:** this check is neutral when a token group is missing or a golden differs, and never blocks anything; the job is green either way.',
    runUrl && isSafeLink(runUrl) ? `[The workflow run](${runUrl})` : '',
    reportUrl && isSafeLink(reportUrl) ? `📊 [Open the Playwright report](${reportUrl})` : '',
    ...tooling.map(problem => `> Tooling problem: ${escapeMarkdownText(problem)}`),
  ].filter(Boolean).join('\n\n');
  let summary = `${lead}\n\n${renderScenarios(sorted)}${renderGoldenDifferences(sorted)}${renderTiming(sorted)}`;

  if (summary.length > SUMMARY_LIMIT) {
    summary = `${summary.slice(0, SUMMARY_LIMIT)}\n\n… cut at ${SUMMARY_LIMIT} characters; the transcripts hold the rest.`;
  }

  return {
    name,
    conclusion,
    title: `${icon} ${headline}`.slice(0, 250),
    headline,
    summary,
    annotations: annotations(sorted, lines, mode),
    counts: { ...counts, missing: missing.length, tooling: tooling.length },
  };
}

/**
 * The counts over every transcript.
 *
 * @param {object[]} transcripts The transcripts.
 * @returns {{scenarios: number, steps: number, tokenFailures: number, goldenDifferences: number, goldenMissing: number, durationMs: number}} The counts.
 */
function countAll(transcripts) {
  return transcripts.reduce((total, transcript) => {
    const counts = transcriptCounts(transcript);

    return {
      scenarios: total.scenarios + 1,
      steps: total.steps + counts.steps,
      tokenFailures: total.tokenFailures + counts.tokenFailures,
      goldenDifferences: total.goldenDifferences + counts.goldenDifferences,
      goldenMissing: total.goldenMissing + (counts.goldenStatus === 'missing' ? 1 : 0),
      durationMs: total.durationMs + counts.durationMs,
    };
  }, { scenarios: 0, steps: 0, tokenFailures: 0, goldenDifferences: 0, goldenMissing: 0, durationMs: 0 });
}

/**
 * The one-line verdict.
 *
 * @param {object} counts The counts.
 * @param {string} mode The mode.
 * @returns {string} The headline.
 */
function headlineOf(counts, mode) {
  const parts = [];

  if (counts.tokenFailures > 0) {
    parts.push(`${counts.tokenFailures} step${counts.tokenFailures === 1 ? '' : 's'} missing a token group`);
  }
  if (counts.goldenDifferences > 0) {
    parts.push(`${counts.goldenDifferences} golden difference${counts.goldenDifferences === 1 ? '' : 's'}`);
  }
  if (counts.goldenMissing > 0) {
    parts.push(`${counts.goldenMissing} scenario${counts.goldenMissing === 1 ? '' : 's'} without a golden`);
  }
  if (parts.length === 0) {
    return `${counts.scenarios} scenario${counts.scenarios === 1 ? '' : 's'}, ${counts.steps} steps: every token group present, every golden matched`;
  }

  return `${parts.join(', ')} (${mode} mode)`;
}

/**
 * One section per scenario: its environment, then a table with a row per step.
 *
 * @param {object[]} transcripts The transcripts.
 * @returns {string} Markdown.
 */
function renderScenarios(transcripts) {
  return transcripts.map((transcript) => {
    const counts = transcriptCounts(transcript);
    const golden = {
      missing: 'no golden recorded yet',
      match: 'golden matched',
      differs: `${counts.goldenDifferences} golden difference${counts.goldenDifferences === 1 ? '' : 's'}`,
      recorded: 'golden recorded by this run',
    }[transcript.golden.status] ?? transcript.golden.status;
    const head = `### ${escapeMarkdownText(transcript.scenario)} on ${escapeMarkdownText(transcript.project)}\n\n`
      + `${escapeMarkdownText(transcript.environment.screenReader)}, ${escapeMarkdownText(transcript.environment.browser)}, `
      + `${escapeMarkdownText(transcript.environment.platform)}. ${counts.steps} steps in ${seconds(counts.durationMs)}, `
      + `${counts.tokenFailures === 0 ? 'every token group present' : `${counts.tokenFailures} step${counts.tokenFailures === 1 ? '' : 's'} missing a token group`}, ${golden}.`
      + (transcript.attempt > 0 ? ` Attempt ${transcript.attempt + 1}.` : '');
    const rows = transcript.steps.map((step) => {
      const tokens = step.tokens.groups.length === 0
        ? '–'
        : step.tokens.groups.map(group => (group.matched === null
          ? `✖ missing: ${escapeMarkdownText(group.synonyms.join(' | '))}`
          : `✔ ${escapeMarkdownText(group.matched)}`)).join('<br>');
      const goldenCell = transcript.golden.status === 'missing' || transcript.golden.status === 'recorded'
        ? '–'
        : (transcript.golden.differences.some(item => item.id === step.id) ? '✖ differs' : '✔ same');

      return `| ${escapeMarkdownText(step.id)} | ${escapeMarkdownText(describeAction(step.action))} | ${escapeMarkdownText(step.spoken) || '*(nothing)*'} | ${tokens} | ${goldenCell} | ${step.durationMs} |`;
    });

    return `${head}\n\n| Step | Action | Announcement | Token groups | Golden | ms |\n|---|---|---|---|---|---:|\n${rows.join('\n')}\n\n`;
  }).join('');
}

/**
 * Every golden difference, with the recorded and the spoken text.
 *
 * @param {object[]} transcripts The transcripts.
 * @returns {string} Markdown, empty when nothing differs.
 */
function renderGoldenDifferences(transcripts) {
  const items = transcripts.flatMap(transcript => transcript.golden.differences.map(item => ({ ...item, scenario: transcript.scenario, project: transcript.project })));

  if (items.length === 0) {
    return '';
  }

  const rows = items.map(item => `| ${escapeMarkdownText(item.scenario)} | ${escapeMarkdownText(item.id)} | ${item.expected === null ? '*(no recorded step)*' : escapeMarkdownText(item.expected)} | ${item.actual === null ? '*(the scenario no longer has this step)*' : escapeMarkdownText(item.actual)} |`);

  return `### Golden differences (advisory)\n\nRe-record with the update mode when the new wording is right (\`tests/AGENTS.md\`, "Screen readers: the NVDA lane").\n\n| Scenario | Step | Recorded | Spoken |\n|---|---|---|---|\n${rows.join('\n')}\n\n`;
}

/**
 * The time per scenario and in total.
 *
 * @param {object[]} transcripts The transcripts.
 * @returns {string} Markdown.
 */
function renderTiming(transcripts) {
  if (transcripts.length === 0) {
    return '';
  }

  const rows = transcripts.map((transcript) => {
    const counts = transcriptCounts(transcript);

    return `| ${escapeMarkdownText(transcript.scenario)} | ${counts.steps} | ${seconds(counts.durationMs)} | ${counts.steps > 0 ? seconds(counts.durationMs / counts.steps) : '–'} |`;
  });
  const total = countAll(transcripts);

  return `### Timing\n\n| Scenario | Steps | Duration | Per step |\n|---|---:|---:|---:|\n${rows.join('\n')}\n| **total** | ${total.steps} | ${seconds(total.durationMs)} | ${total.steps > 0 ? seconds(total.durationMs / total.steps) : '–'} |\n\n`;
}

/**
 * One annotation per step missing a token group, on the step's line in its scenario file.
 *
 * @param {object[]} transcripts The transcripts.
 * @param {Map<string, Map<string, number>>} lines The step lines per scenario.
 * @param {string} mode The mode.
 * @returns {object[]} The annotations.
 */
function annotations(transcripts, lines, mode) {
  const level = mode === 'gate' ? 'failure' : 'warning';

  return transcripts.flatMap(transcript => transcript.steps
    .filter(step => !step.tokens.passed)
    .map((step) => {
      const line = lines.get(transcript.scenario)?.get(step.id) ?? 1;
      const missing = step.tokens.groups.filter(group => group.matched === null).map(group => `[${group.synonyms.join(' | ')}]`).join(', ');

      return {
        path: `${SCENARIOS_DIR}/${transcript.scenario}.scenario.json`,
        start_line: line,
        end_line: line,
        annotation_level: level,
        title: `Announcement missing a token group: ${transcript.scenario} / ${step.id}`,
        message: `${transcript.project} spoke ${JSON.stringify(step.spoken)} for ${describeAction(step.action)}; missing ${missing}.`,
      };
    }));
}

/**
 * Milliseconds as seconds with one decimal.
 *
 * @param {number} ms The milliseconds.
 * @returns {string} The text.
 */
function seconds(ms) {
  return `${(ms / 1000).toFixed(1)} s`;
}
