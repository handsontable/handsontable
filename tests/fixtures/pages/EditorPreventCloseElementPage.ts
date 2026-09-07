import { type Locator, type Page, expect } from '@playwright/test';

interface HandsontableFixture {
  getSelected(): number[][] | undefined;
  getActiveEditor(): { isOpened(): boolean; state: string } | undefined;
  getDataAtCell(row: number, col: number): unknown;
}

// Deliberately not `extends Window`: `windowTypes.ts` already declares `hot` globally with the full
// instance type, and narrowing it here to the members these probes use would be a TS2430 conflict.
// Every access goes through an explicit cast anyway.
interface FixtureWindow {
  hot: HandsontableFixture;
  htChanges: unknown[][];
  htWarnLog: string[];
}

interface PageOptions {
  outsideClickDeselects?: boolean;
  surfaceAssignedIn?: 'init' | 'afterOpen';
  surfaceElement?: 'panel' | 'body';
  host?: 'document' | 'shadow';
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
  readonly surfaceAssignedIn: string;
  readonly surfaceElement: string;
  readonly host: string;
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
    this.surfaceAssignedIn = options.surfaceAssignedIn ?? 'init';
    this.surfaceElement = options.surfaceElement ?? 'panel';
    this.host = options.host ?? 'document';
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
      `&outsideClickDeselects=${this.outsideClickDeselects}` +
      `&surfaceAssignedIn=${this.surfaceAssignedIn}` +
      `&surfaceElement=${this.surfaceElement}` +
      `&host=${this.host}`;

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
   * The precondition matters more than it looks. A popup that leaves the focus on the editor's own
   * input never reaches the focus-driven outside-click verdict, because that input sits inside
   * `rootElement` and `isForeignFocusTarget()` therefore reads `false` - which is why the
   * `color-picker` recipe survives the defect this suite covers and the `flatpickr` one does not.
   * (Not because `tableView`'s `mouseup` handler returns early on a focused input: that return
   * needs `!isOutsideInput(element)`, and `isOutsideInput` is only `false` for an element carrying
   * `data-hot-input`, which `editorFactory` never stamps on `editor.input`.) Without asserting the
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
   * Presses the fixture's dedicated out-of-grid target, an ordinary element inside `body` clear of
   * both the grid and the panel.
   *
   * Deliberately NOT a measured point on the page background. The browser resolves such a point to
   * `<html>`, and `composedPath()` for an event on `<html>` does not carry `document.body` - so a
   * surface wrongly set to `body` would never turn up in the path and every case built on that
   * press would pass whether the guard works or not. That is exactly how the shadow-boundary case
   * here first went green against the defect it was written for.
   *
   * The element's identity is asserted through `elementFromPoint` before the press, so a later
   * layout edit that slides the grid or the panel over it fails loudly instead of quietly pressing
   * the wrong thing.
   */
  async clickOutsideEverything(): Promise<void> {
    const landsOutside = await this.page.evaluate(() => {
      const outside = document.querySelector('[data-testid="outside-target"]');

      if (outside === null) {
        return false;
      }

      const box = outside.getBoundingClientRect();
      const target = document.elementFromPoint(box.x + (box.width / 2), box.y + (box.height / 2));

      return target === outside;
    });

    if (!landsOutside) {
      throw new Error('The out-of-grid target is covered by something else');
    }

    await this.page.getByTestId('outside-target').click();
  }

  /**
   * Presses inside the panel and releases the pointer OUTSIDE it, the gesture a real picker's
   * slider produces (dragging Pickr's hue bar past its edge, for one).
   *
   * This is what tells the fix's two halves apart. The press is swallowed by the factory's own
   * `mousedown` `stopPropagation`, so only the release reaches the document handler - and its
   * event path runs through the page, not through the panel, so `#isPathWithinGrid()` cannot
   * recognize it. The focused element still sits in the panel, which leaves
   * `#isFocusWithinEditorSurface()` as the only thing preventing a deselect.
   *
   * @returns {Promise<boolean>} Whether the browser focus is inside the panel at release time.
   */
  async dragFromPanelToOutside(): Promise<boolean> {
    const box = await this.panelFocusTarget.boundingBox();

    if (!box) {
      throw new Error('The panel focus target is not rendered');
    }

    await this.page.mouse.move(box.x + (box.width / 2), box.y + (box.height / 2));
    await this.page.mouse.down();

    const focusMoved = await this.#isFocusInsidePanel();

    const panelBox = await this.panel.boundingBox();

    if (!panelBox) {
      throw new Error('The picker panel is not rendered');
    }

    await this.page.mouse.move(panelBox.x + panelBox.width + 60, panelBox.y + panelBox.height + 60);
    await this.page.mouse.up();

    return focusMoved;
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
   * Returns every `console.warn` the library printed, captured by the fixture.
   */
  async warnings(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htWarnLog);
  }

  /**
   * Returns every committed change, as `[row, prop, oldValue, newValue, source]`.
   */
  async committedChanges(): Promise<unknown[][]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htChanges);
  }
}
