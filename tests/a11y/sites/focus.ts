import { type Page } from '@playwright/test';
import { contrastRatio, dominantColor, indicatorChange, strongestPixel } from '../../lib/contrast.mjs';
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

        if (hit && (hit === element || element.contains(hit) || hit.contains(element))) {
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

  const box = await page.evaluate(() => {
    const element = document.activeElement as HTMLElement;

    element.scrollIntoView({ block: 'center', inline: 'nearest' });
    element.blur();

    const rect = element.getBoundingClientRect();

    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });

  await frames(page);

  const viewport = page.viewportSize()!;
  const grown = grow(box);
  const area = {
    x: Math.max(0, grown.x),
    y: Math.max(0, grown.y),
    width: Math.min(viewport.width, grown.x + grown.width) - Math.max(0, grown.x),
    height: Math.min(viewport.height, grown.y + grown.height) - Math.max(0, grown.y),
  };

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
  await page.evaluate(() => Promise.all(document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity)
    .map(animation => animation.finished.catch(() => undefined))));

  const focusVisible = await page.evaluate(() => document.activeElement?.matches(':focus-visible') ?? false);
  const after = await capture(page, area);
  const change = indicatorChange(before, after, MARGIN);

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  return {
    change,
    boundary: boundaryOf(before, { x: box.x - area.x, y: box.y - area.y, width: box.width, height: box.height }),
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
