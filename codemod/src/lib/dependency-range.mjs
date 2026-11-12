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

const PART = '(\\d+|[xX*])';
const COMPARATOR = new RegExp(`^(>=|<=|>|<|=|\\^|~)?v?${PART}(?:\\.${PART})?(?:\\.${PART})?`
  + '(?:-[0-9A-Za-z.-]+)?(?:\\+[0-9A-Za-z.-]+)?$');
const NPM_ALIAS = /^npm:((?:@[\w.-]+\/)?[\w.-]+)@(.+)$/;

/**
 * Compare two versions of three numbers.
 *
 * @param {number[]} left Three numbers.
 * @param {number[]} right Three numbers.
 * @returns {number} Negative, zero, or positive.
 */
function cmp(left, right) {
  return left[0] - right[0] || left[1] - right[1] || left[2] - right[2];
}

/**
 * Parse a comparator such as `>=17`, `<19.0.0`, `18.x`, or `~18.1` and tell whether a version satisfies it.
 *
 * @param {string} token One comparator without spaces.
 * @param {number[]} version Three numbers.
 * @returns {boolean|null} The answer, or `null` when the form is not understood (a caret on a 0.x version).
 */
function admitsComparator(token, version) {
  const match = COMPARATOR.exec(token);

  if (!match) {
    return null;
  }

  const [, operator = '', ...rest] = match;
  const parts = [];

  for (const text of rest.slice(0, 3)) {
    if (text === undefined || /^[xX*]$/.test(text)) {
      break;
    }

    parts.push(Number(text));
  }

  if (parts.length === 0) {
    return operator === '' || operator === '=' || operator === '>=' || operator === '<=' || operator === '^'
      || operator === '~' ? true : null;
  }

  const lower = [parts[0], parts[1] ?? 0, parts[2] ?? 0];
  const next = [...lower];

  next[parts.length - 1] += 1;

  if (parts.length < 3) {
    next.fill(0, parts.length);
  }

  const exact = parts.length === 3;

  switch (operator) {
    case '>=':
      return cmp(version, lower) >= 0;
    case '<':
      return cmp(version, lower) < 0;
    case '>':
      return exact ? cmp(version, lower) > 0 : cmp(version, next) >= 0;
    case '<=':
      return exact ? cmp(version, lower) <= 0 : cmp(version, next) < 0;
    case '^':
      return lower[0] === 0 ? null : cmp(version, lower) >= 0 && cmp(version, [lower[0] + 1, 0, 0]) < 0;
    case '~':
      return cmp(version, lower) >= 0 && cmp(version, parts.length === 1 ? [lower[0] + 1, 0, 0]
        : [lower[0], lower[1] + 1, 0]) < 0;
    default:
      return exact ? cmp(version, lower) === 0 : cmp(version, lower) >= 0 && cmp(version, next) < 0;
  }
}

/**
 * Tell whether a version range already allows a version. It understands comparators (`>=17.0.0 <19`), `||`,
 * hyphen ranges, x-ranges, `*`, caret, and tilde. A prerelease tag on a bound is ignored.
 *
 * @param {string} range The range as written in `package.json`.
 * @param {string} version A full `MAJOR.MINOR.PATCH` version.
 * @returns {boolean|null} `true` when the range allows it, `false` when it does not, and `null` when the range has
 * a form this function does not understand.
 */
export function rangeAdmits(range, version) {
  const target = parseTarget(version);
  const alternatives = String(range).trim().split('||').map((text) => {
    const hyphen = /^(\S+)\s+-\s+(\S+)$/.exec(text.trim());
    const tokens = hyphen ? [`>=${hyphen[1]}`, `<=${hyphen[2]}`]
      : text.trim().replace(/(>=|<=|>|<|=|\^|~)\s+/g, '$1').split(/\s+/).filter(Boolean);
    const answers = (tokens.length === 0 ? ['*'] : tokens).map(token => admitsComparator(token, target));

    if (answers.includes(false)) {
      return false;
    }

    return answers.includes(null) ? null : true;
  });

  if (alternatives.includes(true)) {
    return true;
  }

  return alternatives.includes(null) ? null : false;
}

/**
 * Decide how to move a dependency range to a target version, keeping the operator the user wrote.
 *
 * - `rewrite`: `^17.1.0` becomes `^18.0.0`, `~17.1.0` becomes `~18.0.0`, `17.1.0` becomes `18.0.0`, and a
 *   `^17` or `~17.1` shorthand becomes the same operator with the full target.
 * - `keep`: a compound or open range that already allows the target (`>=17.0.0 <19`, `*`, `18.x`,
 *   `npm:handsontable@^18.0.0`), or a simple range whose lowest version is at or above the target, so it is never
 *   lowered. A simple caret, tilde, or exact range below the target is raised even when it admits the target
 *   (`^18.0.0` becomes `^18.1.0`), because the user asked to migrate to that version.
 * - `skip`: a local or remote source (`workspace:`, `file:`, `link:`, git, URL, `owner/repo`) or a dist-tag
 *   (`latest`, `next`). There is nothing to rewrite and nothing to tell the user.
 * - `manual`: a comparator range that stops short of the target (`>=17 <18`), an `||` range, an x-range
 *   (`17.x`, `17`), an `npm:` alias to an older version, or a form the tool does not understand. The tool does not
 *   guess, and the user sets the range.
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
    const alias = NPM_ALIAS.exec(text);

    return alias && rangeAdmits(alias[2], target) === true
      ? { action: 'keep' }
      : { action: 'manual', reason: 'is an npm alias' };
  }

  if (/^[xX*]?$/.test(text)) {
    return { action: 'keep' };
  }

  const match = SIMPLE_RANGE.exec(text);

  if (!match) {
    if (DIST_TAG.test(text)) {
      return { action: 'skip' };
    }

    return rangeAdmits(text, target) === true
      ? { action: 'keep' }
      : { action: 'manual', reason: 'is not a plain version range' };
  }

  const [, operator, major, minor, patch, pre] = match;

  if (operator === '' && (minor === undefined || patch === undefined)) {
    return rangeAdmits(text, target) === true
      ? { action: 'keep' }
      : { action: 'manual', reason: 'is an x-range' };
  }

  const lowest = [Number(major), Number(minor ?? 0), Number(patch ?? 0)];

  if (compareVersions(lowest, Boolean(pre), parseTarget(target)) >= 0) {
    return { action: 'keep' };
  }

  return { action: 'rewrite', value: `${operator}${target}` };
}
