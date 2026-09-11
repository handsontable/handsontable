import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

interface EditorHandle {
  isOpened(): boolean;
  state: string;
  getEditedCell(): HTMLElement | null;
  getValue(): unknown;
  TEXTAREA?: HTMLTextAreaElement;
  htEditor?: { getSelectedActive(): number[] | undefined };
}

interface HandsontableFixture {
  getActiveEditor(): EditorHandle | undefined;
  getDataAtCell(row: number, col: number): unknown;
  selectCell(row: number, col: number): void;
}

type FixtureWindow = Window & { hot: HandsontableFixture };

/**
 * Page Object for the dropdown-scroll-round-trip fixture (DEV-26): a layered editor
 * (dropdown / autocomplete) opened in a fixed-height grid, whose edited cell is scrolled
 * out of the rendered range and then back. Encapsulates opening the editor, driving the
 * viewport scroll to and from the edited cell's band, and reading the list state.
 *
 * Column 0 is a plain text editor (the negative control), column 1 a `dropdown`, column 2
 * an `autocomplete`.
 */
export class DropdownScrollRoundTripPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate and wait for the bundle and the first data cell to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/dropdown-scroll-round-trip.html?theme=${this.theme}&bundle=${this.bundle}`,
    );
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell in the grid's master table, addressed by its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId('grid').locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Selects a cell by its leading edge, then opens the editor with Enter.
   *
   * A centred click is avoided on purpose: the list cell types right-float a dropdown arrow whose
   * `mousedown` opens the editor by itself, so a centred press races the deliberate Enter (DEV-2677).
   * The leading edge is padding in every cell type.
   */
  async openEditor(row: number, col: number): Promise<void> {
    const box = await this.cell(row, col).boundingBox();

    if (!box) {
      throw new Error(`Cell (${row}, ${col}) is not rendered`);
    }

    await this.page.mouse.click(box.x + 4, box.y + (box.height / 2));
    await this.page.keyboard.press('Enter');

    await expect.poll(() => this.editorState()).toBe('STATE_EDITING');
  }

  /**
   * The outer grid's master vertical scroll holder, whose `scrollTop` moves the viewport the way a
   * user's wheel or scrollbar drag does — firing the `afterScrollVertically` hook the editor listens
   * on. Scoped with `.first()`: the open layered editor is itself a nested Handsontable with its own
   * `.ht_master .wtHolder`, appended after the grid's tables, so the outer holder is first in the DOM.
   */
  #masterHolder(): Locator {
    return this.page.getByTestId('grid').locator('.ht_master .wtHolder').first();
  }

  /**
   * Scrolls the viewport to the bottom, taking a near-top edited cell out of the rendered range.
   * Ends on the render-state probe that the edited cell is no longer rendered — so if the grid is
   * ever tall enough to keep the cell in the band, this waits out rather than passing silently.
   */
  async scrollToBottom(): Promise<void> {
    await this.#masterHolder().evaluate((holder: HTMLElement) => {
      holder.scrollTop = holder.scrollHeight;
    });

    await expect.poll(() => this.editedCellRendered()).toBe(false);
  }

  /**
   * Scrolls the viewport back to the top, bringing the edited cell into the rendered range again.
   * Ends on the render-state probe that the edited cell is rendered once more.
   */
  async scrollToTop(): Promise<void> {
    await this.#masterHolder().evaluate((holder: HTMLElement) => {
      holder.scrollTop = 0;
    });

    await expect.poll(() => this.editedCellRendered()).toBe(true);
  }

  /**
   * Whether the edited cell currently has a rendered `TD` (i.e. is inside the rendered range).
   * `getEditedCell()` returns null once the cell scrolls out of the band — the exact condition that
   * makes `refreshDimensions()` hide the editor.
   */
  async editedCellRendered(): Promise<boolean> {
    return this.page.evaluate(() => (
      (window as FixtureWindow).hot.getActiveEditor()?.getEditedCell() != null
    ));
  }

  /**
   * The editor's state-machine value, or null when there is no active editor.
   */
  async editorState(): Promise<string | null> {
    return this.page.evaluate(() => (
      (window as FixtureWindow).hot.getActiveEditor()?.state ?? null
    ));
  }

  /**
   * The value currently held by the editor (its textarea), whether or not it is shown.
   */
  async editorValue(): Promise<string | null> {
    return this.page.evaluate(() => (
      (window as FixtureWindow).hot.getActiveEditor()?.TEXTAREA?.value ?? null
    ));
  }

  /**
   * The inner listbox table of the open layered editor. Shared by both the dropdown and the
   * autocomplete editor (both carry the `autocompleteEditor` container class).
   */
  #list(): Locator {
    return this.page.getByTestId('grid')
      .locator('.handsontableInputHolder .autocompleteEditor .ht_master .htCore');
  }

  /**
   * Every option row cell currently rendered in the open list.
   */
  options(): Locator {
    return this.#list().locator('tbody tr td');
  }

  /**
   * One option row addressed by its exact label.
   */
  optionByText(label: string): Locator {
    return this.options().filter({ hasText: label });
  }

  /**
   * Whether the inner list root is displayed (not hidden with `display: none`). On the unfixed code
   * this stays `none` after a scroll round trip; the fix restores it.
   */
  async listDisplayed(): Promise<boolean> {
    return this.page.evaluate(() => {
      const editor = (window as FixtureWindow).hot.getActiveEditor() as
        (EditorHandle & { htEditor?: { rootElement: HTMLElement } }) | undefined;
      const root = editor?.htEditor?.rootElement;

      return root ? root.ownerDocument.defaultView!.getComputedStyle(root).display !== 'none' : false;
    });
  }

  /**
   * Focuses the editor textarea, so a subsequent `type()` reaches it. The autocomplete requery is
   * driven by the textarea's own `input` event.
   */
  async focusEditor(): Promise<void> {
    await this.page.getByTestId('grid').locator('.handsontableInputHolder textarea.handsontableInput').focus();
  }

  /**
   * Types into the focused editor textarea.
   */
  async type(text: string): Promise<void> {
    await this.page.keyboard.type(text);
  }

  /**
   * Presses ArrowDown, which the layered editor maps onto its inner grid's selection.
   */
  async pressArrowDown(): Promise<void> {
    await this.page.keyboard.press('ArrowDown');
  }

  /**
   * The row selected inside the inner list grid, or null when nothing is selected. Proves the
   * editor's ArrowUp/ArrowDown shortcut group and the inner grid survived the round trip.
   */
  async innerSelectedRow(): Promise<number | null> {
    return this.page.evaluate(() => (
      (window as FixtureWindow).hot.getActiveEditor()?.htEditor?.getSelectedActive()?.[0] ?? null
    ));
  }
}
