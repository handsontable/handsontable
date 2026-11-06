/**
 * The screen reader report: the job summary and the `Screen reader / <project> report` check run,
 * built from the transcripts one job left (`screenreader/screenreader.spec.ts` writes one per scenario
 * into `test-results/screenreader/transcripts/`).
 *
 * The job itself is green whatever the announcements were (`continue-on-error`, and the test never
 * fails on a token group in report mode), so this check run is the visible verdict, by the severity rule
 * every accessibility check run follows (`lib/a11y-verdict.mjs`). A step missing a token group is a finding
 * at the severity of the worst group it missed: serious unless the step declares another (`severity` in the
 * scenario, keyed by the group's first synonym). A reading traversal that read an item twice, never or out
 * of order is a serious finding. Red on a critical or serious finding, neutral with a warning on a moderate
 * or minor one, green on none; on a change run a finding whose cluster in `tests/a11y/issues.json` has a
 * tracker is a warning at most. A golden that differs or is not recorded yet is advisory and never raises
 * the verdict. A tooling failure (no transcript for a scenario, none at all, a scenario that stopped at a
 * step) is red and titled as one; in gate mode any missing token group is red. A step the lane does not
 * drive (`unsupported`) is a declared gap: listed per scenario and per primitive, never a finding. Its
 * annotations sit on the step's line in the scenario file (the base's file for a variant). Pure:
 * `scripts/screenreader-report.mjs` reads the files and posts.
 */
import { escapeMarkdownText, isSafeLink } from './a11y-baseline.mjs';
import { READER_TOKEN_MISSING, READER_TRAVERSAL_OFF, READER_TRAVERSAL_WHERE } from './a11y-issues.mjs';
import { annotationLevel, capAnnotations, renderVerdict, verdictOf, verdictTitle } from './a11y-verdict.mjs';
import { DEFAULT_TOKEN_SEVERITY, SCREENREADER_MODE, TOKEN_SEVERITIES, describeAction, transcriptCounts } from './screenreader-transcript.mjs';

export const CHECK_RUN_PREFIX = 'Screen reader / ';
export const SCENARIOS_DIR = 'tests/screenreader/scenarios';
// The Checks API refuses an output summary over 65,535 characters.
const SUMMARY_LIMIT = 65000;

/**
 * The check run's name for a project and the scenario group its job ran.
 *
 * @param {string} project The Playwright project (`nvda-chromium`).
 * @param {string} [group] The scenario group (`keyboard`), when the job ran one.
 * @returns {string} The name (`Screen reader / nvda-chromium keyboard report`).
 */
export function checkRunName(project, group) {
  return `${CHECK_RUN_PREFIX}${project}${group ? ` ${group}` : ''} report`;
}

/**
 * The line of each step's `"id"` in a scenario file, by step id. Only a line indented by four spaces or
 * more counts: the scenario's own `"id"` sits two spaces in, so a step named like the scenario is never
 * annotated on the scenario's line.
 *
 * @param {string} source The file's text.
 * @returns {Map<string, number>} The 1-based lines.
 */
