import { test, expect, MOTION_TAG } from '../fixtures/test';
import { SheetsBarPage } from '../fixtures/pages/SheetsBarPage';
import { SheetsBarPaginationPage } from '../fixtures/pages/SheetsBarPaginationPage';

/**
 * The timing of each animated theme, taken from the design table of the switch animation: the
 * base transition `T`, the marker slide (`2.25 × T`), and, for the two columns of the default
 * fixture, the stagger between the columns and the content phase (`T` plus one stagger).
 */
const SPEC_TIMING: Record<string, { transition: number, marker: number, twoColumnStagger: number, twoColumnContent: number }> = {
  main: { transition: 150, marker: 337.5, twoColumnStagger: 75, twoColumnContent: 225 },
  horizon: { transition: 200, marker: 450, twoColumnStagger: 100, twoColumnContent: 300 },
};

/**
 * The part of a column's transition its leaving copies take to fade out, from its start.
 */
const SPEC_OUT_PART = 0.45;

/**
 * The part of a column's transition that passes before its arriving copies start to fade in. It
 * is past the end of the leaving fade, so a column never shows both at once.
 */
const SPEC_IN_START_PART = 0.5;

/**
 * The stagger the design states for `columns` visible column groups: `min(T / 2, 2T / (n − 1))`.
 */
function specStaggerMs(transition: number, columns: number): number {
  return columns <= 1 ? 0 : Math.min(transition / 2, (2 * transition) / (columns - 1));
}

/**
 * Freezes the page clock once the fixture has loaded, so the timers that end the slide and the
 * swap only run when the test advances time, and holds every CSS transition at its start for
 * the test to seek.
 */
async function openPaused(bar: SheetsBarPage, options: Parameters<SheetsBarPage['goto']>[0] = {}): Promise<void> {
  await bar.page.clock.install();
  await bar.goto(options);
  await bar.page.clock.pauseAt(Date.now() + 60_000);
  await bar.holdTransitions();
}

/**
 * Asserts that two horizontal boxes match to within the one pixel `offsetLeft` rounding allows.
 */
function expectSameBox(actual: { left: number, width: number }, expected: { left: number, width: number }): void {
  expect(Math.abs(actual.left - expected.left)).toBeLessThanOrEqual(1);
  expect(Math.abs(actual.width - expected.width)).toBeLessThanOrEqual(1);
}

/**
 * The slide is cleaned up by a timer, so every animated case freezes the page clock once the
 * fixture has loaded: the indicator then lives until the test advances time past its duration.
 * The CSS transitions run on real time, so the cases hold them at their start and seek them.
 */
test.describe('sheets bar switch animation – active tab marker', { tag: MOTION_TAG }, () => {
  test('the marker slides from the previous tab to the new one', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.recordIndicators();

    const oldTab = await bar.tabBox(0);

    await bar.clickTab(1);

    const newTab = await bar.tabBox(1);

    await expect(bar.indicator).toHaveCount(1);
    await expect(bar.indicator).toHaveAttribute('aria-hidden', 'true');
    await expect(bar.strip).toHaveClass(/ht-sheets-bar__tabs--indicator-moving/);
    expect(await bar.indicatorsAdded()).toBe(1);
    expect(Math.abs(newTab.left - oldTab.left)).toBeGreaterThan(10);

    const start = await bar.indicatorBoxAt(0);
    const end = await bar.indicatorBoxAt(1);

    expect(start.transitions).toBeGreaterThan(0);
    expectSameBox(start, oldTab);
    expectSameBox(end, newTab);
  });

  test('the marker is removed after the slide and the new tab carries the active styling', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);

    const duration = SPEC_TIMING[theme].marker;

    await bar.clickTab(1);
    await page.clock.runFor(Math.floor(duration) - 1);

    await expect(bar.indicator).toHaveCount(1);

    await page.clock.runFor(2);

    await expect(bar.indicator).toHaveCount(0);
    await expect(bar.strip).not.toHaveClass(/ht-sheets-bar__tabs--indicator-moving/);
    await expect(bar.tab(1)).toHaveClass(/ht-sheets-bar__tab--active/);
    await bar.expectCell(0, 0, 'B1');
  });

  test('a switch during a slide starts the new slide where the marker is on screen', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);

    const firstTab = await bar.tabBox(0);
    const secondTab = await bar.tabBox(1);

    await bar.clickTab(1);

    const midway = await bar.indicatorBoxAt(0.5);

    expect(Math.abs(midway.left - firstTab.left)).toBeGreaterThan(2);
    expect(Math.abs(midway.left - secondTab.left)).toBeGreaterThan(2);

    await page.evaluate(() => (window as never as { hot: any }).hot.getPlugin('sheetsBar').setActiveSheet('Gamma'));

    await expect(bar.indicator).toHaveCount(1);
    expectSameBox(await bar.indicatorBoxAt(0), midway);
    expectSameBox(await bar.indicatorBoxAt(1), await bar.tabBox(2));
  });

  test('a tab drag that starts during a slide removes the marker', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.clickTab(1);

    await expect(bar.indicator).toHaveCount(1);

    const tab = await bar.tab(2).boundingBox();

    if (tab === null) {
      throw new Error('Tab 2 is not rendered');
    }

    await page.mouse.move(tab.x + (tab.width / 2), tab.y + (tab.height / 2));
    await page.mouse.down();
    await page.mouse.move(tab.x + (tab.width / 2) + 30, tab.y + (tab.height / 2), { steps: 3 });

    await expect(bar.tab(2)).toHaveClass(/ht-sheets-bar__tab--dragging/);
    await expect(bar.indicator).toHaveCount(0);
    await expect(bar.strip).not.toHaveClass(/ht-sheets-bar__tabs--indicator-moving/);

    await page.mouse.up();
  });

  test('a rename that starts during a slide removes the marker', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.clickTab(1);

    await expect(bar.indicator).toHaveCount(1);

    await bar.tab(1).locator('.ht-sheets-bar__tab-label').dblclick();

    await expect(bar.renameInput).toBeVisible();
    await expect(bar.indicator).toHaveCount(0);
  });

  test('under RTL the marker slides toward the inline end', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar, { rtl: true });

    const oldTab = await bar.tabBox(0);

    await bar.clickTab(1);

    const newTab = await bar.tabBox(1);
    const start = await bar.indicatorBoxAt(0);
    const end = await bar.indicatorBoxAt(1);

    expect(newTab.left).toBeLessThan(oldTab.left);
    expectSameBox(start, oldTab);
    expectSameBox(end, newTab);
  });

  test('only the tabs the marker passes over show it through their background', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.bar.evaluate((element) => {
      element.style.setProperty('--ht-sheets-bar-tab-background-color', 'rgb(255, 0, 0)');
    });

    await expect.poll(() => bar.tabBackground(2)).toBe('rgb(255, 0, 0)');

    await bar.clickTab(1);

    await expect(bar.indicator).toHaveCount(1);
    expect(await bar.tabBackground(0)).toBe('rgba(0, 0, 0, 0)');
    expect(await bar.tabBackground(1)).toBe('rgba(0, 0, 0, 0)');
    expect(await bar.tabBackground(2)).toBe('rgb(255, 0, 0)');
  });

  test('an opaque inactive tab surface stays visible on the tabs the marker passes over', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.bar.evaluate((element) => {
      element.style.setProperty('--ht-sheets-bar-tab-background-color', 'rgb(255, 0, 0)');
    });

    await expect.poll(() => bar.tabSurfaceColor(1)).toBe('rgb(255, 0, 0)');

    await bar.clickTab(2);
    await bar.indicatorBoxAt(0);

    await expect(bar.tab(1)).toHaveClass(/ht-sheets-bar__tab--indicator-path/);
    expect(await bar.tabSurfaceColor(1)).toBe('rgb(255, 0, 0)');
  });

  test('a wrapper re-sending the same sheets keeps the marker sliding from where it is', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);

    const duration = SPEC_TIMING[theme].marker;

    await bar.clickTab(1);

    const midway = await bar.indicatorBoxAt(0.5);

    await bar.resendSheetsSetting();

    await expect(bar.indicator).toHaveCount(1);
    await expect(bar.strip).toHaveClass(/ht-sheets-bar__tabs--indicator-moving/);

    const resumed = await bar.indicatorBoxAt(0);

    expect(resumed.transitions).toBeGreaterThan(0);
    expectSameBox(resumed, midway);
    expectSameBox(await bar.indicatorBoxAt(1), await bar.tabBox(1));

    await page.clock.runFor(Math.ceil(duration) + 1);

    await expect(bar.indicator).toHaveCount(0);
    await expect(bar.strip).not.toHaveClass(/ht-sheets-bar__tabs--indicator-moving/);
  });

  test('removing the active tab from the middle slides the marker onto the tab that takes its place', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);

    const duration = SPEC_TIMING[theme].marker;

    await bar.clickTab(1);
    await page.clock.runFor(Math.ceil(duration) + 1);

    await expect(bar.indicator).toHaveCount(0);

    const removedTab = await bar.tabBox(1);

    await page.evaluate(() => {
      const plugin = (window as never as { hot: any }).hot.getPlugin('sheetsBar');

      plugin.removeSheet(plugin.getSheets()[1].id);
    });

    await expect(bar.tabByName('Beta')).toHaveCount(0);
    await bar.expectActiveTab(1);
    await expect(bar.indicator).toHaveCount(1);

    const landingMotion = await bar.stripMotionAt('Gamma', 0);
    const landing = { left: landingMotion.restLeft, width: landingMotion.width };
    const layer = await bar.switchLayerContent();

    expectSameBox(await bar.indicatorBoxAt(0), removedTab);
    expectSameBox(await bar.indicatorBoxAt(1), landing);
    await expect(bar.switchLayer).toHaveCount(1);
    expect(layer.outBody).toEqual(['B1', 'B2', 'B3', 'B4']);
    expect(layer.inBody).toEqual(['G1', 'G2', 'G3', 'G4']);
  });

  test('an afterSheetTabChange listener that adds a tab leaves the marker landing on the active tab', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await page.evaluate(() => {
      const hot = (window as never as { hot: any }).hot;

      hot.addHookOnce('afterSheetTabChange', () => hot.getPlugin('sheetsBar').addSheet('Delta'));
    });
    await bar.clickTab(1);

    await expect(bar.tabByName('Delta')).toHaveCount(1);
    await bar.expectActiveTab(1);
    await expect(bar.indicator).toHaveCount(1);
    expectSameBox(await bar.indicatorBoxAt(1), await bar.tabBox(1));
  });

  test('reduced motion never shows the marker', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await bar.goto();
    await bar.recordIndicators();
    await bar.clickTab(1);
    await bar.clickTab(2);

    await bar.expectActiveTab(2);
    expect(await bar.indicatorsAdded()).toBe(0);
  });
});

