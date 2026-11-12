/**
 * Page structure, titles, and consistency on a site: the pure half.
 *
 * `a11y/sites/structure.spec.ts` reads each page of a site from Chromium's accessibility tree: its title and
 * language, its headings and landmarks, its skip links, the links of its navigation landmarks, and the help
 * controls in its header and footer. The verdicts are here, per criterion:
 *
 * - 1.3.1 and 2.4.6: one main heading, no empty heading, no skipped level (advisory), one main landmark, no
 *   two landmarks of one role with one name.
 * - 2.4.1: a skip link whose target exists, or at least a main landmark.
 * - 2.4.2: a title that names the page, not only the site, and that no other page of the site shares.
 * - 2.4.4 (advisory): link names that say nothing on their own ("here", "read more").
 * - 2.4.5: two ways to reach the page: a navigation landmark that links it, and a site search.
 * - 3.1.1: a valid `lang` on the document, agreeing with the main content's own.
 * - 3.2.3, 3.2.4, 3.2.6: against a reference page of the same site, the shared links of the header's and the
 *   footer's navigation in the same order, one name per target, and the help controls in the same order.
 *
 * Policy: `tests/AGENTS.md`, "A11y: the site checks beyond axe". No I/O in here.
 */

// A primary language subtag and its optional subtags (BCP 47, loosely: what a browser accepts as a language), a
// singleton that opens an extension or a private use (`en-US-x-hot`) among them.
const LANGUAGE_TAG = /^[a-z]{2,3}(?:-(?:[a-z0-9]{2,8}|[a-z0-9]))*$/i;
// Link names that say nothing on their own (2.4.4): the purpose comes from the text around them, which a
// person reads; a screen reader's list of links reads the name alone.
const GENERIC_LINK_NAMES = new Set(['here', 'click here', 'read more', 'more', 'learn more', 'link', 'this', 'this page',
  'details', 'more info', 'continue', 'go', 'click', 'see more']);
// Landmark roles that a page may repeat only under different names.
const NAMED_LANDMARKS = new Set(['navigation', 'region', 'complementary', 'search', 'form']);
// Landmarks a page has at most one of at its top level.
const SINGLE_LANDMARKS = new Set(['banner', 'contentinfo']);
const TITLE_SEPARATORS = /\s+[|–—:-]\s+|\s*\|\s*/;

/**
 * Text as a comparison key: lower case, whitespace collapsed, trimmed.
 *
 * @param {unknown} text The text.
 * @returns {string} The key.
 */
