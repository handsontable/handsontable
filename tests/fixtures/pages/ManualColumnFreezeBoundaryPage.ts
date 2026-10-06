import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

type HotLike = {
  getColHeader: () => string[];
  getSettings: () => { fixedColumnsStart?: number };
  getPlugin: (name: string) => {
    freezeColumn: (column: number) => void;
    unfreezeColumn: (column: number) => void;
    undo: () => void;
    redo: () => void;
  };
  render: () => void;
  getSelected: () => number[][] | undefined;
};

/**
 * Page Object for the column moves across the freeze line fixture
 * (`fixtures/demo/manual-column-freeze-boundary.html`).
 *
 * The fixture holds three grids, addressed by the ids below. Columns are addressed by their
 * header name, because a move or a freeze changes which visual index a column sits at, and
 * because a frozen column's header is drawn by the top-inline-start corner clone, which paints
 * on top of the copy `.ht_clone_top` still renders for it.
 */
export class ManualColumnFreezeBoundaryPage {
  /**
   * `manualColumnFreeze: true`, the shipped default.
   */
  static readonly DEFAULT = 'default';
  /**
   * `manualColumnFreeze: { restoreColumnPosition: true }`.
   */
  static readonly RESTORE = 'restore';
  /**
   * The same as `RESTORE`, with `fixedColumnsEnd: 1` and `col1` moved into the end band.
   */
  static readonly RESTORE_END = 'restore-end';

  static readonly ALL_GRIDS = [
    ManualColumnFreezeBoundaryPage.DEFAULT,
    ManualColumnFreezeBoundaryPage.RESTORE,
    ManualColumnFreezeBoundaryPage.RESTORE_END,
  ];

  /**
   * The fixture's column headers, in their starting order.
   */
  static readonly IDENTITY = ['col1', 'col2', 'col3', 'col4', 'col5', 'col6', 'col7', 'col8'];

  static readonly FREEZE_LABEL = 'Freeze column';
  static readonly UNFREEZE_LABEL = 'Unfreeze column';

  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate and wait for every grid to have rendered.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/manual-column-freeze-boundary.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await awaitBundle(this.page);

    for (const gridId of ManualColumnFreezeBoundaryPage.ALL_GRIDS) {
      const initError = await this.grid(gridId).getAttribute('data-init-error');

      if (initError !== null) {
        throw new Error(`Grid "${gridId}" failed to build: ${initError}`);
      }
    }

