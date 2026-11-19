import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, assertKnownBundle, type Bundle } from '../bundle';

export type ListCellType = 'autocomplete' | 'dropdown' | 'handsontable';

/**
 * The choices every list column offers. They share the `'Al'` prefix, so `autocomplete`, which filters by
 * the typed value, lists the same entries as `dropdown`.
 */
export const CHOICES = ['Alpha', 'Alfa', 'Alto'];

/**
 * A value wider than the narrow columns, so the open editor has to decide how far it grows.
 */
export const LONG_TEXT = 'Alpha Alfa Alto Alpha Alfa Alto';

/**
 * A stored value holding a line break, which a single-line field cannot hold.
 */
export const MULTI_LINE_TEXT = 'Al\npha';

/**
 * What the open editor's field is, read in one evaluation.
 */
export interface EditorField {
  tagName: string;
  type: string | null;
  autocomplete: string | null;
  hotInput: boolean;
  tabIndex: string | null;
  inHolder: boolean;
  value: string;
}

/**
 * A box in viewport coordinates.
 */
export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface FixtureWindow {
  Handsontable: new(element: Element, settings: object) => unknown;
  htTestLicenseKey: string;
  hot: {
    selectCell(row: number, col: number, toRow?: number, toCol?: number): boolean;
    getSourceDataAtCell(row: number, col: number): unknown;
    getCell(row: number, col: number): HTMLElement | null;
    getActiveEditor(): { isOpened(): boolean; TEXTAREA: HTMLElement } | undefined;
    getPlugin(name: string): { isUndoAvailable(): boolean };
    getCurrentThemeName(): string | undefined;
    useTheme(themeName: string): void;
  };
}

/**
 * Page Object for the field the list cell editors edit in (`tests/fixtures/demo/list-editor-input.html`).
 *
 * The fixture loads the bundle and leaves the container empty, so each test builds the grid with `build()`.
 * The grid has four columns: `0` the list cell type under test, `1` a text column, both wide enough for
 * their values, and `2` the list cell type and `3` a text column again, both narrower than `LONG_TEXT`.
 * Row `0` holds `'Al'`, row `1` `MULTI_LINE_TEXT`, row `2` `LONG_TEXT`. Cells carry
 * `data-testid="cell-<row>-<col>"`.
 */
