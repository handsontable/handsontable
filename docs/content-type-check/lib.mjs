/**
 * Pure helpers of the docs examples type check. No I/O, so the unit tests can drive them directly.
 */

/**
 * The example files the check covers: the JavaScript (TypeScript) example, the React example and
 * the Vue example of a docs page. Angular examples have their own checker (`docs/angular-type-check`).
 */
const EXAMPLE_FILE_RE = /^docs\/content\/.+\/(?:javascript\/[^/]+\.ts|react\/[^/]+\.tsx|vue\/[^/]+\.vue)$/;

/**
 * @param {string} repoPath A repo-relative path with forward slashes.
 * @returns {boolean} True when the path is a checked docs example.
 */
export function isExampleFile(repoPath) {
  return EXAMPLE_FILE_RE.test(repoPath) && !repoPath.endsWith('.d.ts');
}

/**
 * @param {string} repoPath A checked example path.
 * @returns {'ts'|'vue'} The tool that checks the file: `tsc` for `.ts`/`.tsx`, `vue-tsc` for `.vue`.
 */
export function toolFor(repoPath) {
  return repoPath.endsWith('.vue') ? 'vue' : 'ts';
}

const DIAGNOSTIC_RE = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/;
const GLOBAL_DIAGNOSTIC_RE = /^error (TS\d+): (.*)$/;

/**
 * Parses `tsc --pretty false` / `vue-tsc --pretty false` output. The indented continuation lines are
 * folded, whitespace-normalized, into `detail`; the first line carries the code and the headline message.
 *
 * @param {string} output The raw compiler output.
 * @returns {{ diagnostics: Array<{file: string, line: number, code: string, message: string, detail: string}>, global: string[] }}
 *   File diagnostics and global ones (no file: a broken config, a missing input).
 */
export function parseDiagnostics(output) {
  const diagnostics = [];
  const global = [];

  let last = null;

  for (const raw of output.split(/\r?\n/)) {
    const match = DIAGNOSTIC_RE.exec(raw);

    if (match) {
      last = { file: match[1], line: Number(match[2]), code: match[4], message: match[5], detail: '' };
      diagnostics.push(last);
    } else if (GLOBAL_DIAGNOSTIC_RE.test(raw)) {
      last = null;
      global.push(raw);
    } else if (last && /^\s+\S/.test(raw)) {
      // Elaboration of the error above (TS2769 lists every failed overload here). Positions
      // `(line,col)` are stripped so an edit that only shifts lines keeps the same key.
      last.detail += ` ${raw.replace(/\(\d+,\d+\)/g, '').replace(/\s+/g, ' ').trim()}`;
    } else {
      last = null;
    }
  }

  return { diagnostics, global };
}

/**
 * @param {string} text A compiler message.
 * @returns {string} The message with every single-quoted segment collapsed to `''`. The compiler quotes
 *   local names (`TS7006`, `TS2339`) and inferred types (`{ name: string; }`) that way, and both change
 *   under a rename or a valid new property, which must not turn an old error into a new one.
 */
export function stripQuoted(text) {
  return text.replace(/'[^']*'/g, '\'\'');
}

/**
 * @param {{code: string, message: string, detail?: string}} diagnostic A diagnostic.
 * @returns {string} The identity of the error that survives line shifts, renames and type-neutral edits:
 *   its code and the shape of its headline and elaboration, with the quoted names and types removed.
 */
export function errorKey(diagnostic) {
  return stripQuoted(`${diagnostic.code}: ${diagnostic.message}${diagnostic.detail ?? ''}`);
}

/**
 * @param {string} value Text for a GitHub workflow command message or property.
 * @param {boolean} isProperty True for a property value, which also escapes `:` and `,`.
 * @returns {string} The value with `%`, CR and LF (and for properties `:` and `,`) escaped.
 */
export function escapeCommand(value, isProperty = false) {
  const escaped = String(value).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');

  return isProperty ? escaped.replace(/:/g, '%3A').replace(/,/g, '%2C') : escaped;
}

/**
 * Returns the errors the head version of a file has on top of its base version. Errors are compared
 * as a multiset of (code, message shape), never by line, so an edit that only moves an old error does not
 * fail the check, while a second copy of an old error does.
 *
 * @param {Array<{line: number, code: string, message: string}>} headErrors Errors of the head version.
 * @param {Array<{line: number, code: string, message: string}>} baseErrors Errors of the base version (empty for a new file).
 * @returns {{ introduced: Array<{line: number, code: string, message: string}>, tolerated: number }}
 *   The introduced errors, and the count of head errors that already existed at base.
 */
export function introducedErrors(headErrors, baseErrors) {
  const budget = new Map();

  for (const error of baseErrors) {
    budget.set(errorKey(error), (budget.get(errorKey(error)) ?? 0) + 1);
  }

  const introduced = [];
  let tolerated = 0;

  for (const error of headErrors) {
    const left = budget.get(errorKey(error)) ?? 0;

    if (left > 0) {
      budget.set(errorKey(error), left - 1);
      tolerated += 1;
    } else {
      introduced.push(error);
    }
  }

  return { introduced, tolerated };
}

/**
 * Parses `git diff --name-status -M -z` output into the changed example files.
 *
 * @param {string} raw The NUL-separated output.
 * @returns {Array<{head: string, base: string|null}>} The added, modified and renamed examples. `base` is the
 *   path of the file at the base revision, or `null` when the file is new.
 */
export function parseNameStatus(raw) {
  const tokens = raw.split('\0').filter(Boolean);
  const entries = [];

  for (let i = 0; i < tokens.length;) {
    const status = tokens[i];

    if (status[0] === 'R' || status[0] === 'C') {
      const [from, to] = [tokens[i + 1], tokens[i + 2]];

      i += 3;

      if (status[0] === 'R' && isExampleFile(to)) {
        entries.push({ head: to, base: isExampleFile(from) ? from : null });
      } else if (status[0] === 'C' && isExampleFile(to)) {
        entries.push({ head: to, base: null });
      }
    } else {
      const file = tokens[i + 1];

      i += 2;

      if (isExampleFile(file) && (status === 'A' || status === 'M')) {
        entries.push({ head: file, base: status === 'A' ? null : file });
      }
    }
  }

  return entries;
}
