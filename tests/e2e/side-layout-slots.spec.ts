import { test, expect } from '../fixtures/test';
import {
  SideLayoutSlotsPage, type Box, type PanelSeam, type SideSlotGeometry,
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
 * Reads the geometry once an overlays-layer element's box has caught up with the target box.
 */
async function geometryWhenOverlayMatches(
  page: SideLayoutSlotsPage,
  overlay: (geometry: SideSlotGeometry) => Box | null,
  target: (geometry: SideSlotGeometry) => Box,
): Promise<SideSlotGeometry> {
  await expect.poll(async () => {
    const geometry = await page.geometry();
    const box = overlay(geometry);

    return box !== null && sameEdges(box, target(geometry));
  }).toBe(true);

  return page.geometry();
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

      await expect.poll(async () => (await grid.geometry()).wrapperClasses).toContain('ht-grid-width-follows-content');

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

      await expect.poll(async () => (await grid.geometry()).wrapperClasses).toContain('ht-grid-width-follows-content');

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

  test.describe('shrink-to-fit hosts', () => {
    for (const hostLayout of ['inline-block', 'flex'] as const) {
      test(`settles a wide window-scrolled table with a start panel in a ${hostLayout} host`, async () => {
        const lastColumn = 29;

        await grid.rebuild({
          cols: lastColumn + 1, containerHeight: 'auto', sizeOptions: 'unset', hostLayout,
        });
        await grid.addPanel('start', 'nav', START_WIDTH);

        await expect.poll(async () => (await grid.geometry()).wrapperClasses)
          .toContain('ht-grid-width-follows-content');
        await expect.poll(() => grid.rendersOverFrames(10)).toBe(0);

        expect(await grid.renderCount()).toBeGreaterThan(0);
        expect(await grid.rendersOverFrames(60)).toBe(0);

        const geometry = await grid.geometry();

        expect(geometry.wrapperClasses).toContain('ht-grid-width-follows-content');
        expectNear(geometry.root.left, onlyPanel(geometry.startPanels).right);
        expectNear(geometry.root.right, geometry.table.right);
      });
    }
  });

  test.describe('without side panels', () => {
    test('keeps the original wrapper children and the flex layout', async () => {
      const structure = await grid.wrapperStructure();

      expect(structure.children).toEqual(['ht-slot-top', 'ht-grid', 'ht-slot-bottom', 'ht-overlay']);
      expect(structure.display).toBe('flex');
    });

    test('drops the side slot elements again once their panels unregister', async () => {
      await grid.addPanel('start', 'nav', START_WIDTH);
      await grid.addPanel('end', 'details', END_WIDTH);

      const docked = await grid.wrapperStructure();

      expect(docked.children).toEqual([
        'ht-slot-start', 'ht-slot-top', 'ht-grid', 'ht-slot-bottom', 'ht-slot-end', 'ht-overlay',
      ]);
      expect(docked.display).toBe('grid');

      await grid.removePanel('start', 'nav');
      await grid.removePanel('end', 'details');

      const structure = await grid.wrapperStructure();

      expect(structure.children).toEqual(['ht-slot-top', 'ht-grid', 'ht-slot-bottom', 'ht-overlay']);
      expect(structure.display).toBe('flex');
    });

    test('keeps the bottom bar as wide as a wide table in an inline-block host', async () => {
      await grid.rebuild({
        cols: 30,
        containerHeight: 'auto',
        sizeOptions: 'unset',
        hostLayout: 'inline-block',
        overrides: { pagination: { pageSize: 20 } },
      });

      await expect.poll(async () => {
        const { bottomSlot, root } = await grid.geometry();

        return near(bottomSlot.width, root.width);
      }).toBe(true);

      const geometry = await grid.geometry();

      expect(geometry.paginationBar).not.toBeNull();
      expect(geometry.root.width).toBeGreaterThanOrEqual(30 * 80);
      expect(geometry.root.width).toBeGreaterThan(geometry.documentClientWidth);
      expectNear(geometry.bottomSlot.left, geometry.root.left);
      expectNear(geometry.bottomSlot.right, geometry.root.right);
      expectNear(geometry.paginationBar!.right, geometry.root.right);
    });
  });

  test.describe('overlays over a narrow window-scrolled table', () => {
    const narrowWindowScroll = { cols: 4, containerHeight: 'auto', sizeOptions: 'unset' } as const;

    test('lets the dialog cover the end panel', async () => {
      await grid.rebuild({ ...narrowWindowScroll, overrides: { dialog: { animation: false } } });
      await grid.addPanel('start', 'nav', START_WIDTH);
      await grid.addPanel('end', 'details', END_WIDTH);
      await grid.showDialog();

      const geometry = await geometryWhenOverlayMatches(grid, g => g.dialog, g => g.wrapper);
      const end = onlyPanel(geometry.endPanels);

      expect(geometry.wrapperClasses).not.toContain('ht-grid-width-follows-content');
      expectNear(end.right, geometry.wrapper.right);
      expectNear(geometry.dialog!.right, end.right);
      expectNear(geometry.dialog!.left, geometry.wrapper.left);
    });

    test('lets the license lock cover the end panel', async () => {
      await grid.gotoWithExpiredTrial();
      await grid.rebuild(narrowWindowScroll);
      await expect(grid.lock()).toBeVisible();
      await grid.addPanel('start', 'nav', START_WIDTH);
      await grid.addPanel('end', 'details', END_WIDTH);

      const geometry = await geometryWhenOverlayMatches(grid, g => g.lock, g => g.wrapper);
      const end = onlyPanel(geometry.endPanels);

      expectNear(end.right, geometry.wrapper.right);
      expectNear(geometry.lock!.right, end.right);
      expectNear(geometry.lock!.left, geometry.wrapper.left);
    });
  });

  test.describe('seams between the panels and the grid', () => {
    /**
     * The physical `left`/`right` of a panel, as seen from the grid: under RTL the start side is
     * on the right.
     */
    function facing(seam: PanelSeam, side: 'left' | 'right') {
      return side === 'left'
        ? { border: seam.borderLeftWidth, top: seam.topLeftRadius, bottom: seam.bottomLeftRadius }
        : { border: seam.borderRightWidth, top: seam.topRightRadius, bottom: seam.bottomRightRadius };
    }

    for (const layoutDirection of ['ltr', 'rtl'] as const) {
      test(`draws no border and square corners toward the grid (${layoutDirection})`, async ({ theme }) => {
        const startGridSide = layoutDirection === 'ltr' ? 'right' : 'left';
        const endGridSide = layoutDirection === 'ltr' ? 'left' : 'right';

        await grid.rebuild({ overrides: { layoutDirection } });
        await grid.addPanel('start', 'nav', START_WIDTH);
        await grid.addPanel('end', 'details', END_WIDTH);

        const start = await grid.panelSeams('start');
        const end = await grid.panelSeams('end');
        const startPanel = start.panels[0];
        const endPanel = end.panels[0];

        expect(facing(startPanel, startGridSide)).toEqual({ border: 0, top: 0, bottom: 0 });
        expect(facing(endPanel, endGridSide)).toEqual({ border: 0, top: 0, bottom: 0 });
        expect(facing(startPanel, endGridSide).border).toBeGreaterThan(0);
        expect(facing(endPanel, startGridSide).border).toBeGreaterThan(0);

        if (theme !== 'classic') {
          expect(start.themeRadius).toBeGreaterThan(0);
        }

        if (start.themeRadius > 0) {
          expect(facing(startPanel, endGridSide).top).toBeGreaterThan(0);
          expect(facing(startPanel, endGridSide).bottom).toBeGreaterThan(0);
          expect(facing(endPanel, startGridSide).top).toBeGreaterThan(0);
          expect(facing(endPanel, startGridSide).bottom).toBeGreaterThan(0);
        }
      });
    }

    test('squares both inline sides of an inner start panel', async ({ theme }) => {
      await grid.addWeightedPanel('start', 'outer', 100, 100);
      await grid.addWeightedPanel('start', 'inner', 140, 200);

      const { themeRadius, panels } = await grid.panelSeams('start');
      const [outer, inner] = panels;

      expect(panels).toHaveLength(2);
      expect([inner.topLeftRadius, inner.bottomLeftRadius, inner.topRightRadius, inner.bottomRightRadius])
        .toEqual([0, 0, 0, 0]);
      expect([outer.topRightRadius, outer.bottomRightRadius]).toEqual([0, 0]);

      if (theme !== 'classic') {
        expect(themeRadius).toBeGreaterThan(0);
      }

      if (themeRadius > 0) {
        expect(outer.topLeftRadius).toBeGreaterThan(0);
        expect(outer.bottomLeftRadius).toBeGreaterThan(0);
      }
    });
  });

  test.describe('keyboard focus order through the side panels', () => {
    const modes = [
      { name: 'spreadsheet mode', overrides: { tabNavigation: true } },
      { name: 'data-grid mode', overrides: { navigableHeaders: true, tabNavigation: false } },
    ];

    for (const mode of modes) {
      test(`moves from the start panel into the grid and on to the end panel (${mode.name})`, async () => {
        await grid.rebuild({ overrides: { ...mode.overrides, pagination: { pageSize: 5 } } });
        await grid.addPanel('start', 'nav', START_WIDTH);
        await grid.addPanelButton('nav', 'navAction');
        await grid.addPanel('end', 'details', END_WIDTH);
        await grid.addPanelButton('details', 'endAction');
        await grid.focusButton('navAction');

        await grid.page.keyboard.press('Tab');

        await expect.poll(() => grid.focusState()).toEqual({ focused: null, gridActive: true });

        await grid.page.keyboard.press('Shift+Tab');

        await expect.poll(async () => (await grid.focusState()).focused).toBe('button-navAction');

        await grid.page.keyboard.press('Tab');

        await expect.poll(() => grid.focusState()).toEqual({ focused: null, gridActive: true });

        const stops = await grid.pressUntilFocused('Tab', 'endAction', 20);

        expect(stops.at(-1)).toBe('button-endAction');
        expect(stops).not.toContain('button-navAction');
      });
    }
  });

  test.describe('grid-area chrome next to side panels', () => {
    for (const layoutDirection of ['ltr', 'rtl'] as const) {
      test(`keeps the trial license badge over the grid area (${layoutDirection})`, async () => {
        await grid.gotoDuringTrial();
        await grid.rebuild({ overrides: { layoutDirection } });
        await grid.addPanel('start', 'nav', START_WIDTH);
        await grid.addPanel('end', 'details', END_WIDTH);

        await expect.poll(async () => {
          const { badge, grid: gridBox } = await grid.geometry();

          return badge !== null && near(badge.left, gridBox.left) && near(badge.right, gridBox.right);
        }).toBe(true);

        const geometry = await grid.geometry();
        const start = onlyPanel(geometry.startPanels);

        if (layoutDirection === 'ltr') {
          expectNear(geometry.badge!.left, start.right);
        } else {
          expectNear(geometry.badge!.right, start.left);
        }
      });
    }

    test('keeps the notification toast container over the grid area', async () => {
      await grid.rebuild({ overrides: { notification: true } });
      await grid.addPanel('start', 'nav', START_WIDTH);
      await grid.addPanel('end', 'details', END_WIDTH);
      await grid.showToast();

      await expect.poll(async () => {
        const { notification, grid: gridBox } = await grid.geometry();

        return notification !== null
          && near(notification.left, gridBox.left) && near(notification.right, gridBox.right);
      }).toBe(true);

      const geometry = await grid.geometry();

      expectNear(geometry.notification!.left, onlyPanel(geometry.startPanels).right);
      expectNear(geometry.notification!.right, onlyPanel(geometry.endPanels).left);
    });
  });

  test.describe('the `width` option and side panel changes', () => {
    test('re-applies a pixel width in the same task the panel registers in', async () => {
      await grid.rebuild({ overrides: { width: 600 } });

      const rootWidth = await grid.addPanelAndReadRootWidth('start', 'nav', START_WIDTH);

      expect(rootWidth.replace(/\s+/g, '')).toMatch(/^calc\((440px|600px-160px)\)$/);
    });

    test('lets an `auto` width fill the track between the panels', async () => {
      await grid.rebuild({ overrides: { width: 'auto' } });
      await grid.addPanel('start', 'nav', START_WIDTH);
      await grid.addPanel('end', 'details', END_WIDTH);
      await grid.waitForRootWidth(720 - START_WIDTH - END_WIDTH);

      const geometry = await grid.geometry();

      expect(geometry.rootInlineWidth).toBe('auto');
      expect(geometry.wrapperClasses).not.toContain('ht-grid-fixed-width');
      expectNear(geometry.root.left, onlyPanel(geometry.startPanels).right);
      expectNear(geometry.root.right, onlyPanel(geometry.endPanels).left);
    });

    test('calls a function width again and fits the panels into its result', async () => {
      const width = 600;

      await grid.rebuild({ widthFunction: width });

      const callsBefore = await grid.widthFunctionCalls();

      await grid.addPanel('start', 'nav', START_WIDTH);
      await grid.addPanel('end', 'details', END_WIDTH);
      await grid.waitForRootWidth(width - START_WIDTH - END_WIDTH);

      const geometry = await grid.geometry();
      const start = onlyPanel(geometry.startPanels);
      const end = onlyPanel(geometry.endPanels);

      expect(await grid.widthFunctionCalls()).toBeGreaterThan(callsBefore);
      expect(geometry.wrapperClasses).toContain('ht-grid-fixed-width');
      expectNear(end.right, start.left + width);
      expectNear(end.left, geometry.root.right);
    });
  });
});
