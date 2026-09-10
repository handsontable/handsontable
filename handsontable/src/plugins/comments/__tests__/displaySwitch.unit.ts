import DisplaySwitch from 'handsontable/plugins/comments/displaySwitch';
import { CellCoords } from 'handsontable/3rdparty/walkontable/src';

const DEFAULT_HIDE_DELAY = 250;

describe('Comments', () => {
  describe('DisplaySwitch', () => {
    it('should fill `showDebounced` function properly after constructing object', () => {
      const displaySwitch = new DisplaySwitch(200);

      expect(typeof displaySwitch.showDebounced).toBe('function');
      expect(displaySwitch.showDebounced.name).toBe('_debounce');
    });
  });

  describe('DisplaySwitch.show', () => {
    it('should call `showDebounced` function after triggering `show` function', () => {
      const displaySwitch = new DisplaySwitch(200);

      displaySwitch.showDebounced = jasmine.createSpy('showDebounced');
      const range = { from: new CellCoords(0, 1) };

      displaySwitch.show(range);

      expect(displaySwitch.showDebounced).toHaveBeenCalledWith(range);
    });

    it('should set `wasLastActionShow` variable to `true`', () => {
      const displaySwitch = new DisplaySwitch(200);

      displaySwitch.showDebounced = jasmine.createSpy('showDebounced');
      const range = { from: new CellCoords(0, 1) };

      displaySwitch.show(range);

      expect(displaySwitch.wasLastActionShow).toBe(true);
    });

    it('should trigger `show` local hook after calling `show` function', () => {
      const displaySwitch = new DisplaySwitch(700);
      const onShow = jasmine.createSpy('onShow');
      const range = { from: new CellCoords(0, 1) };

      jest.useFakeTimers();

      displaySwitch.addLocalHook('show', onShow);
      displaySwitch.show(range);

      jest.runAllTimers();

      expect(onShow).toHaveBeenCalledWith(0, 1);
    });

    it('should not trigger `show` local hook after calling `show` function as not last one', () => {
      const displaySwitch = new DisplaySwitch(700);
      const onShow = jasmine.createSpy('onShow');
      const range = { from: new CellCoords(0, 1) };

      jest.useFakeTimers();

      displaySwitch.addLocalHook('show', onShow);
      displaySwitch.show(range);
      displaySwitch.hide();

      jest.runAllTimers();

      expect(onShow).not.toHaveBeenCalled();
    });
  });

  describe('DisplaySwitch.hide', () => {
    it('should call timeout inside `hide` function after predefined delay', () => {
      const displaySwitch = new DisplaySwitch(700);

      jest.useFakeTimers();
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      setTimeoutSpy.mockClear();

      displaySwitch.hide();

      expect(setTimeoutSpy.mock.calls.length).toBe(1);
      expect(setTimeoutSpy.mock.calls[0][1]).toBe(DEFAULT_HIDE_DELAY);
    });

    it('should set `wasLastActionShow` variable to `false`', () => {
      const displaySwitch = new DisplaySwitch(200);

      displaySwitch.showDebounced = jasmine.createSpy('showDebounced');

      displaySwitch.hide();

      expect(displaySwitch.wasLastActionShow).toBe(false);
    });

    it('should trigger `hide` local hook after calling `hide` function', () => {
      const displaySwitch = new DisplaySwitch(700);
      const onHide = jasmine.createSpy('onHide');

      jest.useFakeTimers();

      displaySwitch.addLocalHook('hide', onHide);
      displaySwitch.hide();

      jest.runAllTimers();

      expect(onHide).toHaveBeenCalled();
    });

    it('should not trigger `hide` local hook after calling `hide` function as not last one', () => {
      const displaySwitch = new DisplaySwitch(700);
      const onHide = jasmine.createSpy('onHide');
      const range = { from: new CellCoords(0, 1) };

      jest.useFakeTimers();

      displaySwitch.addLocalHook('hide', onHide);
      displaySwitch.hide();
      displaySwitch.show(range);

      jest.runAllTimers();

      expect(onHide).not.toHaveBeenCalled();
    });

    it('should set timer properly', () => {
      const displaySwitch = new DisplaySwitch(700);

      displaySwitch.hide();

      const savedhidingTimer = displaySwitch.hidingTimer;

      expect(typeof savedhidingTimer).toBe('number');

      displaySwitch.hide();

      expect(savedhidingTimer).not.toEqual(displaySwitch.hidingTimer);
    });
  });

  describe('DisplaySwitch.showDebounced', () => {
    it('should call `showDebounced` function after defined delay', () => {
      const displaySwitch = new DisplaySwitch(1000);
      const range = { from: new CellCoords(0, 1) };

      jest.useFakeTimers();
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      setTimeoutSpy.mockClear();

      displaySwitch.showDebounced(range);

      expect(setTimeoutSpy.mock.calls.length).toBe(1);
      expect(setTimeoutSpy.mock.calls[0][1]).toBe(1000);
    });
  });

  describe('DisplaySwitch.updateDelay', () => {
    it('should update `showDebounced` function delay', () => {
      const displaySwitch = new DisplaySwitch(1000);
      const range = { from: new CellCoords(0, 1) };
      const cachedShowDebounced = jasmine.createSpy('cachedShowDebounced');

      // The real value is always a `debounce()` result, which carries `cancel` - and `updateDelay`
      // calls it before replacing the function, so the stub has to carry it too.
      cachedShowDebounced.cancel = jasmine.createSpy('cancel');

      displaySwitch.showDebounced = cachedShowDebounced;

      jest.useFakeTimers();
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      setTimeoutSpy.mockClear();

      displaySwitch.updateDelay(800);

      expect(cachedShowDebounced).not.toBe(displaySwitch.showDebounced);

      displaySwitch.show(range);
      jest.runAllTimers();

      expect(cachedShowDebounced).not.toHaveBeenCalled();
      expect(setTimeoutSpy.mock.calls.length).toBe(1);
      expect(setTimeoutSpy.mock.calls[0][1]).toBe(800);
    });

    it('should keep a pending show when the delay did not change', () => {
      const displaySwitch = new DisplaySwitch(700);
      const onShow = jasmine.createSpy('onShow');
      const range = { from: new CellCoords(0, 1) };

      jest.useFakeTimers();

      displaySwitch.addLocalHook('show', onShow);
      displaySwitch.show(range);

      // The common call by a distance: `updatePlugin()` reaches `updateDelay()` on every
      // `updateSettings()`, and the wrappers re-send unchanged keys on ordinary commits. A hover
      // the user already started must survive one, or the comment never appears until the pointer
      // moves again.
      displaySwitch.updateDelay(700);

      jest.runAllTimers();

      expect(onShow).toHaveBeenCalledTimes(1);
      expect(onShow).toHaveBeenCalledWith(0, 1);
    });

    it('should carry a pending show over to the rebuilt debounced function', () => {
      const displaySwitch = new DisplaySwitch(700);
      const onShow = jasmine.createSpy('onShow');
      const range = { from: new CellCoords(0, 1) };

      jest.useFakeTimers();

      displaySwitch.addLocalHook('show', onShow);
      displaySwitch.show(range);

      // A real delay change does rebuild, and the pending hover has to come with it - exactly once,
      // so neither the old timer nor the new one is left to fire on its own.
      displaySwitch.updateDelay(300);

      jest.runAllTimers();

      expect(onShow).toHaveBeenCalledTimes(1);
      expect(onShow).toHaveBeenCalledWith(0, 1);
    });

    it('should let `keepVisible` cancel a show carried over by a rebuild', () => {
      const displaySwitch = new DisplaySwitch(700);
      const onShow = jasmine.createSpy('onShow');
      const range = { from: new CellCoords(0, 1) };

      jest.useFakeTimers();

      displaySwitch.addLocalHook('show', onShow);
      displaySwitch.show(range);
      displaySwitch.updateDelay(300);

      // The replaced function keeps its timer in its own closure. Left running, it still closes
      // over this instance and shows a comment that `keepVisible()` cannot reach, which is how the
      // editor swapped to another cell while the pointer rested on it.
      displaySwitch.keepVisible();

      jest.runAllTimers();

      expect(onShow).not.toHaveBeenCalled();
    });
  });

  describe('DisplaySwitch.cancelHiding', () => {
    it('should not call function after delay', () => {
      const displaySwitch = new DisplaySwitch(700);
      const onHide = jasmine.createSpy('onHide');

      jest.useFakeTimers();
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      setTimeoutSpy.mockClear();

      displaySwitch.addLocalHook('hide', onHide);
      displaySwitch.hide();
      displaySwitch.cancelHiding();

      jest.runAllTimers();

      expect(setTimeoutSpy.mock.calls.length).toBe(1);
      expect(onHide).not.toHaveBeenCalled();
    });

    it('should set timer value to `null`', () => {
      const displaySwitch = new DisplaySwitch(700);
      const onHide = jasmine.createSpy('onHide');

      jest.useFakeTimers();

      displaySwitch.addLocalHook('hide', onHide);
      displaySwitch.hide();
      displaySwitch.cancelHiding();

      jest.runAllTimers();

      expect(displaySwitch.hidingTimer).toBeNull();
    });
  });

  describe('DisplaySwitch.destroy', () => {
    it('should clear all `localHooks`', () => {
      const displaySwitch = new DisplaySwitch(1000);

      displaySwitch.clearLocalHooks = jasmine.createSpy('clearLocalHooks');

      displaySwitch.destroy();

      expect(displaySwitch.clearLocalHooks).toHaveBeenCalled();
    });
  });
});
