/**
 * Pure helpers behind the Puppeteer runner's failure report (`run-puppeteer.mjs`).
 *
 * The runner receives every Jasmine result as data through the page bridge, so a failed spec can
 * be named without parsing the log. These helpers turn those results into the three forms CI
 * consumes: a `::error` annotation per failed spec, a Markdown step summary, and a JSON record the
 * flake ledger can aggregate across runs. They also build the `spec=` filter that re-runs one spec
 * file alone, which is how the runner tells an order-dependent failure from one that fails by
 * itself. No I/O in here – the runner owns the page, the files, and the exit code.
 */

/**
 * How many failing spec files the runner re-runs alone after a red run. Each probe reloads the
 * runner page for one file, so the cap bounds the extra time a badly broken branch costs.
 */
export const ISOLATION_PROBE_MAX_FILES = 5;

/**
 * Escape a string for use inside a RegExp source.
 *
 * @param {string} text The text to escape.
 * @returns {string} The escaped text.
 */
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * The repo-relative spec file for a `require.context` key.
 *
 * @param {string} base The context's repo-relative directory, with a trailing slash.
 * @param {string} key The context key, e.g. `./core/alter.spec.js`.
 * @returns {string} The repo-relative path, e.g. `handsontable/test/e2e/core/alter.spec.js`.
 */
export function specFilePath(base, key) {
  return `${base}${key.replace(/^\.\//, '')}`;
}

/**
 * Reduce a Jasmine spec result to the record the report carries.
 *
 * @param {object} result The spec result the bridge reporter delivered.
 * @param {string} result.fullName The suite path and the spec title, space-joined.
 * @param {string} result.description The spec title alone.
 * @param {string|null} [result.filePath] The spec file, when the loader recorded it.
 * @param {{message: string}[]} [result.failedExpectations] The failed expectations.
 * @returns {{fullName: string, description: string, filePath: string|null, messages: string[]}} The record.
 */
export function toFailedSpec(result) {
  return {
    fullName: result.fullName,
    description: result.description,
    filePath: result.filePath ?? null,
    messages: (result.failedExpectations ?? []).map(expectation => String(expectation.message ?? '')),
  };
}

/**
 * The distinct spec files of a set of failed specs, in first-seen order. Specs whose file the
 * loader could not record are left out: nothing can be re-run for them.
 *
 * @param {{filePath: string|null}[]} failedSpecs The failed specs.
 * @returns {string[]} The repo-relative file paths.
 */
export function failedFiles(failedSpecs) {
  return [...new Set(failedSpecs.map(spec => spec.filePath).filter(Boolean))];
}

/**
 * The value of the runner page's `specFile=` query parameter that selects exactly one spec file.
 *
 * `test/e2e/index.js` tests the parameter as a case-insensitive RegExp against every
 * `require.context` key (`./core/alter.spec.js`, `./plugins/filters/__tests__/filters.spec.js`), so
 * the pattern anchors the path below the context directory and escapes it – `alter.spec.js` must
 * not also match `alterRows.spec.js` or `alter.spec.jsx`. It goes in `specFile`, not `spec`:
 * Jasmine's boot reads `spec` as a filter on spec names, and no spec is named like a file path.
 *
 * @param {string} filePath The repo-relative spec file.
 * @returns {string} The RegExp source to pass as `specFile=`.
 */
