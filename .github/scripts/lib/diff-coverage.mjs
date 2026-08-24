/**
 * Changed-line coverage — the coverage floor classifier (DEV-2055 / 86caqbt9u).
 *
 * Given an LCOV report and a unified diff, compute what fraction of the ADDED
 * executable source lines are covered by tests. This is the proportionality
 * signal the presence gate deliberately lacks: presence proves *a* test changed;
 * this proves the changed *lines* are actually exercised. Pure — no git or
 * filesystem access — so it is unit-testable; the CLI wrapper feeds it a diff
 * and an lcov file.
 *
 * Semantics (standard "coverage on new code"): the denominator is added lines
 * that are INSTRUMENTED (executable — present in the lcov DA map); comments,
 * blank lines, and type-only lines are not counted. The CI run instruments all
 * of `src` (`--collectCoverageFrom`), so a changed file that no test exercises
 * still appears in the lcov with its executable lines at hits=0 — i.e. counted
 * as uncovered, not silently skipped.
 */

/**
 * Canonical path key: everything after the last `handsontable/`, without a
 * leading `./`. Normalizes the three shapes that appear — a git-diff path
 * (`handsontable/src/x.ts`), a relative lcov `SF:` path (`src/x.ts`), and an
 * absolute lcov path (`/abs/handsontable/src/x.ts`) — to one comparable key.
 *
 * @param {string} p A file path from a diff or an lcov SF record.
 * @returns {string} The canonical key.
 */
export function canonicalPath(p) {
  const marker = 'handsontable/';
  const i = p.lastIndexOf(marker);

  return (i >= 0 ? p.slice(i + marker.length) : p).replace(/^\.\//, '');
}

/**
 * Parse LCOV into per-file line→hits maps, keyed by canonical path.
 *
 * @param {string} text The lcov.info contents.
 * @returns {Map<string, Map<number, number>>} file → (line number → hit count).
 */
export function parseLcov(text) {
  const files = new Map();
  let current = null;

  for (const line of text.split('\n')) {
    if (line.startsWith('SF:')) {
      current = new Map();
      files.set(canonicalPath(line.slice(3).trim()), current);

    } else if (current && line.startsWith('DA:')) {
      const [ln, hits] = line.slice(3).split(',');

      current.set(Number(ln), Number(hits));

    } else if (line.startsWith('end_of_record')) {
      current = null;
    }
  }

  return files;
}

/**
 * Added new-side line numbers per file from a unified diff, keyed by canonical
 * path. Tracks the new-file line counter through each `@@` hunk header so only
 * genuinely added (`+`) lines are recorded.
 *
 * @param {string} diff A unified diff (e.g. `git diff base...HEAD`).
 * @returns {Map<string, Set<number>>} file → set of added line numbers.
 */
export function addedLinesByFile(diff) {
  const files = new Map();
  let current = null;
  let newLine = 0;

  for (const line of diff.split('\n')) {
    const fileMatch = line.startsWith('+++ ') ? line.match(/^\+\+\+ b\/(.+)$/) : null;

    if (line.startsWith('+++ ')) {
      if (fileMatch) {
        const key = canonicalPath(fileMatch[1]);

        current = files.get(key) || new Set();
        files.set(key, current);
      } else {
        current = null; // /dev/null (deletion) — nothing to attribute
      }

    } else if (line.startsWith('@@')) {
      const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);

      newLine = hunk ? Number(hunk[1]) : newLine;

    } else if (current) {
      if (line.startsWith('+')) {
        current.add(newLine);
        newLine += 1;

      } else if (line.startsWith(' ')) {
        newLine += 1; // context advances the new-side counter
      }
      // '-' (removed) and '\' (no-newline marker) leave the new-side unchanged
    }
  }

  return files;
}

/**
 * Compute changed-line coverage from a parsed lcov and the added lines.
 *
 * @param {Map<string, Map<number, number>>} lcov From `parseLcov`.
 * @param {Map<string, Set<number>>} addedLines From `addedLinesByFile`.
 * @returns {{ instrumentedAdded: number, coveredAdded: number, pct: number|null,
 *   byFile: {file: string, added: number, instrumented: number, covered: number,
 *   uncovered: number[]}[] }} The coverage summary; `pct` is null when no added
 *   line is instrumented (nothing measurable).
 */
export function computeDiffCoverage(lcov, addedLines) {
  const byFile = [];
  let instrumentedAdded = 0;
  let coveredAdded = 0;

  for (const [file, lines] of addedLines) {
    const cov = lcov.get(file);
    const uncovered = [];
    let instrumented = 0;
    let covered = 0;

    for (const ln of lines) {
      if (cov && cov.has(ln)) {
        instrumented += 1;

        if (cov.get(ln) > 0) {
          covered += 1;
        } else {
          uncovered.push(ln);
        }
      }
    }

    if (instrumented > 0) {
      instrumentedAdded += instrumented;
      coveredAdded += covered;
      byFile.push({ file, added: lines.size, instrumented, covered, uncovered });
    }
  }

  const pct = instrumentedAdded === 0 ? null : (coveredAdded / instrumentedAdded) * 100;

  return { instrumentedAdded, coveredAdded, pct, byFile };
}

/**
 * Evaluate a coverage summary against a floor.
 *
 * @param {{pct: number|null, instrumentedAdded: number}} summary From `computeDiffCoverage`.
 * @param {number} threshold The minimum percent of added instrumented lines that must be covered.
 * @returns {{pass: boolean, pct: number|null, threshold: number, reason: string}} The verdict.
 */
export function evaluate({ pct, instrumentedAdded }, threshold) {
  if (pct === null) {
    return { pass: true, pct: null, threshold, reason: 'no-instrumented-added-lines' };
  }

  return {
    pass: pct >= threshold,
    pct,
    threshold,
    instrumentedAdded,
    reason: pct >= threshold ? 'ok' : 'below-floor',
  };
}