/**
 * Runs a fixed sequence of selections, a merge, a filter, and tab clicks, and returns the grid
 * state it ends in. The merge and the filter are made on Beta, the sheet the sequence ends on,
 * so its restore has to bring both back. `afterEachSwitch` runs after every click with the
 * sheet left and the sheet arrived at.
 */
async function stateAfterRapidClicks(
  bar: SheetsBarPage,
  afterEachSwitch: (left: string, arrived: string) => Promise<void> = async() => {},
): Promise<unknown> {
  await bar.page.evaluate(() => (window as never as { hot: any }).hot.selectCell(1, 1));
  await bar.clickTab(1);
  await afterEachSwitch('Alpha', 'Beta');
  await bar.page.evaluate(() => {
    const hot = (window as never as { hot: any }).hot;
    const filters = hot.getPlugin('filters');

    hot.getPlugin('mergeCells').merge(0, 0, 0, 1);
    filters.addCondition(0, 'neq', ['B3']);
    filters.filter();
    hot.selectCell(0, 1);
  });
  await bar.clickTab(2);
  await afterEachSwitch('Beta', 'Gamma');
  await bar.clickTab(1);
  await afterEachSwitch('Gamma', 'Beta');

  return bar.page.evaluate(() => {
    const hot = (window as never as { hot: any }).hot;

    return {
      data: hot.getData(),
      selected: hot.getSelected(),
      sort: hot.getPlugin('columnSorting').getSortConfig(),
      filters: hot.getPlugin('filters').exportConditions(),
      merges: hot.getPlugin('mergeCells').getVisibleMergedAreas()
        .map(({ row, col, rowspan, colspan }: Record<string, number>) => ({ row, col, rowspan, colspan })),
      active: hot.getPlugin('sheetsBar').getSheets().find((sheet: { isActive: boolean }) => sheet.isActive).name,
    };
  });
}

/**
 * The body cells each sheet shows at each step of `stateAfterRapidClicks()`: Beta shows only its
 * merged first row once the sequence merged it and filtered its second row out.
 */
const RAPID_CLICK_CELLS: Record<string, string[]> = {
  Alpha: ['A1', 'A2', 'A3', 'A4'],
  'Beta before': ['B1', 'B2', 'B3', 'B4'],
  Beta: ['B1'],
  Gamma: ['G1', 'G2', 'G3', 'G4'],
};

/**
 * Reads the body cell texts, the ones shaped like `B1`, from a list of copy texts.
 */
function cellTexts(texts: string[]): string[] {
  return texts.filter(text => /^[A-Z]\d$/.test(text));
}

