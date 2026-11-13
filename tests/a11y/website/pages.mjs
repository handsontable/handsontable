import { pageIdOf } from '../../lib/website-pages.mjs';
import { DEFAULT_WEBSITE_BASE_URL, WEBSITE_THEMES, WEBSITE_VIEWPORTS } from './constants.mjs';

export { DEFAULT_WEBSITE_BASE_URL, WEBSITE_THEMES, WEBSITE_VIEWPORTS };

/**
 * The pages the website scan covers (`tests/a11y/website/website-axe.spec.ts`), on production handsontable.com. Policy:
 * `tests/AGENTS.md`, "A11y: the website scan".
 *
 * A copy of the website repository's own page list (`scripts/axe-pages.mjs` in handsontable/handsontable.com-v3,
 * `AXE_PAGES`), with the same ids, routes, states and viewports, so a finding here and in the website's own scan of its
 * preview build names one page, and the website's baseline seeds this one. The website repository is private, so this
 * repository cannot read the list at run time; `sitemapCoverage()` keeps the copy honest instead: every address
 * production's sitemap lists is a page here, a member of a collection one page of which is here (`COLLECTIONS`), or
 * excluded on purpose (`NOT_SCANNED`), and a run that finds one that is none of them is a tooling failure, so a new page
 * on the site is scanned or excluded in the change that notices it.
 *
 * - Every page the site builds once, the 404 page, and one page of each collection (a post, a customer story, a
 *   solution, a demo of each kind).
 * - The lead flow in the states a visitor reaches: the pricing tabs, the contact form on each tab, its errors and its
 *   thank-you, the trial form's errors and its next steps, and the support call's time, details and confirmation. A form
 *   is never really submitted and a call is never booked: the spec answers both in the browser (`website-site.ts`).
 * - The site chrome open: the mobile menu at the phone width, the mega menu at the desktop width, the Ask AI panel.
 *
 * `id` is the page's name in the baseline; `route` is what the scan opens; `state` is what the spec does before it
 * scans; `viewports` limits a page to one width; `selected` names the tab or the radio a query or a hash must have
 * selected, so a broken `?tab=` fails rather than scanning the default; `status` is an answer other than 200.
 */

const page = (route, extra = {}) => ({
  id: extra.id ?? pageIdOf(route),
  route,
  state: 'none',
  ...extra,
});

export const WEBSITE_PAGES = Object.freeze([
  page('/'),
  page('/about/'),
  page('/brand-assets/'),
  page('/career/'),
  page('/contact/', { selected: ['radio', 'Sales'] }),
  page('/datagrid/'),
  page('/datagrid/demos/'),
  page('/datagrid/features/'),
  page('/demos/'),
  page('/evaluation/'),
  page('/hyperformula/'),
  page('/hyperformula/demos/'),
  page('/hyperformula/features/'),
  page('/knowledge-base/'),
  page('/partners/'),
  page('/pricing/', { selected: ['tab', 'DataGrid'] }),
  page('/privacy/'),
  page('/spreadsheet-viewer/'),
  page('/support/'),
  page('/support-call/'),
  page('/terms/'),
  page('/theme-builder/'),
  // Any unknown address answers with the 404 page and a 404 status.
  page('/this-page-does-not-exist/', { id: 'not-found', status: 404 }),
  // One page of each collection.
  page('/blog/'),
  page('/blog/2/'),
  page('/blog/category/datagrid/'),
  page('/blog/11-best-rich-text-editors/', { id: 'blog-post' }),
  page('/customers/'),
  page('/customers/2/'),
  page('/customers/amcharts/', { id: 'customer-story' }),
  page('/solutions/finance/'),
  page('/solutions/design-systems/'),
  page('/solutions/salesforce/'),
  page('/datagrid/demos/column-filter/', { id: 'datagrid-demo-feature' }),
  page('/datagrid/demos/bulk-data-entry/', { id: 'datagrid-demo-use-case' }),
  page('/datagrid/demos/2048/', { id: 'datagrid-demo-fun' }),
  page('/datagrid/demos/adding-and-removing/'),
  page('/datagrid/demos/ai-classification/'),
  page('/hyperformula/demos/array-formulas/', { id: 'hyperformula-demo-feature' }),
  page('/hyperformula/demos/pricing-model/', { id: 'hyperformula-demo-use-case' }),
  // The lead flow.
  page('/pricing/?tab=hyperformula', { id: 'pricing-hyperformula', selected: ['tab', 'HyperFormula'] }),
  page('/pricing/?tab=bundle', { id: 'pricing-bundle', selected: ['tab', 'Bundle'] }),
  page('/contact/#support', { id: 'contact-support', selected: ['radio', 'Support'] }),
  page('/contact/#general', { id: 'contact-general', selected: ['radio', 'General'] }),
  page('/contact/', { id: 'contact-errors', state: 'form-errors' }),
  page('/contact/', { id: 'contact-sent', state: 'form-sent' }),
  page('/evaluation/', { id: 'evaluation-errors', state: 'form-errors' }),
  page('/evaluation/', { id: 'evaluation-sent', state: 'form-sent' }),
  page('/support-call/', { id: 'support-call-details', state: 'booker-details' }),
  page('/support-call/', { id: 'support-call-booked', state: 'booker-booked' }),
  // The chrome, open.
  page('/', { id: 'mobile-menu', state: 'mobile-menu', viewports: ['phone'] }),
  page('/', { id: 'mega-menu', state: 'mega-menu', viewports: ['desktop'] }),
  page('/support/', { id: 'ask-ai', state: 'ask-ai' }),
].map(entry => Object.freeze(entry)));

