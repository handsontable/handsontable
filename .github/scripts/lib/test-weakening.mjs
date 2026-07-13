/**
 * Test-weakening detector — the mechanical counterpart to "green is not the goal".
 *
 * The presence gate proves a test exists; the hooks prove it passes; the ESLint
 * guards catch focused/skipped/assertion-free tests at author time. This detector
 * catches the subtler gaming move: quietly *weakening an existing spec* to reach
 * green — dropping assertions, or adding a skip/focus — especially in the same
 * change that touches source.
 *
 * It is intentionally heuristic and text-based (regex over before/after content),
 * so it is a strong SIGNAL to surface (warn), not a proof. It never inspects intent
 * — a reviewer/agent still decides whether a reduction was legitimate (e.g. a real
 * refactor that merged two assertions).
 */

/**
 * Count assertion calls (`expect(` and common assertion-helper names) in a source string.
 *
 * @param {string} src The spec file contents.
 * @returns {number} The number of assertion-like calls.
 */
export function countAssertions(src) {
  if (!src) {
    return 0;
  }

  return (src.match(/\b(?:expect|assert|verify)\w*\s*\(/g) || []).length;
}

/**
 * Count focus/skip markers (`it.only`, `describe.skip`, `xit`, `fdescribe`, …) in a source string.
 *
 * @param {string} src The spec file contents.
 * @returns {number} The number of focus/skip markers.
 */
export function countSkipFocus(src) {
  if (!src) {
    return 0;
  }
  const dotForm = src.match(/\b(?:it|test|describe|context)\.(?:skip|only)\s*\(/g) || [];
  const prefixForm = src.match(/\b(?:x(?:it|describe|test)|f(?:it|describe))\s*\(/g) || [];

  return dotForm.length + prefixForm.length;
}

/**
 * Detect weakening of a single spec between two revisions.
 *
 * @param {string} before The spec contents at the base revision.
 * @param {string} after The spec contents at the head revision.
 * @param {{ sourceChanged?: boolean }} [context={}] Extra context; `sourceChanged`
 *   raises the severity from `warn` to `flag` because weakening a test in the same
 *   change that touches source is the classic "make it green" move.
 * @returns {{ findings: {type: string, before: number, after: number}[], severity: 'ok'|'warn'|'flag' }}
 *   The findings and an overall severity.
 */
export function detectWeakening(before, after, context = {}) {
  const findings = [];
  const aBefore = countAssertions(before);
  const aAfter = countAssertions(after);

  if (aAfter < aBefore) {
    findings.push({ type: 'assertions-removed', before: aBefore, after: aAfter });
  }

  const sBefore = countSkipFocus(before);
  const sAfter = countSkipFocus(after);

  if (sAfter > sBefore) {
    findings.push({ type: 'skip-or-focus-added', before: sBefore, after: sAfter });
  }

  let severity = 'ok';

  if (findings.length > 0) {
    severity = context.sourceChanged ? 'flag' : 'warn';
  }

  return { findings, severity };
}
