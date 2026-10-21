import { type Page } from '@playwright/test';
import { test, expect, THEMES_TAG } from '../fixtures/test';
import { NotificationStatesPage, type Box, type Corner } from '../fixtures/pages/NotificationStatesPage';

/**
 * Where a notification toast is anchored and how it is laid out, asserted from DOM rects for each corner
 * the visual suite's `/notification-demo` route photographed, on every theme. Per corner, one test
 * asserts the toast itself, in LTR and on one RTL corner (the layout has no corner term): the variant the
 * demo gives that corner, its accent bar at the inline start (none on `info`), its texts, the primary
 * action before the secondary one in reading order, its close button at the inline end, the toast taking
 * no focus, and the toast 20 px in from its corner of the notification layer (the stack's 10 px offset
 * plus its 10 px padding, in `_notification.scss`). A second test asserts the same 20 px against the
 * grid's root, in both grid directions. The Jasmine spec asserts which stack a toast joins
 * (`notification.spec.js`, "should place toasts in the stack that matches position"); nothing asserted
 * where that stack is drawn. The captures that stay under `visual-tests/tests/js-only/notification/` are
 * of how each variant looks.
 *
 * The root-relative placement follows the grid, not the wider root wrapper: an end-corner toast of a 400 px
 * grid sits in the grid's corner and not at the container's far edge, and a bottom-corner toast sits above
 * the pager and below a top slot's bottom edge, not over them. A grid that follows its content keeps its
 * bottom toast inside the container.
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

test.describe('notification placement', { tag: THEMES_TAG }, () => {
  for (const dir of ['ltr', 'rtl'] as const) {
    for (const corner of CORNERS) {
      const variant = VARIANTS[corner];

      // The variant and the layout direction have no corner term: one RTL corner proves the rtl layout.
      if (dir === 'ltr' || corner === 'top-end') {
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
      }

      const placementTitle = `a ${corner} toast sits in that corner of a ${dir.toUpperCase()} grid`;
      const placement = async({ page, theme, bundle }: Fixtures) => {
        const notificationPage = new NotificationStatesPage(page, theme, bundle);

        await notificationPage.goto(corner, dir);

        const { toast, root } = await notificationPage.geometry(variant);

        expectInCorner(toast, root, corner, dir, 'grid root');
      };

      test(placementTitle, placement);
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

  // LTR only: the slots have no direction term, which the corner cases above already prove.
  test('a bottom-start toast in a LTR grid with a pager sits in the grid\'s corner, above the pager', async({
    page, theme, bundle,
  }) => {
    const notificationPage = new NotificationStatesPage(page, theme, bundle);

    await notificationPage.goto('bottom-start', 'ltr', { pager: true });

    const { toast, root, pager } = await notificationPage.geometry('warning');

    expect(pager).not.toBeNull();
    expect(toast.bottom).toBeLessThanOrEqual(pager!.top);
    expectInCorner(toast, root, 'bottom-start', 'ltr', 'grid root');
  });

  test('a top-start toast in a LTR grid under a top slot sits in the grid\'s corner', async({
    page, theme, bundle,
  }) => {
    const notificationPage = new NotificationStatesPage(page, theme, bundle);

    await notificationPage.goto('top-start', 'ltr');
    await page.evaluate(() => {
      const slot = document.createElement('div');

      slot.style.height = '60px';
      (window as unknown as { hot: { getLayoutManager(): { register(k: string, e: HTMLElement, o: object): void } } })
        .hot.getLayoutManager().register('dev-top-slot', slot, { side: 'top' });
    });

    await expect.poll(async() => {
      const { toast, root } = await notificationPage.geometry('info');

      return Math.round(toast.top - root.top);
    }).toBe(CORNER_INSET_PX);
  });

  test('a bottom-end toast of a grid that follows its content stays inside the container', async({
    page, theme, bundle,
  }) => {
    const notificationPage = new NotificationStatesPage(page, theme, bundle);

    await notificationPage.goto('bottom-end', 'ltr');
    await page.evaluate(() => {
      const hot = (window as unknown as { hot: { rootContainer: HTMLElement; updateSettings(s: object): void } }).hot;

      hot.rootContainer.style.height = '300px';
      hot.updateSettings({ height: 'auto', data: Array.from({ length: 100 }, (_, row) => [row, row, row, row]) });
    });

    await expect.poll(async() => {
      const { toast, root } = await notificationPage.geometry('error');
      const container = await page.evaluate(() => (window as unknown as { hot: { rootContainer: HTMLElement } })
        .hot.rootContainer.getBoundingClientRect().bottom);

      return { insideContainer: toast.bottom <= container, tall: root.bottom - root.top > 300 };
    }).toEqual({ insideContainer: true, tall: true });
  });

  test('an end-corner toast follows the grid when its width changes', async({ page, theme, bundle }) => {
    const notificationPage = new NotificationStatesPage(page, theme, bundle);

    await notificationPage.goto('top-end', 'ltr');
    await page.evaluate(() => {
      (window as unknown as { hot: { updateSettings(s: object): void } }).hot.updateSettings({ width: 260 });
    });

    await expect.poll(async() => {
      const { toast, root } = await notificationPage.geometry('success');

      return Math.round(root.right - toast.right);
    }).toBe(20);
  });

  test('an end-corner toast stays in the grid corner under a scaled container', async({ page, theme, bundle }) => {
    const notificationPage = new NotificationStatesPage(page, theme, bundle);

    await notificationPage.goto('top-end', 'rtl');
    await page.evaluate(() => {
      document.body.style.transform = 'scale(0.5)';
      document.body.style.transformOrigin = '0 0';
      (window as unknown as { hot: { updateSettings(s: object): void } }).hot.updateSettings({ width: 260 });
    });

    await expect.poll(async() => {
      const { toast, root } = await notificationPage.geometry('success');

      return Math.round(toast.left - root.left);
    }).toBe(10);
  });

  test('a toast shown while the grid is hidden lands in the grid corner once it is revealed', async({
    page, theme, bundle,
  }) => {
    const notificationPage = new NotificationStatesPage(page, theme, bundle);

    await notificationPage.goto('top-start', 'ltr');
    await page.evaluate(() => {
      // Clear the toast shown on load so the measured one is the only toast.
      (window as unknown as { hot: { getPlugin(name: string): { hideAll(): void } } })
        .hot.getPlugin('notification').hideAll();
    });
    await expect(page.locator('.ht-notification__toast')).toHaveCount(0);
    await page.evaluate(() => {
      document.body.style.display = 'none';
    });
    await notificationPage.showToast('top-end', 'success');
    await page.evaluate(() => {
      document.body.style.display = '';
      (window as unknown as { hot: { refreshDimensions(): void } }).hot.refreshDimensions();
    });

    await expect.poll(() => page.evaluate(() => {
      const toast = document.querySelector('.ht-notification__toast')!.getBoundingClientRect();
      const root = (window as unknown as { hot: { rootElement: HTMLElement } }).hot.rootElement
        .getBoundingClientRect();

      return Math.round(root.right - toast.right);
    })).toBe(20);
  });
});