test.describe('sheets bar switch animation – content swap', { tag: MOTION_TAG }, () => {
  test('every visible body cell swaps, one column group per visible column', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar, { large: true });

    const before = await bar.visibleBodyCells();

    await bar.clickTab(1);

    const after = await bar.visibleBodyCells();
    const layer = await bar.switchLayerContent();

    expect(after.rendered).toBeGreaterThan(after.texts.length);
    await expect(bar.switchLayer).toHaveCount(1);
    await expect(bar.switchLayer).toHaveAttribute('aria-hidden', 'true');
    expect((await bar.switchGroups()).filter(group => group.pane === 'ht_master')).toHaveLength(after.columns);
    expect(layer.inBody).toEqual(after.texts);
    expect(layer.outBody).toEqual(before.texts);
    expect(layer.inBody.every(text => text.startsWith('B'))).toBe(true);
    expect(layer.outBody.every(text => text.startsWith('A'))).toBe(true);
  });

  test('the entering copies end where the arriving cells draw their text', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar, { large: true });
    await bar.clickTab(1);

    const positions = await bar.enteringTextPositions();
    const visible = await bar.visibleBodyCells();

    expect(positions.map(({ text }) => text).sort()).toEqual(visible.texts);
    positions.forEach(({ text, copy, cell }) => {
      expect(Math.abs(copy.top - cell.top), `${text} top`).toBeLessThanOrEqual(1);
      expect(Math.abs(copy.left - cell.left), `${text} left`).toBeLessThanOrEqual(1);
    });
  });

  test('a renamed column header swaps, the headers its new width moves swap with it, and the others stay', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar, { large: true });
    await bar.clickTab(1);

    const layer = await bar.switchLayerContent();
    const moved = layer.outHeaders.filter(text => text !== 'Col 1');

    expect(layer.inHeaders).toContain('Col 1 (Beta)');
    expect(layer.outHeaders).toContain('Col 1');
    expect(layer.inHeaders).not.toContain('Col 0');
    expect(layer.outHeaders).not.toContain('Col 0');
    expect(moved.length).toBeGreaterThan(0);
    expect(layer.inHeaders.filter(text => text !== 'Col 1 (Beta)')).toEqual(moved);
  });

  test('the layer is removed after the content phase, then the reveal ends', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.clickTab(1);

    const { transition, twoColumnStagger, twoColumnContent: contentPhase } = SPEC_TIMING[theme];
    const columns = (await bar.switchGroups())
      .filter(group => group.pane === 'ht_master')
      .sort((first, second) => first.left - second.left);

    const inStart = transition * SPEC_IN_START_PART;

    expect(columns.map(group => group.in?.delay)).toEqual([inStart, twoColumnStagger + inStart]);
    expect(columns.map(group => group.out?.delay)).toEqual([0, twoColumnStagger]);
    expect(columns.map(group => group.in?.duration)).toEqual([transition - inStart, transition - inStart]);
    columns.forEach(group => expect(group.out?.duration).toBeCloseTo(transition * SPEC_OUT_PART, 3));
    expect(await bar.switchState()).toBe('pending');

    await page.clock.runFor(Math.floor(contentPhase) - 1);

    await expect(bar.switchLayer).toHaveCount(1);

    await page.clock.runFor(2);

    await expect(bar.switchLayer).toHaveCount(0);
    expect(await bar.switchState()).toBe('reveal');

    await page.clock.runFor(transition);

    expect(await bar.switchState()).toBeNull();
    await bar.expectCell(0, 0, 'B1');
  });

  test('the copies over a frozen column are cut where the frozen pane starts', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar, { large: true, fixedColumnsStart: 2 });
    await bar.scrollGridTo(0, 25);
    await bar.clickTab(1);

    const geometry = await page.evaluate(() => {
      const hot = (window as never as { hot: any }).hot;
      const frozen = hot.rootElement.querySelector(':scope > .ht_clone_inline_start').getBoundingClientRect();
      const masterPane = document.querySelector('.ht-sheet-switch__pane[data-pane="ht_master"]') as HTMLElement;
      const copies = Array.from(masterPane.querySelectorAll('.ht-sheet-switch__cell'))
        .map(copy => copy.getBoundingClientRect().left);

      return {
        frozenRight: frozen.right,
        paneLeft: masterPane.getBoundingClientRect().left,
        paneOverflow: getComputedStyle(masterPane).overflow,
        leftmostCopy: Math.min(...copies),
      };
    });

    expect(geometry.leftmostCopy).toBeLessThan(geometry.frozenRight - 1);
    expect(Math.abs(geometry.paneLeft - geometry.frozenRight)).toBeLessThanOrEqual(1);
    expect(geometry.paneOverflow).toBe('hidden');
  });

  test('the copies over the frozen end columns and bottom rows are cut by their own panes', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar, { large: true, fixedColumnsEnd: 2, fixedRowsBottom: 2 });
    await bar.clickTab(1);

    const panes = await bar.switchPanes();
    const pane = (name: string) => {
      const found = panes.find(entry => entry.pane === name);

      if (found === undefined) {
        throw new Error(`No ${name} pane in the layer`);
      }

      return found;
    };
    const end = pane('ht_clone_inline_end');
    const bottom = pane('ht_clone_bottom');
    const corner = pane('ht_clone_bottom_inline_end_corner');

    expect(end.entering.length).toBeGreaterThan(0);
    expect(end.entering.every(text => /^(B\d+-3[89]|#\d+|\d+)$/.test(text))).toBe(true);
    expect(end.entering.some(text => text.startsWith('B'))).toBe(true);
    expect(bottom.entering.length).toBeGreaterThan(0);
    expect(bottom.entering.every(text => /^B5[89]-\d+$/.test(text))).toBe(true);
    expect(corner.entering.sort()).toEqual(['B58-38', 'B58-39', 'B59-38', 'B59-39']);
    expect(Math.abs(end.box.left - (end.overlay?.left ?? Number.NaN))).toBeLessThanOrEqual(1);
    expect(Math.abs(bottom.box.top - (bottom.overlay?.top ?? Number.NaN))).toBeLessThanOrEqual(1);
    expect(Math.abs(corner.box.left - end.box.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(corner.box.top - bottom.box.top)).toBeLessThanOrEqual(1);
  });

  test('the frozen bottom rows of a grid that renders fewer rows than it holds swap in their own pane', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar, { large: true, maxRows: 40, fixedRowsBottom: 2 });
    await bar.clickTab(1);

    const bottom = (await bar.switchPanes()).find(entry => entry.pane === 'ht_clone_bottom');

    expect(bottom, 'the layer has a bottom pane').toBeDefined();
    expect(bottom?.entering.length).toBeGreaterThan(0);
    expect(bottom?.entering.every(text => /^B3[89]-\d+$/.test(text))).toBe(true);
    expect(Math.abs((bottom?.box.top ?? Number.NaN) - (bottom?.overlay?.top ?? Number.NaN))).toBeLessThanOrEqual(1);
  });

  test('a swap that fails to build leaves no switch state behind', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);

    const thrown = await page.evaluate(() => {
      const hot = (window as never as { hot: any }).hot;
      const { getCell } = hot;

      hot.addHookOnce('afterSheetTabChange', () => {
        hot.getCell = () => {
          hot.getCell = getCell;
          throw new Error('getCell failed');
        };
      });

      try {
        hot.getPlugin('sheetsBar').setActiveSheet('Beta');
      } catch (error) {
        return (error as Error).message;
      }

      return null;
    });

    expect(thrown).toBe('getCell failed');
    await bar.expectActiveTab(1);
    await bar.expectCell(0, 0, 'B1');
    expect(await bar.switchState()).toBeNull();
    await expect(bar.switchLayer).toHaveCount(0);
  });

  test('between sheets scrolled apart, every header copy lands on its header and no leaving copy sits on an uncovered one', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);
    const expectHeadersInPlace = async() => {
      const geometry = await bar.headerSwapGeometry();

      expect(geometry.arriving.some(line => line.text.startsWith('Col'))).toBe(true);
      expect(geometry.arriving.some(line => /^\d+$/.test(line.text))).toBe(true);
      geometry.arriving.forEach(({ text, copy, header }) => {
        expect(header, `${text} is drawn by the grid`).not.toBeNull();
        expect(Math.abs(copy.left - (header?.left ?? Number.NaN)), `${text} left`).toBeLessThanOrEqual(1);
        expect(Math.abs(copy.top - (header?.top ?? Number.NaN)), `${text} top`).toBeLessThanOrEqual(1);
      });
      expect(geometry.uncoveredUnderLeaving).toEqual([]);
    };

    await openPaused(bar, { large: true });
    await bar.clickTab(1);
    await bar.clickTab(0);
    await bar.scrollGridTo(150, 120);
    await bar.clickTab(1);

    await expect(bar.switchLayer).toHaveCount(1);
    await expectHeadersInPlace();

    await bar.clickTab(0);

    await expect(bar.switchLayer).toHaveCount(1);
    await expectHeadersInPlace();
  });

  test('a settings update that changes nothing keeps the swap running', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.clickTab(1);

    await expect(bar.switchLayer).toHaveCount(1);

    await page.evaluate(() => (window as never as { hot: any }).hot.updateSettings({}));

    await expect(bar.switchLayer).toHaveCount(1);
    expect(await bar.switchState()).toBe('pending');
  });

  test('a settings update that re-sends the sheets bar options keeps the swap running', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.clickTab(1);

    await expect(bar.switchLayer).toHaveCount(1);

    await page.evaluate(() => (window as never as { hot: any }).hot.updateSettings({ sheetsBar: {} }));

    await bar.expectActiveTab(1);
    await expect(bar.switchLayer).toHaveCount(1);
    expect(await bar.switchState()).toBe('pending');
  });

  test('a switch the activeSheet setting asks for swaps the content', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await page.evaluate(() => (window as never as { hot: any }).hot.updateSettings({ sheetsBar: { activeSheet: 1 } }));

    await bar.expectActiveTab(1);
    await bar.expectCell(0, 0, 'B1');
    await expect(bar.switchLayer).toHaveCount(1);
    expect(await bar.switchState()).toBe('pending');
  });

  test('the layer is inert, and its copies run no inline handler of the cells they copy', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar, { htmlImage: true });

    await expect.poll(async() => (await bar.imageErrorRuns()).other).toBeGreaterThan(0);

    const before = await bar.imageErrorRuns();

    await bar.clickTab(1);

    await expect(bar.switchLayer).toHaveCount(1);
    expect(await bar.switchLayerIsInert()).toBe(true);
    expect((await bar.switchLayerContent()).inBody).toContain('B1');
    await expect.poll(async() => (await bar.imageErrorRuns()).other).toBeGreaterThan(before.other);
    expect((await bar.imageErrorRuns()).layer).toBe(0);
  });

  test('a script inside a cell never runs from the copies', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar, { activeContent: true });
    await bar.clickTab(1);

    await expect(bar.switchLayer).toHaveCount(1);
    expect((await bar.activeContentProbe()).scriptRuns).toBe(0);
    expect(await bar.switchLayerCount('script')).toBe(0);
    expect((await bar.switchLayerContent()).outBody).toContain('A1');

    await page.clock.runFor(60_000);
    await bar.clickTab(0);

    await expect(bar.switchLayer).toHaveCount(1);
    expect((await bar.switchLayerContent()).inBody).toContain('A1');
    expect((await bar.activeContentProbe()).scriptRuns).toBe(0);
  });

  test('the copies leave the radio group and the form of the grid alone', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar, { activeContent: true });

    expect((await bar.activeContentProbe()).formData).toEqual([['htGroup', 'a'], ['htAgree', 'on']]);

    await bar.clickTab(1);

    await expect(bar.switchLayer).toHaveCount(1);

    const during = await bar.activeContentProbe();

    expect(during.checkedInGrid).toEqual(['htGroup=b', 'htAgree=on']);
    expect(during.formData).toEqual([['htGroup', 'b'], ['htAgree', 'on']]);
    expect(await bar.switchLayerCount('input[type="radio"]:checked')).toBe(2);

    await page.clock.runFor(60_000);

    await expect(bar.switchLayer).toHaveCount(0);

    const after = await bar.activeContentProbe();

    expect(after.checkedInGrid).toEqual(['htGroup=b', 'htAgree=on']);
    expect(after.formData).toEqual([['htGroup', 'b'], ['htAgree', 'on']]);
  });

  test('the copies never construct or connect a custom element of a cell', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar, { activeContent: true });

    const before = await bar.activeContentProbe();

    expect(before.constructed).toBeGreaterThan(0);

    await bar.clickTab(1);

    await expect(bar.switchLayer).toHaveCount(1);

    const during = await bar.activeContentProbe();

    expect(during.constructed).toBe(before.constructed);
    expect(during.connectedInLayer).toBe(0);
    expect(await bar.switchLayerCount('ht-probe')).toBe(0);
  });

  test('the copies never request a frame or a video of a cell again', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);
    const requests: string[] = [];
    const settleRequests = () => page.evaluate(() => fetch('/tests/fixtures/demo/sheets-bar.html?settled')
      .then(response => response.text()));

    page.on('request', (request) => {
      if (/missing-(frame|video)/.test(request.url())) {
        requests.push(request.url());
      }
    });
    await openPaused(bar, { activeContent: true });
    await settleRequests();

    const loaded = requests.length;

    expect(loaded).toBeGreaterThan(0);

    await bar.clickTab(1);

    await expect(bar.switchLayer).toHaveCount(1);
    await settleRequests();
    expect(requests).toHaveLength(loaded);
    expect(await bar.switchLayerCount('iframe, video')).toBe(0);
    expect((await bar.switchLayerContent()).outBody).toContain('A3');
  });

  test('with every animation disabled, only the entering copies show', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; }' });
    await bar.clickTab(1);

    await expect(bar.switchLayer).toHaveCount(1);

    const opacities = await bar.switchSideOpacities();

    expect(opacities.out.length).toBeGreaterThan(0);
    expect(opacities.out.every(opacity => opacity === '0')).toBe(true);
    expect(opacities.in.length).toBeGreaterThan(0);
    expect(opacities.in.every(opacity => opacity === '1')).toBe(true);
  });

  test('reduced motion never draws the layer or sets a switch state', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await bar.goto();
    await bar.recordSwitchLayers();
    await bar.clickTab(1);
    await bar.clickTab(2);

    await bar.expectActiveTab(2);
    expect(await bar.switchLayerRecord()).toEqual({ added: 0, maxAtOnce: 0, stateSeen: false });
  });

  test('rapid switches keep one layer and end in the state of a switch without animation', async ({
    page, theme, bundle,
  }) => {
    const classic = new SheetsBarPage(page, 'classic', bundle);

    await classic.goto({ filters: true, mergeCells: true });

    const expected = await stateAfterRapidClicks(classic);
    const bar = new SheetsBarPage(page, theme, bundle);
    const swaps: Array<{ left: string, arrived: string, outBody: string[], inBody: string[] }> = [];

    await openPaused(bar, { filters: true, mergeCells: true });
    await bar.recordSwitchLayers();

    const actual = await stateAfterRapidClicks(bar, async(left, arrived) => {
      await expect(bar.switchLayer).toHaveCount(1);

      const layer = await bar.switchLayerContent();

      swaps.push({ left, arrived, outBody: cellTexts(layer.outBody), inBody: cellTexts(layer.inBody) });
    });
    const record = await bar.switchLayerRecord();

    expect(swaps).toEqual([
      { left: 'Alpha', arrived: 'Beta', outBody: RAPID_CLICK_CELLS.Alpha, inBody: RAPID_CLICK_CELLS['Beta before'] },
      { left: 'Beta', arrived: 'Gamma', outBody: RAPID_CLICK_CELLS.Beta, inBody: RAPID_CLICK_CELLS.Gamma },
      { left: 'Gamma', arrived: 'Beta', outBody: RAPID_CLICK_CELLS.Gamma, inBody: RAPID_CLICK_CELLS.Beta },
    ]);
    expect(record.added).toBe(3);
    expect(record.maxAtOnce).toBe(1);
    expect((expected as { filters: unknown[] }).filters).not.toEqual([]);
    expect((expected as { merges: unknown[] }).merges).toEqual([{ row: 0, col: 0, rowspan: 1, colspan: 2 }]);
    expect(actual).toEqual(expected);
  });

  test('the switch\'s own scroll restore keeps the swap running', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar, { large: true });
    await bar.scrollGridTo(300, 0);
    await bar.clickTab(1);
    await bar.scrollGridTo(0, 0);

    await expect(bar.switchLayer).toHaveCount(0);

    await page.evaluate(() => {
      const target = window as never as { hot: any, htScrolls: number };

      target.htScrolls = 0;
      target.hot.addHook('afterScroll', () => {
        target.htScrolls += 1;
      });
    });
    await bar.clickTab(0);

    await expect.poll(() => page.evaluate(() => (window as never as { htScrolls: number }).htScrolls)).toBeGreaterThan(0);
    await expect(bar.switchLayer).toHaveCount(1);
  });

  test('a scroll during the swap removes the layer', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar, { large: true });
    await bar.clickTab(1);

    await expect(bar.switchLayer).toHaveCount(1);

    await bar.scrollGridTo(120, 0);

    await expect(bar.switchLayer).toHaveCount(0);
    expect(await bar.switchState()).toBeNull();
  });

  test('a click on a cell during the swap selects it and removes the layer', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.clickTab(1);

    await expect(bar.switchLayer).toHaveCount(1);

    await bar.cell(1, 1).click();

    await expect(bar.switchLayer).toHaveCount(0);
    expect(await bar.selected()).toEqual([[1, 1, 1, 1]]);
  });

  test('the hooks fire in the same order and with the same arguments as in a switch without animation', async ({
    page, theme, bundle,
  }) => {
    const recordHooks = async(sheetsBar: SheetsBarPage): Promise<Array<[string, unknown[]]>> => {
      await page.evaluate(() => {
        const target = window as never as { hot: any, Handsontable: any, htHooks: Array<[string, unknown[]]> };
        const names = target.Handsontable.hooks.getRegistered()
          .filter((name: string) => /SheetTab|Selection|Deselect|Scroll/.test(name));
        const plain = (value: unknown, depth: number): unknown => {
          if (value === undefined) {
            return '<undefined>';
          }

          if (value === null || typeof value !== 'object') {
            return typeof value === 'function' ? '<function>' : value;
          }

          if (value instanceof Node || value instanceof Event || value === window) {
            return `<${value.constructor.name}>`;
          }

          if (depth > 5) {
            return '<nested>';
          }

          if (Array.isArray(value)) {
            return value.map(item => plain(item, depth + 1));
          }

          return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, plain(item, depth + 1)]));
        };

        target.htHooks = [];
        names.forEach((name: string) => target.hot.addHook(name, (...args: unknown[]) => {
          target.htHooks.push([name, args.map(arg => plain(arg, 0))]);
        }));
        target.hot.selectCell(1, 1);
      });
      await sheetsBar.clickTab(1);
      await page.evaluate(() => (window as never as { hot: any }).hot.selectCell(0, 0));
      await sheetsBar.clickTab(0);

      return page.evaluate(() => (window as never as { htHooks: Array<[string, unknown[]]> }).htHooks);
    };
    const classic = new SheetsBarPage(page, 'classic', bundle);

    await classic.goto();

    const expected = await recordHooks(classic);
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);

    const actual = await recordHooks(bar);
    const change = expected.find(([name]) => name === 'afterSheetTabChange');

    expect(change?.[1].length).toBeGreaterThan(0);
    expect(actual).toEqual(expected);
  });
});

