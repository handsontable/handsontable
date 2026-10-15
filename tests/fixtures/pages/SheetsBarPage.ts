import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page object for the sheets-bar fixture (fixtures/demo/sheets-bar.html).
 */
export class SheetsBarPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly bar: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.bar = page.getByTestId('sheets-bar');
  }

  async goto(options: {
    rtl?: boolean,
    filters?: boolean,
    large?: boolean,
    fixedColumnsStart?: number,
    fixedColumnsEnd?: number,
    fixedRowsTop?: number,
    fixedRowsBottom?: number,
    maxRows?: number,
    customBorders?: boolean,
    htmlImage?: boolean,
    activeContent?: boolean,
    mergeCells?: boolean,
    nestedHeaders?: boolean,
    renamedRowHeader?: boolean,
    loadSwitches?: boolean,
    barOff?: boolean,
  } = {}): Promise<void> {
    const rtlParam = options.rtl ? '&rtl=1' : '';
    const filtersParam = [
      options.filters ? '&filters=1' : '',
      options.large ? '&large=1' : '',
      options.customBorders ? '&customBorders=1' : '',
      options.fixedColumnsStart === undefined ? '' : `&fixedColumnsStart=${options.fixedColumnsStart}`,
      options.fixedColumnsEnd === undefined ? '' : `&fixedColumnsEnd=${options.fixedColumnsEnd}`,
      options.fixedRowsTop === undefined ? '' : `&fixedRowsTop=${options.fixedRowsTop}`,
      options.fixedRowsBottom === undefined ? '' : `&fixedRowsBottom=${options.fixedRowsBottom}`,
      options.maxRows === undefined ? '' : `&maxRows=${options.maxRows}`,
      options.htmlImage ? '&htmlImage=1' : '',
      options.activeContent ? '&activeContent=1' : '',
      options.mergeCells ? '&mergeCells=1' : '',
      options.nestedHeaders ? '&nestedHeaders=1' : '',
      options.renamedRowHeader ? '&renamedRowHeader=1' : '',
      options.loadSwitches ? '&loadSwitches=1' : '',
      options.barOff ? '&barOff=1' : '',
    ].join('');
    // A script error on the fixture leaves the page with no test ids at all, which surfaces as
    // an unexplained ten-second timeout on the first locator. Collecting the errors turns that
    // into the actual cause — this suite has seen rare page-load failures whose artifacts
    // carried no page state to explain them.
    const pageErrors: string[] = [];

    this.page.on('pageerror', error => pageErrors.push(error.message));

    await this.page.goto(`/tests/fixtures/demo/sheets-bar.html?theme=${this.theme}&bundle=${this.bundle}${rtlParam}${filtersParam}`);

    await expect(
      options.barOff ? this.cell(0, 0) : this.tab(0),
      pageErrors.length > 0 ? `the fixture page threw: ${pageErrors.join(' | ')}` : undefined,
    ).toBeVisible();
  }

  tab(index: number): Locator {
    return this.page.getByTestId(`sheet-tab-${index}`);
  }

  tabByName(name: string): Locator {
    // The tab itself carries the button role now, and its accessible name is the sheet name —
    // the trigger glyph inside it is hidden from the accessibility tree.
    return this.bar.getByRole('button', { name, exact: true });
  }

  chevron(index: number): Locator {
    return this.page.getByTestId(`sheet-tab-chevron-${index}`);
  }

  chevronByName(name: string): Locator {
    return this.tabByName(name).locator('.ht-sheets-bar__tab-chevron');
  }

  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * A column header, scoped to the top overlay so the match is unambiguous.
   */
  columnHeader(col: number): Locator {
    return this.page.locator('.ht_clone_top').getByTestId(`col-header-${col}`);
  }

  /**
   * The sorting label inside a column header.
   */
  sortLabel(col: number): Locator {
    return this.columnHeader(col).locator('span.colHeader');
  }

  async selected(): Promise<number[][] | null> {
    return this.page.evaluate(() => (window as never as { hot: any }).hot.getSelected() ?? null);
  }

  async isEditorOpened(): Promise<boolean> {
    return this.page.evaluate(() => !!(window as never as { hot: any }).hot.getActiveEditor()?.isOpened());
  }

  async dataAtCell(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(([r, c]) => (window as never as { hot: any }).hot.getDataAtCell(r, c), [row, col]);
  }

  async clickTab(index: number): Promise<void> {
    await this.tab(index).locator('.ht-sheets-bar__tab-label').click();
  }

  async expectActiveTab(index: number): Promise<void> {
    // The tab is the control, so the state lives on the tab rather than on the label inside it.
    await expect(this.tab(index)).toHaveAttribute('aria-current', 'true');
  }

  async expectCell(row: number, col: number, text: string): Promise<void> {
    await expect(this.cell(row, col)).toHaveText(text);
  }

  menuItem(label: string): Locator {
    return this.page.locator('.htMenu:visible td', { hasText: label }).first();
  }

  get addButton(): Locator {
    return this.page.getByTestId('sheets-bar-add');
  }

  get allButton(): Locator {
    return this.page.getByTestId('sheets-bar-all');
  }

  get renameInput(): Locator {
    return this.page.locator('.ht-sheets-bar__tab-rename');
  }

  get pagePrev(): Locator {
    return this.page.getByTestId('sheets-bar-page-prev');
  }

  get pageNext(): Locator {
    return this.page.getByTestId('sheets-bar-page-next');
  }

  get pagingSection(): Locator {
    return this.page.locator('.ht-sheets-bar__paging');
  }

  /**
   * The temporary element that slides the active tab marker during a sheet switch.
   */
  get indicator(): Locator {
    return this.bar.locator('.ht-sheets-bar__tab-indicator');
  }

  /**
   * The tab strip, the scrolling container the indicator lives in.
   */
  get strip(): Locator {
    return this.bar.locator('.ht-sheets-bar__tabs');
  }

  /**
   * Records, from before the fixture's first script runs, every trace of the bar's motion: a
   * switch layer inserted into the grid, the switch state attribute written on the grid element,
   * a tab marker inserted into the strip, and a tab carrying the entrance class. Call it before
   * `goto()`, so the observer watches the grid's construction too.
   */
  async recordMotionFromStart(): Promise<void> {
    await this.page.addInitScript(() => {
      const record = { layers: 0, states: 0, indicators: 0, entrances: 0 };
      const isEntering = (node: Node) => node instanceof Element
        && (node.classList.contains('ht-sheets-bar__tab--entering')
          || node.querySelector('.ht-sheets-bar__tab--entering') !== null);
      const countAdded = (node: Node) => {
        if (!(node instanceof Element)) {
          return;
        }

        record.layers += node.matches('.ht-sheet-switch') ? 1 : node.querySelectorAll('.ht-sheet-switch').length;
        record.indicators += node.matches('.ht-sheets-bar__tab-indicator')
          ? 1
          : node.querySelectorAll('.ht-sheets-bar__tab-indicator').length;
        record.entrances += isEntering(node) ? 1 : 0;
      };

      (window as never as { htMotionRecord: typeof record }).htMotionRecord = record;
      new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(countAdded);
          } else if (mutation.attributeName === 'data-ht-sheet-switch') {
            record.states += 1;
          } else if (isEntering(mutation.target)) {
            record.entrances += 1;
          }
        });
      }).observe(document, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'data-ht-sheet-switch'],
      });
    });
  }

  /**
   * Reads what `recordMotionFromStart()` recorded so far. Mutation records are delivered as
   * microtasks, so everything a finished evaluation did is counted.
   */
  async motionRecord(): Promise<{ layers: number, states: number, indicators: number, entrances: number }> {
    return this.page.evaluate(() => ({
      ...(window as never as { htMotionRecord: { layers: number, states: number, indicators: number, entrances: number } })
        .htMotionRecord,
    }));
  }

  /**
   * Waits for two animation frames of the page, so the grid has been painted at least once
   * since the last task the test ran.
   */
  async waitForFrames(): Promise<void> {
    await this.page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
  }

  /**
   * Starts counting every indicator element the page inserts from now on.
   */
  async recordIndicators(): Promise<void> {
    await this.page.evaluate(() => {
      const target = window as never as { htIndicatorsAdded: number };

      target.htIndicatorsAdded = 0;
      new MutationObserver((records) => {
        records.forEach((record) => {
          record.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement && node.classList.contains('ht-sheets-bar__tab-indicator')) {
              target.htIndicatorsAdded += 1;
            }
          });
        });
      }).observe(document.body, { childList: true, subtree: true });
    });
  }

  /**
   * How many indicator elements the page inserted since `recordIndicators()`. Mutation records
   * are delivered as microtasks, so they are all in by the time this evaluation runs.
   */
  async indicatorsAdded(): Promise<number> {
    return this.page.evaluate(() => (window as never as { htIndicatorsAdded: number }).htIndicatorsAdded);
  }

  /**
   * Pauses, from now on, every CSS transition of the tab marker and of the grid the moment it
   * starts, so a later seek reads it from its start. The transitions run on real time, which the
   * page clock does not control: left running, they can end before a slow run reads them, and
   * a finished transition is gone from `getAnimations()`. Mutation records are delivered as
   * microtasks, so the transitions a switch starts are paused before any frame is drawn.
   */
  async holdTransitions(): Promise<void> {
    await this.page.evaluate(() => {
      const hold = () => document.getAnimations().forEach((animation) => {
        const target = (animation.effect as KeyframeEffect | null)?.target;

        if (
          animation instanceof CSSTransition && animation.playState === 'running'
          && target instanceof Element && target.closest('.ht-sheets-bar__tab-indicator, .ht-grid') !== null
        ) {
          animation.pause();
        }
      });

      new MutationObserver(hold).observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'data-ht-sheet-switch'],
      });
    });
  }

  /**
   * Pauses the indicator's CSS transitions at a fraction of their run and returns its viewport
   * box at that point, with the number of transitions it carries.
   */
  async indicatorBoxAt(progress: number): Promise<{ left: number, width: number, transitions: number }> {
    return this.page.evaluate((fraction) => {
      const indicator = document.querySelector('.ht-sheets-bar__tab-indicator');

      if (!(indicator instanceof HTMLElement)) {
        throw new Error('No indicator to measure');
      }

      const animations = indicator.getAnimations();

      animations.forEach((animation) => {
        const end = Number(animation.effect?.getComputedTiming().endTime ?? 0);

        animation.pause();
        animation.currentTime = end * fraction;
      });

      const rect = indicator.getBoundingClientRect();

      return { left: rect.left, width: rect.width, transitions: animations.length };
    }, progress);
  }

  /**
   * The name of the last sheet in the workbook, which is where a new sheet lands.
   */
  async lastSheetName(): Promise<string> {
    return this.page.evaluate(() => (window as never as { hot: any }).hot.getPlugin('sheetsBar').getSheets().at(-1).name);
  }

  /**
   * Starts recording every tab element the page inserts from now on: its sheet name, whether it
   * wears the entrance class, and its inline `animation-delay`. CSS animations run on real time,
   * which the page clock does not control, so the recorder also pauses each inserted tab's
   * entrance where it starts, before any frame is drawn, for `tabEntranceBoxAt()` to seek.
   */
  async recordTabEntrances(): Promise<void> {
    await this.page.evaluate(() => {
      const target = window as never as { htTabsAdded: Array<{ name: string, entering: boolean, delay: string }> };

      target.htTabsAdded = [];
      new MutationObserver((records) => {
        records.forEach((record) => {
          record.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement && node.classList.contains('ht-sheets-bar__tab')) {
              target.htTabsAdded.push({
                name: node.querySelector('.ht-sheets-bar__tab-label')?.textContent ?? '',
                entering: node.classList.contains('ht-sheets-bar__tab--entering'),
                delay: node.style.animationDelay,
              });
              node.getAnimations().forEach(animation => animation.pause());
            }
          });
        });
      }).observe(document.body, { childList: true, subtree: true });
    });
  }

  /**
   * The tab elements `recordTabEntrances()` saw inserted, optionally only those of one sheet.
   * Mutation records are delivered as microtasks, so they are all in by the time this
   * evaluation runs.
   */
  async tabsAdded(name?: string): Promise<Array<{ name: string, entering: boolean, delay: string }>> {
    const added: Array<{ name: string, entering: boolean, delay: string }> = await this.page.evaluate(
      () => (window as never as { htTabsAdded: any[] }).htTabsAdded,
    );

    return name === undefined ? added : added.filter(entry => entry.name === name);
  }

  /**
   * The entrance state of the tab now shown for a sheet: whether it wears the entrance class, and
   * its inline `animation-delay`.
   */
  async tabEntrance(name: string): Promise<{ entering: boolean, delay: string }> {
    return this.page.evaluate((sheetName) => {
      const tab = Array.from(document.querySelectorAll('.ht-sheets-bar__tab'))
        .find(element => element.querySelector('.ht-sheets-bar__tab-label')?.textContent === sheetName);

      if (!(tab instanceof HTMLElement)) {
        throw new Error(`No tab for ${sheetName}`);
      }

      return {
        entering: tab.classList.contains('ht-sheets-bar__tab--entering'),
        delay: tab.style.animationDelay,
      };
    }, name);
  }

  /**
   * Pauses a sheet tab's CSS animations at a fraction of their run and returns its viewport box
   * and opacity at that point, its resting left edge (the box without the transform), and the
   * number of animations it carries. Seek below 1: an animation paused at its end no longer
   * applies, and no later call finds it.
   */
  async tabEntranceBoxAt(name: string, progress: number): Promise<{
    left: number,
    restLeft: number,
    width: number,
    opacity: number,
    animations: number,
  }> {
    return this.page.evaluate(({ sheetName, fraction }) => {
      const tab = Array.from(document.querySelectorAll('.ht-sheets-bar__tab'))
        .find(element => element.querySelector('.ht-sheets-bar__tab-label')?.textContent === sheetName);

      if (!(tab instanceof HTMLElement)) {
        throw new Error(`No tab for ${sheetName}`);
      }

      const animations = tab.getAnimations().filter(animation => animation instanceof CSSAnimation);

      animations.forEach((animation) => {
        const timing = animation.effect?.getComputedTiming();
        const start = Number(timing?.delay ?? 0);
        const active = Number(timing?.activeDuration ?? 0);

        animation.pause();
        animation.currentTime = start + (active * fraction);
      });

      const rect = tab.getBoundingClientRect();
      const style = getComputedStyle(tab);

      return {
        left: rect.left,
        restLeft: rect.left - new DOMMatrix(style.transform).m41,
        width: rect.width,
        opacity: Number(style.opacity),
        animations: animations.length,
      };
    }, { sheetName: name, fraction: progress });
  }

  /**
   * The layer that draws the content swap of a sheet switch.
   */
  get switchLayer(): Locator {
    return this.page.locator('.ht-grid > .ht-sheet-switch');
  }

  /**
   * Starts recording, from now on, every switch layer the page inserts, the most layers present
   * at once, and whether the grid element ever carried a switch state.
   */
  async recordSwitchLayers(): Promise<void> {
    await this.page.evaluate(() => {
      const target = window as never as { hot: any, htSwitch: { added: number, maxAtOnce: number, stateSeen: boolean } };
      const grid = target.hot.rootGridElement as HTMLElement;
      const record = { added: 0, maxAtOnce: 0, stateSeen: false };

      target.htSwitch = record;
      new MutationObserver((records) => {
        records.forEach((entry) => {
          entry.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement && node.classList.contains('ht-sheet-switch')) {
              record.added += 1;
            }
          });
        });
        record.maxAtOnce = Math.max(record.maxAtOnce, grid.querySelectorAll(':scope > .ht-sheet-switch').length);
      }).observe(grid, { childList: true });
      new MutationObserver(() => {
        if (grid.hasAttribute('data-ht-sheet-switch')) {
          record.stateSeen = true;
        }
      }).observe(grid, { attributes: true, attributeFilter: ['data-ht-sheet-switch'] });
    });
  }

  /**
   * What `recordSwitchLayers()` saw so far. Mutation records are delivered as microtasks, so
   * they are all in by the time this evaluation runs.
   */
  async switchLayerRecord(): Promise<{ added: number, maxAtOnce: number, stateSeen: boolean }> {
    return this.page.evaluate(() => (window as never as { htSwitch: any }).htSwitch);
  }

  /**
   * Reads the running switch layer: the text of every leaving and entering copy, split into
   * header copies (top pane) and the rest. A copy that draws an evenly spaced run of cells holds
   * one line per cell.
   */
  async switchLayerContent(): Promise<{
    inBody: string[],
    outBody: string[],
    inHeaders: string[],
    outHeaders: string[],
  }> {
    return this.page.evaluate(() => {
      const layer = document.querySelector('.ht-grid > .ht-sheet-switch');

      if (!(layer instanceof HTMLElement)) {
        throw new Error('No switch layer to read');
      }

      const texts = (side: string, inHeaderPane: boolean) => Array.from(layer.querySelectorAll(`.ht-sheet-switch__${side} > .ht-sheet-switch__cell`))
        .filter(copy => copy.closest('.ht-sheet-switch__pane')?.getAttribute('data-pane') === 'ht_clone_top' === inHeaderPane)
        .flatMap(copy => (copy.textContent ?? '').split('\n').map(text => text.trim()))
        .sort();

      return {
        inBody: texts('in', false),
        outBody: texts('out', false),
        inHeaders: texts('in', true),
        outHeaders: texts('out', true),
      };
    });
  }

  /**
   * Seeks the running swap to its end and returns, for every text the entering copies draw,
   * where the copy draws it and where the arriving grid draws the same text in its own cell. A
   * cell that is not laid out, such as one a merged area hides, is not a candidate.
   */
  async enteringTextPositions(): Promise<Array<{ text: string, copy: { top: number, left: number }, cell: { top: number, left: number } }>> {
    return this.page.evaluate(() => {
      const textBox = (node: Text, start: number, end: number) => {
        const range = document.createRange();

        range.setStart(node, start);
        range.setEnd(node, end);

        const rect = range.getBoundingClientRect();

        return { top: rect.top, left: rect.left };
      };
      const cells = new Map<string, { top: number, left: number }>();

      document.querySelectorAll('.ht_master .htCore tbody td').forEach((cell) => {
        const node = cell.firstChild;

        if (cell.childNodes.length === 1 && node instanceof Text && node.data !== '' && cell.getClientRects().length > 0) {
          cells.set(node.data, textBox(node, 0, node.data.length));
        }
      });
      document.querySelectorAll('.ht-sheet-switch__out, .ht-sheet-switch__in').forEach((side) => {
        side.getAnimations().forEach((animation) => {
          animation.pause();
          animation.currentTime = Number(animation.effect?.getComputedTiming().endTime ?? 0);
        });
      });

      const positions: Array<{ text: string, copy: { top: number, left: number }, cell: { top: number, left: number } }> = [];

      document.querySelectorAll('.ht-sheet-switch__pane[data-pane="ht_master"] .ht-sheet-switch__in > .ht-sheet-switch__cell')
        .forEach((copy) => {
          const node = copy.firstChild;

          if (!(node instanceof Text)) {
            return;
          }

          let start = 0;

          node.data.split('\n').forEach((text) => {
            const cell = cells.get(text);

            if (cell !== undefined) {
              positions.push({ text, copy: textBox(node, start, start + text.length), cell });
            }

            start += text.length + 1;
          });
        });

      return positions;
    });
  }

  /**
   * Reads, from the rendered grid itself, the body cells of the scrollable part that are at
   * least partly on screen (inside the scrolling holder, outside the header and frozen
   * overlays), and how many body cells the scrollable part renders in total.
   */
  async visibleBodyCells(): Promise<{ texts: string[], columns: number, rendered: number }> {
    return this.page.evaluate(() => {
      const hot = (window as never as { hot: any }).hot;
      const root = hot.rootElement as HTMLElement;
      const holder = root.querySelector(':scope > .ht_master .wtHolder') as HTMLElement;
      const holderRect = holder.getBoundingClientRect();
      const overlayEdge = (name: string, edge: 'bottom' | 'right', fallback: number) => {
        const overlay = root.querySelector(`:scope > .${name}`);
        const rect = overlay?.getBoundingClientRect();

        return rect && rect.width > 0 && rect.height > 0 ? rect[edge] : fallback;
      };
      const area = {
        left: overlayEdge('ht_clone_inline_start', 'right', holderRect.left + holder.clientLeft),
        top: overlayEdge('ht_clone_top', 'bottom', holderRect.top + holder.clientTop),
        right: holderRect.left + holder.clientLeft + holder.clientWidth,
        bottom: holderRect.top + holder.clientTop + holder.clientHeight,
      };
      const cells = Array.from(root.querySelectorAll(':scope > .ht_master .htCore tbody td')) as HTMLElement[];
      const visible = cells.filter((cell) => {
        const rect = cell.getBoundingClientRect();

        return rect.width > 0 && rect.height > 0 && rect.right > area.left && rect.left < area.right
          && rect.bottom > area.top && rect.top < area.bottom;
      });

      return {
        texts: visible.map(cell => (cell.textContent ?? '').trim()).sort(),
        columns: new Set(visible.map(cell => hot.getCoords(cell).col)).size,
        rendered: cells.length,
      };
    });
  }

  /**
   * Reads every column group of the running layer: the pane it is drawn in, its viewport box,
   * and the timing of its leaving and entering animations (`null` for a side it does not draw).
   */
  async switchGroups(): Promise<Array<{
    pane: string,
    left: number,
    right: number,
    out: { delay: number, duration: number } | null,
    in: { delay: number, duration: number } | null,
  }>> {
    return this.page.evaluate(() => {
      const timing = (group: Element, side: string) => {
        const [animation] = group.querySelector(`:scope > .ht-sheet-switch__${side}`)?.getAnimations() ?? [];
        const computed = animation?.effect?.getComputedTiming();

        return computed === undefined ? null : { delay: Number(computed.delay), duration: Number(computed.duration) };
      };

      return Array.from(document.querySelectorAll('.ht-grid > .ht-sheet-switch .ht-sheet-switch__group')).map((group) => {
        const rect = group.getBoundingClientRect();

        return {
          pane: group.closest('.ht-sheet-switch__pane')?.getAttribute('data-pane') ?? '',
          left: rect.left,
          right: rect.right,
          out: timing(group, 'out'),
          in: timing(group, 'in'),
        };
      });
    });
  }

  /**
   * Seeks the animation of every leaving or entering side of the running layer to a fraction of
   * its own run, after its delay, and reads the vertical offset and the opacity it draws there.
   */
  async switchSideMotionAt(side: 'out' | 'in', progress: number): Promise<Array<{ offsetY: number, opacity: number }>> {
    return this.page.evaluate(({ sideName, fraction }) => Array.from(document.querySelectorAll(`.ht-grid > .ht-sheet-switch .ht-sheet-switch__${sideName}`))
      .map((element) => {
        element.getAnimations().forEach((animation) => {
          const timing = animation.effect?.getComputedTiming();

          animation.pause();
          animation.currentTime = Number(timing?.delay ?? 0) + (Number(timing?.activeDuration ?? 0) * fraction);
        });

        const style = getComputedStyle(element);

        return { offsetY: new DOMMatrix(style.transform).m42, opacity: Number(style.opacity) };
      }), { sideName: side, fraction: progress });
  }

  /**
   * Seeks every animation of the running layer through its whole run in `steps` equal steps,
   * from its first group's start to its last group's end, and reads at each step what is on
   * screen: in how many column groups a leaving and an arriving side both show, which visible
   * leaving copy overlaps which visible arriving copy (each box cut by its pane), and how many
   * copies of each side show. A side shows while its computed opacity is above 0.01.
   */
  async swapOverlapsAcrossRun(steps: number): Promise<Array<{
    time: number,
    groupsShowingBoth: number,
    overlaps: string[],
    leavingShown: number,
    arrivingShown: number,
  }>> {
    return this.page.evaluate((count) => {
      const layer = document.querySelector('.ht-grid > .ht-sheet-switch');

      if (!(layer instanceof HTMLElement)) {
        throw new Error('No switch layer to read');
      }

      const animations = layer.getAnimations({ subtree: true });
      const end = Math.max(...animations.map(animation => Number(animation.effect?.getComputedTiming().endTime ?? 0)));
      const isShown = (side: Element) => Number(getComputedStyle(side).opacity) > 0.01;
      const shownCopies = (side: string) => Array.from(layer.querySelectorAll(`.ht-sheet-switch__${side}`))
        .filter(isShown)
        .flatMap((element) => {
          const pane = (element.closest('.ht-sheet-switch__pane') as HTMLElement).getBoundingClientRect();

          return Array.from(element.querySelectorAll(':scope > .ht-sheet-switch__cell')).map((copy) => {
            const rect = copy.getBoundingClientRect();

            return {
              text: (copy.textContent ?? '').split('\n').map(line => line.trim()).filter(line => line !== '').join('|'),
              left: Math.max(rect.left, pane.left),
              right: Math.min(rect.right, pane.right),
              top: Math.max(rect.top, pane.top),
              bottom: Math.min(rect.bottom, pane.bottom),
            };
          });
        })
        .filter(box => box.right - box.left > 0.5 && box.bottom - box.top > 0.5);

      animations.forEach(animation => animation.pause());

      return Array.from({ length: count + 1 }, (_, step) => {
        const time = (end * step) / count;

        animations.forEach((animation) => {
          animation.currentTime = time;
        });

        const groupsShowingBoth = Array.from(layer.querySelectorAll('.ht-sheet-switch__group')).filter((group) => {
          const shows = (side: string) => Array.from(group.querySelectorAll(`:scope > .ht-sheet-switch__${side}`)).some(isShown);

          return shows('out') && shows('in');
        }).length;
        const leaving = shownCopies('out');
        const arriving = shownCopies('in');
        const overlaps = leaving.flatMap(out => arriving
          .filter(copy => Math.min(out.right, copy.right) - Math.max(out.left, copy.left) > 0.5
            && Math.min(out.bottom, copy.bottom) - Math.max(out.top, copy.top) > 0.5)
          .map(copy => `${out.text} over ${copy.text}`));

        return { time, groupsShowingBoth, overlaps, leavingShown: leaving.length, arrivingShown: arriving.length };
      });
    }, steps);
  }

  /**
   * Reads every clipping box of the running layer: its pane, its viewport box, the viewport box
   * of the overlay it stands for, and the text of its entering and leaving copies.
   */
  async switchPanes(): Promise<Array<{
    pane: string,
    box: { left: number, top: number, right: number, bottom: number },
    overlay: { left: number, top: number, right: number, bottom: number } | null,
    entering: string[],
    leaving: string[],
  }>> {
    return this.page.evaluate(() => {
      const root = (window as never as { hot: any }).hot.rootElement as HTMLElement;
      const edges = (rect: DOMRect) => ({ left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom });
      const texts = (pane: Element, side: string) => Array.from(pane.querySelectorAll(`.ht-sheet-switch__${side} > .ht-sheet-switch__cell`))
        .flatMap(copy => (copy.textContent ?? '').split('\n').map(text => text.trim()));

      return Array.from(document.querySelectorAll('.ht-grid > .ht-sheet-switch > .ht-sheet-switch__pane')).map((pane) => {
        const name = pane.getAttribute('data-pane') ?? '';
        const overlay = root.querySelector(`:scope > .${name}`);

        return {
          pane: name,
          box: edges(pane.getBoundingClientRect()),
          overlay: overlay === null ? null : edges(overlay.getBoundingClientRect()),
          entering: texts(pane, 'in'),
          leaving: texts(pane, 'out'),
        };
      });
    });
  }

  /**
   * Tells whether the running layer is inert, so nothing in it takes the focus or a pointer.
   */
  async switchLayerIsInert(): Promise<boolean> {
    return this.page.evaluate(() => (document.querySelector('.ht-grid > .ht-sheet-switch') as HTMLElement).inert);
  }

  /**
   * Counts the image `error` handlers the `?htmlImage=1` fixture recorded: the ones an image of
   * the switch layer ran, and the ones any other image ran.
   */
  async imageErrorRuns(): Promise<{ layer: number, other: number }> {
    return this.page.evaluate(() => {
      const runs = (window as never as { htImageErrors: string[] }).htImageErrors;
      const layer = runs.filter(run => run === 'layer').length;

      return { layer, other: runs.length - layer };
    });
  }

  /**
   * Reads what the active-content fixture counts: the runs of the scripts inside cells, the
   * constructions of the custom element and its connections inside the switch layer, the checked
   * radio buttons and checkboxes of the grid itself, and the entries of the form around the grid.
   */
  async activeContentProbe(): Promise<{
    scriptRuns: number,
    constructed: number,
    connectedInLayer: number,
    checkedInGrid: string[],
    formData: string[][],
  }> {
    return this.page.evaluate(() => {
      const target = window as never as {
        htScriptRuns: number,
        htProbe: { constructed: number, connectedInLayer: number },
      };
      const form = document.getElementById('htForm') as HTMLFormElement;

      return {
        scriptRuns: target.htScriptRuns,
        constructed: target.htProbe.constructed,
        connectedInLayer: target.htProbe.connectedInLayer,
        checkedInGrid: Array.from(document.querySelectorAll<HTMLInputElement>('.ht_master .htCore input'))
          .filter(input => input.checked)
          .map(input => `${input.name}=${input.value}`),
        formData: Array.from(new FormData(form).entries(), ([name, value]) => [name, String(value)]),
      };
    });
  }

  /**
   * Reads the computed opacity of every leaving and entering layer of the running swap.
   */
  async switchSideOpacities(): Promise<{ out: string[], in: string[] }> {
    return this.page.evaluate(() => {
      const opacities = (side: string) => Array.from(document.querySelectorAll(`.ht-sheet-switch__${side}`))
        .map(element => getComputedStyle(element).opacity);

      return { out: opacities('out'), in: opacities('in') };
    });
  }

  /**
   * Counts the elements of the running swap layer that match a selector.
   */
  async switchLayerCount(selector: string): Promise<number> {
    return this.page.evaluate(sel => document.querySelectorAll(`.ht-sheet-switch ${sel}`).length, selector);
  }

  /**
   * The computed background color of a tab.
   */
  async tabBackground(index: number): Promise<string> {
    return this.tab(index).evaluate(tab => getComputedStyle(tab).backgroundColor);
  }

  /**
   * The switch state the grid element carries, or `null` when it carries none.
   */
  async switchState(): Promise<string | null> {
    return this.page.evaluate(() => (window as never as { hot: any }).hot.rootGridElement.getAttribute('data-ht-sheet-switch'));
  }

  /**
   * Reads the computed opacity of every selection mark the master pane draws: the selection
   * borders and the fill handle that are laid out, and the fill of each selected area cell. Also
   * reads the custom borders, the borders that carry no selection layer class.
   */
  async selectionMarkOpacities(): Promise<{ borders: string[], areaFills: string[], customBorders: string[] }> {
    return this.page.evaluate(() => {
      const master = (window as never as { hot: any }).hot.rootElement.querySelector(':scope > .ht_master') as HTMLElement;
      const laidOut = (selector: string) => Array.from(master.querySelectorAll(selector))
        .filter(element => element.getClientRects().length > 0);
      const opacity = (element: Element, pseudo?: string) => getComputedStyle(element, pseudo).opacity;

      return {
        borders: laidOut('.wtBorder.current, .wtBorder.area, .wtBorder.corner').map(element => opacity(element)),
        areaFills: Array.from(master.querySelectorAll('td.area')).map(cell => opacity(cell, '::before')),
        customBorders: laidOut('.htBorders .wtBorder:not(.current):not(.area):not(.fill):not(.corner)')
          .map(element => opacity(element)),
      };
    });
  }

  /**
   * Runs every transition and animation inside the grid to its end. The CSS transitions run on
   * real time, which the page clock does not control.
   */
  async finishGridAnimations(): Promise<void> {
    await this.page.evaluate(() => {
      const root = (window as never as { hot: any }).hot.rootElement as HTMLElement;

      root.getAnimations({ subtree: true }).forEach(animation => animation.finish());
    });
  }

  /**
   * The computed background color of a column header in the top overlay.
   */
  async columnHeaderBackground(col: number): Promise<string> {
    return this.columnHeader(col).evaluate(header => getComputedStyle(header).backgroundColor);
  }

  /**
   * Pauses the transitions the reveal runs and reads their delays: the column header's
   * background color and the selection borders' opacity. Then seeks the border transitions to
   * their start and to their end and reads the borders' opacity at both points.
   */
  async revealTransitions(col: number): Promise<{ headerDelays: number[], borderDelays: number[], borderStart: string[], borderEnd: string[] }> {
    return this.page.evaluate((column) => {
      const hot = (window as never as { hot: any }).hot;
      const header = hot.rootElement.querySelector(`:scope > .ht_clone_top [data-testid="col-header-${column}"]`) as HTMLElement;
      const borders = Array.from(hot.rootElement.querySelectorAll(':scope > .ht_master .wtBorder.current'))
        .filter(element => (element as HTMLElement).getClientRects().length > 0) as HTMLElement[];
      const transitionsOf = (element: HTMLElement, property: string) => element.getAnimations()
        .filter(animation => animation instanceof CSSTransition && animation.transitionProperty === property) as CSSTransition[];
      const headerTransitions = transitionsOf(header, 'background-color');
      const borderTransitions = borders.flatMap(element => transitionsOf(element, 'opacity'));
      const seek = (fraction: number) => {
        borderTransitions.forEach((transition) => {
          transition.pause();
          transition.currentTime = Number(transition.effect?.getComputedTiming().endTime ?? 0) * fraction;
        });

        return borders.map(element => getComputedStyle(element).opacity);
      };

      headerTransitions.forEach(transition => transition.pause());

      return {
        headerDelays: headerTransitions.map(transition => Number(transition.effect?.getTiming().delay ?? 0)),
        borderDelays: borderTransitions.map(transition => Number(transition.effect?.getTiming().delay ?? 0)),
        borderStart: seek(0),
        borderEnd: seek(1),
      };
    }, col);
  }

  /**
   * Reads the header copies of the running swap against the headers the grid draws. Seeks the
   * entering copies to their end and the leaving ones to their start, then answers, for every
   * header text an entering copy draws, where the copy and the grid draw it; and the texts of the
   * grid's headers that a leaving header copy overlaps with no cover hiding them.
   */
  async headerSwapGeometry(): Promise<{
    arriving: Array<{ text: string, copy: { left: number, top: number }, header: { left: number, top: number } | null }>,
    uncoveredUnderLeaving: string[],
  }> {
    return this.page.evaluate(() => {
      const root = (window as never as { hot: any }).hot.rootElement as HTMLElement;
      const layer = document.querySelector('.ht-grid > .ht-sheet-switch');

      if (!(layer instanceof HTMLElement)) {
        throw new Error('No switch layer to read');
      }

      const seek = (selector: string, atEnd: boolean) => layer.querySelectorAll(selector).forEach((side) => {
        side.getAnimations().forEach((animation) => {
          animation.pause();
          animation.currentTime = atEnd ? Number(animation.effect?.getComputedTiming().endTime ?? 0) : 0;
        });
      });
      const textLines = (element: Element) => {
        const lines: Array<{ text: string, left: number, top: number }> = [];
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);

        for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
          const text = node as Text;
          let start = 0;

          text.data.split('\n').forEach((line) => {
            if (line.trim() !== '') {
              const range = document.createRange();

              range.setStart(text, start);
              range.setEnd(text, start + line.length);

              const rect = range.getBoundingClientRect();

              lines.push({ text: line.trim(), left: rect.left, top: rect.top });
            }

            start += line.length + 1;
          });
        }

        return lines;
      };
      const headers = Array.from(root.querySelectorAll(
        ':scope > .ht_clone_top thead th, :scope > .ht_clone_inline_start tbody th',
      )) as HTMLElement[];
      const headerText = new Map<string, { left: number, top: number }>();

      headers.forEach((header) => {
        const [line] = textLines(header);

        if (line !== undefined) {
          headerText.set(line.text, { left: line.left, top: line.top });
        }
      });
      seek('.ht-sheet-switch__in', true);
      seek('.ht-sheet-switch__out', false);

      const headerPanes = '.ht-sheet-switch__pane[data-pane="ht_clone_top"], .ht-sheet-switch__pane[data-pane="ht_clone_inline_start"]';
      const arriving = Array.from(layer.querySelectorAll(`:is(${headerPanes}) .ht-sheet-switch__in > .ht-sheet-switch__cell`))
        .flatMap(copy => textLines(copy))
        .map(line => ({ text: line.text, copy: { left: line.left, top: line.top }, header: headerText.get(line.text) ?? null }));
      const covers = Array.from(layer.querySelectorAll('.ht-sheet-switch__cover')).map(cover => cover.getBoundingClientRect());
      const overlaps = (first: DOMRect, second: { left: number, top: number, right: number, bottom: number }) => (
        Math.min(first.right, second.right) - Math.max(first.left, second.left) > 1
        && Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top) > 1
      );
      const uncovered = new Set<string>();

      layer.querySelectorAll(`:is(${headerPanes}) .ht-sheet-switch__out > .ht-sheet-switch__cell`).forEach((copy) => {
        const copyRect = copy.getBoundingClientRect();
        const paneRect = (copy.closest('.ht-sheet-switch__pane') as HTMLElement).getBoundingClientRect();

        headers.forEach((header) => {
          const rect = header.getBoundingClientRect();
          const box = {
            left: rect.left + header.clientLeft,
            top: rect.top + header.clientTop,
            right: rect.left + header.clientLeft + header.clientWidth,
            bottom: rect.top + header.clientTop + header.clientHeight,
          };
          const isCovered = covers.some(cover => cover.left <= box.left + 1 && cover.right >= box.right - 1
            && cover.top <= box.top + 1 && cover.bottom >= box.bottom - 1);

          if (overlaps(copyRect, box) && overlaps(paneRect, box) && !isCovered) {
            uncovered.add((header.textContent ?? '').trim());
          }
        });
      });

      return { arriving, uncoveredUnderLeaving: Array.from(uncovered).sort() };
    });
  }

  /**
   * Scrolls the scrollable part of the grid to an offset and waits until the grid answered
   * the scroll with an `afterScroll`.
   */
  async scrollGridTo(top: number, left: number): Promise<void> {
    await this.page.evaluate(([scrollTop, scrollLeft]) => {
      const hot = (window as never as { hot: any }).hot;
      const holder = hot.rootElement.querySelector(':scope > .ht_master .wtHolder');

      return new Promise<void>((resolve) => {
        hot.addHookOnce('afterScroll', () => resolve());
        holder.scrollTop = scrollTop;
        holder.scrollLeft = scrollLeft;
      });
    }, [top, left]);
  }

  /**
   * Re-sends the `sheetsBar` setting with the same `sheets` array, the way the React, Vue, and
   * Angular wrappers do on every render of the component that holds the grid.
   */
  async resendSheetsSetting(): Promise<void> {
    await this.page.evaluate(() => {
      const hot = (window as never as { hot: any }).hot;

      hot.updateSettings({ sheetsBar: { sheets: hot.getSettings().sheetsBar.sheets } });
    });
  }

  /**
   * How far the tab strip is scrolled from its start, and how far it can scroll. Under RTL the
   * strip scrolls into negative `scrollLeft`, so the distance is its magnitude.
   */
  async stripScroll(): Promise<{ travelled: number, total: number }> {
    return this.strip.evaluate(strip => ({
      travelled: Math.abs(strip.scrollLeft),
      total: strip.scrollWidth - strip.clientWidth,
    }));
  }

  /**
   * The color the page shows at a point inside a tab: near its inline-start edge, halfway down,
   * where neither the label nor the active line draws. Read from a one-pixel screenshot, so it
   * is what the user sees whichever layer paints it.
   */
  async tabSurfaceColor(index: number): Promise<string> {
    const box = await this.tab(index).boundingBox();

    if (box === null) {
      throw new Error(`Tab ${index} is not rendered`);
    }

    const png = await this.page.screenshot({
      clip: { x: Math.round(box.x) + 2, y: Math.round(box.y + (box.height / 2)), width: 1, height: 1 },
    });

    return this.page.evaluate(async (base64) => {
      const image = new Image();

      image.src = `data:image/png;base64,${base64}`;
      await image.decode();

      const canvas = document.createElement('canvas');

      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const context = canvas.getContext('2d') as CanvasRenderingContext2D;

      context.drawImage(image, 0, 0);

      const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;

      return `rgb(${red}, ${green}, ${blue})`;
    }, png.toString('base64'));
  }

  /**
   * A tab's viewport box.
   */
  /**
   * Pauses, from now on, every CSS transition and animation inside the tab strip the moment it
   * starts, so a later seek reads it from its start. Both run on real time, which the page clock
   * does not control. Mutation records are delivered as microtasks, so the motion a move or a
   * removal starts is paused before any frame is drawn.
   */
  async holdStripMotion(): Promise<void> {
    await this.page.evaluate(() => {
      const strip = document.querySelector('.ht-sheets-bar__tabs');

      if (strip === null) {
        throw new Error('No tab strip to hold');
      }

      const hold = () => strip.getAnimations({ subtree: true }).forEach((animation) => {
        if (animation.playState === 'running') {
          animation.pause();
        }
      });

      new MutationObserver(hold).observe(strip, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style'],
      });
    });
  }

  /**
   * Starts recording, from now on, whether the strip ever wore the sliding class and how many
   * leaving copies of removed tabs it received.
   */
  async recordStripMotion(): Promise<void> {
    await this.page.evaluate(() => {
      const strip = document.querySelector('.ht-sheets-bar__tabs');
      const record = { sliding: false, ghosts: 0 };

      if (strip === null) {
        throw new Error('No tab strip to record');
      }

      (window as never as { htStripMotion: typeof record }).htStripMotion = record;
      new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes') {
            record.sliding ||= strip.classList.contains('ht-sheets-bar__tabs--sliding');
          }

          mutation.addedNodes.forEach((node) => {
            if (node instanceof Element && node.classList.contains('ht-sheets-bar__tab-ghost')) {
              record.ghosts += 1;
            }
          });
        });
      }).observe(strip, { childList: true, attributes: true, attributeFilter: ['class'] });
    });
  }

  /**
   * What `recordStripMotion()` recorded so far, with the number of CSS transitions and
   * animations running inside the strip now.
   */
  async stripMotionRecord(): Promise<{ sliding: boolean, ghosts: number, animations: number }> {
    return this.page.evaluate(() => ({
      ...(window as never as { htStripMotion: { sliding: boolean, ghosts: number } }).htStripMotion,
      animations: document.querySelector('.ht-sheets-bar__tabs')?.getAnimations({ subtree: true }).length ?? 0,
    }));
  }

  /**
   * The leaving copy of a removed tab.
   */
  get ghost(): Locator {
    return this.bar.locator('.ht-sheets-bar__tab-ghost');
  }

  /**
   * Pauses the CSS transitions and animations of a sheet's tab, or of the leaving copy of a
   * removed tab when `name` is `null`, at a fraction of their run, and returns its viewport box,
   * its resting left edge (the box without the transform), its opacity, and the active duration
   * of each. Seek below 1: a transition paused at its end no longer applies.
   */
  async stripMotionAt(name: string | null, progress: number): Promise<{
    left: number,
    restLeft: number,
    width: number,
    opacity: number,
    durations: number[],
  }> {
    return this.page.evaluate(({ sheetName, fraction }) => {
      const element = sheetName === null
        ? document.querySelector('.ht-sheets-bar__tab-ghost')
        : Array.from(document.querySelectorAll('.ht-sheets-bar__tab'))
          .find(tab => tab.querySelector('.ht-sheets-bar__tab-label')?.textContent === sheetName);

      if (!(element instanceof HTMLElement)) {
        throw new Error(`No element for ${sheetName ?? 'the leaving tab'}`);
      }

      const animations = element.getAnimations();

      animations.forEach((animation) => {
        const timing = animation.effect?.getComputedTiming();

        animation.pause();
        animation.currentTime = Number(timing?.delay ?? 0) + (Number(timing?.activeDuration ?? 0) * fraction);
      });

      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);

      return {
        left: rect.left,
        restLeft: rect.left - new DOMMatrix(style.transform).m41,
        width: rect.width,
        opacity: Number(style.opacity),
        durations: animations.map(animation => Number(animation.effect?.getComputedTiming().activeDuration ?? 0)),
      };
    }, { sheetName: name, fraction: progress });
  }

  /**
   * Starts recording, from now on, every CSS transition that starts on a tab: the tab's sheet
   * name and the transitioned property. `transitionrun` fires when a transition is created, so
   * the record does not depend on how long the transition runs.
   */
  async recordTabTransitions(): Promise<void> {
    await this.page.evaluate(() => {
      const record: Array<{ name: string, property: string }> = [];

      (window as never as { htTabTransitions: typeof record }).htTabTransitions = record;
      document.querySelector('.ht-sheets-bar__tabs')!.addEventListener('transitionrun', (event) => {
        const tab = (event.target as Element).closest('.ht-sheets-bar__tab');

        if (tab !== null) {
          record.push({
            name: tab.querySelector('.ht-sheets-bar__tab-label')?.textContent ?? '',
            property: (event as TransitionEvent).propertyName,
          });
        }
      });
    });
  }

  /**
   * The tab transitions `recordTabTransitions()` saw start, optionally only those of one
   * property.
   */
  async tabTransitions(property?: string): Promise<Array<{ name: string, property: string }>> {
    const record: Array<{ name: string, property: string }> = await this.page.evaluate(
      () => (window as never as { htTabTransitions: Array<{ name: string, property: string }> }).htTabTransitions,
    );

    return property === undefined ? record : record.filter(entry => entry.property === property);
  }

  /**
   * A sheet tab's computed text and background colors, the duration its `transition` gives each
   * of them, in milliseconds (`0` when the list does not name it), and the number of transitions
   * of each it runs now.
   */
  async tabColorMotion(name: string): Promise<{
    color: string,
    background: string,
    colorDurationMs: number,
    backgroundDurationMs: number,
    runningColor: number,
    runningBackground: number,
  }> {
    return this.page.evaluate((sheetName) => {
      const tab = Array.from(document.querySelectorAll('.ht-sheets-bar__tab'))
        .find(element => element.querySelector('.ht-sheets-bar__tab-label')?.textContent === sheetName);

      if (!(tab instanceof HTMLElement)) {
        throw new Error(`No tab for ${sheetName}`);
      }

      const style = getComputedStyle(tab);
      const properties = style.transitionProperty.split(',').map(value => value.trim());
      const durations = style.transitionDuration.split(',').map(value => value.trim());
      const durationOf = (target: string) => {
        const index = properties.findIndex(property => property === target || property === 'all');
        const duration = index === -1 ? '0s' : durations[index % durations.length];
        const seconds = duration.endsWith('ms') ? parseFloat(duration) / 1000 : parseFloat(duration);

        return Math.round(seconds * 1000);
      };
      const runningOf = (target: string) => tab.getAnimations()
        .filter(animation => animation instanceof CSSTransition && animation.transitionProperty === target)
        .length;

      return {
        color: style.color,
        background: style.backgroundColor,
        colorDurationMs: durationOf('color'),
        backgroundDurationMs: durationOf('background-color'),
        runningColor: runningOf('color'),
        runningBackground: runningOf('background-color'),
      };
    }, name);
  }

  /**
   * The tab names in strip order.
   */
  async tabNames(): Promise<string[]> {
    return this.page.evaluate(() => Array.from(
      document.querySelectorAll('.ht-sheets-bar__tab .ht-sheets-bar__tab-label'),
    ).map(label => label.textContent ?? ''));
  }

  async tabBox(index: number): Promise<{ left: number, width: number }> {
    const box = await this.tab(index).boundingBox();

    if (box === null) {
      throw new Error(`Tab ${index} is not rendered`);
    }

    return { left: box.x, width: box.width };
  }
}
