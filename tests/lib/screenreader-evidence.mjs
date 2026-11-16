/**
 * The screen reader evidence: what one lane job's transcripts say, per step and per criterion, in the
 * shared evidence shape of the accessibility checks (`lib/a11y-evidence.mjs`), so the conformance report
 * generator and the ledger read the screen reader lanes the way they read every other check.
 *
 * - **A record per step** (`stepRecords()`): the scenario, the step, the lane and project, the criteria
 *   the scenario evidences, and the step's verdict: `pass` (every token group present), `missing-fact` (a
 *   group missing), `recorded` (a step that asserts nothing, captured for its golden), `unsupported` (the
 *   lane does not drive the step's primitive, a gap with its reason) and `not-run` (the run stopped before
 *   the step).
 * - **A document per project** (`buildScreenreaderEvidence()`): one target per scenario (its page, its
 *   theme and the scenario as the variant), the criteria it evaluated, and a finding per step missing a
 *   token group and per traversal item read twice, never, or out of order, merged through
 *   `mergeEvidence()` with this lane's own registry (`SCREENREADER_CHECK`), never a check of
 *   `EVIDENCE_CHECKS`, which the a11y checks config turns into Playwright projects.
 *
 * Findings are `advisory` while the lane is report-only: a missing group is the grid's defect or the
 * reader's own behavior, and the step's note says which (`tests/AGENTS.md`, "Screen readers"). A run
 * that stopped is a problem of its target, which then evaluates no criterion. An unsupported step is
 * neither: it is listed in the records and the target keeps its criteria, because the lane ran every
 * step it can drive. No I/O in here.
 */
import { compareCriteria, mergeEvidence, targetFileName, validateEvidence } from './a11y-evidence.mjs';
import { scenarioPageId, scenarioUrl, unsupportedReason } from './screenreader-scenario.mjs';
import { describeAction } from './screenreader-transcript.mjs';

export const SCREENREADER_CHECK = 'screen-reader';
export const STEP_VERDICTS = ['pass', 'missing-fact', 'recorded', 'unsupported', 'not-run'];
export const FINDING_SEVERITY = 'advisory';

/**
 * The registry entry `mergeEvidence()` and `validateEvidence()` read for the lane: its title and the
 * criteria its scenarios evidence, the union of their headers.
 *
 * @param {{criteria: string[]}[]} scenarios The scenarios.
 * @returns {Record<string, {title: string, criteria: string[]}>} The registry.
 */
export function screenreaderChecks(scenarios) {
  const criteria = [...new Set(scenarios.flatMap(scenario => scenario.criteria ?? []))].sort(compareCriteria);

  return { [SCREENREADER_CHECK]: { title: 'Screen reader scenarios', criteria } };
}

/**
 * The theme a scenario runs on: its query's, otherwise the projects' default.
 *
 * @param {{query?: string}} scenario The scenario.
 * @returns {string} The theme.
 */
export function scenarioTheme(scenario) {
  return new URLSearchParams(scenario.query ?? '').get('theme') ?? 'main';
}

/**
 * The record of every step of a scenario on one project, in the scenario's order: the steps the run
 * captured, the ones its lane does not drive, and the ones a stopped run never reached.
 *
 * @param {object} transcript The transcript.
 * @param {{id: string, criteria: string[], steps: {id: string, action: object}[]}} scenario The scenario.
 * @returns {object[]} The records.
 */