/**
 * Reads the master pane's column groups of the running layer, in on-screen order from the
 * inline start: left to right, or right to left under RTL.
 */
async function columnGroupsInInlineOrder(bar: SheetsBarPage, isRtl: boolean) {
  return (await bar.switchGroups())
    .filter(group => group.pane === 'ht_master')
    .sort((first, second) => (isRtl ? second.right - first.right : first.left - second.left));
}

/**
 * Finds a pane of the running layer by its overlay class.
 */
async function switchPane(bar: SheetsBarPage, name: string) {
  const pane = (await bar.switchPanes()).find(entry => entry.pane === name);

  if (pane === undefined) {
    throw new Error(`No ${name} pane in the layer`);
  }

  return pane;
}

/**
 * Opens the pagination fixture like `openPaused()`, on a grid widened so the pagination bar
 * keeps one line on every sheet. At the fixture's own width the horizon bar wraps for one sheet
 * and not for the other, so the grid resizes after the switch, and a resize ends the swap at
 * once by design.
 */
async function openPaginationPaused(grid: SheetsBarPaginationPage): Promise<void> {
  await grid.page.clock.install();
  await grid.goto();
  await grid.page.clock.pauseAt(Date.now() + 60_000);
  await grid.sheetsBar.holdTransitions();
  await grid.page.evaluate(() => (window as never as { hot: any }).hot.updateSettings({ width: 900 }));
}

