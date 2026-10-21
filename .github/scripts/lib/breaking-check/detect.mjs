/**
 * The advisory breaking-change detector: combines the removed-public-name
 * finder (`removed-names.mjs`), Jev's judgement of which names are public, and
 * the declared-signal detectors (`declared.mjs`) into one result.
 *
 * A pull request is flagged when a removed name looks public to Jev, when it
 * deletes a non-comment line of `metaSchema` (an option default changed), or
 * when it adds an entry to `REMOVED_HOOKS`/`REMOVED_OPTIONS` (the policy's way
 * of removing a hook or option, which keeps its name in source).
 * Jev is an optional filter: with no client, or when it fails, every gone
 * candidate counts, because at the threshold below Jev almost never rejects one.
 * A single missing or non-numeric answer counts the same way (flag generously).
 * Only the first 40 gone candidates are scored, as calibrated; the rest are
 * reported as `unscoredNames` and count as flagged with a `null` score too. Jev
 * is not called at all when the changelog entry already declares the break,
 * because the comment is suppressed whatever it would answer.
 */
import { filterScope } from './chunk.mjs';
import { declaredSignals } from './declared.mjs';
import { buildPublicNameRequest, goneCandidates } from './removed-names.mjs';

/**
 * Minimum Jev Noul score for a removed name to count as public. Calibrated in
 * the DEV-3030 experiment on 374 commits (real history plus injected breaks):
 * 0.04 kept every known break while cutting the false flags Jev can filter.
 * Do not change it without rerunning that calibration.
 */
export const PUBLIC_NAME_THRESHOLD = 0.04;

/**
 * Ask Jev how public each requested name is.
 *
 * @param {{ ask: (state: object, questions: object) => Promise<{ answers: object }> }} jevClient
 * @param {{ state: object, questions: object }} request
 * @returns {Promise<(number | null)[]>} One score per asked name, in order; `null` for a missing or
 *   non-numeric answer.
 */
async function scoreNames(jevClient, request) {
  const { answers } = await jevClient.ask(request.state, request.questions);

  return Object.keys(request.questions).map((id) => (typeof answers?.[id]?.noul === 'number' ? answers[id].noul : null));
}

/**
 * @param {object} input
 * @param {{ path: string, text: string }[]} input.allFiles `splitDiffByFile()` output, unfiltered.
 * @param {(args: string[]) => string} input.git
 * @param {string} input.ref The ref the diff ends at; names are grepped there.
 * @param {{ ask: Function } | null} input.jevClient `null` for the code-only fallback.
 * @returns {Promise<{
 *   removedNames: { name: string, kind: string, file: string, line: string, publicScore: number | null }[],
 *   removedRegistryAdded: { name: string, registry: string }[],
 *   defaultsTouched: boolean, defaultsEvidence: string | null,
 *   declared: { breakingEntry: boolean, removedRegistryTouched: boolean, deprecationWarnAdded: boolean },
 *   flagged: boolean, jevUsed: boolean, candidateCount: number, sentToJev: number,
 *   unscoredNames: { name: string, kind: string, file: string, line: string }[],
 *   uncheckedCount: number
 * }>}
 */
export async function detect({ allFiles, git, ref, jevClient }) {
  const scope = filterScope(allFiles);
  const { gone, uncheckedCount } = goneCandidates({ scope, git, ref });
  const signals = declaredSignals(allFiles);
  const request = buildPublicNameRequest(gone);
  let scores = null;

  if (request && jevClient && !signals.breakingEntry) {
    try {
      scores = await scoreNames(jevClient, request);
    } catch (error) {
      console.warn(`breaking-check: Jev failed (${error.message}); falling back to code-only detection.`);
    }
  }

  const unscoredNames = scores ? gone.slice(scores.length) : [];
  const removedNames = scores
    ? gone
      .slice(0, scores.length)
      .map((c, i) => ({ ...c, publicScore: scores[i] }))
      .filter((c) => c.publicScore === null || c.publicScore >= PUBLIC_NAME_THRESHOLD)
      .concat(unscoredNames.map((c) => ({ ...c, publicScore: null })))
    : gone.map((c) => ({ ...c, publicScore: null }));

  return {
    removedNames,
    removedRegistryAdded: signals.removedRegistryAdded,
    defaultsTouched: signals.defaultsTouched,
    defaultsEvidence: signals.evidence.defaultsTouched,
    declared: {
      breakingEntry: signals.breakingEntry,
      removedRegistryTouched: signals.removedRegistryTouched,
      deprecationWarnAdded: signals.deprecationWarnAdded,
    },
    flagged: removedNames.length > 0 || signals.removedRegistryAdded.length > 0 || signals.defaultsTouched,
    jevUsed: scores !== null,
    candidateCount: gone.length,
    sentToJev: scores ? scores.length : 0,
    unscoredNames,
    uncheckedCount,
  };
}