export function stepRecords(transcript, scenario) {
  const captured = new Map(transcript.steps.map(step => [step.id, step]));
  const skipped = new Map((transcript.unsupported ?? []).map(step => [step.id, step]));
  const base = {
    scenario: scenario.id,
    lane: transcript.lane,
    project: transcript.project,
    page: transcript.page,
    theme: scenarioTheme(scenario),
    criteria: [...scenario.criteria].sort(compareCriteria),
  };

  return scenario.steps.map((step) => {
    const record = { ...base, step: step.id, action: describeAction(step.action) };

    if (skipped.has(step.id)) {
      return { ...record, verdict: 'unsupported', reason: skipped.get(step.id).reason };
    }
    if (!captured.has(step.id)) {
      return { ...record, verdict: 'not-run', reason: transcript.incomplete ? `the run stopped at step ${transcript.incomplete.step}` : 'no capture' };
    }

    const { tokens } = captured.get(step.id);

    if (tokens.groups.length === 0) {
      return { ...record, verdict: 'recorded' };
    }

    return { ...record, verdict: tokens.passed ? 'pass' : 'missing-fact' };
  });
}

/**
 * The evidence part of one transcript, in the shape `mergeEvidence()` validates: the scenario as a target
 * (its page, theme and the scenario id as the variant), the scenario's criteria, its findings, a problem
 * when the run stopped, and the step records as the target's detail.
 *
 * @param {object} transcript The transcript.
 * @param {object} scenario The scenario.
 * @returns {object} The part.
 */
export function evidencePart(transcript, scenario) {
  const records = stepRecords(transcript, scenario);
  const findings = [
    ...transcript.steps.filter(step => !step.tokens.passed).map(step => ({
      kind: 'announcement-missing-fact',
      criteria: [...scenario.criteria],
      severity: FINDING_SEVERITY,
      step: step.id,
      measured: { spoken: step.normalized },
      expected: { tokens: step.tokens.groups.filter(group => group.matched === null).map(group => group.synonyms.join(' | ')).join('; ') },
      reason: `${transcript.project} announced ${JSON.stringify(step.normalized)} for ${describeAction(step.action)}, without a fact a token group asks for.`,
    })),
    ...traversalFindings(transcript, scenario),
  ];

  return {
    schema: 1,
    target: {
      page: transcript.page,
      theme: scenarioTheme(scenario),
      state: null,
      variant: scenario.id,
      url: scenarioUrl(scenario),
    },
    durationMs: transcript.durationMs,
    criteria: [...scenario.criteria],
    findings,
    problems: transcript.incomplete ? [`the run stopped at step ${transcript.incomplete.step}: ${transcript.incomplete.error}`] : [],
    environment: { browser: transcript.environment.browser },
    detail: { records, unsupported: transcript.unsupported ?? [], traversal: transcript.traversal ?? null },
  };
}

/**
 * The findings of a traversal: an item read more than once, never, or out of order, one per item.
 *
 * @param {object} transcript The transcript.
 * @param {object} scenario The scenario.
 * @returns {object[]} The findings.
 */
function traversalFindings(transcript, scenario) {
  const traversal = transcript.traversal;

  if (!traversal) {
    return [];
  }

  const finding = (kind, item, reason, measured) => ({
    kind,
    criteria: [...scenario.criteria],
    severity: FINDING_SEVERITY,
    step: `traversal ${item}`,
    measured,
    reason,
  });

  return [
    ...traversal.items.filter(entry => entry.count > 1).map(entry => finding('traversal-duplicate', entry.item,
      `Reading ${traversal.steps[0]} to ${traversal.steps.at(-1)}, ${transcript.project} announced "${entry.item}" ${entry.count} times, where each item is read once.`,
      { count: entry.count, firstStep: entry.firstStep })),
    ...traversal.items.filter(entry => entry.count === 0).map(entry => finding('traversal-missing', entry.item,
      `Reading ${traversal.steps[0]} to ${traversal.steps.at(-1)}, ${transcript.project} never announced "${entry.item}".`,
      { count: 0 })),
    ...traversal.outOfOrder.map(item => finding('traversal-order', item,
      `Reading ${traversal.steps[0]} to ${traversal.steps.at(-1)}, ${transcript.project} announced "${item}" before an item listed ahead of it.`,
      { firstStep: traversal.items.find(entry => entry.item === item)?.firstStep ?? null })),
  ];
}

