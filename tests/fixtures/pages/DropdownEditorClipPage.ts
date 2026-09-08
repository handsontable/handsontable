import { type Page, type Locator, expect } from '@playwright/test';

/**
 * A box in viewport coordinates.
 */
export interface Box {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
}

/**
 * The four boxes a placement assertion compares: the option list, the edited cell, the grid's
 * root element, and the parent layout the case asked for.
 */
export interface PlacementBoxes {
  list: Box;
  cell: Box;
  root: Box;
  container: Box;
}

/**
 * Page Object for the dropdown-editor-clip fixture: one grid rebuilt per case through
 * `initDropdownClipGrid()`.
 *
 * Deliberately standalone rather than reusing `RootSizeOptionsPage`. This spec is about editor
 * placement, not about the root size options, and it must keep running if it is ever rebased onto
 * a branch that does not carry that fixture.
 */
export class DropdownEditorClipPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  /** The option list of the `handsontable`-family editors and of `multiselect` alike. */
  readonly list: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.list = page.locator('.handsontableEditor').first();
  }

  /**
   * Navigate and wait for the bundle and the first render (a real DOM condition, no sleep).
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/dropdown-editor-clip.html?theme=${this.theme}&bundle=${this.bundle}`);
    await this.page.waitForFunction(() => 'Handsontable' in window);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Rebuilds the grid with the given settings. `containerClass` picks a parent layout declared in
   * the fixture's stylesheet.
   */
  async rebuild(settings: Record<string, unknown>, containerClass = ''): Promise<void> {
    await this.page.evaluate(
      ([s, c]) => window.initDropdownClipGrid(s as Record<string, unknown>, c as string),
      [settings, containerClass] as const
    );
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A data cell in the master table, by visual row and column. */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /** The number of options the fixture feeds to the editor's `source`. */
  async optionCount(): Promise<number> {
    return this.page.evaluate(() => window.htDropdownOptions.length);
  }

  /**
   * Opens the editor on a cell through the keyboard, and waits for the list to render.
   *
   * The keyboard, not a click: a centred click on a cell with a dropdown arrow can land on the
   * arrow and open the list by itself, and the Enter that follows then commits and closes it
   * (`tests/AGENTS.md`).
   */
  async openEditor(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => window.hot.selectCell(r, c), [row, col] as const);
    await this.page.keyboard.press('Enter');
    await expect(this.optionCells()).not.toHaveCount(0);
  }

  /** The rendered option elements: table cells for the autocomplete family, `li` for multiselect. */
  optionCells(): Locator {
    return this.page.locator('.handsontableEditor .ht_master tbody td, .ht-multi-select-editor li');
  }

  /**
   * How many options a pointer can actually reach, by hit-testing the middle of each one.
   *
   * Counting rendered elements is not enough and neither is `toBeVisible()`: under a clip an
   * option exists at full size while nothing on screen can reach it, so both pass on the broken
   * build. Only `elementFromPoint()` tells the two apart.
   */
  async reachableOptions(): Promise<number> {
    return this.page.evaluate(() => {
      // `querySelector('a, b')` returns the first element matching EITHER, in DOCUMENT order,
      // not in selector order - and the multiselect's outer wrapper also carries
      // `.handsontableEditor` and comes first, while being the wrong box to measure (it is
      // zero-height, because the list inside it is positioned). Ask for the specific one first.
      const list = document.querySelector('.ht-multi-select-editor')
        ?? document.querySelector('.handsontableEditor');

      if (!list) {
        return 0;
      }

      let reached = 0;

      list.querySelectorAll('.ht_master tbody td, li').forEach((option) => {
        const r = option.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);

        if (hit && list.contains(hit)) {
          reached += 1;
        }
      });

      return reached;
    });
  }

  /**
   * The list, the edited cell, the grid root, and the fixture's parent container, in viewport
   * coordinates.
   */
  async boxes(): Promise<PlacementBoxes> {
    return this.page.evaluate(() => {
      const toBox = (r: DOMRect) => ({
        top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height,
      });
      const editor = window.hot.getActiveEditor();

      if (!editor) {
        throw new Error('no editor is active');
      }

      // The specific selector first - see `reachableOptions()` for why document order bites here.
      const listEl = document.querySelector('.ht-multi-select-editor')
        ?? document.querySelector('.handsontableEditor');
      const container = document.getElementById('container');

      if (!listEl || !container) {
        throw new Error('the list or the container is not rendered');
      }

      return {
        list: toBox(listEl.getBoundingClientRect()),
        cell: toBox(editor.getEditedCell().getBoundingClientRect()),
        root: toBox(window.hot.rootElement.getBoundingClientRect()),
        container: toBox(container.getBoundingClientRect()),
      };
    });
  }

  /** Scrolls the window and waits two frames. */
  async scrollWindowBy(y: number): Promise<void> {
    await this.page.evaluate((dy) => {
      window.scrollBy(0, dy);

      return new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
    }, y);
  }

  /** Whether the editor reports itself flipped above the edited cell. */
  async isFlippedVertically(): Promise<boolean> {
    return this.page.evaluate(() => {
      const editor = window.hot.getActiveEditor();

      if (!editor) {
        throw new Error('no editor is active');
      }

      // The autocomplete family exposes a flag; the multiselect keeps it on its controller.
      return editor.isFlippedVertically ?? editor.dropdownController?.isFlippedVertically() ?? false;
    });
  }
}
