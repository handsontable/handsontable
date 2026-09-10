/**
 * Candidate identity and prod-side dedup for the docs sync.
 *
 * The repository squash-merges, so every pull request is one commit on
 * `develop` whose subject ends with `(#<n>)`. That number is the identity used
 * to recognise a change that already reached the prod branch by another route:
 * a hand-made cherry-pick pull request (squash-merged, so patch-ids differ, but
 * its subject or body keeps the `(#<n>)`), or an earlier run of this tool
 * (`cherry-pick -x` writes a `cherry picked from commit` trailer that the squash
 * body carries).
 */

const TRAILING_PR = /\(#(\d+)\)\s*$/;
const ANY_PR_REF = /\(#(\d+)\)/g;
const CHERRY_TRAILER = /cherry picked from commit ([0-9a-f]{7,40})/g;

/**
 * The pull request number a squash subject ends with.
 *
 * @param {string} subject Commit subject line.
 * @returns {number|null}
 */
export function parseSquashSubject(subject) {
  const match = TRAILING_PR.exec(subject);

  return match ? Number(match[1]) : null;
}

/**
 * Every pull request number and cherry-pick source sha the prod branch mentions.
 *
 * @param {Array<{ subject: string, body: string }>} commits Commits on the prod branch since the merge base.
 * @returns {{ prNumbers: Set<number>, shas: Set<string> }}
 */
export function collectProdRefs(commits) {
  const prNumbers = new Set();
  const shas = new Set();

  for (const { subject, body } of commits) {
    const text = `${subject}\n${body ?? ''}`;

    for (const match of text.matchAll(ANY_PR_REF)) {
      prNumbers.add(Number(match[1]));
    }
    for (const match of text.matchAll(CHERRY_TRAILER)) {
      shas.add(match[1]);
    }
  }

  return { prNumbers, shas };
}

/**
 * The shas `git cherry` marks with `-` (an equivalent patch exists upstream).
 *
 * @param {string} text Raw `git cherry <upstream> <head> <limit>` output.
 * @returns {Set<string>}
 */
export function parseCherryOutput(text) {
  const shas = new Set();

  for (const line of text.split('\n')) {
    const match = /^-\s+([0-9a-f]+)/.exec(line);

    if (match) {
      shas.add(match[1]);
    }
  }

  return shas;
}

/**
 * Whether a develop commit already reached the prod branch by any route.
 *
 * @param {{ sha: string, prNumber: number|null }} candidate
 * @param {{ prNumbers: Set<number>, shas: Set<string> }} refs From `collectProdRefs`.
 * @param {Set<string>} equivalentShas From `parseCherryOutput`.
 * @returns {boolean}
 */
export function isAlreadyOnProd(candidate, refs, equivalentShas) {
  if (equivalentShas.has(candidate.sha)) {
    return true;
  }
  if (candidate.prNumber !== null && refs.prNumbers.has(candidate.prNumber)) {
    return true;
  }

  return [...refs.shas].some((sha) => candidate.sha.startsWith(sha) || sha.startsWith(candidate.sha));
}
