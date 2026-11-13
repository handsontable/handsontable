import { type CDPSession, type Page, type TestInfo } from '@playwright/test';
import { focusedAx } from '../checks/walker';
import { declareTarget, type EvidenceTarget } from '../evidence';
import { type Site, type SitePage } from './sites';

/**
 * The browser half the site checks share: the target a test declares, the sentinels around a page's content, the
 * stop the focus is on, and the Tab walk. The walk covers the whole document, unlike the grid walker
 * (`a11y/checks/walker.ts`), which brackets a grid's root: on a site the page is the product. An embedded example
 * grid is one region of it (`grid`): its stops are the grid checks' to judge, and a walk that stays in it uses the
 * documented way out. Policy: `tests/AGENTS.md`, "A11y: the site checks beyond axe".
 */

export interface SiteStop {
  /**
   * `page` for an element of the page, `grid` inside an embedded grid, `start` or `end` for a sentinel, `body`
   * when nothing has the focus.
   */
  region: 'page' | 'grid' | 'start' | 'end' | 'body';
  /**
   * Where the element is in the document, as a path: what tells two stops apart within one walk.
   */
  key: string;
  /**
   * What kind of element it is: its tag, first class that is not a build hash, and role attribute.
   */
  shape: string;
  role: string;
  name: string;
  /**
   * Why nobody can see the element, or `null` when it shows.
   */
  hidden: string | null;
  ariaHidden: boolean;
  tabindex: number | null;
  inMain: boolean;
  /**
   * The form control it is, for an input on it (3.2.2): `select`, `checkbox`, `radio`, or `null`.
   */
  control: string | null;
  navigated: boolean;
  dialogOpened: boolean;
  box: { x: number; y: number; width: number; height: number } | null;
}

export const START = 'start';
export const END = 'end';
// How many stops in a row an embedded grid may hold before the walk takes the documented way out of it.
const GRID_STOPS = 60;
const SENTINEL = 'data-a11y-site-sentinel';

/**
 * Declares a site check's target: the page, the color scheme, the state, the variant and the URL.
 *
 * @param testInfo The test.
 * @param entry The page.
 * @param theme The color scheme.
 * @param site The site.
 * @param variant The variant, when the check makes one.
 * @returns The target.
 */
export function declareSiteTarget(testInfo: TestInfo, entry: SitePage, theme: string, site: Site, variant: string | null = null): EvidenceTarget {
  const base = (entry.baseUrl ?? site.baseUrl).replace(/\/+$/, '');
  const address = new URL(`${base}${entry.path}`);
  // A page read from another deploy than the run's (the docs' production introduction, for search) names its origin;
  // the ledger keeps a path only, and tells its rows apart by the page id.
  const target = { page: entry.id, theme, state: entry.state, variant, url: entry.baseUrl ? address.href : address.pathname };

  declareTarget(testInfo, target);

  return target;
}

/**
 * Puts a focusable sentinel before the page's first element and after its last, so a walk knows where the page
 * starts and ends. Fixed and one pixel square: they take no room in the layout.
 *
 * @param page The page.
 */
export async function installSentinels(page: Page): Promise<void> {
  await page.evaluate(([attribute]) => {
    for (const where of ['start', 'end']) {
      if (document.querySelector(`[${attribute}="${where}"]`)) {
        continue;
      }

      const button = document.createElement('button');

      button.type = 'button';
      button.setAttribute(attribute, where);
      button.setAttribute('aria-label', `walk ${where}`);
      // The start is the first stop of tabindex 1, so a walk passes every positive tabindex before the rest, as the
      // browser orders them; at 0 it would come after them, and both walks would reach the other sentinel first.
      if (where === 'start') {
        button.tabIndex = 1;
      }
      button.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;margin:0;padding:0;border:0';
      if (where === 'start') {
        document.body.prepend(button);
      } else {
        document.body.append(button);
      }
    }
  }, [SENTINEL] as const);
}

/**
 * Focuses a sentinel.
 *
 * @param page The page.
 * @param where Which one.
 */
export async function focusSentinel(page: Page, where: 'start' | 'end'): Promise<void> {
  await page.evaluate(([attribute, which]) => (document.querySelector(`[${attribute}="${which}"]`) as HTMLElement | null)?.focus(), [SENTINEL, where] as const);
}

