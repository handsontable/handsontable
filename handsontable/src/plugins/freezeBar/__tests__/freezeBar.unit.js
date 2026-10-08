import Handsontable from 'handsontable/base';
import { registerPlugin, FreezeBar, Pagination, HiddenColumns } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(FreezeBar);
registerPlugin(Pagination);
registerPlugin(HiddenColumns);

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
    jest.spyOn(hot.view, 'getFrozenViewportSize').mockReturnValue(1000);
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

    hot.view.getFrozenViewportSize.mockImplementation(isColumn => (isColumn ? 300 : 1000));
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

    const bar = container.querySelector('[data-ht-freeze-separator="start"]');

    expect(bar.getAttribute('role')).toBe('separator');
    expect(bar.getAttribute('aria-orientation')).toBe('vertical');
    expect(bar.getAttribute('aria-valuenow')).toBe('2');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-label')).toBe('Frozen columns');
  });

  it('should change the count with the arrow keys and Home', () => {
    createGrid({ fixedColumnsStart: 2 });
    hot.render();

    const bar = container.querySelector('[data-ht-freeze-separator="start"]');
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
    expect(focused[0]).toContain('ht-freeze-bar-separator');
  });

  it('should tear down without throwing when a corner overlay has no clone', () => {
    createGrid({ fixedColumnsStart: 2, fixedRowsTop: 1 });
    hot.render();

    const overlays = hot.view._wt.wtOverlays;
    const original = overlays.topInlineStartCornerOverlay;

    Object.defineProperty(overlays, 'topInlineStartCornerOverlay', {
      configurable: true,
      get() {
        return new Error().stack.includes('syncSegments') ? { clone: undefined } : original;
      },
    });

    try {
      hot.render();

      expect(() => hot.updateSettings({ freezeBar: false })).not.toThrow();
    } finally {
      Object.defineProperty(overlays, 'topInlineStartCornerOverlay', { configurable: true, value: original });
    }

    expect(() => hot.destroy()).not.toThrow();
    hot = null;
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

  it('should ignore an edge it does not know', () => {
    const plugin = createGrid();
    const before = jest.fn();

    hot.addHook('beforeFreezeChange', before);

    expect(plugin.setFreezeCount('left', 2)).toBe(false);
    expect(plugin.getFreezeCount('left')).toBe(0);
    expect(before).not.toHaveBeenCalled();
  });

  it('should leave a count alone that did not grow, even when it no longer fits', () => {
    const plugin = createGrid({ fixedColumnsStart: 4 });

    // 150px viewport, 40px kept scrollable, 50px columns: only 2 columns fit
    hot.view.getFrozenViewportSize.mockImplementation(isColumn => (isColumn ? 150 : 1000));

    expect(plugin.setFreezeCount('start', 4)).toBe(false);
    expect(plugin.getFreezeCount('start')).toBe(4);
    expect(plugin.setFreezeCount('start', 3)).toBe(true);
    expect(plugin.getFreezeCount('start')).toBe(3);
    // a count that grows is still cut down, here to what it already was
    expect(plugin.setFreezeCount('start', 9)).toBe(false);
    expect(plugin.getFreezeCount('start')).toBe(3);
  });

  it('should leave room for the band on the opposite edge, whichever edge grows', () => {
    const plugin = createGrid({ fixedRowsBottom: 3 });

    // 200px viewport, 3 bottom rows of 23px, 40px kept scrollable: 91px remain, so 3 top rows fit
    hot.view.getFrozenViewportSize.mockImplementation(isColumn => (isColumn ? 1000 : 200));
    plugin.setFreezeCount('top', 9);

    expect(plugin.getFreezeCount('top')).toBe(3);
  });

  it('should leave room for the end band when the start bar grows', () => {
    const plugin = createGrid({ fixedColumnsEnd: 4 });

    // 400px viewport, 4 end columns of 50px, 40px kept scrollable: 160px remain, so 3 start columns fit
    hot.view.getFrozenViewportSize.mockImplementation(isColumn => (isColumn ? 400 : 1000));
    plugin.setFreezeCount('start', 9);

    expect(plugin.getFreezeCount('start')).toBe(3);
  });

  it('should not claim F6 when there is no bar to focus', () => {
    createGrid({ freezeBar: { rows: false, columns: false } });
    hot.render();

    const shortcut = hot.getShortcutManager().getContext('grid').getShortcuts(['F6'])[0];

    expect(shortcut.runOnlyIf()).toBe(false);
  });

  it('should move the focus to the next bar on F6, and to the previous one on Shift+F6', () => {
    createGrid({ fixedColumnsStart: 2, fixedRowsTop: 1 });
    hot.render();

    const start = container.querySelector('[data-ht-freeze-separator="start"]');
    const press = (target, shiftKey = false) => {
      target.dispatchEvent(new KeyboardEvent('keydown', { key: 'F6', shiftKey, bubbles: true, cancelable: true }));
    };

    start.focus();
    press(start);

    const second = document.activeElement;

    expect(second).not.toBe(start);
    expect(second.hasAttribute('data-ht-freeze-separator')).toBe(true);

    press(second, true);

    expect(document.activeElement).toBe(start);
  });

  it('should keep every key the bar does not use from reaching the grid', () => {
    createGrid({ fixedColumnsStart: 2 });
    hot.render();

    const bar = container.querySelector('[data-ht-freeze-separator="start"]');
    const reached = jest.fn();

    document.addEventListener('keydown', reached);

    try {
      ['Delete', 'Enter', 'a', 'Backspace', 'Tab'].forEach((key) => {
        bar.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      });
    } finally {
      document.removeEventListener('keydown', reached);
    }

    expect(reached).not.toHaveBeenCalled();
  });

  it('should keep the Tab default of the bar, so the focus can move on', () => {
    createGrid({ fixedColumnsStart: 2 });
    hot.render();

    const bar = container.querySelector('[data-ht-freeze-separator="start"]');
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });

    bar.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it('should not lower a count above the number of tracks with a step up', () => {
    const plugin = createGrid({ fixedColumnsStart: 5, data: [['a', 'b', 'c']] });

    hot.render();

    const bar = container.querySelector('[data-ht-freeze-separator="start"]');
    const after = jest.fn();

    hot.addHook('afterFreezeChange', after);
    bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));

    expect(plugin.getFreezeCount('start')).toBe(5);
    expect(after).not.toHaveBeenCalled();
  });

  it('should let undo and redo through while a bar holds the focus, and keep every other chord from the grid', () => {
    createGrid({ fixedColumnsStart: 2 });
    hot.render();

    const bar = container.querySelector('[data-ht-freeze-separator="start"]');
    const reached = [];
    const listener = event => reached.push(`${event.ctrlKey ? 'ctrl+' : ''}${event.key}`);

    document.addEventListener('keydown', listener);

    try {
      ['z', 'y', 'a', 'x', 'Delete'].forEach((key) => {
        const init = { key, ctrlKey: key !== 'Delete', bubbles: true, cancelable: true };

        bar.dispatchEvent(new KeyboardEvent('keydown', init));
      });
    } finally {
      document.removeEventListener('keydown', listener);
    }

    expect(reached).toEqual(['ctrl+z', 'ctrl+y']);
  });

  it('should recover when the browser refuses to capture the pointer', () => {
    createGrid({ fixedColumnsStart: 2 });
    hot.render();

    const bar = container.querySelector('.ht-freeze-bar--start:not(.ht-freeze-bar--segment)');
    const press = (type) => {
      const event = new MouseEvent(type, { button: 0, bubbles: true, cancelable: true });

      Object.defineProperty(event, 'isPrimary', { value: true });
      Object.defineProperty(event, 'pointerId', { value: 3 });
      (type === 'pointerdown' ? bar : document).dispatchEvent(event);
    };

    bar.setPointerCapture = () => {
      throw new Error('NotFoundError');
    };

    expect(() => press('pointerdown')).not.toThrow();
    expect(bar.classList.contains('ht-freeze-bar--active')).toBe(true);

    press('pointerup');

    expect(bar.classList.contains('ht-freeze-bar--active')).toBe(false);

    press('pointerdown');

    expect(bar.classList.contains('ht-freeze-bar--active')).toBe(true);
    press('pointerup');
  });

  it('should write a style of a bar only when its value changed', () => {
    createGrid({ fixedColumnsStart: 2, fixedRowsTop: 1 });
    hot.render();

    const bars = [...container.querySelectorAll('.ht-freeze-bar')];
    const writes = bars.map(bar => jest.spyOn(bar.style, 'setProperty'));

    hot.render();
    hot.render();

    expect(writes.reduce((sum, spy) => sum + spy.mock.calls.length, 0)).toBe(0);
  });

  it('should keep the focusable separators outside the grid, which may own rows only', () => {
    createGrid({ fixedColumnsStart: 2, fixedRowsTop: 1 });
    hot.render();

    const separators = [...container.querySelectorAll('[role="separator"]')];

    expect(separators.length).toBe(4);
    separators.forEach((separator) => {
      expect(hot.rootElement.contains(separator)).toBe(false);
      expect(separator.tabIndex).toBe(0);
    });

    // the bars in the grid only draw: nothing in them is focusable or announced
    [...hot.rootElement.querySelectorAll('.ht-freeze-bar')].forEach((bar) => {
      expect(bar.getAttribute('aria-hidden')).toBe('true');
      expect(bar.hasAttribute('role')).toBe(false);
      expect(bar.hasAttribute('tabindex')).toBe(false);
    });
  });

  it('should keep a cut and a paste on the separator from reaching the grid', () => {
    createGrid({ fixedColumnsStart: 2 });
    hot.render();

    const separator = container.querySelector('[data-ht-freeze-separator="start"]');
    const reached = jest.fn();

    document.addEventListener('cut', reached);
    document.addEventListener('paste', reached);

    try {
      separator.dispatchEvent(new Event('cut', { bubbles: true, cancelable: true }));
      separator.dispatchEvent(new Event('paste', { bubbles: true, cancelable: true }));
    } finally {
      document.removeEventListener('cut', reached);
      document.removeEventListener('paste', reached);
    }

    expect(reached).not.toHaveBeenCalled();
  });

  it('should keep the range of the value valid when the count is above what fits', () => {
    createGrid({ fixedColumnsStart: 4 });
    hot.render();
    hot.view.getWorkspaceWidth.mockReturnValue(150);

    const separator = container.querySelector('[data-ht-freeze-separator="start"]');

    separator.dispatchEvent(new Event('focus'));

    expect(separator.getAttribute('aria-valuenow')).toBe('4');
    expect(Number(separator.getAttribute('aria-valuemax'))).toBeGreaterThanOrEqual(4);
  });

  it('should give the focus back to the grid on Escape, and let the key go on', () => {
    createGrid({ fixedColumnsStart: 2 });
    hot.render();

    const separator = container.querySelector('[data-ht-freeze-separator="start"]');
    const refocus = jest.spyOn(hot.getFocusManager(), 'focusOnHighlightedCell').mockImplementation(() => {});
    const reached = jest.fn();

    document.addEventListener('keydown', reached);

    try {
      separator.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    } finally {
      document.removeEventListener('keydown', reached);
    }

    expect(refocus).toHaveBeenCalledTimes(1);
    expect(reached).toHaveBeenCalledTimes(1);
  });

  it('should skip a hidden column when a step down unfreezes it', () => {
    const plugin = createGrid({ fixedColumnsStart: 3, hiddenColumns: { columns: [2] } });

    hot.render();

    const separator = container.querySelector('[data-ht-freeze-separator="start"]');

    separator.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));

    // column 2 is hidden, so a step from 3 to 2 would change nothing on screen
    expect(plugin.getFreezeCount('start')).toBe(1);
  });

  it('should not commit a press that never moved', () => {
    const plugin = createGrid({ fixedColumnsStart: 2 });

    hot.render();

    const bar = container.querySelector('.ht-freeze-bar--start:not(.ht-freeze-bar--segment)');
    const after = jest.fn();
    const send = (type, target) => {
      const event = new MouseEvent(type, { button: 0, bubbles: true, cancelable: true });

      Object.defineProperty(event, 'isPrimary', { value: true });
      Object.defineProperty(event, 'pointerId', { value: 5 });
      target.dispatchEvent(event);
    };

    hot.addHook('afterFreezeChange', after);
    send('pointerdown', bar);
    // the count changes while the pointer is down, as an undo would do
    plugin.setFreezeCount('start', 3);
    after.mockClear();
    send('pointerup', document);

    expect(plugin.getFreezeCount('start')).toBe(3);
    expect(after).not.toHaveBeenCalled();
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
