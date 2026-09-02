/**
 * Determinism ratchet — pure diff/lint intersection.
 *
 * The frozen Jasmine suite carries hundreds of `sleep()` calls, a handful of
 * `it.flaky()` and `.skip` markers, so the ESLint rules that flag them are
 * `warn` in `handsontable/.eslintrc.js` and nothing consumes warnings. Flipping
 * them to `error` would red-wall every touched spec. This module is the
 * ratchet instead: a warning that sits on a line the branch ADDED is treated as
 * an error, while every pre-existing occurrence stays a warning. The debt can
 * only shrink.
 *
 * No git, filesystem or ESLint access lives here so the decision is
 * unit-testable; the CLI (`../lint-ratchet.mjs`) feeds it a unified diff and
 * ESLint's `--format json` output.
 */
import path from 'node:path';

/**
 * The warn-level rules the ratchet escalates on added lines. The single
 * source of truth — the CLI, the pre-push hook and the docs all read it here.
 * A rule that graduates to `error` in `handsontable/.eslintrc.js` belongs off
 * this list (ESLint then blocks it everywhere already); the unit test pins
 * that.
 *
 * @type {readonly string[]}
 */
export const RATCHETED_RULES = Object.freeze([
  'handsontable/no-fixed-sleep-in-spec',
  'handsontable/no-new-it-flaky',
  'handsontable/no-skipped-test',
]);

/**
 * Where the ratcheted rules apply: the `*.unit.js` / `*.spec.js` override in
 * `handsontable/.eslintrc.js`, plus the TypeScript unit tests that share the
 * same trees. Restricted to `src/` and `test/` — the two trees the package's
 * `lint:eslint` task covers — so the local run stays a subset of CI's lint
 * scope (`dist/` and `tmp/` are build output and never linted). The Playwright
 * tier (`tests/e2e/*.spec.ts`) is deliberately absent: its own config bans
 * `sleep()` / `waitForTimeout()` at `error`, so there is nothing to ratchet.
 *
 * @type {readonly RegExp[]}
 */
export const RATCHETED_FILES = Object.freeze([
  /^handsontable\/(src|test)\/.*\.(spec|unit)\.js$/,
  /^handsontable\/(src|test)\/.*\.unit\.ts$/,
]);

/**
 * Keep the changed paths the ratchet applies to.
 *
 * @param {string[]} changed Repo-relative changed paths.
 * @returns {string[]} The subset the ratcheted rules apply to.
 */
export function selectRatchetedFiles(changed) {
  return changed.filter(file => RATCHETED_FILES.some(pattern => pattern.test(file)));
}

/**
 * Undo git's C-style path quoting (`"b/odd\tname"`): surrounding quotes,
 * `\\`, `\"`, `\t`, `\n`, `\r` and octal escapes.
 *
 * @param {string} p A path as printed in a `+++` header.
 * @returns {string} The unquoted path.
 */