/**
 * The open dialogs a stop is compared with: a `<dialog>` that is open and any visible element with a dialog role.
 *
 * @param page The page.
 * @returns How many are open.
 */
export async function openDialogs(page: Page): Promise<number> {
  return page.evaluate(() => [...document.querySelectorAll('dialog[open], [role="dialog"], [role="alertdialog"], [aria-modal="true"]')]
    .filter(element => !(element as HTMLElement).hidden && element.checkVisibility({ visibilityProperty: true, opacityProperty: true })).length);
}

/**
 * Reads the stop the last key left: where the focused element is, its shape and place in the document, why nobody
 * sees it (no size, one pixel, `visibility` or `opacity`, clipped by an ancestor, outside the page), whether the
 * accessibility tree hides it, and, unless `ax` is false, the role and name Chromium gives it. Two animation frames
 * pass first, so a focus move the page makes in its own handlers has landed.
 *
 * @param page The page.
 * @param cdp The accessibility session.
 * @param options What to read.
 * @param options.grid The selector of an embedded grid.
 * @param options.startUrl The URL the walk started on.
 * @param options.dialogs How many dialogs were open when the walk started.
 * @param options.ax Whether to read the role and name.
 * @returns The stop.
 */
export async function readStop(page: Page, cdp: CDPSession, { grid, startUrl, dialogs, ax = true }: {
  grid: string; startUrl: string; dialogs: number; ax?: boolean;
}): Promise<SiteStop> {
  let dom;

  try {
    dom = await page.evaluate(async([gridSelector, attribute]) => {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      let element = document.activeElement as HTMLElement | null;

      while (element?.shadowRoot?.activeElement) {
        element = element.shadowRoot.activeElement as HTMLElement;
      }

      const open = [...document.querySelectorAll('dialog[open], [role="dialog"], [role="alertdialog"], [aria-modal="true"]')]
        .filter(item => !(item as HTMLElement).hidden && item.checkVisibility({ visibilityProperty: true, opacityProperty: true })).length;
      const base = { url: location.href, open };

      if (!element || element === document.body || element === document.documentElement) {
        return { ...base, region: 'body', key: 'body', shape: 'body', hidden: null, ariaHidden: false, tabindex: null, inMain: false,
          control: null, box: null };
      }

      // Where scrolling cannot bring the element: a fixed layer moved past the viewport (a closed panel slid off
      // screen keeps its controls rendered), or a part of the page past its scroll area.
      const outOfReach = (node: Element, box: DOMRect): string | null => {
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        let fixed = false;

        for (let current: Element | null = node; current && !fixed; current = current.parentElement) {
          fixed = getComputedStyle(current).position === 'fixed';
        }
        if (fixed) {
          return box.right <= 0 || box.bottom <= 0 || box.left >= viewportWidth || box.top >= viewportHeight
            ? 'outside the viewport, in a fixed layer' : null;
        }

        const scroller = document.scrollingElement ?? document.documentElement;

        return box.right + scrollX <= 0 || box.bottom + scrollY <= 0 || box.left + scrollX >= scroller.scrollWidth
          || box.top + scrollY >= scroller.scrollHeight ? 'outside the page' : null;
      };
      const sentinel = element.getAttribute(attribute);
      const path = (node: Element) => {
        const parts: string[] = [];

        for (let current: Element | null = node; current && current !== document.documentElement; current = current.parentElement) {
          const index = current.parentElement ? [...current.parentElement.children].indexOf(current) : 0;

          parts.unshift(`${current.tagName.toLowerCase()}:${index}`);
        }

        return parts.join('>');
      };
      // A class a build generates (Astro's scoped `astro-<hash>`, a hash suffix with a digit in it) and a layout
      // utility (`sl-flex`, `md:sl-hidden`) name no kind of element. An element with no class or role of its own is named inside its nearest ancestor that has a class
      // (`div.copy button`), so a copy button and a panel's suggestion button are two shapes.
      const classOf = (node: Element) => [...node.classList].find(name => !/^astro-|^sl-(?:flex|hidden|block|inline)$|:|-(?=[a-z]*\d)[a-z0-9]{5,}$/.test(name));
      const meaningful = classOf(element);
      const role = element.getAttribute('role');
      const own = `${element.tagName.toLowerCase()}${meaningful ? `.${meaningful}` : ''}${role ? `[role="${role}"]` : ''}`;
      let context = '';

      for (let ancestor = element.parentElement, depth = 0; !meaningful && !role && ancestor && depth < 4; ancestor = ancestor.parentElement, depth++) {
        const name = classOf(ancestor);

        if (name) {
          context = `${ancestor.tagName.toLowerCase()}.${name} `;
          break;
        }
      }

      const shape = `${context}${own}`;
      const rect = element.getBoundingClientRect();
      let hidden: string | null = null;

      if (!element.checkVisibility({ visibilityProperty: true, opacityProperty: true })) {
        hidden = 'not rendered, or hidden by visibility or opacity';
      } else if (rect.width === 0 || rect.height === 0) {
        hidden = 'no size';
      } else if (rect.width <= 1 && rect.height <= 1) {
        hidden = 'one pixel square';
      } else if (outOfReach(element, rect)) {
        hidden = outOfReach(element, rect);
      } else {
        for (let ancestor = element.parentElement; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
          const style = getComputedStyle(ancestor);

          if (/(hidden|clip)/.test(`${style.overflowX} ${style.overflowY}`) || style.clipPath !== 'none') {
            const outer = ancestor.getBoundingClientRect();
            const visible = Math.max(0, Math.min(rect.right, outer.right) - Math.max(rect.left, outer.left))
              * Math.max(0, Math.min(rect.bottom, outer.bottom) - Math.max(rect.top, outer.top));

            if (visible <= 1 || (style.clipPath !== 'none' && outer.width <= 1)) {
              hidden = 'clipped by an ancestor';
              break;
            }
          }
        }
      }

      const tag = element.tagName.toLowerCase();
      const type = (element as HTMLInputElement).type;
      let control: string | null = null;

      if (tag === 'select') {
        control = 'select';
      } else if (tag === 'input' && (type === 'checkbox' || type === 'radio')) {
        control = type;
      }
      return {
        ...base,
        region: sentinel ?? (element.closest(gridSelector) ? 'grid' : 'page'),
        key: path(element),
        shape,
        hidden,
        ariaHidden: Boolean(element.closest('[aria-hidden="true"], [inert]')),
        tabindex: element.hasAttribute('tabindex') ? Number(element.getAttribute('tabindex')) : null,
        inMain: Boolean(element.closest('main, [role="main"]')),
        control,
        box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      };
    }, [grid, SENTINEL] as const);
  } catch (error) {
    // A Tab that loaded another page destroys the context the read ran in.
    if (/context was destroyed|navigation/i.test(String(error))) {
      return { region: 'body', key: 'navigated', shape: 'navigated', role: '', name: '', hidden: null, ariaHidden: false, tabindex: null,
        inMain: false, control: null, navigated: true, dialogOpened: false, box: null };
    }
    throw error;
  }

  const read = ax && (dom.region === 'page') ? await focusedAx(cdp) : { role: '', name: '' };

  return {
    region: dom.region as SiteStop['region'],
    key: dom.key,
    shape: dom.shape,
    role: read.role,
    name: read.name,
    hidden: dom.hidden,
    ariaHidden: dom.ariaHidden,
    tabindex: dom.tabindex,
    inMain: dom.inMain,
    control: dom.control,
    navigated: dom.url !== startUrl && dom.url.split('#')[0] !== startUrl.split('#')[0],
    dialogOpened: dom.open > dialogs,
    box: dom.box,
  };
}

