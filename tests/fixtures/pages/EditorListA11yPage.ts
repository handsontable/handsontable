import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle, assertKnownBundle, type Bundle } from '../bundle';

export type ListEditorCellType = 'autocomplete' | 'dropdown';

/**
 * The cell types whose commit moves the browser focus the same way: the two list editors, and the
 * `handsontable` and `text` editors they are compared with.
 */
export type EditorCellType = ListEditorCellType | 'handsontable' | 'text';

/**
 * The element holding the browser focus: a data cell by its coordinates, the active editor's field, or
 * anything else by its tag.
 */
export type FocusTarget = { cell: [number, number] } | { editorField: true } | { other: string };

/**
 * What the open editor's field points at, resolved in the page: each id reference is followed to the
 * element it names, so a reference to a missing element reads as `null` rather than as a string.
 */
export interface ReferencedElements {
  controls: { role: string | null, isListRoot: boolean } | null;
  activeDescendant: {
    role: string | null;
    selected: string | null;
    text: string;
    inList: boolean;
  } | null;
}

/**
 * The roles the list editor writes, read with `ariaTags: false`.
 */
export interface ListRoles {
  input: string | null;
  listRoot: string | null;
  cells: (string | null)[];
}

interface FixtureEditor {
  isOpened(): boolean;
  query: string | null;
  TEXTAREA: HTMLInputElement;
  htEditor: { rootElement: HTMLElement };
}

interface FixtureWindow {
  htResolveQueries(): number;
  htPendingQueries: { resolved: boolean }[];
  htAnnouncements?: string[];
  hot: {
    selectCell(row: number, col: number): boolean;
    getActiveEditor(): FixtureEditor | undefined;
    getCoords(element: Element): { row: number, col: number } | null;
    rootElement: HTMLElement;
  };
}

/**
 * Page Object for the structure, name, and references of the autocomplete and dropdown editors' list
 * (`tests/fixtures/demo/cell-dropdown-arrow.html`). The list is a nested Handsontable grid, so its
 * `table`, `tbody` and `tr` sit between the `listbox` and its `option`s.
 *
 * Openness is read through `hot.getActiveEditor()`: a closed editor's input stays in the DOM.
 */
