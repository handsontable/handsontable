import { type Page } from '@playwright/test';
import { contrastRatio, dominantColor, indicatorChange, strongestPixel } from '../../lib/contrast.mjs';
import { boxInCapture, focusExtent } from '../../lib/site-visual.mjs';
import { capture, grow, MARGIN, settle as frames, type Box, type Image } from '../checks/pixels';
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
 * The focus indicator of one stop: its area captured with nothing focused, then with the focus on it after a key
 * press, and the change between the two (`indicatorChange()`); and, from the capture at rest, its edge and its fill
 * against the page around it. The pointer is parked first, so a hover state is in neither capture.
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

  // The box is read while the element has the focus: a skip link is drawn only then, and the area to compare is where
  // it shows, which the capture at rest then shows without it. So is what the focus paints around it: the element's
  // own outline, which can stand past the margin (an offset of 4 px and a width of 2 px reach 6 px out), the outline of
  // its `::before` or `::after` placed absolutely (a link's overlay stretched over its card, ringed on focus), and the
  // ring of each ancestor the focus changed (a card ringed through `:has()` or `:focus-within`), read again after the
  // blur to tell a ring the focus drew from one the ancestor always has. The walk up stops at a landmark: a ring on
  // the page's main region or its header is no part of one control's indicator.
  const read = await page.evaluate(() => {
    const element = document.activeElement as HTMLElement;

    element.scrollIntoView({ block: 'center', inline: 'nearest' });

    const ring = (node: Element) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();

      return {
        box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        outline: { style: style.outlineStyle, width: parseFloat(style.outlineWidth) || 0, offset: parseFloat(style.outlineOffset) || 0 },
        paint: `${style.outlineStyle} ${style.outlineColor} ${style.boxShadow}`,
      };
    };
    const LANDMARK = 'body, main, header, footer, nav, aside, form, [role="main"], [role="banner"], [role="contentinfo"], '
      + '[role="navigation"], [role="complementary"], [role="region"], [role="dialog"]';
    const chain: Element[] = [];

    for (let node = element.parentElement; node && !node.matches(LANDMARK); node = node.parentElement) {
      chain.push(node);
    }

    // A pseudo-element's box is not in the DOM: an absolutely placed one is read from its containing block (the
    // nearest positioned element, the element itself included) and its resolved offsets and size. One in the flow
    // lies inside the element's box, so the element's own extent covers it.
    const pseudoRings = ['::before', '::after'].flatMap((pseudo) => {
      const style = getComputedStyle(element, pseudo);

      if (style.content === 'none' || style.outlineStyle === 'none' || !['absolute', 'fixed'].includes(style.position)) {
        return [];
      }

      let block: Element = document.documentElement;

      for (let node: Element | null = element; node; node = node.parentElement) {
        if (getComputedStyle(node).position !== 'static') {
          block = node;
          break;
        }
      }

      const rect = block.getBoundingClientRect();

      return [{
        box: {
          x: rect.x + block.clientLeft + (parseFloat(style.left) || 0),
          y: rect.y + block.clientTop + (parseFloat(style.top) || 0),
          width: parseFloat(style.width) || 0,
          height: parseFloat(style.height) || 0,
        },
        outline: { style: style.outlineStyle, width: parseFloat(style.outlineWidth) || 0, offset: parseFloat(style.outlineOffset) || 0 },
      }];
    });
    const self = ring(element);
    const focused = chain.map(ring);

    element.blur();

    const ancestors = focused.filter((before, index) => ring(chain[index]).paint !== before.paint)
      .map(({ box, outline }) => ({ box, outline }));

    return { box: self.box, extent: { box: self.box, outline: self.outline }, rings: [...pseudoRings, ...ancestors] };
  });
  const box = read.box;

  await frames(page);

  const viewport = page.viewportSize()!;
  const grown = grow(focusExtent(read.extent, read.rings));
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
  // The transitions the focus started, for five seconds at most: on the element, its pseudo-elements, what it holds
  // and what holds it (`:focus-within`). A paused animation never finishes, and the rest of the page (a reveal or a
  // counter the scroll started) is no part of the indicator: waiting for it costs seconds per stop.
  await page.evaluate(() => Promise.race([
    Promise.all(document.getAnimations().filter((animation) => {
      const target = (animation.effect as KeyframeEffect | null)?.target ?? null;
      const active = document.activeElement;

      return animation.effect?.getTiming().iterations !== Infinity && animation.playState === 'running' && target !== null
        && active !== null && (target === active || active.contains(target) || target.contains(active));
    }).map(animation => animation.finished.catch(() => undefined))),
    new Promise<void>((resolve) => {
      const begin = performance.now();
      const tick = () => (performance.now() - begin >= 5000 ? resolve() : requestAnimationFrame(tick));

      requestAnimationFrame(tick);
    }),
  ]));

  const focusVisible = await page.evaluate(() => document.activeElement?.matches(':focus-visible') ?? false);
  const after = await capture(page, area);
  const change = indicatorChange(before, after, MARGIN, {
    x: Math.floor(inner.x), y: Math.floor(inner.y), width: Math.ceil(inner.x + inner.width) - Math.floor(inner.x),
    height: Math.ceil(inner.y + inner.height) - Math.floor(inner.y),
  });

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  return {
    change,
    boundary: boundaryOf(before, inner),
    summary: { focusVisible, changed: change.changed, ratio: Math.round(change.adjacentRatio * 100) / 100 },
  };
}

/**
 * A control's edge (its outer two pixels' strongest pixel) and its fill (its inside's most common color), each
 * against the most common color of the margin around it.
 *
 * @param image The capture, with `MARGIN` around the control.
 * @param box The control's box inside the capture.
 * @returns The boundary.
 */
export function boundaryOf(image: Image, box: Box) {
  const around = { data: [] as number[] };
  const edge = { data: [] as number[] };
  const inside = { data: [] as number[] };

  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const index = (y * image.width + x) * 4;
      const pixel = [image.data[index], image.data[index + 1], image.data[index + 2], 255];
      const depth = Math.min(x - Math.round(box.x), Math.round(box.x + box.width) - 1 - x, y - Math.round(box.y), Math.round(box.y + box.height) - 1 - y);

      if (depth < -1) {
        around.data.push(...pixel);
      } else if (depth >= 0 && depth < 2) {
        edge.data.push(...pixel);
      } else if (depth >= 2) {
        inside.data.push(...pixel);
      }
    }
  }

  const background = around.data.length > 0 ? dominantColor(around) : dominantColor(image);
  const fill = inside.data.length > 0 ? dominantColor(inside) : background;

  return {
    boundary: edge.data.length > 0 ? strongestPixel(edge, background) : { color: background, ratio: 1 },
    fill: { color: fill, ratio: contrastRatio(fill, background) },
    around: background,
  };
}