/**
 * How many presses a walk may take: the page's focusable elements, room for each embedded grid (Tab moves from cell
 * to cell along a row before it leaves; the walk takes the way out after `GRID_STOPS`, and jumps past a grid that
 * still holds it after as many again), and some more, at most 2,000.
 *
 * @param page The page.
 * @param grid The selector of an embedded grid.
 * @returns The budget.
 */
export async function walkBudget(page: Page, grid: string): Promise<number> {
  const { focusable, grids } = await page.evaluate(gridSelector => ({
    focusable: [...document.querySelectorAll(
      'a[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable=""], [contenteditable="true"]',
    )].filter(element => !(element as HTMLButtonElement).disabled && element.getAttribute('tabindex') !== '-1'
      && element.checkVisibility({ visibilityProperty: true })).length,
    grids: [...document.querySelectorAll(gridSelector)].filter(element => !element.parentElement?.closest(gridSelector)).length,
  }), grid);

  return Math.min(2000, focusable + grids * (GRID_STOPS * 2 + 10) + 40);
}

/**
 * Walks the page with Tab (forward, from the start sentinel) or Shift+Tab (backward, from the end sentinel) until
 * the other sentinel, a stop seen three times, or the budget. A run of `GRID_STOPS` stops in an embedded grid takes
 * the documented way out (Ctrl+End then Tab, or Ctrl+Home then Shift+Tab); a grid the way out does not leave within
 * another `GRID_STOPS` stops is a grid trap (`gridTrap`), and the walk goes on from the first element past it.
 *
 * @param page The page.
 * @param cdp The accessibility session.
 * @param site The site.
 * @param options The walk.
 * @param options.direction Which way.
 * @param options.budget How many presses.
 * @param options.ax Whether to read each page stop's role and name.
 * @param options.onStop Called after each stop is read, with the focus still on it.
 * @returns The stops, and whether the budget ran out.
 */