test.describe('sheets bar switch animation – order and direction', { tag: MOTION_TAG }, () => {
  for (const rtl of [false, true]) {
    test(`each column starts one stagger after the column before it in inline order${rtl ? ' under RTL' : ''}`, async ({
      page, theme, bundle,
    }) => {
      const bar = new SheetsBarPage(page, theme, bundle);

      await openPaused(bar, { large: true, rtl });
      await bar.clickTab(1);

      const { transition } = SPEC_TIMING[theme];
      const columns = await columnGroupsInInlineOrder(bar, rtl);
      const stagger = specStaggerMs(transition, columns.length);
      const headers = (await bar.switchGroups()).filter(group => group.pane === 'ht_clone_top');

      const arrivals = columns.map(group => (Number(group.in?.delay) - (transition * SPEC_IN_START_PART)) / stagger);

      expect(columns.length).toBeGreaterThan(3);
      expect(arrivals[0]).toBeCloseTo(0, 3);
      columns.forEach((group, index) => {
        expect(arrivals[index], `column ${index} in keeps a column's time`).toBeCloseTo(Math.round(arrivals[index]), 3);
        expect(arrivals[index], `column ${index} in`).toBeGreaterThanOrEqual(index - 0.001);
        expect(arrivals[index], `column ${index} in`).toBeLessThanOrEqual(columns.length - 1 + 0.001);
        expect(group.out?.delay, `column ${index} out`).toBeCloseTo(index * stagger, 3);
        expect(group.in?.duration).toBeCloseTo(transition * (1 - SPEC_IN_START_PART), 3);
        expect(group.out?.duration).toBeCloseTo(transition * SPEC_OUT_PART, 3);
      });
      expect(headers.length).toBeGreaterThan(0);
      headers.forEach((header) => {
        const column = columns.find(group => Math.abs(group.left - header.left) <= 1);

        expect(column, 'the header has the column of its cells').toBeDefined();
        expect(header.in?.delay).toBe(column?.in?.delay);
      });
    });
  }

  for (const large of [false, true]) {
    test(`a column never shows a leaving and an arriving copy at once, and no leaving copy overlaps an arriving one${large ? ' on a wide view' : ''}`, async ({
      page, theme, bundle,
    }) => {
      const bar = new SheetsBarPage(page, theme, bundle);

      await openPaused(bar, { large });
      await bar.clickTab(1);

      const run = await bar.swapOverlapsAcrossRun(40);

      expect(run.some(step => step.leavingShown > 0), 'some leaving copy shows').toBe(true);
      expect(run.some(step => step.arrivingShown > 0), 'some arriving copy shows').toBe(true);
      expect(run.some(step => step.leavingShown > 0 && step.arrivingShown > 0), 'the columns overlap in time').toBe(true);
      run.forEach(({ time, groupsShowingBoth, overlaps }) => {
        expect(groupsShowingBoth, `groups showing both sides at ${time.toFixed(1)} ms`).toBe(0);
        expect(overlaps, `overlapping copies at ${time.toFixed(1)} ms`).toEqual([]);
      });
    });
  }

  test('the leaving content moves up and fades out, and the arriving content rises from below', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.clickTab(1);

    const leavingStart = await bar.switchSideMotionAt('out', 0);
    const leavingMidway = await bar.switchSideMotionAt('out', 0.5);
    const arrivingStart = await bar.switchSideMotionAt('in', 0);
    const arrivingEnd = await bar.switchSideMotionAt('in', 1);

    expect(leavingStart.length).toBeGreaterThan(0);
    expect(arrivingStart.length).toBe(leavingStart.length);
    leavingStart.forEach(({ offsetY, opacity }) => {
      expect(offsetY).toBe(0);
      expect(opacity).toBe(1);
    });
    leavingMidway.forEach(({ offsetY, opacity }) => {
      expect(offsetY).toBeLessThan(0);
      expect(opacity).toBeGreaterThan(0);
      expect(opacity).toBeLessThan(1);
    });
    arrivingStart.forEach(({ offsetY, opacity }) => {
      expect(offsetY).toBeGreaterThan(0);
      expect(opacity).toBe(0);
    });
    arrivingEnd.forEach(({ offsetY, opacity }) => {
      expect(offsetY).toBe(0);
      expect(opacity).toBe(1);
    });
  });
});

