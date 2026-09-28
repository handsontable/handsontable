import type { TestDetails } from '@playwright/test';
import {
  QUARANTINE_ANNOTATION,
  QUARANTINE_TAG,
  describeQuarantine,
  validateQuarantine,
} from '../lib/quarantine-policy.mjs';

/**
 * Parks a known-flaky test: it still runs and still reports, but a flaky verdict
 * (failed, then passed on retry) no longer fails the CI leg until `expires`.
 *
 * ```ts
 * test('keeps the row height', quarantined('DEV-1234', '2026-10-08', 'height read one draw early'), async() => {
 * ```
 *
 * The entry needs the owning task id and an expiry at most 30 days out; a
 * malformed one throws here, when the spec file loads, so it never reaches a
 * run. A failing (not flaky) test is not covered, an expired entry fails the leg
 * again, and at most six tests are quarantined at once — the policy and the
 * reasons are in `tests/AGENTS.md` ("Quarantine"). The frozen Jasmine suite has
 * no quarantine: it migrates instead.
 *
 * @param taskId The ClickUp task that owns the fix, e.g. `DEV-1234`.
 * @param expires The last day the quarantine holds, `YYYY-MM-DD`.
 * @param why One line on what flakes, for the reader of the spec and of the ledger.
 * @returns The test details to pass as `test()`'s second argument.
 */
export function quarantined(taskId: string, expires: string, why?: string): TestDetails {
  const problem = validateQuarantine(taskId, expires, new Date());

  if (problem) {
    throw new Error(`quarantined(${JSON.stringify(taskId)}, ${JSON.stringify(expires)}): ${problem}`);
  }

  return {
    tag: QUARANTINE_TAG,
    annotation: { type: QUARANTINE_ANNOTATION, description: describeQuarantine(taskId, expires, why) },
  };
}
