import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

type CellMetaClassName = string | string[];

/**
 * Page Object for the "`numericRenderer` class tokens survive a type change" fixture.
 *
 * `numericRenderer` appends `htRight htNumeric` onto the `className` the cell meta stores. When the
 * user set that `className` through `setCellMeta()` or the `cell` option, an `updateSettings()` that
 * changed a column `type` or the grid-level `type` replayed it, renderer tokens included.
 *
 * The page object builds nothing itself: the fixture creates every grid, and the methods here move a
 * grid from its numeric state to the state a case needs (`setClassName()`, then `switchFirstColumnToText()`
 * or `switchGridTypeToText()`).
 */
export class NumericClassNameTypeChangePage {
  /**
   * `className` set through `setCellMeta()`, then column 0 switches to text.
   */
  static readonly SET_CELL_META = 'set-cell-meta';
  /**
   * `className` set through the `cell` option, then column 0 switches to text.
   */
  static readonly CELL_OPTION = 'cell-option';
  /**
   * Grid-level `type: 'numeric'`, then `type: 'text'`.
   */
  static readonly GRID_LEVEL = 'grid-level';
  /**
   * Control: the numeric type is restated.
   */
  static readonly RESTATE = 'restate';
  /**
   * Control: explicit alignment through the Alignment context menu.
   */
  static readonly ALIGNMENT = 'alignment';
  /**
   * Control: a user array `className`.
   */
  static readonly ARRAY = 'array';
  /**
   * Baseline: no `className` of the cell's own.
   */
  static readonly BASELINE = 'baseline';

  /**
   * Undo of a `className` write that followed an earlier one.
   */
  static readonly UNDO_LATER_WRITE = 'undo-later-write';
  /**
   * `moveCells` of a numeric cell with no `className` of its own.
   */
  static readonly MOVE_PLAIN = 'move-plain';
  /**
   * `moveCells` of a numeric cell with a user `className`.
   */
  static readonly MOVE_WITH_CLASS = 'move-with-class';
  /**
   * Undo of a row removal; the removed cell had a user `className`.
   */
  static readonly UNDO_ROW_REMOVAL = 'undo-row-removal';

  /**
   * `moveCells` of a text cell onto a cell that drew numeric and then became text.
   */
  static readonly MOVE_ONTO_RENDERED = 'move-onto-rendered';

  /**
   * Every grid the fixture builds. Built from the ids above, so a renamed id cannot drift out.
   */
  static readonly ALL_GRIDS = [
    NumericClassNameTypeChangePage.SET_CELL_META,
    NumericClassNameTypeChangePage.CELL_OPTION,
    NumericClassNameTypeChangePage.GRID_LEVEL,
    NumericClassNameTypeChangePage.RESTATE,
    NumericClassNameTypeChangePage.ALIGNMENT,
    NumericClassNameTypeChangePage.ARRAY,
    NumericClassNameTypeChangePage.BASELINE,
    NumericClassNameTypeChangePage.UNDO_LATER_WRITE,
    NumericClassNameTypeChangePage.MOVE_PLAIN,
    NumericClassNameTypeChangePage.MOVE_WITH_CLASS,
    NumericClassNameTypeChangePage.UNDO_ROW_REMOVAL,
    NumericClassNameTypeChangePage.MOVE_ONTO_RENDERED,
  ];

  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate and wait for every grid to have rendered, a real DOM condition, never a sleep.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/numeric-classname-type-change.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    // Wait for the bundle before reading anything the page script produced: under load `goto()`
    // resolves while `Handsontable` is still undefined, and `data-init-error` would then read as
    // "no error" simply because the script had not run.
    await awaitBundle(this.page);

    // Report a constructor that threw as the error it threw, not as a visibility timeout.
    for (const gridId of NumericClassNameTypeChangePage.ALL_GRIDS) {
      const initError = await this.initError(gridId);

      if (initError !== null) {
        throw new Error(`Grid "${gridId}" failed to build: ${initError}`);
      }
    }

