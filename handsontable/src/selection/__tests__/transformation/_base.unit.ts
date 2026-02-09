import { CellCoords, CellRange } from 'walkontable';
import { BaseTransformation } from '../../transformation/_base';

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
    }
  };
}

function createTransformationModule(options) {
  class Transformation extends BaseTransformation {
    calculateOffset() {
      return options.offsetSize ?? {
        x: 0,
        y: 0,
      };
    }

    countRenderableRows() {
      return this.tableApi.countRenderableRows();
    }

    countRenderableColumns() {
      return this.tableApi.countRenderableColumns();
    }

    shouldSwitchSelectionLayer() {
      return false;
    }
  }

  return new Transformation(options.range, {
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

describe('BaseTransformation class', () => {
  describe('setActiveLayerIndex()', () => {
    it('should process the range based on the active layer index', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(1, 1, 1, 1, 1, 1),
          createCellRange(2, 2, 2, 2, 2, 2),
          createCellRange(3, 3, 3, 3, 3, 3),
        ])
      });

      transform.setActiveLayerIndex(1);

      expect(transform.transformStart(1, 2)).toEqual(transformResult(3, 4, 1));

      transform.setActiveLayerIndex(0);

      expect(transform.transformStart(1, 2)).toEqual(transformResult(2, 3, 0));

      transform.setActiveLayerIndex(2);

      expect(transform.transformStart(1, 2)).toEqual(transformResult(4, 5, 2));
    });
  });

  describe('transformStart()', () => {
    it('should calculate new coords based on "highlight" CellRange property', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(null, null, 0, 0, 0, 0),
        ])
      });

      expect(transform.transformStart(0, 0)).toEqual(transformResult(null, null, 0));
    });

    it('should return coords with row moved by row delta (positive value)', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(1, 1, 1, 1, 1, 1),
        ])
      });

      expect(transform.transformStart(0, 0)).toEqual(transformResult(1, 1, 0));
      expect(transform.transformStart(4, 0)).toEqual(transformResult(5, 1, 0));
    });

    it('should return coords with column moved by column delta (positive value)', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(1, 1, 1, 1, 1, 1),
        ])
      });

      expect(transform.transformStart(0, 0)).toEqual(transformResult(1, 1, 0));
      expect(transform.transformStart(0, 4)).toEqual(transformResult(1, 5, 0));
    });

    it('should return coords with row moved by row delta (negative value)', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(8, 8, 8, 8, 8, 8),
        ])
      });

      expect(transform.transformStart(-4, 0)).toEqual(transformResult(4, 8, 0));
    });

    it('should return coords with column moved by column delta (negative value)', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(8, 8, 8, 8, 8, 8),
        ])
      });

      expect(transform.transformStart(0, -4)).toEqual(transformResult(8, 4, 0));
    });

    it('should not return coords that point out of the table when row delta is bigger than total number of rows (positive value)', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(2, 2, 2, 2, 2, 2),
          createCellRange(1, 1, 1, 1, 1, 1),
        ])
      });

      transform.setActiveLayerIndex(1);

      expect(transform.transformStart(8, 0)).toEqual(transformResult(9, 1, 1));
      expect(transform.transformStart(9, 0)).toEqual(transformResult(9, 1, 1));
      expect(transform.transformStart(999, 0)).toEqual(transformResult(9, 1, 1));
    });

    it('should not return coords that point out of the table when column delta is bigger than total number of columns (positive value)', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(2, 2, 2, 2, 2, 2),
          createCellRange(1, 1, 1, 1, 1, 1),
        ])
      });

      transform.setActiveLayerIndex(1);

      expect(transform.transformStart(0, 8)).toEqual(transformResult(1, 9, 1));
      expect(transform.transformStart(0, 9)).toEqual(transformResult(1, 9, 1));
      expect(transform.transformStart(0, 999)).toEqual(transformResult(1, 9, 1));
    });

    it('should not return coords that point out of the table when row delta is bigger than total number of rows (negative value)', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(1, 1, 1, 1, 1, 1),
          createCellRange(9, 9, 9, 9, 9, 9),
        ])
      });

      transform.setActiveLayerIndex(1);

      expect(transform.transformStart(-8, 0)).toEqual(transformResult(1, 9, 1));
      expect(transform.transformStart(-9, 0)).toEqual(transformResult(0, 9, 1));
      expect(transform.transformStart(-999, 0)).toEqual(transformResult(0, 9, 1));
    });

    it('should not return coords that point out of the table when column delta is bigger than total number of columns (negative value)', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(1, 1, 1, 1, 1, 1),
          createCellRange(9, 9, 9, 9, 9, 9),
        ])
      });

      transform.setActiveLayerIndex(1);

      expect(transform.transformStart(0, -8)).toEqual(transformResult(9, 1, 1));
      expect(transform.transformStart(0, -9)).toEqual(transformResult(9, 0, 1));
      expect(transform.transformStart(0, -999)).toEqual(transformResult(9, 0, 1));
    });

    it('should return coords that points to the first column when the offset is not used', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(5, 2, 5, 2, 5, 2),
        ])
      });

      expect(transform.transformStart(0, -3)).toEqual(transformResult(5, 0, 0));
      expect(transform.transformStart(0, -4)).toEqual(transformResult(5, 0, 0));
      expect(transform.transformStart(0, -5)).toEqual(transformResult(5, 0, 0));
      expect(transform.transformStart(0, -6)).toEqual(transformResult(5, 0, 0));
      expect(transform.transformStart(0, -999)).toEqual(transformResult(5, 0, 0));
    });

    it('should return coords that points to the first row when the offset is not used', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(2, 5, 2, 5, 2, 5),
        ])
      });

      expect(transform.transformStart(-3, 0)).toEqual(transformResult(0, 5, 0));
      expect(transform.transformStart(-4, 0)).toEqual(transformResult(0, 5, 0));
      expect(transform.transformStart(-5, 0)).toEqual(transformResult(0, 5, 0));
      expect(transform.transformStart(-6, 0)).toEqual(transformResult(0, 5, 0));
      expect(transform.transformStart(-999, 0)).toEqual(transformResult(0, 5, 0));
    });

    it('should return coords that points to the next column when the row delta is bigger than table rows count ' +
       'and `autoWrapCol` is enabled', () => {
      {
        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(5, 0, 5, 0, 5, 0),
          ]),
          autoWrapCol: true,
        });

        expect(transform.transformStart(5, 0)).toEqual(transformResult(0, 1, 0));
        expect(transform.transformStart(7, 0)).toEqual(transformResult(2, 1, 0));
        expect(transform.transformStart(10, 0)).toEqual(transformResult(5, 1, 0));
        expect(transform.transformStart(13, 0)).toEqual(transformResult(8, 1, 0));
        expect(transform.transformStart(999, 0)).toEqual(transformResult(9, 1, 0));
        expect(transform.transformStart(5, -1)).toEqual(transformResult(0, 0, 0));
        expect(transform.transformStart(5, -2)).toEqual(transformResult(0, 0, 0));
        expect(transform.transformStart(5, -999)).toEqual(transformResult(0, 0, 0));
        expect(transform.transformStart(5, 1)).toEqual(transformResult(0, 2, 0));
        expect(transform.transformStart(5, 2)).toEqual(transformResult(0, 3, 0));
        expect(transform.transformStart(5, 7)).toEqual(transformResult(0, 8, 0));
        expect(transform.transformStart(5, 8)).toEqual(transformResult(0, 9, 0));
        expect(transform.transformStart(5, 9)).toEqual(transformResult(0, 0, 0));
        expect(transform.transformStart(5, 999)).toEqual(transformResult(0, 9, 0));
      }
      {
        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(5, 5, 5, 5, 5, 5),
          ]),
          autoWrapCol: true,
        });

        expect(transform.transformStart(5, 0)).toEqual(transformResult(0, 6, 0));
        expect(transform.transformStart(7, 0)).toEqual(transformResult(2, 6, 0));
        expect(transform.transformStart(10, 0)).toEqual(transformResult(5, 6, 0));
        expect(transform.transformStart(999, 0)).toEqual(transformResult(9, 6, 0));
        expect(transform.transformStart(5, -1)).toEqual(transformResult(0, 5, 0));
        expect(transform.transformStart(5, -2)).toEqual(transformResult(0, 4, 0));
        expect(transform.transformStart(5, -999)).toEqual(transformResult(0, 0, 0));
        expect(transform.transformStart(5, 1)).toEqual(transformResult(0, 7, 0));
        expect(transform.transformStart(5, 2)).toEqual(transformResult(0, 8, 0));
        expect(transform.transformStart(5, 3)).toEqual(transformResult(0, 9, 0));
        expect(transform.transformStart(5, 4)).toEqual(transformResult(0, 0, 0));
        expect(transform.transformStart(5, 999)).toEqual(transformResult(0, 9, 0));
      }
      {
        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(5, 9, 5, 9, 5, 9),
          ]),
          autoWrapCol: true,
        });

        expect(transform.transformStart(5, 0)).toEqual(transformResult(0, 0, 0));
        expect(transform.transformStart(7, 0)).toEqual(transformResult(2, 0, 0));
        expect(transform.transformStart(10, 0)).toEqual(transformResult(5, 0, 0));
        expect(transform.transformStart(999, 0)).toEqual(transformResult(9, 0, 0));
        expect(transform.transformStart(5, 1)).toEqual(transformResult(0, 1, 0));
        expect(transform.transformStart(5, 2)).toEqual(transformResult(0, 2, 0));
        expect(transform.transformStart(5, 8)).toEqual(transformResult(0, 8, 0));
        expect(transform.transformStart(5, 9)).toEqual(transformResult(0, 9, 0));
        expect(transform.transformStart(5, 999)).toEqual(transformResult(0, 9, 0));
      }
    });

    it('should return coords that points to the previous column when the row delta is lower than the table rows count ' +
       'and `autoWrapCol` is enabled', () => {
      {
        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(5, 0, 5, 0, 5, 0),
          ]),
          autoWrapCol: true,
        });

        expect(transform.transformStart(-6, 0)).toEqual(transformResult(9, 9, 0));
        expect(transform.transformStart(-12, 0)).toEqual(transformResult(3, 9, 0));
        expect(transform.transformStart(-15, 0)).toEqual(transformResult(0, 9, 0));
        expect(transform.transformStart(-16, 0)).toEqual(transformResult(0, 9, 0));
        expect(transform.transformStart(-999, 0)).toEqual(transformResult(0, 9, 0));
        expect(transform.transformStart(-6, -1)).toEqual(transformResult(9, 8, 0));
        expect(transform.transformStart(-6, -2)).toEqual(transformResult(9, 7, 0));
        expect(transform.transformStart(-6, -3)).toEqual(transformResult(9, 6, 0));
        expect(transform.transformStart(-6, -9)).toEqual(transformResult(9, 0, 0));
        expect(transform.transformStart(-6, -10)).toEqual(transformResult(9, 0, 0));
        expect(transform.transformStart(-6, -999)).toEqual(transformResult(9, 0, 0));
        expect(transform.transformStart(-6, 1)).toEqual(transformResult(9, 0, 0));
        expect(transform.transformStart(-6, 2)).toEqual(transformResult(9, 1, 0));
        expect(transform.transformStart(-6, 999)).toEqual(transformResult(9, 9, 0));
      }
      {
        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(5, 5, 5, 5, 5, 5),
          ]),
          autoWrapCol: true,
        });

        expect(transform.transformStart(-6, 0)).toEqual(transformResult(9, 4, 0));
        expect(transform.transformStart(-12, 0)).toEqual(transformResult(3, 4, 0));
        expect(transform.transformStart(-15, 0)).toEqual(transformResult(0, 4, 0));
        expect(transform.transformStart(-16, 0)).toEqual(transformResult(0, 4, 0));
        expect(transform.transformStart(-999, 0)).toEqual(transformResult(0, 4, 0));
        expect(transform.transformStart(-6, -1)).toEqual(transformResult(9, 3, 0));
        expect(transform.transformStart(-6, -2)).toEqual(transformResult(9, 2, 0));
        expect(transform.transformStart(-6, -3)).toEqual(transformResult(9, 1, 0));
        expect(transform.transformStart(-6, -4)).toEqual(transformResult(9, 0, 0));
        expect(transform.transformStart(-6, -5)).toEqual(transformResult(9, 9, 0));
        expect(transform.transformStart(-6, -999)).toEqual(transformResult(9, 0, 0));
        expect(transform.transformStart(-6, 1)).toEqual(transformResult(9, 5, 0));
        expect(transform.transformStart(-6, 2)).toEqual(transformResult(9, 6, 0));
        expect(transform.transformStart(-6, 999)).toEqual(transformResult(9, 9, 0));
      }
      {
        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(5, 9, 5, 9, 5, 9),
          ]),
          autoWrapCol: true,
        });

        expect(transform.transformStart(-6, 0)).toEqual(transformResult(9, 8, 0));
        expect(transform.transformStart(-12, 0)).toEqual(transformResult(3, 8, 0));
        expect(transform.transformStart(-15, 0)).toEqual(transformResult(0, 8, 0));
        expect(transform.transformStart(-16, 0)).toEqual(transformResult(0, 8, 0));
        expect(transform.transformStart(-999, 0)).toEqual(transformResult(0, 8, 0));
        expect(transform.transformStart(-6, -1)).toEqual(transformResult(9, 7, 0));
        expect(transform.transformStart(-6, -2)).toEqual(transformResult(9, 6, 0));
        expect(transform.transformStart(-6, -3)).toEqual(transformResult(9, 5, 0));
        expect(transform.transformStart(-6, -4)).toEqual(transformResult(9, 4, 0));
        expect(transform.transformStart(-6, -5)).toEqual(transformResult(9, 3, 0));
        expect(transform.transformStart(-6, -999)).toEqual(transformResult(9, 0, 0));
        expect(transform.transformStart(-6, 1)).toEqual(transformResult(9, 9, 0));
        expect(transform.transformStart(-6, 2)).toEqual(transformResult(9, 9, 0));
        expect(transform.transformStart(-6, 999)).toEqual(transformResult(9, 9, 0));
      }
    });

    it('should return coords that points to the next row when the column delta is bigger than table columns count ' +
       'and `autoWrapRow` is enabled', () => {
      {
        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(0, 5, 0, 5, 0, 5),
          ]),
          autoWrapRow: true,
        });

        expect(transform.transformStart(0, 5)).toEqual(transformResult(1, 0, 0));
        expect(transform.transformStart(0, 7)).toEqual(transformResult(1, 2, 0));
        expect(transform.transformStart(0, 10)).toEqual(transformResult(1, 5, 0));
        expect(transform.transformStart(0, 13)).toEqual(transformResult(1, 8, 0));
        expect(transform.transformStart(0, 999)).toEqual(transformResult(1, 9, 0));
        expect(transform.transformStart(-1, 5)).toEqual(transformResult(0, 0, 0));
        expect(transform.transformStart(-2, 5)).toEqual(transformResult(0, 0, 0));
        expect(transform.transformStart(-999, 5)).toEqual(transformResult(0, 0, 0));
        expect(transform.transformStart(1, 5)).toEqual(transformResult(2, 0, 0));
        expect(transform.transformStart(2, 5)).toEqual(transformResult(3, 0, 0));
        expect(transform.transformStart(7, 5)).toEqual(transformResult(8, 0, 0));
        expect(transform.transformStart(8, 5)).toEqual(transformResult(9, 0, 0));
        expect(transform.transformStart(9, 5)).toEqual(transformResult(0, 0, 0));
        expect(transform.transformStart(999, 5)).toEqual(transformResult(9, 0, 0));
      }
      {
        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(5, 5, 5, 5, 5, 5),
          ]),
          autoWrapRow: true,
        });

        expect(transform.transformStart(0, 5)).toEqual(transformResult(6, 0, 0));
        expect(transform.transformStart(0, 7)).toEqual(transformResult(6, 2, 0));
        expect(transform.transformStart(0, 10)).toEqual(transformResult(6, 5, 0));
        expect(transform.transformStart(0, 999)).toEqual(transformResult(6, 9, 0));
        expect(transform.transformStart(-1, 5)).toEqual(transformResult(5, 0, 0));
        expect(transform.transformStart(-2, 5)).toEqual(transformResult(4, 0, 0));
        expect(transform.transformStart(-999, 5)).toEqual(transformResult(0, 0, 0));
        expect(transform.transformStart(1, 5)).toEqual(transformResult(7, 0, 0));
        expect(transform.transformStart(2, 5)).toEqual(transformResult(8, 0, 0));
        expect(transform.transformStart(3, 5)).toEqual(transformResult(9, 0, 0));
        expect(transform.transformStart(4, 5)).toEqual(transformResult(0, 0, 0));
        expect(transform.transformStart(999, 5)).toEqual(transformResult(9, 0, 0));
      }
      {
        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(9, 5, 9, 5, 9, 5),
          ]),
          autoWrapRow: true,
        });

        expect(transform.transformStart(0, 5)).toEqual(transformResult(0, 0, 0));
        expect(transform.transformStart(0, 7)).toEqual(transformResult(0, 2, 0));
        expect(transform.transformStart(0, 10)).toEqual(transformResult(0, 5, 0));
        expect(transform.transformStart(0, 999)).toEqual(transformResult(0, 9, 0));
        expect(transform.transformStart(1, 5)).toEqual(transformResult(1, 0, 0));
        expect(transform.transformStart(2, 5)).toEqual(transformResult(2, 0, 0));
        expect(transform.transformStart(8, 5)).toEqual(transformResult(8, 0, 0));
        expect(transform.transformStart(9, 5)).toEqual(transformResult(9, 0, 0));
        expect(transform.transformStart(999, 5)).toEqual(transformResult(9, 0, 0));
      }
    });

    it('should return coords that points to the previous row when the column delta is lower than the table columns count ' +
       'and `autoWrapRow` is enabled', () => {
      {
        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(0, 5, 0, 5, 0, 5),
          ]),
          autoWrapRow: true,
        });

        expect(transform.transformStart(0, -6)).toEqual(transformResult(9, 9, 0));
        expect(transform.transformStart(0, -12)).toEqual(transformResult(9, 3, 0));
        expect(transform.transformStart(0, -16)).toEqual(transformResult(9, 0, 0));
        expect(transform.transformStart(0, -999)).toEqual(transformResult(9, 0, 0));
        expect(transform.transformStart(-1, -6)).toEqual(transformResult(8, 9, 0));
        expect(transform.transformStart(-2, -6)).toEqual(transformResult(7, 9, 0));
        expect(transform.transformStart(-3, -6)).toEqual(transformResult(6, 9, 0));
        expect(transform.transformStart(-9, -6)).toEqual(transformResult(0, 9, 0));
        expect(transform.transformStart(-10, -6)).toEqual(transformResult(0, 9, 0));
        expect(transform.transformStart(-999, -6)).toEqual(transformResult(0, 9, 0));
        expect(transform.transformStart(1, -6)).toEqual(transformResult(0, 9, 0));
        expect(transform.transformStart(2, -6)).toEqual(transformResult(1, 9, 0));
        expect(transform.transformStart(999, -6)).toEqual(transformResult(9, 9, 0));
      }
      {
        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(5, 5, 5, 5, 5, 5),
          ]),
          autoWrapRow: true,
        });

        expect(transform.transformStart(0, -6)).toEqual(transformResult(4, 9, 0));
        expect(transform.transformStart(0, -12)).toEqual(transformResult(4, 3, 0));
        expect(transform.transformStart(0, -15)).toEqual(transformResult(4, 0, 0));
        expect(transform.transformStart(0, -16)).toEqual(transformResult(4, 0, 0));
        expect(transform.transformStart(0, -999)).toEqual(transformResult(4, 0, 0));
        expect(transform.transformStart(-1, -6)).toEqual(transformResult(3, 9, 0));
        expect(transform.transformStart(-2, -6)).toEqual(transformResult(2, 9, 0));
        expect(transform.transformStart(-3, -6)).toEqual(transformResult(1, 9, 0));
        expect(transform.transformStart(-4, -6)).toEqual(transformResult(0, 9, 0));
        expect(transform.transformStart(-5, -6)).toEqual(transformResult(9, 9, 0));
        expect(transform.transformStart(-999, -6)).toEqual(transformResult(0, 9, 0));
        expect(transform.transformStart(1, -6)).toEqual(transformResult(5, 9, 0));
        expect(transform.transformStart(2, -6)).toEqual(transformResult(6, 9, 0));
        expect(transform.transformStart(999, -6)).toEqual(transformResult(9, 9, 0));
      }
      {
        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(9, 5, 9, 5, 9, 5),
          ]),
          autoWrapRow: true,
        });

        expect(transform.transformStart(0, -6)).toEqual(transformResult(8, 9, 0));
        expect(transform.transformStart(0, -12)).toEqual(transformResult(8, 3, 0));
        expect(transform.transformStart(0, -15)).toEqual(transformResult(8, 0, 0));
        expect(transform.transformStart(0, -16)).toEqual(transformResult(8, 0, 0));
        expect(transform.transformStart(0, -999)).toEqual(transformResult(8, 0, 0));
        expect(transform.transformStart(-1, -6)).toEqual(transformResult(7, 9, 0));
        expect(transform.transformStart(-2, -6)).toEqual(transformResult(6, 9, 0));
        expect(transform.transformStart(-3, -6)).toEqual(transformResult(5, 9, 0));
        expect(transform.transformStart(-4, -6)).toEqual(transformResult(4, 9, 0));
        expect(transform.transformStart(-5, -6)).toEqual(transformResult(3, 9, 0));
        expect(transform.transformStart(-999, -6)).toEqual(transformResult(0, 9, 0));
        expect(transform.transformStart(1, -6)).toEqual(transformResult(9, 9, 0));
        expect(transform.transformStart(2, -6)).toEqual(transformResult(9, 9, 0));
        expect(transform.transformStart(999, -6)).toEqual(transformResult(9, 9, 0));
      }
    });

    it('should return coords that points to the row header when offset is used', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(5, 2, 5, 2, 5, 2),
        ]),
        offsetSize: {
          x: 3,
          y: 0,
        },
      });

      expect(transform.transformStart(0, -3)).toEqual(transformResult(5, -1, 0));
      expect(transform.transformStart(0, -4)).toEqual(transformResult(5, -2, 0));
      expect(transform.transformStart(0, -5)).toEqual(transformResult(5, -3, 0));
      expect(transform.transformStart(0, -6)).toEqual(transformResult(5, -3, 0));
      expect(transform.transformStart(0, -999)).toEqual(transformResult(5, -3, 0));
    });

    it('should return coords that points to the column header when offset is used', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(2, 5, 2, 5, 2, 5),
        ]),
        offsetSize: {
          x: 0,
          y: 3,
        },
      });

      expect(transform.transformStart(-3, 0)).toEqual(transformResult(-1, 5, 0));
      expect(transform.transformStart(-4, 0)).toEqual(transformResult(-2, 5, 0));
      expect(transform.transformStart(-5, 0)).toEqual(transformResult(-3, 5, 0));
      expect(transform.transformStart(-6, 0)).toEqual(transformResult(-3, 5, 0));
      expect(transform.transformStart(-999, 0)).toEqual(transformResult(-3, 5, 0));
    });

    it('should return coords that points to the next column when the row delta is bigger than table total records count ' +
       '(rows + column headers used as offset) and `autoWrapCol` is enabled', () => {
      {
        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(5, -3, 5, -3, 5, -3),
          ]),
          offsetSize: {
            x: 3,
            y: 3,
          },
          autoWrapCol: true,
        });

        expect(transform.transformStart(5, 0)).toEqual(transformResult(-3, -2, 0));
        expect(transform.transformStart(7, 0)).toEqual(transformResult(-1, -2, 0));
        expect(transform.transformStart(10, 0)).toEqual(transformResult(2, -2, 0));
        expect(transform.transformStart(13, 0)).toEqual(transformResult(5, -2, 0));
        expect(transform.transformStart(999, 0)).toEqual(transformResult(9, -2, 0));
        expect(transform.transformStart(5, -1)).toEqual(transformResult(-3, -3, 0));
        expect(transform.transformStart(5, -2)).toEqual(transformResult(-3, -3, 0));
        expect(transform.transformStart(5, -999)).toEqual(transformResult(-3, -3, 0));
        expect(transform.transformStart(5, 1)).toEqual(transformResult(-3, -1, 0));
        expect(transform.transformStart(5, 2)).toEqual(transformResult(-3, 0, 0));
        expect(transform.transformStart(5, 7)).toEqual(transformResult(-3, 5, 0));
        expect(transform.transformStart(5, 8)).toEqual(transformResult(-3, 6, 0));
        expect(transform.transformStart(5, 9)).toEqual(transformResult(-3, 7, 0));
        expect(transform.transformStart(5, 999)).toEqual(transformResult(-3, 9, 0));
      }
      {
        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(5, 5, 5, 5, 5, 5),
          ]),
          offsetSize: {
            x: 3,
            y: 3,
          },
          autoWrapCol: true,
        });

        expect(transform.transformStart(5, 0)).toEqual(transformResult(-3, 6, 0));
        expect(transform.transformStart(7, 0)).toEqual(transformResult(-1, 6, 0));
        expect(transform.transformStart(10, 0)).toEqual(transformResult(2, 6, 0));
        expect(transform.transformStart(13, 0)).toEqual(transformResult(5, 6, 0));
        expect(transform.transformStart(999, 0)).toEqual(transformResult(9, 6, 0));
        expect(transform.transformStart(5, -1)).toEqual(transformResult(-3, 5, 0));
        expect(transform.transformStart(5, -2)).toEqual(transformResult(-3, 4, 0));
        expect(transform.transformStart(5, -999)).toEqual(transformResult(-3, -3, 0));
        expect(transform.transformStart(5, 1)).toEqual(transformResult(-3, 7, 0));
        expect(transform.transformStart(5, 2)).toEqual(transformResult(-3, 8, 0));
        expect(transform.transformStart(5, 7)).toEqual(transformResult(-3, 0, 0));
        expect(transform.transformStart(5, 9)).toEqual(transformResult(-3, 2, 0));
        expect(transform.transformStart(5, 999)).toEqual(transformResult(-3, 9, 0));
      }
      {
        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(5, 9, 5, 9, 5, 9),
          ]),
          offsetSize: {
            x: 3,
            y: 3,
          },
          autoWrapCol: true,
        });

        expect(transform.transformStart(5, 0)).toEqual(transformResult(-3, -3, 0));
        expect(transform.transformStart(7, 0)).toEqual(transformResult(-1, -3, 0));
        expect(transform.transformStart(10, 0)).toEqual(transformResult(2, -3, 0));
        expect(transform.transformStart(13, 0)).toEqual(transformResult(5, -3, 0));
        expect(transform.transformStart(999, 0)).toEqual(transformResult(9, -3, 0));
        expect(transform.transformStart(5, -1)).toEqual(transformResult(-3, 9, 0));
        expect(transform.transformStart(5, -2)).toEqual(transformResult(-3, 8, 0));
        expect(transform.transformStart(5, -999)).toEqual(transformResult(-3, -3, 0));
        expect(transform.transformStart(5, 1)).toEqual(transformResult(-3, -2, 0));
        expect(transform.transformStart(5, 2)).toEqual(transformResult(-3, -1, 0));
        expect(transform.transformStart(5, 7)).toEqual(transformResult(-3, 4, 0));
        expect(transform.transformStart(5, 9)).toEqual(transformResult(-3, 6, 0));
        expect(transform.transformStart(5, 999)).toEqual(transformResult(-3, 9, 0));
      }
    });

    it('should return coords that points to the previous column when the row delta is lower than the table total records count ' +
       '(rows + column headers used as offset) and `autoWrapCol` is enabled', () => {
      {
        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(5, -3, 5, -3, 5, -3),
          ]),
          offsetSize: {
            x: 3,
            y: 3,
          },
          autoWrapCol: true,
        });

        expect(transform.transformStart(-9, 0)).toEqual(transformResult(9, 9, 0));
        expect(transform.transformStart(-15, 0)).toEqual(transformResult(3, 9, 0));
        expect(transform.transformStart(-18, 0)).toEqual(transformResult(0, 9, 0));
        expect(transform.transformStart(-21, 0)).toEqual(transformResult(-3, 9, 0));
        expect(transform.transformStart(-999, 0)).toEqual(transformResult(-3, 9, 0));
        expect(transform.transformStart(-9, -1)).toEqual(transformResult(9, 8, 0));
        expect(transform.transformStart(-9, -2)).toEqual(transformResult(9, 7, 0));
        expect(transform.transformStart(-9, -3)).toEqual(transformResult(9, 6, 0));
        expect(transform.transformStart(-9, -9)).toEqual(transformResult(9, 0, 0));
        expect(transform.transformStart(-9, -10)).toEqual(transformResult(9, -1, 0));
        expect(transform.transformStart(-9, -999)).toEqual(transformResult(9, -3, 0));
        expect(transform.transformStart(-9, 1)).toEqual(transformResult(9, -3, 0));
        expect(transform.transformStart(-9, 2)).toEqual(transformResult(9, -2, 0));
        expect(transform.transformStart(-9, 999)).toEqual(transformResult(9, 9, 0));
      }
      {
        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(5, 5, 5, 5, 5, 5),
          ]),
          offsetSize: {
            x: 3,
            y: 3,
          },
          autoWrapCol: true,
        });

        expect(transform.transformStart(-9, 0)).toEqual(transformResult(9, 4, 0));
        expect(transform.transformStart(-15, 0)).toEqual(transformResult(3, 4, 0));
        expect(transform.transformStart(-18, 0)).toEqual(transformResult(0, 4, 0));
        expect(transform.transformStart(-21, 0)).toEqual(transformResult(-3, 4, 0));
        expect(transform.transformStart(-999, 0)).toEqual(transformResult(-3, 4, 0));
        expect(transform.transformStart(-9, -1)).toEqual(transformResult(9, 3, 0));
        expect(transform.transformStart(-9, -2)).toEqual(transformResult(9, 2, 0));
        expect(transform.transformStart(-9, -3)).toEqual(transformResult(9, 1, 0));
        expect(transform.transformStart(-9, -9)).toEqual(transformResult(9, 8, 0));
        expect(transform.transformStart(-9, -10)).toEqual(transformResult(9, 7, 0));
        expect(transform.transformStart(-9, -999)).toEqual(transformResult(9, -3, 0));
        expect(transform.transformStart(-9, 1)).toEqual(transformResult(9, 5, 0));
        expect(transform.transformStart(-9, 2)).toEqual(transformResult(9, 6, 0));
        expect(transform.transformStart(-9, 999)).toEqual(transformResult(9, 9, 0));
      }
      {
        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(5, 9, 5, 9, 5, 9),
          ]),
          offsetSize: {
            x: 3,
            y: 3,
          },
          autoWrapCol: true,
        });

        expect(transform.transformStart(-9, 0)).toEqual(transformResult(9, 8, 0));
        expect(transform.transformStart(-15, 0)).toEqual(transformResult(3, 8, 0));
        expect(transform.transformStart(-18, 0)).toEqual(transformResult(0, 8, 0));
        expect(transform.transformStart(-21, 0)).toEqual(transformResult(-3, 8, 0));
        expect(transform.transformStart(-999, 0)).toEqual(transformResult(-3, 8, 0));
        expect(transform.transformStart(-9, -1)).toEqual(transformResult(9, 7, 0));
        expect(transform.transformStart(-9, -2)).toEqual(transformResult(9, 6, 0));
        expect(transform.transformStart(-9, -3)).toEqual(transformResult(9, 5, 0));
        expect(transform.transformStart(-9, -9)).toEqual(transformResult(9, -1, 0));
        expect(transform.transformStart(-9, -10)).toEqual(transformResult(9, -2, 0));
        expect(transform.transformStart(-9, -999)).toEqual(transformResult(9, -3, 0));
        expect(transform.transformStart(-9, 1)).toEqual(transformResult(9, 9, 0));
        expect(transform.transformStart(-9, 2)).toEqual(transformResult(9, 9, 0));
        expect(transform.transformStart(-9, 999)).toEqual(transformResult(9, 9, 0));
      }
    });

    it('should return coords that points to the next row when the column delta is bigger than table total records count ' +
       '(columns + row headers used as offset) and `autoWrapRow` is enabled', () => {
      {
        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(-3, 5, -3, 5, -3, 5),
          ]),
          offsetSize: {
            x: 3,
            y: 3,
          },
          autoWrapRow: true,
        });

        expect(transform.transformStart(0, 5)).toEqual(transformResult(-2, -3, 0));
        expect(transform.transformStart(0, 7)).toEqual(transformResult(-2, -1, 0));
        expect(transform.transformStart(0, 10)).toEqual(transformResult(-2, 2, 0));
        expect(transform.transformStart(0, 13)).toEqual(transformResult(-2, 5, 0));
        expect(transform.transformStart(0, 999)).toEqual(transformResult(-2, 9, 0));
        expect(transform.transformStart(-1, 5)).toEqual(transformResult(-3, -3, 0));
        expect(transform.transformStart(-2, 5)).toEqual(transformResult(-3, -3, 0));
        expect(transform.transformStart(-999, 5)).toEqual(transformResult(-3, -3, 0));
        expect(transform.transformStart(1, 5)).toEqual(transformResult(-1, -3, 0));
        expect(transform.transformStart(2, 5)).toEqual(transformResult(0, -3, 0));
        expect(transform.transformStart(7, 5)).toEqual(transformResult(5, -3, 0));
        expect(transform.transformStart(8, 5)).toEqual(transformResult(6, -3, 0));
        expect(transform.transformStart(9, 5)).toEqual(transformResult(7, -3, 0));
        expect(transform.transformStart(999, 5)).toEqual(transformResult(9, -3, 0));
      }
      {
        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(5, 5, 5, 5, 5, 5),
          ]),
          offsetSize: {
            x: 3,
            y: 3,
          },
          autoWrapRow: true,
        });

        expect(transform.transformStart(0, 5)).toEqual(transformResult(6, -3, 0));
        expect(transform.transformStart(0, 7)).toEqual(transformResult(6, -1, 0));
        expect(transform.transformStart(0, 10)).toEqual(transformResult(6, 2, 0));
        expect(transform.transformStart(0, 13)).toEqual(transformResult(6, 5, 0));
        expect(transform.transformStart(0, 999)).toEqual(transformResult(6, 9, 0));
        expect(transform.transformStart(-1, 5)).toEqual(transformResult(5, -3, 0));
        expect(transform.transformStart(-2, 5)).toEqual(transformResult(4, -3, 0));
        expect(transform.transformStart(-999, 5)).toEqual(transformResult(-3, -3, 0));
        expect(transform.transformStart(1, 5)).toEqual(transformResult(7, -3, 0));
        expect(transform.transformStart(2, 5)).toEqual(transformResult(8, -3, 0));
        expect(transform.transformStart(7, 5)).toEqual(transformResult(0, -3, 0));
        expect(transform.transformStart(9, 5)).toEqual(transformResult(2, -3, 0));
        expect(transform.transformStart(999, 5)).toEqual(transformResult(9, -3, 0));
      }
      {
        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(9, 5, 9, 5, 9, 5),
          ]),
          offsetSize: {
            x: 3,
            y: 3,
          },
          autoWrapRow: true,
        });

        expect(transform.transformStart(0, 5)).toEqual(transformResult(-3, -3, 0));
        expect(transform.transformStart(0, 7)).toEqual(transformResult(-3, -1, 0));
        expect(transform.transformStart(0, 10)).toEqual(transformResult(-3, 2, 0));
        expect(transform.transformStart(0, 13)).toEqual(transformResult(-3, 5, 0));
        expect(transform.transformStart(0, 999)).toEqual(transformResult(-3, 9, 0));
        expect(transform.transformStart(-1, 5)).toEqual(transformResult(9, -3, 0));
        expect(transform.transformStart(-2, 5)).toEqual(transformResult(8, -3, 0));
        expect(transform.transformStart(-999, 5)).toEqual(transformResult(-3, -3, 0));
        expect(transform.transformStart(1, 5)).toEqual(transformResult(-2, -3, 0));
        expect(transform.transformStart(2, 5)).toEqual(transformResult(-1, -3, 0));
        expect(transform.transformStart(7, 5)).toEqual(transformResult(4, -3, 0));
        expect(transform.transformStart(9, 5)).toEqual(transformResult(6, -3, 0));
        expect(transform.transformStart(999, 5)).toEqual(transformResult(9, -3, 0));
      }
    });

    it('should return coords that points to the previous row when the column delta is lower than the table total records count ' +
       '(cells + headers used as offset) and `autoWrapRow` is enabled', () => {
      {
        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(-3, 5, -3, 5, -3, 5),
          ]),
          offsetSize: {
            x: 3,
            y: 3,
          },
          autoWrapRow: true,
        });

        expect(transform.transformStart(0, -9)).toEqual(transformResult(9, 9, 0));
        expect(transform.transformStart(0, -15)).toEqual(transformResult(9, 3, 0));
        expect(transform.transformStart(0, -18)).toEqual(transformResult(9, 0, 0));
        expect(transform.transformStart(0, -21)).toEqual(transformResult(9, -3, 0));
        expect(transform.transformStart(0, -999)).toEqual(transformResult(9, -3, 0));
        expect(transform.transformStart(-1, -9)).toEqual(transformResult(8, 9, 0));
        expect(transform.transformStart(-2, -9)).toEqual(transformResult(7, 9, 0));
        expect(transform.transformStart(-3, -9)).toEqual(transformResult(6, 9, 0));
        expect(transform.transformStart(-9, -9)).toEqual(transformResult(0, 9, 0));
        expect(transform.transformStart(-10, -9)).toEqual(transformResult(-1, 9, 0));
        expect(transform.transformStart(-999, -9)).toEqual(transformResult(-3, 9, 0));
        expect(transform.transformStart(1, -9)).toEqual(transformResult(-3, 9, 0));
        expect(transform.transformStart(2, -9)).toEqual(transformResult(-2, 9, 0));
        expect(transform.transformStart(999, -9)).toEqual(transformResult(9, 9, 0));
      }
      {
        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(5, 5, 5, 5, 5, 5),
          ]),
          offsetSize: {
            x: 3,
            y: 3,
          },
          autoWrapRow: true,
        });

        expect(transform.transformStart(0, -9)).toEqual(transformResult(4, 9, 0));
        expect(transform.transformStart(0, -15)).toEqual(transformResult(4, 3, 0));
        expect(transform.transformStart(0, -18)).toEqual(transformResult(4, 0, 0));
        expect(transform.transformStart(0, -21)).toEqual(transformResult(4, -3, 0));
        expect(transform.transformStart(0, -999)).toEqual(transformResult(4, -3, 0));
        expect(transform.transformStart(-1, -9)).toEqual(transformResult(3, 9, 0));
        expect(transform.transformStart(-2, -9)).toEqual(transformResult(2, 9, 0));
        expect(transform.transformStart(-3, -9)).toEqual(transformResult(1, 9, 0));
        expect(transform.transformStart(-9, -9)).toEqual(transformResult(8, 9, 0));
        expect(transform.transformStart(-10, -9)).toEqual(transformResult(7, 9, 0));
        expect(transform.transformStart(-999, -9)).toEqual(transformResult(-3, 9, 0));
        expect(transform.transformStart(1, -9)).toEqual(transformResult(5, 9, 0));
        expect(transform.transformStart(2, -9)).toEqual(transformResult(6, 9, 0));
        expect(transform.transformStart(999, -9)).toEqual(transformResult(9, 9, 0));
      }
      {
        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(9, 5, 9, 5, 9, 5),
          ]),
          offsetSize: {
            x: 3,
            y: 3,
          },
          autoWrapRow: true,
        });

        expect(transform.transformStart(0, -9)).toEqual(transformResult(8, 9, 0));
        expect(transform.transformStart(0, -15)).toEqual(transformResult(8, 3, 0));
        expect(transform.transformStart(0, -18)).toEqual(transformResult(8, 0, 0));
        expect(transform.transformStart(0, -21)).toEqual(transformResult(8, -3, 0));
        expect(transform.transformStart(0, -999)).toEqual(transformResult(8, -3, 0));
        expect(transform.transformStart(-1, -9)).toEqual(transformResult(7, 9, 0));
        expect(transform.transformStart(-2, -9)).toEqual(transformResult(6, 9, 0));
        expect(transform.transformStart(-3, -9)).toEqual(transformResult(5, 9, 0));
        expect(transform.transformStart(-9, -9)).toEqual(transformResult(-1, 9, 0));
        expect(transform.transformStart(-10, -9)).toEqual(transformResult(-2, 9, 0));
        expect(transform.transformStart(-999, -9)).toEqual(transformResult(-3, 9, 0));
        expect(transform.transformStart(1, -9)).toEqual(transformResult(9, 9, 0));
        expect(transform.transformStart(2, -9)).toEqual(transformResult(9, 9, 0));
        expect(transform.transformStart(999, -9)).toEqual(transformResult(9, 9, 0));
      }
    });

    describe('`insertRowRequire` hook', () => {
      it('should fired when the row delta exceeds the row beyond the table range', () => {
        const hookListener = { insertRowRequire() {} };

        spyOn(hookListener, 'insertRowRequire');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(0, 0, 0, 0, 0, 0),
          ]),
          minSpareRows: 1,
        });

        transform.addLocalHook('insertRowRequire', hookListener.insertRowRequire);
        transform.transformStart(10, 2, true);

        expect(hookListener.insertRowRequire).toHaveBeenCalledWith(10);
      });

      it('should not be fired when the row delta does not exceed the row beyond the table range', () => {
        const hookListener = { insertRowRequire() {} };

        spyOn(hookListener, 'insertRowRequire');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(0, 0, 0, 0, 0, 0),
          ]),
          minSpareRows: 1,
        });

        transform.addLocalHook('insertRowRequire', hookListener.insertRowRequire);
        transform.transformStart(1, 2, true);

        expect(hookListener.insertRowRequire).not.toHaveBeenCalled();
      });

      it('should not be fired when the `minSpareRows` options equals to 0', () => {
        const hookListener = { insertRowRequire() {} };

        spyOn(hookListener, 'insertRowRequire');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(0, 0, 0, 0, 0, 0),
          ]),
          minSpareRows: 0,
        });

        transform.addLocalHook('insertRowRequire', hookListener.insertRowRequire);
        transform.transformStart(10, 2, true);

        expect(hookListener.insertRowRequire).not.toHaveBeenCalled();
      });

      it('should not be fired when the `fixedRowsBottom` options is greater than to 0', () => {
        const hookListener = { insertRowRequire() {} };

        spyOn(hookListener, 'insertRowRequire');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(0, 0, 0, 0, 0, 0),
          ]),
          fixedRowsBottom: 1,
          minSpareRows: 1,
        });

        transform.addLocalHook('insertRowRequire', hookListener.insertRowRequire);
        transform.transformStart(10, 2, true);

        expect(hookListener.insertRowRequire).not.toHaveBeenCalled();
      });
    });

    describe('`insertColRequire` hook', () => {
      it('should fired when the column delta exceeds the column beyond the table range', () => {
        const hookListener = { insertColRequire() {} };

        spyOn(hookListener, 'insertColRequire');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(0, 0, 0, 0, 0, 0),
          ]),
          minSpareCols: 1,
        });

        transform.addLocalHook('insertColRequire', hookListener.insertColRequire);
        transform.transformStart(2, 10, true);

        expect(hookListener.insertColRequire).toHaveBeenCalledWith(10);
      });

      it('should not be fired when the column delta does not exceed the column beyond the table range', () => {
        const hookListener = { insertColRequire() {} };

        spyOn(hookListener, 'insertColRequire');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(0, 0, 0, 0, 0, 0),
          ]),
          minSpareCols: 1,
        });

        transform.addLocalHook('insertColRequire', hookListener.insertColRequire);
        transform.transformStart(2, 1, true);

        expect(hookListener.insertColRequire).not.toHaveBeenCalled();
      });

      it('should not be fired when the `minSpareCols` options equals to 0', () => {
        const hookListener = { insertColRequire() {} };

        spyOn(hookListener, 'insertColRequire');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(0, 0, 0, 0, 0, 0),
          ]),
          minSpareCols: 0,
        });

        transform.addLocalHook('insertColRequire', hookListener.insertColRequire);
        transform.transformStart(2, 10, true);

        expect(hookListener.insertColRequire).not.toHaveBeenCalled();
      });
    });

    describe('`beforeTransformStart` hook', () => {
      it('should be fired after `transformStart` method call', () => {
        const hookListener = { beforeTransformStart() {} };

        spyOn(hookListener, 'beforeTransformStart');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(1, 1, 1, 1, 1, 1),
          ]),
        });

        transform.addLocalHook('beforeTransformStart', hookListener.beforeTransformStart);
        transform.transformStart(4, 2);

        expect(hookListener.beforeTransformStart).toHaveBeenCalledWith({ row: 4, col: 2 });
      });
    });

    describe('`afterTransformStart` hook', () => {
      it('should be fired after `transformStart` method call', () => {
        const hookListener = { afterTransformStart() {} };

        spyOn(hookListener, 'afterTransformStart');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(1, 1, 1, 1, 1, 1),
          ]),
        });

        transform.addLocalHook('afterTransformStart', hookListener.afterTransformStart);
        transform.transformStart(4, 2);

        expect(hookListener.afterTransformStart).toHaveBeenCalledWith({ row: 5, col: 3 }, 0, 0);
      });

      it('should be fired with arguments that indicates the row index exceeded the limit of the table range ' +
         '(upper limit)', () => {
        const hookListener = { afterTransformStart() {} };

        spyOn(hookListener, 'afterTransformStart');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(1, 1, 1, 1, 1, 1),
          ]),
          offsetSize: {
            x: 3,
            y: 3,
          },
        });

        transform.addLocalHook('afterTransformStart', hookListener.afterTransformStart);
        transform.transformStart(999, 0);

        expect(hookListener.afterTransformStart).toHaveBeenCalledWith({ row: 9, col: 1 }, 1, 0);
      });

      it('should be fired with arguments that indicates the row index exceeded the limit of the table range ' +
         '(lower limit)', () => {
        {
          const hookListener = { afterTransformStart() {} };

          spyOn(hookListener, 'afterTransformStart');

          const transform = createTransformationModule({
            range: createSelectionRangeModule([
              createCellRange(1, 1, 1, 1, 1, 1),
            ]),
            offsetSize: {
              x: 3,
              y: 3,
            },
          });

          transform.addLocalHook('afterTransformStart', hookListener.afterTransformStart);
          transform.transformStart(-999, 0);

          expect(hookListener.afterTransformStart).toHaveBeenCalledWith({ row: -3, col: 1 }, -1, 0);
        }
        {
          const hookListener = { afterTransformStart() {} };

          spyOn(hookListener, 'afterTransformStart');

          const transform = createTransformationModule({
            range: createSelectionRangeModule([
              createCellRange(1, 1, 1, 1, 1, 1),
            ]),
          });

          transform.addLocalHook('afterTransformStart', hookListener.afterTransformStart);
          transform.transformStart(-999, 0);

          expect(hookListener.afterTransformStart).toHaveBeenCalledWith({ row: 0, col: 1 }, -1, 0);
        }
      });

      it('should be fired with arguments that indicates the column index exceeded the limit of the table range ' +
         '(upper limit)', () => {
        const hookListener = { afterTransformStart() {} };

        spyOn(hookListener, 'afterTransformStart');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(1, 1, 1, 1, 1, 1),
          ]),
          offsetSize: {
            x: 3,
            y: 3,
          },
        });

        transform.addLocalHook('afterTransformStart', hookListener.afterTransformStart);
        transform.transformStart(0, 999);

        expect(hookListener.afterTransformStart).toHaveBeenCalledWith({ row: 1, col: 9 }, 0, 1);
      });

      it('should be fired with arguments that indicates the column index exceeded the limit of the table range ' +
         '(lower limit)', () => {
        {
          const hookListener = { afterTransformStart() {} };

          spyOn(hookListener, 'afterTransformStart');

          const transform = createTransformationModule({
            range: createSelectionRangeModule([
              createCellRange(1, 1, 1, 1, 1, 1),
            ]),
            offsetSize: {
              x: 3,
              y: 3,
            },
          });

          transform.addLocalHook('afterTransformStart', hookListener.afterTransformStart);
          transform.transformStart(0, -999);

          expect(hookListener.afterTransformStart).toHaveBeenCalledWith({ row: 1, col: -3 }, 0, -1);
        }
        {
          const hookListener = { afterTransformStart() {} };

          spyOn(hookListener, 'afterTransformStart');

          const transform = createTransformationModule({
            range: createSelectionRangeModule([
              createCellRange(1, 1, 1, 1, 1, 1),
            ]),
          });

          transform.addLocalHook('afterTransformStart', hookListener.afterTransformStart);
          transform.transformStart(0, -999);

          expect(hookListener.afterTransformStart).toHaveBeenCalledWith({ row: 1, col: 0 }, 0, -1);
        }
      });
    });

    describe('`beforeColumnWrap` hook', () => {
      it('should be fired when the new row index exceeds the last row of the dataset range', () => {
        const hookListener = { beforeColumnWrap() {} };

        spyOn(hookListener, 'beforeColumnWrap');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(4, 4, 4, 4, 4, 4),
          ]),
          autoWrapCol: true,
        });

        transform.addLocalHook('beforeColumnWrap', hookListener.beforeColumnWrap);
        transform.transformStart(6, 0);

        expect(hookListener.beforeColumnWrap).toHaveBeenCalledWith(
          expect.objectContaining({ value: false }),
          new CellCoords(0, 5),
          false
        );
      });

      it('should be fired when the new row index exceeds the first row of the headers', () => {
        const hookListener = { beforeColumnWrap() {} };

        spyOn(hookListener, 'beforeColumnWrap');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(5, 5, 5, 5, 5, 5),
          ]),
          autoWrapCol: true,
        });

        transform.addLocalHook('beforeColumnWrap', hookListener.beforeColumnWrap);
        transform.transformStart(-6, 0);

        expect(hookListener.beforeColumnWrap).toHaveBeenCalledWith(
          expect.objectContaining({ value: expect.any(Boolean) }),
          new CellCoords(9, 4),
          false
        );
      });

      it('should be fired with 3rd argument as `true` when the coords are flipped (flip from bottom-right to top-left)', () => {
        const hookListener = { beforeColumnWrap() {} };

        spyOn(hookListener, 'beforeColumnWrap');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(9, 9, 9, 9, 9, 9),
          ]),
          autoWrapCol: true,
        });

        transform.addLocalHook('beforeColumnWrap', hookListener.beforeColumnWrap);
        transform.transformStart(1, 0);

        expect(hookListener.beforeColumnWrap).toHaveBeenCalledWith(
          expect.objectContaining({ value: false }),
          new CellCoords(0, 0),
          true
        );
      });

      it('should be fired with 3rd argument as `true` when the coords are flipped (flip from top-left to bottom-right)', () => {
        const hookListener = { beforeColumnWrap() {} };

        spyOn(hookListener, 'beforeColumnWrap');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(0, 0, 0, 0, 0, 0),
          ]),
          autoWrapCol: true,
        });

        transform.addLocalHook('beforeColumnWrap', hookListener.beforeColumnWrap);
        transform.transformStart(-1, 0);

        expect(hookListener.beforeColumnWrap).toHaveBeenCalledWith(
          expect.objectContaining({ value: true }),
          new CellCoords(9, 9),
          true
        );
      });

      it('should not be fired when the new row index not exceed dataset range', () => {
        const hookListener = { beforeColumnWrap() {} };

        spyOn(hookListener, 'beforeColumnWrap');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(5, 5, 5, 5, 5, 5),
          ]),
        });

        transform.addLocalHook('beforeColumnWrap', hookListener.beforeColumnWrap);
        transform.transformStart(1, 0);

        expect(hookListener.beforeColumnWrap).not.toHaveBeenCalled();
      });

      it('should be fired with first argument as `true` when wrapping is enabled', () => {
        const hookListener = { beforeColumnWrap() {} };

        spyOn(hookListener, 'beforeColumnWrap');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(4, 4, 4, 4, 4, 4),
          ]),
          autoWrapCol: false,
        });

        transform.addLocalHook('beforeColumnWrap', hookListener.beforeColumnWrap);
        transform.transformStart(6, 0);

        expect(hookListener.beforeColumnWrap).toHaveBeenCalledWith(
          expect.objectContaining({ value: false }),
          new CellCoords(0, 5),
          false
        );

        hookListener.beforeColumnWrap.calls.reset();
        transform.transformStart(-6, 0);

        expect(hookListener.beforeColumnWrap).toHaveBeenCalledWith(
          expect.objectContaining({ value: false }),
          new CellCoords(8, 3),
          false
        );
      });

      it('should be fired with first argument as `true` when wrapping is interrupted', () => {
        const hookListener = { beforeColumnWrap() {} };

        spyOn(hookListener, 'beforeColumnWrap');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(4, 4, 4, 4, 4, 4),
          ]),
          autoWrapCol: true,
          minSpareRows: 2, // reason for interruption
          fixedRowsBottom: 0, // reason for interruption
        });

        transform.addLocalHook('beforeColumnWrap', hookListener.beforeColumnWrap);
        transform.transformStart(6, 0, true);

        expect(hookListener.beforeColumnWrap).toHaveBeenCalledWith(
          expect.objectContaining({ value: true }),
          new CellCoords(0, 5),
          false
        );
      });
    });

    describe('`beforeRowWrap` hook', () => {
      it('should be fired when the new column index exceeds the last column of the dataset range', () => {
        const hookListener = { beforeRowWrap() {} };

        spyOn(hookListener, 'beforeRowWrap');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(4, 4, 4, 4, 4, 4),
          ]),
          autoWrapRow: true,
        });

        transform.addLocalHook('beforeRowWrap', hookListener.beforeRowWrap);
        transform.transformStart(0, 6);

        expect(hookListener.beforeRowWrap).toHaveBeenCalledWith(
          expect.objectContaining({ value: false }),
          new CellCoords(5, 0),
          false
        );
      });

      it('should be fired when the new column index exceeds the first column of the headers', () => {
        const hookListener = { beforeRowWrap() {} };

        spyOn(hookListener, 'beforeRowWrap');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(5, 5, 5, 5, 5, 5),
          ]),
          autoWrapRow: true,
        });

        transform.addLocalHook('beforeRowWrap', hookListener.beforeRowWrap);
        transform.transformStart(0, -6);

        expect(hookListener.beforeRowWrap).toHaveBeenCalledWith(
          expect.objectContaining({ value: true }),
          new CellCoords(4, 9),
          false
        );
      });

      it('should be fired with 3rd argument as `true` when the coords are flipped (flip from bottom-right to top-left)', () => {
        const hookListener = { beforeRowWrap() {} };

        spyOn(hookListener, 'beforeRowWrap');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(9, 9, 9, 9, 9, 9),
          ]),
          autoWrapRow: true,
        });

        transform.addLocalHook('beforeRowWrap', hookListener.beforeRowWrap);
        transform.transformStart(0, 1);

        expect(hookListener.beforeRowWrap).toHaveBeenCalledWith(
          expect.objectContaining({ value: false }),
          new CellCoords(0, 0),
          true
        );
      });

      it('should be fired with 3rd argument as `true` when the coords are flipped (flip from top-left to bottom-right)', () => {
        const hookListener = { beforeRowWrap() {} };

        spyOn(hookListener, 'beforeRowWrap');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(0, 0, 0, 0, 0, 0),
          ]),
          autoWrapRow: true,
        });

        transform.addLocalHook('beforeRowWrap', hookListener.beforeRowWrap);
        transform.transformStart(0, -1);

        expect(hookListener.beforeRowWrap).toHaveBeenCalledWith(
          expect.objectContaining({ value: true }),
          new CellCoords(9, 9),
          true
        );
      });

      it('should not be fired when the new column index not exceed dataset range', () => {
        const hookListener = { beforeRowWrap() {} };

        spyOn(hookListener, 'beforeRowWrap');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(5, 5, 5, 5, 5, 5),
          ]),
        });

        transform.addLocalHook('beforeRowWrap', hookListener.beforeRowWrap);
        transform.transformStart(0, 1);

        expect(hookListener.beforeRowWrap).not.toHaveBeenCalled();
      });

      it('should be fired with first argument as `true` when wrapping is enabled', () => {
        const hookListener = { beforeRowWrap() {} };

        spyOn(hookListener, 'beforeRowWrap');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(4, 4, 4, 4, 4, 4),
          ]),
          autoWrapRow: false,
        });

        transform.addLocalHook('beforeRowWrap', hookListener.beforeRowWrap);
        transform.transformStart(0, 6);

        expect(hookListener.beforeRowWrap).toHaveBeenCalledWith(
          expect.objectContaining({ value: false }),
          new CellCoords(5, 0),
          false
        );

        hookListener.beforeRowWrap.calls.reset();
        transform.transformStart(0, -6);

        expect(hookListener.beforeRowWrap).toHaveBeenCalledWith(
          expect.objectContaining({ value: false }),
          new CellCoords(3, 8),
          false
        );
      });

      it('should be fired with first argument as `true` when wrapping is interrupted', () => {
        const hookListener = { beforeRowWrap() {} };

        spyOn(hookListener, 'beforeRowWrap');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(4, 4, 4, 4, 4, 4),
          ]),
          autoWrapRow: true,
          minSpareCols: 2, // reason for interruption
        });

        transform.addLocalHook('beforeRowWrap', hookListener.beforeRowWrap);
        transform.transformStart(0, 6, true);

        expect(hookListener.beforeRowWrap).toHaveBeenCalledWith(
          expect.objectContaining({ value: true }),
          new CellCoords(5, 0),
          false
        );
      });
    });
  });

  describe('transformEnd()', () => {
    it('should calculate new coords based on "to" CellRange property', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(null, null, 0, 0, 3, 4),
        ]),
      });

      expect(transform.transformEnd(0, 0)).toEqual(transformResult(3, 4, 0));
    });

    it('should return coords with row moved by row delta (positive value)', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(0, 0, 0, 0, 1, 1),
        ]),
      });

      expect(transform.transformEnd(0, 0)).toEqual(transformResult(1, 1, 0));
      expect(transform.transformEnd(4, 0)).toEqual(transformResult(5, 1, 0));
    });

    it('should return coords with column moved by column delta (positive value)', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(0, 0, 0, 0, 1, 1),
        ]),
      });

      expect(transform.transformEnd(0, 0)).toEqual(transformResult(1, 1, 0));
      expect(transform.transformEnd(0, 4)).toEqual(transformResult(1, 5, 0));
    });

    it('should return coords with row moved by row delta (negative value)', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(0, 0, 0, 0, 8, 8),
        ]),
      });

      expect(transform.transformEnd(-4, 0)).toEqual(transformResult(4, 8, 0));
    });

    it('should return coords with column moved by column delta (negative value)', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(0, 0, 0, 0, 8, 8),
        ]),
      });

      expect(transform.transformEnd(0, -4)).toEqual(transformResult(8, 4, 0));
    });

    it('should not return coords that point out of the table when row delta is bigger than total number of rows (positive value)', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(0, 0, 0, 0, 1, 1),
        ]),
      });

      expect(transform.transformEnd(8, 0)).toEqual(transformResult(9, 1, 0));
      expect(transform.transformEnd(9, 0)).toEqual(transformResult(9, 1, 0));
      expect(transform.transformEnd(999, 0)).toEqual(transformResult(9, 1, 0));
    });

    it('should not return coords that point out of the table when column delta is bigger than total number of columns (positive value)', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(0, 0, 0, 0, 1, 1),
        ]),
      });

      expect(transform.transformEnd(0, 8)).toEqual(transformResult(1, 9, 0));
      expect(transform.transformEnd(0, 9)).toEqual(transformResult(1, 9, 0));
      expect(transform.transformEnd(0, 999)).toEqual(transformResult(1, 9, 0));
    });

    it('should not return coords that point out of the table when row delta is bigger than total number of rows (negative value)', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(0, 0, 0, 0, 9, 9),
        ]),
      });

      expect(transform.transformEnd(-8, 0)).toEqual(transformResult(1, 9, 0));
      expect(transform.transformEnd(-9, 0)).toEqual(transformResult(0, 9, 0));
      expect(transform.transformEnd(-999, 0)).toEqual(transformResult(0, 9, 0));
    });

    it('should not return coords that point out of the table when column delta is bigger than total number of columns (negative value)', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(0, 0, 0, 0, 9, 9),
        ]),
      });

      expect(transform.transformEnd(0, -8)).toEqual(transformResult(9, 1, 0));
      expect(transform.transformEnd(0, -9)).toEqual(transformResult(9, 0, 0));
      expect(transform.transformEnd(0, -999)).toEqual(transformResult(9, 0, 0));
    });

    it('should return coords that points to the first column when the offset is not used', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(0, 0, 0, 0, 5, 2),
        ]),
      });

      expect(transform.transformEnd(0, -3)).toEqual(transformResult(5, 0, 0));
      expect(transform.transformEnd(0, -4)).toEqual(transformResult(5, 0, 0));
      expect(transform.transformEnd(0, -5)).toEqual(transformResult(5, 0, 0));
      expect(transform.transformEnd(0, -6)).toEqual(transformResult(5, 0, 0));
      expect(transform.transformEnd(0, -999)).toEqual(transformResult(5, 0, 0));
    });

    it('should return coords that points to the first row when the offset is not used', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(0, 0, 0, 0, 2, 5),
        ]),
      });

      expect(transform.transformEnd(-3, 0)).toEqual(transformResult(0, 5, 0));
      expect(transform.transformEnd(-4, 0)).toEqual(transformResult(0, 5, 0));
      expect(transform.transformEnd(-5, 0)).toEqual(transformResult(0, 5, 0));
      expect(transform.transformEnd(-6, 0)).toEqual(transformResult(0, 5, 0));
      expect(transform.transformEnd(-999, 0)).toEqual(transformResult(0, 5, 0));
    });

    it('should return coords that points to the row header when the offset is used', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(0, 0, 0, 0, 5, 2),
        ]),
        offsetSize: {
          x: 3,
          y: 3,
        },
      });

      expect(transform.transformEnd(0, -1)).toEqual(transformResult(5, 1, 0));
      expect(transform.transformEnd(0, -2)).toEqual(transformResult(5, 0, 0));
      expect(transform.transformEnd(0, -3)).toEqual(transformResult(5, -1, 0));
      expect(transform.transformEnd(0, -4)).toEqual(transformResult(5, -2, 0));
      expect(transform.transformEnd(0, -5)).toEqual(transformResult(5, -3, 0));
      expect(transform.transformEnd(0, -6)).toEqual(transformResult(5, -3, 0));
      expect(transform.transformEnd(0, -999)).toEqual(transformResult(5, -3, 0));
    });

    it('should return coords that points to the column header when the offset is used', () => {
      const transform = createTransformationModule({
        range: createSelectionRangeModule([
          createCellRange(0, 0, 0, 0, 2, 5),
        ]),
        offsetSize: {
          x: 3,
          y: 3,
        },
      });

      expect(transform.transformEnd(-1, 0)).toEqual(transformResult(1, 5, 0));
      expect(transform.transformEnd(-2, 0)).toEqual(transformResult(0, 5, 0));
      expect(transform.transformEnd(-3, 0)).toEqual(transformResult(-1, 5, 0));
      expect(transform.transformEnd(-4, 0)).toEqual(transformResult(-2, 5, 0));
      expect(transform.transformEnd(-5, 0)).toEqual(transformResult(-3, 5, 0));
      expect(transform.transformEnd(-6, 0)).toEqual(transformResult(-3, 5, 0));
      expect(transform.transformEnd(-999, 0)).toEqual(transformResult(-3, 5, 0));
    });

    describe('`beforeTransformEnd` hook', () => {
      it('should be fired after `transformEnd` method call', () => {
        const hookListener = { beforeTransformEnd() {} };

        spyOn(hookListener, 'beforeTransformEnd');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(0, 0, 0, 0, 1, 1),
          ]),
        });

        transform.addLocalHook('beforeTransformEnd', hookListener.beforeTransformEnd);
        transform.transformEnd(4, 2);

        expect(hookListener.beforeTransformEnd).toHaveBeenCalledWith({ row: 4, col: 2 });
      });
    });

    describe('`afterTransformEnd` hook', () => {
      it('should be fired after `transformEnd` method call', () => {
        const hookListener = { afterTransformEnd() {} };

        spyOn(hookListener, 'afterTransformEnd');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(0, 0, 0, 0, 1, 1),
          ]),
        });

        transform.addLocalHook('afterTransformEnd', hookListener.afterTransformEnd);
        transform.transformEnd(4, 2);

        expect(hookListener.afterTransformEnd).toHaveBeenCalledWith({ row: 5, col: 3 }, 0, 0);
      });

      it('should be fired with arguments that indicates the row index exceeded the limit of the table range ' +
         '(upper limit)', () => {
        const hookListener = { afterTransformEnd() {} };

        spyOn(hookListener, 'afterTransformEnd');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(0, 0, 0, 0, 1, 1),
          ]),
          offsetSize: {
            x: 3,
            y: 3,
          },
        });

        transform.addLocalHook('afterTransformEnd', hookListener.afterTransformEnd);
        transform.transformEnd(999, 0);

        expect(hookListener.afterTransformEnd).toHaveBeenCalledWith({ row: 9, col: 1 }, 1, 0);
      });

      it('should be fired with arguments that indicates the row index exceeded the limit of the table range ' +
         '(lower limit)', () => {
        {
          const hookListener = { afterTransformEnd() {} };

          spyOn(hookListener, 'afterTransformEnd');

          const transform = createTransformationModule({
            range: createSelectionRangeModule([
              createCellRange(0, 0, 0, 0, 1, 1),
            ]),
            offsetSize: {
              x: 3,
              y: 3,
            },
          });

          transform.addLocalHook('afterTransformEnd', hookListener.afterTransformEnd);
          transform.transformEnd(-999, 0);

          expect(hookListener.afterTransformEnd).toHaveBeenCalledWith({ row: -3, col: 1 }, -1, 0);
        }
        {
          const hookListener = { afterTransformEnd() {} };

          spyOn(hookListener, 'afterTransformEnd');

          const transform = createTransformationModule({
            range: createSelectionRangeModule([
              createCellRange(0, 0, 0, 0, 1, 1),
            ]),
          });

          transform.addLocalHook('afterTransformEnd', hookListener.afterTransformEnd);
          transform.transformEnd(-999, 0);

          expect(hookListener.afterTransformEnd).toHaveBeenCalledWith({ row: 0, col: 1 }, -1, 0);
        }
      });

      it('should be fired with arguments that indicates the column index exceeded the limit of the table range ' +
         '(upper limit)', () => {
        const hookListener = { afterTransformEnd() {} };

        spyOn(hookListener, 'afterTransformEnd');

        const transform = createTransformationModule({
          range: createSelectionRangeModule([
            createCellRange(0, 0, 0, 0, 1, 1),
          ]),
          offsetSize: {
            x: 3,
            y: 3,
          },
        });

        transform.addLocalHook('afterTransformEnd', hookListener.afterTransformEnd);
        transform.transformEnd(0, 999);

        expect(hookListener.afterTransformEnd).toHaveBeenCalledWith({ row: 1, col: 9 }, 0, 1);
      });

      it('should be fired with arguments that indicates the column index exceeded the limit of the table range ' +
         '(lower limit)', () => {
        {
          const hookListener = { afterTransformEnd() {} };

          spyOn(hookListener, 'afterTransformEnd');

          const transform = createTransformationModule({
            range: createSelectionRangeModule([
              createCellRange(0, 0, 0, 0, 1, 1),
            ]),
            offsetSize: {
              x: 3,
              y: 3,
            },
          });

          transform.addLocalHook('afterTransformEnd', hookListener.afterTransformEnd);
          transform.transformEnd(0, -999);

          expect(hookListener.afterTransformEnd).toHaveBeenCalledWith({ row: 1, col: -3 }, 0, -1);
        }
        {
          const hookListener = { afterTransformEnd() {} };

          spyOn(hookListener, 'afterTransformEnd');

          const transform = createTransformationModule({
            range: createSelectionRangeModule([
              createCellRange(0, 0, 0, 0, 1, 1),
            ]),
          });

          transform.addLocalHook('afterTransformEnd', hookListener.afterTransformEnd);
          transform.transformEnd(0, -999);

          expect(hookListener.afterTransformEnd).toHaveBeenCalledWith({ row: 1, col: 0 }, 0, -1);
        }
      });
    });
  });
});
