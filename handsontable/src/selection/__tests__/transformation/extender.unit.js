import { CellCoords, CellRange } from 'walkontable';
import { ExtenderTransformation } from '../../transformation/extender';

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
  return new ExtenderTransformation(options.range, {
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

describe('ExtenderTransformation class', () => {
  describe('shouldSwitchSelectionLayer()', () => {
    it('should return `false`', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(1, 1, 1, 1, 1, 1),
        ]),
      });

      expect(transform.shouldSwitchSelectionLayer()).toBe(false);
    });
  });
});
