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
   * The description of a data cell: the text of the hidden elements it points at through
   * `aria-describedby`, past the reference to its column header, joined with a comma and a space. It
   * reads `''` for a cell that carries none. The level of a row reaches a screen reader this way, with
   * the cell, because a message in a live region can replace the announcement of the cell.
   */
  async cellDescription(row: number, col: number): Promise<string> {
    return this.cell(row, col).evaluate((td: HTMLElement) => (td.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter(id => id.startsWith('ht-description-'))
      .map(id => td.ownerDocument.getElementById(id)?.textContent ?? '')
      .join(', '));
  }

  /**
   * The test ids of every cell element that points at the level description, copies in the overlays
   * included, sorted and without repeats. A cell in a frozen corner is drawn in four tables, and the
   * level belongs on the cell the highlight is on only.
   */
  levelDescribedCells(): Promise<string[]> {
    return this.page.evaluate(() => {
      const root = window.hot.rootElement;
      const ids = Array.from(root.querySelectorAll('td[aria-describedby*="-level"]'))
        .map(td => td.getAttribute('data-testid') ?? '');

      return Array.from(new Set(ids)).sort();
    });
  }

  /**
   * Start recording the description each data cell has at the moment the browser focus lands on it. A
   * screen reader reads a description when the focus arrives, so a description added a moment later is
   * not read, which polling the cell afterwards cannot tell.
   */
  async recordFocusDescriptions(): Promise<void> {
    await this.page.evaluate(() => {
      const log: string[] = [];

      (window as unknown as { focusDescriptionLog: string[] }).focusDescriptionLog = log;
      document.addEventListener('focusin', (event) => {
        const td = event.target as HTMLElement;

        if (td.tagName !== 'TD') {
          return;
        }

        const descriptions = (td.getAttribute('aria-describedby') ?? '')
          .split(/\s+/)
          .filter(id => id.startsWith('ht-description-'))
          .map(id => td.ownerDocument.getElementById(id)?.textContent ?? '');

        log.push(`${td.getAttribute('data-testid')}: ${descriptions.join(', ')}`);
      }, true);
    });
  }

  /**
   * The descriptions recorded since {@link NestedRowsTreegridPage#recordFocusDescriptions}, one entry
   * per focus on a data cell, as `cell-<row>-<column>: <description>`.
   */
  focusDescriptions(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as { focusDescriptionLog: string[] }).focusDescriptionLog);
  }

  /**
   * Start counting the renders the grid forces (`beforeRender` with `isForced`). Moving the selection is
   * not one: the hook documents it as `false` there, and a forced render re-measures the visible rows and
   * columns, so a plugin that turned every move into one would cost every key press.
   */
  async recordForcedRenders(): Promise<void> {
    await this.page.evaluate(() => {
      const state = window as unknown as { forcedRenderCount: number };

      state.forcedRenderCount = 0;
      window.hot.addHook('beforeRender', (isForced: boolean) => {
        if (isForced) {
          state.forcedRenderCount += 1;
        }
      });
    });
  }

  /**
   * The number of forced renders since {@link NestedRowsTreegridPage#recordForcedRenders}.
   */
  forcedRenders(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { forcedRenderCount: number }).forcedRenderCount);
  }

  /**
   * The name and the description Chromium's own accessibility tree gives a data cell, which is what a
   * screen reader on Chromium reads from it.
   */
  async chromiumAccessibility(row: number, col: number): Promise<{ name: string; description: string }> {
    const client = await this.page.context().newCDPSession(this.page);

    try {
      await client.send('Accessibility.enable');

      const { result } = await client.send('Runtime.evaluate', {
        expression: `document.querySelector('[data-testid="cell-${row}-${col}"]')`,
      });
      const { nodes } = await client.send('Accessibility.getPartialAXTree', {
        objectId: result.objectId,
        fetchRelatives: false,
      });
      const clean = (value: unknown) => String(value ?? '').replace(/\s+/g, ' ').trim();

      return { name: clean(nodes[0]?.name?.value), description: clean(nodes[0]?.description?.value) };
    } finally {
      await client.detach();
    }
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
}
