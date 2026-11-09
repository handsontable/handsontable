import { GridPage } from './GridPage';

type MenuPlugin = 'contextMenu' | 'dropdownMenu';

/**
 * Page Object for `ContextMenu#executeCommand()` and `DropdownMenu#executeCommand()`: runs a command
 * straight through the plugin API, with no menu open, and reports what it threw instead of failing
 * the test, so a spec can pin both the effect and the error.
 */
export class MenuExecuteCommandPage extends GridPage {
  /** Re-configures the fixture grid with the given settings (menus, columns, data). */
  async configure(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate((value) => {
      (window as any).hot.updateSettings(value);
    }, settings);
  }

  /** Selects whole columns by their visual indexes, the way a click on the column header does. */
  async selectColumns(from: number, to = from): Promise<void> {
    await this.page.evaluate(([start, end]) => {
      (window as any).hot.selectColumns(start, end);
    }, [from, to]);
  }

  /** Selects a single cell, so no column header is selected. */
  async selectCellProgrammatically(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => {
      (window as any).hot.selectCell(r, c);
    }, [row, col]);
  }

  /** Clears the selection. */
  async deselect(): Promise<void> {
    await this.page.evaluate(() => {
      (window as any).hot.deselectCell();
    });
  }

  /**
   * Runs `executeCommand()` on a menu plugin and returns the message of what it threw, or `null`
   * when it ran clean. `params` go through as the extra arguments of `executeCommand()`.
   */
  async executeCommand(plugin: MenuPlugin, command: string, ...params: unknown[]): Promise<string | null> {
    return this.page.evaluate(([pluginName, commandName, extra]) => {
      try {
        (window as any).hot.getPlugin(pluginName).executeCommand(commandName, ...(extra as unknown[]));
      } catch (error) {
        return (error as Error).message;
      }

      return null;
    }, [plugin, command, params] as const);
  }

  /** The grid's source data as a plain array of rows. */
  async data(): Promise<unknown[][]> {
    return this.page.evaluate(() => (window as any).hot.getData());
  }

  /** The number of columns the grid holds. */
  async countCols(): Promise<number> {
    return this.page.evaluate(() => (window as any).hot.countCols());
  }

  /** One property of a cell's meta. */
  async cellMeta(row: number, col: number, key: string): Promise<unknown> {
    return this.page.evaluate(([r, c, k]) => (window as any).hot.getCellMeta(r, c)[k as string], [row, col, key] as const);
  }

  /** Undoes the last change through the UndoRedo plugin. */
  async undo(): Promise<void> {
    await this.page.evaluate(() => {
      (window as any).hot.getPlugin('undoRedo').undo();
    });
  }
}
