/**
 * The machine-readable findings of the axe scan, for an implementer agent: the pure half.
 *
 * `tests/reporters/a11y.ts` writes `agentFindings()` to
 * `test-results/a11y/a11y-findings.json`, which CI uploads in the `a11y-axe-results`
 * artifact. It is the concise form of the run: what needs action, each with where to
 * open it and the elements it is on (selector, DOM path, box, markup, axe's reason), and
 * every known issue with its locations, one locator each; how to reach each page's
 * state is listed once, under `pages`. `comparison.json` beside it holds everything, every node of
 * every known finding included, and is many times larger. The shape is documented in
 * `tests/AGENTS.md` ("A11y: the axe scan and its baseline"); `schema` changes when
 * a field is removed or renamed.
 */
import { headline, selectorText, verdictCounts } from './a11y-baseline.mjs';
import { fixtureUrl, stateSteps } from '../a11y/pages.mjs';

export const FINDINGS_SCHEMA = 1;
// How many elements a finding that needs action lists.
const ELEMENTS_LISTED = 10;

/**
 * One element of a finding: what locates it, its markup and axe's reason.
 *
 * @param {object} detail The node detail.
 * @returns {object} The element.
 */
function element(detail) {
  return {
    selector: selectorText(detail.selector),
    domPath: detail.ancestry ? selectorText(detail.ancestry) : null,
    box: detail.box ?? null,
    html: detail.html,
    why: detail.failureSummary || null,
  };
}

/**
 * The concise findings of a run.
 *
 * @param {object} input The run.
 * @param {object} input.verdict What `compareViolations()` returned.
 * @param {object[]} input.pages The page list (`a11y/pages.mjs`).
 * @param {string[]} [input.problems] Tooling problems.
 * @returns {object} The findings document.
 */
export function agentFindings({ verdict, pages, problems = [] }) {
  const pageOf = new Map(pages.map(page => [page.id, page]));
  const where = (item) => {
    const page = pageOf.get(item.page);

    return { page: item.page, theme: item.theme, url: page ? fixtureUrl(page, item.theme) : null, steps: page ? stateSteps(page) : null };
  };
  const action = (status, item) => ({
    status,
    ...where(item),
    rule: item.rule,
    impact: item.impact ?? null,
    wcag: item.wcag ?? [],
    help: item.help ?? null,
    helpUrl: item.helpUrl ?? null,
    target: item.target,
    nodes: item.nodes,
    recordedNodes: item.baselineNodes ?? (status === 'fixed' ? item.nodes : null),
    issue: item.issue ?? null,
    suggestedIssue: item.suggestedIssue ?? null,
    remedy: item.remedy,
    elements: (item.details ?? []).slice(0, ELEMENTS_LISTED).map(element),
  });
  const located = [...verdict.matched, ...verdict.grown, ...verdict.improved];

  return {
    schema: FINDINGS_SCHEMA,
    about: 'Accessibility findings of the axe scan (tests/a11y/). Fix a finding, then change tests/a11y/axe-baseline.json as '
      + 'its remedy says. `url` is relative to the fixture server (http://localhost:8123 by default); `steps` reach the scanned '
      + 'state; `selector` and `domPath` locate the element in the browser\'s developer tools.',
    mode: verdict.mode,
    status: verdict.status,
    headline: headline(verdict),
    counts: verdictCounts(verdict),
    problems,
    reproduce: {
      build: 'npm --prefix handsontable run build:umd && npm --prefix handsontable run build:styles.min '
        + '&& npm --prefix handsontable run build:themes-css.min',
      scan: 'npm --prefix tests run test:a11y',
      outputs: 'tests/test-results/a11y/ (a11y-report.html, a11y-findings.json, summary.md, comparison.json, scans/)',
    },
    // How to reach each page's scanned state; a location's URL is `fixture` plus `?theme=<theme>` and `query`.
    pages: Object.fromEntries(pages.map(page => [page.id, {
      fixture: `/tests/fixtures/demo/${page.fixture}`,
      query: page.query ?? null,
      steps: stateSteps(page),
      surface: page.surface ?? null,
    }])),
    needsAction: [
      ...verdict.newViolations.map(item => action('new', item)),
      ...verdict.grown.map(item => action('grown', item)),
      ...verdict.improved.map(item => action('improved', item)),
      ...verdict.stale.map(item => action('fixed', item)),
    ],
    issues: verdict.issues.map((issue) => {
      const items = located.filter(item => item.issue === issue.id);

      return {
        id: issue.id,
        title: issue.title,
        tracker: issue.tracker ?? null,
        rules: [...new Set(items.map(item => item.rule))].sort(),
        wcag: [...new Set(items.flatMap(item => item.wcag ?? []))].sort(),
        findings: items.length,
        nodes: items.reduce((sum, item) => sum + item.nodes, 0),
        // One locator per location, the first element's; the steps are in `pages`, once per page.
        locations: items.map(item => ({
          page: item.page,
          theme: item.theme,
          rule: item.rule,
          target: item.target,
          nodes: item.nodes,
          selector: item.details?.[0] ? selectorText(item.details[0].selector) : null,
          domPath: item.details?.[0]?.ancestry ? selectorText(item.details[0].ancestry) : null,
        })),
      };
    }),
  };
}
