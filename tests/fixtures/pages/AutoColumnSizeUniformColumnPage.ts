import { type Page, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt, type Bundle } from '../bundle';

/**
 * The cases the fixture builds, each a grid shape that reaches the AutoColumnSize sampler another way.
 */
export type UniformColumnCase =
  'plain' | 'storedValueFormatter' | 'cellOption' | 'modifyData' | 'hidingMap' | 'pagination' | 'sorted' |
  'numeric' | 'keyValueDropdown' | 'dotNotation' | 'cellsFunction' | 'checkboxLabel' | 'seedListener';

interface FixtureWindow extends Window {
  buildGrid(name: UniformColumnCase, perCell: boolean): number[];
}

/**
 * Page Object for the AutoColumnSize uniform column fixture. A case is built twice: as it is, and with a
 * no-op `afterGetCellMeta` listener that sends every cell down the per-cell read.
 */
export class AutoColumnSizeUniformColumnPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture and waits for its first grid.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/auto-column-size-uniform-column.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.page.getByTestId('grid').locator('.ht_master td').first()).toBeVisible();
  }

  /**
   * Builds a case and returns every column's width.
   *
   * @param name The case.
   * @param perCell Whether every cell is read on its own.
   */
  async widths(name: UniformColumnCase, perCell: boolean): Promise<number[]> {
    return this.page.evaluate(
      ([caseName, forcePerCell]) => (window as unknown as FixtureWindow).buildGrid(caseName, forcePerCell),
      [name, perCell] as const,
    );
  }
}
