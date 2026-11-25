import { type Page } from '@playwright/test';
import { indicatorChange } from '../../lib/contrast.mjs';
import { boundaryOf, boxInCapture, changedRings, focusExtent, pixelBox, pseudoRingBox } from '../../lib/site-visual.mjs';
import { capture, grow, MARGIN, settle as frames, type Box } from '../checks/pixels';
import { focusByKey, type SiteStop } from './harness';

/**
 * The focus measurements the site checks share: what covers a focused element (`focus-contrast.spec.ts`), and the
 * focus indicator of one stop, measured with the colors the page paints (`focus-contrast.spec.ts`) and with forced
 * colors (`forced-colors-motion.spec.ts`). Policy: `tests/AGENTS.md`, "A11y: the site checks beyond axe".
 */

/**
 * Samples 25 points of the focused element's box inside the viewport, and counts those where it is on top: where
 * `elementFromPoint()` returns it, an element inside it, or an element it sits inside (a label drawn over it is
 * part of it). A point outside the viewport is not sampled.
 *
 * @param page The page.
 * @returns The points where it shows, and the points sampled.
 */
export async function samplePoints(page: Page): Promise<{ visible: number; points: number }> {
  return page.evaluate(() => {
    const element = document.activeElement;
    const rect = element?.getBoundingClientRect();
    let visible = 0;
    let points = 0;

    if (!element || !rect) {
      return { visible: 0, points: 0 };
    }
    for (const fx of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      for (const fy of [0.1, 0.3, 0.5, 0.7, 0.9]) {
        const x = rect.left + rect.width * fx;
        const y = rect.top + rect.height * fy;

        if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) {
          continue;
        }
        points += 1;

        const hit = document.elementFromPoint(x, y);

        // A checkbox or a radio drawn by its label shows through the label.
        const labels = [...((element as HTMLInputElement).labels ?? [])];

        if (hit && (hit === element || element.contains(hit) || hit.contains(element) || labels.some(label => label.contains(hit)))) {
          visible += 1;
        }
      }
    }

    return { visible, points };
  });
}

/**
 * A part of the page as a ring is read from it: its box, its outline and its shadow. A pseudo-element's box is not in
 * the DOM, so it comes with what places it (`pseudoRingBox()`).
 */
type PartRead = {
  box: Box;
  outline: { style: string; width: number; offset: number; color: string };
  shadow: string;
  pseudo?: { block: { x: number; y: number; clientLeft: number; clientTop: number } | null; left: string; top: string; width: string; height: string };
} | null;

/**
 * Reads the stop, the ancestors between it and the nearest landmark, and its absolutely placed `::before` and
 * `::after`, as a ring is read from each. The stop is found by its key, so the same parts are read with the focus on
 * it and at rest. The walk up stops at a landmark: a ring on the page's main region or its header is no part of one
 * control's indicator.
 *
 * @param page The page.
 * @param key The stop's key (`focusByKey()`).
 * @returns The stop, its ancestors and its two pseudo-elements, or `null` when the key finds no element.
 */
function readParts(page: Page, key: string) {
  return page.evaluate((path) => {
    let element: Element | null = document.documentElement;

    for (const part of path.split('>')) {
      element = element?.children[Number(part.split(':')[1])] ?? null;
    }
    if (!element) {
      return null;
    }

    const read = (node: Element, pseudo: string | null = null): PartRead => {
      const style = getComputedStyle(node, pseudo);
      const outline = {
        style: style.outlineStyle, width: parseFloat(style.outlineWidth) || 0, offset: parseFloat(style.outlineOffset) || 0,
        color: style.outlineColor,
      };

      if (pseudo === null) {
        const rect = node.getBoundingClientRect();

        return { box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, outline, shadow: style.boxShadow };
      }
      if (style.content === 'none' || !['absolute', 'fixed'].includes(style.position)) {
        return null;
      }

      let block = null;

      if (style.position === 'absolute') {
        let holder: Element = document.documentElement;

        for (let node2: Element | null = node; node2; node2 = node2.parentElement) {
          if (getComputedStyle(node2).position !== 'static') {
            holder = node2;
            break;
          }
        }

        const rect = holder.getBoundingClientRect();

        block = { x: rect.x, y: rect.y, clientLeft: holder.clientLeft, clientTop: holder.clientTop };
      }

      return {
        box: { x: 0, y: 0, width: 0, height: 0 }, outline, shadow: style.boxShadow,
        pseudo: { block, left: style.left, top: style.top, width: style.width, height: style.height },
      };
    };
    const LANDMARK = 'body, main, header, footer, nav, aside, [role="main"], [role="banner"], [role="contentinfo"], '
      + '[role="navigation"], [role="complementary"], [role="region"], [role="dialog"]';
    const ancestors: Element[] = [];

    for (let node = element.parentElement; node && !node.matches(LANDMARK); node = node.parentElement) {
      ancestors.push(node);
    }

    return {
      self: read(element)!,
      parts: [read(element, '::before'), read(element, '::after'), ...ancestors.map(node => read(node))],
    };
  }, key);
}

