// The counterexample fixtures' contract (evals/fixtures/<case>/counterexamples/).
//
// A counterexample is the reference test plus exactly one determinism smell, and it
// declares that smell in its file name: `<scenario>.<smell>.spec.ts` (or `.spec.js`,
// `.unit.ts`, `.unit.js`), e.g. `escape-cancels-edit.set-timeout.spec.ts`. The harness
// self-test then asserts the scorer catches the file for THAT smell — not merely that it
// scores `suspect`, which an empty file, a hollow test, or a `.skip` also do with zero
// determinism smells, and which a stray README in the folder would too.

import { DETERMINISM_SIGNALS } from '../score.mjs';

const COUNTEREXAMPLE_FILE_RE = /^[^.]+\.(?<smell>[a-z][a-z-]*)\.(?:spec|unit)\.[jt]s$/;

/**
 * Read the smell a counterexample fixture declares in its file name.
 *
 * @param {string} fileName The fixture's base name.
 * @param {string[]} [knownSmells=DETERMINISM_SIGNALS] The smell ids the scorer knows.
 * @returns {{smell: string}|{error: string}} The declared smell, or why the name is not a
 *   valid counterexample.
 */
export function expectedSmellOf(fileName, knownSmells = DETERMINISM_SIGNALS) {
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
 * Proving it means the declared smell is the ONLY determinism smell found and
 * `determinism-smells` is the ONLY problem: a second smell, a hollow test, or a `.skip`
 * inside the fixture would keep it `suspect` after the scorer lost the declared signal,
 * and hide exactly the regression the fixture exists to catch.
 *
 * @param {{verdict: string, determinismSmells: {type: string}[], problems: {type: string}[]}} score
 *   The fixture's score object.
 * @param {string} smell The smell the fixture declares.
 * @returns {string|null} The reason the fixture is not proven, or null.
 */
export function missReason(score, smell) {
  const smells = score.determinismSmells.map(found => found.type);
  const problems = score.problems.map(problem => problem.type);

  if (!smells.includes(smell)) {
    return `the "${smell}" smell was not detected (verdict ${score.verdict}`
      + `${smells.length > 0 ? `; smells found: ${smells.join(', ')}` : ''})`;
  }

  if (smells.length > 1) {
    return `carries more than its one smell: ${smells.join(', ')}`;
  }

  if (problems.length !== 1 || problems[0] !== 'determinism-smells') {
    return `has problems besides the smell, which would mask losing it: ${problems.join(', ')}`;
  }

  return null;
}