export async function tabWalk(page: Page, cdp: CDPSession, site: Site, { direction, budget, ax = true, onStop }: {
  direction: 'forward' | 'backward';
  budget: number;
  ax?: boolean;
  onStop?: (stop: SiteStop, index: number) => Promise<void>;
}): Promise<{ stops: SiteStop[]; budgetExhausted: boolean; gridTrap: boolean }> {
  const key = direction === 'forward' ? 'Tab' : 'Shift+Tab';
  const stopAt = direction === 'forward' ? END : START;
  const startUrl = page.url();
  const dialogs = await openDialogs(page);
  const stops: SiteStop[] = [];
  const seen = new Map<string, number>();
  let inGrid = 0;
  let wayOutTaken = false;
  let gridTrap = false;

  await focusSentinel(page, direction === 'forward' ? START : END);
  // After a jump past a grid, the element the jump focused is read before the next press.
  let jumped = false;

  for (let press = 0; press < budget; press++) {
    if (!jumped) {
      await page.keyboard.press(key);
    }
    jumped = false;

    const stop = await readStop(page, cdp, { grid: site.grid, startUrl, dialogs, ax });

    stops.push(stop);
    if (stop.region === stopAt || stop.navigated) {
      return { stops, budgetExhausted: false, gridTrap };
    }
    if (onStop && stop.region === 'page') {
      await onStop(stop, stops.length - 1);
    }

    inGrid = stop.region === 'grid' ? inGrid + 1 : 0;
    if (stop.region !== 'grid') {
      wayOutTaken = false;
    }
    // A grid the documented way out did not leave within another `GRID_STOPS` stops holds the keyboard. The walk
    // records it and goes on from the first element past the grid, so the rest of the page is still walked.
    if (inGrid >= GRID_STOPS && wayOutTaken) {
      gridTrap = true;
      inGrid = 0;
      wayOutTaken = false;
      if (!(await focusPastGrid(page, site.grid, direction))) {
        return { stops, budgetExhausted: false, gridTrap };
      }
      jumped = true;
      continue;
    }
    if (inGrid >= GRID_STOPS) {
      await page.keyboard.press(direction === 'forward' ? 'Control+End' : 'Control+Home');
      inGrid = 0;
      wayOutTaken = true;
    }

    const count = (seen.get(stop.key) ?? 0) + 1;

    seen.set(stop.key, count);
    if (count >= 3 && stop.region === 'page') {
      return { stops, budgetExhausted: false, gridTrap };
    }
  }

  return { stops, budgetExhausted: true, gridTrap };
}

/**
 * Focuses the element a stop's key names, after a key press, so `:focus-visible` matches as it would after Tab.
 *
 * @param page The page.
 * @param key The stop's key.
 * @returns Whether the element was found and took the focus.
 */
export async function focusByKey(page: Page, key: string): Promise<boolean> {
  await page.keyboard.press('Shift');

  return page.evaluate((path) => {
    let element: Element | null = document.documentElement;

    for (const part of path.split('>')) {
      const index = Number(part.split(':')[1]);

      element = element?.children[index] ?? null;
    }
    if (!(element instanceof HTMLElement)) {
      return false;
    }
    element.focus({ preventScroll: false });

    return document.activeElement === element;
  }, key);
}

/**
 * The controls no key reaches: an element with a widget role, or a click handler in its markup, that renders, is
 * not focusable, and sits inside nothing focusable (a link or a button around it is the control a key reaches).
 *
 * @param page The page.
 * @param grid The selector of an embedded grid, whose cells are the grid checks' to judge.
 * @returns The controls.
 */
