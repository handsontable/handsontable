import { test, expect } from '../fixtures/test';
import { ScrollOwnerChangeListenersPage } from '../fixtures/pages/ScrollOwnerChangeListenersPage';

const PAGE_WIDE_EVENTS = [
  'pointermove',
  'pointerleave',
  'mousedown',
  'mouseup',
  'keydown',
  'keyup',
  'visibilitychange',
  'resize',
];

/**
 * An `updateSettings()` call that moves the grid's scroll owner re-picks the scrollable elements. It
 * must re-bind only the listeners on those elements: a page-wide listener added there belongs to the
 * caller's context (an Angular zone runs change detection on every pointer move it sees), and the
 * grid already holds the ones it bound at construction.
 */
test.describe('listeners after a scroll owner change', () => {
  let grid: ScrollOwnerChangeListenersPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new ScrollOwnerChangeListenersPage(page, theme, bundle);
    await grid.goto();
    await grid.startRecording();
  });

  test('adds no page-wide listener when pagination is turned on', async () => {
    await grid.enablePagination();

    expect(await grid.scrollableElementUpdates()).toBe(1);

    const added = await grid.addedPageListeners();

    expect(added.filter(type => PAGE_WIDE_EVENTS.includes(type))).toEqual([]);
  });

  test('keeps the wheel scroll and the row headers in sync after the change', async () => {
    await grid.enablePagination();
    await grid.wheelOverGrid(300);

    await expect.poll(async () => (await grid.verticalOffsets()).master).toBeGreaterThan(0);
    await expect.poll(async () => {
      const { master, rowHeaders } = await grid.verticalOffsets();

      return master === rowHeaders;
    }).toBe(true);
  });
});