/**
 * The evidence document of one lane job: every transcript as a part, merged with the lane's registry,
 * plus the job's project and lane, and every step's record. A scenario of the set without a transcript
 * (the test never wrote one) is a target not measured, so `summary.byCriterion` never reads a partial
 * run as a full one.
 *
 * @param {object} input What the job left.
 * @param {string} input.project The project.
 * @param {string} input.lane The lane.
 * @param {string} [input.group] The scenario group the job ran, when it ran one (`SCREENREADER_GROUP`).
 * @param {object[]} input.transcripts The transcripts.
 * @param {object[]} input.scenarios The resolved scenarios of the set.
 * @param {object} [input.run] The run's metadata (`mergeEvidence()`'s).
 * @param {string[]} [input.problems] Tooling problems found while reading.
 * @returns {{doc: object, details: {file: string, detail: object}[], problems: string[]}} The document, the
 * detail files to write beside it (`<check>/<page>--<theme>--<variant>.json`), and what `validateEvidence()`
 * found wrong with it.
 */
export function buildScreenreaderEvidence({ project, lane, group, transcripts, scenarios, run = {}, problems = [] }) {
  const byId = new Map(scenarios.map(scenario => [scenario.id, scenario]));
  const checks = screenreaderChecks(scenarios);
  const measured = transcripts.filter(transcript => byId.has(transcript.scenario));
  const parts = measured.map(transcript => evidencePart(transcript, byId.get(transcript.scenario)));
  const written = new Set(transcripts.map(transcript => transcript.scenario));
  const failures = [
    ...scenarios.filter(scenario => !written.has(scenario.id)).map(scenario => ({
      title: `${project} ${scenario.id}`,
      target: { page: scenarioPageId(scenario), theme: scenarioTheme(scenario), state: null, variant: scenario.id, url: scenarioUrl(scenario) },
      error: 'the run left no transcript for this scenario',
    })),
    // A transcript an attempt after the first wrote passed only on a retry: the document flags its target, as
    // it does a check's test that measured only on a retry, so a ledger reader never takes it for a clean pass.
    ...measured.flatMap((transcript, index) => (Number(transcript.attempt) > 0 ? [{
      title: `${project} ${transcript.scenario}`,
      target: parts[index].target,
      error: `the transcript is from attempt ${Number(transcript.attempt) + 1}: an earlier attempt failed`,
      flaky: true,
    }] : [])),
  ];
  const unknown = transcripts.filter(transcript => !byId.has(transcript.scenario))
    .map(transcript => `transcript ${transcript.scenario} names no scenario of the set`);
  const doc = mergeEvidence({ check: SCREENREADER_CHECK, parts, failures, run, problems: [...problems, ...unknown], checks });

  doc.run.project = project;
  doc.run.lane = lane;
  // A job runs one group, so its document lists that group's scenarios only; the group says so.
  doc.run.group = group ?? null;
  doc.records = scenarios.flatMap((scenario) => {
    const transcript = transcripts.find(item => item.scenario === scenario.id);

    return transcript
      ? stepRecords(transcript, scenario)
      : scenario.steps.map((step) => {
        // A step the lane does not drive is a declared gap whether the run finished or not.
        const skipped = unsupportedReason(step, lane);

        return {
          scenario: scenario.id, lane, project, page: scenarioPageId(scenario), theme: scenarioTheme(scenario),
          criteria: [...scenario.criteria].sort(compareCriteria), step: step.id, action: describeAction(step.action),
          ...(skipped === null ? { verdict: 'not-run', reason: 'no transcript' } : { verdict: 'unsupported', reason: skipped }),
        };
      });
  });

  const details = parts.map(part => ({
    file: `${SCREENREADER_CHECK}/${targetFileName(part.target)}`,
    detail: part.detail,
  }));

  return { doc, details, problems: validateEvidence(doc, { checks }) };
}
