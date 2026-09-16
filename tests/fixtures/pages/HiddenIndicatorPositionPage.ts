import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, BUNDLE_POLLING_MS } from '../bundle';

/**
 * The hidden-column and hidden-row indicator rules as 18.1.0 shipped them, and the reference every
 * arrow is compared against. `mask-position` and `mask-repeat` are reset to their initial values
 * because 18.1.0 set neither. `!important` because the rules under test carry the same
 * specificity, and a reference that lost the cascade would compare the build against itself.
 */
const RELEASED_18_1_0_RULES = `
  .handsontable th.beforeHiddenColumn::after {
    right: -2px !important; mask-position: 0 0 !important; mask-repeat: repeat !important;
  }
  .handsontable th.afterHiddenColumn::before { left: -2px !important; }
  [dir="rtl"].handsontable th.beforeHiddenColumn::after { right: auto !important; left: -2px !important; }
  [dir="rtl"].handsontable th.afterHiddenColumn::before { right: -2px !important; left: auto !important; }
  .handsontable th.beforeHiddenRow::after {
    bottom: -2px !important; mask-position: 0 0 !important; mask-repeat: repeat !important;
  }
  .handsontable th.afterHiddenRow::before { top: -2px !important; }
`;

type MarkerKind = 'beforeHiddenColumn' | 'afterHiddenColumn' | 'beforeHiddenRow' | 'afterHiddenRow';

type Pixels = Awaited<ReturnType<Locator['screenshot']>>;

const MARKER_KINDS: MarkerKind[] = ['beforeHiddenColumn', 'afterHiddenColumn', 'beforeHiddenRow', 'afterHiddenRow'];

/**
 * Page Object for the hidden-indicator-position fixture (#13500 / DEV-2921): a grid with hidden
 * columns and hidden rows, indicators on, flush on neither axis.
 */
export class HiddenIndicatorPositionPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate in a given text direction and wait for real DOM conditions rather than a sleep. A
   * constructor throw is rethrown as itself rather than surfacing as a locator timeout.
   *
   * @param dir The document's text direction. `rtl` rotates the column arrows.
   */
  async goto(dir: 'ltr' | 'rtl' = 'ltr'): Promise<void> {
    await this.page.goto(
      '/tests/fixtures/demo/hidden-indicator-position.html' +
      `?theme=${this.theme}&bundle=${this.bundle}&dir=${dir}`
    );
    await awaitBundle(this.page);
    await this.page.waitForFunction(
      () => 'hot' in window || 'htBuildError' in window, undefined, { polling: BUNDLE_POLLING_MS },
    );

    const buildError = await this.page.evaluate(
      () => (window as { htBuildError?: string }).htBuildError ?? null,
    );

    if (buildError !== null) {
      throw new Error(`Handsontable constructor threw in the fixture:\n${buildError}`);
    }

    await expect(this.markers('beforeHiddenColumn').first()).toBeVisible();
    await expect(this.markers('beforeHiddenRow').first()).toBeVisible();
  }

  /**
   * The headers carrying one marker kind, in the overlay a user actually sees them in: column
   * headers in the top clone, row headers in the inline-start clone. The master table renders a
   * copy of each underneath, which is never on screen.
   *
   * @param kind The marker class.
   */
  markers(kind: MarkerKind): Locator {
    const overlay = kind.endsWith('Column') ? '.ht_clone_top thead' : '.ht_clone_inline_start tbody';

    return this.page.getByTestId('grid').locator(`${overlay} th.${kind}`);
  }

  /**
   * Screenshots every marked header and both header strips as the build paints them, then again
   * with the 18.1.0 rules forced on top, and names each region whose pixels changed.
   *
   * Both passes shoot the same page, so the indicator CSS is the only variable. `reference` reads
   * the before-markers' computed box back under the forced rules: it is what proves the second pass
   * really painted the 18.1.0 geometry, and not the build a second time.
   */
  async compareWithReleasedRules(): Promise<{
    counts: Record<MarkerKind, number>,
    reference: { column: string, row: string },
    changed: string[],
  }> {
    const shipped = await this.shootMarkers();

    await this.page.addStyleTag({ content: RELEASED_18_1_0_RULES });

    const reference = await this.page.evaluate(() => {
      const grid = document.querySelector('[data-testid="grid"]') as HTMLElement;
      const column = grid.querySelector('.ht_clone_top thead th.beforeHiddenColumn');
      const row = grid.querySelector('.ht_clone_inline_start tbody th.beforeHiddenRow');

      if (column === null || row === null) {
        throw new Error('A before-marker header is missing from its overlay.');
      }

      const columnStyle = getComputedStyle(column, '::after');
      const rowStyle = getComputedStyle(row, '::after');
      const columnEdge = document.documentElement.dir === 'rtl' ? columnStyle.left : columnStyle.right;

      return {
        column: `${columnEdge} / ${columnStyle.maskPosition}`,
        row: `${rowStyle.bottom} / ${rowStyle.maskPosition}`,
      };
    });

    const released = await this.shootMarkers();
    const counts = {} as Record<MarkerKind, number>;
    const changed: string[] = [];

    MARKER_KINDS.forEach((kind) => {
      counts[kind] = shipped[kind].length;
    });

    Object.entries(shipped).forEach(([region, shots]) => {
      shots.forEach((pixels, index) => {
        if (released[region][index] === undefined || !pixels.equals(released[region][index])) {
          changed.push(`${region}[${index}]`);
        }
      });
    });

    return { counts, reference, changed };
  }

  /**
   * One screenshot per marked header, grouped by marker kind, plus each whole header strip. A
   * header's own box misses what an arrow paints past it, so the strips are what see an overhang.
   */
  private async shootMarkers(): Promise<Record<string, Pixels[]>> {
    const grid = this.page.getByTestId('grid');
    const shots: Record<string, Pixels[]> = {
      columnHeaders: [await grid.locator('.ht_clone_top .wtHolder').screenshot()],
      rowHeaders: [await grid.locator('.ht_clone_inline_start .wtHolder').screenshot()],
    };

    for (const kind of MARKER_KINDS) {
      const headers = this.markers(kind);
      const count = await headers.count();

      shots[kind] = [];

      for (let index = 0; index < count; index++) {
        shots[kind].push(await headers.nth(index).screenshot());
      }
    }

    return shots;
  }
}
