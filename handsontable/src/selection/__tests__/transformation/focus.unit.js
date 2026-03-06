import { CellCoords, CellRange } from 'walkontable';
import { FocusTransformation } from '../../transformation/focus';

function createCellRange(row, col, rowFrom = row, columnFrom = col, rowTo = row, columnTo = col) {
  return new CellRange(
    new CellCoords(row, col),
    new CellCoords(rowFrom, columnFrom),
    new CellCoords(rowTo, columnTo)
  );
}

function createSelectionRangeModule(ranges) {
  return {
    current() {
      return ranges[ranges.length - 1];
    },
    peekByIndex(index) {
      let cellRange;

      if (index >= 0 && index < ranges.length) {
        cellRange = ranges[index];
      }

      return cellRange;
    },
    size() {
      return ranges.length;
    }
  };
}

function createTransformationModule(options) {
  return new FocusTransformation(options.range, {
    createCellCoords(row, column) {
      return new CellCoords(row, column);
    },
    visualToRenderableCoords(coords) {
      return coords.clone();
    },
    renderableToVisualCoords(coords) {
      return coords.clone();
    },
    findFirstNonHiddenRenderableRow(visualRowFrom) {
      return visualRowFrom;
    },
    findFirstNonHiddenRenderableColumn(visualColumnFrom) {
      return visualColumnFrom;
    },
    countRenderableRowsInRange(fromRow, toRow) { return toRow - fromRow + 1; },
    countRenderableColumnsInRange(fromCol, toCol) { return toCol - fromCol + 1; },
    countRenderableRows() { return options.countRenderableRows ?? 10; },
    countRenderableColumns() { return options.countRenderableColumns ?? 10; },
    fixedRowsBottom() { return options.fixedRowsBottom ?? 0; },
    minSpareRows() { return options.minSpareRows ?? 0; },
    minSpareCols() { return options.minSpareCols ?? 0; },
    autoWrapRow() { return options.autoWrapRow ?? false; },
    autoWrapCol() { return options.autoWrapCol ?? false; },
  });
}

function transformResult(row, column, layer = 0) {
  return {
    selectionLayer: layer,
    visualCoords: { row, col: column },
  };
}

describe('FocusTransformation class', () => {
  describe('shouldSwitchSelectionLayer()', () => {
    it('should return `true`', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(1, 1, 1, 1, 1, 1),
        ]),
      });

      expect(transform.shouldSwitchSelectionLayer()).toBe(true);
    });
  });

  describe('transformStart()', () => {
    it('should return coords pointed to the next selection layer moved by row delta (positive value)', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(1, 1, 1, 1, 1, 1),
          createCellRange(2, 2, 2, 2, 2, 2),
        ]),
        autoWrapRow: true,
        autoWrapCol: true,
      });

      transform.setActiveLayerIndex(1);

      expect(transform.transformStart(0, 0)).toEqual(transformResult(2, 2, 1));
      expect(transform.transformStart(1, 0)).toEqual(transformResult(1, 1, 0));
      expect(transform.transformStart(1, 0)).toEqual(transformResult(2, 2, 1));
      expect(transform.transformStart(2, 0)).toEqual(transformResult(1, 1, 0));
      expect(transform.transformStart(10, 0)).toEqual(transformResult(2, 2, 1));
    });

    it('should return coords pointed to the next selection layer moved by column delta (positive value)', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(1, 1, 1, 1, 1, 1),
          createCellRange(2, 2, 2, 2, 2, 2),
        ]),
        autoWrapRow: true,
        autoWrapCol: true,
      });

      transform.setActiveLayerIndex(1);

      expect(transform.transformStart(0, 0)).toEqual(transformResult(2, 2, 1));
      expect(transform.transformStart(0, 1)).toEqual(transformResult(1, 1, 0));
      expect(transform.transformStart(0, 1)).toEqual(transformResult(2, 2, 1));
      expect(transform.transformStart(0, 2)).toEqual(transformResult(1, 1, 0));
      expect(transform.transformStart(0, 10)).toEqual(transformResult(2, 2, 1));
    });

    it('should return coords pointed to the next selection layer moved by row delta (negative value)', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(1, 1, 1, 1, 1, 1),
          createCellRange(2, 2, 2, 2, 2, 2),
        ]),
        autoWrapRow: true,
        autoWrapCol: true,
      });

      transform.setActiveLayerIndex(1);

      expect(transform.transformStart(0, 0)).toEqual(transformResult(2, 2, 1));
      expect(transform.transformStart(-1, 0)).toEqual(transformResult(1, 1, 0));
      expect(transform.transformStart(-1, 0)).toEqual(transformResult(2, 2, 1));
      expect(transform.transformStart(-2, 0)).toEqual(transformResult(1, 1, 0));
      expect(transform.transformStart(-10, 0)).toEqual(transformResult(2, 2, 1));
    });

    it('should return coords pointed to the next selection layer moved by column delta (negative value)', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(1, 1, 1, 1, 1, 1),
          createCellRange(2, 2, 2, 2, 2, 2),
        ]),
        autoWrapRow: true,
        autoWrapCol: true,
      });

      transform.setActiveLayerIndex(1);

      expect(transform.transformStart(0, 0)).toEqual(transformResult(2, 2, 1));
      expect(transform.transformStart(0, -1)).toEqual(transformResult(1, 1, 0));
      expect(transform.transformStart(0, -1)).toEqual(transformResult(2, 2, 1));
      expect(transform.transformStart(0, -2)).toEqual(transformResult(1, 1, 0));
      expect(transform.transformStart(0, -10)).toEqual(transformResult(2, 2, 1));
    });
  });

  describe('transformEnd()', () => {
    it('should throw an error when called', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(0, 0, 0, 0, 3, 4),
        ]),
      });

      expect(() => transform.transformEnd(0, 0))
        .toThrow('`transformEnd` is not valid for focus selection use `transformStart` instead');
    });
  });
});
