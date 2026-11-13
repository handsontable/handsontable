/**
 * Checks the inputs of an accessibility nightly dispatch before the build spends a runner
 * (`dispatchSubset()` of `lib/a11y-dispatch.mjs`): a subset on develop, where the dispatch is the audit
 * and runs everything, and an entry of `checks`, `projects` or `groups` that is not a whole known name
 * are refused here, with the reason as an error annotation, so no lane is skipped on a space the lane's
 * whole-name match cannot trim while the verdict still expects it.
 *
 * Run by the `check-inputs` job of `.github/workflows/a11y-nightly.yml` (`--suite`, `--checks`),
 * `screenreader-nightly.yml` (`--projects`, `--groups`) and `docs-a11y.yml` (`--site docs --site-checks`); the
 * `verdict` job reads the same inputs through the same function, so both ends of the run read them one way.
 *
 * Arguments: `--ref <github.ref>` and the inputs as dispatched, `--suite`, `--checks`, `--projects`, `--groups`,
 * and a site workflow's `--site` with its `checks` input as `--site-checks` (an empty value is no input). Prints
 * what the run covers, one line per axis.
 */
import { parseArgs } from 'node:util';
import { dispatchSubset } from '../lib/a11y-dispatch.mjs';

const { values } = parseArgs({
  options: {
    ref: { type: 'string' },
    suite: { type: 'string' },
    checks: { type: 'string' },
    projects: { type: 'string' },
    groups: { type: 'string' },
    site: { type: 'string' },
    'site-checks': { type: 'string' },
  },
});

let dispatch;

try {
  dispatch = dispatchSubset({ ...values, siteChecks: values['site-checks'] });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);

  process.stdout.write(`::error title=Dispatch inputs::${message}\n`);
  process.stderr.write(`a11y-dispatch-inputs: ${message}\n`);
  process.exit(1);
}

const every = list => (list === null ? 'every one' : list.join(', '));

process.stdout.write(`a11y-dispatch-inputs: ${dispatch.subset ? 'a subset dispatch' : 'no subset'} on ${values.ref ?? 'an unknown ref'}\n`);
if (values.suite !== undefined || values.checks !== undefined) {
  process.stdout.write(`a11y-dispatch-inputs: checks beyond axe: ${dispatch.checks.join(', ')}\n`);
}
if (dispatch.siteChecks !== undefined) {
  process.stdout.write(`a11y-dispatch-inputs: ${values.site} site checks: ${dispatch.siteChecks.join(', ')}\n`);
}
if (values.projects !== undefined || values.groups !== undefined) {
  process.stdout.write(`a11y-dispatch-inputs: reader projects: ${every(dispatch.projects)}; scenario groups: ${every(dispatch.groups)}\n`);
}
