import { type Page } from '@playwright/test';
import { test, expect } from '../fixtures/test';
import { NotificationStatesPage, type Box, type Corner } from '../fixtures/pages/NotificationStatesPage';

/**
 * Where a notification toast is anchored and how it is laid out, asserted from DOM rects for each corner
 * the visual suite's `/notification-demo` route photographed, in both grid directions and on every theme
 * and bundle. Per corner, one test asserts the toast itself: the variant the demo gives that corner, its
 * accent bar at the inline start (none on `info`), its texts, the primary action before the secondary one
 * in reading order, its close button at the inline end, the toast taking no focus, and the toast 20 px in
 * from its corner of the notification layer (the stack's 10 px offset plus its 10 px padding, in
 * `_notification.scss`). A second test asserts the same 20 px against the grid's root. The Jasmine spec
 * asserts which stack a toast joins (`notification.spec.js`, "should place toasts in the stack that
 * matches position"); nothing asserted where that stack is drawn. The captures that stay under
 * `visual-tests/tests/js-only/notification/` are of how each variant looks.
 *
 * The root-relative placement is parked for the end corners, and for a bottom corner over the pager: the
 * notification layer spans the root wrapper, which is as wide as the container and as tall as the grid
 * plus its bottom slot, so a toast in an end corner of a 400 px grid lands at the container's far edge,
 * about 850 px from the grid, and a bottom-corner toast covers the pager.
 */

const CORNER_INSET_PX = 20;
const EDGE_TOLERANCE_PX = 0.5;
const ACCENT_WIDTH_PX = 4;
const VARIANTS: Record<Corner, string> = {
  'top-start': 'info',
  'top-end': 'success',
  'bottom-start': 'warning',
  'bottom-end': 'error',
};
const CORNERS = Object.keys(VARIANTS) as Corner[];

type Fixtures = { page: Page; theme: string; bundle: string };

/**
 * Asserts that the toast sits 20 px in from both edges of its corner of `frame`, and clear of the far
 * edges.
 *
 * @param {Box} toast The toast.
 * @param {Box} frame The box the corner belongs to.
 * @param {Corner} corner The corner.
 * @param {'ltr'|'rtl'} dir The layout direction.
 * @param {string} frameName What `frame` is, for the messages.
 */
function expectInCorner(toast: Box, frame: Box, corner: Corner, dir: 'ltr' | 'rtl', frameName: string) {
  const [block, inline] = corner.split('-') as ['top' | 'bottom', 'start' | 'end'];
  // The inline start is the left edge in LTR and the right edge in RTL.
  const onLeft = (inline === 'start') === (dir === 'ltr');
  const gapAbove = toast.top - frame.top;
  const gapBelow = frame.bottom - toast.bottom;
  const gapLeft = toast.left - frame.left;
  const gapRight = frame.right - toast.right;

  expect(Math.abs((block === 'top' ? gapAbove : gapBelow) - CORNER_INSET_PX), `${block} inset from the ${frameName}`)
    .toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
  expect(Math.abs((onLeft ? gapLeft : gapRight) - CORNER_INSET_PX), `${inline} inset from the ${frameName}`)
    .toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
  // And it is not merely touching the opposite edges too: the toast is narrower and shorter than the
  // frame, so the far gaps are wider than the inset.
  expect(block === 'top' ? gapBelow : gapAbove, `far ${block === 'top' ? 'bottom' : 'top'} gap`)
    .toBeGreaterThan(CORNER_INSET_PX);
  expect(onLeft ? gapRight : gapLeft, `far ${onLeft ? 'right' : 'left'} gap`).toBeGreaterThan(CORNER_INSET_PX);
}