export class ListEditorInputPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly cellType: ListCellType;
  /**
   * The open editor's field. Every editor class keeps its holder in the DOM for good and only hides it
   * when it closes, so the field of the open editor is the one in a visible holder.
   */
  readonly editorField: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd', cellType: ListCellType = 'autocomplete') {
    assertKnownBundle(bundle, '(page, theme, bundle, cellType)');
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.cellType = cellType;
    this.editorField = page.locator('.handsontableInputHolder:not(.ht_editor_hidden) .handsontableInput');
  }

  /**
   * Opens the fixture and waits for the bundle.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/list-editor-input.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
  }

  /**
   * Builds the grid and waits for its first cell.
   *
   * @param {object} [settings] Settings added to the fixture's grid.
   */
  async build(settings: Record<string, unknown> = {}): Promise<void> {
    await this.page.evaluate(({ cellType, choices, longText, multiLineText, extra }) => {
      const win = window as unknown as FixtureWindow;
      const listColumn = cellType === 'handsontable'
        ? { type: 'handsontable', handsontable: { data: choices.map(choice => [choice]) } }
        : { type: cellType, source: choices };
      const container = document.querySelector('[data-testid="grid"]') as Element;

      win.hot = new win.Handsontable(container, {
        data: [
          ['Al', 'Al', 'Al', 'Al'],
          [multiLineText, multiLineText, multiLineText, multiLineText],
          [longText, longText, longText, longText],
        ],
        columns: [listColumn, {}, listColumn, {}],
        colWidths: [160, 160, 60, 60],
        rowHeaders: true,
        colHeaders: true,
        undo: true,
        ...extra,
        afterRenderer(td: HTMLElement, row: number, col: number) {
          td.setAttribute('data-testid', `cell-${row}-${col}`);
        },
        licenseKey: win.htTestLicenseKey,
      }) as FixtureWindow['hot'];
    }, {
      cellType: this.cellType,
      choices: CHOICES,
      longText: LONG_TEXT,
      multiLineText: MULTI_LINE_TEXT,
      extra: settings,
    });
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell, by visual row and column.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Selects a cell or a range through the API, so the keys that follow reach the grid.
   */
  async selectCell(row: number, col: number, toRow = row, toCol = col): Promise<void> {
    await this.page.evaluate(([r, c, tr, tc]) => {
      (window as unknown as FixtureWindow).hot.selectCell(r, c, tr, tc);
    }, [row, col, toRow, toCol]);
    await expect(this.cell(row, col)).toHaveClass(/\bcurrent\b/);
  }

  /**
   * Whether the active cell editor is open.
   */
  async isEditorOpened(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getActiveEditor()?.isOpened() ?? false);
  }

  /**
   * Waits for the active editor to open.
   */
  async expectEditorOpened(): Promise<void> {
    await expect.poll(() => this.isEditorOpened()).toBe(true);
  }

  /**
   * Describes the active editor's field (`editor.TEXTAREA`), read in one evaluation.
   */
  async editorFieldState(): Promise<EditorField> {
    return this.page.evaluate(() => {
      const field = (window as unknown as FixtureWindow).hot.getActiveEditor()!.TEXTAREA as HTMLInputElement;

      return {
        tagName: field.tagName.toLowerCase(),
        type: field.getAttribute('type'),
        autocomplete: field.getAttribute('autocomplete'),
        hotInput: field.hasAttribute('data-hot-input'),
        tabIndex: field.getAttribute('tabindex'),
        inHolder: field.parentElement?.classList.contains('handsontableInputHolder') ?? false,
        value: field.value,
      };
    });
  }

  /**
   * The open editor's field box and the edited cell's box, read in one evaluation.
   *
   * @param {number} row The visual row of the edited cell.
   * @param {number} col The visual column of the edited cell.
   */
  async editorAndCellBoxes(row: number, col: number): Promise<{ field: Box, cell: Box }> {
    return this.page.evaluate(([r, c]) => {
      const { hot } = window as unknown as FixtureWindow;
      const toBox = (rect: DOMRect) => ({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });

      return {
        field: toBox(hot.getActiveEditor()!.TEXTAREA.getBoundingClientRect()),
        cell: toBox(hot.getCell(r, c)!.getBoundingClientRect()),
      };
    }, [row, col]);
  }

  /**
   * A cell's source value.
   */
  async sourceDataAtCell(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(([r, c]) => (window as unknown as FixtureWindow).hot.getSourceDataAtCell(r, c), [row, col]);
  }

  /**
   * Switches the grid to a theme other than the one it runs on, through `hot.useTheme()`, after the target
   * theme's stylesheet has loaded. A theme change closes an open editor without ending its edit.
   */
  async switchToAnotherTheme(): Promise<void> {
    await this.page.evaluate(async() => {
      const { hot } = window as unknown as FixtureWindow;
      const current = hot.getCurrentThemeName();
      const target = ['ht-theme-main', 'ht-theme-horizon', 'ht-theme-classic'].find(name => name !== current)!;
      const link = document.createElement('link');

      link.rel = 'stylesheet';
      link.href = `/handsontable/styles/${target}.min.css`;
      await new Promise<void>((resolve, reject) => {
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`The stylesheet of ${target} did not load`));
        document.head.appendChild(link);
      });
      hot.useTheme(target);
    });
  }

  /**
   * Whether the UndoRedo plugin has a step to undo.
   */
  async isUndoAvailable(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getPlugin('undoRedo').isUndoAvailable());
  }
}