/**
 * Waits for the transitions and finite animations running on the stop, its pseudo-elements, what it holds and what
 * holds it (`:focus-within`), five seconds at most. A ring that fades in reads its start value until then, and one
 * that fades out on blur reads its focused value. A paused animation never finishes, and the rest of the page (a
 * reveal or a counter the scroll started) is no part of the indicator: waiting for it costs seconds per stop.
 *
 * @param page The page.
 * @param key The stop's key (`focusByKey()`).
 */
async function settleAnimations(page: Page, key: string) {
  await page.evaluate(path => Promise.race([
    (() => {
      let element: Element | null = document.documentElement;

      for (const part of path.split('>')) {
        element = element?.children[Number(part.split(':')[1])] ?? null;
      }

      return Promise.all(document.getAnimations().filter((animation) => {
        const target = (animation.effect as KeyframeEffect | null)?.target ?? null;

        return animation.effect?.getTiming().iterations !== Infinity && animation.playState === 'running' && target !== null
          && element !== null && (target === element || element.contains(target) || target.contains(element));
      }).map(animation => animation.finished.catch(() => undefined)));
    })(),
    new Promise<void>((resolve) => {
      const begin = performance.now();
      const tick = () => (performance.now() - begin >= 5000 ? resolve() : requestAnimationFrame(tick));

      requestAnimationFrame(tick);
    }),
  ]), key);
}

/**
 * A part read in the page, with a pseudo-element's box placed (`pseudoRingBox()`).
 *
 * @param part The part as `readParts()` read it.
 * @returns The part with its box, or `null`.
 */
function placed(part: PartRead) {
  if (!part) {
    return null;
  }

  return part.pseudo ? { ...part, box: pseudoRingBox(part.pseudo.block, part.pseudo) } : part;
}

/**
 * The focus indicator of one stop: what the focus paints captured with nothing focused, then with the focus on it
 * after a key press, and the change between the two (`indicatorChange()`); and, from the capture at rest, its edge and
 * its fill against the page around it. The pointer is parked first, so a hover state is in neither capture.
 *
 * The area covers what the focus paints (`focusExtent()`): the stop's own outline or shadow, which can stand past
 * the margin (an offset of 4 px and a width of 2 px reach 6 px out), and each ring the focus drew on an ancestor or
 * on the stop's own pseudo-element (`changedRings()`). The parts are read with the focus on the stop, once its
 * transitions ended, and again at rest, once the blur's had: a ring that fades in would otherwise read as its start.
 * A skip link is drawn only while focused, so its box is read then too, and the capture at rest shows it gone.
 *
 * @param page The page.
 * @param stop The stop.
 * @returns The change, the boundary and a summary for the detail, or `null` when the element could not take the
 *   focus again.
 */
export async function indicator(page: Page, stop: SiteStop) {
  await page.mouse.move(1, page.viewportSize()!.height - 1);
  if (!(await focusByKey(page, stop.key))) {
    return null;
  }
  await page.evaluate(() => (document.activeElement as HTMLElement).scrollIntoView({ block: 'center', inline: 'nearest' }));
  await frames(page);
  await settleAnimations(page, stop.key);

  const focused = await readParts(page, stop.key);

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await frames(page);
  await settleAnimations(page, stop.key);

  const rest = await readParts(page, stop.key);

  if (!focused || !rest) {
    return null;
  }

  const box = focused.self.box;
  const rings = changedRings(focused.parts.map(placed), rest.parts.map(placed));
  const viewport = page.viewportSize()!;
  const grown = grow(focusExtent(focused.self, rings));
  const area = {
    x: Math.max(0, grown.x),
    y: Math.max(0, grown.y),
    width: Math.min(viewport.width, grown.x + grown.width) - Math.max(0, grown.x),
    height: Math.min(viewport.height, grown.y + grown.height) - Math.max(0, grown.y),
  };
  const inner = boxInCapture(box, area);

  // A control scrolling cannot bring fully into the viewport (a header wider than a phone) is measured on the part
  // that shows; one that shows nothing is not measured.
  if (area.width < 4 || area.height < 4) {
    return null;
  }

  const before = await capture(page, area);

  if (!(await focusByKey(page, stop.key))) {
    return null;
  }
  await page.evaluate(() => (document.activeElement as HTMLElement).scrollIntoView({ block: 'center', inline: 'nearest' }));
  await frames(page);
  await settleAnimations(page, stop.key);

  const focusVisible = await page.evaluate(() => document.activeElement?.matches(':focus-visible') ?? false);
  const after = await capture(page, area);
  const change = indicatorChange(before, after, MARGIN, pixelBox(inner));

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  return {
    change,
    boundary: boundaryOf(before, inner),
    summary: { focusVisible, changed: change.changed, ratio: Math.round(change.adjacentRatio * 100) / 100 },
  };
}
