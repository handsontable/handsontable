import Handsontable from 'handsontable';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

/**
 * An `updateSettings()` call that carries `data` paints the grid once.
 */
describe('Core#updateSettings carrying `data`', () => {
  let container;
  let hot;
  let afterRender;
  let rendererCalls;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    afterRender = jest.fn();
    rendererCalls = 0;

    hot = new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY,
      data: [['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3']],
      columns: [{ data: 0 }, { data: 1 }],
      width: 400,
      height: 200,
      renderer(...args) {
        rendererCalls += 1;

        Handsontable.renderers.TextRenderer.apply(this, args);
      },
      afterRender,
    });
    afterRender.mockClear();
    rendererCalls = 0;
  });

  afterEach(() => {
    hot.destroy();
    container.remove();
  });

  it('should render once when the payload carries new `data`', () => {
    hot.updateSettings({ data: [['X1', 'Y1'], ['X2', 'Y2']] });

    expect(afterRender).toHaveBeenCalledTimes(1);
    // The one paint shows the new rows: the text of the first cell and the number of rendered rows changed.
    expect(hot.getCell(0, 0).textContent).toBe('X1');
    expect(hot.getCell(2, 0)).toBeNull();
    expect(hot.countRenderedRows()).toBe(2);
  });

  it('should render once when the payload carries `columns` and the same `data` array', () => {
    const data = hot.getSourceData();

    hot.updateSettings({ columns: [{ data: 0 }, { data: 1, className: 'changed' }], data });

    expect(afterRender).toHaveBeenCalledTimes(1);
    expect(hot.getCell(0, 1).className).toContain('changed');
  });

  it('should run the cell renderers as often as an update without `data` does', () => {
    const data = hot.getSourceData();

    hot.updateSettings({ columns: [{ data: 0 }, { data: 1 }] });

    const callsWithoutData = rendererCalls;

    rendererCalls = 0;
    hot.updateSettings({ columns: [{ data: 0 }, { data: 1 }], data });

    expect(callsWithoutData).toBeGreaterThan(0);
    expect(rendererCalls).toBe(callsWithoutData);
  });

  it('should render once when the payload has no `data`', () => {
    hot.updateSettings({ columns: [{ data: 0 }, { data: 1, className: 'changed' }] });

    expect(afterRender).toHaveBeenCalledTimes(1);
  });

  it('should still fire `afterUpdateData`, `afterChange` and `afterUpdateSettings` once each', () => {
    const afterUpdateData = jest.fn();
    const afterChange = jest.fn();
    const afterUpdateSettings = jest.fn();

    hot.addHook('afterUpdateData', afterUpdateData);
    hot.addHook('afterChange', afterChange);
    hot.addHook('afterUpdateSettings', afterUpdateSettings);

    hot.updateSettings({ data: [['X1', 'Y1']] });

    expect(afterUpdateData).toHaveBeenCalledTimes(1);
    expect(afterChange).toHaveBeenCalledTimes(1);
    expect(afterUpdateSettings).toHaveBeenCalledTimes(1);
  });

  it('should not leave rendering suspended after the call', () => {
    hot.updateSettings({ data: [['X1', 'Y1']] });

    expect(hot.isRenderSuspended()).toBe(false);
  });

  it('should not leave rendering suspended when an `afterUpdateData` listener throws', () => {
    hot.addHook('afterUpdateData', () => {
      throw new Error('listener');
    });

    expect(() => hot.updateSettings({ data: [['X1', 'Y1']] })).toThrow('listener');
    expect(hot.isRenderSuspended()).toBe(false);
  });

  describe('hook order', () => {
    it('should run `afterUpdateData`, `afterChange` and `afterUpdateSettings` before the one `afterRender`', () => {
      const order = [];

      hot.addHook('afterUpdateData', () => order.push('afterUpdateData'));
      hot.addHook('afterChange', () => order.push('afterChange'));
      hot.addHook('afterUpdateSettings', () => order.push('afterUpdateSettings'));
      hot.addHook('afterRender', () => order.push('afterRender'));

      hot.updateSettings({ data: [['X1', 'Y1']] });

      expect(order).toEqual(['afterUpdateData', 'afterChange', 'afterUpdateSettings', 'afterRender']);
    });

    it('should report rendering as suspended inside `afterUpdateData` and `afterChange`, and not inside `afterRender`', () => {
      const suspended = {};

      hot.addHook('afterUpdateData', () => { suspended.afterUpdateData = hot.isRenderSuspended(); });
      hot.addHook('afterChange', () => { suspended.afterChange = hot.isRenderSuspended(); });
      hot.addHook('afterRender', () => { suspended.afterRender = hot.isRenderSuspended(); });

      hot.updateSettings({ data: [['X1', 'Y1']] });

      expect(suspended).toEqual({ afterUpdateData: true, afterChange: true, afterRender: false });
    });
  });

  describe('the render hold', () => {
    it('should keep the paint of the caller\'s own `suspendRender()` until its `resumeRender()`', () => {
      hot.suspendRender();
      hot.updateSettings({ data: [['X1', 'Y1']] });

      expect(hot.isRenderSuspended()).toBe(true);
      expect(afterRender).not.toHaveBeenCalled();

      hot.resumeRender();

      expect(hot.isRenderSuspended()).toBe(false);
      expect(afterRender).toHaveBeenCalledTimes(1);
    });

    it('should paint after the call when a listener resumes the caller\'s own `suspendRender()`', () => {
      let resumed = false;

      hot.addHook('afterUpdateData', () => {
        if (!resumed) {
          resumed = true;
          hot.resumeRender();
        }
      });

      hot.suspendRender();
      hot.updateSettings({ data: [['X1', 'Y1']] });

      // The listener took the caller's hold away, as it would outside this call, so the call's own paint runs.
      expect(hot.isRenderSuspended()).toBe(false);
      expect(afterRender).toHaveBeenCalled();
      expect(hot.getCell(0, 0).textContent).toBe('X1');
    });

    it('should paint once after a `batch()` that holds the call', () => {
      hot.batch(() => {
        hot.updateSettings({ data: [['X1', 'Y1']] });
        hot.updateSettings({ data: [['X2', 'Y2']] });
      });

      expect(afterRender).toHaveBeenCalledTimes(1);
      expect(hot.getDataAtCell(0, 0)).toBe('X2');
    });

    it('should paint once when a listener nests another `updateSettings()` carrying `data`', () => {
      let nested = false;

      hot.addHook('afterUpdateData', () => {
        if (!nested) {
          nested = true;
          hot.updateSettings({ data: [['N1', 'M1']] });
        }
      });

      hot.updateSettings({ data: [['X1', 'Y1']] });

      expect(afterRender).toHaveBeenCalledTimes(1);
      expect(hot.isRenderSuspended()).toBe(false);
      expect(hot.getDataAtCell(0, 0)).toBe('N1');
    });

    it('should not leave the counter below zero when a listener resumes rendering once too often', () => {
      let resumed = false;

      hot.addHook('afterUpdateData', () => {
        if (!resumed) {
          resumed = true;
          hot.resumeRender();
        }
      });

      hot.updateSettings({ data: [['X1', 'Y1']] });

      expect(hot.isRenderSuspended()).toBe(false);

      // A counter left at -1 would absorb this call, and the grid would paint inside it.
      hot.suspendRender();

      expect(hot.isRenderSuspended()).toBe(true);

      hot.resumeRender();
    });

    it('should render the grid being built once', () => {
      const afterRenderOnInit = jest.fn();
      const otherContainer = document.createElement('div');

      document.body.appendChild(otherContainer);

      const other = new Handsontable(otherContainer, {
        licenseKey: TEST_LICENSE_KEY,
        data: [['A1', 'B1'], ['A2', 'B2']],
        width: 400,
        height: 200,
        afterRender: afterRenderOnInit,
      });

      expect(afterRenderOnInit).toHaveBeenCalledTimes(1);

      other.destroy();
      otherContainer.remove();
    });
  });

  describe('a call that throws after the data phase', () => {
    it('should paint the new rows before it rethrows', () => {
      hot.addHook('afterUpdateSettings', () => {
        throw new Error('listener');
      });

      expect(() => hot.updateSettings({ data: [['X1', 'Y1']] })).toThrow('listener');

      expect(hot.getDataAtCell(0, 0)).toBe('X1');
      expect(hot.getCell(0, 0).textContent).toBe('X1');
      expect(hot.isRenderSuspended()).toBe(false);
    });
  });

  describe('the cell meta memo while rendering is held by the caller', () => {
    let cellsCalls;

    beforeEach(() => {
      cellsCalls = 0;
      hot.updateSettings({
        cells() {
          cellsCalls += 1;

          return {};
        },
      });
      hot.getCellMeta(0, 0);
    });

    it('should keep the memo for a settings-only call', () => {
      hot.suspendRender();

      const callsBefore = cellsCalls;

      hot.updateSettings({ width: 300 });
      hot.getCellMeta(0, 0);

      expect(cellsCalls).toBe(callsBefore);

      hot.resumeRender();
    });

    it('should clear the memo for a call that carries `data`', () => {
      hot.suspendRender();

      const callsBefore = cellsCalls;

      hot.updateSettings({ data: [['X1', 'Y1']] });
      hot.getCellMeta(0, 0);

      expect(cellsCalls).toBeGreaterThan(callsBefore);

      hot.resumeRender();
    });
  });

  describe('cell meta read while the call applies its settings', () => {
    it('should resolve a `cells()` function against the new data in an `afterUpdateSettings` listener', () => {
      hot.updateSettings({
        cells(row, col) {
          return { readOnly: this.instance.getDataAtCell(row, col) === 'X1' };
        },
      });

      expect(hot.getCellMeta(0, 0).readOnly).toBe(false);

      let readOnlyInHook;

      hot.addHook('afterUpdateSettings', () => {
        readOnlyInHook = hot.getCellMeta(0, 0).readOnly;
      });

      hot.updateSettings({ data: [['X1', 'Y1'], ['X2', 'Y2']] });

      expect(readOnlyInHook).toBe(true);
    });
  });
});
