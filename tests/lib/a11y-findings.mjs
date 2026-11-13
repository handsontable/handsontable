/**
 * The machine-readable findings of the axe scan, for an implementer agent: the pure half.
 *
 * `tests/reporters/a11y.ts` writes `agentFindings()` to
 * `test-results/a11y/a11y-findings.json`, which CI uploads in the `a11y-axe-results`
 * artifact. It is the concise form of the run: what needs action, each with where to
 * open it and the elements it is on (selector, DOM path, box, markup, axe's reason), and
 * every known issue with its locations, one locator and the scan's impact each; how to reach each page's
 * state is listed once, under `pages`. `comparison.json` beside it holds everything, every node of
 * every known finding included, and is many times larger. The shape is documented in
 * `tests/AGENTS.md` ("A11y: the axe scan and its baseline"); `schema` changes when
 * a field is removed or renamed.
 */
import { headline, selectorText, verdictCounts } from './a11y-baseline.mjs';
import { PRODUCT_SUITE, withScannedUrls } from './a11y-suites.mjs';

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
 * @param {object[]} [input.pages] The page list; the suite's when absent.
 * @param {string[]} [input.problems] Tooling problems.
 * @param {object} [input.suite] The scan (`lib/a11y-suites.mjs`); the product scan when absent.
 * @param {object[]} [input.scans] The completed scans, for the URL each one opened.
 * @returns {object} The findings document.
 */
export function agentFindings({ verdict, pages, problems = [], suite: plainSuite = PRODUCT_SUITE, scans = [] }) {
  const suite = withScannedUrls(plainSuite, scans);
  const list = pages ?? suite.pages;
  const pageOf = new Map(list.map(page => [page.id, page]));
  const where = (item) => {
    const page = pageOf.get(item.page);
    const located = page ? suite.locate(page, item.theme) : null;

    return { page: item.page, theme: item.theme, url: located?.path ?? null, steps: located?.steps ?? null };
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
    about: suite.about,
    mode: verdict.mode,
    status: verdict.status,
    headline: headline(verdict),
    counts: verdictCounts(verdict),
    problems,
    reproduce: suite.reproduce,
    // The deploy a docs scan read: the findings ledger records the develop staging deploy only, so a dispatch
    // against a preview never stands in for it. The product scan reads fixtures and has none.
    ...(suite.baseUrl ? { baseUrl: suite.baseUrl } : {}),
    // How to reach each page's scanned state. A product location's URL is `fixture` plus `?theme=<theme>` and
    // `query`; a docs location's is `fixture` on the deploy, in the light or dark theme.
    pages: Object.fromEntries(list.map(page => [page.id, suite.pageEntry(page)])),
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
        // One locator per location, the first element's; the steps are in `pages`, once per page. The impact is
        // the one the scan gave the location, which the check run counts (`severityOfImpact()`), so the findings
        // ledger reads a known location at the severity its check run counted it.
        locations: items.map(item => ({
          page: item.page,
          theme: item.theme,
          rule: item.rule,
          target: item.target,
          impact: item.impact ?? null,
          nodes: item.nodes,
          selector: item.details?.[0] ? selectorText(item.details[0].selector) : null,
          domPath: item.details?.[0]?.ancestry ? selectorText(item.details[0].ancestry) : null,
        })),
      };
    }),
  };
}
