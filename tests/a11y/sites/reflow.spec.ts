import { test, type Page } from '@playwright/test';
import { siteCheckId, siteOf } from '../../lib/a11y-site-checks.mjs';
import { CONDITIONS, TEXT_SPACING_CSS, clippingFindings, nameApart, overlapFindings, viewportFindings } from '../../lib/reflow.mjs';
import { orientationFindings, pageReflowFindings } from '../../lib/site-visual.mjs';
import { attachEvidence, readEnvironment, type EvidenceFinding } from '../evidence';
import { declareSiteTarget } from './harness';
import { siteDefinition } from './sites';

/**
 * Reflow, zoom, text spacing, and orientation on a site (`<site>-reflow`): 1.4.10, 1.4.4, 1.4.12 and 1.3.4, on every
 * page of the site at rest, in the light scheme (a color scheme moves no box). One load per page: the viewport is
 * resized to each condition of `CONDITIONS` (`lib/reflow.mjs`) in turn, and the text-spacing override is added last.
 * The verdicts are `lib/reflow.mjs` and `lib/site-visual.mjs`.
 *
 * - **1.4.10 at 320 CSS px:** the page must not scroll sideways. A scroll container that scrolls its own content (a
 *   code block, a wide table, an embedded grid) is the two-dimensional content the criterion exempts; what pushes the
 *   page itself wider is named (`page-scrolls-sideways`).
 * - **Every condition:** text an `overflow: hidden` or `clip` container cuts off (each text node's box against its
 *   container's), controls drawn over each other on the same layer (the page, or a fixed or sticky header), and a
 *   fixed surface that shows and reaches past the viewport. A fixed surface entirely outside it (a closed panel slid
 *   away) is the keyboard check's to judge.
 * - **1.3.4:** the main content has an area in a 390 by 844 and an 844 by 390 viewport.
 *
 * Report-only: a test fails for tooling only. Policy: `tests/AGENTS.md`, "A11y: the site checks beyond axe".
 */

const SITE = siteDefinition(siteOf(process.env.HOT_A11Y_SITE));
const CHECK = siteCheckId(SITE.id, 'reflow');
const THEME = 'light';
const ORDER = ['reflow-320', 'zoom-200', 'text-spacing'] as const;

interface Layout {
  viewport: { width: number; height: number; scrollX: number; scrollY: number; scrollWidth: number; scrollHeight: number };
  offenders: Array<{ selector: string; right: number }>;
  exempt: number;
  texts: Array<Record<string, unknown> & { selector: string }>;
  controls: Array<{ id: number; selector: string; left: number; top: number; right: number; bottom: number; within: number[]; layer: number }>;
  surfaces: Array<{ selector: string; surface: string; left: number; right: number; top: number; bottom: number; fixed: boolean }>;
}

