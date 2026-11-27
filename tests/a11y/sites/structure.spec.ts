import { test, type Browser } from '@playwright/test';
import { SITE_CHECKS, siteCheckId, siteOf } from '../../lib/a11y-site-checks.mjs';
import { aliasOf, consistencyFindings, duplicateTitleFindings, isListingPage, linksInMain, navigationTargets, pageFindings, pageKey,
  pathKey, waysFindings } from '../../lib/site-structure.mjs';
import { attachEvidence, readEnvironment } from '../evidence';
import { declareSiteTarget } from './harness';
import { readStructure, type StructureRead } from './structure-read';
import { siteDefinition, type SitePage } from './sites';

/**
 * Page structure, titles, and consistency on a site (`<site>-structure`): 1.3.1, 2.4.1, 2.4.2, 2.4.4 (advisory),
 * 2.4.5, 2.4.6, 3.1.1, 3.2.3, 3.2.4 and 3.2.6, on every page of the site at rest, in the light scheme (a color
 * scheme changes no heading, landmark or link). The verdicts are `lib/site-structure.mjs`.
 *
 * - Each page is read once, as the accessibility tree exposes it (`structure-read.ts`), without waiting for its
 *   examples: the structure is the served page's.
 * - 2.4.2's duplicates are judged against the title of every page of the site, read once per worker from the start
 *   of each page's HTML (`siteTitles()`); 2.4.5's search, once per worker from the page that holds it
 *   (`siteSearch()`). A search that could not be read is a problem of the reference page, and no page evaluates
 *   2.4.5 that run. The site map's links are read once per worker the same way (`siteMapLinks()`), and a
 *   collection's index (its page and its numbered listing pages) once per worker that reads one of its pages
 *   (`indexLinks()`); the reference page's navigation counts for every page at its viewport. A page whose canonical
 *   is another page the run reads is that page under a second address, judged there.
 * - 3.2.3, 3.2.4 and 3.2.6 compare each page with the site's reference page at the same viewport, read once per
 *   worker; a page at another viewport (the phone header) evaluates none of them.
 *
 * Report-only: a test fails for tooling only. Policy: `tests/AGENTS.md`, "A11y: the site checks beyond axe".
 */

const SITE = siteDefinition(siteOf(process.env.HOT_A11Y_SITE));
const CHECK = siteCheckId(SITE.id, 'structure');
const CRITERIA: string[] = SITE_CHECKS[CHECK].criteria;
const THEME = 'light';
// How many pages' titles a worker reads at once, and how much of each page it reads before giving up on a title.
const TITLE_CONCURRENCY = 8;
const TITLE_BYTES = 64 * 1024;
// How many listing pages of one collection's index a worker reads at most.
const INDEX_PAGES = 100;
// The address of every page the run reads, to tell a canonical that names one of them (`aliasOf()`).
const PAGE_KEYS = new Set(SITE.pages.map(entry => pageKey(entry.path, entry.baseUrl ?? SITE.baseUrl)));
// The site map's own page, which the reference page's navigation must link for the site map to be a way.
const SITE_MAP_PAGE = SITE.siteMap === null ? null : pageKey(SITE.siteMap.page.path, SITE.siteMap.page.baseUrl ?? SITE.baseUrl);

let titles: Promise<Array<{ id: string; path: string; title: string }>> | null = null;
let search: Promise<boolean | null> | null = null;
let siteMap: Promise<Set<string> | false | null> | null = null;
const indexes = new Map<string, Promise<Set<string> | false | null>>();
let reference: Promise<StructureRead> | null = null;
// Whether this worker has reported that its site map read failed: once per worker, on its first page.
let siteMapProblemReported = false;

