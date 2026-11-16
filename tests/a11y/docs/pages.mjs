import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { DEFAULT_DOCS_BASE_URL, DOCS_THEMES } from './constants.mjs';

export { DEFAULT_DOCS_BASE_URL, DOCS_THEMES };

/**
 * The pages the docs site scan covers (`tests/a11y/docs/docs-axe.spec.ts`): every guide page the docs
 * visual suite photographs, the API reference and recipe templates, and the site chrome in the states
 * a reader opens (the version and support menus, the docs assistant, the phone navigation). Each page
 * is scanned in the site's light and dark color schemes (`DOCS_THEMES`), because the contrast findings
 * depend on them. The policy is `tests/AGENTS.md`, "A11y: the docs site scan".
 *
 * - The guide pages come from `docs/tests/paths.js`, the list `docs/tests/visualDocs.spec.ts`
 *   photographs, so a page added there is scanned here with no second list to keep. The visual suite
 *   lists a page once per framework; the scan takes ONE variant per page (JavaScript where the page has
 *   one, else the first framework that lists it), because the chrome and the prose are the same in all
 *   four and only the example code differs. The accessibility pages are the exception: they are what
 *   the conformance report links, so every framework's variant is scanned.
 * - A page is opened at the URL the docs serve it at: the guide's `permalink` when its source file is where
 *   the visual list says (`servedSlug()`), else the list's last path segment. The visual suite builds its
 *   URL from the segment alone, so a guide whose permalink differs is photographed as the not-found page.
 * - `id` is the page's name in the baseline (`docs-baseline.json`): the framework prefix and the slug,
 *   with every character outside `[a-z0-9-]` made a hyphen (`js-migration-from-7-4-to-8-0`).
 * - `path` is the URL path under the docs base URL (`DOCS_BASE_URL`, `/docs` included).
 * - `state` names what the spec does before it scans (`DOCS_STATES` in the spec); `viewport` a viewport
 *   other than the desktop one; `requires` a control the page needs, which only some builds render
 *   (search exists in production builds only, so on a staging deploy that page is skipped and its
 *   baseline entries read as unverified, never as fixed).
 * - `surface` says what the page covers.
 *
 * A `.mjs` file, so the tooling tests read the list under plain `node --test`.
 */

const require = createRequire(import.meta.url);
const { jsPaths, reactPaths, angularPaths, vuePaths } = require('../../../docs/tests/paths.js');
const DOCS_CONTENT = new URL('../../../docs/content/', import.meta.url);
const PERMALINK = /^permalink:\s*\/?([\w.-]+)\/?\s*$/m;

/**
 * The slug a guide is served at: its source file's `permalink`, or the visual list's last path segment when
 * the file is not where the list says.
 *
 * @param {string} listPath The visual list's path (`guides/<section>/<folder>/<file>`).
 * @returns {string} The slug.
 */
export function servedSlug(listPath) {
  const file = ['.md', '.mdx'].map(extension => new URL(`${listPath}${extension}`, DOCS_CONTENT)).find(url => existsSync(url));
  const permalink = file ? PERMALINK.exec(readFileSync(file, 'utf8'))?.[1] : undefined;

  return permalink ?? listPath.split('/').pop();
}

export const DOCS_FRAMEWORKS = [
  { prefix: 'js', name: 'JavaScript', urlPath: 'javascript-data-grid', paths: jsPaths },
  { prefix: 'react', name: 'React', urlPath: 'react-data-grid', paths: reactPaths },
  { prefix: 'angular', name: 'Angular', urlPath: 'angular-data-grid', paths: angularPaths },
  { prefix: 'vue', name: 'Vue', urlPath: 'vue-data-grid', paths: vuePaths },
];
/**
 * The guide pages scanned in every framework: the accessibility guide and the conformance report,
 * which the README and the website link per framework.
 */
export const ALL_FRAMEWORK_SLUGS = ['accessibility', 'accessibility-conformance-report'];
export const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
export const PHONE_VIEWPORT = { width: 390, height: 844 };

/**
 * A slug as a page id part: lower case, every character outside `[a-z0-9-]` a hyphen.
 *
 * @param {string} slug The slug.
 * @returns {string} The id part.
 */
export function idPart(slug) {
  return slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
}

/**
 * The URL path of a guide page in a framework, the way `visualDocs.spec.ts` builds it: the
 * introduction is the framework's root.
 *
 * @param {{urlPath: string}} framework The framework.
 * @param {string} slug The slug.
 * @returns {string} The path, with its trailing slash.
 */
function guidePath(framework, slug) {
  return slug === 'introduction' ? `/${framework.urlPath}/` : `/${framework.urlPath}/${slug}/`;
}

/**
 * The guide pages, one variant each, every framework for `ALL_FRAMEWORK_SLUGS`, in the order the
 * visual list has them (JavaScript's pages first, then each framework's own).
 *
 * @param {typeof DOCS_FRAMEWORKS} frameworks The frameworks with their page lists.
 * @returns {object[]} The pages.
 */
