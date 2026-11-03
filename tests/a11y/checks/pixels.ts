import { type Page } from '@playwright/test';
import { type RootWrapper } from '../harness';

/**
 * Pixel captures for the checks that measure what is painted (`focus-contrast.spec.ts`,
 * `forced-colors-motion.spec.ts`): a `page.screenshot()` clip decoded by the page's own canvas, so a check
 * reads RGBA without a decoder dependency. The device scale factor of the checks' projects is 1, so a clip
 * pixel is a CSS pixel.
 */

// The margin `grow()` adds by default: room for a focus ring drawn just outside an element.
export const MARGIN = 4;

export type Box = { x: number; y: number; width: number; height: number };
export type Image = { width: number; height: number; data: number[]; png?: Buffer };

/**
 * Captures an area of the page as RGBA pixels, decoded by the page's own canvas, with the PNG kept for a
 * check that attaches what it saw.
 *
 * @param page The page.
 * @param box The area, in viewport pixels.
 * @returns The image.
 */
export async function capture(page: Page, box: Box): Promise<Image> {
  const viewport = page.viewportSize()!;
  const clip = {
    x: Math.max(0, Math.floor(box.x)),
    y: Math.max(0, Math.floor(box.y)),
    width: Math.max(1, Math.min(viewport.width, Math.ceil(box.x + box.width)) - Math.max(0, Math.floor(box.x))),
    height: Math.max(1, Math.min(viewport.height, Math.ceil(box.y + box.height)) - Math.max(0, Math.floor(box.y))),
  };
  const png = await page.screenshot({ clip, animations: 'disabled', caret: 'hide' });
  const decoded = await page.evaluate(async(base64) => {
    const image = new Image();

    image.src = `data:image/png;base64,${base64}`;
    await image.decode();

    const canvas = document.createElement('canvas');

    canvas.width = image.width;
    canvas.height = image.height;

    const context = canvas.getContext('2d')!;

    context.drawImage(image, 0, 0);

    return { width: image.width, height: image.height, data: Array.from(context.getImageData(0, 0, image.width, image.height).data) };
  }, png.toString('base64'));

  return { ...decoded, png };
}

/**
 * The box of an element, grown by a margin on every side.
 *
 * @param box The box.
 * @param margin The margin.
 * @returns The grown box.
 */
export function grow(box: Box, margin = MARGIN): Box {
  return { x: box.x - margin, y: box.y - margin, width: box.width + margin * 2, height: box.height + margin * 2 };
}

/**
 * Waits two animation frames, so a focus move, a selection and their transitions are painted.
 *
 * @param page The page.
 */
export async function settle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

/**
 * The master table's cell box at a coordinate.
 *
 * @param page The page.
 * @param root The root container selector.
 * @param row The row.
 * @param col The column.
 * @returns The box, or `null` when the cell is not drawn.
 */
export async function cellBox(page: Page, root: string, row: number, col: number): Promise<Box | null> {
  return page.evaluate(([selector, r, c]) => {
    const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as RootWrapper | null)?.__hotInstance as unknown as
      { getCell(r: number, c: number, top?: boolean): HTMLElement | null } | undefined;
    const td = hot?.getCell(r, c, true);
    const rect = td?.getBoundingClientRect();

    return rect && rect.width > 0 ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null;
  }, [root, row, col] as const);
}
