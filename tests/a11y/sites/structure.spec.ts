import { test, type Browser } from '@playwright/test';
import { SITE_CHECKS, siteCheckId, siteOf } from '../../lib/a11y-site-checks.mjs';
import { consistencyFindings, duplicateTitleFindings, pageFindings, waysFindings } from '../../lib/site-structure.mjs';
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
 *   2.4.5 that run.
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

let titles: Promise<Array<{ id: string; path: string; title: string }>> | null = null;
let search: Promise<boolean | null> | null = null;
let reference: Promise<StructureRead> | null = null;

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
    // The not-found page is reached by a wrong address, never from the navigation: 2.4.5 does not apply to it.
    const ways = entry.status !== undefined && entry.status !== 200 ? null : hasSearch;
    const findings = [
      ...pageFindings(read, { name: SITE.name, home: entry.id === SITE.home }),
      ...duplicateTitleFindings({ id: entry.id, path: entry.path, title: read.title }, index),
      ...(ways === null ? [] : waysFindings(read, { search: ways })),
      ...(compared === null ? [] : consistencyFindings(read, compared, (href, here) => SITE.normalizeHref(href, here))),
    ];
    const criteria = CRITERIA.filter(id => (ways !== null || id !== '2.4.5') && (compared !== null || !['3.2.3', '3.2.4', '3.2.6'].includes(id)));
    const problems = hasSearch === null && entry.id === SITE.reference.id
      ? [`the site search could not be read from ${SITE.search.page.baseUrl ?? SITE.baseUrl}${SITE.search.page.path}, so no page evaluated 2.4.5`]
      : [];

    await attachEvidence(testInfo, {
      target, startedAt, environment, findings, criteria, problems, pageErrors,
      detail: { read, titles: index.length, search: hasSearch, comparedWith: compared === null ? null : SITE.reference.id },
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
