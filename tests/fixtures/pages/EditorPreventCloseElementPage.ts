import { type Locator, type Page, expect } from '@playwright/test';

interface HandsontableFixture {
  getSelected(): number[][] | undefined;
  getActiveEditor(): { isOpened(): boolean; state: string } | undefined;
  getDataAtCell(row: number, col: number): unknown;
}

interface FixtureWindow extends Window {
  hot: HandsontableFixture;
  htChanges: unknown[][];
}

interface PageOptions {
  outsideClickDeselects?: boolean;
}

/**
 * Page Object for the fixture whose custom editor renders a picker panel OUTSIDE the grid's root
 * element and declares it through `preventCloseElement`.
 */
export class EditorPreventCloseElementPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly outsideClickDeselects: boolean;
  readonly panel: Locator;
  readonly panelFocusTarget: Locator;
  readonly panelSetValueTarget: Locator;
  readonly panelCommitTarget: Locator;
  readonly panelInput: Locator;
  readonly editorInput: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd', options: PageOptions = {}) {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.outsideClickDeselects = options.outsideClickDeselects ?? true;
    this.panel = page.getByTestId('picker-panel');
    this.panelFocusTarget = page.getByTestId('panel-focus');
    this.panelSetValueTarget = page.getByTestId('panel-set-value');
    this.panelCommitTarget = page.getByTestId('panel-commit');
    this.panelInput = page.getByTestId('panel-input');
    this.editorInput = page.getByTestId('editor-input');
  }

  /**
   * Opens the fixture and waits for the first data cell to render.
   */
  async goto(): Promise<void> {
    const query = `theme=${this.theme}&bundle=${this.bundle}` +
      `&outsideClickDeselects=${this.outsideClickDeselects}`;

    await this.page.goto(`/tests/fixtures/demo/editor-prevent-close-element.html?${query}`);

    // Wait for the bundle before the cell. The test id comes from the fixture's `afterRenderer`, so
    // "cell not found" alone cannot tell a slow bundle apart from a grid that failed to render.
    await this.page.waitForFunction(() => 'Handsontable' in window);

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Returns a data cell through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Selects a cell near its leading edge and opens its editor with Enter.
   *
   * The click is off-centre on purpose: a centred press can land on whatever a renderer floats to
   * the cell's trailing edge, and the midpoint moves with the column width.
   */
  async openEditor(row: number, col: number): Promise<void> {
    const box = await this.cell(row, col).boundingBox();

    if (!box) {
      throw new Error(`Cell (${row}, ${col}) is not rendered`);
    }

    await this.page.mouse.click(box.x + 4, box.y + (box.height / 2));

    await expect.poll(() => this.selected()).toEqual([[row, col, row, col]]);

    await this.page.keyboard.press('Enter');

    await expect.poll(() => this.isEditorOpen()).toBe(true);
    await expect(this.panel).toBeVisible();
  }

  /**
   * Clicks the panel's focusable element and reports whether the browser focus actually landed
   * inside the panel.
   *
   * The precondition matters more than it looks. A popup that keeps the focus in the editor's own
   * input never reaches the focus-driven outside-click path at all - `tableView`'s `mouseup`
   * handler returns early while an input holds the focus - which is why the `color-picker` recipe
   * survives the defect this suite covers and the `flatpickr` one does not. Without asserting the
   * focus move, a spec here would go green on unfixed code and pin nothing.
   */
  async clickPanelFocusTarget(): Promise<boolean> {
    await this.panelFocusTarget.click();

    return this.#isFocusInsidePanel();
  }

  /**
   * Clicks the panel's `<input>`, which is the shape flatpickr's year field and month dropdown
   * have. An input outside the grid takes its own branch of the outside-click verdict
   * (`isOutsideInput` in `tableView`), reached before the focus test.
   */
  async clickPanelInput(): Promise<boolean> {
    await this.panelInput.click();

    return this.#isFocusInsidePanel();
  }

  /**
   * Clicks a point that is outside BOTH the grid and the picker panel, derived from their measured
   * boxes rather than hardcoded. A magic coordinate silently stops being outside when the fixture's
   * layout or the panel's rendered height changes, and the case would then pass for the wrong
   * reason - it is the negative control for the guard, so it has to keep landing nowhere.
   */
  async clickOutsideEverything(): Promise<void> {
    const gridBox = await this.page.getByTestId('grid').boundingBox();
    const panelBox = await this.panel.boundingBox();

    if (!gridBox || !panelBox) {
      throw new Error('The grid or the picker panel is not rendered');
    }

    // Below both boxes, not beside them: the grid's container is a block element spanning the
    // page, so there is no room to its right.
    const y = Math.max(gridBox.y + gridBox.height, panelBox.y + panelBox.height) + 40;
    const viewport = this.page.viewportSize();
    const x = viewport === null ? gridBox.x + (gridBox.width / 2) : viewport.width / 2;

    if (viewport !== null && y >= viewport.height) {
      throw new Error(`No clickable point below the grid and the panel at y=${y}`);
    }

    // The measurement above is geometry; this asserts what the browser will actually hit, so the
    // case cannot quietly start pressing the grid or the panel after a fixture edit.
    const landsOutside = await this.page.evaluate(([pointX, pointY]) => {
      const target = document.elementFromPoint(pointX, pointY);
      const grid = document.querySelector('[data-testid="grid"]');
      const panel = document.querySelector('[data-testid="picker-panel"]');

      return target !== null && grid?.contains(target) === false && panel?.contains(target) === false;
    }, [x, y]);

    if (!landsOutside) {
      throw new Error(`The point (${x}, ${y}) is not outside the grid and the panel`);
    }

    await this.page.mouse.click(x, y);
  }

  /**
   * Reports whether the browser focus landed inside the panel.
   */
  async #isFocusInsidePanel(): Promise<boolean> {
    return this.page.evaluate(() => {
      const panel = document.querySelector('[data-testid="picker-panel"]');

      return panel !== null && panel.contains(document.activeElement);
    });
  }

  /**
   * Clicks the panel's control that writes a new value straight into the editor's input, the way a
   * third-party picker reports a picked value.
   */
  async writeValueFromPanel(): Promise<void> {
    await this.panelSetValueTarget.click();

    await expect(this.editorInput).toHaveValue('FROM_PANEL');
  }

  /**
   * Clicks the panel's control that ends the edit from inside the picker, which is how the
   * documented `flatpickr` recipe commits: its `onClose` callback calls `finishEditing()`. The grid
   * has stopped listening for keystrokes by then - the browser focus genuinely sits in the picker,
   * and the focus scope manager unlistens for that on its own, unchanged since 18.0.0 - so the
   * commit cannot come from a keypress.
   */
  async commitFromPanel(): Promise<void> {
    await this.panelCommitTarget.click();
  }

  /**
   * Reports whether the cell editor is open.
   */
  async isEditorOpen(): Promise<boolean> {
    return this.page.evaluate(() => (
      (window as unknown as FixtureWindow).hot.getActiveEditor()?.isOpened() === true
    ));
  }

  /**
   * Returns the editor's state machine value, or null when there is no active editor.
   */
  async editorState(): Promise<string | null> {
    return this.page.evaluate(() => (
      (window as unknown as FixtureWindow).hot.getActiveEditor()?.state ?? null
    ));
  }

  /**
   * Returns the current selection.
   */
  async selected(): Promise<number[][] | null> {
    return this.page.evaluate(() => (
      (window as unknown as FixtureWindow).hot.getSelected() ?? null
    ));
  }

  /**
   * Returns the cell value, read from the grid rather than the DOM.
   */
  async dataAtCell(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(
      ([targetRow, targetColumn]) => (
        (window as unknown as FixtureWindow).hot.getDataAtCell(targetRow, targetColumn)
      ),
      [row, col],
    );
  }

  /**
   * Returns every committed change, as `[row, prop, oldValue, newValue, source]`.
   */
  async committedChanges(): Promise<unknown[][]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htChanges);
  }
}
