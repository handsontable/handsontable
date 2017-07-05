import DisplaySwitch from 'handsontable/plugins/comments/displaySwitch';
import {CellCoords} from 'handsontable/3rdparty/walkontable/src';

describe('Comments', () => {
  describe('DisplaySwitch', () => {
    it('should fill `showDebounced` function properly after constructing object', () => {
      const displaySwitch = new DisplaySwitch(200);

      expect(displaySwitch.showDebounced).toBeFunction();
      expect(displaySwitch.showDebounced.name).toBe('_debounce');
    });

    it('should call `showDebounced` function after triggering `show` function', () => {
      const displaySwitch = new DisplaySwitch(100);
      displaySwitch.showDebounced = jasmine.createSpy('showDebounced');
      const range = {from: new CellCoords(0, 1)};

      displaySwitch.show(range);
      expect(displaySwitch.showDebounced).toHaveBeenCalledWith(range);
    });
  });
});
