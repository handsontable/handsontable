// The counterexample fixtures' contract (evals/fixtures/<case>/counterexamples/).
//
// A counterexample is the reference test plus exactly one scorer smell, and it
// declares that smell in its file name: `<scenario>.<smell>.spec.ts` (or `.spec.js`,
// `.unit.ts`, `.unit.js`), e.g. `escape-cancels-edit.set-timeout.spec.ts`. The harness
// self-test then asserts the scorer catches the file for THAT smell — not merely that it
// scores `suspect`, which an empty file, a hollow test, or a `.skip` also do with zero
// determinism smells, and which a stray README in the folder would too.
//
// The declared smell is either a determinism smell — a problem, so the verdict flips to
// `suspect` — or a structure smell, reported as a warning while its precision is measured
// (`unasserted-capture` leaves the verdict `meaningful`). A fixture is caught when the
// scorer reports its declared smell in whichever tier that smell lives in, and nothing else.

import { DETERMINISM_SIGNALS, STRUCTURE_SIGNALS } from '../score.mjs';

const COUNTEREXAMPLE_FILE_RE = /^[^.]+\.(?<smell>[a-z][a-z-]*)\.(?:spec|unit)\.[jt]s$/;

/**
 * Every smell id a counterexample may declare: the determinism smells (the problem tier)
 * followed by the structure smells (the warning tier).
 */
export const KNOWN_SMELLS = [...DETERMINISM_SIGNALS, ...STRUCTURE_SIGNALS];

/**
 * Read the smell a counterexample fixture declares in its file name.
 *
 * @param {string} fileName The fixture's base name.
 * @param {string[]} [knownSmells=KNOWN_SMELLS] The smell ids the scorer knows.
 * @returns {{smell: string}|{error: string}} The declared smell, or why the name is not a
 *   valid counterexample.
 */
export function expectedSmellOf(fileName, knownSmells = KNOWN_SMELLS) {
  const match = fileName.match(COUNTEREXAMPLE_FILE_RE);

  if (!match) {
    return {
      error: `"${fileName}" does not name the smell it carries — a counterexample is `
        + '<scenario>.<smell>.spec.ts (or .spec.js / .unit.ts / .unit.js), '
        + 'e.g. escape-cancels-edit.set-timeout.spec.ts',
    };
  }

  const { smell } = match.groups;

  if (!knownSmells.includes(smell)) {
    return {
      error: `"${fileName}" names the smell "${smell}", which the scorer does not know `
        + `(known: ${knownSmells.join(', ')})`,
    };
  }

  return { smell };
}

/**
 * Why a counterexample's score does not prove its declared smell — null when it does.
 * Proving it means the declared smell is the ONLY smell found, across `determinismSmells`
 * and `structureSmells`, and the problems are exactly what that smell produces: the single
 * `determinism-smells` problem for a determinism smell, none for a warning-tier structure
 * smell (which must then be present as the `structure-smells` warning). A second smell, a
 * hollow test, or a `.skip` inside the fixture would keep it `suspect` after the scorer
 * lost the declared signal, and hide exactly the regression the fixture exists to catch.
 *
 * @param {{verdict: string, determinismSmells: {type: string}[], structureSmells?: {type: string}[],
 *   problems: {type: string}[], warnings?: {type: string}[]}} score The fixture's score object.
 * @param {string} smell The smell the fixture declares.
 * @returns {string|null} The reason the fixture is not proven, or null.
 */
export function missReason(score, smell) {
  const determinism = score.determinismSmells.map(found => found.type);
  const structure = (score.structureSmells ?? []).map(found => found.type);
  const smells = [...determinism, ...structure];
  const problems = score.problems.map(problem => problem.type);

  if (!smells.includes(smell)) {
    return `the "${smell}" smell was not detected (verdict ${score.verdict}`
      + `${smells.length > 0 ? `; smells found: ${smells.join(', ')}` : ''})`;
  }

  if (smells.length > 1) {
    return `carries more than its one smell: ${smells.join(', ')}`;
  }

  // A determinism smell is the file's one problem; a structure smell is a warning and
  // leaves no problem at all.
  const expectedProblems = determinism.includes(smell) ? ['determinism-smells'] : [];

  if (problems.join(',') !== expectedProblems.join(',')) {
    return `has problems besides the smell, which would mask losing it: ${problems.join(', ')}`;
  }

  if (structure.includes(smell) && !(score.warnings ?? []).some(warning => warning.type === 'structure-smells')) {
    return `the "${smell}" structure smell was found but not reported as the structure-smells warning`;
  }

  return null;
}
