/**
 * What a dispatch of an accessibility nightly asked for, read once and the same way by the
 * `check-inputs` job before the build (`scripts/a11y-dispatch-inputs.mjs`) and by the `verdict` job after
 * the scans and lanes (`scripts/a11y-run-verdict.mjs`). Two rules (`tests/AGENTS.md`, "A11y: the audit
 * and the proof runs"):
 *
 * - On develop the dispatch is the audit, and the audit runs everything (on `Docs a11y`, every docs site check). `test-health.yml` collects a
 *   develop dispatch as a night, and the test-health page draws the latest night of each source, so a
 *   night of a subset would show the checks or lanes it skipped as gone and draw a drop in every
 *   cluster's trend. The short suite (`suite=pull-request`) and the `checks`, `projects` and `groups`
 *   inputs are for a proof run on a branch, and are refused on develop; so is a site workflow's `checks` input
 *   (`siteChecks`, the site checks of `site`).
 * - An entry of a subset is a whole known name, exactly (`namedSubset()`): no spaces, no typo. The lanes
 *   match an entry inside `contains(format(',{0},', inputs.projects), ',<name>,')`, which cannot trim.
 */
import { EVIDENCE_CHECKS, checksForSuite } from './a11y-evidence.mjs';
import { siteChecks } from './a11y-site-checks.mjs';
import { namedSubset } from './a11y-subset.mjs';
import { SCENARIO_GROUPS, SCREENREADER_PROJECTS } from './screenreader-matrix.mjs';

/**
 * The ref a dispatch is the audit on.
 */
export const AUDIT_REF = 'refs/heads/develop';

/**
 * The dispatch's inputs, resolved: the checks the A11y nightly runs (the named subset, otherwise the
 * suite's), the reader projects and scenario groups the screen reader nightly runs (`null` for every
 * one), and whether any input narrowed the run.
 *
 * @param {object} dispatch The dispatch.
 * @param {string} [dispatch.ref] `github.ref`, the ref the workflow was dispatched on.
 * @param {string} [dispatch.suite] The `suite` input of the A11y nightly (`nightly` or `pull-request`).
 * @param {string} [dispatch.checks] The `checks` input of the A11y nightly, as dispatched.
 * @param {string} [dispatch.projects] The `projects` input of the screen reader nightly, as dispatched.
 * @param {string} [dispatch.groups] The `groups` input of the screen reader nightly, as dispatched.
 * @param {string} [dispatch.site] The site of a site workflow (`Docs a11y`: `docs`), whose `checks` input is `siteChecks`.
 * @param {string} [dispatch.siteChecks] The `checks` input of a site workflow, as dispatched.
 * @returns {{checks: string[], projects: string[]|null, groups: string[]|null, siteChecks?: string[], subset: boolean}} What runs:
 *   `siteChecks`, on a site workflow's dispatch only, is the site's checks (every one without the input).
 * @throws {Error} On a subset dispatched on develop, or an entry that is not a whole known name.
 */
export function dispatchSubset({ ref, suite, checks, projects, groups, site, siteChecks: siteInput } = {}) {
  const short = suite === 'pull-request';
  const ofSite = site ? Object.keys(siteChecks(site)) : [];
  const named = {
    checks: namedSubset(checks, Object.keys(EVIDENCE_CHECKS), { label: 'A11Y_CHECKS', noun: 'check' }),
    projects: namedSubset(projects, SCREENREADER_PROJECTS, { label: 'projects', noun: 'project' }),
    groups: namedSubset(groups, SCENARIO_GROUPS, { label: 'groups', noun: 'group' }),
    siteChecks: site ? namedSubset(siteInput, ofSite, { label: 'checks', noun: `${site} site check` }) : null,
  };
  const narrowed = [
    ...(short ? ['suite=pull-request'] : []),
    ...Object.entries(named).filter(([, value]) => value !== null)
      .map(([input, value]) => `${input === 'siteChecks' ? 'checks' : input}=${value.join(',')}`),
  ];

  if (ref === AUDIT_REF && narrowed.length > 0) {
    throw new Error(`a dispatch on develop is the audit, which runs every check and every lane; ${narrowed.join(' and ')} `
      + 'is for a proof run on a branch (tests/AGENTS.md, "A11y: the audit and the proof runs").');
  }

  return {
    checks: named.checks ?? checksForSuite(suite),
    projects: named.projects,
    groups: named.groups,
    // Only a site workflow's dispatch has site checks.
    ...(site ? { siteChecks: named.siteChecks ?? ofSite } : {}),
    subset: narrowed.length > 0,
  };
}