export async function unfocusableControls(page: Page, grid: string): Promise<Array<{ shape: string; role: string; name: string }>> {
  return page.evaluate((gridSelector) => {
    const COMPOSITES = '[aria-activedescendant], [role="listbox"], [role="menu"], [role="menubar"], [role="tree"], [role="grid"], '
      + '[role="treegrid"], [role="tablist"], [role="radiogroup"], [role="toolbar"]';
    const WIDGETS = ['button', 'link', 'tab', 'checkbox', 'radio', 'switch', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option',
      'slider', 'spinbutton', 'combobox', 'treeitem'];
    const focusable = (element: Element) => (element as HTMLElement).tabIndex >= 0
      && !(element as HTMLButtonElement).disabled && !element.closest('[inert]');

    return [...document.querySelectorAll(`${WIDGETS.map(role => `[role="${role}"]`).join(', ')}, [onclick]`)]
      .filter(element => element.checkVisibility({ visibilityProperty: true, opacityProperty: true })
        && !element.closest('[aria-hidden="true"], [aria-disabled="true"]') && !element.closest(gridSelector)
        // An item of a composite widget is reached with the arrow keys (a roving tabindex, or the container's
        // aria-activedescendant), not with Tab.
        && !element.closest(COMPOSITES)
        && !focusable(element) && !element.parentElement?.closest('a[href], button, [tabindex]:not([tabindex="-1"])')
        && !element.querySelector('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .map((element) => {
        const classOf = (node: Element) => [...node.classList].find(name => !/^astro-|^sl-(?:flex|hidden|block|inline)$|:|-(?=[a-z]*\d)[a-z0-9]{5,}$/.test(name));
        const meaningful = classOf(element);
        const role = element.getAttribute('role');
        let context = '';

        for (let ancestor = element.parentElement, depth = 0; !meaningful && !role && ancestor && depth < 4; ancestor = ancestor.parentElement, depth++) {
          if (classOf(ancestor)) {
            context = `${ancestor.tagName.toLowerCase()}.${classOf(ancestor)} `;
            break;
          }
        }

        return {
          shape: `${context}${element.tagName.toLowerCase()}${meaningful ? `.${meaningful}` : ''}${role ? `[role="${role}"]` : ''}`,
          role: role ?? 'onclick',
          name: (element.getAttribute('aria-label') ?? (element as HTMLElement).innerText ?? '').trim(),
        };
      });
  }, grid);
}

/**
 * Turns smooth scrolling off: the docs set `scroll-behavior: smooth`, which makes the scroll a focus move or
 * `scrollIntoView()` starts take a few hundred milliseconds, so a stop read two frames after Tab reads the element
 * before it arrived on screen. A measurement aid, never a finding: what shows at rest is the same.
 *
 * @param page The page.
 */
export async function instantScrolling(page: Page): Promise<void> {
  await page.addStyleTag({ content: 'html, html *, html *::before, html *::after { scroll-behavior: auto !important; }' });
}

/**
 * Moves the focus from inside an embedded grid to the first focusable element after it (or, walking back, the last
 * one before it), the way a walk gets past a grid that holds the keyboard.
 *
 * @param page The page.
 * @param grid The selector of an embedded grid.
 * @param direction Which way the walk goes.
 * @returns Whether an element past the grid took the focus.
 */
async function focusPastGrid(page: Page, grid: string, direction: 'forward' | 'backward'): Promise<boolean> {
  return page.evaluate(([selector, forward]) => {
    let root = document.activeElement?.closest(selector) ?? null;

    for (let outer = root?.parentElement?.closest(selector) ?? null; outer; outer = outer.parentElement?.closest(selector) ?? null) {
      root = outer;
    }
    if (!root) {
      return false;
    }

    const focusable = [...document.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, summary, [tabindex]')]
      .filter(element => element.tabIndex >= 0 && !(element as HTMLButtonElement).disabled && !root!.contains(element)
        && element.checkVisibility({ visibilityProperty: true }));
    const after = (element: Element) => Boolean(root!.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING);
    const next = forward ? focusable.find(after) : [...focusable].reverse().find(element => !after(element));

    next?.focus();

    return Boolean(next) && document.activeElement === next;
  }, [grid, direction === 'forward'] as const);
}
