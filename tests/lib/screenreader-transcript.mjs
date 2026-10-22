/**
 * The screen reader transcript: what one scenario run on one project left, and the two assertion tiers
 * read from it.
 *
 * - **Required tokens** (`matchTokenGroups()`): each step of a scenario lists synonym groups; every
 *   group must have one synonym inside the normalized announcement. This tier is what will gate once
 *   `SCREENREADER_MODE` flips, because it asks only for the facts an announcement must carry (the cell
 *   text, a position, a role) and not for the wording.
 * - **Goldens** (`compareWithGolden()`): the exact normalized announcement per step, recorded per
 *   project under `screenreader/goldens/<project>/<scenario>.json` by the update mode. Advisory only:
 *   a wording change in NVDA or in the core shows as a diff in the summary and never as a red job.
 *
 * `normalizeAnnouncement()` is the shared layer under both: lowercase, Unicode-folded, punctuation
 * dropped, whitespace collapsed, and the screen reader's own chatter removed. Phrases differ per screen
 * reader, so the scenario data and these tiers are what the lanes share, never the strings.
 *
 * No I/O in here. The spec (`screenreader/screenreader.spec.ts`) writes the transcripts, the report
 * module reads them.
 */

export const TRANSCRIPT_SCHEMA = 1;
export const GOLDEN_SCHEMA = 1;
export const SCREENREADER_MODES = ['report', 'gate'];
/**
 * The whole switch. `report`: a failed token group or a golden diff is a row in the summary, a line in
 * the transcript and a neutral check run, and the test passes. `gate`: a failed token group fails the
 * test; a golden diff stays advisory. Pinned by `lib/__tests__/screenreader-transcript.test.mjs`.
 */
export const SCREENREADER_MODE = 'report';
/**
 * What a screen reader says about itself rather than about the page. NVDA announces its mode switch
 * and the `clickable` hint on an element with a click handler; neither is a fact about the grid, so
 * neither should decide a token group or a golden.
 */
export const CHATTER = ['focus mode', 'browse mode', 'clickable'];

/**
 * Normalizes an announcement for comparison: NFKC, lowercase, every run of characters that is not a
 * letter, a digit or a space becomes one space, the chatter phrases are dropped, whitespace collapses.
 *
 * @param {unknown} text The announcement as the screen reader spoke it.
 * @returns {string} The normalized text.
 */