    for (const gridId of ManualColumnFreezeBoundaryPage.ALL_GRIDS) {
      await expect(this.grid(gridId).locator('.ht_master')).toBeVisible();
    }
  }

  /**
   * One of the grid containers.
   */
  grid(gridId: string): Locator {
    return this.page.getByTestId(gridId);
  }

  /**
   * The column headers, in their current visual order.
   */
  async columnOrder(gridId: string): Promise<string[]> {
    return this.page.evaluate(
      id => (window as unknown as { hots: Record<string, HotLike> }).hots[id].getColHeader(),
      gridId
    );
  }

  /**
   * How many columns the grid holds in its frozen (inline start) area.
   */
  async fixedColumnsStart(gridId: string): Promise<number> {
    return this.page.evaluate(
      id => (window as unknown as { hots: Record<string, HotLike> }).hots[id].getSettings().fixedColumnsStart ?? 0,
      gridId
    );
  }

  /**
   * The headers the frozen corner clone draws, which is what the user sees pinned.
   */
  async renderedFrozenHeaders(gridId: string): Promise<string[]> {
    return this.grid(gridId)
      .locator('.ht_clone_top_inline_start_corner thead th[data-testid^="header-"]')
      .evaluateAll(cells => cells.map(cell => (cell.getAttribute('data-testid') ?? '').replace('header-', '')));
  }

  /**
   * Freeze a column through the plugin API, by its current visual index.
   */
  async freezeColumnByApi(gridId: string, visualColumn: number): Promise<void> {
    await this.page.evaluate(([id, column]) => {
      const hot = (window as unknown as { hots: Record<string, HotLike> }).hots[id as string];

      hot.getPlugin('manualColumnFreeze').freezeColumn(column as number);
      hot.render();
    }, [gridId, visualColumn] as [string, number]);
  }

  /**
   * Unfreeze a column through the plugin API, by its current visual index.
   */
  async unfreezeColumnByApi(gridId: string, visualColumn: number): Promise<void> {
    await this.page.evaluate(([id, column]) => {
      const hot = (window as unknown as { hots: Record<string, HotLike> }).hots[id as string];

      hot.getPlugin('manualColumnFreeze').unfreezeColumn(column as number);
      hot.render();
    }, [gridId, visualColumn] as [string, number]);
  }

  /**
   * Redo the last undone action.
   */
  async redo(gridId: string): Promise<void> {
    await this.page.evaluate(
      id => (window as unknown as { hots: Record<string, HotLike> }).hots[id].getPlugin('undoRedo').redo(),
      gridId
    );
  }

  /**
   * Undo the last action.
   */
  async undo(gridId: string): Promise<void> {
    await this.page.evaluate(
      id => (window as unknown as { hots: Record<string, HotLike> }).hots[id].getPlugin('undoRedo').undo(),
      gridId
    );
  }

  /**
   * The header of a column, picked from the overlay that paints it on top: the corner clone for a
   * frozen column, the top clone for any other.
   */
  async header(gridId: string, name: string): Promise<Locator> {
    const order = await this.columnOrder(gridId);
    const isFrozen = order.indexOf(name) < await this.fixedColumnsStart(gridId);
    const clone = isFrozen ? '.ht_clone_top_inline_start_corner' : '.ht_clone_top';

    return this.grid(gridId).locator(`${clone} [data-testid="header-${name}"]`);
  }

  /**
   * The headers of the columns the current selection spans, by name, so a check reads as "which column is
   * selected" and not as an index that a move has just changed.
   */
  async selectedColumnNames(gridId: string): Promise<string[]> {
    return this.page.evaluate((id) => {
      const hot = (window as unknown as { hots: Record<string, HotLike> }).hots[id];
      const [, fromColumn, , toColumn] = (hot.getSelected() ?? [[-1, -1, -1, -1]])[0];
      const headers = hot.getColHeader();

      return headers.slice(Math.min(fromColumn, toColumn), Math.max(fromColumn, toColumn) + 1);
    }, gridId);
  }

  /**
   * Freeze or unfreeze a column the way a user does: right-click its header and pick the entry.
   */
  async pickFromHeaderContextMenu(gridId: string, name: string, label: string): Promise<void> {
    await (await this.header(gridId, name)).click({ button: 'right' });

    const menu = this.page.locator('.htContextMenu:visible');

    await expect(menu).toBeVisible();

    const exact = new RegExp(`^${label}$`);

    await menu.locator('td').filter({ hasText: exact }).first().click();
    await expect(menu).toBeHidden();
  }

  /**
   * Drag a column by its header and drop it next to another column, the way a user moves one:
   * click the header to select the column, press on it, cross the drag threshold, and release
   * over the target's start or end quarter, which places the column before or after it.
   */
  async dragColumn(gridId: string, name: string, targetName: string, side: 'before' | 'after'): Promise<void> {
    const source = await this.header(gridId, name);

    await source.click();

    const from = await this.boxOf(source);
    const to = await this.boxOf(await this.header(gridId, targetName));
    const y = from.y + (from.height / 2);
    const startX = from.x + (from.width / 2);
    const dropX = side === 'before' ? to.x + (to.width / 4) : to.x + (to.width * 3 / 4);

    await this.page.mouse.move(startX, y);
    await this.page.mouse.down();
    await this.page.mouse.move(startX + (dropX > startX ? 10 : -10), y, { steps: 5 });
    await this.page.mouse.move(dropX, y, { steps: 10 });
    await this.page.mouse.up();
  }

  /**
   * Holds a drag of one column over a header, without releasing, and reports whether the drop guideline is
   * the topmost element at a body row. A position check alone cannot tell: the guideline sat at the right
   * place under the frozen overlay and was painted over by it.
   */
  async holdDragAndProbeGuideline(
    gridId: string,
    name: string,
    targetName: string,
    side: 'before' | 'after'
  ): Promise<{ visible: boolean, left: number, backlightCount: number }> {
    const source = await this.header(gridId, name);

    await source.click();

    const from = await this.boxOf(source);
    const to = await this.boxOf(await this.header(gridId, targetName));
    const y = from.y + (from.height / 2);
    const startX = from.x + (from.width / 2);
    const dropX = side === 'before' ? to.x + (to.width / 4) : to.x + (to.width * 3 / 4);

    await this.page.mouse.move(startX, y);
    await this.page.mouse.down();
    await this.page.mouse.move(startX + (dropX > startX ? 10 : -10), y, { steps: 5 });
    await this.page.mouse.move(dropX, y, { steps: 10 });

    const guideline = this.grid(gridId).locator('.ht__manualColumnMove--guideline');

    await expect(guideline).toHaveCount(1);

    const result = await guideline.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const row = element.closest('.handsontable')?.ownerDocument.querySelector('.ht_master tbody tr td');
      const rowRect = (row as HTMLElement).getBoundingClientRect();
      const hit = element.ownerDocument.elementFromPoint(rect.left + (rect.width / 2), rowRect.top + (rowRect.height / 2));

      return { visible: hit === element, left: Math.round(rect.left) };
    });

    const backlightCount = await this.grid(gridId).locator('.ht__manualColumnMove--backlight').count();

    await this.page.mouse.up();

    return { ...result, backlightCount };
  }

  /**
   * Bounding box of a laid-out header.
   */
  private async boxOf(locator: Locator): Promise<{ x: number, y: number, width: number, height: number }> {
    await expect(locator).toBeVisible();

    const box = await locator.boundingBox();

    if (box === null) {
      throw new Error('Column header has no bounding box');
    }

    return box;
  }
}
