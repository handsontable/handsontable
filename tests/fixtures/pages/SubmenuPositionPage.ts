import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Which menu a submenu belongs to. Both build their submenus with the same `Positioner`, and each
 * names a submenu container after its own class: `htContextMenuSub_<item>` or `htDropdownMenuSub_<item>`.
 */
export type MenuKind = 'context' | 'dropdown';

/**
 * A box in viewport coordinates, as `getBoundingClientRect()` reports it.
 */
export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * Everything a placement assertion compares, read in one evaluation: the parent menu, its
 * "Alignment" row, the submenu, the submenu's first and last rows, and the viewport.
 */
export interface SubmenuGeometry {
  parent: Box;
  anchor: Box;
  submenu: Box;
  firstRow: Box;
  lastRow: Box;
  viewport: { width: number; height: number };
}

/**
 * Where a submenu opened, in words a failure message can carry: which side of its parent menu it
 * sits on, which of its rows lines up with the row it belongs to, and whether it is on screen.
 */
export interface SubmenuPlacement {
  side: string;
  rows: string;
  inViewport: boolean;
}

const MENU_CLASS: Record<MenuKind, string> = { context: 'htContextMenu', dropdown: 'htDropdownMenu' };

/**
 * How far two edges that should meet may be apart. Measured on all three themes: on `horizon` the
 * submenu's edge meets the parent's exactly, and on `main` and `classic` it overlaps by the menu
 * border, 1 px. The rows line up exactly on every theme.
 */
export const EDGE_TOLERANCE_PX = 1.5;

/**
 * Names a placement from its boxes. A submenu that is neither edge to edge with its parent nor
 * aligned with its row is reported with the measured distances, so a regression says what it did.
 *
 * @param {SubmenuGeometry} geometry The boxes.
 * @returns {SubmenuPlacement} The placement.
 */
export function placementOf(geometry: SubmenuGeometry): SubmenuPlacement {
  const { parent, anchor, submenu, firstRow, lastRow, viewport } = geometry;
  const round = (value: number) => Math.round(value * 10) / 10;
  const meets = (a: number, b: number) => Math.abs(a - b) <= EDGE_TOLERANCE_PX;
  let side: string;
  let rows: string;

  if (meets(submenu.left, parent.right)) {
    side = 'right';
  } else if (meets(submenu.right, parent.left)) {
    side = 'left';
  } else {
    side = `detached: submenu ${round(submenu.left)}–${round(submenu.right)}, `
      + `parent ${round(parent.left)}–${round(parent.right)}`;
  }

  if (meets(firstRow.top, anchor.top)) {
    rows = 'below';
  } else if (meets(lastRow.bottom, anchor.bottom)) {
    rows = 'above';
  } else {
    rows = `misaligned: first row at ${round(firstRow.top)}, last row ends at ${round(lastRow.bottom)}, `
      + `anchor row ${round(anchor.top)}–${round(anchor.bottom)}`;
  }

  const inViewport = submenu.left >= 0 && submenu.top >= 0
    && submenu.right <= viewport.width && submenu.bottom <= viewport.height;

  return { side, rows, inViewport };
}

/**
 * Page Object for the submenu-position fixture: where the "Alignment" submenu opens relative to its
 * parent menu and the row it belongs to, for the context menu and the dropdown menu, in either layout
 * direction.
 *
 * A submenu container carries its parent menu's class as well (`Menu.createContainer()` adds the menu
 * class and `<class>Sub_<item>`), so every parent-menu locator here leaves the submenu containers out.
 * Geometry is read inside one `page.evaluate()` per question, on containers the menu never recycles,
 * so a re-render between two round trips cannot mix two frames into one measurement.
 */
