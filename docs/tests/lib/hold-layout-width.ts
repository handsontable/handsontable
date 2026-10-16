import type { Page } from '@playwright/test';

/**
 * The layout width a docs page keeps while a full-page capture runs. Narrower than the 1280px
 * viewport the suite uses, wider than any breakpoint a grid cares about, so a page that already
 * fits it is laid out exactly as before.
 */
export const CAPTURE_MIN_LAYOUT_WIDTH = 1000;

/**
 * Keeps the page's layout width from collapsing while `page.screenshot({ fullPage: true })` runs.
 *
 * On Linux CI the capture briefly shrinks the viewport to 1x1px. Without a floor the docs layout
 * follows it: every `.hot-example-preview` shrinks to 33px and every grid root to 0px. Handsontable
 * then measures the columns of each grid in that root. The ghost table it measures in carries the
 * root's `width: 100%`, so it is 0px wide and the cell text wraps down to its narrowest width. When
 * the viewport comes back, only the columns that were rendered while it was collapsed are measured
 * again. A column past them keeps the wrapped width, its text wraps, and the rows grow. On
 * `export-to-csv` that added 240px to the page in most renders (DEV-3458), and only some of them,
 * so the golden record flipped between two heights.
 *
 * A `min-width` on the root element keeps the layout at a usable width through the collapse, so no
 * grid ever measures in a root it cannot fit in. It changes nothing at the suite's viewport.
 *
 * @param page The page about to be captured.
 */
export async function holdLayoutWidth(page: Page): Promise<void> {
  await page.addStyleTag({ content: `html { min-width: ${CAPTURE_MIN_LAYOUT_WIDTH}px; }` });
}
