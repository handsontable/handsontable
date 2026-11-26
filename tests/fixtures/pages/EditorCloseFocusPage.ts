import { type Page, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

/** Which grid of the fixture a probe addresses. */
export type GridName = 'plain' | 'ime';

/** The `window` handle each grid of the fixture is published under. */
const INSTANCES: Record<GridName, string> = {
  plain: 'hotPlain',
  ime: 'hotIme',
};

/** What holds the browser focus, in the terms a spec asserts on. */
export interface FocusProbe {
  /** The tag of the focused element, lower case. */
  tag: string;
  /** Whether the focused element is the rendered cell at the given coordinates. */
  isCell: boolean;
  /** Whether the focused element sits inside an editor holder that is hidden. */
  inHiddenEditor: boolean;
}

/**
 * Page Object for the editor close focus fixture.
 *
 * Closing an editor must hand the browser focus back to the cell it edited, because that focus move
 * is what a screen reader reads. The object drives the grid with real key presses and reads where
 * the browser focus is afterwards.
 */
export class EditorCloseFocusPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate to the fixture and wait for both grids to render. The wait is a real DOM condition,
   * the last grid's first row header, never a readiness flag.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/editor-close-focus.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.page.getByTestId('ime').locator('.ht_master tbody tr').first()).toBeVisible();
  }

  /** Select a cell through the API, without waiting for the browser focus. */
  async select(grid: GridName, row: number, col: number): Promise<void> {
    await this.page.evaluate(([name, r, c]) => {
      (window as any)[name].selectCell(r, c);
    }, [INSTANCES[grid], row, col] as const);
  }

  /** Select a cell through the API and wait for the browser focus to land on it. */
  async selectCell(grid: GridName, row: number, col: number): Promise<void> {
    await this.select(grid, row, col);
    await expect.poll(() => this.focus(grid, row, col).then(probe => probe.isCell)).toBe(true);
  }

  /** Make Enter commit without moving the selection (`enterMoves` of zero on both axes). */
  async keepSelectionOnEnter(grid: GridName): Promise<void> {
    await this.page.evaluate((name) => {
      (window as any)[name].updateSettings({ enterMoves: { row: 0, col: 0 } });
    }, INSTANCES[grid]);
  }

  /** Open the editor of the selected cell with Enter and wait until it is open. */
  async openEditor(grid: GridName): Promise<void> {
    await this.page.keyboard.press('Enter');
    await expect.poll(() => this.isEditorOpen(grid)).toBe(true);
  }

  /**
   * Press Escape until the editor is closed. The native date and time inputs take the first Escape
   * for their picker in some engines, so a second press is part of closing them.
   */
  async closeWithEscape(grid: GridName): Promise<void> {
    for (let press = 0; press < 3; press++) {
      await this.page.keyboard.press('Escape');

      if (!await this.isEditorOpen(grid)) {
        return;
      }
    }

    await expect.poll(() => this.isEditorOpen(grid)).toBe(false);
  }

  /** Whether the grid has an OPEN editor. The closed editor stays in the DOM. */
  async isEditorOpen(grid: GridName): Promise<boolean> {
    return this.page.evaluate((name) => {
      const editor = (window as any)[name].getActiveEditor();

      return !!editor && editor.isOpened();
    }, INSTANCES[grid]);
  }

  /** Where the browser focus is, judged against the cell at the given coordinates. */
  async focus(grid: GridName, row: number, col: number): Promise<FocusProbe> {
    return this.page.evaluate(([name, r, c]) => {
      const active = document.activeElement as HTMLElement | null;
      const cell = (window as any)[name].getCell(r, c);

      return {
        tag: active ? active.tagName.toLowerCase() : 'none',
        isCell: !!active && active === cell,
        inHiddenEditor: !!active && !!active.closest('.ht_editor_hidden'),
      };
    }, [INSTANCES[grid], row, col] as const);
  }

  /**
   * Start recording every element that takes the browser focus, from now on. A cell is recorded as
   * `[row, col]`, any other element as its lower-case tag. The final focus alone cannot tell one
   * move from a stop on the wrong cell followed by the right one, and a screen reader reads each stop.
   */
  async startFocusLog(grid: GridName): Promise<void> {
    await this.page.evaluate((name) => {
      const hot = (window as any)[name];
      const log: Array<[number, number] | string> = [];

      (window as any).__focusLog = log;
      document.addEventListener('focusin', (event) => {
        const target = event.target as HTMLElement;
        const coords = target.tagName === 'TD' ? hot.getCoords(target) : null;

        log.push(coords ? [coords.row, coords.col] : target.tagName.toLowerCase());
      }, true);
    }, INSTANCES[grid]);
  }

  /** What took the browser focus since `startFocusLog()`, in order. */
  async focusLog(): Promise<Array<[number, number] | string>> {
    return this.page.evaluate(() => (window as any).__focusLog);
  }

  /** The selection highlight, as `[row, col]`. */
  async selection(grid: GridName): Promise<[number, number] | null> {
    return this.page.evaluate((name) => {
      const selected = (window as any)[name].getSelectedLast();

      return selected ? [selected[0], selected[1]] : null;
    }, INSTANCES[grid]);
  }

  /** The value of a cell, read from the source data. */
  async dataAtCell(grid: GridName, row: number, col: number): Promise<unknown> {
    return this.page.evaluate(([name, r, c]) => (window as any)[name].getDataAtCell(r, c), [INSTANCES[grid], row, col] as const);
  }

  /**
   * Let the debounced `imeFastEdit` refocus settle, then report what holds the focus. The refocus
   * runs a timer after the selection (`FocusGridManager#refocusToEditorTextarea`), so the settle is
   * two animation frames and the read happens in the same evaluation. Only a positive control (the
   * focus having arrived on the textarea first) makes this a valid "it stayed" assertion.
   */
  async settledFocusTag(): Promise<string> {
    return this.page.evaluate(async() => {
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

      return document.activeElement ? document.activeElement.tagName.toLowerCase() : 'none';
    });
  }
}
