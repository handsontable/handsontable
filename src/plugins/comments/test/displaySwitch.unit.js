import DisplaySwitch from 'handsontable/plugins/comments/displaySwitch';
import {CellCoords} from 'handsontable/3rdparty/walkontable/src';

const DEFAULT_HIDE_DELAY = 250;

describe('Comments', () => {
  describe('DisplaySwitch', () => {
    it('should fill `showDebounced` function properly after constructing object', () => {
      const displaySwitch = new DisplaySwitch(200);

      expect(typeof displaySwitch.showDebounced).toBe('function');
      expect(displaySwitch.showDebounced.name).toBe('_debounce');
    });

    it('should call `showDebounced` function after triggering `show` function', () => {
      const displaySwitch = new DisplaySwitch(200);
      displaySwitch.showDebounced = jasmine.createSpy('showDebounced');
      const range = {from: new CellCoords(0, 1)};

      displaySwitch.show(range);
      expect(displaySwitch.showDebounced).toHaveBeenCalledWith(range);
    });

    it('should call `showDebounced` function after defined delay', () => {
      const displaySwitch = new DisplaySwitch(1000);
      const range = {from: new CellCoords(0, 1)};

      jest.useFakeTimers();

      displaySwitch.show(range);

      expect(setTimeout.mock.calls.length).toBe(1);
      expect(setTimeout.mock.calls[0][1]).toBe(1000);
    });

    it('should call timeout inside `hide` function after predefined delay', () => {
      const displaySwitch = new DisplaySwitch(700);

      jest.useFakeTimers();

      displaySwitch.hide();

      expect(setTimeout.mock.calls.length).toBe(1);
      expect(setTimeout.mock.calls[0][1]).toBe(DEFAULT_HIDE_DELAY);
    });

    it('should set properly `wasLastActionShow` variable #1', () => {
      const displaySwitch = new DisplaySwitch(700);
      const range = {from: new CellCoords(0, 1)};

      displaySwitch.show(range);
      displaySwitch.show(range);
      displaySwitch.hide();
      displaySwitch.hide();
      displaySwitch.show(range);
      displaySwitch.hide();

      expect(displaySwitch.wasLastActionShow).toBe(false);
    });

    it('should set properly `wasLastActionShow` variable #2', () => {
      const displaySwitch = new DisplaySwitch(700);
      const range = {from: new CellCoords(0, 1)};

      displaySwitch.show(range);
      displaySwitch.show(range);
      displaySwitch.hide();
      displaySwitch.hide();
      displaySwitch.show(range);
      
      expect(displaySwitch.wasLastActionShow).toBe(true);
    });
  });
});