export function stepLines(source) {
  const lines = new Map();

  source.split('\n').forEach((line, index) => {
    const match = /^ {4,}"id":\s*"([a-z0-9-]+)"/.exec(line);

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
 * @param {string} [input.group] The scenario group the job ran, for the check run's name.
 * @param {string} [input.mode] The mode; defaults to `SCREENREADER_MODE`.
 * @param {string[]} [input.problems] Tooling problems found while reading.
 * @param {string} [input.reportUrl] The Playwright report's URL.
 * @param {string} [input.runUrl] The workflow run's URL.
 * @param {Map<string, Map<string, number>>} [input.lines] Step lines per scenario id, for the annotations.
 * @param {Map<string, string>} [input.files] The file a scenario's steps are in, by scenario id, when it is
 * not the scenario's own (a variant's steps are its base's).
 * @param {'audit'|'change'} [input.scope] What the run counts (`countingScope()` of `lib/a11y-verdict.mjs`).
 * @param {(source: string, check: string, item: object) => boolean} [input.tracked] Whether a finding's cluster has
 * a tracker (`trackedBy()` of `lib/a11y-issues.mjs`), asked with `{scenario, step, kind}`; read on a change run only.
 * @returns {{name: string, conclusion: string, title: string, headline: string, summary: string, annotations: object[], counts: object}} The report.
 */
export function buildReport({
  transcripts, expectedScenarios = [], project, group, mode = SCREENREADER_MODE, problems = [], reportUrl, runUrl, lines = new Map(), files = new Map(),
  scope = 'change', tracked = () => false,
}) {
  const sorted = [...transcripts].sort((a, b) => a.scenario.localeCompare(b.scenario));
  const name = checkRunName(project ?? sorted[0]?.project ?? 'unknown', group);
  const found = new Set(sorted.map(item => item.scenario));
  const missing = expectedScenarios.filter(id => !found.has(id));
  const tooling = [
    ...problems,
    ...sorted.filter(transcript => transcript.incomplete)
      .map(transcript => `scenario ${transcript.scenario} stopped at step ${transcript.incomplete.step}: ${String(transcript.incomplete.error).replace(/\s+/g, ' ').trim()}`),
    ...missing.map(id => `no transcript for "${id}": the test did not reach the end of the scenario`),
    ...(sorted.length === 0 && missing.length === 0 ? ['the run left no transcript'] : []),
  ];
  const counts = countAll(sorted);
  const failed = failedSteps(sorted, scope, tracked);
  const traversals = failedTraversals(sorted, scope, tracked);
  const verdict = verdictOf({
    findings: [
      ...[...failed, ...traversals].map(({ severity, warningOnly }) => ({ severity, warningOnly })),
      // A golden that differs or is not recorded is a wording to review, never a missing fact.
      ...Array.from({ length: counts.goldenDifferences + counts.goldenMissing }, () => ({ severity: 'advisory' })),
    ],
    tooling,
  });
  const gating = mode === 'gate' && tooling.length === 0 && counts.tokenFailures > 0;
  const conclusion = gating ? 'failure' : verdict.conclusion;
  const headline = tooling.length > 0 ? `Tooling failure: ${tooling[0]}` : headlineOf(counts, mode);
  const { annotations, omitted } = capAnnotations(annotationsOf(failed, lines, files, mode));
  const lead = [
    gating
      ? '**Verdict: red, gate mode.** A missing token group fails this check and the test, whatever its severity.'
      : renderVerdict(verdict, { scope, counting: 'every step missing a token group counts', listTooling: false }),
    mode === 'gate'
      ? '**Gate mode:** a missing token group fails this check and the test; a golden difference stays advisory.'
      : '**Report mode:** the test and the job never fail on an announcement; this check run\'s verdict says what the lane found.',
    runUrl && isSafeLink(runUrl) ? `[The workflow run](${runUrl})` : '',
    omitted > 0 ? `The check run carries the ${annotations.length} worst annotations; ${omitted} more steps are in the tables below.` : '',
    reportUrl && isSafeLink(reportUrl) ? `📊 [Open the Playwright report](${reportUrl})` : '',
    ...tooling.map(problem => `> Tooling problem: ${escapeMarkdownText(problem)}`),
  ].filter(Boolean).join('\n\n');
  let summary = `${lead}\n\n${renderUnsupported(sorted)}${renderScenarios(sorted, lines)}${renderGoldenDifferences(sorted)}${renderTiming(sorted)}`;

  if (summary.length > SUMMARY_LIMIT) {
    summary = `${summary.slice(0, SUMMARY_LIMIT)}\n\n… cut at ${SUMMARY_LIMIT} characters; the transcripts hold the rest.`;
  }

  return {
    name,
    conclusion,
    title: gating ? `✖ Gate: ${headline}`.slice(0, 250) : verdictTitle(verdict, headline),
    headline,
    summary,
    annotations,
    counts: { ...counts, missing: missing.length, tooling: tooling.length },
  };
}

/**
 * Every step missing a token group, at the severity of the worst group it missed: the one its scenario
 * declares for the group, or serious. A transcript written before groups carried a severity reads as serious.
 * On a change run a step whose cluster has a tracker is a warning at most.
 *
 * @param {object[]} transcripts The transcripts.
 * @param {'audit'|'change'} scope The scope.
 * @param {Function} tracked The tracker predicate.
 * @returns {Array<{transcript: object, step: object, severity: string, warningOnly: boolean}>} The failed steps.
 */
function failedSteps(transcripts, scope, tracked) {
  return transcripts.flatMap(transcript => transcript.steps.filter(step => !step.tokens.passed).map((step) => {
    const severity = step.tokens.groups.filter(group => group.matched === null)
      .map(group => (TOKEN_SEVERITIES.includes(group.severity) ? group.severity : DEFAULT_TOKEN_SEVERITY))
      .reduce((worst, next) => (TOKEN_SEVERITIES.indexOf(next) < TOKEN_SEVERITIES.indexOf(worst) ? next : worst), TOKEN_SEVERITIES.at(-1));
    const item = { scenario: transcript.scenario, step: step.id, kind: READER_TOKEN_MISSING };

    return { transcript, step, severity, warningOnly: scope === 'change' && Boolean(tracked('reader', transcript.project, item)) };
  }));
}

/**
 * Every reading traversal that read an item twice, never or out of order: a serious finding, as a step
 * missing a fact is by default. On a change run one whose cluster has a tracker is a warning at most.
 *
 * @param {object[]} transcripts The transcripts.
 * @param {'audit'|'change'} scope The scope.
 * @param {Function} tracked The tracker predicate.
 * @returns {Array<{transcript: object, severity: string, warningOnly: boolean}>} The failed traversals.
 */
function failedTraversals(transcripts, scope, tracked) {
  return transcripts.filter(transcript => transcript.traversal && !transcript.traversal.passed).map((transcript) => {
    const item = { scenario: transcript.scenario, step: READER_TRAVERSAL_WHERE, kind: READER_TRAVERSAL_OFF };

    return { transcript, severity: DEFAULT_TOKEN_SEVERITY, warningOnly: scope === 'change' && Boolean(tracked('reader', transcript.project, item)) };
  });
}

/**
 * The counts over every transcript.
 *
 * @param {object[]} transcripts The transcripts.
 * @returns {{scenarios: number, steps: number, tokenFailures: number, traversalFailures: number, unsupported: number, goldenDifferences: number, goldenMissing: number, goldenRecorded: number, durationMs: number}} The counts.
 */
function countAll(transcripts) {
  return transcripts.reduce((total, transcript) => {
    const counts = transcriptCounts(transcript);

    return {
      scenarios: total.scenarios + 1,
      steps: total.steps + counts.steps,
      tokenFailures: total.tokenFailures + counts.tokenFailures,
      traversalFailures: total.traversalFailures + (counts.traversalFailed ? 1 : 0),
      unsupported: total.unsupported + counts.unsupported,
      goldenDifferences: total.goldenDifferences + counts.goldenDifferences,
      goldenMissing: total.goldenMissing + (counts.goldenStatus === 'missing' ? 1 : 0),
      goldenRecorded: total.goldenRecorded + (counts.goldenStatus === 'recorded' ? 1 : 0),
      durationMs: total.durationMs + counts.durationMs,
    };
  }, { scenarios: 0, steps: 0, tokenFailures: 0, traversalFailures: 0, unsupported: 0, goldenDifferences: 0, goldenMissing: 0, goldenRecorded: 0, durationMs: 0 });
}

/**
 * A count with its noun, singular for one.
 *
 * @param {number} count The count.
 * @param {string} noun The singular noun.
 * @returns {string} The text (`1 step`, `2 steps`).
 */
function counted(count, noun) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
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
  if (counts.traversalFailures > 0) {
    parts.push(`${counted(counts.traversalFailures, 'reading traversal')} off`);
  }
  if (counts.goldenDifferences > 0) {
    parts.push(`${counts.goldenDifferences} golden difference${counts.goldenDifferences === 1 ? '' : 's'}`);
  }
  if (counts.goldenMissing > 0) {
    parts.push(`${counts.goldenMissing} scenario${counts.goldenMissing === 1 ? '' : 's'} without a golden`);
  }
  if (parts.length === 0) {
    const goldens = counts.scenarios > 0 && counts.goldenRecorded === counts.scenarios ? 'goldens recorded' : 'every golden matched';

    const gaps = counts.unsupported > 0 ? `, ${counted(counts.unsupported, 'step')} not driven on this lane` : '';

    return `${counted(counts.scenarios, 'scenario')}, ${counted(counts.steps, 'step')}: every token group present, ${goldens}${gaps}`;
  }

  return `${parts.join(', ')} (${mode} mode)`;
}

/**
 * One section per scenario: its environment, then a table with a row per step, the captured and the
 * unsupported ones in the scenario's order.
 *
 * @param {object[]} transcripts The transcripts.
 * @param {Map<string, Map<string, number>>} [lines] The step lines per scenario, which give that order.
 * @returns {string} Markdown.
 */
function renderScenarios(transcripts, lines) {
  return transcripts.map((transcript) => {
    const counts = transcriptCounts(transcript);
    const golden = {
      missing: 'no golden recorded yet',
      match: 'golden matched',
      differs: `${counts.goldenDifferences} golden difference${counts.goldenDifferences === 1 ? '' : 's'}`,
      recorded: 'golden recorded by this run',
      incomplete: 'no golden comparison',
    }[transcript.golden.status] ?? transcript.golden.status;
    const head = `### ${escapeMarkdownText(transcript.scenario)} on ${escapeMarkdownText(transcript.project)}\n\n`
      + `${escapeMarkdownText(transcript.environment.screenReader)}, ${escapeMarkdownText(transcript.environment.browser)}, `
      + `${escapeMarkdownText(transcript.environment.platform)}. ${counted(counts.steps, 'step')} in ${seconds(counts.durationMs)}, `
      + `${counts.tokenFailures === 0 ? 'every token group present' : `${counted(counts.tokenFailures, 'step')} missing a token group`}, ${golden}.`
      + (transcript.attempt > 0 ? ` Attempt ${transcript.attempt + 1}.` : '')
      + (transcript.incomplete
        ? `\n\n> Stopped at step ${escapeMarkdownText(transcript.incomplete.step)}: ${escapeMarkdownText(transcript.incomplete.error)}. The steps below are the ones captured before it.`
        : '');
    const rows = transcript.steps.map((step) => {
      const tokens = step.tokens.groups.length === 0
        ? '–'
        : step.tokens.groups.map(group => (group.matched === null
          ? `✖ missing: ${escapeMarkdownText(group.synonyms.join(' | '))}`
          : `✔ ${escapeMarkdownText(group.matched)}`)).join('<br>');
      const goldenCell = ['missing', 'recorded', 'incomplete'].includes(transcript.golden.status)
        ? '–'
        : (transcript.golden.differences.some(item => item.id === step.id) ? '✖ differs' : '✔ same');

      return `| ${escapeMarkdownText(step.id)} | ${escapeMarkdownText(describeAction(step.action))} | ${escapeMarkdownText(step.spoken) || '*(nothing)*'} | ${tokens} | ${goldenCell} | ${step.durationMs} |`;
    });
    const skipped = (transcript.unsupported ?? []).map(step => `| ${escapeMarkdownText(step.id)} | ${escapeMarkdownText(describeAction(step.action))} | *(not driven on this lane: ${escapeMarkdownText(step.reason)})* | – | – | – |`);
    // In the scenario's order, so the table lines up with the scenario file and the golden: a step's line in
    // its file orders it, and a step without one keeps its place after the others (a stable sort).
    const stepLine = lines?.get(transcript.scenario);
    const at = id => stepLine?.get(id) ?? Number.MAX_SAFE_INTEGER;
    const ordered = [...transcript.steps.map((step, index) => ({ id: step.id, row: rows[index] })),
      ...(transcript.unsupported ?? []).map((step, index) => ({ id: step.id, row: skipped[index] }))]
      .sort((a, b) => at(a.id) - at(b.id));

    return `${head}${renderTraversal(transcript)}\n\n| Step | Action | Announcement | Token groups | Golden | ms |\n|---|---|---|---|---|---:|\n${ordered.map(entry => entry.row).join('\n')}\n\n`;
  }).join('');
}

/**
 * The traversal verdict of a reading scenario, as a sentence after its header: every item read once in
 * order, or the items read twice, never, or out of order.
 *
 * @param {object} transcript The transcript.
 * @returns {string} Markdown, empty without a traversal.
 */
function renderTraversal(transcript) {
  const traversal = transcript.traversal;

  if (!traversal) {
    return '';
  }

  const span = `${escapeMarkdownText(traversal.steps[0] ?? '')} to ${escapeMarkdownText(traversal.steps.at(-1) ?? '')}`;

  if (traversal.passed) {
    return `\n\nReading traversal (${span}): ✔ each of the ${traversal.items.length} items read once, in order.`;
  }

  const twice = traversal.items.filter(entry => entry.count > 1).map(entry => `${escapeMarkdownText(entry.item)} ×${entry.count}`);
  const never = traversal.items.filter(entry => entry.count === 0).map(entry => escapeMarkdownText(entry.item));
  const parts = [
    twice.length ? `read more than once: ${twice.join(', ')}` : '',
    never.length ? `never read: ${never.join(', ')}` : '',
    traversal.outOfOrder.length ? `out of order: ${traversal.outOfOrder.map(item => escapeMarkdownText(item)).join(', ')}` : '',
  ].filter(Boolean);

  return `\n\nReading traversal (${span}): ✖ ${parts.join('; ')}.`;
}

/**
 * The steps this lane did not drive, by primitive: the gaps the lane declares (`unsupported`), which the
 * coverage ratchet and the accessibility data file list too.
 *
 * @param {object[]} transcripts The transcripts.
 * @returns {string} Markdown, empty when the lane drove every step.
 */
function renderUnsupported(transcripts) {
  const byPrimitive = new Map();

  transcripts.forEach(transcript => (transcript.unsupported ?? []).forEach((step) => {
    const primitive = describeAction(step.action);
    const entry = byPrimitive.get(primitive) ?? { steps: [], reasons: new Set() };

    entry.steps.push(`${transcript.scenario} / ${step.id}`);
    entry.reasons.add(step.reason);
    byPrimitive.set(primitive, entry);
  }));

  if (byPrimitive.size === 0) {
    return '';
  }

  const rows = [...byPrimitive].sort(([a], [b]) => a.localeCompare(b)).map(([primitive, entry]) => `| ${escapeMarkdownText(primitive)} | ${entry.steps.length} | ${escapeMarkdownText([...entry.reasons].join(' / '))} |`);

  return `### Not driven on this lane\n\nSteps whose primitive this screen reader cannot drive, as the scenarios declare (\`unsupported\`): a gap, not a pass.\n\n| Primitive | Steps | Why |\n|---|---:|---|\n${rows.join('\n')}\n\n`;
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

  return `### Golden differences (advisory)\n\nRe-record with the update mode when the new wording is right (\`tests/AGENTS.md\`, "Screen readers: the NVDA and VoiceOver lanes").\n\n| Scenario | Step | Recorded | Spoken |\n|---|---|---|---|\n${rows.join('\n')}\n\n`;
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
 * One annotation per step missing a token group, on the step's line in its scenario file (the base's file
 * for a variant, whose steps live there), at the level its severity gives it (every one a failure in gate
 * mode).
 *
 * @param {object[]} failed The failed steps (`failedSteps()`).
 * @param {Map<string, Map<string, number>>} lines The step lines per scenario.
 * @param {Map<string, string>} files The file a scenario's steps are in, when not its own.
 * @param {string} mode The mode.
 * @returns {object[]} The annotations.
 */
function annotationsOf(failed, lines, files, mode) {
  return failed.map(({ transcript, step, severity, warningOnly }) => {
    const line = lines.get(transcript.scenario)?.get(step.id) ?? 1;
    const missing = step.tokens.groups.filter(group => group.matched === null).map(group => `[${group.synonyms.join(' | ')}]`).join(', ');

    return {
      path: `${SCENARIOS_DIR}/${files.get(transcript.scenario) ?? `${transcript.scenario}.scenario.json`}`,
      start_line: line,
      end_line: line,
      annotation_level: mode === 'gate' ? 'failure' : annotationLevel({ severity, warningOnly }),
      title: `Announcement missing a token group (${severity}): ${transcript.scenario} / ${step.id}`,
      message: `${transcript.project} spoke ${JSON.stringify(step.spoken)} for ${describeAction(step.action)}; missing ${missing}.`,
    };
  });
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