export function specFileFilter(filePath) {
  const belowContext = filePath
    .replace(/^handsontable\/test\/e2e\//, '')
    .replace(/^handsontable\/src\//, '');

  return `(^|/)${escapeRegExp(belowContext)}$`;
}

/**
 * Escape a value for a GitHub Actions workflow command (`::error ...::<message>`).
 *
 * @param {string} text The text to escape.
 * @returns {string} The escaped text.
 */
function escapeCommandData(text) {
  return text.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}

/**
 * Escape a value for a workflow command property (`title=`, `file=`).
 *
 * @param {string} text The text to escape.
 * @returns {string} The escaped text.
 */
function escapeCommandProperty(text) {
  return escapeCommandData(text).replace(/:/g, '%3A').replace(/,/g, '%2C');
}

/**
 * The `::error` annotation for one failed spec. It names the spec (suite path and title), the leg
 * it failed on, the first failed expectation, and – when the loader recorded it – the spec file,
 * so the annotation is attached to that file on the PR's checks tab.
 *
 * @param {{fullName: string, filePath: string|null, messages: string[]}} spec The failed spec.
 * @param {string} leg The leg label, e.g. `UMD (theme: main)`.
 * @param {string} [verdict] The isolation verdict, when the runner probed this spec's file.
 * @returns {string} One workflow-command line.
 */
export function formatAnnotation(spec, leg, verdict) {
  const properties = [`title=${escapeCommandProperty(`Jasmine spec failed — ${leg}`)}`];

  if (spec.filePath) {
    properties.push(`file=${escapeCommandProperty(spec.filePath)}`);
  }

  const detail = [spec.fullName, spec.messages[0] ?? '(no expectation message)'];

  if (verdict) {
    detail.push(`In isolation: ${verdict}.`);
  }

  return `::error ${properties.join(',')}::${escapeCommandData(detail.join('\n'))}`;
}

/**
 * The `::error` annotation for an uncaught page error. Such an error aborts the whole run, so the
 * failure list of that run is incomplete – the annotation says so.
 *
 * @param {string} message The error, as the page reported it.
 * @param {string} leg The leg label.
 * @returns {string} One workflow-command line.
 */
export function formatPageErrorAnnotation(message, leg) {
  const title = escapeCommandProperty(`Uncaught page error — ${leg}`);
  const detail = `${message}\nThe run was aborted here; the specs after this point did not run.`;

  return `::error title=${title}::${escapeCommandData(detail)}`;
}

/**
 * Describe an isolation probe's outcome in the words the report uses.
 *
 * @param {{failed: number, error?: string}} probe The probe result for one file.
 * @returns {string} `passes alone` when the file's specs all passed by themselves, otherwise why not.
 */
export function describeVerdict(probe) {
  if (probe.error) {
    return `could not be probed (${probe.error})`;
  }

  return probe.failed === 0 ? 'passes alone' : `fails alone (${probe.failed} failed)`;
}

/**
 * The Markdown block appended to the job's step summary after a red run.
 *
 * @param {{fullName: string, filePath: string|null, messages: string[]}[]} failedSpecs The failed specs.
 * @param {string} leg The leg label.
 * @param {Map<string, {failed: number, error?: string}>} probes Isolation results keyed by spec file.
 * @param {number} skippedFiles How many failing files were not probed because of the cap.
 * @returns {string} The Markdown.
 */
export function renderSummary(failedSpecs, leg, probes, skippedFiles = 0) {
  const lines = [`## Jasmine failures — ${leg}`, ''];

  for (const spec of failedSpecs) {
    const where = spec.filePath ? ` (\`${spec.filePath}\`)` : '';
    const verdict = spec.filePath && probes.has(spec.filePath)
      ? ` — in isolation: ${describeVerdict(probes.get(spec.filePath))}`
      : '';

    lines.push(`- **${spec.fullName}**${where}${verdict}`);

    for (const message of spec.messages) {
      lines.push(`  - ${message.split('\n')[0]}`);
    }
  }

  if (probes.size > 0) {
    lines.push('', 'A file that **passes alone** failed because of the specs that ran before it '
      + '(shared state, a leaked timer, an unrestored global); one that **fails alone** is broken on '
      + 'its own. Re-run a single file locally against the same dump with '
      + '`npm run test:e2e.puppeteer -- --specFile=<path-pattern>`.');
  }

  if (skippedFiles > 0) {
    lines.push('', `_${skippedFiles} more failing file(s) were not re-run alone – the probe stops after `
      + `${ISOLATION_PROBE_MAX_FILES} files._`);
  }

  return `${lines.join('\n')}\n`;
}

/**
 * The JSON record written beside the run, for the flake ledger to collect across runs.
 *
 * @param {object} context Where the run happened.
 * @param {string} context.leg The leg label.
 * @param {string} context.theme The theme the leg ran.
 * @param {string} context.runId The dump's run id (the runner HTML's suffix).
 * @param {{fullName: string, description: string, filePath: string|null, messages: string[]}[]} failedSpecs The failed specs.
 * @param {Map<string, {failed: number, error?: string}>} probes Isolation results keyed by spec file.
 * @returns {object} The record.
 */
export function toRecord(context, failedSpecs, probes) {
  return {
    leg: context.leg,
    theme: context.theme,
    runId: context.runId,
    failed: failedSpecs.map(spec => ({
      ...spec,
      isolation: spec.filePath && probes.has(spec.filePath) ? describeVerdict(probes.get(spec.filePath)) : null,
    })),
  };
}