export function textKey(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * The findings of one page on its own: its title, its language, its headings, its landmarks, its skip links and
 * its link names.
 *
 * @param {object} page What the spec read.
 * @param {string} page.title The document's title.
 * @param {string|null} page.lang The document's `lang`.
 * @param {string|null} [page.mainLang] The main landmark's own `lang`, when it sets one.
 * @param {Array<{level: number, name: string, inMain: boolean}>} page.headings The exposed headings, in reading order.
 * @param {Array<{role: string, name: string, top: boolean}>} page.landmarks The exposed landmarks; `top` when no other
 *   landmark contains it.
 * @param {Array<{name: string, href: string, targetExists: boolean, targetInMain: boolean}>} page.skipLinks The links
 *   to a fragment of the page that come before the main landmark.
 * @param {Array<{name: string}>} page.links The exposed links.
 * @param {object} site The site.
 * @param {string} site.name The site's name, as its titles carry it (`Handsontable DataGrid`).
 * @param {boolean} [site.home] Whether the page is the site's home, whose title may be the site's name alone.
 * @returns {object[]} The findings.
 */
export function pageFindings(page, { name: siteName, home = false }) {
  return [
    ...titleFindings(page, siteName, home),
    ...languageFindings(page),
    ...headingFindings(page),
    ...landmarkFindings(page),
    ...bypassFindings(page),
    ...linkNameFindings(page),
  ];
}

/**
 * The title findings (2.4.2): no title, a title that is the site's name alone, and, advisory, a title that does
 * not hold the page's main heading.
 *
 * @param {{title: string, headings: Array<{level: number, name: string}>}} page The page.
 * @param {string} siteName The site's name.
 * @param {boolean} home Whether the page is the home page.
 * @returns {object[]} The findings.
 */
function titleFindings(page, siteName, home) {
  const title = textKey(page.title);

  if (title === '') {
    return [{
      kind: 'page-title-missing', criteria: ['2.4.2'], severity: 'serious', selector: 'title',
      measured: { title: '' }, reason: 'The page has no title, so a browser tab and a screen reader name it by its address',
    }];
  }

  const parts = title.split(TITLE_SEPARATORS).map(part => part.trim()).filter(Boolean);
  const own = parts.filter(part => part !== textKey(siteName));

  // The home page may carry the site's name alone: there the site is the page.
  if (own.length === 0 && home) {
    return [];
  }
  if (own.length === 0) {
    return [{
      kind: 'page-title-bare', criteria: ['2.4.2'], severity: 'serious', selector: 'title',
      measured: { title: String(page.title).trim() },
      reason: 'The title names the site and not the page, so every page with it reads the same in a tab or a history list',
    }];
  }

  const h1 = page.headings.find(heading => heading.level === 1);

  if (h1 && textKey(h1.name) !== '' && !title.includes(textKey(h1.name)) && !own.some(part => textKey(h1.name).includes(part))) {
    return [{
      kind: 'page-title-differs-from-heading', criteria: ['2.4.2'], severity: 'advisory', selector: 'title',
      measured: { title: String(page.title).trim(), heading: String(h1.name).trim().slice(0, 80) },
      reason: 'The title does not hold the page\'s main heading; a person checks that it still names the page',
    }];
  }

  return [];
}

/**
 * The language findings (3.1.1): no `lang`, one that is not a language tag, or a main landmark whose own
 * `lang` names another primary language than the document's.
 *
 * @param {{lang: string|null, mainLang?: string|null}} page The page.
 * @returns {object[]} The findings.
 */
function languageFindings(page) {
  const lang = String(page.lang ?? '').trim();

  if (lang === '') {
    return [{ kind: 'page-lang-missing', criteria: ['3.1.1'], severity: 'serious', selector: 'html',
      measured: { lang: '' }, reason: 'The document names no language, so a screen reader reads it in the user\'s default voice' }];
  }
  if (!LANGUAGE_TAG.test(lang)) {
    return [{ kind: 'page-lang-invalid', criteria: ['3.1.1'], severity: 'serious', selector: 'html',
      measured: { lang }, reason: 'The document\'s lang is not a language tag' }];
  }

  const mainLang = String(page.mainLang ?? '').trim();

  if (mainLang !== '' && mainLang.split('-')[0].toLowerCase() !== lang.split('-')[0].toLowerCase()) {
    return [{ kind: 'page-lang-differs-from-content', criteria: ['3.1.1'], severity: 'moderate', selector: 'main',
      measured: { lang, mainLang }, reason: 'The main content names another language than the document' }];
  }

  return [];
}

/**
 * The heading findings (1.3.1, 2.4.6): no main heading, more than one (advisory), an empty heading, and,
 * advisory, a level skipped inside the main landmark.
 *
 * @param {{headings: Array<{level: number, name: string, inMain: boolean}>}} page The page.
 * @returns {object[]} The findings.
 */
function headingFindings(page) {
  const findings = [];
  const h1 = page.headings.filter(heading => heading.level === 1);

  if (h1.length === 0) {
    findings.push({ kind: 'heading-h1-missing', criteria: ['1.3.1', '2.4.6'], severity: 'moderate', selector: 'h1',
      measured: { headings: page.headings.length },
      reason: 'The page has no main heading, so a screen reader user cannot jump to where its content starts' });
  } else if (h1.length > 1) {
    findings.push({ kind: 'heading-h1-multiple', criteria: ['1.3.1'], severity: 'advisory', selector: 'h1',
      measured: { count: h1.length, names: h1.map(heading => String(heading.name).trim().slice(0, 40)).join(' | ') },
      reason: 'The page has more than one main heading; a person checks which one names the page' });
  }

  const empty = page.headings.filter(heading => textKey(heading.name) === '');

  if (empty.length > 0) {
    findings.push({ kind: 'heading-empty', criteria: ['1.3.1', '2.4.6'], severity: 'moderate', selector: `h${empty[0].level}`,
      measured: { count: empty.length, levels: [...new Set(empty.map(heading => heading.level))].join(' ') },
      reason: 'A heading has no text, so a screen reader announces an empty heading in the page\'s outline' });
  }

  const skipped = new Map();
  let previous = null;

  for (const heading of page.headings.filter(item => item.inMain)) {
    if (previous !== null && heading.level > previous + 1) {
      const pair = `h${previous} to h${heading.level}`;

      skipped.set(pair, (skipped.get(pair) ?? 0) + 1);
    }
    previous = heading.level;
  }
  for (const [pair, count] of skipped) {
    findings.push({ kind: 'heading-level-skipped', criteria: ['1.3.1'], severity: 'advisory', step: pair,
      measured: { count }, reason: `The main content's outline goes from ${pair}, skipping a level` });
  }

  return findings;
}

/**
 * The landmark findings (1.3.1): no main landmark, more than one, more than one banner or footer at the top
 * level, and two landmarks of one role a page may repeat under one name (or both without one).
 *
 * @param {{landmarks: Array<{role: string, name: string, top: boolean}>}} page The page.
 * @returns {object[]} The findings.
 */
function landmarkFindings(page) {
  const findings = [];
  const mains = page.landmarks.filter(landmark => landmark.role === 'main');

  if (mains.length === 0) {
    findings.push({ kind: 'landmark-main-missing', criteria: ['1.3.1', '2.4.1'], severity: 'serious', selector: 'main',
      measured: { landmarks: page.landmarks.length }, reason: 'The page has no main landmark, so a screen reader cannot jump to its content' });
  } else if (mains.length > 1) {
    findings.push({ kind: 'landmark-main-multiple', criteria: ['1.3.1'], severity: 'moderate', selector: 'main',
      measured: { count: mains.length }, reason: 'The page has more than one main landmark' });
  }
  for (const role of SINGLE_LANDMARKS) {
    const top = page.landmarks.filter(landmark => landmark.role === role && landmark.top);

    if (top.length > 1) {
      findings.push({ kind: 'landmark-repeated', criteria: ['1.3.1'], severity: 'moderate', selector: `[role="${role}"]`,
        measured: { role, count: top.length }, reason: `The page has ${top.length} ${role} landmarks at its top level` });
    }
  }

  const named = new Map();

  for (const landmark of page.landmarks.filter(item => NAMED_LANDMARKS.has(item.role))) {
    const key = `${landmark.role}|${textKey(landmark.name)}`;

    named.set(key, [...(named.get(key) ?? []), landmark]);
  }
  for (const [key, list] of named) {
    if (list.length > 1) {
      const [role, name] = key.split('|');

      findings.push({ kind: 'landmark-name-repeated', criteria: ['1.3.1'], severity: 'moderate', selector: `[role="${role}"]`,
        step: name === '' ? 'no name' : `"${list[0].name.trim()}"`,
        measured: { role, count: list.length },
        reason: `${list.length} ${role} landmarks share ${name === '' ? 'having no name' : 'one name'}, so a screen reader's landmark list cannot tell them apart` });
    }
  }

  return findings;
}

/**
 * The bypass findings (2.4.1): a skip link whose target does not exist, one whose target sits outside the main
 * content (moderate), and a page with neither a skip link nor a main landmark.
 *
 * @param {{skipLinks: Array<{name: string, href: string, targetExists: boolean, targetInMain: boolean}>, landmarks: Array<{role: string}>}} page The page.
 * @returns {object[]} The findings.
 */
function bypassFindings(page) {
  const findings = [];

  for (const link of page.skipLinks) {
    if (!link.targetExists) {
      findings.push({ kind: 'skip-link-target-missing', criteria: ['2.4.1'], severity: 'serious', selector: `a[href="${link.href}"]`,
        measured: { name: String(link.name).trim().slice(0, 60) }, reason: 'The skip link points at an element the page does not have' });
    } else if (!link.targetInMain) {
      findings.push({ kind: 'skip-link-target-outside-main', criteria: ['2.4.1'], severity: 'moderate', selector: `a[href="${link.href}"]`,
        measured: { name: String(link.name).trim().slice(0, 60) }, reason: 'The skip link points at an element outside the main content' });
    }
  }
  if (page.skipLinks.length === 0 && !page.landmarks.some(landmark => landmark.role === 'main')) {
    findings.push({ kind: 'bypass-missing', criteria: ['2.4.1'], severity: 'serious', selector: 'body',
      measured: { skipLinks: 0 }, reason: 'The page has no skip link and no main landmark, so nothing lets a keyboard user bypass the repeated blocks' });
  }

  return findings;
}

/**
 * The link names that say nothing on their own (2.4.4, advisory): one finding per name, with how many links
 * carry it.
 *
 * @param {{links: Array<{name: string}>}} page The page.
 * @returns {object[]} The findings.
 */
function linkNameFindings(page) {
  const counts = new Map();

  for (const link of page.links) {
    const name = textKey(link.name).replace(/[.:!?»›→…]+$/u, '').trim();

    if (GENERIC_LINK_NAMES.has(name)) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }

  return [...counts].map(([name, count]) => ({
    kind: 'link-name-generic', criteria: ['2.4.4'], severity: 'advisory', step: `"${name}"`,
    measured: { count },
    reason: `${count} link${count === 1 ? ' is' : 's are'} named "${name}", which says nothing out of context; a person checks the text around ${count === 1 ? 'it' : 'them'}`,
  }));
}

/**
 * The 2.4.2 finding of a title other pages of the site share.
 *
 * @param {{id: string, path: string, title: string}} page The page.
 * @param {Array<{id: string, path: string, title: string}>} titles Every page's title, from the site's index.
 * @returns {object[]} The findings.
 */
export function duplicateTitleFindings(page, titles) {
  const key = textKey(page.title);
  // The same address read at another viewport is the same page.
  const others = titles.filter(item => item.id !== page.id && item.path !== page.path && key !== '' && textKey(item.title) === key)
    .map(item => item.id).sort();

  if (others.length === 0) {
    return [];
  }

  return [{
    kind: 'page-title-duplicate', criteria: ['2.4.2'], severity: 'moderate', selector: 'title',
    measured: { title: String(page.title).trim(), shared: others.length, with: others.slice(0, 5).join(' ') },
    reason: `The title is the same as ${others.length} other page${others.length === 1 ? '\'s' : 's\''} of the site, so a tab or a history list cannot tell them apart`,
  }];
}

/**
 * The 2.4.5 finding of a page with fewer than two ways to reach it: a navigation landmark that links it, and a
 * site search.
 *
 * @param {{inNavigation: boolean}} page The page.
 * @param {{search: boolean}} site Whether the site has a search.
 * @returns {object[]} The findings.
 */
export function waysFindings(page, { search }) {
  const ways = [...(page.inNavigation ? ['navigation'] : []), ...(search ? ['search'] : [])];

  if (ways.length >= 2) {
    return [];
  }

  return [{
    kind: 'single-way', criteria: ['2.4.5'], severity: 'moderate', selector: 'body',
    measured: { ways: ways.join(' ') || 'none' },
    reason: `The page can be reached ${ways.length === 0 ? 'no way' : `one way only (${ways[0]})`} from the rest of the site; 2.4.5 asks for two`,
  }];
}

/**
 * The shared names of two lists in each list's order: what 3.2.3 and 3.2.6 compare, since a page may add or
 * leave out an item and keep the order.
 *
 * @param {string[]} a One list.
 * @param {string[]} b The other.
 * @returns {{a: string[], b: string[]}} Each list's items the other also holds, each once, in its order.
 */
function shared(a, b) {
  const inA = new Set(a);
  const inB = new Set(b);
  const once = list => list.filter((item, index) => list.indexOf(item) === index);

  return { a: once(a.filter(item => inB.has(item))), b: once(b.filter(item => inA.has(item))) };
}

/**
 * The consistency findings of a page against its site's reference page (3.2.3, 3.2.4, 3.2.6).
 *
 * - 3.2.3: in each navigation landmark of the header and the footer both pages have (by name), the links both
 *   hold come in the same order. One the reference has and the page lacks is advisory.
 * - 3.2.4: a link of the header or the footer that goes where a reference link in the same landmark goes carries one
 *   of the names the reference gives that target there.
 * - 3.2.6: the help controls both pages have come in the same order.
 *
 * @param {object} page The page.
 * @param {Record<string, string[]>} page.navigation The link names of each header and footer navigation landmark, by its name.
 * @param {Array<{name: string, href: string, region?: string}>} page.chromeLinks The links of the header and the footer,
 *   each with the landmark it sits in.
 * @param {string[]} page.helps The help controls' names, in reading order.
 * @param {string} page.url The page's address, which its links' targets are read from.
 * @param {object} reference The reference page, in the same shape.
 * @param {(href: string, here: string) => string} [normalizeHref] Maps a link's target, on the page at `here`, to the
 *   one it stands for on every page (on the docs, a path into the page's own framework to every framework's).
 * @returns {object[]} The findings.
 */
export function consistencyFindings(page, reference, normalizeHref = href => href) {
  const findings = [];

  for (const [name, links] of Object.entries(reference.navigation)) {
    if (!Object.hasOwn(page.navigation, name)) {
      findings.push({ kind: 'navigation-missing', criteria: ['3.2.3'], severity: 'advisory', selector: `nav "${name}"`,
        measured: { links: links.length }, reason: `The page has no "${name}" navigation, which the site's other pages repeat` });
      continue;
    }

    const order = shared(page.navigation[name].map(textKey), links.map(textKey));
    const at = order.a.findIndex((item, index) => item !== order.b[index]);

    if (at !== -1) {
      findings.push({ kind: 'navigation-order-differs', criteria: ['3.2.3'], severity: 'serious', selector: `nav "${name}"`,
        measured: { position: at + 1, here: order.a[at], reference: order.b[at] },
        reason: `The "${name}" navigation lists its links in another order than on the site's other pages` });
    }
  }

  // A target may carry several names on one page (a logo and a "Guides" link to the same root), so a link passes
  // when the reference has a link to its target under its name.
  const referenceNames = new Map();

  // One control is a target inside one landmark: the framework switcher's tab and the header's section link can both
  // point at the section a page is in and still be two controls. A link to the page it is on (the current framework's
  // tab, the current breadcrumb) points somewhere else on every page, so it identifies nothing across pages.
  const self = (link, url) => normalizeHref(link.href, url) === normalizeHref(url, url);

  for (const link of reference.chromeLinks.filter(item => !self(item, reference.url))) {
    const target = `${link.region ?? ''}|${normalizeHref(link.href, reference.url)}`;

    referenceNames.set(target, [...(referenceNames.get(target) ?? []), textKey(link.name)]);
  }

  const reported = new Set();

  for (const link of page.chromeLinks.filter(item => !self(item, page.url))) {
    const key = `${link.region ?? ''}|${normalizeHref(link.href, page.url)}`;
    const target = normalizeHref(link.href, page.url);
    const expected = referenceNames.get(key);

    if (expected !== undefined && !expected.includes(textKey(link.name)) && !reported.has(key)) {
      reported.add(key);
      findings.push({ kind: 'identification-differs', criteria: ['3.2.4'], severity: 'moderate', selector: `a[href="${target}"]`,
        measured: { here: String(link.name).trim().slice(0, 60), reference: expected.join(' | ').slice(0, 60) },
        reason: 'A link of the header or the footer goes where it goes on the site\'s other pages under another name' });
    }
  }

  const help = shared(page.helps.map(textKey), reference.helps.map(textKey));
  const helpAt = help.a.findIndex((item, index) => item !== help.b[index]);

  if (helpAt !== -1) {
    findings.push({ kind: 'help-order-differs', criteria: ['3.2.6'], severity: 'serious', selector: 'help',
      measured: { position: helpAt + 1, here: help.a[helpAt], reference: help.b[helpAt] },
      reason: 'The help controls come in another order than on the site\'s other pages' });
  }

  const missing = reference.helps.map(textKey).filter(name => !page.helps.map(textKey).includes(name));

  if (missing.length > 0) {
    findings.push({ kind: 'help-missing', criteria: ['3.2.6'], severity: 'advisory', selector: 'help',
      measured: { missing: missing.join(' | ').slice(0, 80) }, reason: 'A help control the site\'s other pages carry is not on this page' });
  }

  return findings;
}
