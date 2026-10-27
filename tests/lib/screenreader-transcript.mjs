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
 * dropped (a `.` or `,` inside a number stays), whitespace collapsed, and the screen reader's own
 * chatter removed. Phrases differ per screen
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
 * The chatter phrases as one pattern: a whole phrase, with no character other than whitespace on either
 * side, so `unclickable` stays and two phrases in a row (`clickable clickable`, which NVDA says for
 * nested clickable elements) both go. The phrases are lowercase words joined by single spaces, so they
 * need no escaping; `lib/__tests__/screenreader-transcript.test.mjs` keeps them that way.
 */
const CHATTER_PATTERN = new RegExp(`(?<!\\S)(?:${CHATTER.join('|')})(?!\\S)`, 'g');
/**
 * What the normalizer turns into a space: every run of characters that is not a letter, a digit or
 * whitespace, except a `.` or a `,` with a digit on both sides, which stays part of its number
 * (`34.5`, `1,000`).
 */
const NOT_A_WORD = /(?:(?<!\p{Nd})[.,]|[.,](?!\p{Nd})|[^\p{L}\p{N}\s.,])+/gu;

/**
 * Normalizes an announcement for comparison: NFKC, lowercase, every run of characters that is not a
 * letter, a digit or a space becomes one space (a `.` or a `,` between two digits stays, so `34.5` is
 * one number and never the `34` of a token), the chatter phrases are dropped, whitespace collapses.
 *
 * @param {unknown} text The announcement as the screen reader spoke it.
 * @returns {string} The normalized text.
 */
export function normalizeAnnouncement(text) {
  return String(text ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(NOT_A_WORD, ' ')
    .replace(/\s+/g, ' ')
    .replace(CHATTER_PATTERN, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The words before a number that make it a position rather than a value (`row 8`, `column 1`,
 * `col 1`, `level 2`, the `3` of `1 of 3`).
 */
const POSITION_BEFORE = '(?<!\\b(?:row|column|col|level|of) )';
/**
 * The words after a number that make it a position rather than a value (the `1` of `1 of 3`).
 */
const POSITION_AFTER = '(?! of )';

/**
 * Whether a normalized synonym is a whole-phrase match inside a normalized announcement. A synonym of
 * digits alone (`"1"`) is a value, so it matches only a standalone number that is not part of a
 * position phrase: not after `row `, `column `, `col `, `level ` or `of `, and not before ` of `.
 * Otherwise every announcement that carries a position (`row 8 column 1`) would satisfy a bare
 * number group. A decimal or a grouped number (`34.5`, `1,000`) is one word, so `34` never matches
 * inside it. Two limits follow from the rule: a negative number loses its sign (`-34` matches `34`,
 * because the normalizer drops the `-`), and a number right after `of` is read as a set position, so
 * a value there (`total of 34`) never matches.
 *
 * @param {string} normalized The normalized announcement.
 * @param {string} token The normalized synonym.
 * @returns {boolean} Whether it matches.
 */
function containsToken(normalized, token) {
  if (/^\d+$/.test(token)) {
    return new RegExp(`(?<!\\S)${POSITION_BEFORE}${token}${POSITION_AFTER}(?!\\S)`).test(normalized);
  }

  return ` ${normalized} `.includes(` ${token} `);
}

/**
 * The first synonym of each group that the normalized announcement contains. A synonym is normalized
 * the same way and matched as a whole-word phrase, so `row 2` does not match `row 22`. A synonym of
 * digits alone (`"1"`) is a value, not a position: it matches only a standalone number that is not
 * preceded by `row `, `column `, `col `, `level ` or `of ` and not followed by ` of `, so `["1"]`
 * is satisfied by `1 row header row 8` and not by `row 8 column 1`, `collapsed row 1` or `1 of 3`.
 * A group that means a position spells it out (`"row 1"`). The limits of the digit rule (a lost sign,
 * a value after `of`) are on `containsToken()`.
 *
 * @param {string} normalized The normalized announcement.
 * @param {string[][]} groups The token groups of the step.
 * @returns {{passed: boolean, groups: {synonyms: string[], matched: string|null}[]}} The verdict.
 */
export function matchTokenGroups(normalized, groups) {
  const result = groups.map((synonyms) => {
    const matched = synonyms.find((synonym) => {
      const token = normalizeAnnouncement(synonym);

      return token !== '' && containsToken(normalized, token);
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
 * The human-readable log of a transcript, one line per step. A transcript of a run that stopped at a
 * step (`incomplete`) says so in its header, with the step and the error, above the steps captured
 * before it.
 *
 * @param {object} transcript The transcript.
 * @returns {string} The log.
 */
export function renderTranscriptLog(transcript) {
  const header = [
    `# ${transcript.scenario} on ${transcript.project} (${transcript.environment.screenReader}, ${transcript.environment.browser})`,
    `# ${transcript.startedAt}, ${transcript.durationMs} ms, mode ${transcript.mode}, attempt ${transcript.attempt}`,
    `# golden: ${transcript.golden.status}${transcript.golden.differences.length ? ` (${transcript.golden.differences.length} differences)` : ''}`,
    ...(transcript.incomplete
      ? [`# INCOMPLETE: stopped at step ${transcript.incomplete.step}: ${String(transcript.incomplete.error).replace(/\s+/g, ' ').trim()}`]
      : []),
    '',
  ];
  const lines = transcript.steps.map((step) => {
    const tokens = step.tokens.groups.length === 0
      ? 'tokens: none'
      : `tokens ${step.tokens.passed ? 'PASS' : 'FAIL'}: ${step.tokens.groups.map(group => (group.matched === null ? `MISSING [${group.synonyms.join(' | ')}]` : group.matched)).join(', ')}`;
    // No verdict where nothing was compared: no golden, a partial run, or a run that recorded one.
    const golden = ['missing', 'recorded', 'incomplete'].includes(transcript.golden.status)
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