test.describe(CHECK, () => {
  for (const entry of SITE.pages) {
    test(entry.id, async({ page }, testInfo) => {
      const target = declareSiteTarget(testInfo, entry, THEME, SITE);
      const startedAt = Date.now();
      const pageErrors: string[] = [];

      await SITE.open(page, entry, { theme: THEME, pageErrors });
      await SITE.settle(page);

      const environment = await readEnvironment(page);
      const findings: EvidenceFinding[] = [];
      const detail: Record<string, unknown> = {};
      const sizes: Record<'portrait' | 'landscape', { width: number; height: number }> = { portrait: { width: 0, height: 0 }, landscape: { width: 0, height: 0 } };

      for (const [orientation, viewport] of [['portrait', { width: 390, height: 844 }], ['landscape', { width: 844, height: 390 }]] as const) {
        await page.setViewportSize(viewport);
        await frames(page);
        sizes[orientation] = await page.evaluate(() => {
          const main = document.querySelector('main, [role="main"]')?.getBoundingClientRect();

          return { width: Math.round(main?.width ?? 0), height: Math.round(main?.height ?? 0) };
        });
      }
      findings.push(...orientationFindings(sizes) as EvidenceFinding[]);
      detail.orientation = sizes;

      for (const condition of ORDER) {
        await page.setViewportSize(CONDITIONS[condition].viewport);
        if (condition === 'text-spacing') {
          await page.addStyleTag({ content: TEXT_SPACING_CSS });
        }
        await frames(page);

        const layout = await measure(page, SITE.grid);
        const surfaces = nameApart(layout.surfaces) as Layout['surfaces'];

        findings.push(...aggregate([
          ...pageReflowFindings({ condition, viewport: layout.viewport, offenders: layout.offenders, exempt: layout.exempt }) as EvidenceFinding[],
          ...clippingFindings({ condition, boxes: layout.texts }) as EvidenceFinding[],
          ...overlapFindings({ condition, controls: layout.controls }) as EvidenceFinding[],
          ...viewportFindings({ condition, viewport: { ...layout.viewport, scrollWidth: layout.viewport.width }, surfaces }) as EvidenceFinding[],
        ]));
        detail[condition] = { viewport: layout.viewport, offenders: layout.offenders.slice(0, 10), exempt: layout.exempt, clipped: layout.texts.length,
          controls: layout.controls.length, surfaces: surfaces.length };
      }

      await attachEvidence(testInfo, {
        target, startedAt, environment, findings, pageErrors, detail,
        criteria: ['1.3.4', '1.4.4', '1.4.10', '1.4.12'],
      });
    });
  }
});

/**
 * One finding per kind, element kind and condition, with how many elements showed it: a page's truncated sidebar
 * entries are one finding, not one per entry. The first element's measurement is kept.
 *
 * @param findings The findings of one condition.
 * @returns The findings, merged.
 */
function aggregate(findings: EvidenceFinding[]): EvidenceFinding[] {
  const merged = new Map<string, EvidenceFinding & { measured: Record<string, unknown> }>();

  for (const finding of findings) {
    const key = `${finding.kind}|${finding.selector ?? ''}|${finding.step ?? ''}`;
    const kept = merged.get(key);

    if (kept) {
      kept.measured.count = Number(kept.measured.count ?? 1) + 1;
    } else {
      merged.set(key, { ...finding, measured: { ...(finding.measured ?? {}), count: 1 } });
    }
  }

  return [...merged.values()];
}

/**
 * Waits for a resize or a stylesheet to lay out: two animation frames, then every finite animation it started.
 *
 * @param page The page.
 */
async function frames(page: Page): Promise<void> {
  await page.evaluate(async() => {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await Promise.all(document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity)
      .map(animation => animation.finished.catch(() => undefined)));
  });
}

/**
 * Measures the page's layout at the current viewport, in one evaluation: the elements that push the page wider than
 * the viewport, the text each clipping container cuts off, the controls with their boxes and layers, and the fixed
 * surfaces that show.
 *
 * @param page The page.
 * @param grid The selector of an embedded grid, which is left out.
 * @returns The layout.
 */
