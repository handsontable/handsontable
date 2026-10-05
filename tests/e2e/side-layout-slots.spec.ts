import { test, expect } from '../fixtures/test';
import {
  SideLayoutSlotsPage, type Box, type SideSlotGeometry,
} from '../fixtures/pages/SideLayoutSlotsPage';

/**
 * The `start` and `end` layout slots dock UI at the grid's inline edges. A panel spans the whole
 * root wrapper height (the `top` and `bottom` slots included), the grid takes the remaining width,
 * and under `layoutDirection: 'rtl'` the two sides swap.
 */
const near = (actual: number, expected: number): boolean => Math.abs(actual - expected) <= 1;

/**
 * Asserts two edges or lengths match within one pixel, naming both values on failure.
 */
function expectNear(actual: number, expected: number): void {
  expect(actual).toBeGreaterThanOrEqual(expected - 1);
  expect(actual).toBeLessThanOrEqual(expected + 1);
}

const START_WIDTH = 160;
const END_WIDTH = 120;

/**
 * Whether two boxes share all four edges within one pixel.
 */
function sameEdges(a: Box, b: Box): boolean {
  return near(a.left, b.left) && near(a.right, b.right) && near(a.top, b.top) && near(a.bottom, b.bottom);
}

/**
 * Whether two boxes share any area.
 */
function overlaps(a: Box, b: Box): boolean {
  return Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
    && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
}

/**
 * The one panel registered into a side slot.
 */
function onlyPanel(panels: Box[]): Box {
  expect(panels).toHaveLength(1);

  return panels[0];
}

