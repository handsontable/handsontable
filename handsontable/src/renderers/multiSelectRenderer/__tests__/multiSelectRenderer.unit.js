import {
  RENDERER_TYPE,
  multiSelectRenderer,
} from '../';
import {
  getRegisteredRendererNames,
  getRenderer,
  registerRenderer,
} from '../../registry';
import {
  registerCellType,
  MultiSelectCellType,
} from '../../../cellTypes';

registerCellType(MultiSelectCellType);

describe('multiSelectRenderer', () => {
  describe('registering', () => {
    it('should register renderer', () => {
      registerRenderer(RENDERER_TYPE, multiSelectRenderer);

      expect(getRegisteredRendererNames()).toEqual([RENDERER_TYPE]);
      expect(getRenderer(RENDERER_TYPE)).toBeInstanceOf(Function);
    });
  });

  describe('reading the source data (#12812)', () => {
    it('should read source data using the physical row and the visual column index', () => {
      // `getSourceDataAtCell` expects a physical row but a visual column. Converting the
      // column to a physical index here double-translates it once columns are reordered,
      // which made the renderer display a neighbouring column's value.
      const visualRow = 2;
      const visualColumn = 3;
      const physicalRow = 7;
      const getSourceDataAtCell = jest.fn(() => []);
      const toPhysicalColumn = jest.fn(() => 9);
      const hotInstance = {
        rootDocument: document,
        getSettings: () => ({ ariaTags: false }),
        toPhysicalRow: () => physicalRow,
        toPhysicalColumn,
        getSourceDataAtCell,
      };
      const TD = document.createElement('td');

      multiSelectRenderer(hotInstance, TD, visualRow, visualColumn, visualColumn, 'value', {});

      expect(getSourceDataAtCell).toHaveBeenCalledWith(physicalRow, visualColumn);
      expect(toPhysicalColumn).not.toHaveBeenCalled();
    });
  });
});
