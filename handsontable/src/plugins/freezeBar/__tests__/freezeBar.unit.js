import Handsontable from 'handsontable/base';
import { registerPlugin, FreezeBar, Pagination } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(FreezeBar);
registerPlugin(Pagination);

describe('FreezeBar', () => {
  let container;
  let hot;

  const createGrid = (settings = {}) => {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: Array.from({ length: 10 }, (rowValue, row) => {
        return Array.from({ length: 10 }, (colValue, col) => `${row}:${col}`);
      }),
      colHeaders: true,
      rowHeaders: true,
      freezeBar: true,
      ...settings,
    });

    // jsdom has no layout: give the viewport a size, so the count is not clamped to 0
    jest.spyOn(hot.view, 'getWorkspaceWidth').mockReturnValue(1000);
    jest.spyOn(hot.view, 'getWorkspaceHeight').mockReturnValue(1000);
    jest.spyOn(hot.view, 'getRowHeaderWidth').mockReturnValue(0);
    jest.spyOn(hot.view, 'getColumnHeaderHeight').mockReturnValue(0);
    jest.spyOn(hot, 'getColWidth').mockReturnValue(50);
    jest.spyOn(hot.stylesHandler, 'getDefaultRowHeight').mockReturnValue(23);

    return hot.getPlugin('freezeBar');
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  it('should be disabled by default', () => {
    hot = new Handsontable(container, { licenseKey: 'non-commercial-and-evaluation', data: [[1]] });

    expect(hot.getPlugin('freezeBar').isEnabled()).toBe(false);
  });

  it('should change the count of every edge', () => {
    const plugin = createGrid();

    expect(plugin.setFreezeCount('start', 2)).toBe(true);
    expect(plugin.setFreezeCount('top', 3)).toBe(true);
    expect(plugin.setFreezeCount('end', 1)).toBe(true);
    expect(plugin.setFreezeCount('bottom', 1)).toBe(true);

    expect(plugin.getFreezeCount('start')).toBe(2);
    expect(plugin.getFreezeCount('top')).toBe(3);
    expect(plugin.getFreezeCount('end')).toBe(1);
    expect(plugin.getFreezeCount('bottom')).toBe(1);
    expect(hot.getSettings().fixedColumnsStart).toBe(2);
  });

  it('should not change the settings passed to the grid (the count lives on the table meta)', () => {
    const plugin = createGrid({ fixedColumnsStart: 1 });

    plugin.setFreezeCount('start', 4);

    expect(hot.getSettings().fixedColumnsStart).toBe(4);
    // a re-sent, unchanged option does not revert the change
    hot.updateSettings({ fixedColumnsStart: 1 });
    expect(plugin.getFreezeCount('start')).toBe(4);
  });

  it('should not throw on a grid configured with the legacy fixedColumnsLeft option', () => {
    const plugin = createGrid({ fixedColumnsLeft: 1 });

    expect(() => plugin.setFreezeCount('start', 3)).not.toThrow();
    expect(plugin.getFreezeCount('start')).toBe(3);
  });

  it('should not move any column', () => {
    const plugin = createGrid();
    const before = hot.columnIndexMapper.getIndexesSequence();

    plugin.setFreezeCount('start', 3);

    expect(hot.columnIndexMapper.getIndexesSequence()).toEqual(before);
  });

  it('should fire the hooks with the edge, the counts and the source', () => {
    const plugin = createGrid({ fixedRowsTop: 1 });
    const before = jest.fn();
    const after = jest.fn();

    hot.addHook('beforeFreezeChange', before);
    hot.addHook('afterFreezeChange', after);

    plugin.setFreezeCount('top', 3);

    expect(before).toHaveBeenCalledWith('top', 3, 1, 'api');
    expect(after).toHaveBeenCalledWith('top', 3, 1, 'api');
  });

  it('should cancel the change when beforeFreezeChange returns false', () => {
    const plugin = createGrid();
    const after = jest.fn();

    hot.addHook('beforeFreezeChange', () => false);
    hot.addHook('afterFreezeChange', after);

    expect(plugin.setFreezeCount('start', 2)).toBe(false);
    expect(plugin.getFreezeCount('start')).toBe(0);
    expect(after).not.toHaveBeenCalled();
  });

  it('should clamp the count to what fits the viewport', () => {
    const plugin = createGrid();

    hot.view.getWorkspaceWidth.mockReturnValue(300);
    plugin.setFreezeCount('start', 100);

    // 300px viewport, 40px kept scrollable, 50px columns: 5 columns fit
    expect(plugin.getFreezeCount('start')).toBe(5);
  });

  it('should give the start band priority over the end band', () => {
    const plugin = createGrid({ fixedColumnsStart: 4 });

    plugin.setFreezeCount('end', 100);

    expect(plugin.getFreezeCount('end')).toBe(6);
  });

  it('should not fire the hooks for an unchanged count', () => {
    const plugin = createGrid({ fixedRowsTop: 2 });
    const before = jest.fn();

    hot.addHook('beforeFreezeChange', before);

    expect(plugin.setFreezeCount('top', 2)).toBe(false);
    expect(before).not.toHaveBeenCalled();
  });

  it('should leave the rows alone while Pagination is enabled', () => {
    const plugin = createGrid({ pagination: { pageSize: 5 } });

    expect(plugin.setFreezeCount('top', 2)).toBe(false);
    expect(plugin.setFreezeCount('start', 2)).toBe(true);
  });

  it('should respect the axes chosen in the object form', () => {
    const plugin = createGrid({ freezeBar: { rows: false } });

    expect(plugin.setFreezeCount('top', 2)).toBe(false);
    expect(plugin.setFreezeCount('start', 2)).toBe(true);
  });

  it('should remove every bar when the plugin is disabled', () => {
    createGrid({ fixedColumnsStart: 1, fixedRowsTop: 1 });
    hot.render();

    expect(container.querySelectorAll('.ht-freeze-bar').length).toBeGreaterThan(0);

    hot.updateSettings({ freezeBar: false });

    expect(container.querySelectorAll('.ht-freeze-bar').length).toBe(0);
  });

  it('should expose a separator with the value of the count', () => {
    createGrid({ fixedColumnsStart: 2 });
    hot.render();

    const bar = container.querySelector('.ht-freeze-bar--start');

    expect(bar.getAttribute('role')).toBe('separator');
    expect(bar.getAttribute('aria-orientation')).toBe('vertical');
    expect(bar.getAttribute('aria-valuenow')).toBe('2');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-label')).toBe('Frozen columns');
  });

  it('should change the count with the arrow keys and Home', () => {
    createGrid({ fixedColumnsStart: 2 });
    hot.render();

    const bar = container.querySelector('.ht-freeze-bar--start');
    const press = key => bar.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

    press('ArrowRight');
    expect(hot.getSettings().fixedColumnsStart).toBe(3);

    press('ArrowLeft');
    press('ArrowLeft');
    expect(hot.getSettings().fixedColumnsStart).toBe(1);

    press('Home');
    expect(hot.getSettings().fixedColumnsStart).toBe(0);
  });

  it('should draw a short handle on the header corner of an edge with nothing frozen', () => {
    createGrid({ fixedColumnsStart: 2 });
    hot.render();

    ['top', 'bottom', 'end'].forEach((edge) => {
      const handle = container.querySelector(`.ht-freeze-bar--${edge}`);

      expect(handle).not.toBeNull();
      expect(handle.classList.contains('ht-freeze-bar--empty')).toBe(true);
      expect(handle.parentNode).toBe(hot.rootElement);
    });
    expect(container.querySelector('.ht-freeze-bar--start').classList.contains('ht-freeze-bar--empty')).toBe(false);
  });

  it('should not keep the bar of an axis that was switched off, so F6 skips it', () => {
    const plugin = createGrid({ fixedColumnsStart: 2, fixedRowsTop: 1 });

    hot.render();
    hot.updateSettings({ freezeBar: { columns: false } });
    hot.render();

    expect(container.querySelector('.ht-freeze-bar--start')).toBeNull();

    const focused = [];
    const original = HTMLElement.prototype.focus;

    HTMLElement.prototype.focus = function() {
      focused.push(this.className);
    };

    try {
      hot.getShortcutManager().getContext('grid').getShortcuts(['F6'])[0].callback();
    } finally {
      HTMLElement.prototype.focus = original;
    }

    expect(plugin.isEnabled()).toBe(true);
    expect(focused.length).toBe(1);
    expect(focused[0]).toContain('ht-freeze-bar--top');
  });

  it('should not throw when a bar is torn down, whatever the corner overlays are', () => {
    createGrid({ fixedColumnsStart: 2, fixedRowsTop: 1, fixedColumnsEnd: 1, fixedRowsBottom: 1 });
    hot.render();

    expect(() => hot.updateSettings({ freezeBar: false })).not.toThrow();
    expect(() => hot.destroy()).not.toThrow();
    hot = null;
  });

  it('should keep the piece of a corner overlay when another corner overlay has no clone', () => {
    createGrid({ fixedColumnsStart: 2, fixedRowsTop: 1, fixedRowsBottom: 1 });
    hot.render();

    const piecesOf = () => [...container.querySelectorAll('.ht-freeze-bar--start.ht-freeze-bar--segment')];
    const before = piecesOf();
    const overlays = hot.view._wt.wtOverlays;
    const original = overlays.topInlineStartCornerOverlay;

    expect(before.length).toBe(2);

    // the first corner overlay of the start edge has no clone, but only while the plugin looks for it
    Object.defineProperty(overlays, 'topInlineStartCornerOverlay', {
      configurable: true,
      get() {
        return new Error().stack.includes('syncSegments') ? undefined : original;
      },
    });

    try {
      // the second render is the one that read the previous piece with the wrong position
      hot.render();
      hot.render();
    } finally {
      Object.defineProperty(overlays, 'topInlineStartCornerOverlay', { configurable: true, value: original });
    }

    const after = piecesOf();

    expect(after.length).toBe(1);
    // the piece of the other corner is the same element: it was not removed and built again
    expect(before).toContain(after[0]);
  });

  it('should render nothing when the option is not set', () => {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [[1, 2]],
      fixedColumnsStart: 1,
    });

    expect(container.querySelectorAll('.ht-freeze-bar').length).toBe(0);
  });
});