test.describe('side layout slots', () => {
  let grid: SideLayoutSlotsPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new SideLayoutSlotsPage(page, theme, bundle);
    await grid.goto();
  });

  test('docks a start panel at the wrapper\'s left edge, spanning the full height', async () => {
    await grid.addPanel('start', 'nav', START_WIDTH);

    const geometry = await grid.geometry();
    const panel = onlyPanel(geometry.startPanels);

    expect(geometry.wrapperClasses).toContain('ht-slot-start-filled');
    expect(geometry.wrapperClasses).not.toContain('ht-slot-end-filled');
    expectNear(panel.left, geometry.wrapper.left);
    expectNear(panel.right, geometry.grid.left);
    expectNear(panel.top, geometry.wrapper.top);
    expectNear(panel.height, geometry.wrapper.height);
    expectNear(geometry.grid.right, geometry.wrapper.right);
  });

  test('docks an end panel at the wrapper\'s right edge, spanning the full height', async () => {
    await grid.addPanel('end', 'details', END_WIDTH);

    const geometry = await grid.geometry();
    const panel = onlyPanel(geometry.endPanels);

    expect(geometry.wrapperClasses).toContain('ht-slot-end-filled');
    expect(geometry.wrapperClasses).not.toContain('ht-slot-start-filled');
    expectNear(panel.right, geometry.wrapper.right);
    expectNear(panel.left, geometry.grid.right);
    expectNear(panel.top, geometry.wrapper.top);
    expectNear(panel.height, geometry.wrapper.height);
    expectNear(geometry.grid.left, geometry.wrapper.left);
  });

  test('gives the grid the wrapper width minus both panels', async () => {
    await grid.addPanel('start', 'nav', START_WIDTH);
    await grid.addPanel('end', 'details', END_WIDTH);

    const geometry = await grid.geometry();
    const start = onlyPanel(geometry.startPanels);
    const end = onlyPanel(geometry.endPanels);

    expectNear(start.left, geometry.wrapper.left);
    expectNear(end.right, geometry.wrapper.right);
    expectNear(geometry.grid.left, start.right);
    expectNear(geometry.grid.right, end.left);
    expectNear(geometry.grid.width, geometry.wrapper.width - start.width - end.width);
    expectNear(start.height, geometry.wrapper.height);
    expectNear(end.height, geometry.wrapper.height);
  });

  test('swaps the sides under RTL: start on the right, end on the left', async () => {
    await grid.rebuild({ overrides: { layoutDirection: 'rtl' } });
    await grid.addPanel('start', 'nav', START_WIDTH);
    await grid.addPanel('end', 'details', END_WIDTH);

    const geometry = await grid.geometry();
    const start = onlyPanel(geometry.startPanels);
    const end = onlyPanel(geometry.endPanels);

    expectNear(start.right, geometry.wrapper.right);
    expectNear(start.left, geometry.grid.right);
    expectNear(end.left, geometry.wrapper.left);
    expectNear(end.right, geometry.grid.left);
    expectNear(start.height, geometry.wrapper.height);
    expectNear(end.height, geometry.wrapper.height);
  });

  test('gives the width back to the grid when the panel unregisters', async () => {
    const initial = await grid.geometry();

    await grid.addPanel('start', 'nav', START_WIDTH);

    const docked = await grid.geometry();

    expect(docked.grid.width).toBeLessThan(initial.grid.width - START_WIDTH + 1);

    await grid.removePanel('start', 'nav');

    const geometry = await grid.geometry();

    expect(geometry.startPanels).toHaveLength(0);
    expect(geometry.wrapperClasses).not.toContain('ht-slot-start-filled');
    expectNear(geometry.grid.left, geometry.wrapper.left);
    expectNear(geometry.grid.width, geometry.wrapper.width);
  });

  test('keeps a wide grid scrolling inside its track with both panels in view', async () => {
    const lastColumn = 39;

    await grid.rebuild({ cols: lastColumn + 1 });
    await grid.addPanel('start', 'nav', START_WIDTH);
    await grid.addPanel('end', 'details', END_WIDTH);

    await expect.poll(async () => {
      const { holder, grid: gridBox } = await grid.geometry();

      return near(holder.left, gridBox.left) && near(holder.right, gridBox.right);
    }).toBe(true);

    await grid.scrollHolderToInlineEnd(lastColumn);

    const geometry = await grid.geometry();
    const start = onlyPanel(geometry.startPanels);
    const end = onlyPanel(geometry.endPanels);

    expect(geometry.holderScrollWidth).toBeGreaterThan(geometry.holderClientWidth);
    expectNear(start.left, geometry.wrapper.left);
    expectNear(end.right, geometry.wrapper.right);
    expectNear(start.width, START_WIDTH);
    expectNear(end.width, END_WIDTH);
    expect(geometry.holder.left).toBeGreaterThanOrEqual(start.right - 1);
    expect(geometry.holder.right).toBeLessThanOrEqual(end.left + 1);
  });

  test('keeps the pagination bar under the grid only, beside the full-height panel', async () => {
    await grid.rebuild({ overrides: { pagination: { pageSize: 20 } } });
    await grid.addPanel('start', 'nav', START_WIDTH);

    const geometry = await grid.geometry();
    const panel = onlyPanel(geometry.startPanels);

    expect(geometry.paginationBar).not.toBeNull();

    const bar = geometry.paginationBar!;

    expectNear(bar.left, geometry.grid.left);
    expect(bar.left).toBeGreaterThanOrEqual(panel.right - 1);
    expect(bar.top).toBeGreaterThanOrEqual(geometry.grid.bottom - 1);
    expectNear(panel.top, geometry.wrapper.top);
    expectNear(panel.bottom, bar.bottom);
    expectNear(panel.height, geometry.wrapper.height);
  });

  test.describe('the `width` option sizes the whole component, side panels included', () => {
    const FIXED_WIDTH = 600;
    const CONTAINER_WIDTH = 720;

    test('fits start panel, grid, and end panel into a pixel width', async () => {
      await grid.rebuild({ overrides: { width: FIXED_WIDTH } });
      await grid.addPanel('start', 'nav', START_WIDTH);
      await grid.addPanel('end', 'details', END_WIDTH);
      await grid.waitForRootWidth(FIXED_WIDTH - START_WIDTH - END_WIDTH);

      const geometry = await grid.geometry();
      const start = onlyPanel(geometry.startPanels);
      const end = onlyPanel(geometry.endPanels);

      expect(geometry.wrapperClasses).toContain('ht-grid-fixed-width');
      expectNear(start.left, geometry.wrapper.left);
      expectNear(geometry.root.left, start.right);
      expectNear(end.left, geometry.root.right);
      expectNear(end.right, start.left + FIXED_WIDTH);
      expectNear(geometry.root.width, FIXED_WIDTH - START_WIDTH - END_WIDTH);
      expectNear(end.height, geometry.wrapper.height);
    });

    test('hugs the start edge with an end panel only', async () => {
      await grid.rebuild({ overrides: { width: FIXED_WIDTH } });
      await grid.addPanel('end', 'details', END_WIDTH);
      await grid.waitForRootWidth(FIXED_WIDTH - END_WIDTH);

      const geometry = await grid.geometry();
      const panel = onlyPanel(geometry.endPanels);

      expect(geometry.wrapperClasses).toContain('ht-grid-fixed-width');
      expectNear(geometry.root.left, geometry.wrapper.left);
      expectNear(panel.left, geometry.root.right);
      expectNear(panel.right, geometry.wrapper.left + FIXED_WIDTH);
      expect(panel.right).toBeLessThan(geometry.wrapper.right - 1);
    });

    test('hugs the start edge with an end panel only under RTL', async () => {
      await grid.rebuild({ overrides: { width: FIXED_WIDTH, layoutDirection: 'rtl' } });
      await grid.addPanel('end', 'details', END_WIDTH);
      await grid.waitForRootWidth(FIXED_WIDTH - END_WIDTH);

      const geometry = await grid.geometry();
      const panel = onlyPanel(geometry.endPanels);

      expect(geometry.wrapperClasses).toContain('ht-grid-fixed-width');
      expectNear(geometry.root.right, geometry.wrapper.right);
      expectNear(panel.right, geometry.root.left);
      expectNear(panel.left, geometry.wrapper.right - FIXED_WIDTH);
      expect(panel.left).toBeGreaterThan(geometry.wrapper.left + 1);
    });

    test('gives the grid the container width minus both panels for `100%`', async () => {
      await grid.addPanel('start', 'nav', START_WIDTH);
      await grid.addPanel('end', 'details', END_WIDTH);
      await grid.waitForRootWidth(CONTAINER_WIDTH - START_WIDTH - END_WIDTH);

      const geometry = await grid.geometry();
      const start = onlyPanel(geometry.startPanels);
      const end = onlyPanel(geometry.endPanels);

      expect(geometry.wrapperClasses).not.toContain('ht-grid-fixed-width');
      expectNear(geometry.container.width, CONTAINER_WIDTH);
      expectNear(geometry.wrapper.width, geometry.container.width);
      expectNear(start.left, geometry.container.left);
      expectNear(end.right, geometry.container.right);
      expectNear(geometry.root.width, geometry.wrapper.width - START_WIDTH - END_WIDTH);
    });

    test('sizes the whole block to a percentage of the container', async () => {
      await grid.rebuild({ overrides: { width: '50%' } });
      await grid.addPanel('start', 'nav', START_WIDTH);
      await grid.waitForRootWidth((CONTAINER_WIDTH / 2) - START_WIDTH);

      const geometry = await grid.geometry();
      const start = onlyPanel(geometry.startPanels);

      expect(geometry.wrapperClasses).not.toContain('ht-grid-fixed-width');
      expectNear(geometry.container.width, CONTAINER_WIDTH);
      expectNear(geometry.wrapper.width, geometry.container.width / 2);
      expectNear(start.left, geometry.wrapper.left);
      expectNear(geometry.root.left, start.right);
      expectNear(geometry.root.right, geometry.wrapper.right);
      expectNear(geometry.root.width, geometry.wrapper.width - START_WIDTH);
    });

    test('follows a side panel resized at runtime', async () => {
      const resizedEndWidth = 60;

      await grid.rebuild({ overrides: { width: FIXED_WIDTH } });
      await grid.addPanel('start', 'nav', START_WIDTH);
      await grid.addPanel('end', 'details', END_WIDTH);
      await grid.waitForRootWidth(FIXED_WIDTH - START_WIDTH - END_WIDTH);
      await grid.resizePanel('details', resizedEndWidth);
      await grid.waitForRootWidth(FIXED_WIDTH - START_WIDTH - resizedEndWidth);

      const geometry = await grid.geometry();
      const start = onlyPanel(geometry.startPanels);
      const end = onlyPanel(geometry.endPanels);

      expectNear(end.width, resizedEndWidth);
      expectNear(end.left, geometry.root.right);
      expectNear(end.right, start.left + FIXED_WIDTH);
    });

    test('gives the whole width back to the grid when the panel unregisters', async () => {
      await grid.rebuild({ overrides: { width: FIXED_WIDTH } });
      await grid.addPanel('start', 'nav', START_WIDTH);
      await grid.waitForRootWidth(FIXED_WIDTH - START_WIDTH);
      await grid.removePanel('start', 'nav');
      await grid.waitForRootWidth(FIXED_WIDTH);

      const geometry = await grid.geometry();

      expect(geometry.rootInlineWidth).toBe(`${FIXED_WIDTH}px`);
      expect(geometry.wrapperInlineWidth).toBe('');
      expectNear(geometry.root.left, geometry.wrapper.left);
    });

    test('drops the class and fills the track again when `width` becomes a percentage', async () => {
      await grid.rebuild({ overrides: { width: FIXED_WIDTH } });
      await grid.addPanel('end', 'details', END_WIDTH);
      await grid.waitForRootWidth(FIXED_WIDTH - END_WIDTH);
      await grid.updateSettings({ width: '100%' });
      await grid.waitForRootWidth(CONTAINER_WIDTH - END_WIDTH);

      const geometry = await grid.geometry();
      const panel = onlyPanel(geometry.endPanels);

      expect(geometry.wrapperClasses).not.toContain('ht-grid-fixed-width');
      expectNear(panel.right, geometry.wrapper.right);
      expectNear(geometry.grid.right, panel.left);
      expectNear(geometry.root.right, panel.left);
      expectNear(geometry.root.width, geometry.wrapper.width - END_WIDTH);
    });

    test('clears both inline widths and fills the track for `width: null`', async () => {
      await grid.rebuild({ overrides: { width: '50%' } });
      await grid.addPanel('start', 'nav', START_WIDTH);
      await grid.waitForRootWidth((CONTAINER_WIDTH / 2) - START_WIDTH);
      await grid.updateSettings({ width: null });
      await grid.waitForRootWidth(CONTAINER_WIDTH - START_WIDTH);

      const geometry = await grid.geometry();
      const start = onlyPanel(geometry.startPanels);

      expect(geometry.rootInlineWidth).toBe('');
      expect(geometry.wrapperInlineWidth).toBe('');
      expect(geometry.wrapperClasses).not.toContain('ht-grid-fixed-width');
      expectNear(geometry.wrapper.width, geometry.container.width);
      expectNear(geometry.root.left, start.right);
      expectNear(geometry.root.width, geometry.wrapper.width - START_WIDTH);
    });
  });

  test.describe('pointer access to slot content', () => {
    test('lets a plain top-slot button take a real click with no side slot in use', async () => {
      await grid.addTopButton('toolbar');

      expect(await grid.isTopmostAtCenter('toolbar')).toBe(true);

      await grid.button('toolbar').click();

      await expect.poll(() => grid.clickCount('toolbar')).toBe(1);
      expect((await grid.geometry()).overlayLayer.height).toBe(0);
    });

    test('lets plain buttons in the top slot and in a start panel take real clicks', async () => {
      await grid.addPanel('start', 'nav', START_WIDTH);
      await grid.addPanelButton('nav', 'navAction');
      await grid.addTopButton('toolbar');

      expect(await grid.isTopmostAtCenter('toolbar')).toBe(true);
      expect(await grid.isTopmostAtCenter('navAction')).toBe(true);

      await grid.button('toolbar').click();
      await grid.button('navAction').click();

      await expect.poll(() => grid.clickCount('toolbar')).toBe(1);
      await expect.poll(() => grid.clickCount('navAction')).toBe(1);
      expect((await grid.geometry()).overlayLayer.height).toBe(0);
    });
  });

  test('keeps an explicit pixel height with a tall start panel scrolling inside it', async () => {
    const height = 300;

    await grid.rebuild({ overrides: { height, pagination: { pageSize: 20 } }, containerHeight: 'auto' });
    await grid.addTallPanel('start', 'outline', START_WIDTH, 1000);

    const geometry = await grid.geometry();
    const panel = onlyPanel(geometry.startPanels);

    expect(geometry.paginationBar).not.toBeNull();
    expectNear(geometry.wrapper.height, height);
    expectNear(panel.top, geometry.wrapper.top);
    expectNear(panel.height, geometry.wrapper.height);
    expectNear(geometry.paginationBar!.bottom, geometry.wrapper.bottom);
    expect(geometry.startPanelScrollHeight).toBeGreaterThan(geometry.startPanelClientHeight);
  });

  test.describe('the dialog', () => {
    /**
     * Reads the geometry once the dialog's width has caught up with the side panels.
     */
    async function geometryWhenDialogMatches(
      page: SideLayoutSlotsPage,
      target: (geometry: SideSlotGeometry) => Box,
    ): Promise<SideSlotGeometry> {
      await expect.poll(async () => {
        const geometry = await page.geometry();

        return geometry.dialog !== null && sameEdges(geometry.dialog, target(geometry));
      }).toBe(true);

      return page.geometry();
    }

    for (const layoutDirection of ['ltr', 'rtl'] as const) {
      test(`covers the whole wrapper with both side panels (${layoutDirection})`, async () => {
        await grid.rebuild({ overrides: { layoutDirection, dialog: { animation: false } } });
        await grid.addPanel('start', 'nav', START_WIDTH);
        await grid.addPanel('end', 'details', END_WIDTH);
        await grid.showDialog();

        const geometry = await geometryWhenDialogMatches(grid, g => g.wrapper);
        const dialog = geometry.dialog!;

        expectNear(dialog.left, geometry.wrapper.left);
        expectNear(dialog.right, geometry.wrapper.right);
        expectNear(dialog.top, geometry.wrapper.top);
        expectNear(dialog.bottom, geometry.wrapper.bottom);
      });
    }

    test('spans from the start panel to the end panel of a fixed-width component', async () => {
      const width = 600;

      await grid.rebuild({ overrides: { width, dialog: { animation: false } } });
      await grid.addPanel('start', 'nav', START_WIDTH);
      await grid.addPanel('end', 'details', END_WIDTH);
      await grid.waitForRootWidth(width - START_WIDTH - END_WIDTH);
      await grid.showDialog();

      const geometry = await geometryWhenDialogMatches(grid, g => ({
        ...g.wrapper,
        left: g.startPanels[0]?.left ?? NaN,
        right: g.endPanels[0]?.right ?? NaN,
      }));
      const dialog = geometry.dialog!;
      const start = onlyPanel(geometry.startPanels);
      const end = onlyPanel(geometry.endPanels);

      expect(geometry.wrapperClasses).toContain('ht-grid-fixed-width');
      expectNear(dialog.left, start.left);
      expectNear(dialog.right, end.right);
      expectNear(dialog.width, width);
      expectNear(end.left, geometry.root.right);
    });
  });

  test.describe('when the window owns horizontal scrolling', () => {
    const COLS = 20;
    const LAST_COLUMN = COLS - 1;
    const windowScroll = { cols: COLS, containerHeight: 'auto', sizeOptions: 'unset' } as const;

    test('docks the end panel after the table\'s last column, reachable by scrolling the page', async () => {
      await grid.rebuild(windowScroll);
      await grid.addPanel('end', 'details', END_WIDTH);

      const geometry = await grid.geometry();
      const panel = onlyPanel(geometry.endPanels);

      expect(geometry.wrapperClasses).toContain('ht-grid-width-follows-content');
      expect(geometry.table.width).toBeGreaterThan(geometry.wrapper.width);
      expectNear(panel.left, geometry.root.right);
      expectNear(panel.left, geometry.table.right);
      expect(overlaps(panel, geometry.table)).toBe(false);
      expect(geometry.documentScrollWidth).toBeGreaterThan(geometry.documentClientWidth);

      await grid.scrollWindowToInlineEnd(LAST_COLUMN);

      const scrolled = await grid.geometry();
      const scrolledPanel = onlyPanel(scrolled.endPanels);

      expect(scrolledPanel.left).toBeGreaterThanOrEqual(0);
      expect(scrolledPanel.right).toBeLessThanOrEqual(scrolled.documentClientWidth + 1);
      expect(overlaps(scrolledPanel, scrolled.table)).toBe(false);
    });

    test('docks the end panel after the table\'s last column under RTL', async () => {
      await grid.rebuild({ ...windowScroll, documentDir: 'rtl', overrides: { layoutDirection: 'rtl' } });
      await grid.addPanel('end', 'details', END_WIDTH);

      const geometry = await grid.geometry();
      const panel = onlyPanel(geometry.endPanels);

      expect(geometry.wrapperClasses).toContain('ht-grid-width-follows-content');
      expect(geometry.table.width).toBeGreaterThan(geometry.wrapper.width);
      expectNear(panel.right, geometry.root.left);
      expectNear(panel.right, geometry.table.left);
      expect(overlaps(panel, geometry.table)).toBe(false);
      expect(geometry.documentScrollWidth).toBeGreaterThan(geometry.documentClientWidth);
    });

    test('keeps the grid spanning the wrapper when no side slot is filled (control)', async () => {
      await grid.rebuild(windowScroll);

      const geometry = await grid.geometry();

      expect(geometry.wrapperClasses).not.toContain('ht-slot-start-filled');
      expect(geometry.wrapperClasses).not.toContain('ht-slot-end-filled');
      expect(geometry.table.width).toBeGreaterThan(geometry.wrapper.width);
      expectNear(geometry.grid.left, geometry.wrapper.left);
      expectNear(geometry.grid.width, geometry.wrapper.width);
    });
  });

  test.describe('several panels in one side slot', () => {
    const FIRST_WIDTH = 100;
    const SECOND_WIDTH = 140;

    test('lines start panels up from the outer edge to the grid in weight order', async () => {
      await grid.addWeightedPanel('start', 'second', SECOND_WIDTH, 200);
      await grid.addWeightedPanel('start', 'first', FIRST_WIDTH, 100);

      const geometry = await grid.geometry();
      const [first, second] = geometry.startPanels;

      expect(geometry.startPanels).toHaveLength(2);
      expectNear(first.width, FIRST_WIDTH);
      expectNear(second.width, SECOND_WIDTH);
      expectNear(first.left, geometry.wrapper.left);
      expectNear(second.left, first.right);
      expectNear(geometry.grid.left, second.right);
      expectNear(first.height, geometry.wrapper.height);
      expectNear(second.height, geometry.wrapper.height);
      expectNear(geometry.grid.width, geometry.wrapper.width - FIRST_WIDTH - SECOND_WIDTH);
    });

    test('lines end panels up from the grid to the outer edge in weight order', async () => {
      await grid.addWeightedPanel('end', 'second', SECOND_WIDTH, 200);
      await grid.addWeightedPanel('end', 'first', FIRST_WIDTH, 100);

      const geometry = await grid.geometry();
      const [first, second] = geometry.endPanels;

      expect(geometry.endPanels).toHaveLength(2);
      expectNear(first.width, FIRST_WIDTH);
      expectNear(second.width, SECOND_WIDTH);
      expectNear(first.left, geometry.grid.right);
      expectNear(second.left, first.right);
      expectNear(second.right, geometry.wrapper.right);
      expectNear(first.height, geometry.wrapper.height);
      expectNear(second.height, geometry.wrapper.height);
    });

    test('mirrors the start panel line-up under RTL', async () => {
      await grid.rebuild({ overrides: { layoutDirection: 'rtl' } });
      await grid.addWeightedPanel('start', 'second', SECOND_WIDTH, 200);
      await grid.addWeightedPanel('start', 'first', FIRST_WIDTH, 100);

      const geometry = await grid.geometry();
      const [first, second] = geometry.startPanels;

      expect(geometry.startPanels).toHaveLength(2);
      expectNear(first.width, FIRST_WIDTH);
      expectNear(first.right, geometry.wrapper.right);
      expectNear(second.right, first.left);
      expectNear(geometry.grid.right, second.left);
      expectNear(first.height, geometry.wrapper.height);
      expectNear(second.height, geometry.wrapper.height);
      expectNear(geometry.grid.width, geometry.wrapper.width - FIRST_WIDTH - SECOND_WIDTH);
    });

    test('reorders the start panels from the `layout` setting', async () => {
      await grid.addWeightedPanel('start', 'first', FIRST_WIDTH, 100);
      await grid.addWeightedPanel('start', 'second', SECOND_WIDTH, 200);
      await grid.updateSettings({ layout: { start: ['second', 'first'] } });

      const geometry = await grid.geometry();
      const [outer, inner] = geometry.startPanels;

      expect(geometry.startPanels).toHaveLength(2);
      expectNear(outer.width, SECOND_WIDTH);
      expectNear(inner.width, FIRST_WIDTH);
      expectNear(outer.left, geometry.wrapper.left);
      expectNear(inner.left, outer.right);
      expectNear(geometry.grid.left, inner.right);
    });

    test('fits two start panels, the grid, and an end panel into a pixel width', async () => {
      const width = 680;

      await grid.rebuild({ overrides: { width } });
      await grid.addWeightedPanel('start', 'first', FIRST_WIDTH, 100);
      await grid.addWeightedPanel('start', 'second', SECOND_WIDTH, 200);
      await grid.addPanel('end', 'details', END_WIDTH);
      await grid.waitForRootWidth(width - FIRST_WIDTH - SECOND_WIDTH - END_WIDTH);

      const geometry = await grid.geometry();
      const [first, second] = geometry.startPanels;
      const end = onlyPanel(geometry.endPanels);

      expect(geometry.wrapperClasses).toContain('ht-grid-fixed-width');
      expectNear(first.left, geometry.wrapper.left);
      expectNear(second.left, first.right);
      expectNear(geometry.root.left, second.right);
      expectNear(end.left, geometry.root.right);
      expectNear(end.right, first.left + width);
    });
  });

  test.describe('review follow-ups', () => {
    const windowScroll = { containerHeight: 'auto', sizeOptions: 'unset' } as const;

    test('lets a narrow window-scrolled table stretch between the panels and follow the container', async () => {
      await grid.rebuild({ ...windowScroll, cols: 4, overrides: { stretchH: 'all' } });
      await grid.addPanel('start', 'nav', START_WIDTH);

      await expect.poll(async () => {
        const { root, wrapper } = await grid.geometry();

        return near(root.right, wrapper.right);
      }).toBe(true);

      const geometry = await grid.geometry();
      const panel = onlyPanel(geometry.startPanels);

      expect(geometry.wrapperClasses).not.toContain('ht-grid-width-follows-content');
      expectNear(geometry.grid.left, panel.right);
      expectNear(geometry.grid.right, geometry.wrapper.right);
      expectNear(geometry.table.width, geometry.wrapper.width - START_WIDTH);

      await grid.resizeContainer(600);

      await expect.poll(async () => {
        const { root, wrapper, table } = await grid.geometry();

        return near(wrapper.width, 600) && near(root.right, wrapper.right) && near(table.width, 600 - START_WIDTH);
      }).toBe(true);

      expect((await grid.geometry()).wrapperClasses).not.toContain('ht-grid-width-follows-content');
    });

    test('stretches the bottom bar of a wide window-scrolled table up to the end panel', async () => {
      await grid.rebuild({ ...windowScroll, cols: 20, overrides: { pagination: { pageSize: 20 } } });
      await grid.addPanel('start', 'nav', START_WIDTH);
      await grid.addPanel('end', 'details', END_WIDTH);

      await expect.poll(async () => {
        const { bottomSlot, endPanels } = await grid.geometry();

        return endPanels.length === 1 && near(bottomSlot.right, endPanels[0].left);
      }).toBe(true);

      const geometry = await grid.geometry();
      const start = onlyPanel(geometry.startPanels);
      const end = onlyPanel(geometry.endPanels);

      expect(geometry.wrapperClasses).toContain('ht-grid-width-follows-content');
      expect(geometry.paginationBar).not.toBeNull();
      expectNear(geometry.bottomSlot.left, start.right);
      expectNear(geometry.bottomSlot.right, end.left);
      expectNear(end.left, geometry.table.right);
    });

    test('lets a panel\'s own CSS class set its width', async () => {
      await grid.addClassPanel('start', 'wide', 'side-panel-wide');

      const geometry = await grid.geometry();
      const panel = onlyPanel(geometry.startPanels);

      expectNear(panel.width, 280);
      expectNear(panel.left, geometry.wrapper.left);
      expectNear(geometry.grid.left, panel.right);
    });

    test('keeps the grid spanning the wrapper for a pixel width without side panels (control)', async () => {
      await grid.rebuild({ overrides: { width: 500 } });

      const geometry = await grid.geometry();

      expect(geometry.wrapperClasses).toContain('ht-grid-fixed-width');
      expectNear(geometry.root.width, 500);
      expectNear(geometry.grid.left, geometry.wrapper.left);
      expectNear(geometry.grid.width, geometry.wrapper.width);
    });

    test('covers both side panels with the license lock screen', async () => {
      await grid.gotoWithExpiredTrial();
      await expect(grid.lock()).toBeVisible();
      await grid.addPanel('start', 'nav', START_WIDTH);
      await grid.addPanel('end', 'details', END_WIDTH);

      await expect.poll(async () => {
        const { lock, wrapper } = await grid.geometry();

        return lock !== null && sameEdges(lock, wrapper);
      }).toBe(true);

      const geometry = await grid.geometry();
      const lock = geometry.lock!;

      expectNear(lock.left, onlyPanel(geometry.startPanels).left);
      expectNear(lock.right, onlyPanel(geometry.endPanels).right);
      expectNear(lock.top, geometry.wrapper.top);
      expectNear(lock.bottom, geometry.wrapper.bottom);
    });
  });
});