test.describe('notification placement', () => {
  for (const dir of ['ltr', 'rtl'] as const) {
    for (const corner of CORNERS) {
      const variant = VARIANTS[corner];

      test(`a ${corner} toast in a ${dir.toUpperCase()} grid is the ${variant} variant, laid out ${dir} in its `
        + 'corner of the notification layer', async({ page, theme, bundle }) => {
        const notificationPage = new NotificationStatesPage(page, theme, bundle);

        await notificationPage.goto(corner, dir);

        await expect(notificationPage.stack(corner).locator('.ht-notification__toast')).toHaveCount(1);
        await expect(notificationPage.toast).toHaveClass(new RegExp(`\\bht-notification__toast--${variant}\\b`));
        await expect(notificationPage.toast.locator('.ht-notification__title')).toHaveText(corner.replace(/-/g, ' '));
        await expect(notificationPage.toast.locator('.ht-notification__message')).toHaveText('Notification visual test.');
        await expect(notificationPage.toast.locator('.ht-notification__actions .ht-button--primary'))
          .toHaveText('Action');
        await expect(notificationPage.toast.locator('.ht-notification__actions .ht-button--secondary'))
          .toHaveText('Action');

        const geometry = await notificationPage.geometry(variant);
        const { toast, close, title, primary, secondary, accent } = geometry;

        expect(geometry.hostDir).toBe(dir);
        expectInCorner(toast, geometry.host, corner, dir, 'notification layer');

        if (dir === 'ltr') {
          // The close button at the toast's inline end, the primary action first in reading order.
          expect(toast.right - close.right).toBeLessThan(close.left - toast.left);
          expect(primary.right).toBeLessThanOrEqual(secondary.left);
        } else {
          expect(close.left - toast.left).toBeLessThan(toast.right - close.right);
          expect(primary.left).toBeGreaterThanOrEqual(secondary.right);
        }

        if (variant === 'info') {
          expect(accent, 'an info toast draws no accent bar').toBeNull();
        } else {
          // The accent bar: the variant's token, a 4 px strip at the toast's inline start, before the texts.
          expect(accent).not.toBeNull();
          expect(geometry.accentColor).toBe(geometry.accentToken);
          expect(accent!.right - accent!.left).toBeCloseTo(ACCENT_WIDTH_PX, 0);

          if (dir === 'ltr') {
            expect(accent!.right).toBeLessThanOrEqual(title.left);
            expect(accent!.left - toast.left).toBeLessThan(toast.right - accent!.right);
          } else {
            expect(accent!.left).toBeGreaterThanOrEqual(title.right);
            expect(toast.right - accent!.right).toBeLessThan(accent!.left - toast.left);
          }
        }

        // A toast is non-blocking: showing it takes no focus.
        expect(geometry.focusInsideHost).toBe(false);
      });

      const placementTitle = `a ${corner} toast sits in that corner of a ${dir.toUpperCase()} grid`;
      const placement = async({ page, theme, bundle }: Fixtures) => {
        const notificationPage = new NotificationStatesPage(page, theme, bundle);

        await notificationPage.goto(corner, dir);

        const { toast, root } = await notificationPage.geometry(variant);

        expectInCorner(toast, root, corner, dir, 'grid root');
      };

      if (corner.endsWith('-end')) {
        // eslint-disable-next-line no-restricted-syntax -- DEV-3287: the notification layer spans the root wrapper, so an end-corner toast lands at the container's far edge, not the grid's
        test.fixme(placementTitle, placement);
      } else {
        test(placementTitle, placement);
      }
    }
  }

  test('a toast takes no focus: a selected cell keeps it while a second, animated toast shows', async({
    page, theme, bundle,
  }) => {
    const notificationPage = new NotificationStatesPage(page, theme, bundle);

    await notificationPage.goto('top-start', 'ltr', { animation: true });
    expect(await notificationPage.focusCell(1, 1)).toBe(true);

    // The positive controls: the second toast shows, and its enter animation runs to the end.
    await notificationPage.showToast('bottom-start', 'warning');
    await expect(notificationPage.stack('bottom-start').locator('.ht-notification__toast')).toHaveCount(1);
    await expect.poll(() => notificationPage.toastOpacity('bottom-start')).toBe('1');

    // Some frames later the cell still holds the focus, and the arrow keys still move the selection.
    expect(await notificationPage.focusAfterFrames(10)).toEqual({ unchanged: true, listening: true });
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => notificationPage.selected()).toEqual([[2, 1, 2, 1]]);
  });

  // eslint-disable-next-line no-restricted-syntax -- DEV-3287: the notification layer spans the root wrapper on the block axis too, so a bottom-corner toast covers the pager instead of sitting above it
  test.fixme('a bottom-start toast in a grid with a pager sits in the grid\'s corner, above the pager', async({
    page, theme, bundle,
  }) => {
    const notificationPage = new NotificationStatesPage(page, theme, bundle);

    await notificationPage.goto('bottom-start', 'ltr', { pager: true });

    const { toast, root, pager } = await notificationPage.geometry('warning');

    expect(pager).not.toBeNull();
    expect(toast.bottom).toBeLessThanOrEqual(pager!.top);
    expectInCorner(toast, root, 'bottom-start', 'ltr', 'grid root');
  });
});
