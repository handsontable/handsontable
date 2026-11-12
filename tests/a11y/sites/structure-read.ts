import { type Page } from '@playwright/test';

/**
 * What the structure check reads of a page, in one evaluation: what `lib/site-structure.mjs` judges. The read
 * keeps what the accessibility tree exposes: an element that does not render, sits under `aria-hidden` or `inert`,
 * or is `hidden` is left out, as a screen reader leaves it out. A name is computed the way the accessible name
 * computation starts (`aria-labelledby`, `aria-label`, the text, an image's `alt`, `title`), which is what a
 * landmark, a heading and a link carry on a static site.
 */
export interface StructureRead {
  url: string;
  title: string;
  lang: string | null;
  mainLang: string | null;
  headings: Array<{ level: number; name: string; inMain: boolean }>;
  landmarks: Array<{ role: string; name: string; top: boolean }>;
  skipLinks: Array<{ name: string; href: string; targetExists: boolean; targetInMain: boolean }>;
  links: Array<{ name: string }>;
  /**
   * The link names of each navigation landmark inside the header or the footer, by the landmark's name.
   */
  navigation: Record<string, string[]>;
  /**
   * The links of the header and the footer, with their targets and the landmark they sit in (the nearest navigation's
   * name, or `banner` or `contentinfo`): one control is compared with the same control on another page.
   */
  chromeLinks: Array<{ name: string; href: string; region: string }>;
  /**
   * The names of the controls in the header and the footer that the site's help pattern matches.
   */
  helps: string[];
  /**
   * Whether a navigation landmark links the page itself.
   */
  inNavigation: boolean;
}

/**
 * Reads a page's structure.
 *
 * @param page The page.
 * @param help The pattern of the site's help controls' names, as source and flags.
 * @returns The read.
 */
export async function readStructure(page: Page, help: RegExp): Promise<StructureRead> {
  return page.evaluate(([helpSource, helpFlags]) => {
    const exposed = (element: Element) => element.checkVisibility({ visibilityProperty: true })
      && !element.closest('[aria-hidden="true"], [inert], [hidden]');
    const text = (value: string | null | undefined) => String(value ?? '').replace(/\s+/g, ' ').trim();
    const nameOf = (element: Element): string => {
      const labelledBy = element.getAttribute('aria-labelledby');

      if (labelledBy) {
        const label = labelledBy.split(/\s+/).map(id => document.getElementById(id)?.textContent ?? '').join(' ');

        if (text(label)) {
          return text(label);
        }
      }
      if (text(element.getAttribute('aria-label'))) {
        return text(element.getAttribute('aria-label'));
      }

      const own = text([...element.childNodes].map((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent;
        }
        if (node instanceof Element && !exposed(node)) {
          return '';
        }
        if (node instanceof HTMLImageElement) {
          return node.alt;
        }
        if (node instanceof Element) {
          return node.getAttribute('aria-label') ?? (node instanceof HTMLElement ? node.innerText : node.textContent);
        }

        return '';
      }).join(' '));

      return own || text(element.getAttribute('title'));
    };
    const roleOf = (element: Element): string | null => {
      const explicit = element.getAttribute('role');

      if (explicit) {
        return explicit.split(/\s+/)[0];
      }

      const tag = element.tagName.toLowerCase();
      const sectioned = element.parentElement?.closest('article, aside, main, nav, section, [role="article"], [role="complementary"], [role="main"], [role="navigation"], [role="region"]');

      if (tag === 'main') {
        return 'main';
      }
      if (tag === 'nav') {
        return 'navigation';
      }
      if (tag === 'aside') {
        return 'complementary';
      }
      if (tag === 'header') {
        return sectioned ? null : 'banner';
      }
      if (tag === 'footer') {
        return sectioned ? null : 'contentinfo';
      }
      if (tag === 'section' || tag === 'form') {
        return nameOf(element) ? (tag === 'section' ? 'region' : 'form') : null;
      }
      if (tag === 'search') {
        return 'search';
      }

      return null;
    };
    const LANDMARKS = new Set(['banner', 'navigation', 'main', 'contentinfo', 'complementary', 'region', 'search', 'form']);
    const main = document.querySelector('main, [role="main"]');
    const landmarkElements = [...document.querySelectorAll('header, nav, main, footer, aside, section, form, search, [role]')]
      .filter(element => LANDMARKS.has(roleOf(element) ?? '') && exposed(element));
    const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]')].filter(exposed).map(element => ({
      level: Number(element.getAttribute('aria-level') ?? element.tagName.slice(1)) || 2,
      name: nameOf(element) || text((element as HTMLElement).innerText),
      inMain: Boolean(main?.contains(element)),
    }));
    const links = [...document.querySelectorAll('a[href]')].filter(exposed);
    const skipLinks = links.filter(link => (link.getAttribute('href') ?? '').startsWith('#') && link.getAttribute('href') !== '#'
      && /skip|jump to|main content/i.test(nameOf(link))
      && (!main || Boolean(main.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_PRECEDING)))
      .map((link) => {
        const id = decodeURIComponent((link.getAttribute('href') ?? '').slice(1));
        const target = document.getElementById(id) ?? document.getElementsByName(id)[0] ?? null;

        return { name: nameOf(link), href: link.getAttribute('href') ?? '', targetExists: Boolean(target),
          targetInMain: Boolean(target && main && (main === target || main.contains(target))) };
      });
    const chrome = landmarkElements.filter(element => ['banner', 'contentinfo'].includes(roleOf(element) ?? ''));
    const inChrome = (element: Element) => chrome.some(region => region.contains(element));
    const navigation: Record<string, string[]> = {};

    for (const nav of landmarkElements.filter(element => roleOf(element) === 'navigation' && inChrome(element))) {
      const name = nameOf(nav) || 'navigation';

      if (!Object.hasOwn(navigation, name)) {
        navigation[name] = [...nav.querySelectorAll('a[href]')].filter(exposed).map(nameOf).filter(Boolean);
      }
    }

    const here = location.pathname.replace(/\/+$/, '');
    const helpPattern = new RegExp(helpSource, helpFlags);

    return {
      url: location.href,
      title: document.title,
      lang: document.documentElement.getAttribute('lang'),
      mainLang: main?.getAttribute('lang') ?? null,
      headings,
      landmarks: landmarkElements.map(element => ({
        role: roleOf(element) ?? '',
        name: nameOf(element),
        top: !landmarkElements.some(other => other !== element && other.contains(element)),
      })),
      skipLinks,
      links: links.map(link => ({ name: nameOf(link) })),
      navigation,
      chromeLinks: links.filter(inChrome).map((link) => {
        const holder = landmarkElements.filter(element => element.contains(link)).at(-1);

        return { name: nameOf(link), href: (link as HTMLAnchorElement).href,
          region: holder ? (roleOf(holder) === 'navigation' ? `nav "${nameOf(holder) || 'navigation'}"` : roleOf(holder) ?? '') : '' };
      }),
      helps: [...document.querySelectorAll('a[href], button, [role="button"]')].filter(element => exposed(element) && inChrome(element))
        .map(nameOf).filter(name => helpPattern.test(name)),
      // A link to this page from a navigation landmark. A link to a place on this page (the table of contents) is
      // not a way to reach it.
      inNavigation: landmarkElements.filter(element => roleOf(element) === 'navigation').some(nav => [...nav.querySelectorAll('a[href]')]
        .some((link) => {
          const target = new URL((link as HTMLAnchorElement).href);

          return target.hash === '' && target.pathname.replace(/\/+$/, '') === here;
        })),
    };
  }, [help.source, help.flags] as const);
}
