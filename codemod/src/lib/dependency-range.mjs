const SIMPLE_RANGE = /^([\^~]?)(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;
const PROTOCOL_SPEC = /^(?:workspace|file|link|portal|patch|git|git\+[a-z]+|github|gitlab|bitbucket|https?):/i;
const PATH_SPEC = /^(?:\.{1,2}\/|\/|~\/)/;
const REPOSITORY_SPEC = /^[\w-]+\/[\w.-]+(?:#.*)?$/;
const DIST_TAG = /^[a-z][a-z-]*$/i;

/**
 * Parse a full `MAJOR.MINOR.PATCH` version.
 *
 * @param {string} version The version text.
 * @returns {number[]} The three numbers.
 */
function parseTarget(version) {
  return version.split('.').map(Number);
}

/**
 * Compare the lowest version of a range with a target. A prerelease sorts before the release it leads up to.
 *
 * @param {number[]} left Three numbers.
 * @param {boolean} leftPre Whether the left version is a prerelease.
 * @param {number[]} right Three numbers.
 * @returns {number} Negative, zero, or positive.
 */
function compareVersions(left, leftPre, right) {
  for (let index = 0; index < 3; index++) {
    if (left[index] !== right[index]) {
      return left[index] - right[index];
    }
  }

  return leftPre ? -1 : 0;
}

/**
 * Decide how to move a dependency range to a target version, keeping the operator the user wrote.
 *
 * - `rewrite`: `^17.1.0` becomes `^18.0.0`, `~17.1.0` becomes `~18.0.0`, `17.1.0` becomes `18.0.0`, and a
 *   `^17` or `~17.1` shorthand becomes the same operator with the full target.
 * - `keep`: the lowest version of the range is already at or above the target, so it is never lowered.
 * - `skip`: a local or remote source (`workspace:`, `file:`, `link:`, git, URL, `owner/repo`) or a dist-tag
 *   (`latest`, `next`). There is nothing to rewrite and nothing to tell the user.
 * - `manual`: a comparator range (`>=17 <18`), an `||` range, an x-range (`17.x`, `17`, `*`), or an `npm:`
 *   alias. The tool does not guess, and the user sets the range.
 *
 * @param {string} spec The range as written in `package.json`.
 * @param {string} target Target version, `MAJOR.MINOR.PATCH`.
 * @returns {{action: 'rewrite', value: string}|{action: 'keep'|'skip'}|{action: 'manual', reason: string}} The
 * decision.
 */
export function planRange(spec, target) {
  const text = spec.trim();

  if ([PROTOCOL_SPEC, PATH_SPEC, REPOSITORY_SPEC].some(pattern => pattern.test(text))) {
    return { action: 'skip' };
  }

  if (text.startsWith('npm:')) {
    return { action: 'manual', reason: 'is an npm alias' };
  }

  if (/^[xX*]?$/.test(text)) {
    return { action: 'manual', reason: 'accepts any version' };
  }

  const match = SIMPLE_RANGE.exec(text);

  if (!match) {
    return DIST_TAG.test(text)
      ? { action: 'skip' }
      : { action: 'manual', reason: 'is not a plain version range' };
  }

  const [, operator, major, minor, patch, pre] = match;

  if (operator === '' && (minor === undefined || patch === undefined)) {
    return { action: 'manual', reason: 'is an x-range' };
  }

  const lowest = [Number(major), Number(minor ?? 0), Number(patch ?? 0)];

  if (compareVersions(lowest, Boolean(pre), parseTarget(target)) >= 0) {
    return { action: 'keep' };
  }

  return { action: 'rewrite', value: `${operator}${target}` };
}
