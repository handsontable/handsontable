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

      displaySwitch.hide();

      expect(setTimeout.mock.calls.length).toBe(1);
      expect(setTimeout.mock.calls[0][1]).toBe(DEFAULT_HIDE_DELAY);
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

      displaySwitch.showDebounced(range);

      expect(setTimeout.mock.calls.length).toBe(1);
      expect(setTimeout.mock.calls[0][1]).toBe(1000);
    });
  });

  describe('DisplaySwitch.updateDelay', () => {
    it('should update `showDebounced` function delay', () => {
      const displaySwitch = new DisplaySwitch(1000);
      const range = { from: new CellCoords(0, 1) };
      const cachedShowDebounced = jasmine.createSpy('cachedShowDebounced');

      displaySwitch.showDebounced = cachedShowDebounced;

      jest.useFakeTimers();

      displaySwitch.updateDelay(800);

      expect(cachedShowDebounced).not.toBe(displaySwitch.showDebounced);

      displaySwitch.show(range);
      jest.runAllTimers();

      expect(cachedShowDebounced).not.toHaveBeenCalled();
      expect(setTimeout.mock.calls.length).toBe(1);
      expect(setTimeout.mock.calls[0][1]).toBe(800);
    });
  });

  describe('DisplaySwitch.cancelHiding', () => {
    it('should not call function after delay', () => {
      const displaySwitch = new DisplaySwitch(700);
      const onHide = jasmine.createSpy('onHide');

      jest.useFakeTimers();

      displaySwitch.addLocalHook('hide', onHide);
      displaySwitch.hide();
      displaySwitch.cancelHiding();

      jest.runAllTimers();

      expect(setTimeout.mock.calls.length).toBe(1);
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