for (const entry of SITE.pages) {
  test(entry.id, async({ page, browser }, testInfo) => {
    const target = declareSiteTarget(testInfo, entry, THEME, SITE);
    const startedAt = Date.now();
    const pageErrors: string[] = [];

    await SITE.open(page, entry, { theme: THEME, pageErrors, examples: false });

    const read = await readStructure(page, SITE.help);
    const environment = await readEnvironment(page);
    const index = await (titles ??= siteTitles());
    const hasSearch = await (search ??= siteSearch());
    const sameViewport = (entry.viewport ?? 'desktop') === (SITE.reference.viewport ?? 'desktop');
    const compared = !sameViewport ? null : entry.id === SITE.reference.id ? read : await (reference ??= readReference(browser));
    const mapped = await (siteMap ??= siteMapLinks());
    const key = pathKey(read.url);
    const collection = SITE.collections.find(prefix => key !== null && key.startsWith(`${pageKey(prefix, SITE.baseUrl)}/`));
    const listed = collection === undefined ? false : await indexLinksOf(collection);
    // The not-found page is reached by a wrong address, never from the navigation: 2.4.5 does not apply to it, nor to
    // a page that is another under a second address, nor to any page when a way could not be read.
    const alias = aliasOf(read, PAGE_KEYS);
    const applies = (entry.status === undefined || entry.status === 200) && alias === null;
    const ways = !applies || hasSearch === null || mapped === null || listed === null ? null : {
      search: hasSearch,
      navigation: compared === null ? null : navigationTargets(compared),
      siteMap: mapped || null,
      siteMapPage: SITE_MAP_PAGE,
      index: listed || null,
    };
    const findings = [
      ...pageFindings(read, { name: SITE.name, home: entry.id === SITE.home }),
      ...duplicateTitleFindings({ id: entry.id, path: entry.path, title: read.title }, index),
      ...(ways === null ? [] : waysFindings(read, ways)),
      ...(compared === null ? [] : consistencyFindings(read, compared, (href, here) => SITE.normalizeHref(href, here))),
    ];
    const criteria = CRITERIA.filter(id => (ways !== null || id !== '2.4.5') && (compared !== null || !['3.2.3', '3.2.4', '3.2.6'].includes(id)));
    const problems = [
      ...(hasSearch === null && entry.id === SITE.reference.id
        ? [`the site search could not be read from ${SITE.search?.page.baseUrl ?? SITE.baseUrl}${SITE.search?.page.path ?? ''}, so no page evaluated 2.4.5`]
        : []),
      ...(mapped === null && !siteMapProblemReported
        ? [`the site map could not be read from ${SITE.siteMap?.page.baseUrl ?? SITE.baseUrl}${SITE.siteMap?.page.path ?? ''}, so no page of this worker evaluated 2.4.5`]
        : []),
      ...(listed === null && applies ? [`the index of ${collection} could not be read, so the page did not evaluate 2.4.5`] : []),
    ];

    siteMapProblemReported ||= mapped === null;

    await attachEvidence(testInfo, {
      target, startedAt, environment, findings, criteria, problems, pageErrors,
      detail: { read, titles: index.length, search: hasSearch, siteMap: mapped === false || mapped === null ? mapped : mapped.size,
        index: collection ?? null, aliasOf: alias, comparedWith: compared === null ? null : SITE.reference.id },
    });
  });
}

/**
 * Every page's title, read from the start of its HTML (the `<title>` sits in the head), a few pages at a time.
 * A page whose title could not be read is left out: it cannot share a title.
 *
 * @returns The titles.
 */
async function siteTitles(): Promise<Array<{ id: string; path: string; title: string }>> {
  const pending = [...SITE.pages];
  const found: Array<{ id: string; path: string; title: string }> = [];
  const worker = async() => {
    for (let entry = pending.shift(); entry; entry = pending.shift()) {
      const title = await readTitle(`${(entry.baseUrl ?? SITE.baseUrl).replace(/\/+$/, '')}${entry.path}`);

      if (title !== null) {
        found.push({ id: entry.id, path: entry.path, title });
      }
    }
  };

  await Promise.all(Array.from({ length: TITLE_CONCURRENCY }, worker));

  return found;
}

/**
 * A page's title, read from the start of its HTML only.
 *
 * @param url The page.
 * @returns The title, or `null`.
 */
async function readTitle(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { redirect: 'follow' });

    // An error page or a CDN challenge has a title of its own, which is not the page's.
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);

      return null;
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let html = '';

    while (reader && html.length < TITLE_BYTES && !html.includes('</title>')) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }
      html += decoder.decode(value, { stream: true });
    }
    await reader?.cancel().catch(() => undefined);

    const match = /<title[^>]*>([^<]*)<\/title>/i.exec(html);

    return match ? decodeEntities(match[1]).trim() : null;
  } catch {
    return null;
  }
}

/**
 * The few entities a title carries.
 *
 * @param value The raw text.
 * @returns The text.
 */
function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|#39);/gi, (whole, code: string) => {
    const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'' };

    if (code.startsWith('#x') || code.startsWith('#X')) {
      return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    }
    if (code.startsWith('#')) {
      return String.fromCodePoint(Number(code.slice(1)));
    }

    return named[code.toLowerCase()] ?? whole;
  });
}

