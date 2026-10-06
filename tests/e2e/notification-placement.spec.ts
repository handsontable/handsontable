import { type Page } from '@playwright/test';
import { test, expect } from '../fixtures/test';
import { NotificationStatesPage, type Corner } from '../fixtures/pages/NotificationStatesPage';

/**
 * Where a notification toast is anchored, asserted from DOM rects for each corner the visual suite's
 * `/notification-demo` route photographed, in both grid directions and on every theme and bundle: the
 * toast sits in its corner of the grid, 20 px in from both edges (the stack's 10 px offset plus its
 * 10 px padding, in `_notification.scss`), its variant is the one the demo gives that corner, and its
 * close button is at its inline end. The Jasmine spec asserts which stack a toast joins
 * (`notification.spec.js`, "should place toasts in the stack that matches position"); nothing asserted
 * where that stack is drawn. The captures that stay under `visual-tests/tests/js-only/notification/`
 * are of how each variant looks.
 *
 * The end corners are parked: the notification layer spans the root wrapper, which is as wide as the
 * container, so a toast in an end corner of a 400 px grid lands at the container's far edge, about
 * 850 px away from the grid.
 */

const CORNER_INSET_PX = 20;
const EDGE_TOLERANCE_PX = 0.5;
const VARIANTS: Record<Corner, string> = {
  'top-start': 'info',
  'top-end': 'success',
  'bottom-start': 'warning',
  'bottom-end': 'error',
};
const CORNERS = Object.keys(VARIANTS) as Corner[];

test.describe('notification placement', () => {
  for (const dir of ['ltr', 'rtl'] as const) {
    for (const corner of CORNERS) {
      const title = `a ${corner} toast sits in that corner of a ${dir.toUpperCase()} grid`;
      const body = async({ page, theme, bundle }: { page: Page; theme: string; bundle: string }) => {
        const notificationPage = new NotificationStatesPage(page, theme, bundle);

        await notificationPage.goto(corner, dir);

        await expect(notificationPage.stack(corner).locator('.ht-notification__toast')).toHaveCount(1);
        await expect(notificationPage.toast).toHaveClass(new RegExp(`\\bht-notification__toast--${VARIANTS[corner]}\\b`));
        await expect(notificationPage.toast.locator('.ht-notification__title')).toHaveText(corner.replace(/-/g, ' '));
        await expect(notificationPage.toast.locator('.ht-notification__message')).toHaveText('Notification visual test.');
        await expect(notificationPage.toast.locator('.ht-notification__actions .ht-button--primary'))
          .toHaveText('Primary action');
        await expect(notificationPage.toast.locator('.ht-notification__actions .ht-button--secondary'))
          .toHaveText('Secondary action');

        const { toast, close, root, hostDir, focusInsideHost } = await notificationPage.geometry();

        expect(hostDir).toBe(dir);

        const [block, inline] = corner.split('-') as ['top' | 'bottom', 'start' | 'end'];
        // The inline start is the left edge in LTR and the right edge in RTL.
        const onLeft = (inline === 'start') === (dir === 'ltr');
        const gapAbove = toast.top - root.top;
        const gapBelow = root.bottom - toast.bottom;
        const gapLeft = toast.left - root.left;
        const gapRight = root.right - toast.right;

        expect(Math.abs((block === 'top' ? gapAbove : gapBelow) - CORNER_INSET_PX), `${block} inset`)
          .toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
        expect(Math.abs((onLeft ? gapLeft : gapRight) - CORNER_INSET_PX), `${inline} inset`)
          .toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
        // And it is not merely touching the opposite edges too: the toast is narrower and shorter than
        // the grid, so the far gaps are wider than the inset.
        expect(block === 'top' ? gapBelow : gapAbove).toBeGreaterThan(CORNER_INSET_PX);
        expect(onLeft ? gapRight : gapLeft).toBeGreaterThan(CORNER_INSET_PX);

        // The close button sits at the toast's inline end.
        if (dir === 'ltr') {
          expect(toast.right - close.right).toBeLessThan(close.left - toast.left);
        } else {
          expect(close.left - toast.left).toBeLessThan(toast.right - close.right);
        }

        // A toast is non-blocking: showing it takes no focus.
        expect(focusInsideHost).toBe(false);
      };

      if (corner.endsWith('-end')) {
        // eslint-disable-next-line no-restricted-syntax -- DEV-3287: the notification layer spans the root wrapper, so an end-corner toast lands at the container's far edge, not the grid's
        test.fixme(title, body);
      } else {
        test(title, body);
      }
    }
  }
});
