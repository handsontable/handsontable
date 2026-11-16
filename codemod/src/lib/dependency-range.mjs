const SIMPLE_RANGE = /^([\^~]?)(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;
const PROTOCOL_SPEC = /^(?:workspace|file|link|portal|patch|git|git\+[a-z]+|github|gitlab|bitbucket|https?|ssh):/i;
const REMOTE_PROTOCOL_SPEC = /^(?:git|git\+[a-z]+|github|gitlab|bitbucket|https?|ssh):/i;
const PATH_SPEC = /^(?:\.{1,2}[\\/]|\/|~\/|[A-Za-z]:[\\/]|\\\\)/;
const SCP_SPEC = /^[\w.-]+@[\w.-]+:\S/;
const REPOSITORY_SPEC = /^[\w-]+\/[\w.-]+(?:#.*)?$/;
const DIST_TAG = /^[a-z][a-z-]*$/i;
const CATALOG_SPEC = /^catalog:/i;
const NPM_ALIAS = /^npm:((?:@[\w.-]+\/)?[\w.-]+)@(.+)$/;

/**
 * Tell whether a dependency spec points at a source instead of naming a version range: a protocol (`workspace:`,
 * `file:`, `link:`, `portal:`, `patch:`, `git:`, `git+...:`, `github:`, `gitlab:`, `bitbucket:`, `http:`, `https:`,
 * `ssh:`), an scp-style repository (`git@host:org/repo.git#17.1.0`), a pnpm `catalog:`, a path (`./x`, `../x`, `.\\x`,
 * `/x`, `~/x`, `C:\\libs\\x`, `\\\\server\\share`), or a `owner/repo` shorthand. Digits in such a spec belong to a file
 * name, a port, a tag, or a branch, so nothing may read a version out of it. An `npm:` alias is not a source: it names a
 * range. This is the one predicate of `planRange()` and of `minimumOfRange()` in `versions.mjs`.
 *
 * @param {string} spec The spec as written in `package.json`.
 * @returns {boolean} `true` for a source spec.
 */
export function isSourceSpec(spec) {
  const text = String(spec).trim();

  return [PROTOCOL_SPEC, PATH_SPEC, SCP_SPEC, REPOSITORY_SPEC, CATALOG_SPEC].some(pattern => pattern.test(text));
}

/**
 * Tell whether a dependency spec installs from a repository or a URL: `git:`, `git+...:`, `github:`, `gitlab:`,
 * `bitbucket:`, `http:`, `https:`, `ssh:`, an scp-style `git@host:org/repo.git`, or an `owner/repo` shorthand. Such a spec names a ref or a file, not a version
 * range, so nothing can bump it, but it is not local code either: the project can still be on the old release. A
 * `workspace:`, `file:`, `link:`, `portal:`, or `patch:` spec and a path are local, and a `catalog:` spec has its own report.
 *
 * @param {string} spec The spec as written in `package.json`.
 * @returns {boolean} `true` for a repository or URL spec.
 */
export function isRemoteSource(spec) {
  const text = String(spec).trim();

  return REMOTE_PROTOCOL_SPEC.test(text) || SCP_SPEC.test(text) || REPOSITORY_SPEC.test(text);
}

/**
 * Split a pnpm catalog spec.
 *
 * @param {string} spec The spec as written in `package.json`.
 * @returns {{name: string|null}|null} `{ name: null }` for `catalog:` and `catalog:default`, `{ name }` for
 * `catalog:<name>`, and `null` for any other spec.
 */
export function parseCatalogSpec(spec) {
  const match = /^catalog:(.*)$/i.exec(String(spec).trim());

  if (!match) {
    return null;
  }

  const name = match[1].trim();

  return { name: name === '' || name === 'default' ? null : name };
}

/**
 * The version range an `npm:` alias names: `^17.1.0` for `npm:handsontable@^17.1.0`.
 *
 * @param {string} spec The spec as written in `package.json`.
 * @returns {string|null} The range, or `null` when the spec is not an alias with a range.
 */
export function aliasRange(spec) {
  return NPM_ALIAS.exec(String(spec).trim())?.[2] ?? null;
}

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
  + '(?:-([0-9A-Za-z.-]+))?(?:\\+[0-9A-Za-z.-]+)?$');

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
  const prerelease = rest[3];
  const parts = [];

  // A prerelease sorts below the release it leads up to, so on an upper or an exact bound the answer is not the one
  // of the bare numbers. An exact prerelease is never a release, and an upper bound with one is not read. A
  // prerelease on a lower bound or a caret is the lowest version it allows, which the numbers already say.
  if (prerelease && (operator === '=' || operator === '')) {
    return false;
  }

  if (prerelease && (operator === '<' || operator === '<=')) {
    return null;
  }

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
 * hyphen ranges, x-ranges, `*`, caret, and tilde. A prerelease tag on a lower bound is ignored. An exact prerelease
 * (`=18.0.0-beta.2`) allows no release, and one on an upper bound (`<=18.0.0-rc.2`) gives `null`, because the tool
 * does not guess how it sorts against the release it leads up to.
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
 * The lowest version a range allows, as the text of its lower bound (`17`, `17.1`, `17.1.0`, `18.0.0-rc.1`).
 *
 * The answer is the lowest over every `||` alternative, and within an alternative the highest of its lower bounds
 * (`>=17 <19` is 17, `>=17 >=17.2` is 17.2). A range has no usable floor, and the answer is `null`, when:
 *
 * - an alternative has no lower bound: it holds only `<`, `<=`, `*`, an `x` major, or nothing (`<18.0.0`, `*`, an
 *   empty spec), so any version below the others is allowed,
 * - an alternative uses `>` (`>17.0.0`), whose floor is the next version after the one written,
 * - a token is not a comparator at all (`latest`, a tag, a word).
 *
 * @param {string} range The range as written in `package.json`, after an `npm:` alias was unwrapped.
 * @returns {string|null} The floor text, or `null` when the tool must ask for `--from`.
 */
export function rangeFloor(range) {
  let lowest = null;

  for (const text of String(range).trim().split('||')) {
    const hyphen = /^(\S+)\s+-\s+(\S+)$/.exec(text.trim());
    const tokens = hyphen ? [`>=${hyphen[1]}`, `<=${hyphen[2]}`]
      : text.trim().replace(/(>=|<=|>|<|=|\^|~)\s+/g, '$1').split(/\s+/).filter(Boolean);
    let floor = null;

    for (const token of tokens) {
      const match = COMPARATOR.exec(token);

      if (!match) {
        return null;
      }

      const [, operator = '', ...rest] = match;

      if (operator === '>') {
        return null;
      }

      if (operator === '<' || operator === '<=') {
        continue;
      }

      const parts = [];

      for (const part of rest.slice(0, 3)) {
        if (part === undefined || /^[xX*]$/.test(part)) {
          break;
        }

        parts.push(Number(part));
      }

      if (parts.length === 0) {
        continue;
      }

      const bound = { parts, text: parts.join('.') + (parts.length === 3 && rest[3] ? `-${rest[3]}` : '') };

      if (floor === null || cmp(padded(bound.parts), padded(floor.parts)) > 0) {
        floor = bound;
      }
    }

    if (floor === null) {
      return null;
    }

    if (lowest === null || cmp(padded(floor.parts), padded(lowest.parts)) < 0) {
      lowest = floor;
    }
  }

  return lowest?.text ?? null;
}

/**
 * Pad a partial version with zeros.
 *
 * @param {number[]} parts One to three numbers.
 * @returns {number[]} Three numbers.
 */
function padded(parts) {
  return [parts[0], parts[1] ?? 0, parts[2] ?? 0];
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

  if (isSourceSpec(text) && !CATALOG_SPEC.test(text)) {
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
