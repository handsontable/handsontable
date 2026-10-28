import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/** Which grid of the fixture a locator or probe addresses. */
export type GridName =
  'row-headers' | 'frozen' | 'frozen-rows' | 'scrolled' | 'scrolled-top' | 'rtl' | 'no-row-headers';

/** How far the open editor reaches past the edited cell, in CSS pixels. */
export interface EditorOverhang {
  /** Past the cell's inline-start edge. Positive: the editor starts outside the cell. */
  start: number;
  /** The editor's width minus the cell's width. */
  width: number;
}

/**
 * Where a selection's start edge stands.
 */
export interface StartEdgeMeasure {
  /**
   * Past the cell's inline-start edge. Negative: the edge is centered on the gridline before the cell.
   */
  offset: number;
  /**
   * How much of the edge lies inside an inline-start overlay's table, which paints over it.
   */
  hiddenUnderOverlay: number;
}

/**
 * The layer whose copy of the selection edge is measured: the master table or a frozen row's clone.
 */
export type EdgeLayer = 'master' | 'top' | 'bottom';

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

  /**
   * Scroll a grid so that a column is the first one it shows, and wait until the scroll has settled.
   * Reading the first visible column while the viewport is still moving can return an interim one.
   *
   * @param {GridName} grid The grid.
   * @param {number} col The visual column.
   */
  async scrollToColumn(grid: GridName, col: number): Promise<void> {
    const hotKey = `hot_${grid.replace(/-/g, '_')}`;

    await this.page.evaluate(([key, c]) => {
      (window as unknown as Record<string, { scrollViewportTo: (o: object) => void }>)[key]
        .scrollViewportTo({ row: 0, col: c, horizontalSnap: 'start' });
    }, [hotKey, col] as const);

    await expect.poll(() => this.page.evaluate((key) => {
      return (window as unknown as Record<string, { getFirstFullyVisibleColumn: () => number }>)[key]
        .getFirstFullyVisibleColumn();
    }, hotKey)).toBe(col);
  }

  /**
   * Measure the selection's start edge of a cell against the cell and against the inline-start
   * overlays, which are painted over the layer the edge lives in. The edge is 2px wide. Centered on the
   * gridline it shares with the previous cell, it loses its first pixel under an overlay whenever the
   * overlay's table ends where the cell starts, so the number that matters is how much of it lies
   * inside one. Every box is read in one evaluate, so no layout change can slip between the reads.
   *
   * @param {GridName} grid The grid.
   * @param {number} row The visual row.
   * @param {number} col The visual column.
   * @param {object} [options] The measure options.
   * @param {EdgeLayer} [options.layer] The layer whose copy of the edge is measured. A cell of a frozen
   *   row is covered by the layer of that row, not by the master table's copy under it.
   * @param {boolean} [options.select] Select the cell first. Off, the selection a scroll left is measured.
   * @returns {Promise<StartEdgeMeasure|null>} `null` while the layer draws no start edge of the cell.
   */
  async startEdge(
    grid: GridName,
    row: number,
    col: number,
    { layer = 'master', select = true }: { layer?: EdgeLayer, select?: boolean } = {},
  ): Promise<StartEdgeMeasure | null> {
    return this.page.evaluate(([name, r, c, edgeLayer, shouldSelect]) => {
      const hot = (window as unknown as Record<string, {
        selectCell: (row: number, col: number) => void,
        getCell: (row: number, col: number, topmost?: boolean) => HTMLElement,
        isRtl: () => boolean,
      }>)[`hot_${name.replace(/-/g, '_')}`];

      if (shouldSelect) {
        hot.selectCell(r, c);
      }

      const root = document.querySelector(`[data-testid="${name}"]`)!;
      // The topmost copy: a frozen row's cell is only the clone's when the master's is covered.
      const cellElement = hot.getCell(r, c, true);

      // Not drawn yet: the caller polls until the clone has caught up with a scroll.
      if (!cellElement) {
        return null;
      }

      const cell = cellElement.getBoundingClientRect();
      const isRtl = hot.isRtl();
      const round = (value: number) => Math.round(value * 100) / 100;
      const overlays = [...root.querySelectorAll<HTMLElement>(
        '.ht_clone_inline_start table, .ht_clone_top_inline_start_corner table, ' +
        '.ht_clone_bottom_inline_start_corner table'
      )].map(table => table.getBoundingClientRect()).filter(rect => rect.width > 0);

      // The layer draws four edges of the current selection. The start one is the 2px wide box that
      // stands on the start half of the cell, as opposed to the end one next to the cell's end.
      const layerClass = edgeLayer === 'master' ? '.ht_master' : `.ht_clone_${edgeLayer}`;
      const edge = [...root.querySelectorAll<HTMLElement>(`${layerClass} .wtBorder.current`)]
        .map(element => element.getBoundingClientRect())
        .find(rect => Math.abs(rect.width - 2) < 0.5 &&
          (isRtl ? rect.right > cell.right - cell.width / 2 : rect.left < cell.left + cell.width / 2));

      if (!edge) {
        return null;
      }

      return {
        offset: round(isRtl ? cell.right - edge.right : edge.left - cell.left),
        hiddenUnderOverlay: round(Math.max(0, ...overlays.map(
          overlay => Math.min(edge.right, overlay.right) - Math.max(edge.left, overlay.left)
        ))),
      };
    }, [grid, row, col, layer, select] as const);
  }
}
