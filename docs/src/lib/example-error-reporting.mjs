/**
 * Failure reporting for the docs example runner.
 *
 * The runner catches every example failure so one broken example cannot take the whole page down.
 * Until now that also meant a genuine crash - a Handsontable call that an older browser engine
 * does not support, for instance - produced a console message and nothing else, so no Sentry event
 * ever arrived (HANDSONTABLE-DOCS-20K: a 90-day `message:"toSorted" level:error` search returns
 * nothing even though grids were dying).
 *
 * This module forwards those failures to Sentry while keeping the volume bounded: a reader on a
 * flaky network, or a page whose examples all fail the same way, must not turn into an event storm.
 */

/**
 * Distinct failures forwarded per page load. A page can embed a dozen examples; the first few
 * failures carry all the diagnostic value, and the rest only inflate the event count.
 */
const MAX_REPORTS_PER_PAGE = 3;

/**
 * Returns true when the error is a failed dynamic import: a stale deployment (the browser holds
 * cached HTML pointing at content-hashed chunks that no longer exist), an offline reader, or a
 * blocked request. Browsers word it differently. None of it says anything about our code, so these
 * failures stay out of Sentry.
 *
 * `docs-assistant-bootstrap.ts` carries the same check for its own mount path. It is duplicated
 * here on purpose: importing that module registers listeners and mounts the chat widget.
 */
export function isChunkLoadError(err) {
  if (!(err instanceof TypeError)) {
    return false;
  }

  const message = String(err.message);

  return (
    message.includes('Failed to fetch dynamically imported module') || // Chrome
    message.includes('error loading dynamically imported module') || // Firefox
    message.includes('Importing a module script failed') // Safari
  );
}

/**
 * Returns true for errors Handsontable throws on purpose as developer feedback. They all carry
 * `cause.handsontable`, set by the core `throwWithCause()` helper.
 *
 * The Sentry `beforeSend` hook in `astro.config.mjs` drops these as well, but that hook only runs
 * on deployments built from a branch that has it, so the reporter repeats the check. Presence of
 * the property is the test, matching `beforeSend` - the value is `true` today and may change.
 */
export function isIntentionalHandsontableError(err) {
  const cause = err && typeof err === 'object' ? err.cause : null;

  return !!cause && typeof cause === 'object' && 'handsontable' in cause;
}

/**
 * Returns true for the `HTTP <status>` errors the server-side data examples throw. The docs site
 * serves no `/api/*` backend, so those requests correctly fail here. That is expected on this site,
 * not a product defect.
 */
export function isExpectedDemoHttpError(err) {
  const message = err && typeof err === 'object' ? err.message : err;

  return /^HTTP \d{3}$/.test(String(message ?? ''));
}

/**
 * Builds the message key used for deduplication.
 */
function failureKey(err, context) {
  const message = err && typeof err === 'object' && err.message ? err.message : String(err);

  return `${context.framework}|${context.phase}|${message}`;
}

/**
 * Creates the reporter the example runner uses for caught failures.
 *
 * The returned function never throws and returns the outcome as a string, which is what the unit
 * test asserts on: `'reported'`, or a `'skipped-*'` reason.
 *
 * @param {object} [options] Test seams.
 * @param {() => ({ captureException?: Function } | undefined)} [options.getSentry] Reads the Sentry
 *   global. The docs site loads Sentry through the Loader Script, so `window.Sentry` is a queueing
 *   stub - present as soon as that deferred script runs, absent when an ad blocker or a CSP drops
 *   the CDN request.
 * @param {number} [options.maxReports] Cap on forwarded failures per page load.
 * @returns {(err: unknown, context: { framework: string, phase: string, source?: string }) => string}
 */
export function createExampleErrorReporter({
  getSentry = () => globalThis.Sentry,
  maxReports = MAX_REPORTS_PER_PAGE,
} = {}) {
  const seen = new Set();
  let reports = 0;

  return function reportExampleError(err, context) {
    if (isChunkLoadError(err)) {
      return 'skipped-chunk-load';
    }

    if (isIntentionalHandsontableError(err)) {
      return 'skipped-intentional';
    }

    if (isExpectedDemoHttpError(err)) {
      return 'skipped-demo-http';
    }

    const key = failureKey(err, context);

    if (seen.has(key)) {
      return 'skipped-duplicate';
    }

    seen.add(key);

    if (reports >= maxReports) {
      return 'skipped-limit';
    }

    const sentry = getSentry();

    if (!sentry || typeof sentry.captureException !== 'function') {
      return 'skipped-unavailable';
    }

    reports += 1;

    try {
      sentry.captureException(err, {
        tags: {
          hot_example: context.framework,
          hot_example_phase: context.phase,
        },
        extra: {
          source: context.source,
        },
      });
    } catch {
      return 'skipped-sentry-error';
    }

    return 'reported';
  };
}