    for (const gridId of NumericClassNameTypeChangePage.ALL_GRIDS) {
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
   * The message of the error the grid's constructor threw, or `null` when it built cleanly.
   */
  async initError(gridId: string): Promise<string | null> {
    return this.grid(gridId).getAttribute('data-init-error');
  }

  /**
   * One data cell of one grid. Plain cells live only in `.ht_master`, so this hooks cleanly.
   */
  cell(gridId: string, row: number, column: number): Locator {
    return this.grid(gridId).locator('.ht_master').getByTestId(`cell-${row}-${column}`);
  }

  /**
   * Sets a cell's `className` through `setCellMeta()` and waits for the draw that follows.
   */
  async setClassName(gridId: string, row: number, column: number, className: CellMetaClassName): Promise<void> {
    await this.afterDraw(gridId, () => this.page.evaluate(
      ([id, r, c, value]) => {
        const hot = (window as unknown as {
          hots: Record<string, { setCellMeta: (...args: unknown[]) => void; render: () => void }>;
        }).hots[id as string];

        hot.setCellMeta(r as number, c as number, 'className', value);
        hot.render();
      },
      [gridId, row, column, className] as const
    ));
  }

  /**
   * `updateSettings({ columns: [text, numeric] })`: column 0 stops being numeric, column 1 does not.
   */
  async switchFirstColumnToText(gridId: string): Promise<void> {
    await this.updateSettings(gridId, { columns: [{ type: 'text' }, { type: 'numeric' }] });
  }

  /**
   * `updateSettings({ columns: [numeric, numeric] })`: restates the type every column already has.
   */
  async restateNumericColumns(gridId: string): Promise<void> {
    await this.updateSettings(gridId, { columns: [{ type: 'numeric' }, { type: 'numeric' }] });
  }

  /**
   * `updateSettings({ type: 'text' })`: the grid-level type changes.
   */
  async switchGridTypeToText(gridId: string): Promise<void> {
    await this.updateSettings(gridId, { type: 'text' });
  }

  /**
   * Undoes the last step through the UndoRedo plugin and waits for the draw that follows.
   */
  async undo(gridId: string): Promise<void> {
    await this.afterDraw(gridId, () => this.page.evaluate(
      (id) => {
        (window as unknown as {
          hots: Record<string, { getPlugin: (name: string) => { undo: () => void } }>;
        }).hots[id].getPlugin('undoRedo').undo();
      },
      gridId
    ));
  }

  /**
   * Redoes the last undone step through the UndoRedo plugin and waits for the draw that follows.
   */
  async redo(gridId: string): Promise<void> {
    await this.afterDraw(gridId, () => this.page.evaluate(
      (id) => {
        (window as unknown as {
          hots: Record<string, { getPlugin: (name: string) => { redo: () => void } }>;
        }).hots[id].getPlugin('undoRedo').redo();
      },
      gridId
    ));
  }

  /**
   * Removes one row through `alter('remove_row')` and waits for the draw that follows.
   */
  async removeRow(gridId: string, row: number): Promise<void> {
    await this.afterDraw(gridId, () => this.page.evaluate(
      ([id, r]) => {
        (window as unknown as {
          hots: Record<string, { alter: (action: string, index: number) => void }>;
        }).hots[id as string].alter('remove_row', r as number);
      },
      [gridId, row] as const
    ));
  }

  /**
   * Moves one cell, data and meta, through the `moveCells` plugin API and waits for the draw that
   * follows. Resolves to whether the plugin carried the move out.
   */
  async moveCell(gridId: string, from: [number, number], to: [number, number]): Promise<boolean> {
    let moved = false;

    await this.afterDraw(gridId, async() => {
      moved = await this.page.evaluate(
        ([id, source, target]) => {
          type Coords = unknown;
          const hot = (window as unknown as {
            hots: Record<string, {
              _createCellCoords: (row: number, col: number) => Coords;
              _createCellRange: (highlight: Coords, from: Coords, to: Coords) => unknown;
              getPlugin: (name: string) => { moveCellRange: (range: unknown, target: Coords) => boolean };
            }>;
          }).hots[id as string];
          const [fromRow, fromCol] = source as [number, number];
          const [toRow, toCol] = target as [number, number];
          const start = hot._createCellCoords(fromRow, fromCol);

          return hot.getPlugin('moveCells').moveCellRange(
            hot._createCellRange(start, start, start),
            hot._createCellCoords(toRow, toCol)
          );
        },
        [gridId, from, to] as const
      );
    });

    return moved;
  }

  /**
   * The `className` the cell meta stores, as the grid reports it through `getCellMeta()`.
   */
  async storedClassName(gridId: string, row: number, column: number): Promise<CellMetaClassName | undefined> {
    return this.page.evaluate(
      ([id, r, c]) => (window as unknown as {
        hots: Record<string, { getCellMeta: (row: number, col: number) => { className?: string | string[] } }>;
      }).hots[id as string].getCellMeta(r as number, c as number).className,
      [gridId, row, column] as const
    );
  }

  /**
   * Sets a cell's alignment through the real Alignment context menu: right-click the cell, hover
   * "Alignment", click the entry in the submenu.
   */
  async alignCellThroughMenu(gridId: string, row: number, column: number, entry: string): Promise<void> {
    await this.afterDraw(gridId, async() => {
      await this.cell(gridId, row, column).click({ button: 'right' });

      const contextMenu = this.page.locator('.htContextMenu:not([class*="htContextMenuSub_"]):not(.htGhostTable)');

      await expect(contextMenu).toBeVisible();
      await contextMenu.getByText('Alignment', { exact: true }).hover();

      const submenu = this.page.locator('.htContextMenuSub_Alignment');

      await expect(submenu).toBeVisible();
      await submenu.getByText(entry, { exact: true }).click();
    });
  }

  /**
   * Writes the rendered `className` back with one more class, the way a script that reads
   * `getCellMeta().className` and extends it does.
   */
  async writeRenderedClassNameBack(gridId: string, row: number, column: number, extra: string): Promise<void> {
    await this.afterDraw(gridId, () => this.page.evaluate(
      ([id, r, c, added]) => {
        const hot = (window as unknown as {
          hots: Record<string, {
            getCellMeta: (row: number, col: number) => { className?: string };
            setCellMeta: (...args: unknown[]) => void;
            render: () => void;
          }>;
        }).hots[id as string];
        const rendered = hot.getCellMeta(r as number, c as number).className ?? '';

        hot.setCellMeta(r as number, c as number, 'className', `${rendered} ${added as string}`);
        hot.render();
      },
      [gridId, row, column, extra] as const
    ));
  }

  /**
   * Changes the type of one cell through `setCellMeta()`. The cell keeps the `className` its
   * renderer stored.
   */
  async setCellType(gridId: string, row: number, column: number, type: string): Promise<void> {
    await this.afterDraw(gridId, () => this.page.evaluate(
      ([id, r, c, value]) => {
        const hot = (window as unknown as {
          hots: Record<string, { setCellMeta: (...args: unknown[]) => void; render: () => void }>;
        }).hots[id as string];

        hot.setCellMeta(r as number, c as number, 'type', value);
        hot.render();
      },
      [gridId, row, column, type] as const
    ));
  }

  /**
   * Runs one `updateSettings()` call and waits for the draw that follows.
   */
  private async updateSettings(gridId: string, settings: Record<string, unknown>): Promise<void> {
    await this.afterDraw(gridId, () => this.page.evaluate(
      ([id, value]) => {
        (window as unknown as {
          hots: Record<string, { updateSettings: (settings: unknown) => void }>;
        }).hots[id as string].updateSettings(value);
      },
      [gridId, settings] as const
    ));
  }

  /**
   * Runs an action, then waits until the grid has drawn again. The fixture counts draws on the
   * container, so the wait is a real DOM condition and a negative assertion that follows (a class
   * that must be gone) cannot pass against the frame from before the action.
   */
  private async afterDraw(gridId: string, action: () => Promise<unknown>): Promise<void> {
    const before = await this.grid(gridId).getAttribute('data-render-count');

    await action();
    await expect(this.grid(gridId)).not.toHaveAttribute('data-render-count', before ?? '');
  }
}