export class SubmenuPositionPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly dir: 'ltr' | 'rtl';
  readonly grid: Locator;

  /**
   * Builds the page object for one theme, bundle, and layout direction.
   *
   * @param {Page} page The Playwright page.
   * @param {string} theme The active theme.
   * @param {string} bundle The active bundle.
   * @param {'ltr' | 'rtl'} dir The grid's layout direction.
   */
  constructor(page: Page, theme = 'main', bundle = 'umd', dir: 'ltr' | 'rtl' = 'ltr') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.dir = dir;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate to the fixture and wait for the grid. Theme, bundle, and direction travel as query
   * params, so the fixture loads the matching stylesheet and build and lays the grid out that way.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/submenu-position.html?theme=${this.theme}&bundle=${this.bundle}&dir=${this.dir}`);
    // The bundle first, or a slow leg fails pointing at a missing cell instead of the real cause.
    await awaitBundle(this.page);

    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell in the master overlay, by its test id.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {Locator} The cell.
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The parent menu of the given kind, without its submenu containers.
   *
   * @param {MenuKind} kind The menu.
   * @returns {Locator} The menu container.
   */
  menu(kind: MenuKind): Locator {
    const name = MENU_CLASS[kind];

    return this.page.locator(`.${name}:not([class*="${name}Sub_"])`);
  }

  /**
   * The "Alignment" submenu of the given menu.
   *
   * @param {MenuKind} kind The menu.
   * @returns {Locator} The submenu container.
   */
  submenu(kind: MenuKind): Locator {
    return this.page.locator(`.${MENU_CLASS[kind]}Sub_Alignment`);
  }

  /**
   * Right-clicks the grid at an offset from the viewport's edges and waits for the context menu. A
   * positive offset counts from the left or top edge, a negative one from the right or bottom edge,
   * so `(-80, -80)` is 80 px in from the bottom-right corner.
   *
   * @param {number} offsetX The horizontal offset.
   * @param {number} offsetY The vertical offset.
   */
  async openContextMenuAt(offsetX: number, offsetY: number): Promise<void> {
    const viewport = this.page.viewportSize();

    if (!viewport) {
      throw new Error('The page has no fixed viewport, so a corner offset cannot be resolved.');
    }

    const x = offsetX >= 0 ? offsetX : viewport.width + offsetX;
    const y = offsetY >= 0 ? offsetY : viewport.height + offsetY;

    await this.page.mouse.click(x, y, { button: 'right' });
    await expect(this.menu('context')).toBeVisible();
  }

  /**
   * Opens the dropdown menu of the column header nearest one inline edge of the grid's visible area:
   * the first fully visible column (`start`) or the last one (`end`). In RTL the inline start is on
   * the right. The header is found by its position, not by index, because the row-header width and
   * so the columns in view depend on the theme.
   *
   * @param {'start' | 'end'} edge Which inline edge.
   */
  async openDropdownMenuAtInlineEdge(edge: 'start' | 'end'): Promise<void> {
    const label = await this.page.evaluate(({ wanted, dir }) => {
      const holder = document.querySelector('[data-testid="grid"] .ht_master .wtHolder');
      const area = holder!.getBoundingClientRect();
      const visible = Array.from(document.querySelectorAll('[data-testid="grid"] .ht_clone_top thead th'))
        .filter(th => th.querySelector('.changeType'))
        .map(th => ({ label: (th.textContent ?? '').trim(), box: th.getBoundingClientRect() }))
        .filter(({ box }) => box.left >= area.left - 0.5 && box.right <= area.left + holder!.clientWidth + 0.5);

      if (visible.length === 0) {
        return null;
      }

      visible.sort((a, b) => a.box.left - b.box.left);

      const leftmost = visible[0];
      const rightmost = visible[visible.length - 1];
      const startIsLeft = dir === 'ltr';

      return (wanted === 'start') === startIsLeft ? leftmost.label : rightmost.label;
    }, { wanted: edge, dir: this.dir });

    if (!label) {
      throw new Error('No column header with a dropdown button is fully inside the grid\'s visible area.');
    }

    await this.grid.locator('.ht_clone_top thead th')
      .filter({ hasText: new RegExp(`^${label}$`) })
      .locator('.changeType')
      .click();
    await expect(this.menu('dropdown')).toBeVisible();
  }

  /**
   * Walks the open menu's highlight to "Alignment" by its label, then opens the submenu from the
   * keyboard: ArrowRight in LTR, ArrowLeft in RTL. Walking by label rather than by a keystroke count
   * keeps the test true when the item order moves.
   *
   * @param {MenuKind} kind The menu the submenu belongs to.
   */
  async openAlignmentSubmenu(kind: MenuKind): Promise<void> {
    const highlighted = this.menu(kind).locator(':scope > .ht_master .htCore tbody td.current');

    for (let step = 0; step < 10; step++) {
      if ((await highlighted.count()) === 1 && (await highlighted.innerText()).trim() === 'Alignment') {
        await this.page.keyboard.press(this.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
        await expect(this.submenu(kind)).toBeVisible();

        return;
      }

      await this.page.keyboard.press('ArrowDown');
    }

    throw new Error(`ArrowDown never reached the "Alignment" item of the ${kind} menu`);
  }

  /**
   * Closes every open menu with Escape and waits until the parent menu is gone.
   *
   * @param {MenuKind} kind The menu to close.
   */
  async closeMenus(kind: MenuKind): Promise<void> {
    for (let press = 0; press < 3 && (await this.menu(kind).isVisible()); press++) {
      await this.page.keyboard.press('Escape');
    }

    await expect(this.menu(kind)).toBeHidden();
  }

  /**
   * Scrolls the grid's own holder to its last row and column (the page itself does not scroll), and
   * waits until the far corner cell is rendered, which is the render state the scroll produces.
   */
  async scrollGridToBottomAndInlineEnd(): Promise<void> {
    await this.page.evaluate(() => {
      const { hot } = window as unknown as {
        hot: { scrollViewportTo(options: { row: number; col: number }): boolean;
          countRows(): number; countCols(): number; };
      };

      hot.scrollViewportTo({ row: hot.countRows() - 1, col: hot.countCols() - 1 });
    });
    await expect(this.cell(99, 49)).toBeVisible();
  }

  /**
   * Where the open "Alignment" submenu sits, named by `placementOf()`. Poll it with `expect.poll`
   * rather than reading it once, so the assertion cannot run between the submenu appearing and the
   * positioner moving it.
   *
   * @param {MenuKind} kind The menu the submenu belongs to.
   * @returns {Promise<SubmenuPlacement>} The placement.
   */
  async submenuPlacement(kind: MenuKind): Promise<SubmenuPlacement> {
    return placementOf(await this.geometry(kind));
  }

  /**
   * The parent menu, its "Alignment" row, the submenu, the submenu's first and last item rows, and
   * the viewport, read in one evaluation.
   *
   * @param {MenuKind} kind The menu the submenu belongs to.
   * @returns {Promise<SubmenuGeometry>} The boxes.
   */
  async geometry(kind: MenuKind): Promise<SubmenuGeometry> {
    return this.page.evaluate((name) => {
      const box = (element: Element | null | undefined) => {
        if (!element) {
          throw new Error('An element the submenu geometry needs is not in the DOM');
        }

        const { left, right, top, bottom } = element.getBoundingClientRect();

        return { left, right, top, bottom };
      };
      const parent = document.querySelector(`.${name}:not([class*="${name}Sub_"])`);
      const submenu = document.querySelector(`.${name}Sub_Alignment`);
      const anchor = Array.from(parent?.querySelectorAll(':scope > .ht_master .htCore tbody td') ?? [])
        .find(cell => (cell.textContent ?? '').trim() === 'Alignment');
      const rows = Array.from(submenu?.querySelectorAll(':scope > .ht_master .htCore tbody td') ?? [])
        .filter(cell => !cell.classList.contains('htSeparator'));

      return {
        parent: box(parent),
        anchor: box(anchor),
        submenu: box(submenu),
        firstRow: box(rows[0]),
        lastRow: box(rows[rows.length - 1]),
        viewport: { width: window.innerWidth, height: window.innerHeight },
      };
    }, MENU_CLASS[kind]);
  }
}
