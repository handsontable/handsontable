import { type Page, type Locator, expect } from '@playwright/test';

/**
 * The instants the license lifecycle is probed at. The trial key of the
 * fixture runs to 2026-09-26 with a 45-day notice and a 15-day grace period,
 * the subscription keys to 2027-08-12 with a 90-day one. A spec pins the clock
 * to one of these before navigating, so the state under test never depends on
 * the day the suite happens to run.
 */
export const INSTANT = {
  duringTrial: '2026-09-16T00:00:00Z',
  trialSoftStop: '2026-10-01T00:00:00Z',
  trialHardStop: '2026-10-12T00:00:00Z',
  subscriptionHardStop: '2027-12-01T00:00:00Z',
} as const;

type LicenseKeyName = 'trial' | 'subscription' | 'subscription-external' | 'tampered' |
  'legacy-expired' | 'missing';
type Variant = 'default' | 'no-row-headers' | 'no-headers-frozen' | 'narrow-corner' | 'dialog' | 'nested';

/**
 * Page Object for the license branding fixture.
 *
 * The branding surface has three parts: the corner "H." badge (a
 * screen-reader-only button plus a CSS glyph painted inside the corner header
 * cell), its popover (a hover tooltip while a trial runs, an auto-opening
 * dismissible one once it has expired), and the Core-owned lock screen that
 * covers the grid after the grace period. The license key is read once, at
 * initialization, so every scenario is one fresh page load at a pinned instant.
 */
