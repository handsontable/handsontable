import { type Page, type Locator, expect } from '@playwright/test';
import { assertKnownBundle, awaitBundle, awaitFixtureBuilt, type Bundle } from '../bundle';

type Direction = 'ltr' | 'rtl';

/**
 * Page Object for the collapsible-dropdown-hit-areas fixture: a collapsible group "C" in the last header
 * row, whose header cell holds both the group's collapse indicator and the cell's dropdown button.
 */
export class CollapsibleDropdownHitAreasPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly direction: Direction;
  readonly pageDirection: Direction;
  readonly sorted: boolean;

  /**
   * @param {Page} page The page the fixture opens on.
   * @param {string} theme The theme under test.
   * @param {Bundle} bundle The bundle under test.
   * @param {object} [options] What the fixture builds.
   * @param {Direction} [options.direction] The direction of the grid.
   * @param {Direction} [options.pageDirection] The direction of the page around it.
   * @param {boolean} [options.sorted] Whether the first column is sorted, which draws a sort indicator.
   */
  constructor(
    page: Page,
    theme = 'main',
    bundle: Bundle = 'umd',
    { direction = 'ltr', pageDirection = 'ltr', sorted = false }: {
      direction?: Direction,
      pageDirection?: Direction,
      sorted?: boolean,
    } = {}
  ) {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.direction = direction;
    this.pageDirection = pageDirection;
    this.sorted = sorted;
  }

  /**
   * Navigate and wait for the group's indicator to render (a real DOM condition, no sleep).
   */
  async goto(): Promise<void> {
    assertKnownBundle(this.bundle, 'constructor(page, theme, bundle, options)');

    const query = new URLSearchParams({
      theme: this.theme,
      bundle: this.bundle,
      dir: this.direction,
      pageDir: this.pageDirection,
      sort: this.sorted ? '1' : '0',
    });

    await this.page.goto(`/tests/fixtures/demo/collapsible-dropdown-hit-areas.html?${query}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.indicator()).toBeVisible();
  }

  /**
   * The header cell of group "C", in the last header row of the top overlay.
   */
  private groupHeader(): Locator {
    return this.page.locator('.ht_clone_top thead tr').nth(1).locator('th').first();
  }

  /**
   * The collapse and expand indicator of group "C".
   */
  indicator(): Locator {
    return this.groupHeader().locator('.collapsibleIndicator');
  }

  /**
   * The dropdown button of group "C"'s header cell.
   */
  menuButton(): Locator {
    return this.groupHeader().locator('.changeType');
  }

  /**
   * The dropdown menu, only while it is on screen.
   */
  openMenu(): Locator {
    return this.page.locator('.htDropdownMenu:visible');
  }

  /**
   * Where the pointer press passes from one button to the other, as a distance from the middle of the
   * gap between the two visible icons (the `.ht-icon` glyphs, not the larger hit areas around them).
   * Sweeps the gap at mid height and finds the first point the indicator takes over from the dropdown
   * button, in whichever direction the grid runs. Zero means the two buttons share the gap evenly, and
   * `Infinity` that the first button takes the whole gap. Throws when a point of the sweep lands on
   * neither button, or the buttons trade places more than once, so a broken layout reads as an error
   * and never as a passing offset.
   */
  async hitBoundaryOffsetFromGapMiddle(): Promise<number> {
    return this.groupHeader().evaluate((th) => {
      const indicator = th.querySelector('.collapsibleIndicator') as HTMLElement;
      const menuButton = th.querySelector('.changeType') as HTMLElement;
      const indicatorIcon = indicator.querySelector('.ht-icon') as HTMLElement;
      const menuIcon = menuButton.querySelector('.ht-icon') as HTMLElement;
      const a = menuIcon.getBoundingClientRect();
      const b = indicatorIcon.getBoundingClientRect();
      const menuIsFirst = a.left < b.left;
      // The gap runs from the inner edge of the first icon to the inner edge of the second one.
      const from = menuIsFirst ? a.right : b.right;
      const to = menuIsFirst ? b.left : a.left;
      const y = (b.top + b.bottom) / 2;
      const owners: string[] = [];

      for (let x = from; x <= to; x += 0.25) {
        const hit = document.elementFromPoint(x, y)?.closest('.collapsibleIndicator, .changeType');

        if (hit !== indicator && hit !== menuButton) {
          throw new Error(`A point of the gap at x=${x} lands on neither button`);
        }

        owners.push(hit === indicator ? 'indicator' : 'menuButton');
      }

      const firstOwner = menuIsFirst ? 'menuButton' : 'indicator';
      const takeover = owners.findIndex(owner => owner !== firstOwner);

      // The first button keeps the whole gap and even reaches into the second icon: there is no handover.
      if (takeover === -1) {
        return Infinity;
      }

      if (owners.slice(takeover).some(owner => owner === firstOwner)) {
        throw new Error('The buttons do not hand the gap over exactly once');
      }

      return (from + takeover * 0.25) - (from + to) / 2;
    });
  }

  /**
   * What a pointer press lands on, one pixel inside the edge of the indicator's hit area that faces the
   * dropdown button, at mid height. Returns `'indicator'`, or the class name of whatever else is there.
   */
  async hitAtIndicatorFacingEdge(): Promise<string> {
    return this.groupHeader().evaluate((th) => {
      const indicator = th.querySelector('.collapsibleIndicator') as HTMLElement;
      const menuButton = th.querySelector('.changeType') as HTMLElement;
      const own = indicator.getBoundingClientRect();
      const other = menuButton.getBoundingClientRect();
      // The facing edge is the one on the side of the dropdown button, which flips in a right to left grid.
      const otherIsAtEnd = other.left + other.width / 2 > own.left + own.width / 2;
      const x = otherIsAtEnd ? own.right - 1 : own.left + 1;
      const hit = document.elementFromPoint(x, own.top + own.height / 2);

      return hit?.closest('.collapsibleIndicator') === indicator ? 'indicator' : (hit?.className || 'nothing');
    });
  }

  async expectCollapsed(): Promise<void> {
    await expect(this.indicator()).toHaveClass(/\bcollapsed\b/);
  }

  async expectExpanded(): Promise<void> {
    await expect(this.indicator()).toHaveClass(/\bexpanded\b/);
  }
}