test.describe('sheets bar switch animation – switch sources and layouts', { tag: MOTION_TAG }, () => {
  test('a switch from the keyboard swaps the content, with Enter and with Space', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.tab(1).focus();
    await page.keyboard.press('Enter');

    await bar.expectActiveTab(1);
    await expect(bar.switchLayer).toHaveCount(1);

    const first = await bar.switchLayerContent();

    expect(cellTexts(first.outBody)).toEqual(['A1', 'A2', 'A3', 'A4']);
    expect(cellTexts(first.inBody)).toEqual(['B1', 'B2', 'B3', 'B4']);

    await bar.tab(2).focus();
    await page.keyboard.press('Space');

    await bar.expectActiveTab(2);
    await expect(bar.switchLayer).toHaveCount(1);

    const second = await bar.switchLayerContent();

    expect(cellTexts(second.outBody)).toEqual(['B1', 'B2', 'B3', 'B4']);
    expect(cellTexts(second.inBody)).toEqual(['G1', 'G2', 'G3', 'G4']);
  });

  test('a switch from the all-sheets menu swaps the content', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.allButton.click();
    await bar.menuItem('Gamma').click();

    await bar.expectActiveTab(2);
    await expect(bar.switchLayer).toHaveCount(1);

    const layer = await bar.switchLayerContent();

    expect(cellTexts(layer.outBody)).toEqual(['A1', 'A2', 'A3', 'A4']);
    expect(cellTexts(layer.inBody)).toEqual(['G1', 'G2', 'G3', 'G4']);
  });

  test('a switch that changes the pagination page swaps the rows of the old page for the rows of the new one', async ({
    page, theme, bundle,
  }) => {
    const grid = new SheetsBarPaginationPage(page, theme, bundle);
    const bar = grid.sheetsBar;

    await openPaginationPaused(grid);
    await grid.goToPage(7, 20);
    await grid.switchToSheet(1);
    await grid.expectPage(1, 2);

    await expect(bar.switchLayer).toHaveCount(1);

    const master = await switchPane(bar, 'ht_master');
    const rowHeaders = await switchPane(bar, 'ht_clone_inline_start');

    expect(master.leaving.length).toBeGreaterThan(0);
    expect(master.leaving.every(text => /^Long row (6[1-9]|70)$/.test(text))).toBe(true);
    expect(master.leaving).toContain('Long row 61');
    expect(master.entering.length).toBe(master.leaving.length);
    expect(master.entering.every(text => /^Short row ([1-9]|10)$/.test(text))).toBe(true);
    expect(master.entering).toContain('Short row 1');
    expect(rowHeaders.leaving).toContain('61');
    expect(rowHeaders.entering).toContain('1');
  });

  test('a changed label on the upper level of nested headers swaps, and the unchanged lower level stays', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar, { nestedHeaders: true });
    await bar.clickTab(1);

    const layer = await bar.switchLayerContent();
    const headers = (await bar.switchGroups()).filter(group => group.pane === 'ht_clone_top');

    expect(layer.outHeaders).toEqual(['Group Alpha']);
    expect(layer.inHeaders).toEqual(['Group Beta']);
    expect(cellTexts(layer.inBody)).toEqual(['B1', 'B2', 'B3', 'B4']);
    expect(headers.map(group => group.in?.delay)).toEqual([SPEC_TIMING[theme].transition * SPEC_IN_START_PART]);
  });

  test('a merged cell swaps once, where the merged area draws its text', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar, { mergeCells: true });
    await page.evaluate(() => (window as never as { hot: any }).hot.getPlugin('mergeCells').merge(0, 0, 1, 0));
    await bar.clickTab(1);

    expect(cellTexts((await bar.switchLayerContent()).outBody)).toEqual(['A1', 'A2', 'A4']);

    await page.clock.runFor(60_000);
    await bar.clickTab(0);

    expect(cellTexts((await bar.switchLayerContent()).inBody)).toEqual(['A1', 'A2', 'A4']);

    const merged = (await bar.enteringTextPositions()).filter(({ text }) => text === 'A1');

    await expect(bar.cell(0, 0)).toHaveAttribute('rowspan', '2');
    expect(merged).toHaveLength(1);
    expect(Math.abs(merged[0].copy.top - merged[0].cell.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(merged[0].copy.left - merged[0].cell.left)).toBeLessThanOrEqual(1);
  });

  test('under RTL the content swaps and the copies over a frozen column are cut where the frozen pane starts', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar, { large: true, rtl: true, fixedColumnsStart: 2 });
    await bar.scrollGridTo(0, -25);
    await bar.clickTab(1);

    const master = await switchPane(bar, 'ht_master');
    const frozen = await switchPane(bar, 'ht_clone_inline_start');
    const rightmostCopy = await page.evaluate(() => Math.max(...Array.from(
      document.querySelectorAll('.ht-sheet-switch__pane[data-pane="ht_master"] .ht-sheet-switch__cell'),
    ).map(copy => copy.getBoundingClientRect().right)));

    expect(master.entering.length).toBeGreaterThan(0);
    expect(master.entering.every(text => /^B\d+-([2-9]|\d\d)$/.test(text))).toBe(true);
    expect(master.leaving.every(text => /^A\d+-([2-9]|\d\d)$/.test(text))).toBe(true);
    expect(frozen.entering.length).toBeGreaterThan(0);
    expect(frozen.entering.every(text => /^B\d+-[01]$/.test(text))).toBe(true);
    expect(Math.abs(frozen.box.left - (frozen.overlay?.left ?? Number.NaN))).toBeLessThanOrEqual(1);
    expect(Math.abs(master.box.right - frozen.box.left)).toBeLessThanOrEqual(1);
    expect(rightmostCopy).toBeGreaterThan(frozen.box.left + 1);
  });

  test('the copies of the frozen top rows swap in the top pane, and the master pane starts below them', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar, { large: true, fixedRowsTop: 2 });
    await bar.clickTab(1);

    const top = await switchPane(bar, 'ht_clone_top');
    const master = await switchPane(bar, 'ht_master');

    expect(top.entering).toContain('B0-0');
    expect(top.entering).toContain('B1-0');
    expect(top.entering.every(text => /^(B[01]-\d+|Col \d+( \(Beta\))?)$/.test(text))).toBe(true);
    expect(master.entering.length).toBeGreaterThan(0);
    expect(master.entering.some(text => /^B[01]-/.test(text))).toBe(false);
    expect(Math.abs(top.box.bottom - (top.overlay?.bottom ?? Number.NaN))).toBeLessThanOrEqual(1);
    expect(Math.abs(master.box.top - top.box.bottom)).toBeLessThanOrEqual(1);
  });

  test('a changed row header label swaps with the first column, and the unchanged ones stay', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar, { large: true, renamedRowHeader: true });
    await bar.clickTab(1);

    const rowHeaders = await switchPane(bar, 'ht_clone_inline_start');
    const groups = (await bar.switchGroups()).filter(group => group.pane === 'ht_clone_inline_start');

    expect(rowHeaders.leaving).toEqual(['2']);
    expect(rowHeaders.entering).toEqual(['II']);
    expect(groups.map(group => group.in?.delay)).toEqual([SPEC_TIMING[theme].transition * SPEC_IN_START_PART]);
  });
});