async function measure(page: Page, grid: string): Promise<Layout> {
  return page.evaluate((gridSelector) => {
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    const scroller = document.scrollingElement ?? document.documentElement;
    // An element is named by its kind (tag and first class), never its id or its text: one defect on a hundred
    // checkboxes of a list is one finding with a count (`aggregate()` in the spec). A fixed layer keeps its id, which
    // names the one layer it is.
    // An element with no class of its own is named inside its nearest ancestor that has one (`div.hot-footer__row a`).
    const classOf = (node: Element) => [...node.classList].find(name => !/^astro-|^sl-(?:flex|hidden|block|inline)$|:|-(?=[a-z]*\d)[a-z0-9]{5,}$/.test(name));
    const shapeOf = (element: Element, { id = false } = {}) => {
      const meaningful = classOf(element);
      let context = '';

      for (let ancestor = element.parentElement, depth = 0; !meaningful && ancestor && depth < 4; ancestor = ancestor.parentElement, depth++) {
        if (classOf(ancestor)) {
          context = `${ancestor.tagName.toLowerCase()}.${classOf(ancestor)} `;
          break;
        }
      }

      return `${context}${element.tagName.toLowerCase()}${id && element.id ? `#${element.id}` : ''}${meaningful ? `.${meaningful}` : ''}`;
    };
    const shown = (element: Element) => element.checkVisibility({ visibilityProperty: true, opacityProperty: true })
      && !element.closest('[aria-hidden="true"], [inert]');
    const inGrid = (element: Element) => Boolean(element.closest(gridSelector));
    const scrollsItself = (element: Element) => {
      for (let ancestor = element.parentElement; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
        if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(ancestor).overflowX)) {
          return true;
        }
      }

      return false;
    };
    const fixedOf = (element: Element): Element | null => {
      for (let current: Element | null = element; current; current = current.parentElement) {
        const position = getComputedStyle(current).position;

        if (position === 'fixed' || position === 'sticky') {
          return current;
        }
      }

      return null;
    };
    const all = [...document.body.querySelectorAll('*')];
    // What pushes the page wider: an element past the right edge that no scroll or clip container holds, and that no
    // such element holds either (the outermost one names the cause).
    const inFixed = (element: Element) => {
      for (let current: Element | null = element; current; current = current.parentElement) {
        if (getComputedStyle(current).position === 'fixed') {
          return true;
        }
      }

      return false;
    };
    // A data table and preformatted code are the two-dimensional content 1.4.10 exempts, wherever they sit.
    const pastEdge = all.filter(element => !inGrid(element) && shown(element) && element.getBoundingClientRect().right > width + 1
      && !scrollsItself(element) && !inFixed(element));
    const wide = pastEdge.filter(element => !element.closest('table, pre'));
    const exempt = pastEdge.length - wide.length;
    const offenders = wide.filter(element => !wide.some(other => other !== element && other.contains(element)))
      .map(element => ({ selector: shapeOf(element), right: Math.round(element.getBoundingClientRect().right) }))
      .sort((a, b) => b.right - a.right);
    // Text a clipping container cuts off: each text node's box against the nearest container that clips it.
    const texts: Array<Record<string, unknown> & { selector: string }> = [];
    const seen = new Set<Element>();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement;

      if (!parent || !node.textContent?.trim() || inGrid(parent) || !shown(parent) || /^(script|style|noscript|template)$/i.test(parent.tagName)) {
        continue;
      }

      let container: Element | null = null;

      for (let ancestor: Element | null = parent; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor);

        if (/(auto|scroll)/.test(`${style.overflowX} ${style.overflowY}`)) {
          break;
        }
        if (/(hidden|clip)/.test(`${style.overflowX} ${style.overflowY}`)) {
          container = ancestor;
          break;
        }
      }
      if (!container || seen.has(container)) {
        continue;
      }

      const range = document.createRange();

      range.selectNodeContents(node);

      const text = range.getBoundingClientRect();
      const box = container.getBoundingClientRect();
      const style = getComputedStyle(container);
      const hiddenX = /(hidden|clip)/.test(style.overflowX) ? Math.max(0, text.right - box.right, box.left - text.left) : 0;
      const hiddenY = /(hidden|clip)/.test(style.overflowY) ? Math.max(0, text.bottom - box.bottom, box.top - text.top) : 0;
      const onScreen = box.right > 0 && box.bottom > 0 && box.left < width && box.top < height + scroller.scrollHeight;

      if ((hiddenX > 1 || hiddenY > 1) && onScreen && box.width > 1 && box.height > 1) {
        seen.add(container);
        texts.push({
          selector: shapeOf(container), surface: 'text container', text: node.textContent.trim().slice(0, 60),
          overflowX: style.overflowX, overflowY: style.overflowY, ellipsis: style.textOverflow === 'ellipsis',
          scrollWidth: Math.round(box.width + hiddenX), clientWidth: Math.round(box.width),
          scrollHeight: Math.round(box.height + hiddenY), clientHeight: Math.round(box.height),
        });
      }
    }

    // A link that wraps onto two lines has one box around both, which overlaps the links on the lines beside it
    // without anything being drawn over anything; and a control in a fixed layer outside the viewport (a closed
    // panel slid away) is not on screen to hide another.
    const onViewport = (element: Element) => {
      const rect = element.getBoundingClientRect();

      return !inFixed(element) || (rect.right > 0 && rect.bottom > 0 && rect.left < width && rect.top < height);
    };
    const controlElements = [...document.querySelectorAll('a[href], button, input, select, textarea, summary, [role="button"], [role="tab"]')]
      .filter(element => shown(element) && !inGrid(element) && element.getBoundingClientRect().width > 0 && element.getClientRects().length === 1
        && onViewport(element));
    const layers = new Map<Element, number>();
    const controls = controlElements.map((element, id) => {
      const rect = element.getBoundingClientRect();
      const fixed = fixedOf(element);

      if (fixed && !layers.has(fixed)) {
        layers.set(fixed, layers.size + 1);
      }

      return {
        id,
        selector: shapeOf(element),
        left: rect.left + scrollX,
        top: rect.top + scrollY,
        right: rect.right + scrollX,
        bottom: rect.bottom + scrollY,
        within: controlElements.map((other, index) => (other !== element && other.contains(element) ? index : -1)).filter(index => index >= 0),
        layer: fixed ? layers.get(fixed)! : 0,
      };
    });
    // A fixed layer is judged by where its text is, not by its box (a column can be wider than what it holds). A text
    // node outside its scroll area's box is a scroll of that area away, and reachable while the area shows; one inside
    // the area's box, or in no scroll area, is reachable only where the viewport shows it. The layer's box for
    // `viewportFindings()` is the viewport grown by how far its unreachable text reaches past each edge.
    const contentBox = (surface: Element) => {
      const inner = document.createTreeWalker(surface, NodeFilter.SHOW_TEXT);
      const over = { left: 0, top: 0, right: 0, bottom: 0 };
      let texts = 0;

      for (let node = inner.nextNode(); node; node = inner.nextNode()) {
        const parent = node.parentElement;

        if (!parent || !node.textContent?.trim() || !shown(parent)) {
          continue;
        }

        let area: Element | null = null;

        for (let ancestor: Element | null = parent; ancestor && !area; ancestor = ancestor.parentElement) {
          if (/(auto|scroll)/.test(`${getComputedStyle(ancestor).overflowX} ${getComputedStyle(ancestor).overflowY}`)) {
            area = ancestor;
          }
          if (ancestor === surface) {
            break;
          }
        }

        const range = document.createRange();

        range.selectNodeContents(node);

        const text = range.getBoundingClientRect();

        if (text.width === 0 || text.height === 0) {
          continue;
        }
        texts += 1;
        if (area) {
          const box = area.getBoundingClientRect();
          const insideArea = text.left >= box.left - 1 && text.right <= box.right + 1 && text.top >= box.top - 1 && text.bottom <= box.bottom + 1;

          if (!insideArea) {
            continue;
          }
        }
        over.left = Math.max(over.left, -text.left);
        over.top = Math.max(over.top, -text.top);
        over.right = Math.max(over.right, text.right - width);
        over.bottom = Math.max(over.bottom, text.bottom - height);
      }

      return texts === 0 ? null : { left: -over.left, top: -over.top, right: width + over.right, bottom: height + over.bottom };
    };
    const surfaces = all.filter(element => getComputedStyle(element).position === 'fixed' && shown(element) && !inGrid(element)
      && !(element.parentElement && inFixed(element.parentElement)))
      .flatMap((element) => {
        const rect = element.getBoundingClientRect();
        const content = contentBox(element);

        return content && rect.right > 0 && rect.bottom > 0 && rect.left < width && rect.top < height && rect.width > 1 && rect.height > 1
          ? [{ selector: shapeOf(element, { id: true }), surface: 'fixed layer', ...content, fixed: true }] : [];
      });

    return {
      viewport: { width, height, scrollX, scrollY, scrollWidth: scroller.scrollWidth, scrollHeight: scroller.scrollHeight },
      offenders,
      exempt,
      texts,
      controls,
      surfaces,
    };
  }, grid);
}