function unquotePath(p) {
  if (!p.startsWith('"') || !p.endsWith('"')) {
    return p;
  }

  return p.slice(1, -1).replace(/\\([0-7]{3}|[\\"tnr])/g, (_, esc) => {
    switch (esc) {
      case 't': return '\t';
      case 'n': return '\n';
      case 'r': return '\r';
      case '"': return '"';
      case '\\': return '\\';
      default: return String.fromCharCode(parseInt(esc, 8));
    }
  });
}

/**
 * The new-side path of a `+++` header, or null for `/dev/null` (a deletion).
 * Expects git's default `b/` prefix — the CLI passes `--dst-prefix=b/` so a
 * user's `diff.noprefix` / `diff.mnemonicPrefix` cannot change the shape.
 *
 * @param {string} header The full `+++ …` line.
 * @returns {string|null} The repo-relative path, or null.
 */
function newSidePath(header) {
  const target = unquotePath(header.slice('+++ '.length).trim());

  if (target === '/dev/null') {
    return null;
  }

  return target.startsWith('b/') ? target.slice(2) : target;
}

/**
 * Added new-side line numbers per file from a unified diff.
 *
 * Handles `-U0` output (no context), hunks whose count is omitted (`+38 @@`
 * means one line), renames (the hunks land under the NEW path; a pure rename
 * prints no hunk, so nothing is added) and deletions (`+++ /dev/null` is
 * dropped). Header lines are recognized only OUTSIDE a hunk — the hunk's line
 * counts say where it ends — so an added line whose text begins with `++ `
 * (printed as `+++ …`) cannot be mistaken for a file header.
 *
 * @param {string} diffText A unified diff (`git diff -U0 <base> HEAD`).
 * @returns {Map<string, Set<number>>} Repo-relative file → added line numbers.
 */
export function parseAddedLines(diffText) {
  const files = new Map();
  let current = null;
  let newLine = 0;
  let oldLeft = 0;
  let newLeft = 0;

  for (const line of (diffText || '').replace(/\r\n/g, '\n').split('\n')) {
    if (oldLeft > 0 || newLeft > 0) {
      if (line.startsWith('+')) {
        if (current) {
          current.add(newLine);
        }
        newLine += 1;
        newLeft -= 1;
      } else if (line.startsWith('-')) {
        oldLeft -= 1;
      } else if (line.startsWith('\\')) {
        // "\ No newline at end of file" — a marker, not a line of either side.
      } else {
        // A context line (leading space; tolerate one stripped to empty).
        newLine += 1;
        oldLeft -= 1;
        newLeft -= 1;
      }
      continue;
    }

    if (line.startsWith('+++ ')) {
      const file = newSidePath(line);

      if (file === null) {
        current = null;
      } else {
        current = files.get(file) || new Set();
        files.set(file, current);
      }
      continue;
    }

    const hunk = /^@@ -\d+(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);

    if (hunk) {
      oldLeft = hunk[1] === undefined ? 1 : Number(hunk[1]);
      newLine = Number(hunk[2]);
      newLeft = hunk[3] === undefined ? 1 : Number(hunk[3]);
    }
    // Every other header (diff --git, index, ---, similarity, rename, mode) is inert.
  }

  return files;
}

/**
 * ESLint reports absolute paths; the diff is repo-relative. With `root` given,
 * relativize and normalize to forward slashes; without it, pass the path through.
 *
 * @param {string} filePath ESLint's `filePath`.
 * @param {string|undefined} root The repository root.
 * @returns {string} A repo-relative, forward-slashed path.
 */
function relativize(filePath, root) {
  const relative = root ? path.relative(root, filePath) : filePath;

  return relative.split(path.sep).join('/');
}

/**
 * Intersect ESLint's findings with the added lines: a message from a ratcheted
 * rule whose line the branch added.
 *
 * Severity is not consulted — an `error` from a ratcheted rule is reported too,
 * harmlessly, since ESLint blocks it anyway. A file carrying a fatal message
 * (a parse or config gap) is skipped whole: the gate must never block on
 * tooling it could not run.
 *
 * @param {object[]} results ESLint `--format json` output (parsed).
 * @param {Map<string, Set<number>>} addedLines From `parseAddedLines`.
 * @param {{ rules?: readonly string[], root?: string }} [options] `rules`
 *   narrows the rule set (default `RATCHETED_RULES`); `root` relativizes
 *   ESLint's absolute paths.
 * @returns {{ file: string, line: number, ruleId: string, message: string }[]}
 *   The findings, sorted by file then line.
 */
export function selectRatchetedFindings(results, addedLines, { rules = RATCHETED_RULES, root } = {}) {
  const ruleSet = new Set(rules);
  const findings = [];

  for (const result of Array.isArray(results) ? results : []) {
    const messages = Array.isArray(result?.messages) ? result.messages : [];

    if (typeof result?.filePath !== 'string' || messages.some(m => m?.fatal)) {
      continue;
    }

    const file = relativize(result.filePath, root);
    const added = addedLines.get(file);

    if (!added) {
      continue;
    }

    for (const m of messages) {
      if (m?.ruleId && ruleSet.has(m.ruleId) && added.has(m.line)) {
        findings.push({ file, line: m.line, ruleId: m.ruleId, message: m.message });
      }
    }
  }

  return findings.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : a.line - b.line));
}

/**
 * Render the verdict as GitHub-flavored Markdown, so a workflow step can `tee`
 * it into the step summary and a terminal reads it as-is.
 *
 * @param {{ file: string, line: number, ruleId: string, message: string }[]} findings From `selectRatchetedFindings`.
 * @returns {string} The report.
 */
export function formatReport(findings) {
  if (findings.length === 0) {
    return 'Determinism ratchet: no new sleep() / it.flaky() / skip on the lines this branch added.';
  }

  const lines = [
    '## Determinism ratchet',
    '',
    `❌ ${findings.length} warn-level determinism finding(s) sit on lines this branch **added**. `
      + 'Pre-existing occurrences stay warnings; new ones block. Re-indented or moved lines count as added — '
      + 'a diff cannot tell a move from an addition — so a `sleep()` that only changed position or indentation '
      + 'is the moment to replace it. A renamed file adds nothing on its own.',
    '',
    ...findings.map(f => `- \`${f.file}:${f.line}\` — \`${f.ruleId}\`: ${f.message}`),
    '',
    'Fix: wait for the condition instead of the clock — `await waitUntil(() => …)`, a hook promise, or '
      + '`waitForNextAnimationFrames()` (`handsontable/test/helpers/common.js`). A broken or flaky legacy spec '
      + 'migrates to Playwright (`tests/e2e/`). For a genuine exception, disable the rule on that line with a '
      + 'ticket: `// eslint-disable-next-line <rule> -- <TICKET>: <why no condition exists>`. '
      + 'Rules: `.ai/LOCAL-ENFORCEMENT.md`.',
  ];

  return lines.join('\n');
}
