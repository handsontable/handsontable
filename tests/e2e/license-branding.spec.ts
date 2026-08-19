import { test, expect } from '../fixtures/test';
import { LicenseBrandingPage, INSTANT } from '../fixtures/pages/LicenseBrandingPage';

/**
 * DEV-2562: the branding surface of an entitlement license key — the corner
 * badge and its popover while a trial runs and once it has expired, and the
 * Core-owned lock screen after the grace period.
 *
 * Every case pins the clock before the grid initializes, because the key is
 * read exactly once, at initialization. Migrated from the frozen Jasmine
 * suite; the DOM-level checks it kept (the CSS glyph inside the corner cell,
 * the click-through badge, the modal focus trap) are the ones only a real
 * browser can make.
 */
test.describe('entitlement license key branding', () => {
  let license: LicenseBrandingPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    license = new LicenseBrandingPage(page, theme, bundle);
  });

  test.describe('a running trial', () => {
    test('shows the corner badge with its hover tooltip, and nothing else', async () => {
      await license.goto(INSTANT.duringTrial);

      await expect(license.badge).toBeAttached();
      await expect(license.popoverTitle).toHaveText('Handsontable Trial');
      // A hover tooltip does not open by itself, and a running trial has no bar and no lock.
      await expect(license.popover).not.toHaveClass(/is-open/);
      await expect(license.bar).toHaveCount(0);
      await expect(license.lock).toHaveCount(0);
    });

    test('paints the glyph inside the corner header cell, never overflowing it', async ({ page }) => {
      await license.goto(INSTANT.duringTrial);

      await expect(page.locator('.ht-license-badge-on')).toBeAttached();

      const glyph = await license.cornerGlyph();

      // The glyph is CSS-rendered inside the corner cell itself, so it cannot leave the corner.
      expect(glyph.maskImage).not.toBe('none');
      expect(glyph.widthPx).toBeLessThanOrEqual(glyph.cellWidthPx);
      expect(glyph.heightPx).toBeLessThanOrEqual(glyph.cellHeightPx);

      // The popover anchor tracks the measured corner width; the measurement arrives from an
      // observer after layout, so it is awaited rather than read once.
      await expect.poll(() => license.popoverAnchorWidthPx())
        .toBe(`${await license.cornerWidthPx()}px`);
    });

    test('scales the glyph down inside a corner narrower than it', async () => {
      await license.goto(INSTANT.duringTrial, { variant: 'narrow-corner' });

      const glyph = await license.cornerGlyph();

      // `min(20px, 100%)` clamps the glyph to the cell — a 16px corner must not spill a 20px glyph.
      expect(glyph.cellWidthPx).toBeLessThan(20);
      expect(glyph.widthPx).toBeLessThanOrEqual(glyph.cellWidthPx);
    });

    test('does not leak the glyph into a nested grid', async () => {
      await license.goto(INSTANT.duringTrial, { variant: 'nested' });

      // Open the `handsontable` cell type editor, so the nested grid renders its own corner clone
      // inside this root — the corner a root-scoped CSS selector would wrongly match.
      await license.openNestedEditor(0, 0);

      const nestedCorner = license.nestedCorner();

      // Only this grid's own corner carries the marker and paints the glyph...
      expect((await license.cornerGlyph()).maskImage).not.toBe('none');
      // ...the nested grid's corner gets neither the marker nor a stray "H." glyph.
      await expect(nestedCorner).not.toHaveClass(/ht-license-badge-corner/);
      expect((await license.cornerGlyph(nestedCorner.locator('thead tr:first-child th:first-child'))).maskImage)
        .toBe('none');
    });

    test('does not pop the tooltip over frozen data cells when there are no headers', async ({ page }) => {
      await license.goto(INSTANT.duringTrial, { variant: 'no-headers-frozen' });

      // Without headers the corner clone still exists — it holds the user's frozen DATA cells.
      await expect(license.badgeWrapper).toHaveClass(/is-cornerless/);

      await page.locator('.ht_clone_top_inline_start_corner tbody td').first().hover();

      await expect(license.badgeWrapper).not.toHaveClass(/is-corner-hover/);
      await expect(license.popover).toBeHidden();
    });
  });

  test.describe('a trial inside its grace period', () => {
    test('opens the popover by itself and shows the bar under the grid', async () => {
      await license.goto(INSTANT.trialSoftStop);

      await expect(license.bar).toContainText('Your Handsontable license key has expired');
      await expect(license.popover).toHaveClass(/is-open/);
      await expect(license.popoverClose).toBeVisible();
      await expect(license.lock).toHaveCount(0);
      // Exactly one badge wrapper — a duplicate would mean a mount ran twice.
      await expect(license.badgeWrapper).toHaveCount(1);
    });

    test('re-anchors the popover when there is no corner cell, and restores the badge with one', async () => {
      await license.goto(INSTANT.trialSoftStop, { variant: 'no-row-headers' });

      // No corner -> nothing for the badge to sit on and nothing for the tail to point at, so the
      // auto-opened popover attaches to the grid's inline-start edge instead.
      await expect(license.badgeWrapper).toHaveClass(/is-cornerless/);
      await expect(license.badge).toBeHidden();
      await expect(license.popover).toHaveClass(/is-open/);
      expect(await license.isPopoverFlushWithGridStart()).toBe(true);

      await license.updateSettings({ rowHeaders: true });

      await expect(license.badgeWrapper).not.toHaveClass(/is-cornerless/);
      await expect(license.badge).not.toBeHidden();
    });

    test('closes the popover while hovered, and shows it again on the next corner hover', async ({ page }) => {
      await license.goto(INSTANT.trialSoftStop);

      await expect(license.popover).toBeVisible();

      // The pointer is still over the popover when the close button is clicked. Removing `is-open`
      // alone would leave the hover rule showing it, so closing has to win over the hover.
      await license.popover.hover();
      await license.popoverClose.click();

      await expect(license.popover).not.toHaveClass(/is-open/);
      await expect(license.popover).toBeHidden();

      // Moving the pointer across the grid does not bring it back...
      await page.locator('.ht_master tbody td').last().hover();

      await expect(license.popover).toBeHidden();

      // ...and hovering the corner shows it again as a plain tooltip.
      await license.cornerHeaderCell.hover();

      await expect(license.badgeWrapper).toHaveClass(/is-corner-hover/);
      await expect(license.popover).toBeVisible();
    });

    test('keeps the corner select-all click working underneath the badge', async () => {
      await license.goto(INSTANT.trialSoftStop);

      // The badge is click-through (`pointer-events: none`), so the hit target at its centre is the
      // corner header below it.
      expect(await license.isBadgeClickThrough()).toBe(true);

      await license.cornerHeaderCell.click();

      const { rows, columns } = await license.gridSize();

      expect(await license.selectedRanges()).toEqual([[-1, -1, rows - 1, columns - 1]]);
    });
  });

  test.describe('a trial past its grace period', () => {
    test('mounts a blocking, non-closable lock and moves focus into it', async ({ page }) => {
      await license.goto(INSTANT.trialHardStop);

      await expect(license.lock).toBeVisible();
      await expect(license.lock).toHaveAttribute('role', 'alertdialog');
      await expect(license.lock).toContainText('Your Handsontable trial license key expired on 2026-09-26.');
      // The lock owns the keyboard: focus lands on its only action, and Escape does not dismiss it
      // (there is no Close button and no Escape shortcut — the hard stop is final).
      await expect(license.lockContactButton).toBeFocused();
      await expect(license.lock).not.toContainText('Close');

      await page.keyboard.press('Escape');

      await expect(license.lock).toBeVisible();
      await expect(license.lockContactButton).toBeFocused();
    });

    test('keeps the lock across a settings update', async () => {
      await license.goto(INSTANT.trialHardStop);

      await license.updateSettings({ rowHeaders: true });

      await expect(license.lock).toBeVisible();
    });

    test('is unaffected by the app using the Dialog plugin for its own dialogs', async () => {
      await license.goto(INSTANT.trialHardStop, { variant: 'dialog' });

      await expect(license.lock).toBeVisible();

      // The lock does not live on the shared Dialog plugin surface: the app showing and hiding its
      // own dialogs neither replaces nor dismisses it.
      await license.showAndHideAppDialog();

      expect(await license.isAppDialogVisible()).toBe(false);
      await expect(license.lock).toBeVisible();
    });

    test('takes the lock down with the instance', async () => {
      await license.goto(INSTANT.trialHardStop);

      await expect(license.lock).toBeVisible();

      await license.destroyGrid();

      await expect(license.lock).toHaveCount(0);
    });
  });

  test.describe('a key that cannot be read, and no key at all', () => {
    // DEV-2562: the two install faults BLOCK from 18.1 on (the specification's S4.5 shape). Their
    // sentences moved out of the bottom bar and into the modal, so the bar must be gone.
    const FAULTS = [
      { key: 'tampered', title: 'The license key for Handsontable is invalid.' },
      { key: 'missing', title: 'The license key for Handsontable is missing.' },
    ] as const;

    for (const { key, title } of FAULTS) {
      test(`blocks the grid with a non-closable modal, and no bar, for a "${key}" key`, async ({ page }) => {
        await license.goto(INSTANT.duringTrial, { key });

        await expect(license.lock).toBeVisible();
        await expect(license.lock).toHaveAttribute('role', 'alertdialog');
        await expect(license.lock).toContainText(title);
        // The bar is withdrawn: one surface says it, not two. And no badge - that is the trial's.
        await expect(license.bar).toHaveCount(0);
        await expect(license.badge).toHaveCount(0);

        // Support, not sales: an unreadable or absent key is an installation fault.
        await expect(license.lockSupportButton).toBeFocused();
        await expect(license.lockDocsLink).toBeVisible();
        await expect(license.lock).not.toContainText('Close');

        await page.keyboard.press('Escape');

        await expect(license.lock).toBeVisible();
      });
    }

    test('keeps the documentation link inside the modal focus trap', async ({ page }) => {
      await license.goto(INSTANT.duringTrial, { key: 'missing' });

      await expect(license.lockSupportButton).toBeFocused();

      // Tab cycles the modal's own controls - the button and the link - and never leaves.
      await page.keyboard.press('Tab');

      await expect(license.lockDocsLink).toBeFocused();

      await page.keyboard.press('Tab');

      await expect(license.lockSupportButton).toBeFocused();
    });

    test('leaves a lapsed legacy key with its bottom bar and no modal', async () => {
      await license.goto(INSTANT.duringTrial, { key: 'legacy-expired' });

      // Only the two install faults block. A key that was valid and merely lapsed keeps the bar it
      // has always had, so an application out of maintenance is never taken off the air.
      await expect(license.bar).toContainText('expired on');
      await expect(license.lock).toHaveCount(0);
    });
  });

  test.describe('a subscription past its grace period', () => {
    // A hard-stopped subscription is developer-facing only, however the key was issued: a console
    // error and no front-end surface at all. 18.1 never blocks a paying customer.
    for (const key of ['subscription', 'subscription-external'] as const) {
      test(`stays console-only for a "${key}" key: no lock, no bar, no badge`, async () => {
        await license.goto(INSTANT.subscriptionHardStop, { key });

        await expect(license.lock).toHaveCount(0);
        await expect(license.bar).toHaveCount(0);
        await expect(license.badge).toHaveCount(0);
      });
    }
  });
});