export function normalizeAnnouncement(text) {
  let normalized = String(text ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  CHATTER.forEach((phrase) => {
    normalized = normalized.split(` ${phrase} `).join(' ');
    if (normalized.startsWith(`${phrase} `)) {
      normalized = normalized.slice(phrase.length + 1);
    }
    if (normalized.endsWith(` ${phrase}`)) {
      normalized = normalized.slice(0, -(phrase.length + 1));
    }
    if (normalized === phrase) {
      normalized = '';
    }
  });

  return normalized.replace(/\s+/g, ' ').trim();
}

/**
 * The first synonym of each group that the normalized announcement contains. A synonym is normalized
 * the same way and matched as a whole-word phrase, so `row 2` does not match `row 22`.
 *
 * @param {string} normalized The normalized announcement.
 * @param {string[][]} groups The token groups of the step.
 * @returns {{passed: boolean, groups: {synonyms: string[], matched: string|null}[]}} The verdict.
 */
export function matchTokenGroups(normalized, groups) {
  const padded = ` ${normalized} `;
  const result = groups.map((synonyms) => {
    const matched = synonyms.find((synonym) => {
      const token = normalizeAnnouncement(synonym);

      return token !== '' && padded.includes(` ${token} `);
    });

    return { synonyms, matched: matched ?? null };
  });

  return { passed: result.every(group => group.matched !== null), groups: result };
}

/**
 * A golden document built from a transcript: the normalized announcement per step, with what recorded it.
 *
 * @param {object} transcript The transcript.
 * @returns {object} The golden.
 */
export function goldenFromTranscript(transcript) {
  const steps = {};

  transcript.steps.forEach((step) => {
    steps[step.id] = step.normalized;
  });

  return {
    schema: GOLDEN_SCHEMA,
    scenario: transcript.scenario,
    project: transcript.project,
    recorded: { ...transcript.environment, at: transcript.startedAt },
    steps,
  };
}

/**
 * Compares a transcript's steps with a golden, step by step.
 *
 * @param {object|null} golden The golden, or `null` when none is recorded.
 * @param {{id: string, normalized: string}[]} steps The transcript's steps.
 * @returns {{status: 'missing'|'match'|'differs', differences: {id: string, expected: string|null, actual: string|null}[]}} The verdict:
 * every step whose normalized announcement differs from the recorded one, a step the golden does not
 * have (`expected: null`), and a recorded step the scenario no longer has (`actual: null`).
 */
export function compareWithGolden(golden, steps) {
  if (!golden || typeof golden !== 'object' || typeof golden.steps !== 'object' || golden.steps === null) {
    return { status: 'missing', differences: [] };
  }

  const differences = [];
  const recorded = new Set(Object.keys(golden.steps));

  steps.forEach((step) => {
    const expected = Object.hasOwn(golden.steps, step.id) ? golden.steps[step.id] : null;

    recorded.delete(step.id);

    if (expected !== step.normalized) {
      differences.push({ id: step.id, expected, actual: step.normalized });
    }
  });
  recorded.forEach(id => differences.push({ id, expected: golden.steps[id], actual: null }));

  return { status: differences.length === 0 ? 'match' : 'differs', differences };
}

/**
 * The counts a transcript's summary and the report read.
 *
 * @param {object} transcript The transcript.
 * @returns {{steps: number, tokenFailures: number, goldenStatus: string, goldenDifferences: number, durationMs: number}} The counts.
 */
export function transcriptCounts(transcript) {
  return {
    steps: transcript.steps.length,
    tokenFailures: transcript.steps.filter(step => !step.tokens.passed).length,
    goldenStatus: transcript.golden.status,
    goldenDifferences: transcript.golden.differences.length,
    durationMs: transcript.durationMs,
  };
}

/**
 * The human-readable log of a transcript, one line per step.
 *
 * @param {object} transcript The transcript.
 * @returns {string} The log.
 */
export function renderTranscriptLog(transcript) {
  const header = [
    `# ${transcript.scenario} on ${transcript.project} (${transcript.environment.screenReader}, ${transcript.environment.browser})`,
    `# ${transcript.startedAt}, ${transcript.durationMs} ms, mode ${transcript.mode}, attempt ${transcript.attempt}`,
    `# golden: ${transcript.golden.status}${transcript.golden.differences.length ? ` (${transcript.golden.differences.length} differences)` : ''}`,
    '',
  ];
  const lines = transcript.steps.map((step) => {
    const tokens = step.tokens.groups.length === 0
      ? 'tokens: none'
      : `tokens ${step.tokens.passed ? 'PASS' : 'FAIL'}: ${step.tokens.groups.map(group => (group.matched === null ? `MISSING [${group.synonyms.join(' | ')}]` : group.matched)).join(', ')}`;
    const golden = transcript.golden.status === 'missing'
      ? ''
      : ` | golden ${transcript.golden.differences.some(item => item.id === step.id) ? 'DIFF' : 'same'}`;

    return `[${step.id}] ${describeAction(step.action)} (${step.durationMs} ms)\n  spoken: ${JSON.stringify(step.spoken)}\n  ${tokens}${golden}`;
  });

  return `${[...header, ...lines].join('\n')}\n`;
}

/**
 * One action, as text.
 *
 * @param {object} action The action.
 * @returns {string} The text.
 */
export function describeAction(action) {
  const [name] = Object.keys(action);
  const value = action[name];

  return `${name} ${Array.isArray(value) ? `[${value.join(', ')}]` : String(value)}`;
}