export function guidePages(frameworks = DOCS_FRAMEWORKS) {
  const pages = [];
  const taken = new Set();
  const add = (framework, slug) => {
    const id = `${framework.prefix}-${idPart(slug)}`;

    if (!taken.has(id)) {
      taken.add(id);
      pages.push({ id, path: guidePath(framework, slug), state: 'none',
        surface: `the ${slug} guide, ${framework.name} variant` });
    }
  };
  const seen = new Set();

  for (const framework of frameworks) {
    for (const { path } of framework.paths) {
      const slug = path.split('/').pop() === 'introduction' ? 'introduction' : servedSlug(path);

      if (ALL_FRAMEWORK_SLUGS.includes(slug)) {
        continue;
      }
      if (!seen.has(slug)) {
        seen.add(slug);
        add(framework, slug);
      }
    }
  }
  for (const slug of ALL_FRAMEWORK_SLUGS) {
    for (const framework of frameworks) {
      add(framework, slug);
    }
  }

  return pages;
}

/**
 * The pages the visual list does not hold: a template of each kind it leaves out, and the chrome in
 * the states a reader opens it in.
 */
export const EXTRA_PAGES = [
  { id: 'js-api-core', path: '/javascript-data-grid/api/core/', state: 'none',
    surface: 'the API reference template: the Core page, its member list and signatures' },
  { id: 'js-api-filters', path: '/javascript-data-grid/api/filters/', state: 'none',
    surface: 'the API reference template of a plugin page' },
  { id: 'js-recipes', path: '/javascript-data-grid/recipes/', state: 'none',
    surface: 'the recipes index' },
  { id: 'js-recipe-aria-grid', path: '/javascript-data-grid/recipes/accessibility/aria-grid/', state: 'none',
    surface: 'the ARIA grid recipe, with its example' },
  { id: 'js-recipe-keyboard-shortcuts', path: '/javascript-data-grid/recipes/accessibility/keyboard-shortcuts/', state: 'none',
    surface: 'the keyboard shortcuts recipe, with its example' },
  { id: 'js-not-found', path: '/javascript-data-grid/this-page-does-not-exist/', state: 'none', status: 404,
    surface: 'the not-found page' },
  { id: 'chrome-versions-menu', path: '/javascript-data-grid/', state: 'versions-menu',
    surface: 'the version menu, opened from the keyboard' },
  { id: 'chrome-support-menu', path: '/javascript-data-grid/', state: 'support-menu',
    surface: 'the support menu, opened from the keyboard' },
  { id: 'chrome-docs-assistant', path: '/javascript-data-grid/', state: 'docs-assistant',
    surface: 'the docs assistant panel, opened from the keyboard, before a question is asked' },
  { id: 'chrome-search', path: '/javascript-data-grid/', state: 'search', requires: 'search',
    surface: 'the search dialog, opened from the keyboard (production builds only)' },
  { id: 'chrome-phone', path: '/javascript-data-grid/', state: 'none', viewport: 'phone',
    surface: 'the introduction at 390 px: the phone header and its controls' },
  { id: 'chrome-phone-navigation', path: '/javascript-data-grid/', state: 'phone-navigation', viewport: 'phone',
    surface: 'the phone navigation overlay, opened from the keyboard' },
];

export const DOCS_PAGES = [...guidePages(), ...EXTRA_PAGES];

/**
 * The docs base URL a run reads: the deploy `DOCS_A11Y_BASE_URL` names, or the develop staging deploy. A
 * dispatch input lands here, so anything but an https URL (or a local preview over http) is refused before a
 * page loads.
 *
 * @param {string|undefined} value The configured base URL.
 * @returns {string} The base URL, without a trailing slash.
 */
export function docsBaseUrl(value) {
  if (!value) {
    return DEFAULT_DOCS_BASE_URL;
  }

  const url = new URL(value);
  const local = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);

  if (url.protocol !== 'https:' && !local) {
    throw new Error(`DOCS_A11Y_BASE_URL must be an https URL (or http://localhost for a local preview), got ${JSON.stringify(value)}`);
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error(`DOCS_A11Y_BASE_URL must be a plain deploy URL, with no credentials, query or fragment, got ${JSON.stringify(value)}`);
  }

  return url.href.replace(/\/+$/, '');
}

/**
 * A page's URL under a base URL, in a color scheme. The scheme is not part of the URL: the spec sets
 * it before the page loads. It stays in the signature so the report and the findings locate a scan
 * the way they locate a product one.
 *
 * @param {{path: string}} page The page.
 * @param {string} [_theme] The color scheme.
 * @param {string} [baseUrl] The docs base URL.
 * @returns {string} The URL.
 */
export function docsUrl(page, _theme, baseUrl = DEFAULT_DOCS_BASE_URL) {
  return `${baseUrl.replace(/\/+$/, '')}${page.path}`;
}

/**
 * How to reach the state a page is scanned in, in words, for a person or an agent who opens it by hand.
 *
 * @param {{state: string, viewport?: string}} page The page.
 * @param {string} [theme] The color scheme.
 * @returns {string} The steps.
 */
export function docsStateSteps(page, theme) {
  const scheme = theme ? `pick the ${theme} theme in the header's theme select, ` : '';
  const size = page.viewport === 'phone' ? `make the window ${PHONE_VIEWPORT.width} by ${PHONE_VIEWPORT.height} CSS px, ` : '';
  const steps = {
    none: 'wait for the examples to finish loading',
    'versions-menu': 'focus the version button in the header (#versions-trigger) and press Enter',
    'support-menu': 'focus the support button in the header (#support-trigger) and press Enter',
    'docs-assistant': 'focus the "Ask AI" button in the header (#header-assistant-btn) and press Enter',
    search: 'focus the search button in the header and press Enter',
    'phone-navigation': 'focus the "Open navigation menu" button and press Enter',
  }[page.state];

  return `${size}${scheme}${steps}`;
}