export const WEBSITE_PAGE_IDS = WEBSITE_PAGES.map(entry => entry.id);

/**
 * The collections whose pages share a template: one page of each is scanned, and a sitemap address under one is
 * covered by it.
 */
export const COLLECTIONS = Object.freeze(['/blog/', '/customers/', '/solutions/', '/datagrid/demos/', '/hyperformula/demos/']);

/**
 * What the site serves that the scan does not visit, and why, as the website's list has it.
 */
export const NOT_SCANNED = Object.freeze({
  '/playground/': 'staff-only behind Google sign-in, noindex',
  '/llms.txt': 'not HTML',
  '/rss.xml': 'not HTML',
  '/sitemap.xml': 'not HTML',
});

/**
 * The page and viewport pairs the scan reads, as `page|viewport`.
 *
 * @param {readonly object[]} [pages] The pages.
 * @returns {string[]} The pairs.
 */
export function websitePairs(pages = WEBSITE_PAGES) {
  return pages.flatMap(entry => (entry.viewports ?? WEBSITE_THEMES).map(viewport => `${entry.id}|${viewport}`));
}

/**
 * What production's sitemap lists that this page list does not cover: an address that is no page here, under no
 * collection, and not excluded. An empty list means the copy still covers the site.
 *
 * @param {string[]} paths The sitemap's addresses, as paths (`/about/`).
 * @param {readonly object[]} [pages] The pages.
 * @returns {string[]} The uncovered paths.
 */
export function sitemapCoverage(paths, pages = WEBSITE_PAGES) {
  const routes = new Set(pages.map(entry => new URL(entry.route, 'https://x.test').pathname));

  return paths.filter(path => !routes.has(path) && !COLLECTIONS.some(prefix => path.startsWith(prefix)) && !Object.hasOwn(NOT_SCANNED, path));
}

/**
 * The website base URL a run reads: the deploy `WEBSITE_A11Y_BASE_URL` names, or production. A dispatch input lands
 * here, so anything but an https URL (or a local preview over http) is refused before a page loads.
 *
 * @param {string|undefined} value The configured base URL.
 * @returns {string} The base URL, without a trailing slash.
 */
export function websiteBaseUrl(value) {
  if (!value) {
    return DEFAULT_WEBSITE_BASE_URL;
  }

  const url = new URL(value);
  const local = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);

  if (url.protocol !== 'https:' && !local) {
    throw new Error(`WEBSITE_A11Y_BASE_URL must be an https URL (or http://localhost for a local preview), got ${JSON.stringify(value)}`);
  }
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error(`WEBSITE_A11Y_BASE_URL must be a plain origin, with no credentials, path, query or fragment, got ${JSON.stringify(value)}`);
  }

  return url.origin;
}

/**
 * A page's URL under a base URL. The viewport is not part of the URL: the spec sets it before the page loads.
 *
 * @param {{route: string}} entry The page.
 * @param {string} [_viewport] The viewport.
 * @param {string} [baseUrl] The base URL.
 * @returns {string} The URL.
 */
export function websiteUrl(entry, _viewport, baseUrl = DEFAULT_WEBSITE_BASE_URL) {
  return new URL(entry.route, `${baseUrl}/`).href;
}

/**
 * How to reach a page's state by hand, for the findings document.
 */
export const STATE_STEPS = Object.freeze({
  none: 'open the route; every island hydrates on load',
  'form-errors': 'press the submit button of the empty lead form',
  'form-sent': 'fill the lead form and submit it (the scan answers HubSpot in the browser, so nothing is sent)',
  'booker-details': 'pick the first open time; the details form shows',
  'booker-booked': 'pick a time, fill the details and press "Book the call" (the scan answers the booking in the browser, so nothing is booked)',
  'mobile-menu': 'press "Open menu" at the phone width',
  'mega-menu': 'focus the first header menu button and press Enter',
  'ask-ai': 'press "Ask AI"',
});

/**
 * The steps to a page's state, with its width, in words.
 *
 * @param {{state: string}} entry The page.
 * @param {string} [viewport] The viewport.
 * @returns {string} The steps.
 */
export function websiteStateSteps(entry, viewport) {
  const size = viewport ? `make the window ${WEBSITE_VIEWPORTS[viewport].width} by ${WEBSITE_VIEWPORTS[viewport].height} CSS px, ` : '';

  return `${size}${STATE_STEPS[entry.state]}`;
}
