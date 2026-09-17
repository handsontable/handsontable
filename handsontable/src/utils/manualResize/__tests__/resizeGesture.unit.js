import EventManager from '../../../eventManager';
import { ResizeGesture } from '../resizeGesture';

/**
 * The gesture takes the grid, the axis and its owning plugin through its constructor, so these
 * specs hand it small stand-ins through that same interface - no module is mocked. What they pin is
 * what the shared module owns and a real grid cannot isolate: the press, double-click and
 * autoresize state, the teardown traps recorded under DEV-2719, and which CSS property each
 * orientation moves. Layout is jsdom's, where every offset size is 0.
 */
describe('ResizeGesture', () => {
  let rootElement;
  let eventManager;

  afterEach(() => {
    eventManager?.destroy();
    rootElement?.remove();
  });

  function createGrid({ rtl = false, selectedRanges = [] } = {}) {
    rootElement = document.createElement('div');

    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    const tr = document.createElement('tr');
    const th = document.createElement('th');

    tr.appendChild(th);
    tbody.appendChild(tr);
    table.appendChild(tbody);
    rootElement.appendChild(table);
    document.body.appendChild(rootElement);

    const timeouts = [];
    const microtasks = [];
    const state = { rtl };
    const hot = {
      rootDocument: document,
      rootWindow: window,
      rootElement,
      isRtl: () => state.rtl,
      getDirectionFactor: () => (state.rtl ? -1 : 1),
      _registerTimeout: jest.fn((callback) => {
        timeouts.push(callback);

        return timeouts.length;
      }),
      _registerMicrotask: jest.fn(callback => microtasks.push(callback)),
      runHooks: jest.fn(),
      render: jest.fn(),
      getSelectedRange: () => selectedRanges,
      selection: {
        isSelected: () => selectedRanges.length > 0,
        isSelectedByCorner: () => false,
      },
      view: {
        _wt: { wtTable: { getCoords: () => ({ row: 2, col: 3 }) } },
        getTableWidth: () => 400,
        getTableHeight: () => 300,
      },
    };

    return { hot, th, state, timeouts, microtasks };
  }

  function createAxis(orientation, overrides = {}) {
    return {
      orientation,
      handleClassName: 'testResizer',
      guideClassName: 'testResizerGuide',
      beforeResizeHook: 'beforeTestResize',
      afterResizeHook: 'afterTestResize',
      getIndexMapper: () => ({ getVisualFromRenderableIndex: index => index }),
      getCoordsIndex: coords => (orientation === 'vertical' ? coords.row : coords.col),
      isSelectedByHeader: () => true,
      isHeaderElement: () => true,
      canResizeHeader: () => true,
      getHeaderPosition: () => ({ top: 100, start: 50 }),
      getHookSize: (_hot, _index, newSize) => newSize,
      ...overrides,
    };
  }

  function createOwner() {
    return {
      isActive: jest.fn(() => true),
      setManualSize: jest.fn((_index, size) => size),
    };
  }

  function createGesture({ orientation = 'vertical', rtl = false, selectedRanges, axis: axisOverrides } = {}) {
    const grid = createGrid({ rtl, selectedRanges });
    const axis = createAxis(orientation, axisOverrides);
    const owner = createOwner();
    const gesture = new ResizeGesture(grid.hot, axis, owner);

    eventManager = new EventManager({});
    gesture.bindEvents(eventManager);

    return {
      ...grid,
      axis,
      owner,
      gesture,
      handle: () => rootElement.querySelector('.testResizer'),
      guide: () => rootElement.querySelector('.testResizerGuide'),
    };
  }

  function mouse(type, target, { pageX = 0, pageY = 0 } = {}) {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true });

    Object.defineProperty(event, 'pageX', { value: pageX });
    Object.defineProperty(event, 'pageY', { value: pageY });
    target.dispatchEvent(event);
  }

  function afterResizeCalls(hot) {
    return hot.runHooks.mock.calls.filter(([hookName]) => hookName === 'afterTestResize');
  }

  describe('drag', () => {
    it('should store the size the pointer describes and confirm it through the axis hooks', () => {
      const { hot, th, owner, handle } = createGesture({
        // The row axis reports the rendered height rather than the dragged one - the payload must come
        // from the axis, not from the stored size.
        axis: { getHookSize: (_hot, _index, newSize) => newSize + 5 },
      });

      mouse('mouseover', th);
      mouse('mousedown', handle(), { pageY: 10 });
      mouse('mousemove', window, { pageY: 40 });

      expect(owner.setManualSize).toHaveBeenCalledWith(2, 30);

      mouse('mouseup', window);

      expect(hot.runHooks).toHaveBeenCalledWith('beforeTestResize', 35, 2, false);
      expect(hot.runHooks).toHaveBeenCalledWith('afterTestResize', 35, 2, false);
    });

    it('should resize every index of a header selection the drag starts in', () => {
      const range = {
        getTopStartCorner: () => ({ row: 1, col: 0 }),
        getBottomEndCorner: () => ({ row: 3, col: 4 }),
      };
      const { th, owner, handle } = createGesture({ selectedRanges: [range] });

      mouse('mouseover', th);
      mouse('mousedown', handle(), { pageY: 0 });
      mouse('mousemove', window, { pageY: 25 });

      expect(owner.setManualSize.mock.calls).toEqual([[1, 25], [2, 25], [3, 25]]);
    });

    it('should resize only the dragged index when the drag starts outside the selection', () => {
      // The other half of the same rule: the selection covers rows 5-7, the drag starts on row 2.
      // Without the fallback the drag would resize the selected rows and leave the dragged one.
      const range = {
        getTopStartCorner: () => ({ row: 5, col: 0 }),
        getBottomEndCorner: () => ({ row: 7, col: 4 }),
      };
      const { th, owner, handle } = createGesture({ selectedRanges: [range] });

      mouse('mouseover', th);
      mouse('mousedown', handle(), { pageY: 0 });
      mouse('mousemove', window, { pageY: 25 });

      expect(owner.setManualSize.mock.calls).toEqual([[2, 25]]);
    });

    it('should resize only the dragged index when the selection is not a whole-row selection', () => {
      // The gate, not the range, is what limits this one: rows 1-3 DO contain the dragged row 2, so
      // if `isSelectedByHeader` stopped being consulted the drag would resize all three.
      const range = {
        getTopStartCorner: () => ({ row: 1, col: 0 }),
        getBottomEndCorner: () => ({ row: 3, col: 4 }),
      };
      const { th, owner, handle } = createGesture({
        selectedRanges: [range],
        axis: { isSelectedByHeader: () => false },
      });

      mouse('mouseover', th);
      mouse('mousedown', handle(), { pageY: 0 });
      mouse('mousemove', window, { pageY: 25 });

      expect(owner.setManualSize.mock.calls).toEqual([[2, 25]]);
    });

    it('should resize an index once when two selection ranges overlap', () => {
      // Rows 1-3 and 2-4 share rows 2 and 3. Without the `Set` those two get `setManualSize()` twice
      // and their resize hooks fire twice.
      const ranges = [
        {
          getTopStartCorner: () => ({ row: 1, col: 0 }),
          getBottomEndCorner: () => ({ row: 3, col: 4 }),
        },
        {
          getTopStartCorner: () => ({ row: 2, col: 0 }),
          getBottomEndCorner: () => ({ row: 4, col: 4 }),
        },
      ];
      const { th, owner, handle } = createGesture({ selectedRanges: ranges });

      mouse('mouseover', th);
      mouse('mousedown', handle(), { pageY: 0 });
      mouse('mousemove', window, { pageY: 25 });

      expect(owner.setManualSize.mock.calls).toEqual([[1, 25], [2, 25], [3, 25], [4, 25]]);
    });

    it('should do nothing on a mouseup that ends no drag', () => {
      const { hot, th } = createGesture();

      mouse('mouseover', th);
      mouse('mouseup', window);

      expect(hot.runHooks).not.toHaveBeenCalled();
    });
  });

  describe('geometry', () => {
    it('should move the top of the handle for a vertical axis', () => {
      const { th, handle } = createGesture({ orientation: 'vertical' });

      mouse('mouseover', th);

      // Along the axis: the header's top minus the 6px handle offset, plus its height (0 in jsdom).
      expect(handle().style.top).toBe('94px');
      expect(handle().style.left).toBe('50px');
      expect(handle().style.width).toBe('0px');
      expect(handle().style.height).toBe('');
    });

    it('should move the inline start edge of the handle for a horizontal axis', () => {
      const { th, handle } = createGesture({ orientation: 'horizontal' });

      mouse('mouseover', th);

      expect(handle().style.left).toBe('44px');
      expect(handle().style.top).toBe('100px');
      expect(handle().style.height).toBe('0px');
      expect(handle().style.width).toBe('');
    });

    it('should resolve the inline edge when it writes, so RTL enabled after construction moves the right edge', () => {
      const { th, state, handle } = createGesture({ orientation: 'horizontal', rtl: false });

      // Flipped after the gesture was built. A property captured at construction would still write `left`.
      state.rtl = true;
      mouse('mouseover', th);

      expect(handle().style.right).toBe('44px');
      expect(handle().style.left).toBe('');
    });

    // Two grids cannot share one `it()`: `afterEach` tears down whichever grid the module-level
    // `eventManager` and `rootElement` hold, so a second grid built inside the same test leaks the
    // first one's window listeners into the rest of this file whenever an assertion throws first.
    it('should flip the pointer delta under RTL for a horizontal axis', () => {
      const horizontal = createGesture({ orientation: 'horizontal', rtl: true });

      mouse('mouseover', horizontal.th);
      mouse('mousedown', horizontal.handle(), { pageX: 100 });
      // Moving towards the inline start (left under RTL) widens the column.
      mouse('mousemove', window, { pageX: 70 });

      expect(horizontal.owner.setManualSize).toHaveBeenLastCalledWith(3, 30);
    });

    it('should not flip the pointer delta under RTL for a vertical axis', () => {
      const vertical = createGesture({ orientation: 'vertical', rtl: true });

      mouse('mouseover', vertical.th);
      mouse('mousedown', vertical.handle(), { pageY: 100 });
      mouse('mousemove', window, { pageY: 130 });

      expect(vertical.owner.setManualSize).toHaveBeenLastCalledWith(2, 30);
    });
  });

  describe('teardown (DEV-2719)', () => {
    it('should keep a drag in flight across detach(), so its mouseup still confirms the size', () => {
      // `updatePlugin()` runs `disablePlugin(); enablePlugin();` - and so `detach()` - on every
      // `updateSettings()` carrying the plugin's own key, which a framework wrapper sends on every
      // re-render. Resetting the drag there dropped the drag with no after-resize hook.
      const { hot, th, gesture, handle, guide } = createGesture();

      mouse('mouseover', th);
      mouse('mousedown', handle(), { pageY: 0 });
      mouse('mousemove', window, { pageY: 20 });

      // The premise: a drag attaches both elements, so the detach below has something to remove.
      expect(handle().parentNode).toBe(rootElement);
      expect(guide().parentNode).toBe(rootElement);

      gesture.detach();

      expect(rootElement.querySelector('.testResizer')).toBe(null);
      expect(rootElement.querySelector('.testResizerGuide')).toBe(null);

      mouse('mouseup', window);

      expect(afterResizeCalls(hot)).toEqual([['afterTestResize', 20, 2, false]]);
    });

    it('should keep both elements attached, but inactive, after a completed drag', () => {
      const { th, handle, guide } = createGesture();

      mouse('mouseover', th);
      mouse('mousedown', handle(), { pageY: 0 });
      mouse('mousemove', window, { pageY: 20 });
      mouse('mouseup', window);

      expect(handle().parentNode).toBe(rootElement);
      expect(guide().parentNode).toBe(rootElement);
      expect(handle().classList.contains('active')).toBe(false);
      expect(guide().classList.contains('active')).toBe(false);
    });

    it('should abort a drag on a context menu over the handle, and ignore the mouseover that follows it', () => {
      const { hot, th, handle, microtasks } = createGesture();

      mouse('mouseover', th);
      mouse('mousedown', handle(), { pageY: 0 });
      mouse('mousemove', window, { pageY: 20 });

      const handleElement = handle();

      mouse('contextmenu', handleElement);

      expect(rootElement.querySelector('.testResizer')).toBe(null);

      mouse('mouseup', window);

      expect(hot.runHooks).not.toHaveBeenCalled();

      mouse('mouseover', th);

      expect(rootElement.querySelector('.testResizer')).toBe(null);

      microtasks.forEach(callback => callback());
      mouse('mouseover', th);

      expect(rootElement.querySelector('.testResizer')).toBe(handleElement);
    });

    it('should not resize from a double-click window that closes after the owner was disabled', () => {
      const { hot, th, owner, handle, timeouts } = createGesture();

      mouse('mouseover', th);
      mouse('mousedown', handle());
      mouse('mouseup', window);
      mouse('mousedown', handle());
      mouse('mouseup', window);

      expect(hot._registerTimeout).toHaveBeenCalledTimes(1);

      owner.isActive.mockReturnValue(false);
      timeouts[0]();

      expect(hot.runHooks).not.toHaveBeenCalled();
      expect(owner.setManualSize).not.toHaveBeenCalled();

      // The bail resets the window, so a press after a re-enable arms a fresh one.
      owner.isActive.mockReturnValue(true);
      mouse('mouseover', th);
      mouse('mousedown', handle());

      expect(hot._registerTimeout).toHaveBeenCalledTimes(2);
    });
  });

  describe('double-click', () => {
    it('should store the size the before-resize hook answers with', () => {
      const { hot, th, owner, handle, timeouts } = createGesture();

      hot.runHooks.mockImplementation(hookName => (hookName === 'beforeTestResize' ? 55 : undefined));

      mouse('mouseover', th);
      mouse('mousedown', handle());
      mouse('mouseup', window);
      mouse('mousedown', handle());
      mouse('mouseup', window);

      timeouts[0]();

      expect(owner.setManualSize).toHaveBeenCalledWith(2, 55);
      expect(afterResizeCalls(hot)).toEqual([['afterTestResize', 55, 2, true]]);
    });

    it('should not resize from a single press', () => {
      const { hot, th, owner, handle, timeouts } = createGesture();

      mouse('mouseover', th);
      mouse('mousedown', handle());
      mouse('mouseup', window);

      timeouts[0]();

      expect(hot.runHooks).not.toHaveBeenCalled();
      expect(owner.setManualSize).not.toHaveBeenCalled();
    });

    it('should hide the guide as soon as a held double-click autosizes, without detaching it (DEV-1038)', () => {
      // The second mousedown shows the guide and arms the 500ms window. Autosize runs on that
      // timer, not on mouseup, so a hold after the second press used to leave the guide `active`
      // until the button came up. Hide it when autosize runs. Do not detach it: that is the
      // DEV-2719 flicker, and `hideHandleAndGuide()` only strips `active`.
      const { hot, th, owner, handle, guide, timeouts } = createGesture();

      hot.runHooks.mockImplementation(hookName => (hookName === 'beforeTestResize' ? 55 : undefined));

      mouse('mouseover', th);
      mouse('mousedown', handle());
      mouse('mouseup', window);
      mouse('mousedown', handle());

      expect(handle().classList.contains('active')).toBe(true);
      expect(guide().classList.contains('active')).toBe(true);

      timeouts[0]();

      expect(owner.setManualSize).toHaveBeenCalledWith(2, 55);
      expect(afterResizeCalls(hot)).toEqual([['afterTestResize', 55, 2, true]]);
      expect(handle().classList.contains('active')).toBe(false);
      expect(guide().classList.contains('active')).toBe(false);
      expect(handle().parentNode).toBe(rootElement);
      expect(guide().parentNode).toBe(rootElement);

      owner.setManualSize.mockClear();
      hot.runHooks.mockClear();
      mouse('mousemove', window, { pageY: 40 });
      mouse('mouseup', window);

      expect(owner.setManualSize).not.toHaveBeenCalled();
      expect(hot.runHooks).not.toHaveBeenCalled();
    });

    it('should keep the guide active through a held single press whose window closes without autosize', () => {
      // The other half of DEV-1038: a first mousedown that is held is a drag, not an autosize.
      // Closing the 500ms window must not hide the guide while the button is still down, and
      // must not clear `#pressed` – a later mousemove has to keep following the pointer.
      const { th, owner, handle, guide, timeouts } = createGesture();

      mouse('mouseover', th);
      mouse('mousedown', handle(), { pageY: 10 });

      timeouts[0]();

      expect(handle().classList.contains('active')).toBe(true);
      expect(guide().classList.contains('active')).toBe(true);

      mouse('mousemove', window, { pageY: 40 });

      expect(owner.setManualSize).toHaveBeenCalledWith(2, 30);
    });

    it('should keep a drag that starts on the second press alive after the autosize timer', () => {
      // A click on the handle followed by a press that starts dragging before the 500ms window
      // closes: the timer still autosizes and hides the guide (DEV-1038), but `#pressed` stays
      // so later mousemove follows the pointer and mouseup saves that size. `#newSize` already
      // differs from `#startSize` after the in-window move, which is how the timeout tells a
      // drag from a still hold.
      const { hot, th, owner, handle, guide, timeouts } = createGesture();

      hot.runHooks.mockImplementation(hookName => (hookName === 'beforeTestResize' ? 55 : undefined));

      mouse('mouseover', th);
      mouse('mousedown', handle(), { pageY: 10 });
      mouse('mouseup', window);
      mouse('mousedown', handle(), { pageY: 10 });
      mouse('mousemove', window, { pageY: 40 });

      expect(owner.setManualSize).toHaveBeenCalledWith(2, 30);

      timeouts[0]();

      expect(owner.setManualSize).toHaveBeenCalledWith(2, 55);
      expect(afterResizeCalls(hot)).toEqual([['afterTestResize', 55, 2, true]]);
      expect(handle().classList.contains('active')).toBe(false);
      expect(guide().classList.contains('active')).toBe(false);

      owner.setManualSize.mockClear();
      hot.runHooks.mockReset();
      mouse('mousemove', window, { pageY: 70 });

      expect(owner.setManualSize).toHaveBeenCalledWith(2, 60);

      mouse('mouseup', window);

      expect(hot.runHooks).toHaveBeenCalledWith('beforeTestResize', 60, 2, false);
      expect(hot.runHooks).toHaveBeenCalledWith('afterTestResize', 60, 2, false);
    });
  });
});