export class EditorListA11yPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly cellType: EditorCellType;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd', cellType: EditorCellType = 'autocomplete') {
    assertKnownBundle(bundle, '(page, theme, bundle, cellType)');
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.cellType = cellType;
  }

  /**
   * Opens the fixture and waits for its first cell.
   *
   * @param {object} [options] Fixture options.
   * @param {boolean} [options.longSource] Give the list 200 choices, `Al 001` to `Al 200`.
   * @param {boolean} [options.asyncSource] Give the list its three choices through a function `source`
   * that answers only on {@link EditorListA11yPage#resolveQueries}.
   * @param {boolean} [options.strict] Make the `autocomplete` column strict.
   * @param {boolean} [options.allowHtml] Turn `allowHtml` on and wrap each choice in `<b>`.
   * @param {boolean} [options.ariaTags] The grid's `ariaTags` setting.
   * @param {boolean} [options.enterStays] Set `enterMoves: { row: 0, col: 0 }`, so Enter keeps the selection
   * on the edited cell.
   */
  async goto({
    longSource = false, asyncSource = false, strict = false, allowHtml = false, ariaTags = true, enterStays = false,
  }: {
    longSource?: boolean, asyncSource?: boolean, strict?: boolean, allowHtml?: boolean, ariaTags?: boolean,
    enterStays?: boolean,
  } = {}): Promise<void> {
    const query = `theme=${this.theme}&bundle=${this.bundle}&cellType=${this.cellType}`
      + (longSource ? '&source=200' : '')
      + (asyncSource ? '&source=async' : '')
      + (strict ? '&strict=true' : '')
      + (allowHtml ? '&allowHtml=true' : '')
      + (ariaTags ? '' : '&ariaTags=false')
      + (enterStays ? '&enterMoves=stay' : '');

    await this.page.goto(`/tests/fixtures/demo/cell-dropdown-arrow.html?${query}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell, by visual row and column.
   */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The editor's field, the combobox, by its accessible name.
   */
  combobox(name: string): Locator {
    return this.page.getByRole('combobox', { name, exact: true });
  }

  /**
   * The editor's field by its accessible name, also while the editor is closed: the closed field stays
   * in the DOM, out of view.
   */
  field(name: string): Locator {
    return this.page.getByRole('combobox', { name, exact: true, includeHidden: true });
  }

  /**
   * The editor's list, by its accessible name.
   */
  listbox(name: string): Locator {
    return this.page.getByRole('listbox', { name, exact: true });
  }

  /**
   * The editor's field, found by its class whatever its ARIA. The holder of the active editor is the one
   * not hidden.
   */
  get editorInput(): Locator {
    return this.page.locator('.handsontableInputHolder:not(.ht_editor_hidden) .handsontableInput');
  }

  /**
   * The announcer's polite live region, which the list editors announce a narrowed list through.
   */
  get politeRegion(): Locator {
    return this.page.locator('.ht-portal [role="status"][aria-live="polite"]');
  }

  /**
   * Starts recording every non-empty text written into the polite live region, so a spec can count
   * announcements rather than read the last one. The announcer clears the region before each message,
   * so an empty text is not an announcement.
   */
  async startAnnouncementLog(): Promise<void> {
    await this.page.evaluate(() => {
      const fixtureWindow = window as unknown as FixtureWindow;
      const region = document.querySelector('.ht-portal [role="status"][aria-live="polite"]')!;

      fixtureWindow.htAnnouncements = [];
      new MutationObserver(() => {
        const text = region.textContent ?? '';

        if (text !== '') {
          fixtureWindow.htAnnouncements!.push(text);
        }
      }).observe(region, { childList: true, characterData: true, subtree: true });
    });
  }

  /**
   * The texts recorded since {@link EditorListA11yPage#startAnnouncementLog}, in the order written.
   */
  async announcements(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htAnnouncements ?? []);
  }

  /**
   * Answers every query the asynchronous `source` holds, and returns how many it answered.
   */
  async resolveQueries(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htResolveQueries());
  }

  /**
   * The text the active editor last queried its list with.
   */
  async listQuery(): Promise<string | null> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getActiveEditor()?.query ?? null);
  }

  /**
   * The number of queries the asynchronous `source` holds unanswered.
   */
  async pendingQueryCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htPendingQueries
      .filter(entry => !entry.resolved).length);
  }

  /**
   * Waits for the asynchronous `source` to receive a query, then answers it.
   */
  async answerNextQuery(): Promise<void> {
    await expect.poll(() => this.resolveQueries()).toBeGreaterThan(0);
  }

  /**
   * Selects a cell through the API, so the keys that follow reach the grid.
   */
  async selectCell(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => {
      (window as unknown as FixtureWindow).hot.selectCell(r, c);
    }, [row, col]);
    await expect(this.cell(row, col)).toHaveClass(/\bcurrent\b/);
  }

  /**
   * Whether the active cell editor is open.
   */
  async isEditorOpened(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getActiveEditor()?.isOpened() ?? false);
  }

  /**
   * Selects a cell and opens its editor with Enter.
   */
  async openEditorAt(row: number, col: number): Promise<void> {
    await this.selectCell(row, col);
    await this.page.keyboard.press('Enter');
    await expect.poll(() => this.isEditorOpened()).toBe(true);
  }

  /**
   * Closes the editor with Escape.
   */
  async cancelEditor(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect.poll(() => this.isEditorOpened()).toBe(false);
  }

  /**
   * The element holding the browser focus. A data cell of the grid reads as its coordinates, so a
   * recycled `td` cannot pass for another cell; the active editor's field reads as such whether it is
   * a `textarea` or an `input`.
   */
  async focusTarget(): Promise<FocusTarget> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as FixtureWindow;
      const active = document.activeElement;

      if (active !== null && active === hot.getActiveEditor()?.TEXTAREA) {
        return { editorField: true as const };
      }

      if (active instanceof HTMLTableCellElement && hot.rootElement.contains(active)) {
        const coords = hot.getCoords(active);

        if (coords !== null && coords.row >= 0 && coords.col >= 0) {
          return { cell: [coords.row, coords.col] as [number, number] };
        }
      }

      return { other: active === null ? 'null' : active.tagName.toLowerCase() };
    });
  }

  /**
   * The element holding the browser focus once `frames` animation frames have passed, so a focus move a
   * timer makes after a commit is caught. Pair it with a
   * positive {@link EditorListA11yPage#focusTarget} poll: on its own, a wait proves nothing.
   */
  async focusTargetAfterFrames(frames: number): Promise<FocusTarget> {
    await this.page.evaluate(count => new Promise<void>((resolve) => {
      let left = count;
      const tick = () => {
        left -= 1;

        if (left <= 0) {
          resolve();
        } else {
          requestAnimationFrame(tick);
        }
      };

      requestAnimationFrame(tick);
    }), frames);

    return this.focusTarget();
  }

  /**
   * The active cell of the last selection layer, or `null` without a selection.
   */
  async selectedCell(): Promise<[number, number] | null> {
    return this.page.evaluate(() => {
      const selected = (window as unknown as { hot: { getSelectedLast(): number[] | undefined } })
        .hot.getSelectedLast();

      return selected === undefined ? null : [selected[0], selected[1]] as [number, number];
    });
  }

  /**
   * Commits the editor with Enter.
   */
  async commitEditor(): Promise<void> {
    await this.page.keyboard.press('Enter');
    await expect.poll(() => this.isEditorOpened()).toBe(false);
  }

  /**
   * Follows the active editor's `aria-controls` and `aria-activedescendant` to the elements they name,
   * in one evaluation.
   */
  async referencedElements(): Promise<ReferencedElements> {
    return this.page.evaluate(() => {
      const editor = (window as unknown as FixtureWindow).hot.getActiveEditor()!;
      const input = editor.TEXTAREA;
      const listRoot = editor.htEditor.rootElement;
      const resolve = (attribute: string) => {
        const id = input.getAttribute(attribute);

        return id === null ? null : input.ownerDocument.getElementById(id);
      };
      const controlled = resolve('aria-controls');
      const active = resolve('aria-activedescendant');

      return {
        controls: controlled === null ? null : {
          role: controlled.getAttribute('role'),
          isListRoot: controlled === listRoot,
        },
        activeDescendant: active === null ? null : {
          role: active.getAttribute('role'),
          selected: active.getAttribute('aria-selected'),
          text: active.textContent ?? '',
          inList: listRoot.contains(active),
        },
      };
    });
  }

  /**
   * The roles on the editor's field, the list root, and the list cells, read with `ariaTags: false`.
   */
  async listRoles(): Promise<ListRoles> {
    return this.page.evaluate(() => {
      const editor = (window as unknown as FixtureWindow).hot.getActiveEditor()!;
      const listRoot = editor.htEditor.rootElement;

      return {
        input: editor.TEXTAREA.getAttribute('role'),
        listRoot: listRoot.getAttribute('role'),
        cells: Array.from(listRoot.querySelectorAll('td')).map(td => td.getAttribute('role')),
      };
    });
  }

  /**
   * The number of cells the list's master table draws.
   */
  async listCellCount(): Promise<number> {
    return this.page.evaluate(() => {
      const editor = (window as unknown as FixtureWindow).hot.getActiveEditor()!;

      return editor.htEditor.rootElement.querySelectorAll('.ht_master td').length;
    });
  }
}