/**
 * Selects a range on the first sheet, moves to the second sheet and back, and leaves the page
 * clock right after the click that returns, while the swap runs over the restored selection.
 */
async function returnToSelectedSheet(bar: SheetsBarPage): Promise<void> {
  await bar.page.evaluate(() => (window as never as { hot: any }).hot.selectCell(0, 1, 1, 1));
  await bar.clickTab(1);
  await bar.clickTab(0);

  await expect(bar.switchLayer).toHaveCount(1);
  expect(await bar.selected()).toEqual([[0, 1, 1, 1]]);
}

/**
 * Runs the page clock past the content phase of a switch between the two columns of the default
 * fixture.
 */
async function runToReveal(bar: SheetsBarPage): Promise<void> {
  await bar.page.clock.runFor(Math.ceil(SPEC_TIMING[bar.theme].twoColumnContent) + 1);

  await expect(bar.switchLayer).toHaveCount(0);
  expect(await bar.switchState()).toBe('reveal');
}

test.describe('sheets bar switch animation – selection reveal', { tag: MOTION_TAG }, () => {
  test('the restored selection is hidden during the swap and shown after the reveal', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await returnToSelectedSheet(bar);

    const during = await bar.selectionMarkOpacities();

    expect(during.borders.length).toBeGreaterThan(0);
    expect(during.areaFills.length).toBe(2);
    expect(during.borders.every(value => value === '0')).toBe(true);
    expect(during.areaFills.every(value => value === '0')).toBe(true);

    await runToReveal(bar);
    await page.clock.runFor(SPEC_TIMING[theme].transition);
    await bar.finishGridAnimations();

    const after = await bar.selectionMarkOpacities();

    expect(await bar.switchState()).toBeNull();
    expect(after.borders.length).toBe(during.borders.length);
    expect(after.borders.every(value => value === '1')).toBe(true);
    expect(after.areaFills.every(value => Number(value) > 0)).toBe(true);
  });

  test('the reveal fades the header highlight in first and the selection after it', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await returnToSelectedSheet(bar);
    await runToReveal(bar);

    const reveal = await bar.revealTransitions(1);

    expect(reveal.headerDelays).toEqual([0]);
    expect(reveal.borderDelays.length).toBeGreaterThan(0);
    expect(reveal.borderDelays.every(delay => delay > 0)).toBe(true);
    expect(reveal.borderStart.every(value => value === '0')).toBe(true);
    expect(reveal.borderEnd.every(value => value === '1')).toBe(true);
  });

  test('the header of the restored selection is plain during the swap and highlighted after it', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await returnToSelectedSheet(bar);

    await expect(bar.columnHeader(1)).toHaveClass(/ht__highlight/);
    await expect(bar.columnHeader(0)).not.toHaveClass(/ht__highlight/);

    const plain = await bar.columnHeaderBackground(0);

    expect(await bar.columnHeaderBackground(1)).toBe(plain);

    await runToReveal(bar);
    await page.clock.runFor(SPEC_TIMING[theme].transition);
    await bar.finishGridAnimations();

    expect(await bar.switchState()).toBeNull();
    expect(await bar.columnHeaderBackground(1)).not.toBe(plain);
  });

  test('a custom border on the arriving sheet stays visible during the swap', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar, { customBorders: true });
    await page.evaluate(() => {
      const hot = (window as never as { hot: any }).hot;

      hot.addHook('afterSheetTabStateRestore', () => hot.getPlugin('customBorders').setBorders([[1, 0, 1, 0]], {
        top: { width: 2, color: 'red' },
        bottom: { width: 2, color: 'red' },
        start: { width: 2, color: 'red' },
        end: { width: 2, color: 'red' },
      }));
    });
    await returnToSelectedSheet(bar);

    const during = await bar.selectionMarkOpacities();

    expect(during.borders.every(value => value === '0')).toBe(true);
    expect(during.customBorders.length).toBeGreaterThanOrEqual(4);
    expect(during.customBorders.every(value => value === '1')).toBe(true);
  });
});

/**
 * Reads a sheet tab's computed font size, in pixels: the entrance offset is `2em` of it.
 */
async function tabFontSize(bar: SheetsBarPage, name: string): Promise<number> {
  return Number.parseFloat(await bar.tabByName(name).evaluate(tab => getComputedStyle(tab).fontSize));
}

