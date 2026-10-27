import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/** Which grid of the fixture a locator or probe addresses. */
export type GridName = 'row-headers' | 'frozen' | 'scrolled' | 'rtl' | 'no-row-headers';

/** How far the open editor reaches past the edited cell, in CSS pixels. */
export interface EditorOverhang {
  /** Past the cell's inline-start edge. Positive: the editor starts outside the cell. */
  start: number;
  /** The editor's width minus the cell's width. */
  width: number;
}

/**
 * Page Object for the editor-under-row-headers fixture.
 *
 * The editor is a box laid over the cell, so the number that matters is where its edges stand
 * against the cell's, not either one's absolute position.
 */
export class EditorRowHeaderBorderPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  readonly zoom: string;

  constructor(page: Page, theme = 'main', bundle = 'umd', zoom = '1') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.zoom = zoom;
  }

  /**
   * Navigate to the fixture and wait for the last grid to render. The wait is a real DOM
   * condition, never a readiness flag.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/editor-row-header-border.html?theme=${this.theme}&bundle=${this.bundle}&zoom=${this.zoom}`);
    await awaitBundle(this.page);
    await expect(this.page.getByTestId('no-row-headers').locator('.ht_master tbody td').first()).toBeVisible();
  }

  /**
   * The editor's holder box of one grid.
   *
   * @param {GridName} grid The grid.
   * @returns {Locator}
   */
  editor(grid: GridName): Locator {
    return this.page.getByTestId(grid).locator('.handsontableInputHolder');
  }

  /**
   * Select a cell and open its editor with Enter.
   *
   * @param {GridName} grid The grid.
   * @param {number} row The visual row.
   * @param {number} col The visual column.
   */
  async openEditor(grid: GridName, row: number, col: number): Promise<void> {
    await this.page.evaluate(([name, r, c]) => {
      (window as unknown as Record<string, { selectCell: (r: number, c: number) => void }>)[
        `hot_${name.replace(/-/g, '_')}`].selectCell(r, c);
    }, [grid, row, col] as const);
    await this.page.keyboard.press('Enter');
    // A closed editor stays in the DOM with its holder placed, and Playwright counts its opacity 0
    // as visible, so wait for the class the open editor drops.
    await expect(this.editor(grid)).not.toHaveClass(/ht_editor_hidden/);
  }

  /**
   * Scroll a grid horizontally and return the first column it shows fully, which is not column 0.
   *
   * @param {GridName} grid The grid.
   * @returns {Promise<number>}
   */
  async scrollToFirstVisibleColumn(grid: GridName): Promise<number> {
    const hotKey = `hot_${grid.replace(/-/g, '_')}`;

    await this.page.evaluate((key) => {
      (window as unknown as Record<string, { scrollViewportTo: (o: object) => void }>)[key]
        .scrollViewportTo({ row: 0, col: 8, horizontalSnap: 'start' });
    }, hotKey);

    await expect.poll(() => this.page.evaluate((key) => {
      return (window as unknown as Record<string, { getFirstFullyVisibleColumn: () => number }>)[key]
        .getFirstFullyVisibleColumn();
    }, hotKey)).toBeGreaterThan(0);

    return this.page.evaluate((key) => {
      return (window as unknown as Record<string, { getFirstFullyVisibleColumn: () => number }>)[key]
        .getFirstFullyVisibleColumn();
    }, hotKey);
  }

  /**
   * Whether the cell the editor of a grid edits has a row header as its previous sibling.
   *
   * @param {GridName} grid The grid.
   * @returns {Promise<boolean>}
   */
  async editedCellStandsBehindRowHeader(grid: GridName): Promise<boolean> {
    return this.page.evaluate((name) => {
      const hot = (window as unknown as Record<string, {
        getActiveEditor: () => { TD: HTMLElement },
      }>)[`hot_${name.replace(/-/g, '_')}`];

      return hot.getActiveEditor().TD.previousElementSibling?.nodeName === 'TH';
    }, grid);
  }

  /**
   * Where the open editor of a grid stands against the cell it edits. Both boxes are read in one
   * evaluate so no layout change can slip between the two reads.
   *
   * @param {GridName} grid The grid.
   * @returns {Promise<EditorOverhang>}
   */
  async overhang(grid: GridName): Promise<EditorOverhang> {
    return this.page.evaluate((name) => {
      const hot = (window as unknown as Record<string, {
        getActiveEditor: () => { TD: HTMLElement, TEXTAREA_PARENT: HTMLElement },
        isRtl: () => boolean,
      }>)[`hot_${name.replace(/-/g, '_')}`];
      const { TD, TEXTAREA_PARENT } = hot.getActiveEditor();
      const cell = TD.getBoundingClientRect();
      const editor = TEXTAREA_PARENT.getBoundingClientRect();

      const round = (value: number) => Math.round(value * 100) / 100;

      return {
        start: round(hot.isRtl() ? editor.right - cell.right : cell.left - editor.left),
        width: round(editor.width - cell.width),
      };
    }, grid);
  }
}
