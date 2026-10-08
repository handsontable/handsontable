import { scrollViewportThenWindow } from '../utils';

/**
 * A grid's DOM reduced to what the helper walks: the application's container, the grid's holder inside it, and
 * a cell inside the holder. The viewport offset the overlays report is kept apart from the holder's own offset,
 * so a case can move one without the other.
 *
 * @param {object} options The stub options.
 * @param {boolean} options.scrolls Whether `scrollViewportTo()` scrolls, which decides how it calls back: on a
 * later `afterScroll` (the test fires it) or in a microtask.
 * @returns {object}
 */
function createGrid({ scrolls }) {
  const container = document.createElement('div');
  const holder = document.createElement('div');
  const cell = document.createElement('td');

  holder.appendChild(cell);
  container.appendChild(holder);
  document.body.appendChild(container);

  const viewportOffset = { top: 0, left: 0 };
  let afterScroll = null;
  const hot = {
    rootContainer: container,
    view: {
      _wt: {
        wtOverlays: {
          topOverlay: { getScrollPosition: () => viewportOffset.top },
          inlineStartOverlay: { getScrollPosition: () => viewportOffset.left },
        },
      },
    },
    scrollViewportTo: jest.fn((target, callback) => {
      if (!callback) {
        return scrolls;
      }

      if (scrolls) {
        afterScroll = callback;
      } else {
        queueMicrotask(callback);
      }

      return scrolls;
    }),
  };

  return {
    hot,
    container,
    holder,
    cell,
    viewportOffset,
    fireAfterScroll: () => afterScroll(),
    destroy: () => container.remove(),
  };
}

describe('scrollViewportThenWindow', () => {
  let scrollIntoView;
  let grid;

  beforeEach(() => {
    // `scrollIntoView()` moves every scrollable ancestor of the element: here the grid's holder and the
    // application's container stand in for that, the window is out of jsdom's reach.
    scrollIntoView = jest.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(function() {
      const holder = this.parentElement;

      holder.scrollTop += 30;
      holder.scrollLeft += 20;
      holder.parentElement.scrollTop += 7;
    });
  });

  afterEach(() => {
    scrollIntoView.mockRestore();
    grid?.destroy();
  });

  it('scrolls the viewport without a window scroll when no window target is given', () => {
    grid = createGrid({ scrolls: true });

    scrollViewportThenWindow(grid.hot, { row: 5 });

    expect(grid.hot.scrollViewportTo).toHaveBeenCalledWith({ row: 5 });
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('lets the window scroll adjust the grid\'s holder when the viewport did not move', () => {
    grid = createGrid({ scrolls: true });
    grid.holder.scrollTop = 100;
    grid.holder.scrollLeft = 50;

    scrollViewportThenWindow(grid.hot, { row: 5 }, () => grid.cell);
    grid.fireAfterScroll();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.instances[0]).toBe(grid.cell);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
    expect([grid.holder.scrollTop, grid.holder.scrollLeft]).toEqual([130, 70]);
  });

  it('scrolls the window but keeps the grid\'s holder when the viewport moved vertically since', () => {
    grid = createGrid({ scrolls: true });
    grid.holder.scrollTop = 100;
    grid.holder.scrollLeft = 50;

    scrollViewportThenWindow(grid.hot, { row: 5 }, () => grid.cell);
    grid.viewportOffset.top += 1;
    grid.fireAfterScroll();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect([grid.holder.scrollTop, grid.holder.scrollLeft]).toEqual([100, 50]);
  });

  it('scrolls the window but keeps the grid\'s holder when the viewport moved horizontally since', () => {
    grid = createGrid({ scrolls: true });
    grid.holder.scrollTop = 100;
    grid.holder.scrollLeft = -50;

    scrollViewportThenWindow(grid.hot, { col: 5 }, () => grid.cell);
    grid.viewportOffset.left -= 1;
    grid.fireAfterScroll();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect([grid.holder.scrollTop, grid.holder.scrollLeft]).toEqual([100, -50]);
  });

  it('treats a sub-pixel difference, as a zoomed page stores, as no move', () => {
    grid = createGrid({ scrolls: true });

    scrollViewportThenWindow(grid.hot, { row: 5 }, () => grid.cell);
    grid.viewportOffset.top += 0.5;
    grid.viewportOffset.left -= 0.5;
    grid.fireAfterScroll();

    expect([grid.holder.scrollTop, grid.holder.scrollLeft]).toEqual([30, 20]);
  });

  it('keeps the grid\'s holder when the viewport moved in the same task and no scroll was needed', async() => {
    // `scrollViewportTo()` calls back in a microtask when it does not scroll, so a scroll the caller makes
    // right after it in the same task lands first.
    grid = createGrid({ scrolls: false });
    grid.holder.scrollTop = 100;

    scrollViewportThenWindow(grid.hot, { row: 5 }, () => grid.cell);
    grid.viewportOffset.top = 300;
    await Promise.resolve();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect([grid.holder.scrollTop, grid.holder.scrollLeft]).toEqual([100, 0]);
  });

  it('lets the window scroll adjust the grid\'s holder when no scroll was needed and nothing moved', async() => {
    grid = createGrid({ scrolls: false });
    grid.holder.scrollTop = 100;

    scrollViewportThenWindow(grid.hot, { row: 5 }, () => grid.cell);
    await Promise.resolve();

    expect([grid.holder.scrollTop, grid.holder.scrollLeft]).toEqual([130, 20]);
  });

  it('leaves the application\'s container to the window scroll even when it keeps the grid\'s holder', () => {
    grid = createGrid({ scrolls: true });
    grid.container.scrollTop = 10;

    scrollViewportThenWindow(grid.hot, { row: 5 }, () => grid.cell);
    grid.viewportOffset.top += 40;
    grid.fireAfterScroll();

    expect(grid.container.scrollTop).toBe(17);
    expect(grid.holder.scrollTop).toBe(0);
  });

  it('does nothing to the window when the target is not rendered', () => {
    grid = createGrid({ scrolls: true });

    scrollViewportThenWindow(grid.hot, { row: 5 }, () => null);
    grid.viewportOffset.top += 40;
    grid.fireAfterScroll();

    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
