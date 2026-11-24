import { type Page, expect, type Locator } from '@playwright/test';
import { awaitBundle } from '../bundle';
import { NestedRowsPage } from './NestedRowsPage';

/**
 * The treegrid attributes of one rendered row: `level`, `posinset` and `setsize` as read off its
 * `TR`, `expanded` off its row header. An attribute the row does not carry reads as `null`.
 */
export interface TreegridRowAttributes {
  level: string | null;
  posinset: string | null;
  setsize: string | null;
  expanded: string | null;
}

/**
 * Page Object for the nested-rows treegrid accessibility fixture.
 *
 * It extends {@link NestedRowsPage}, which already knows how to read and drive a nested grid, and
 * adds what only the treegrid behavior needs: the row attributes, the keyboard entry onto a row
 * header, the polite announcements, and a covering overlay.
 *
 * A row is painted in the master table and in the inline-start clone that carries the row headers,
 * so every attribute read walks both copies and reports a row only when they agree. A copy that
 * disagrees is a bug in itself, and the read says so instead of picking one.
 */
export class NestedRowsTreegridPage extends NestedRowsPage {
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    super(page, theme);
    this.bundle = bundle;
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   *
   * @param options.dir The layout direction of the page and the grid.
   * @param options.aria `off` builds the grid with `ariaTags: false`.
   * @param options.navigableHeaders `off` builds the grid with `navigableHeaders: false`, the default
   * of the option, where no header can take the focus.
   */
  async goto(
    options: { dir?: 'ltr' | 'rtl'; aria?: 'on' | 'off'; navigableHeaders?: 'on' | 'off' } = {}
  ): Promise<void> {
    const dir = options.dir ?? 'ltr';
    const aria = options.aria ?? 'on';
    const navigableHeaders = options.navigableHeaders ?? 'on';
    const query = `theme=${this.theme}&bundle=${this.bundle}&dir=${dir}&aria=${aria}` +
      `&navigableHeaders=${navigableHeaders}`;

    await this.page.goto(`/tests/fixtures/demo/nested-rows-treegrid.html?${query}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * The treegrid attributes of every rendered row, top to bottom, read in one evaluation so a
   * re-render between two reads cannot mix two layouts. Throws when the master copy of a row and
   * its inline-start copy disagree, and when a row element carries `aria-expanded`, which belongs to
   * the row header.
   */
  rowAttributes(): Promise<TreegridRowAttributes[]> {
    return this.page.evaluate(() => {
      const read = (selector: string) => Array.from(document.querySelectorAll(`${selector} tbody tr`))
        .map((TR) => {
          if (TR.hasAttribute('aria-expanded')) {
            throw new Error('A row element carries aria-expanded, which belongs to its row header');
          }

          return {
            level: TR.getAttribute('aria-level'),
            posinset: TR.getAttribute('aria-posinset'),
            setsize: TR.getAttribute('aria-setsize'),
            expanded: TR.querySelector('th')?.getAttribute('aria-expanded') ?? null,
          };
        });
      const master = read('.ht_master');
      const clone = read('.ht_clone_inline_start');

      if (JSON.stringify(master) !== JSON.stringify(clone)) {
        throw new Error(`Row copies disagree: ${JSON.stringify({ master, clone })}`);
      }

      return master;
    });
  }

  /**
   * The position attributes of every visual row, keyed by the row's name, read in one evaluation.
   * Every row of the fixture is rendered, so the rendered rows and the visual rows line up.
   */
  async setPositionsByName(): Promise<Record<string, string>> {
    const [names, attributes] = await Promise.all([this.visibleNames(), this.rowAttributes()]);

    return Object.fromEntries(names.map((name, index) => [
      name,
      `${attributes[index].level}:${attributes[index].posinset}/${attributes[index].setsize}`,
    ]));
  }

  /**
   * How many rendered rows carry any of the treegrid row attributes, across every copy.
   */
  countRowsWithTreegridAttributes(): Promise<number> {
    return this.page.evaluate(() => document.querySelectorAll(
      '[data-testid="grid"] tbody tr:is([aria-level], [aria-posinset], [aria-setsize])'
    ).length);
  }

  /**
   * How many treegrid row attributes the grid writes or removes during one synchronous action:
   * a plain repaint, a collapse of the first parent, or a rebuild of the plugin.
   *
   * @param action `'render'` repaints the grid, `'collapse'` collapses visual row 0, and
   * `'rebuild'` sends `{ nestedRows: true }` through `updateSettings()`, which tears the plugin down
   * and builds it again, as every re-render in React does.
   */
  rowAttributeWritesDuring(action: 'render' | 'collapse' | 'rebuild'): Promise<number> {
    return this.page.evaluate((name) => {
      const observer = new MutationObserver(() => {});

      observer.observe(document.querySelector('[data-testid="grid"]') as HTMLElement, {
        attributes: true,
        attributeFilter: ['aria-level', 'aria-posinset', 'aria-setsize'],
        subtree: true,
      });

      if (name === 'render') {
        window.hot.render();
      } else if (name === 'rebuild') {
        window.hot.updateSettings({ nestedRows: true });
      } else {
        window.hot.getPlugin('nestedRows').collapseParent(0);
      }

      const writes = observer.takeRecords().length;

      observer.disconnect();

      return writes;
    }, action);
  }

  /**
   * Put the focus on a row header the way a user does: click the first cell of the row, then step
   * into the header with the inline-start arrow.
   *
   * @param row Visual row index.
   */
  async focusRowHeader(row: number): Promise<void> {
    const isRtl = await this.page.evaluate(() => window.hot.isRtl());

    await this.cell(row, 0).click();
    await this.page.keyboard.press(isRtl ? 'ArrowRight' : 'ArrowLeft');
    await expect.poll(() => this.selectedCell()).toEqual([row, -1]);
  }

  /**
   * Select a row header through the API, by visual row index. For a row whose cells cannot be
   * clicked, such as one with every column hidden.
   *
   * @param row Visual row index.
   */
  async selectRowHeader(row: number): Promise<void> {
    await this.page.evaluate(visualRow => window.hot.selectCell(visualRow, -1), row);
    await expect.poll(() => this.selectedCell()).toEqual([row, -1]);
  }

  /**
   * Click the label of a row header, the way a user selects a whole row. The label is aimed at
   * rather than the middle of the header, because a parent's header carries the collapse button.
   *
   * @param row Visual row index.
   */
  async clickRowHeaderLabel(row: number): Promise<void> {
    await this.page.locator('[data-testid="grid"] .ht_clone_inline_start tbody tr').nth(row)
      .locator('th .rowHeader').click();
    await expect.poll(() => this.selectedCell()).toEqual([row, -1]);
  }

  /**
   * The active selection range as `[fromRow, fromColumn, toRow, toColumn]`.
   */
  activeRange(): Promise<[number, number, number, number]> {
    return this.page.evaluate(() => {
      const range = window.hot.getSelectedRangeActive()!;

      return [range.from.row!, range.from.col!, range.to.row!, range.to.col!];
    });
  }

  /**
   * Put a stale treegrid attribute on the first rendered row, to tell whether a later step walks
   * the rows and clears it.
   */
  async markFirstRowStale(): Promise<void> {
    await this.page.evaluate(() => {
      document.querySelector('[data-testid="grid"] .ht_master tbody tr')!.setAttribute('aria-level', '9');
    });
  }

  /**
   * The polite live region the plugin announces through.
   */
  politeAnnouncer(): Locator {
    return this.page.locator('[role="status"][aria-live="polite"]');
  }

  /**
   * Start recording every message written to the polite live region, so a spec can tell an
   * announcement that never happened from one that was overwritten by a later one.
   */
  async recordAnnouncements(): Promise<void> {
    await this.page.evaluate(() => {
      const region = document.querySelector('[role="status"][aria-live="polite"]') as HTMLElement;
      const log: string[] = [];

      (window as unknown as { announcementLog: string[] }).announcementLog = log;
      new MutationObserver(() => {
        if (region.textContent) {
          log.push(region.textContent);
        }
      }).observe(region, { childList: true, characterData: true, subtree: true });
    });
  }

  /**
   * Every message written to the polite live region since {@link NestedRowsTreegridPage#recordAnnouncements}.
   */
  announcements(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as { announcementLog: string[] }).announcementLog);
  }

  /**
   * Start counting `afterSelection` calls, which fire whenever a key moves the selection, even when
   * the selection is put back right after.
   */
  async recordSelections(): Promise<void> {
    await this.page.evaluate(() => {
      const state = window as unknown as { selectionCount: number };

      state.selectionCount = 0;
      window.hot.addHook('afterSelection', () => {
        state.selectionCount += 1;
      });
    });
  }

  /**
   * The number of `afterSelection` calls since {@link NestedRowsTreegridPage#recordSelections}.
   */
  selectionCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { selectionCount: number }).selectionCount);
  }

  /**
   * Cover the grid body the way an overlay plugin does, through a focus scope that declares
   * `coversGridBody`. The scope is registered once and only switched on and off afterwards; it never
   * takes the keyboard, so the grid keeps answering keys while it covers the body.
   *
   * @param covered Whether the body is covered.
   */
  async setGridBodyCovered(covered: boolean): Promise<void> {
    await this.page.evaluate((isCovered) => {
      const state = window as unknown as { treegridBodyCovered?: boolean };

      if (state.treegridBodyCovered === undefined) {
        const container = document.createElement('div');

        document.body.appendChild(container);
        window.hot.getFocusScopeManager().registerScope('treegrid-test-cover', container, {
          coversGridBody: true,
          runOnlyIf: () => state.treegridBodyCovered === true,
        });
      }

      state.treegridBodyCovered = isCovered;
    }, covered);
  }

  /**
   * Hide rows through the `HiddenRows` plugin, by visual index.
   *
   * @param rows Visual row indexes to hide.
   */
  async hideRows(rows: number[]): Promise<void> {
    await this.page.evaluate(indexes => window.hot.updateSettings({ hiddenRows: { rows: indexes } }), rows);
  }

  /**
   * Filter the first column down to the rows that carry one of the names, through the Filters plugin
   * (switched on first, as the fixture grid does not enable it). Nested rows keep the matching rows,
   * their ancestors, and the subtree of a matching parent.
   *
   * @param names The values the first column is filtered by.
   */
  async filterByNames(names: string[]): Promise<void> {
    await this.page.evaluate((values) => {
      window.hot.updateSettings({ filters: true });

      const filters = window.hot.getPlugin('filters');

      filters.addCondition(0, 'by_value', [values]);
      filters.filter();
    }, names);
  }

  /**
   * Replace the filter on the `name` column with another set of names in one filter pass, so the
   * trimming goes from one filtered state straight to another without showing every row between.
   *
   * @param names The names to keep.
   */
  async replaceFilterByNames(names: string[]): Promise<void> {
    await this.page.evaluate((values) => {
      const filters = window.hot.getPlugin('filters');

      filters.clearConditions();
      filters.addCondition(0, 'by_value', [values]);
      filters.filter();
    }, names);
  }

  /**
   * Remove the filter again, through the Filters plugin.
   */
  async clearFilter(): Promise<void> {
    await this.page.evaluate(() => {
      const filters = window.hot.getPlugin('filters');

      filters.clearConditions();
      filters.filter();
    });
  }

  /**
   * Select a range of cells through the API, by visual coordinates.
   *
   * @param fromRow Visual row index of the range's start.
   * @param fromColumn Visual column index of the range's start.
   * @param toRow Visual row index of the range's end.
   * @param toColumn Visual column index of the range's end.
   */
  async selectRange(fromRow: number, fromColumn: number, toRow: number, toColumn: number): Promise<void> {
    await this.page.evaluate(
      ([row, column, row2, column2]) => window.hot.selectCell(row, column, row2, column2),
      [fromRow, fromColumn, toRow, toColumn]
    );
    await expect.poll(() => this.activeRange()).toEqual([fromRow, fromColumn, toRow, toColumn]);
  }

  /**
   * Select several separate ranges through the API, the way Ctrl/Cmd+click does. The last one is the
   * active range.
   *
   * @param ranges Each range as `[fromRow, fromColumn, toRow, toColumn]`.
   */
  async selectRanges(ranges: [number, number, number, number][]): Promise<void> {
    await this.page.evaluate(coords => window.hot.selectCells(coords), ranges);
    await expect.poll(() => this.selectedRanges()).toEqual(ranges);
  }

  /**
   * Every selected range, in the order it was laid, as `[fromRow, fromColumn, toRow, toColumn]`.
   */
  selectedRanges(): Promise<number[][]> {
    return this.page.evaluate(() => (window.hot.getSelectedRange() ?? []).map(
      range => [range.from.row!, range.from.col!, range.to.row!, range.to.col!]
    ));
  }

  /**
   * Start recording, for every key press that reaches the page, whether the grid claimed it by
   * preventing the browser's default action.
   */
  async recordKeyClaims(): Promise<void> {
    await this.page.evaluate(() => {
      const claims: boolean[] = [];

      (window as unknown as { keyClaims: boolean[] }).keyClaims = claims;
      window.addEventListener('keydown', (event) => {
        if (!['Shift', 'Alt', 'Control', 'Meta'].includes(event.key)) {
          claims.push(event.defaultPrevented);
        }
      });
    });
  }

  /**
   * Whether the grid claimed each key pressed since {@link NestedRowsTreegridPage#recordKeyClaims}.
   */
  keyClaims(): Promise<boolean[]> {
    return this.page.evaluate(() => (window as unknown as { keyClaims: boolean[] }).keyClaims);
  }

  /**
   * Select a cell through the API without handing the keyboard to the grid, the way an application
   * moves the selection of a grid the user is not working in.
   *
   * @param row Visual row index.
   * @param column Visual column index.
   */
  async selectCellWithoutListening(row: number, column: number): Promise<void> {
    await this.page.evaluate(
      ([visualRow, visualColumn]) => window.hot.selectCell(
        visualRow, visualColumn, visualRow, visualColumn, false, false
      ),
      [row, column]
    );
    await expect.poll(() => this.selectedCell()).toEqual([row, column]);
  }

  /**
   * Trim rows through the `TrimRows` plugin, by physical index.
   *
   * @param rows Physical row indexes to trim.
   */
  async trimRows(rows: number[]): Promise<void> {
    await this.page.evaluate(indexes => window.hot.updateSettings({ trimRows: indexes }), rows);
  }

  /**
   * Append a child to a parent row through the plugin's data manager, as the context menu's
   * "Insert child row" does.
   *
   * @param physicalRow Physical index of the parent row.
   * @param name The name of the new child.
   */
  async addChild(physicalRow: number, name: string): Promise<void> {
    await this.page.evaluate(({ row, childName }) => {
      const { dataManager } = window.hot.getPlugin('nestedRows');

      dataManager.addChild(dataManager.getDataObject(row), { name: childName });
    }, { row: physicalRow, childName: name });
  }

  /**
   * Detach a child from its parent through the plugin's data manager, as the context menu's
   * "Detach from parent" does.
   *
   * @param physicalRow Physical index of the child row.
   */
  async detachFromParent(physicalRow: number): Promise<void> {
    await this.page.evaluate((row) => {
      const { dataManager } = window.hot.getPlugin('nestedRows');

      dataManager.detachFromParent(dataManager.getDataObject(row));
    }, physicalRow);
  }

  /**
   * Navigate to the fixture with frozen columns, or with a second grid on the page, on top of the
   * options {@link NestedRowsTreegridPage#goto} takes.
   *
   * @param options.fixedColumnsStart `1` freezes the first column.
   * @param options.secondGrid `on` builds a second, identical grid (`window.hot2`) below the first.
   * @param options.navigableHeaders `off` builds the grid with `navigableHeaders: false`.
   * @param options.aria `off` builds the grid with `ariaTags: false`.
   * @param options.nestedRows `off` builds the same grid with the plugin off.
   * @param options.namedCopy `on` gives the `Copy` column a renderer that sets its own `aria-label`.
   */
  async gotoWith(options: {
    fixedColumnsStart?: 0 | 1;
    secondGrid?: 'on' | 'off';
    navigableHeaders?: 'on' | 'off';
    aria?: 'on' | 'off';
    nestedRows?: 'on' | 'off';
    namedCopy?: 'on' | 'off';
  }): Promise<void> {
    const query = `theme=${this.theme}&bundle=${this.bundle}&dir=ltr&aria=${options.aria ?? 'on'}` +
      `&navigableHeaders=${options.navigableHeaders ?? 'on'}` +
      `&fixedColumnsStart=${options.fixedColumnsStart ?? 0}&secondGrid=${options.secondGrid ?? 'off'}` +
      `&nestedRows=${options.nestedRows ?? 'on'}&namedCopy=${options.namedCopy ?? 'off'}`;

    await this.page.goto(`/tests/fixtures/demo/nested-rows-treegrid.html?${query}`);
    await awaitBundle(this.page);
    await expect(this.page.locator('[data-testid="grid"] .ht_master').getByTestId('cell-0-0')).toBeVisible();
  }

  /**
   * The accessible description of every copy of a data cell, read the way the accessible name
   * computation reads `aria-describedby`: each referenced element's text, joined with spaces, in the
   * order of the ids. The copies are the master's and, with frozen columns, the frozen clone's, and the
   * read throws when they disagree or when an id references nothing.
   *
   * @param row Visual row index.
   * @param column Visual column index.
   */
  cellDescription(row: number, column: number): Promise<string> {
    return this.page.evaluate(([visualRow, visualColumn]) => {
      const describe = (element: Element) => (element.getAttribute('aria-describedby') ?? '')
        .split(' ')
        .filter(Boolean)
        .map((id) => {
          const target = document.getElementById(id);

          if (!target) {
            throw new Error(`aria-describedby references a missing id: ${id}`);
          }

          return target.textContent ?? '';
        })
        .join(' ');
      const copies = Array.from(document.querySelectorAll(
        `[data-testid="grid"] [data-testid="cell-${visualRow}-${visualColumn}"]`
      )).map(describe);

      if (copies.length === 0) {
        throw new Error(`Cell ${visualRow}, ${visualColumn} is not rendered`);
      }

      if (new Set(copies).size !== 1) {
        throw new Error(`Cell copies disagree: ${JSON.stringify(copies)}`);
      }

      return copies[0];
    }, [row, column]);
  }

  /**
   * The accessible name of every copy of a data cell, built the way the stylesheet builds it: the cell's
   * content, then the level text the cell carries in `data-ht-row-level`, which `::after` draws as generated
   * content: an inline box joined to the content with nothing (the level text starts with its own comma), or,
   * in a commented cell, the out-of-flow Comments box that starts with a no-break space. Runs of white space
   * read as one space, as a screen reader hears them. The read throws when the copies disagree or when a copy carries `aria-labelledby` (a name that would replace
   * the content).
   *
   * @param row Visual row index.
   * @param column Visual column index.
   */
  cellName(row: number, column: number): Promise<string> {
    return this.page.evaluate(([visualRow, visualColumn]) => {
      const name = (element: Element) => {
        if (element.hasAttribute('aria-labelledby')) {
          throw new Error(`Cell ${visualRow}, ${visualColumn} carries aria-labelledby`);
        }

        const level = element.getAttribute('data-ht-row-level');
        const separator = element.classList.contains('htCommentCell') ? '\u00a0' : '';
        const text = level === null ? element.textContent ?? '' : `${element.textContent ?? ''}${separator}${level}`;

        return text.replace(/\s+/g, ' ').trim();
      };
      const copies = Array.from(document.querySelectorAll(
        `[data-testid="grid"] [data-testid="cell-${visualRow}-${visualColumn}"]`
      )).map(name);

      if (copies.length === 0) {
        throw new Error(`Cell ${visualRow}, ${visualColumn} is not rendered`);
      }

      if (new Set(copies).size !== 1) {
        throw new Error(`Cell copies disagree: ${JSON.stringify(copies)}`);
      }

      return copies[0];
    }, [row, column]);
  }

  /**
   * The name of the master copy of a rendered row of the first grid, read the way the accessible name
   * computation reads it: the text of the element its `aria-labelledby` points at, else its `aria-label`, or
   * `null` when it has neither. An overlay copy of a row is named by the cells it holds, so only the master
   * copy names the whole row. The read throws when the row carries both, or when the id references nothing.
   *
   * @param row Visual row index (every row of the fixture is rendered).
   */
  rowName(row: number): Promise<string | null> {
    return this.page.evaluate((visualRow) => {
      const TR = document.querySelectorAll('[data-testid="grid"] .ht_master tbody tr')[visualRow];
      const labelledBy = TR?.getAttribute('aria-labelledby') ?? null;
      const label = TR?.getAttribute('aria-label') ?? null;

      if (labelledBy !== null && label !== null) {
        throw new Error(`Row ${visualRow} carries both aria-labelledby and aria-label`);
      }

      if (labelledBy === null) {
        return label;
      }

      const target = document.getElementById(labelledBy);

      if (!target) {
        throw new Error(`aria-labelledby references a missing id: ${labelledBy}`);
      }

      return target.textContent ?? '';
    }, row);
  }

  /**
   * The naming attributes of the master copy of a rendered row of the first grid, as written.
   *
   * @param row Visual row index.
   */
  rowNameAttributes(row: number): Promise<{ labelledBy: string | null; label: string | null }> {
    return this.page.evaluate((visualRow) => {
      const TR = document.querySelectorAll('[data-testid="grid"] .ht_master tbody tr')[visualRow];

      return {
        labelledBy: TR?.getAttribute('aria-labelledby') ?? null,
        label: TR?.getAttribute('aria-label') ?? null,
      };
    }, row);
  }

  /**
   * The accessible name of every rendered row's first cell, keyed by its text.
   */
  async cellNamesByText(): Promise<Record<string, string>> {
    const names = await this.visibleNames();
    const result: Record<string, string> = {};

    for (let row = 0; row < names.length; row++) {
      result[names[row]] = await this.cellName(row, 0);
    }

    return result;
  }

  /**
   * The name, the description and the role Chromium's own accessibility tree gives the master copy of a data
   * cell or of a row, which is what a screen reader on Chromium reads from it. Chromium only (a CDP session).
   *
   * @param target `{ row, column }` for a cell, `{ row, column: -1 }` for the row header (its inline-start clone
   * copy, the one a user focuses), `{ row }` for the row element.
   */
  async chromiumAccessibility(
    target: { row: number; column?: number }
  ): Promise<{ name: string; description: string; role: string }> {
    const client = await this.page.context().newCDPSession(this.page);
    let selector = `document.querySelector('[data-testid="grid"] .ht_master [data-testid="cell-${target.row}-${target.column}"]')`;

    if (target.column === undefined) {
      selector = `document.querySelectorAll('[data-testid="grid"] .ht_master tbody tr')[${target.row}]`;
    } else if (target.column === -1) {
      selector = `document.querySelectorAll('[data-testid="grid"] .ht_clone_inline_start tbody tr')[${target.row}]` +
        '.querySelector(\'th\')';
    }

    try {
      await client.send('Accessibility.enable');

      const { result } = await client.send('Runtime.evaluate', { expression: selector });
      const { nodes } = await client.send('Accessibility.getPartialAXTree', {
        objectId: result.objectId,
        fetchRelatives: false,
      });
      const clean = (value: unknown) => String(value ?? '').replace(/\s+/g, ' ').trim();

      return {
        name: clean(nodes[0]?.name?.value),
        description: clean(nodes[0]?.description?.value),
        role: clean(nodes[0]?.role?.value),
      };
    } finally {
      await client.detach();
    }
  }

  /**
   * The text content of every data cell of the first grid, in DOM order, to prove the labels add no text.
   */
  cellTexts(): Promise<string[]> {
    return this.page.evaluate(() => Array.from(document.querySelectorAll('[data-testid="grid"] td'))
      .map(TD => TD.textContent ?? ''));
  }

  /**
   * The text the row header of a row is described by, read through its `aria-describedby`, or `null`
   * when it has none. Read from the inline-start clone, the copy a user focuses.
   *
   * @param row Visual row index.
   */
  rowHeaderDescription(row: number): Promise<string | null> {
    return this.page.evaluate((visualRow) => {
      const TH = document
        .querySelectorAll('[data-testid="grid"] .ht_clone_inline_start tbody tr')[visualRow]
        ?.querySelector('th');
      const id = TH?.getAttribute('aria-describedby');

      return id ? document.getElementById(id)?.textContent ?? null : null;
    }, row);
  }

  /**
   * What carries a row level in a grid: the data cells with `data-ht-row-level`, the rows named through an
   * `aria-labelledby` the plugin wrote, the hidden elements holding those names, the rows with an `aria-label`
   * (none: VoiceOver ignores it on a row), the cells with an `aria-labelledby` (none since the level moved into
   * the generated content), the cells with an `id` (none either), the cells described by a level text, and the
   * row headers described by one.
   *
   * @param testId The `data-testid` of the grid's container.
   */
  levelTraces(testId = 'grid'): Promise<{
    levelCells: number;
    namedRows: number;
    rowNameElements: number;
    labelledRows: number;
    labelledElements: number;
    cellIds: number;
    describedCells: number;
    describedHeaders: number;
  }> {
    return this.page.evaluate((id) => {
      const grid = `[data-testid="${id}"]`;
      const describedByLevel = (element: Element) => (element.getAttribute('aria-describedby') ?? '')
        .split(' ')
        .filter(Boolean)
        .some(ref => (document.getElementById(ref)?.textContent ?? '').includes('Level '));

      return {
        levelCells: document.querySelectorAll(`${grid} td[data-ht-row-level]`).length,
        namedRows: document.querySelectorAll(`${grid} tbody tr[aria-labelledby^="ht-row-name-"]`).length,
        rowNameElements: document.querySelectorAll(`${grid} [id^="ht-row-name-"]`).length,
        labelledRows: document.querySelectorAll(`${grid} tbody tr[aria-label]`).length,
        labelledElements: document.querySelectorAll(`${grid} td[aria-labelledby]`).length,
        cellIds: document.querySelectorAll(`${grid} td[id]`).length,
        describedCells: Array.from(document.querySelectorAll(`${grid} td`)).filter(describedByLevel).length,
        describedHeaders: Array.from(document.querySelectorAll(`${grid} tbody th`)).filter(describedByLevel)
          .length,
      };
    }, testId);
  }

  /**
   * The name of the master copy of a data cell of the second grid (`secondGrid: 'on'`), built like
   * `cellName()`.
   *
   * @param row Visual row index.
   * @param column Visual column index.
   */
  secondGridCellName(row: number, column: number): Promise<string> {
    return this.page.evaluate(([visualRow, visualColumn]) => {
      const TD = document.querySelectorAll('[data-testid="grid-2"] .ht_master tbody tr')[visualRow]
        ?.querySelectorAll('td')[visualColumn];

      if (!TD) {
        throw new Error(`Cell ${visualRow}, ${visualColumn} of the second grid is not rendered`);
      }

      const separator = TD.classList.contains('htCommentCell') ? '\u00a0' : '';

      return `${TD.textContent ?? ''}${separator}${TD.getAttribute('data-ht-row-level') ?? ''}`
        .replace(/\s+/g, ' ').trim();
    }, [row, column]);
  }

  /**
   * Gives the master copy of a rendered row an `aria-label` of the application's own and renders, the way an
   * application that names its rows does.
   *
   * @param row Visual row index.
   * @param label The name.
   */
  async nameRowByApplication(row: number, label: string): Promise<void> {
    await this.page.evaluate(([visualRow, text]) => {
      document.querySelectorAll('[data-testid="grid"] .ht_master tbody tr')[visualRow]
        ?.setAttribute('aria-label', text);
      window.hot.render();
    }, [row, label] as [number, string]);
  }

  /**
   * Builds the grid on the fixture with a comment on the first cell of A-1 (physical row 1).
   *
   * @param nestedRows `off` builds the same grid with the plugin off.
   */
  async gotoWithComment(nestedRows: 'on' | 'off'): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/nested-rows-treegrid.html?theme=${this.theme}&bundle=${this.bundle}` +
      `&navigableHeaders=off&nestedRows=${nestedRows}&comment=on`);
    await awaitBundle(this.page);
    await expect(this.page.locator('[data-testid="grid"] .ht_master').getByTestId('cell-0-0')).toBeVisible();
  }