export class LicenseBrandingPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly badgeWrapper: Locator;
  readonly badge: Locator;
  readonly popover: Locator;
  readonly popoverTitle: Locator;
  readonly popoverClose: Locator;
  readonly bar: Locator;
  readonly lock: Locator;
  readonly lockContactButton: Locator;
  readonly lockSupportButton: Locator;
  readonly lockDocsLink: Locator;
  readonly corner: Locator;
  readonly cornerHeaderCell: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.badgeWrapper = page.locator('.ht-license-badge-wrapper');
    this.badge = page.locator('.ht-license-badge');
    this.popover = page.locator('.ht-license-popover');
    this.popoverTitle = page.locator('.ht-license-popover__title');
    this.popoverClose = page.locator('.ht-license-popover__close');
    this.bar = page.locator('.hot-display-license-info');
    this.lock = page.locator('.ht-license-lock');
    this.lockContactButton = this.lock.getByRole('button', { name: 'Contact Sales' });
    this.lockSupportButton = this.lock.getByRole('button', { name: 'Contact Support' });
    this.lockDocsLink = this.lock.getByRole('link', { name: 'Read more' });
    // This grid's OWN corner clone, marked by the class the branding stamps on it. A nested grid
    // (the `handsontable` cell type) renders a corner clone of its own inside the same root, and a
    // structural `.ht_clone_top_inline_start_corner` selector would match that one too.
    this.corner = page.locator('.ht-license-badge-corner');
    this.cornerHeaderCell = this.corner.locator('thead tr:first-child th:first-child');
  }

  /**
   * Pin the clock, then load the fixture with one license key and one grid
   * shape. The clock is fixed BEFORE navigating, so the license state is
   * resolved at the given instant during the grid's own initialization —
   * which is the only moment the key is read.
   */
  async goto(
    instant: string,
    { key = 'trial', variant = 'default' }: { key?: LicenseKeyName; variant?: Variant } = {},
  ): Promise<void> {
    await this.page.clock.setFixedTime(new Date(instant));
    await this.page.goto(
      `/tests/fixtures/demo/license-branding.html?theme=${this.theme}&bundle=${this.bundle}` +
      `&key=${key}&variant=${variant}`
    );
    await expect(this.grid.locator('.handsontable').first()).toBeVisible();
  }

  /**
   * The mask image the CSS glyph is painted with, and its size next to the
   * corner cell that has to contain it. `none` means no glyph is painted at
   * all, which is what a grid that must NOT be branded reports.
   */
  async cornerGlyph(cell: Locator = this.cornerHeaderCell): Promise<{
    maskImage: string; widthPx: number; heightPx: number; cellWidthPx: number; cellHeightPx: number;
  }> {
    return cell.evaluate((element) => {
      const glyph = getComputedStyle(element, '::after');

      return {
        maskImage: glyph.maskImage,
        widthPx: parseFloat(glyph.width),
        heightPx: parseFloat(glyph.height),
        cellWidthPx: (element as HTMLElement).offsetWidth,
        cellHeightPx: (element as HTMLElement).offsetHeight,
      };
    });
  }

  /**
   * Open the `handsontable` cell type editor over one cell, through the grid's own API and a real
   * key press. The nested grid renders only once its editor is open.
   */
  async openNestedEditor(row: number, column: number): Promise<void> {
    await this.page.evaluate(([r, c]) => (window as any).hot.selectCell(r, c), [row, column]);
    await this.page.keyboard.press('Enter');
    await expect(this.nestedCorner()).toBeVisible();
  }

  /**
   * The corner clone of the grid rendered inside the `handsontable` cell type
   * editor — a second corner living inside the branded root, which must stay
   * unbranded.
   */
  nestedCorner(): Locator {
    return this.page.locator('.handsontableInputHolder .ht_clone_top_inline_start_corner');
  }

  /**
   * The custom property the badge wrapper carries so the popover can be
   * anchored to the measured corner width.
   */
  async popoverAnchorWidthPx(): Promise<string> {
    return this.badgeWrapper.evaluate(element =>
      (element as HTMLElement).style.getPropertyValue('--ht-license-badge-area-width'));
  }

  /**
   * The corner clone's own width, which the anchor above must track.
   */
  async cornerWidthPx(): Promise<number> {
    return this.corner.evaluate(element => (element as HTMLElement).offsetWidth);
  }

  /**
   * The element the browser hit-tests at the centre of the badge. The badge is
   * click-through, so this must never be the badge itself — the corner header
   * underneath has to keep its native select-all.
   */
  async isBadgeClickThrough(): Promise<boolean> {
    return this.badge.evaluate((element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      const hitTarget = document.elementFromPoint(x + (width / 2), y + (height / 2));

      return hitTarget !== null && !element.contains(hitTarget);
    });
  }

  /**
   * Whether the popover is laid out flush with the grid's inline-start edge —
   * where the cornerless variant re-anchors it, having no corner to point at.
   * The edge is the ROOT WRAPPER's (`.ht-root-wrapper`, `hot.rootWrapperElement`): the badge lives
   * in the overlays layer under it, and that box — not the inner table element — is what the
   * popover aligns to.
   */
  async isPopoverFlushWithGridStart(): Promise<boolean> {
    return this.page.evaluate(() => {
      const popover = document.querySelector('.ht-license-popover');
      const rootWrapper = document.querySelector('.ht-root-wrapper');

      if (!popover || !rootWrapper) {
        return false;
      }

      return Math.abs(popover.getBoundingClientRect().left - rootWrapper.getBoundingClientRect().left) < 1;
    });
  }

  /**
   * Drive the grid's own API: the license key is read once at init, so these
   * exist to prove the branding survives (or is torn down with) the instance.
   */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(options => (window as any).hot.updateSettings(options), settings);
  }

  async destroyGrid(): Promise<void> {
    await this.page.evaluate(() => (window as any).hot.destroy());
  }

  async showAndHideAppDialog(): Promise<void> {
    await this.page.evaluate(() => {
      const dialog = (window as any).hot.getPlugin('dialog');

      dialog.show({ content: 'An app dialog' });
      dialog.hide();
    });
  }

  async isAppDialogVisible(): Promise<boolean> {
    return this.page.evaluate(() => (window as any).hot.getPlugin('dialog').isVisible());
  }

  async selectedRanges(): Promise<number[][]> {
    return this.page.evaluate(() => (window as any).hot.getSelected() ?? []);
  }

  async gridSize(): Promise<{ rows: number; columns: number }> {
    return this.page.evaluate(() => ({
      rows: (window as any).hot.countRows(),
      columns: (window as any).hot.countCols(),
    }));
  }
}
