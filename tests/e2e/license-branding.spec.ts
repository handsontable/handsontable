import { test, expect, THEMES_TAG } from '../fixtures/test';
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
test.describe('entitlement license key branding', { tag: THEMES_TAG }, () => {
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

    test('reads a trial key license-key 4.x issued exactly like a current one', async () => {
      // The trial keys already in the field are in the earlier format. They must keep reading as a
      // running trial, not as an unreadable key that blocks the grid.
      await license.goto(INSTANT.duringTrial, { key: 'trial-v1' });

      await expect(license.badge).toBeAttached();
      await expect(license.popoverTitle).toHaveText('Handsontable Trial');
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

    test('paints the new logo with a blue dot at the foot of the "H"', async ({ page }) => {
      await license.goto(INSTANT.duringTrial);

      await expect(page.locator('.ht-license-badge-on')).toBeAttached();

      const glyph = await license.cornerGlyph();

      // The mask is the whole logomark; the dot is a background layer clipped by it, so a hover
      // that darkens `background-color` leaves the dot blue.
      expect(glyph.backgroundImage).toMatch(/^url\(/);
      expect(glyph.backgroundImage.toLowerCase()).toContain('%231a42e8');
      expect(glyph.backgroundSize).toBe('contain');

      // What the browser really paints: the blue ink is the dot, a 3.2px square sitting at the foot of
      // the "H" (the gray ink). A dot layer that drifts off the mask, or is clipped away by it, paints no
      // blue, or a blue that is not at the foot of the "H".
      const { blue, ink } = await license.cornerGlyphPaint();

      expect(blue).not.toBeNull();
      expect(ink).not.toBeNull();
      expect(blue!.maxX - blue!.minX).toBeGreaterThanOrEqual(2);
      expect(blue!.maxX - blue!.minX).toBeLessThanOrEqual(4.5);
      expect(blue!.maxY - blue!.minY).toBeGreaterThanOrEqual(2);
      expect(blue!.maxY - blue!.minY).toBeLessThanOrEqual(4.5);
      // In the 16px box the dot starts 7.96px right of the "H"'s left edge and ends 12.82px below its top
      // edge (the logomark's viewBox); measured from the "H" so the check does not depend on where the
      // cell puts the glyph.
      expect(Math.abs((blue!.minX - ink!.minX) - 7.96)).toBeLessThanOrEqual(1.5);
      expect(Math.abs((blue!.maxY - ink!.minY) - 12.82)).toBeLessThanOrEqual(1.5);
    });

    test('keeps the dot blue while the pointer is over the corner', async () => {
      await license.goto(INSTANT.duringTrial);

      const restingGlyph = await license.cornerGlyph();
      const before = await license.cornerGlyphPaint();

      await license.cornerHeaderCell.hover();

      const glyph = await license.cornerGlyph();
      const after = await license.cornerGlyphPaint();

      // The hover state is really in effect: it darkens the "H" through `background-color`...
      expect(glyph.backgroundColor).not.toBe(restingGlyph.backgroundColor);
      // ...and leaves the dot layer, and the blue it paints, alone.
      expect(glyph.backgroundImage.toLowerCase()).toContain('%231a42e8');
      expect(after.blue).toEqual(before.blue);
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

      // The badge is click-through (`pointer-events: none`), so the hit target at its center is the
      // corner header below it.
      expect(await license.isBadgeClickThrough()).toBe(true);

      await license.cornerHeaderCell.click();

      const { rows, columns } = await license.gridSize();

      expect(await license.selectedRanges()).toEqual([[-1, -1, rows - 1, columns - 1]]);
    });
  });

  test.describe('a trial past its grace period', () => {
    test('mounts a blocking, non-closable lock', async () => {
      await license.goto(INSTANT.trialHardStop);

      await expect(license.lock).toBeVisible();
      await expect(license.lock).toHaveAttribute('role', 'alertdialog');
      await expect(license.lock).toContainText('Your Handsontable trial license key expired on 2026-09-26.');
      // There is no Close button and no Escape shortcut — the hard stop is final.
      await expect(license.lock).not.toContainText('Close');
    });

    test('paints the grayed logomark in the lock strip without the blue dot', async () => {
      await license.goto(INSTANT.trialHardStop);

      const glyph = await license.lockGlyph();

      expect(glyph.maskImage).not.toBe('none');
      expect(glyph.backgroundImage).toBe('none');
      // The box has the logomark's own 11.1415:16 proportions, so its "H" starts at the start padding
      // in both text directions.
      expect(glyph.widthPx / glyph.heightPx).toBeCloseTo(11.1415 / 16, 2);
    });

    test('owns the keyboard once the user reaches it, and Escape does not dismiss it', async ({ page }) => {
      await license.goto(INSTANT.trialHardStop);

      // The lock covers the whole grid, so this is the click any user trying to use the grid makes.
      // The focus scope activates on it and focus lands on the lock's only action.
      await license.lock.click();

      await expect(license.lockContactButton).toBeFocused();

      await page.keyboard.press('Escape');

      await expect(license.lock).toBeVisible();
      await expect(license.lockContactButton).toBeFocused();
    });

    test('keeps the lock across a settings update', async () => {
      await license.goto(INSTANT.trialHardStop);

      await license.updateSettings({ rowHeaders: true });

      await expect(license.lock).toBeVisible();
    });

    // DEV-2709. `no-ui-warns` suppresses license WARNINGS; the hard stop is enforcement, not a
    // warning, so the lock must survive the flag. This is driven through a real key so the whole
    // chain is covered - payload read, `resolveChannels`, then the branding routing. The unit test
    // for the same rule mocks `_getLicenseState`, so it cannot see a regression in flag resolution.
    test('still blocks when the key carries no-ui-warns', async () => {
      await license.goto(INSTANT.trialHardStop, { key: 'trial-external' });

      await expect(license.lock).toBeVisible();
      await expect(license.lock).toContainText('Your Handsontable trial license key expired on 2026-09-26.');
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

  test.describe('a trial issued for external use', () => {
    // The other half of the same flag, asserted where it actually bites. At the HARD stop the badge
    // and bar are absent for every key - the lock branch returns before the badge is mounted, and
    // `_rendersBlockingModal` withholds the bar - so asserting their absence there proves nothing.
    // The soft stop is the instant where an unflagged trial shows both, so this is the comparison
    // that fails if `resolveChannels` ever stops reading `no-ui-warns`.
    test('shows the badge and the bar without the flag, and neither with it', async () => {
      await license.goto(INSTANT.trialSoftStop, { key: 'trial' });

      await expect(license.badgeWrapper).toHaveCount(1);
      await expect(license.bar).toContainText('Your Handsontable license key has expired');

      await license.goto(INSTANT.trialSoftStop, { key: 'trial-external' });

      await expect(license.badgeWrapper).toHaveCount(0);
      await expect(license.bar).toHaveCount(0);
    });
  });

  test.describe('a key that cannot be read, and no key at all', () => {
    // DEV-2562: the two install faults BLOCK from 18.1 on (the specification's S4.5 shape). Their
    // sentences moved out of the bottom bar and into the modal, so the bar must be gone.
    const FAULTS = [
      { key: 'tampered', title: 'The license key for Handsontable is invalid.' },
      // A current key protects its text, so a key whose text was edited is an unreadable key as well.
      { key: 'edited-prose', title: 'The license key for Handsontable is invalid.' },
      { key: 'missing', title: 'The license key for Handsontable is missing.' },
      // PRO-1356: Handsontable 19.0 no longer recognizes the non-commercial key, so it locks the
      // grid as an invalid key does.
      { key: 'non-commercial', title: 'The license key for Handsontable is invalid.' },
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
        await expect(license.lockSupportButton).toBeVisible();
        await expect(license.lockDocsLink).toBeVisible();
        await expect(license.lock).not.toContainText('Close');
        // Focus is not taken at init; it lands on the action once the user reaches the lock.
        await expect(license.outsideField).toBeFocused();

        await license.lock.click();

        await expect(license.lockSupportButton).toBeFocused();

        await page.keyboard.press('Escape');

        await expect(license.lock).toBeVisible();
      });
    }

    test('keeps the documentation link inside the modal focus trap', async ({ page }) => {
      await license.goto(INSTANT.duringTrial, { key: 'missing' });

      // Focus has to be brought in first — the lock never claims it on its own.
      await license.lock.click();

      await expect(license.lockSupportButton).toBeFocused();

      // Tab cycles the modal's own controls - the button and the link - and never leaves.
      await page.keyboard.press('Tab');

      await expect(license.lockDocsLink).toBeFocused();

      await page.keyboard.press('Tab');

      await expect(license.lockSupportButton).toBeFocused();
    });

    test('keeps the modal copy inside a grid narrower than its longest token', async () => {
      // DEV-2192 gave the bottom bar a minimum width and a scrolling slot because its unbreakable
      // tokens overflowed narrow grids. The same sentences live in the modal now, and the modal is
      // only as wide as the grid - so the tokens have to break instead of sticking out.
      await license.goto(INSTANT.duringTrial, { key: 'missing', variant: 'narrow' });

      await expect(license.lock).toBeVisible();
      // The e-mail address is the longest unbreakable token left in the missing-key copy.
      await expect(license.lock).toContainText('support@handsontable.com');
      // PRO-1357: the lock no longer suggests the key the next major reads as invalid.
      await expect(license.lock).not.toContainText('non-commercial-and-evaluation');
      expect(await license.lockContentOverflowPx()).toBe(0);
    });

    test('does not lock a licensed grid whose key arrived with whitespace around it', async () => {
      await license.goto(INSTANT.duringTrial, { key: 'subscription-padded' });

      // A key pasted out of an email or a chat window commonly carries spaces and a trailing
      // newline around it. A licensed grid must survive the paste. The legacy form of this case is
      // the padded legacy key test below.
      await expect(license.lock).toHaveCount(0);
      await expect(license.bar).toHaveCount(0);
      await expect(license.outsideField).toBeFocused();
    });

    test('leaves a lapsed legacy key with its bottom bar and no modal', async () => {
      await license.goto(INSTANT.duringTrial, { key: 'legacy-expired' });

      // Only the two install faults block. A key that was valid and merely lapsed keeps the bar it
      // has always had, so an application out of maintenance is never taken off the air.
      await expect(license.bar).toContainText('expired on');
      await expect(license.lock).toHaveCount(0);
    });

    test('trims the whitespace around a legacy key before its checksum runs', async () => {
      await license.goto(INSTANT.duringTrial, { key: 'legacy-expired-padded' });

      // The 25-character alphabet has no whitespace, so an untrimmed key fails its checksum and
      // reads as an install fault, which BLOCKS. Trimmed, it is the lapsed key above: bar, no lock.
      await expect(license.bar).toContainText('expired on');
      await expect(license.lock).toHaveCount(0);
    });
  });

  test.describe('a subscription past its grace period', () => {
    // A hard-stopped subscription is developer-facing only, however the key was issued: a console
    // error and no front-end surface at all. 18.1 never blocks a paying customer.
    // `subscription-pasted` is the same key with its whitespace turned into CRLF line breaks and a
    // trailing "\n" saved as text, and `subscription-wrapped` the same key with its block broken
    // into lines as a mail client wraps it - both must read exactly like the original, or a
    // pasting customer's grid would block.
    for (const key of ['subscription', 'subscription-pasted', 'subscription-wrapped'] as const) {
      test(`stays console-only for a "${key}" key: no lock, no bar, no badge`, async () => {
        await license.goto(INSTANT.subscriptionHardStop, { key });

        await expect(license.lock).toHaveCount(0);
        await expect(license.bar).toHaveCount(0);
        await expect(license.badge).toHaveCount(0);
      });
    }
  });

  // DEV-3413: a trial key and a key with the `badge` flag show a "Powered by Handsontable DataGrid"
  // bar last in the bottom slot. It is branding, not a license warning, so `no-ui-warns` does not hide
  // it, and it is a separate element from the warning bar (`license.bar`).
  test.describe('the "Powered by Handsontable DataGrid" bar', () => {
    test('shows for a running trial, beside the corner badge and with no warning bar', async () => {
      await license.goto(INSTANT.duringTrial);

      await expect(license.poweredByLink).toBeVisible();
      await expect(license.poweredByLink).toHaveAttribute('href', 'https://handsontable.com');
      await expect(license.poweredByLink).toHaveAttribute('target', '_blank');
      await expect(license.poweredByLink).toHaveAttribute('rel', 'noopener noreferrer');
      // The logomark is decorative: the visible text is the link's whole name.
      await expect(license.poweredByLogo).toHaveAttribute('aria-hidden', 'true');
      await expect(license.badge).toBeAttached();
      await expect(license.bar).toHaveCount(0);
    });

    for (const key of ['sponsored-badge', 'sponsored-badge-external'] as const) {
      test(`shows for a "${key}" key, with no corner badge and no warning bar`, async () => {
        await license.goto(INSTANT.duringTrial, { key });

        await expect(license.poweredByLink).toBeVisible();
        await expect(license.badge).toHaveCount(0);
        await expect(license.bar).toHaveCount(0);
        await expect(license.lock).toHaveCount(0);
      });
    }

    test('shows for a trial issued for external use, whose `no-ui-warns` still hides the corner badge', async () => {
      // O-6: DEV-3413 keeps the bar on under `no-ui-warns`, for a trial as for a `badge` key.
      await license.goto(INSTANT.duringTrial, { key: 'trial-external' });

      await expect(license.poweredByLink).toBeVisible();
      await expect(license.badge).toHaveCount(0);
    });

    for (const key of ['sponsored-no-badge', 'subscription', 'legacy-expired'] as const) {
      test(`does not show for a "${key}" key`, async () => {
        await license.goto(INSTANT.duringTrial, { key });

        // The grid is up and licensed: the absence is a decision, not a page that never loaded.
        await expect(license.grid).toBeVisible();
        await expect(license.lock).toHaveCount(0);
        await expect(license.poweredBy).toHaveCount(0);
      });
    }

    for (const [key, instant] of [
      ['sponsored-badge', INSTANT.duringTrial],
      ['trial', INSTANT.trialSoftStop],
    ] as const) {
      test(`keeps the grid at its declared height of 200px, the bars inside it (a "${key}" key)`, async () => {
        // The bars mount after the height was written, and the slot observer is seeded after them, so
        // the height has to be re-applied once at init or the grid grows past 200px by the bars.
        await license.goto(instant, { key });

        await expect(license.poweredByLink).toBeVisible();

        const { root, bottomSlot } = await license.heightBudget();

        expect(bottomSlot).toBeGreaterThan(0);
        expect(root + bottomSlot).toBe(200);
      });
    }

    test('stays the last line, under the warning bar of a soft-stopped trial', async () => {
      await license.goto(INSTANT.trialSoftStop);

      await expect(license.bar).toBeVisible();
      await expect(license.poweredByLink).toBeVisible();

      const { isLastInSlot, slotClasses } = await license.poweredByGeometry();

      expect(isLastInSlot).toBe(true);
      expect(slotClasses.findIndex(name => name.includes('hot-display-license-info')))
        .toBeLessThan(slotClasses.findIndex(name => name.includes('ht-license-powered-by')));
    });

    test('follows the Figma frame on main and horizon, and the compact bar density on classic', async ({ theme }) => {
      await license.goto(INSTANT.duringTrial, { key: 'sponsored-badge' });

      const geometry = await license.poweredByGeometry();

      // Every theme: the 11.14 x 16 logomark in the brand's black (Figma fills the "H" `black`), the 8px
      // gap, and the text in the bar's text color, never the link color of `.handsontable a`.
      expect(geometry.logoWidth).toBe(11.1);
      expect(geometry.logoHeight).toBe(16);
      expect(geometry.gap).toBe(8);
      expect(geometry.maskImage).not.toBe('none');
      expect(geometry.textColor).toBe(geometry.barColor);
      expect(geometry.logoColor).toBe('rgb(0, 0, 0)');

      // The Figma frame (node 1424:19574) is drawn in the main theme, and horizon shares its density and
      // type scale: 8px x 16px padding, 12px / 18px text, the bar 34px tall inside its border, the
      // logomark at (16, 9) and the text at (35.14, 8). Classic runs every bar at the compact density
      // (4px x 8px) with 11px / 16px text. Offsets are measured inside the bar's border.
      const layout = {
        paddingTop: geometry.paddingTop,
        paddingInlineStart: geometry.paddingInlineStart,
        fontSize: geometry.fontSize,
        lineHeight: geometry.lineHeight,
        barHeight: geometry.barHeight,
        logoOffsetX: geometry.logoOffsetX,
        logoOffsetY: geometry.logoOffsetY,
        textOffsetX: geometry.textOffsetX,
        textOffsetY: geometry.textOffsetY,
      };

      if (theme === 'classic') {
        expect(layout).toEqual({
          paddingTop: 4, paddingInlineStart: 8, fontSize: '11px', lineHeight: '16px', barHeight: 24,
          logoOffsetX: 8, logoOffsetY: 4, textOffsetX: 27.1, textOffsetY: 4,
        });
      } else {
        expect(layout).toEqual({
          paddingTop: 8, paddingInlineStart: 16, fontSize: '12px', lineHeight: '18px', barHeight: 34,
          logoOffsetX: 16, logoOffsetY: 9, textOffsetX: 35.1, textOffsetY: 8,
        });
      }

      // #222 on #f7f7f9, the colors of the Figma frame.
      if (theme === 'main') {
        expect({ color: geometry.barColor, background: geometry.barBackground })
          .toEqual({ color: 'rgb(34, 34, 34)', background: 'rgb(247, 247, 249)' });
      }
    });

    test('changes nothing on hover: Figma draws no hover state for the bar', async () => {
      await license.goto(INSTANT.duringTrial, { key: 'sponsored-badge' });

      const readText = () => license.poweredByLink.evaluate((link) => {
        const style = getComputedStyle(link.querySelector('.ht-license-powered-by__text') as HTMLElement);

        return { color: style.color, decoration: style.textDecorationLine };
      });
      const resting = await readText();

      await license.poweredByLink.hover();

      // The theme's own `.handsontable a:hover` would recolor and underline it; the bar overrides both.
      await expect.poll(readText).toEqual(resting);
      expect(resting.decoration).toBe('none');
    });

    test('paints the logomark: a dark "H" with the brand-blue dot at its foot', async () => {
      await license.goto(INSTANT.duringTrial, { key: 'sponsored-badge' });

      const { blue, ink } = await license.poweredByLogoPaint();

      expect(ink).not.toBeNull();
      expect(blue).not.toBeNull();
      // The dot sits at the bottom end of the mark, below and after the "H".
      expect(blue!.minY).toBeGreaterThanOrEqual(ink!.minY);
      expect(blue!.maxX).toBeGreaterThanOrEqual(ink!.maxX);
    });

    for (const part of ['logo', 'text'] as const) {
      test(`opens handsontable.com in a new tab when its ${part} is clicked`, async ({ page }) => {
        await license.goto(INSTANT.duringTrial, { key: 'sponsored-badge' });

        const opened = await license.clickPoweredBy(part);

        await expect(opened).toHaveURL('https://handsontable.com/');
        // A new tab, not a navigation: the app's own page stays where it was.
        await expect(page).toHaveURL(/license-branding\.html/);
      });
    }

    test('is reached with Tab from the grid\'s last cell, and Shift+Tab goes back into the grid', async ({ page }) => {
      await license.goto(INSTANT.duringTrial, { key: 'sponsored-badge' });

      await license.selectCell(3, 2);
      await page.keyboard.press('Tab');

      await expect(license.poweredByLink).toBeFocused();

      await page.keyboard.press('Shift+Tab');

      await expect(license.poweredByLink).not.toBeFocused();
      await expect.poll(() => license.selectedRanges()).toEqual([[3, 2, 3, 2]]);
    });
  });
});
