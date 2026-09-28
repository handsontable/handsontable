import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page object for the xlsx round-trip fixture: a configured source grid, an empty target grid, and
 * a button that exports the first and imports the blob into the second in-page (no download).
 */
export class XlsxImportPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly status: Locator;
  readonly sourceMaster: Locator;
  readonly targetMaster: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.status = page.getByTestId('status');
    // The source grid has `fixedRowsTop: 1`, so row 0 is rendered twice: once in the master
    // table and once cloned into the top overlay. Both clones carry the same stamped
    // data-testid, so every cell locator is scoped to the master — the only layer that
    // renders each row exactly once — or an unscoped getByTestId is a strict-mode violation.
    this.sourceMaster = page.locator('[data-testid="source"] .ht_master');
    this.targetMaster = page.locator('[data-testid="target"] .ht_master');
  }

  /** Open the fixture and wait for the bundle and the source grid. */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/xlsx-import.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.sourceCell(0, 0)).toBeVisible();
  }

  sourceCell(row: number, col: number): Locator {
    return this.sourceMaster.getByTestId(`source-${row}-${col}`);
  }

  targetCell(row: number, col: number): Locator {
    return this.targetMaster.getByTestId(`target-${row}-${col}`);
  }

  /**
   * Column headers of the target grid, read from the top overlay clone. Excludes the corner
   * header (`span.colHeader.cornerHeader`, the rowHeaders corner) — it is a real `span.colHeader`
   * too, just with the negative visual index Walkontable renders the corner at.
   */
  targetHeaders(): Locator {
    return this.page.locator('[data-testid="target"] .ht_clone_top thead th span.colHeader:not(.cornerHeader)');
  }

  /** Click the round-trip button and wait for the fixture to report completion. */
  async roundTrip(): Promise<void> {
    await this.page.getByTestId('round-trip').click();
    await expect(this.status).toHaveText('done');
  }

  /**
   * Click the styles round-trip button (export -> import with `importStyles: true` -> re-export
   * the target) and wait for the fixture to report completion.
   */
  async roundTripWithStyles(): Promise<void> {
    await this.page.getByTestId('round-trip-styles').click();
    await expect(this.status).toHaveText('done-styles');
  }

  /** The `afterImport` result the fixture stored. */
  async lastImport(): Promise<Record<string, unknown>> {
    return this.page.evaluate(() => (window as unknown as { __lastImport: Record<string, unknown> }).__lastImport);
  }

  /** The values the fixture read back from the re-exported target (`window.__reexport`). */
  async reexport(): Promise<Record<string, unknown>> {
    return this.page.evaluate(() => (window as unknown as { __reexport: Record<string, unknown> }).__reexport);
  }

  /**
   * A computed CSS property of one target cell, read from the `.ht_master` layer (the same scope
   * `targetCell()` uses). With `fixedRowsTop: 1` (which the imported layout carries onto the
   * target), row 0 is also cloned into the `.ht_clone_top` overlay - that clone, not the master, is
   * what the user actually sees. Measuring the master instead is still correct: both layers render
   * from the same cell meta and stylesheet, so the cascade - and therefore the computed style - is
   * identical between them; the master is just the one `targetCell()` already scopes to.
   */
  async targetComputedStyle(row: number, col: number, prop: string): Promise<string> {
    return this.page.evaluate(([r, c, cssProp]) => {
      const cell = document.querySelector(
        `[data-testid="target"] .ht_master [data-testid="target-${r}-${c}"]`
      ) as HTMLElement | null;

      if (!cell) {
        throw new Error(`No target cell at row ${r}, col ${c}`);
      }

      return getComputedStyle(cell).getPropertyValue(cssProp);
    }, [row, col, prop] as const);
  }

  /**
   * Borders the target grid's `customBorders` plugin actually holds, read through `getBorders()`
   * and reduced to plain `{ row, col, <side>: { width, color } }` objects — the plugin's own
   * border entries also carry bookkeeping fields (`id`, `border` metadata) that this strips.
   */
  async targetBorders(): Promise<Array<Record<string, unknown>>> {
    return this.page.evaluate(() => {
      const target = (window as unknown as {
        __target: {
          getPlugin(name: string): { getBorders(): Array<Record<string, unknown>> };
        };
      }).__target;
      const SIDES = ['top', 'bottom', 'start', 'end', 'left', 'right'];

      return target.getPlugin('customBorders').getBorders().map((border) => {
        const plain: Record<string, unknown> = { row: border.row, col: border.col };

        SIDES.forEach((side) => {
          const value = border[side] as { width?: number; color?: string } | undefined;

          if (value && typeof value === 'object') {
            plain[side] = { width: value.width, color: value.color };
          }
        });

        return plain;
      });
    });
  }

  /**
   * Merged cells the target grid actually holds, read from the MergeCells plugin's collection
   * rather than from the import result. The result only says what the mapper produced; the plugin
   * validates every merge against the table that exists when the setting is applied and silently
   * drops the ones that reach past the last row, so this is the only assertion that proves the
   * merge survived into the grid.
   */
  async targetMergedCells(): Promise<Array<Record<string, number>>> {
    return this.page.evaluate(() => {
      const target = (window as unknown as {
        __target: {
          getPlugin(name: string): {
            mergedCellsCollection: { mergedCells: Array<Record<string, number>> };
          };
        };
      }).__target;

      return target.getPlugin('mergeCells').mergedCellsCollection.mergedCells.map(
        ({ row, col, rowspan, colspan }) => ({ row, col, rowspan, colspan }),
      );
    });
  }

  /** One source-data cell of the target grid, so a live formula is read as its `=...` string. */
  async targetSourceCell(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(([r, c]) => {
      const target = (window as unknown as {
        __target: { getSourceDataAtCell(r: number, c: number): unknown };
      }).__target;

      return target.getSourceDataAtCell(r, c);
    }, [row, col]);
  }

  /** One setting of the target grid, read through `getSettings()`. */
  async targetSetting(key: string): Promise<unknown> {
    return this.page.evaluate((settingKey) => {
      const target = (window as unknown as {
        __target: { getSettings(): Record<string, unknown> };
      }).__target;

      return target.getSettings()[settingKey];
    }, key);
  }

  /**
   * Cell meta of the target grid, for type assertions the DOM cannot show. Cell meta is
   * prototype-chained (per-cell overrides sit in front of column settings, which sit in front of
   * global settings), so a key like `type` set at the column level is an INHERITED property, not
   * an own one. `page.evaluate()` structured-clones only own enumerable properties, so returning
   * `getCellMeta()` directly silently drops every inherited key. Walk the chain with `for...in`
   * inside the page and copy serializable values into a plain object before returning.
   */
  async targetCellMeta(row: number, col: number): Promise<Record<string, unknown>> {
    return this.page.evaluate(
      ([r, c]) => {
        const target = (window as unknown as {
          __target: { getCellMeta(r: number, c: number): Record<string, unknown> };
        }).__target;
        const meta = target.getCellMeta(r, c);
        const plain: Record<string, unknown> = {};

        for (const key in meta) {
          if (typeof meta[key] !== 'function') {
            plain[key] = meta[key];
          }
        }

        return plain;
      },
      [row, col],
    );
  }

  /** Click the nested-header round-trip button and wait for the fixture to report completion. */
  async roundTripNested(): Promise<void> {
    await this.page.getByTestId('round-trip-nested').click();
    await expect(this.status).toHaveText('done-nested');
  }

  /**
   * The target grid's rendered column-header rows, one array of cell texts per row, read from the
   * top overlay clone - the only layer that renders the header exactly once.
   */
  async targetHeaderLayers(): Promise<string[][]> {
    return this.page.evaluate(() => {
      const rows = document.querySelectorAll('[data-testid="target"] .ht_clone_top thead tr');

      return Array.from(rows).map(row => Array.from(row.querySelectorAll('th'))
        .map(th => (th.textContent ?? '').trim()));
    });
  }

  /**
   * The `colspan` of every `th` in the target grid's FIRST rendered header row, which is what proves
   * a nested header group reached the DOM rather than just the settings object.
   */
  async targetHeaderColspans(): Promise<number[]> {
    return this.page.evaluate(() => {
      const row = document.querySelector('[data-testid="target"] .ht_clone_top thead tr');

      return Array.from(row?.querySelectorAll('th') ?? []).map(th => th.colSpan);
    });
  }
}