test.describe('sheets bar switch animation – new tab entrance', { tag: MOTION_TAG }, () => {
  test('a tab added with "+" slides in from the inline start and keeps sliding through the switch', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);

    await expect(bar.bar.locator('.ht-sheets-bar__tab--entering')).toHaveCount(0);

    await bar.recordTabEntrances();
    await bar.addButton.click();

    const name = await bar.lastSheetName();
    const added = await bar.tabsAdded(name);

    expect(added.length).toBeGreaterThanOrEqual(2);
    expect(added.every(entry => entry.entering)).toBe(true);
    expect(await bar.tabEntrance(name)).toEqual({ entering: true, delay: '0ms' });
    expect((await bar.tabsAdded()).filter(entry => entry.name !== name).every(entry => !entry.entering)).toBe(true);

    const marker = await bar.indicatorBoxAt(1);
    const start = await bar.tabEntranceBoxAt(name, 0);
    const offset = 2 * (await tabFontSize(bar, name));

    expect(start.animations).toBe(1);
    expect(start.opacity).toBe(0);
    expect(Math.abs((start.restLeft - start.left) - offset)).toBeLessThanOrEqual(1);
    expectSameBox(marker, { left: start.restLeft, width: start.width });
  });

  test('the entrance class is removed once the transition has run', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);

    const { transition } = SPEC_TIMING[theme];

    await bar.addButton.click();

    const name = await bar.lastSheetName();

    await page.clock.runFor(Math.floor(transition) - 1);

    expect((await bar.tabEntrance(name)).entering).toBe(true);

    await page.clock.runFor(2);

    expect(await bar.tabEntrance(name)).toEqual({ entering: false, delay: '' });
  });

  test('a tab added through the API continues its slide on a later repaint', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.recordTabEntrances();
    await page.evaluate(() => (window as never as { hot: any }).hot.getPlugin('sheetsBar').addSheet('Delta'));

    expect(await bar.tabEntrance('Delta')).toEqual({ entering: true, delay: '0ms' });

    await page.clock.runFor(40);
    await page.evaluate(() => (window as never as { hot: any }).hot.getPlugin('sheetsBar').setActiveSheet('Delta'));

    const added = await bar.tabsAdded('Delta');

    expect(added).toHaveLength(2);
    expect(added[1]).toEqual({ name: 'Delta', entering: true, delay: '-40ms' });
    expect(await bar.tabEntrance('Delta')).toEqual({ entering: true, delay: '-40ms' });
  });

  test('a wrapper re-sending the same sheets keeps a new tab sliding in', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.addButton.click();

    const name = await bar.lastSheetName();

    await page.clock.runFor(40);
    await bar.resendSheetsSetting();

    await expect(bar.tabByName(name)).toHaveCount(1);
    expect(await bar.tabEntrance(name)).toEqual({ entering: true, delay: '-40ms' });
    await expect(bar.indicator).toHaveCount(1);

    const { transition } = SPEC_TIMING[theme];

    await page.clock.runFor(Math.ceil(transition) - 40 + 1);

    expect(await bar.tabEntrance(name)).toEqual({ entering: false, delay: '' });
  });

  for (const rtl of [false, true]) {
    test(`ten "+" presses leave the last new tab fully in view${rtl ? ' under RTL' : ''}`, async ({
      page, theme, bundle,
    }) => {
      const bar = new SheetsBarPage(page, theme, bundle);

      await openPaused(bar, { rtl });

      for (let i = 0; i < 10; i += 1) {
        await bar.addButton.click();
      }

      const name = await bar.lastSheetName();

      expect((await bar.tabEntrance(name)).entering).toBe(true);
      await expect.poll(async () => {
        const { travelled, total } = await bar.stripScroll();

        return total > 0 && Math.abs(travelled - total) <= 1;
      }).toBe(true);
      await expect(bar.pageNext).toHaveAttribute('aria-disabled', 'true');
    });
  }

  test('a duplicated sheet\'s tab slides in', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);

    const { transition } = SPEC_TIMING[theme];

    await bar.chevron(0).click();
    await bar.menuItem('Duplicate').click();

    await expect(bar.tabByName('Alpha (2)')).toBeVisible();
    expect((await bar.tabEntrance('Alpha (2)')).entering).toBe(true);
    expect((await bar.tabEntrance('Alpha')).entering).toBe(false);

    await page.clock.runFor(Math.ceil(transition) + 1);

    expect((await bar.tabEntrance('Alpha (2)')).entering).toBe(false);
  });

  test('a workbook rebuild slides no tab in', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.recordTabEntrances();
    await page.evaluate(() => (window as never as { hot: any }).hot.updateSettings({
      sheetsBar: { sheets: [{ name: 'One', data: [['1']] }, { name: 'Two', data: [['2']] }] },
    }));

    await expect(bar.tabByName('Two')).toBeVisible();
    expect((await bar.tabsAdded()).length).toBeGreaterThanOrEqual(2);
    expect((await bar.tabsAdded()).every(entry => !entry.entering)).toBe(true);
  });

  test('under RTL a new tab slides in from the right', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar, { rtl: true });
    await bar.recordTabEntrances();
    await bar.addButton.click();

    const name = await bar.lastSheetName();
    const marker = await bar.indicatorBoxAt(1);
    const start = await bar.tabEntranceBoxAt(name, 0);
    const offset = 2 * (await tabFontSize(bar, name));

    expect(start.animations).toBe(1);
    expect(Math.abs((start.left - start.restLeft) - offset)).toBeLessThanOrEqual(1);
    expectSameBox(marker, { left: start.restLeft, width: start.width });
  });

  test('a tab dragged mid-entrance stays under the pointer and reorders', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.recordTabEntrances();
    await bar.addButton.click();

    const name = await bar.lastSheetName();
    const start = await bar.tabEntranceBoxAt(name, 0);
    const box = await bar.tabByName(name).boundingBox();
    const first = await bar.tabBox(0);

    if (box === null) {
      throw new Error('The new tab is not rendered');
    }

    const y = box.y + (box.height / 2);
    const x = start.left + (start.width / 2);

    expect(start.restLeft - start.left).toBeGreaterThan(10);

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 30, y, { steps: 2 });

    await expect(bar.tabByName(name)).toHaveClass(/ht-sheets-bar__tab--dragging/);
    expect((await bar.tabEntrance(name)).entering).toBe(false);
    expect(Math.abs((await bar.tabBox(3)).left - (start.restLeft - 30))).toBeLessThanOrEqual(1);

    await page.mouse.move(first.left + 5, y, { steps: 4 });
    await page.mouse.up();

    await expect.poll(() => page.evaluate(() => Array.from(
      document.querySelectorAll('.ht-sheets-bar__tab-label'),
    ).map(label => label.textContent))).toEqual([name, 'Alpha', 'Beta', 'Gamma']);
  });

  test('reduced motion never slides a new tab in', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await bar.goto();
    await bar.recordTabEntrances();
    await bar.addButton.click();
    await page.evaluate(() => (window as never as { hot: any }).hot.getPlugin('sheetsBar').addSheet('Delta'));
    await bar.tab(0).click({ button: 'right' });
    await bar.menuItem('Duplicate').click();

    await expect(bar.tabByName('Alpha (2)')).toBeVisible();
    expect((await bar.tabsAdded('Delta')).length).toBeGreaterThan(0);
    expect((await bar.tabsAdded()).every(entry => !entry.entering)).toBe(true);
  });
});

test.describe('sheets bar switch animation – classic theme', () => {
  test('the classic theme never shows the marker', async ({ page, bundle }) => {
    const bar = new SheetsBarPage(page, 'classic', bundle);

    await bar.goto();
    await bar.recordIndicators();
    await bar.clickTab(1);
    await bar.clickTab(2);

    await bar.expectActiveTab(2);
    expect(await bar.indicatorsAdded()).toBe(0);
  });

  test('the classic theme never draws the layer or sets a switch state', async ({ page, bundle }) => {
    const bar = new SheetsBarPage(page, 'classic', bundle);

    await bar.goto();
    await bar.recordSwitchLayers();
    await bar.clickTab(1);
    await bar.clickTab(2);

    await bar.expectActiveTab(2);
    expect(await bar.switchLayerRecord()).toEqual({ added: 0, maxAtOnce: 0, stateSeen: false });
  });

  test('the classic theme never slides a new tab in', async ({ page, bundle }) => {
    const bar = new SheetsBarPage(page, 'classic', bundle);

    await bar.goto();
    await bar.recordTabEntrances();
    await bar.addButton.click();
    await page.evaluate(() => (window as never as { hot: any }).hot.getPlugin('sheetsBar').addSheet('Delta'));
    await bar.tab(0).click({ button: 'right' });
    await bar.menuItem('Duplicate').click();

    await expect(bar.tabByName('Alpha (2)')).toBeVisible();
    expect((await bar.tabsAdded('Delta')).length).toBeGreaterThan(0);
    expect((await bar.tabsAdded()).every(entry => !entry.entering)).toBe(true);
  });
});