  /**
   * The `aria-describedby` of a master data cell, as written.
   *
   * @param row Visual row index.
   * @param column Visual column index.
   */
  cellDescribedBy(row: number, column: number): Promise<string | null> {
    return this.page.locator('[data-testid="grid"] .ht_master')
      .getByTestId(`cell-${row}-${column}`).getAttribute('aria-describedby');
  }

  /**
   * The id of a column header of the first grid, by its index.
   *
   * @param column Visual column index.
   */
  columnHeaderId(column: number): Promise<string | null> {
    return this.page.evaluate((visualColumn) => {
      const id = `${window.hot.guid}-colheader-${visualColumn}`;

      return document.getElementById(id) ? id : null;
    }, column);
  }

  /**
   * Press ArrowDown several times from one task, so the presses land before the grid renders the
   * moves between them, the way fast repeated presses can.
   *
   * @param count How many presses.
   */
  async pressArrowDownInOneTask(count: number): Promise<void> {
    await this.page.evaluate((presses) => {
      for (let i = 0; i < presses; i++) {
        document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, bubbles: true, cancelable: true,
        }));
      }
    }, count);
  }

  /**
   * Make every cell of a row read-only through the `cells` option.
   *
   * @param physicalRow Physical row index, which the `cells` callback receives.
   */
  async makeRowReadOnly(physicalRow: number): Promise<void> {
    await this.page.evaluate((row) => {
      window.hot.updateSettings({
        cells: (cellRow: number) => (cellRow === row ? { readOnly: true } : {}),
      });
    }, physicalRow);
  }

  /**
   * Render the grid, as any later change would.
   */
  async render(): Promise<void> {
    await this.page.evaluate(() => window.hot.render());
  }
}
