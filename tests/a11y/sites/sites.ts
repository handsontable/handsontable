import { type Page } from '@playwright/test';
import { DOCS_STATES, openDocsPage, settle as settleDocs } from '../docs/docs-site';
import { DOCS_PAGES, DOCS_THEMES, docsBaseUrl, type DocsPage } from '../docs/pages.mjs';

/**
 * The sites the site checks measure, and how a check opens one of their pages. One definition per site of
 * `SITES` (`lib/a11y-site-checks.mjs`); a check reads only what is here, so a site added later adds its
 * definition and no spec changes. Policy: `tests/AGENTS.md`, "A11y: the site checks beyond axe".
 */

export interface SitePage extends DocsPage {
  /**
   * The deploy the page is read from, when it is not the site's: the docs search exists in production builds
   * only, so its page is read from production.
   */
  baseUrl?: string;
}

/**
 * A popup the site's header opens, measured from the keyboard.
 */
export interface Popup {
  /**
   * The control that opens it.
   */
  trigger: string;
  /**
   * The popup itself, once open.
   */
  container: string;
}

export interface Site {
  id: string;
  /**
   * The site's name as its titles carry it.
   */
  name: string;
  baseUrl: string;
  themes: readonly string[];
  /**
   * Every page: the structure and reflow checks read them all.
   */
  pages: readonly SitePage[];
  /**
   * One page per template and each popup state: the keyboard, focus and forced-colors checks walk these.
   */
  sample: readonly SitePage[];
  /**
   * The page every other page's navigation and help are compared with (3.2.3, 3.2.4, 3.2.6).
   */
  reference: SitePage;
  /**
   * The page whose title may be the site's name alone.
   */
  home: string;
  /**
   * The popup of each state, by the state's name.
   */
  popups: Readonly<Record<string, Popup>>;
  /**
   * Where the site's search is, read once a run (2.4.5): a page and the control that opens the search.
   */
  search: { page: SitePage; control: string };
  /**
   * The names of the help controls in the header and the footer (3.2.6).
   */
  help: RegExp;
  /**
   * The pages whose printable keys are pressed with nothing focused (2.1.4).
   */
  shortcutPages: readonly string[];
  /**
   * The element that marks an embedded example grid: its stops are one region, the grid checks' to judge.
   */
  grid: string;
  /**
   * A link target as it stands on every page of the site (3.2.4), read from the page it is on.
   */
  normalizeHref(href: string, here: string): string;
  /**
   * Opens a page in a color scheme and waits until it can be measured; returns the URL.
   */
  open(page: Page, entry: SitePage, options: { theme: string; pageErrors: string[]; examples?: boolean }): Promise<string>;
  /**
   * Reaches the page's state from the keyboard.
   */
  reach(page: Page, entry: SitePage): Promise<void>;
  /**
   * Waits until the page holds still; returns whether its DOM did.
   */
  settle(page: Page): Promise<boolean>;
}

const DOCS_BASE_URL = docsBaseUrl(process.env.DOCS_A11Y_BASE_URL);
/**
 * The production docs: the only build with search (`SEARCH_BUTTON` in `docs/docs-site.ts`).
 */
export const DOCS_PRODUCTION_URL = 'https://handsontable.com/docs';
const byId = (id: string): SitePage => {
  const entry = DOCS_PAGES.find(item => item.id === id);

  if (!entry) {
    throw new Error(`The docs page list (a11y/docs/pages.mjs) has no page "${id}"; the site checks' sample names it`);
  }

  return entry.requires === 'search' ? { ...entry, baseUrl: DOCS_PRODUCTION_URL } : entry;
};
// One page per template the docs build, each framework's variant once, and the chrome in each state. The API
// template is walked on a plugin's page: the Core page holds thousands of stops, the same template many times over.
const DOCS_SAMPLE = [
  'js-introduction', 'js-rows-sorting', 'js-keyboard-shortcuts', 'js-api-filters', 'js-recipes', 'js-recipe-aria-grid',
  'js-not-found', 'react-accessibility', 'vue-changelog-17', 'js-accessibility-conformance-report', 'chrome-phone',
  'chrome-versions-menu', 'chrome-support-menu', 'chrome-docs-assistant', 'chrome-phone-navigation', 'chrome-search',
].map(byId).concat({
  // The introduction as production builds it: the one build with search, so the one where its keys can be pressed.
  ...byId('js-introduction'), id: 'production-introduction', baseUrl: DOCS_PRODUCTION_URL, requires: 'search',
  surface: 'the introduction on the production docs, the build with search',
});
const FRAMEWORK_PATH = /\/(?:javascript|react|angular|vue)-data-grid(?=\/|$)/;

export const DOCS_SITE: Site = {
  id: 'docs',
  name: 'Handsontable DataGrid',
  baseUrl: DOCS_BASE_URL,
  themes: DOCS_THEMES,
  // The pages at rest; a page that is the same page in a state (a menu open) adds nothing to read.
  pages: DOCS_PAGES.filter(entry => entry.state === 'none'),
  sample: DOCS_SAMPLE,
  reference: byId('js-introduction'),
  home: 'js-introduction',
  popups: {
    'versions-menu': { trigger: '#versions-trigger', container: 'ul.versions-menu' },
    'support-menu': { trigger: '#support-trigger', container: 'ul.support-menu' },
    'docs-assistant': { trigger: '#header-assistant-btn', container: '[role="dialog"]:has(textarea)' },
    'phone-navigation': { trigger: '.mobile-menu-btn', container: '#mobile-nav-overlay' },
    search: { trigger: '.DocSearch-Button', container: '.DocSearch-Modal' },
  },
  search: { page: { ...byId('js-introduction'), baseUrl: DOCS_PRODUCTION_URL }, control: '.DocSearch-Button, button[data-open-modal]' },
  help: /\b(support|help|contact|ask ai|assistant|forum|discussions?)\b/i,
  shortcutPages: ['js-introduction', 'production-introduction'],
  grid: '.ht-root-wrapper, .handsontable',
  // A link into the page's own framework stands for the same place in every framework's pages; a link into
  // another framework (the framework switcher) stays what it is.
  normalizeHref(href, here) {
    try {
      const url = new URL(href, here);
      const own = FRAMEWORK_PATH.exec(new URL(here).pathname)?.[0];
      const path = own && url.pathname.includes(own) ? url.pathname.replace(own, '/<framework>-data-grid') : url.pathname;

      return `${url.origin === new URL(here).origin ? '' : url.origin}${path}`;
    } catch {
      return href;
    }
  },
  async open(page, entry, { theme, pageErrors, examples = true }) {
    const { url } = await openDocsPage(page, entry, { theme, baseUrl: entry.baseUrl ?? DOCS_BASE_URL, pageErrors, examples });

    return url;
  },
  async reach(page, entry) {
    await DOCS_STATES[entry.state](page);
  },
  settle: settleDocs,
};

/**
 * The definition of a site.
 *
 * @param site The site (`HOT_A11Y_SITE`).
 * @returns The definition.
 */
export function siteDefinition(site: string): Site {
  if (site === 'docs') {
    return DOCS_SITE;
  }

  throw new Error(`No site definition for ${JSON.stringify(site)} in a11y/sites/sites.ts`);
}