/**
 * Whether the site has a search: the page that holds it carries its control in its HTML. `null` when that page
 * could not be read (it did not answer, or answered with a challenge page instead of the site).
 *
 * @returns The verdict.
 */
async function siteSearch(): Promise<boolean | null> {
  if (SITE.search === null) {
    return false;
  }

  const entry: SitePage = SITE.search.page;
  const url = `${(entry.baseUrl ?? SITE.baseUrl).replace(/\/+$/, '')}${entry.path}`;

  try {
    const response = await fetch(url, { redirect: 'follow' });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const classes = SITE.search.control.split(',').map(part => part.trim()).flatMap((selector) => {
      const match = /^[a-z]*\.([\w-]+)$/i.exec(selector) ?? /\[([\w-]+)\]$/.exec(selector);

      return match ? [match[1]] : [];
    });

    if (!/<title[^>]*>/i.test(html) || !html.includes(SITE.name.split(' ')[0])) {
      return null;
    }

    return classes.some(name => html.includes(name));
  } catch {
    return null;
  }
}

/**
 * The pages a page's main content links (`linksInMain()`), fetched. `false` for a page that is not there (404), `null`
 * for one that could not be read: it did not answer, or answered with something other than the site (a challenge
 * page, an interstitial), told the way `siteSearch()` tells it.
 *
 * @param url The page.
 * @returns The links.
 */
async function mainLinks(url: string): Promise<Set<string> | false | null> {
  try {
    const response = await fetch(url, { redirect: 'follow' });

    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);

      return response.status === 404 ? false : null;
    }

    const html = await response.text();

    if (!/<title[^>]*>/i.test(html) || !html.includes(SITE.name.split(' ')[0])) {
      return null;
    }

    return linksInMain(html, response.url);
  } catch {
    return null;
  }
}

/**
 * The pages the site map links; `false` for a site with no site map, or whose site map is not there (404).
 *
 * @returns The links.
 */
async function siteMapLinks(): Promise<Set<string> | false | null> {
  if (SITE.siteMap === null) {
    return false;
  }

  const entry = SITE.siteMap.page;

  return mainLinks(`${(entry.baseUrl ?? SITE.baseUrl).replace(/\/+$/, '')}${entry.path}`);
}

/**
 * The pages a collection's index links, read once per worker: the collection's own page and every numbered listing
 * page (`/blog/2/`) reached from it. `false` for a collection with no index page (404); `null` when a page of the
 * index could not be read, so a page it may list does not lose a way to a fetch that failed.
 *
 * @param prefix The collection (`/blog/`).
 * @returns The links.
 */
function indexLinksOf(prefix: string): Promise<Set<string> | false | null> {
  const known = indexes.get(prefix);

  if (known) {
    return known;
  }

  const read = (async() => {
    const base = SITE.baseUrl.replace(/\/+$/, '');
    const root = pageKey(prefix, SITE.baseUrl) ?? '';
    const basePath = new URL(SITE.baseUrl).pathname.replace(/\/+$/, '');
    const pending = [root];
    const seen = new Set(pending);
    const links = new Set<string>();

    for (let reads = 0; pending.length > 0; reads += 1) {
      // A cap reached with pages still to read is an index read in part: a page it would list loses a way to the cap.
      if (reads === INDEX_PAGES) {
        return null;
      }

      const page = pending.shift() as string;
      const found = await mainLinks(`${base}${page.slice(basePath.length)}/`);

      if (found === false && page === root) {
        return false;
      }
      if (found === false || found === null) {
        return null;
      }
      for (const link of found) {
        links.add(link);
        if (isListingPage(link, root) && !seen.has(link)) {
          seen.add(link);
          pending.push(link);
        }
      }
    }

    return links;
  })();

  indexes.set(prefix, read);

  return read;
}

/**
 * The reference page, read in a context of its own.
 *
 * @param browser The browser.
 * @returns What it reads.
 */
async function readReference(browser: Browser): Promise<StructureRead> {
  const context = await browser.newContext({ colorScheme: THEME, serviceWorkers: 'block' });

  try {
    const page = await context.newPage();

    await SITE.open(page, SITE.reference, { theme: THEME, pageErrors: [], examples: false });

    return await readStructure(page, SITE.help);
  } finally {
    await context.close();
  }
}
