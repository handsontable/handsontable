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
 * Parses `tsc --pretty false` / `vue-tsc --pretty false` output. Continuation lines (the indented
 * elaboration of a message) are dropped; the first line carries the code and the headline message.
 *
 * @param {string} output The raw compiler output.
 * @returns {{ diagnostics: Array<{file: string, line: number, code: string, message: string}>, global: string[] }}
 *   File diagnostics and global ones (no file: a broken config, a missing input).
 */
export function parseDiagnostics(output) {
  const diagnostics = [];
  const global = [];

  for (const raw of output.split(/\r?\n/)) {
    const match = DIAGNOSTIC_RE.exec(raw);

    if (match) {
      diagnostics.push({ file: match[1], line: Number(match[2]), code: match[4], message: match[5] });
    } else if (GLOBAL_DIAGNOSTIC_RE.test(raw)) {
      global.push(raw);
    }
  }

  return { diagnostics, global };
}

/**
 * @param {{code: string, message: string}} diagnostic A diagnostic.
 * @returns {string} The identity of the error that survives line shifts: its code and headline message.
 */
export function errorKey(diagnostic) {
  return `${diagnostic.code}: ${diagnostic.message}`;
}

/**
 * Returns the errors the head version of a file has on top of its base version. Errors are compared
 * as a multiset of (code, message), never by line, so an edit that only moves an old error does not
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
