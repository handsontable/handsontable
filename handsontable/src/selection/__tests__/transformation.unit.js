import { CellCoords, CellRange } from 'walkontable';
import Transformation from '../transformation';

function createSelectionRange(row, col, rowFrom = row, columnFrom = col, rowTo = row, columnTo = col) {
  const range = new CellRange(
    new CellCoords(row, col),
    new CellCoords(rowFrom, columnFrom),
    new CellCoords(rowTo, columnTo)
  );

  return {
    current() {
      return range;
    }
  };
}

function createTransformation(options) {
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

describe('Transformation class', () => {
  describe('transformStart()', () => {
    it('should calculate new coords based on "highlight" CellRange property', () => {
      const transform = createTransformation({
        range: createSelectionRange(null, null, 0, 0, 0, 0)
      });

      expect(transform.transformStart(0, 0)).toEqual({ row: null, col: null });
    });

    it('should return coords with row moved by row delta (positive value)', () => {
      const transform = createTransformation({
        range: createSelectionRange(1, 1)
      });

      expect(transform.transformStart(0, 0)).toEqual({ row: 1, col: 1 });
      expect(transform.transformStart(4, 0)).toEqual({ row: 5, col: 1 });
    });

    it('should return coords with column moved by column delta (positive value)', () => {
      const transform = createTransformation({
        range: createSelectionRange(1, 1)
      });

      expect(transform.transformStart(0, 0)).toEqual({ row: 1, col: 1 });
      expect(transform.transformStart(0, 4)).toEqual({ row: 1, col: 5 });
    });

    it('should return coords with row moved by row delta (negative value)', () => {
      const transform = createTransformation({
        range: createSelectionRange(8, 8)
      });

      expect(transform.transformStart(-4, 0)).toEqual({ row: 4, col: 8 });
    });

    it('should return coords with column moved by column delta (negative value)', () => {
      const transform = createTransformation({
        range: createSelectionRange(8, 8)
      });

      expect(transform.transformStart(0, -4)).toEqual({ row: 8, col: 4 });
    });

    it('should not return coords that point out of the table when row delta is bigger than total number of rows (positive value)', () => {
      const transform = createTransformation({
        range: createSelectionRange(1, 1)
      });

      expect(transform.transformStart(8, 0)).toEqual({ row: 9, col: 1 });
      expect(transform.transformStart(9, 0)).toEqual({ row: 9, col: 1 });
      expect(transform.transformStart(999, 0)).toEqual({ row: 9, col: 1 });
    });

    it('should not return coords that point out of the table when column delta is bigger than total number of columns (positive value)', () => {
      const transform = createTransformation({
        range: createSelectionRange(1, 1)
      });

      expect(transform.transformStart(0, 8)).toEqual({ row: 1, col: 9 });
      expect(transform.transformStart(0, 9)).toEqual({ row: 1, col: 9 });
      expect(transform.transformStart(0, 999)).toEqual({ row: 1, col: 9 });
    });

    it('should not return coords that point out of the table when row delta is bigger than total number of rows (negative value)', () => {
      const transform = createTransformation({
        range: createSelectionRange(9, 9)
      });

      expect(transform.transformStart(-8, 0)).toEqual({ row: 1, col: 9 });
      expect(transform.transformStart(-9, 0)).toEqual({ row: 0, col: 9 });
      expect(transform.transformStart(-999, 0)).toEqual({ row: 0, col: 9 });
    });

    it('should not return coords that point out of the table when column delta is bigger than total number of columns (negative value)', () => {
      const transform = createTransformation({
        range: createSelectionRange(9, 9)
      });

      expect(transform.transformStart(0, -8)).toEqual({ row: 9, col: 1 });
      expect(transform.transformStart(0, -9)).toEqual({ row: 9, col: 0 });
      expect(transform.transformStart(0, -999)).toEqual({ row: 9, col: 0 });
    });

    it('should return coords that points to the first column when the offset is not used', () => {
      const transform = createTransformation({
        range: createSelectionRange(5, 2),
      });

      expect(transform.transformStart(0, -3)).toEqual({ row: 5, col: 0 });
      expect(transform.transformStart(0, -4)).toEqual({ row: 5, col: 0 });
      expect(transform.transformStart(0, -5)).toEqual({ row: 5, col: 0 });
      expect(transform.transformStart(0, -6)).toEqual({ row: 5, col: 0 });
      expect(transform.transformStart(0, -999)).toEqual({ row: 5, col: 0 });
    });

    it('should return coords that points to the first row when the offset is not used', () => {
      const transform = createTransformation({
        range: createSelectionRange(2, 5),
      });

      expect(transform.transformStart(-3, 0)).toEqual({ row: 0, col: 5 });
      expect(transform.transformStart(-4, 0)).toEqual({ row: 0, col: 5 });
      expect(transform.transformStart(-5, 0)).toEqual({ row: 0, col: 5 });
      expect(transform.transformStart(-6, 0)).toEqual({ row: 0, col: 5 });
      expect(transform.transformStart(-999, 0)).toEqual({ row: 0, col: 5 });
    });

    it('should return coords that points to the next column when the row delta is bigger than table rows count ' +
       'and `autoWrapCol` is enabled', () => {
      {
        const transform = createTransformation({
          range: createSelectionRange(5, 0),
          autoWrapCol: true,
        });

        expect(transform.transformStart(5, 0)).toEqual({ row: 0, col: 1 });
        expect(transform.transformStart(7, 0)).toEqual({ row: 2, col: 1 });
        expect(transform.transformStart(10, 0)).toEqual({ row: 5, col: 1 });
        expect(transform.transformStart(13, 0)).toEqual({ row: 8, col: 1 });
        expect(transform.transformStart(999, 0)).toEqual({ row: 9, col: 1 });
        expect(transform.transformStart(5, -1)).toEqual({ row: 0, col: 0 });
        expect(transform.transformStart(5, -2)).toEqual({ row: 0, col: 0 });
        expect(transform.transformStart(5, -999)).toEqual({ row: 0, col: 0 });
        expect(transform.transformStart(5, 1)).toEqual({ row: 0, col: 2 });
        expect(transform.transformStart(5, 2)).toEqual({ row: 0, col: 3 });
        expect(transform.transformStart(5, 7)).toEqual({ row: 0, col: 8 });
        expect(transform.transformStart(5, 8)).toEqual({ row: 0, col: 9 });
        expect(transform.transformStart(5, 9)).toEqual({ row: 0, col: 0 });
        expect(transform.transformStart(5, 999)).toEqual({ row: 0, col: 9 });
      }
      {
        const transform = createTransformation({
          range: createSelectionRange(5, 5),
          autoWrapCol: true,
        });

        expect(transform.transformStart(5, 0)).toEqual({ row: 0, col: 6 });
        expect(transform.transformStart(7, 0)).toEqual({ row: 2, col: 6 });
        expect(transform.transformStart(10, 0)).toEqual({ row: 5, col: 6 });
        expect(transform.transformStart(999, 0)).toEqual({ row: 9, col: 6 });
        expect(transform.transformStart(5, -1)).toEqual({ row: 0, col: 5 });
        expect(transform.transformStart(5, -2)).toEqual({ row: 0, col: 4 });
        expect(transform.transformStart(5, -999)).toEqual({ row: 0, col: 0 });
        expect(transform.transformStart(5, 1)).toEqual({ row: 0, col: 7 });
        expect(transform.transformStart(5, 2)).toEqual({ row: 0, col: 8 });
        expect(transform.transformStart(5, 3)).toEqual({ row: 0, col: 9 });
        expect(transform.transformStart(5, 4)).toEqual({ row: 0, col: 0 });
        expect(transform.transformStart(5, 999)).toEqual({ row: 0, col: 9 });
      }
      {
        const transform = createTransformation({
          range: createSelectionRange(5, 9),
          autoWrapCol: true,
        });

        expect(transform.transformStart(5, 0)).toEqual({ row: 0, col: 0 });
        expect(transform.transformStart(7, 0)).toEqual({ row: 2, col: 0 });
        expect(transform.transformStart(10, 0)).toEqual({ row: 5, col: 0 });
        expect(transform.transformStart(999, 0)).toEqual({ row: 9, col: 0 });
        expect(transform.transformStart(5, 1)).toEqual({ row: 0, col: 1 });
        expect(transform.transformStart(5, 2)).toEqual({ row: 0, col: 2 });
        expect(transform.transformStart(5, 8)).toEqual({ row: 0, col: 8 });
        expect(transform.transformStart(5, 9)).toEqual({ row: 0, col: 9 });
        expect(transform.transformStart(5, 999)).toEqual({ row: 0, col: 9 });
      }
    });

    it('should return coords that points to the previous column when the row delta is lower than the table rows count ' +
       'and `autoWrapCol` is enabled', () => {
      {
        const transform = createTransformation({
          range: createSelectionRange(5, 0),
          autoWrapCol: true,
        });

        expect(transform.transformStart(-6, 0)).toEqual({ row: 9, col: 9 });
        expect(transform.transformStart(-12, 0)).toEqual({ row: 3, col: 9 });
        expect(transform.transformStart(-15, 0)).toEqual({ row: 0, col: 9 });
        expect(transform.transformStart(-16, 0)).toEqual({ row: 0, col: 9 });
        expect(transform.transformStart(-999, 0)).toEqual({ row: 0, col: 9 });
        expect(transform.transformStart(-6, -1)).toEqual({ row: 9, col: 8 });
        expect(transform.transformStart(-6, -2)).toEqual({ row: 9, col: 7 });
        expect(transform.transformStart(-6, -3)).toEqual({ row: 9, col: 6 });
        expect(transform.transformStart(-6, -9)).toEqual({ row: 9, col: 0 });
        expect(transform.transformStart(-6, -10)).toEqual({ row: 9, col: 0 });
        expect(transform.transformStart(-6, -999)).toEqual({ row: 9, col: 0 });
        expect(transform.transformStart(-6, 1)).toEqual({ row: 9, col: 0 });
        expect(transform.transformStart(-6, 2)).toEqual({ row: 9, col: 1 });
        expect(transform.transformStart(-6, 999)).toEqual({ row: 9, col: 9 });
      }
      {
        const transform = createTransformation({
          range: createSelectionRange(5, 5),
          autoWrapCol: true,
        });

        expect(transform.transformStart(-6, 0)).toEqual({ row: 9, col: 4 });
        expect(transform.transformStart(-12, 0)).toEqual({ row: 3, col: 4 });
        expect(transform.transformStart(-15, 0)).toEqual({ row: 0, col: 4 });
        expect(transform.transformStart(-16, 0)).toEqual({ row: 0, col: 4 });
        expect(transform.transformStart(-999, 0)).toEqual({ row: 0, col: 4 });
        expect(transform.transformStart(-6, -1)).toEqual({ row: 9, col: 3 });
        expect(transform.transformStart(-6, -2)).toEqual({ row: 9, col: 2 });
        expect(transform.transformStart(-6, -3)).toEqual({ row: 9, col: 1 });
        expect(transform.transformStart(-6, -4)).toEqual({ row: 9, col: 0 });
        expect(transform.transformStart(-6, -5)).toEqual({ row: 9, col: 9 });
        expect(transform.transformStart(-6, -999)).toEqual({ row: 9, col: 0 });
        expect(transform.transformStart(-6, 1)).toEqual({ row: 9, col: 5 });
        expect(transform.transformStart(-6, 2)).toEqual({ row: 9, col: 6 });
        expect(transform.transformStart(-6, 999)).toEqual({ row: 9, col: 9 });
      }
      {
        const transform = createTransformation({
          range: createSelectionRange(5, 9),
          autoWrapCol: true,
        });

        expect(transform.transformStart(-6, 0)).toEqual({ row: 9, col: 8 });
        expect(transform.transformStart(-12, 0)).toEqual({ row: 3, col: 8 });
        expect(transform.transformStart(-15, 0)).toEqual({ row: 0, col: 8 });
        expect(transform.transformStart(-16, 0)).toEqual({ row: 0, col: 8 });
        expect(transform.transformStart(-999, 0)).toEqual({ row: 0, col: 8 });
        expect(transform.transformStart(-6, -1)).toEqual({ row: 9, col: 7 });
        expect(transform.transformStart(-6, -2)).toEqual({ row: 9, col: 6 });
        expect(transform.transformStart(-6, -3)).toEqual({ row: 9, col: 5 });
        expect(transform.transformStart(-6, -4)).toEqual({ row: 9, col: 4 });
        expect(transform.transformStart(-6, -5)).toEqual({ row: 9, col: 3 });
        expect(transform.transformStart(-6, -999)).toEqual({ row: 9, col: 0 });
        expect(transform.transformStart(-6, 1)).toEqual({ row: 9, col: 9 });
        expect(transform.transformStart(-6, 2)).toEqual({ row: 9, col: 9 });
        expect(transform.transformStart(-6, 999)).toEqual({ row: 9, col: 9 });
      }
    });

    it('should return coords that points to the next row when the column delta is bigger than table columns count ' +
       'and `autoWrapRow` is enabled', () => {
      {
        const transform = createTransformation({
          range: createSelectionRange(0, 5),
          autoWrapRow: true,
        });

        expect(transform.transformStart(0, 5)).toEqual({ row: 1, col: 0 });
        expect(transform.transformStart(0, 7)).toEqual({ row: 1, col: 2 });
        expect(transform.transformStart(0, 10)).toEqual({ row: 1, col: 5 });
        expect(transform.transformStart(0, 13)).toEqual({ row: 1, col: 8 });
        expect(transform.transformStart(0, 999)).toEqual({ row: 1, col: 9 });
        expect(transform.transformStart(-1, 5)).toEqual({ row: 0, col: 0 });
        expect(transform.transformStart(-2, 5)).toEqual({ row: 0, col: 0 });
        expect(transform.transformStart(-999, 5)).toEqual({ row: 0, col: 0 });
        expect(transform.transformStart(1, 5)).toEqual({ row: 2, col: 0 });
        expect(transform.transformStart(2, 5)).toEqual({ row: 3, col: 0 });
        expect(transform.transformStart(7, 5)).toEqual({ row: 8, col: 0 });
        expect(transform.transformStart(8, 5)).toEqual({ row: 9, col: 0 });
        expect(transform.transformStart(9, 5)).toEqual({ row: 0, col: 0 });
        expect(transform.transformStart(999, 5)).toEqual({ row: 9, col: 0 });
      }
      {
        const transform = createTransformation({
          range: createSelectionRange(5, 5),
          autoWrapRow: true,
        });

        expect(transform.transformStart(0, 5)).toEqual({ row: 6, col: 0 });
        expect(transform.transformStart(0, 7)).toEqual({ row: 6, col: 2 });
        expect(transform.transformStart(0, 10)).toEqual({ row: 6, col: 5 });
        expect(transform.transformStart(0, 999)).toEqual({ row: 6, col: 9 });
        expect(transform.transformStart(-1, 5)).toEqual({ row: 5, col: 0 });
        expect(transform.transformStart(-2, 5)).toEqual({ row: 4, col: 0 });
        expect(transform.transformStart(-999, 5)).toEqual({ row: 0, col: 0 });
        expect(transform.transformStart(1, 5)).toEqual({ row: 7, col: 0 });
        expect(transform.transformStart(2, 5)).toEqual({ row: 8, col: 0 });
        expect(transform.transformStart(3, 5)).toEqual({ row: 9, col: 0 });
        expect(transform.transformStart(4, 5)).toEqual({ row: 0, col: 0 });
        expect(transform.transformStart(999, 5)).toEqual({ row: 9, col: 0 });
      }
      {
        const transform = createTransformation({
          range: createSelectionRange(9, 5),
          autoWrapRow: true,
        });

        expect(transform.transformStart(0, 5)).toEqual({ row: 0, col: 0 });
        expect(transform.transformStart(0, 7)).toEqual({ row: 0, col: 2 });
        expect(transform.transformStart(0, 10)).toEqual({ row: 0, col: 5 });
        expect(transform.transformStart(0, 999)).toEqual({ row: 0, col: 9 });
        expect(transform.transformStart(1, 5)).toEqual({ row: 1, col: 0 });
        expect(transform.transformStart(2, 5)).toEqual({ row: 2, col: 0 });
        expect(transform.transformStart(8, 5)).toEqual({ row: 8, col: 0 });
        expect(transform.transformStart(9, 5)).toEqual({ row: 9, col: 0 });
        expect(transform.transformStart(999, 5)).toEqual({ row: 9, col: 0 });
      }
    });

    it('should return coords that points to the previous row when the column delta is lower than the table columns count ' +
       'and `autoWrapRow` is enabled', () => {
      {
        const transform = createTransformation({
          range: createSelectionRange(0, 5),
          autoWrapRow: true,
        });

        expect(transform.transformStart(0, -6)).toEqual({ row: 9, col: 9 });
        expect(transform.transformStart(0, -12)).toEqual({ row: 9, col: 3 });
        expect(transform.transformStart(0, -15)).toEqual({ row: 9, col: 0 });
        expect(transform.transformStart(0, -16)).toEqual({ row: 9, col: 0 });
        expect(transform.transformStart(0, -999)).toEqual({ row: 9, col: 0 });
        expect(transform.transformStart(-1, -6)).toEqual({ row: 8, col: 9 });
        expect(transform.transformStart(-2, -6)).toEqual({ row: 7, col: 9 });
        expect(transform.transformStart(-3, -6)).toEqual({ row: 6, col: 9 });
        expect(transform.transformStart(-9, -6)).toEqual({ row: 0, col: 9 });
        expect(transform.transformStart(-10, -6)).toEqual({ row: 0, col: 9 });
        expect(transform.transformStart(-999, -6)).toEqual({ row: 0, col: 9 });
        expect(transform.transformStart(1, -6)).toEqual({ row: 0, col: 9 });
        expect(transform.transformStart(2, -6)).toEqual({ row: 1, col: 9 });
        expect(transform.transformStart(999, -6)).toEqual({ row: 9, col: 9 });
      }
      {
        const transform = createTransformation({
          range: createSelectionRange(5, 5),
          autoWrapRow: true,
        });

        expect(transform.transformStart(0, -6)).toEqual({ row: 4, col: 9 });
        expect(transform.transformStart(0, -12)).toEqual({ row: 4, col: 3 });
        expect(transform.transformStart(0, -15)).toEqual({ row: 4, col: 0 });
        expect(transform.transformStart(0, -16)).toEqual({ row: 4, col: 0 });
        expect(transform.transformStart(0, -999)).toEqual({ row: 4, col: 0 });
        expect(transform.transformStart(-1, -6)).toEqual({ row: 3, col: 9 });
        expect(transform.transformStart(-2, -6)).toEqual({ row: 2, col: 9 });
        expect(transform.transformStart(-3, -6)).toEqual({ row: 1, col: 9 });
        expect(transform.transformStart(-4, -6)).toEqual({ row: 0, col: 9 });
        expect(transform.transformStart(-5, -6)).toEqual({ row: 9, col: 9 });
        expect(transform.transformStart(-999, -6)).toEqual({ row: 0, col: 9 });
        expect(transform.transformStart(1, -6)).toEqual({ row: 5, col: 9 });
        expect(transform.transformStart(2, -6)).toEqual({ row: 6, col: 9 });
        expect(transform.transformStart(999, -6)).toEqual({ row: 9, col: 9 });
      }
      {
        const transform = createTransformation({
          range: createSelectionRange(9, 5),
          autoWrapRow: true,
        });

        expect(transform.transformStart(0, -6)).toEqual({ row: 8, col: 9 });
        expect(transform.transformStart(0, -12)).toEqual({ row: 8, col: 3 });
        expect(transform.transformStart(0, -15)).toEqual({ row: 8, col: 0 });
        expect(transform.transformStart(0, -16)).toEqual({ row: 8, col: 0 });
        expect(transform.transformStart(0, -999)).toEqual({ row: 8, col: 0 });
        expect(transform.transformStart(-1, -6)).toEqual({ row: 7, col: 9 });
        expect(transform.transformStart(-2, -6)).toEqual({ row: 6, col: 9 });
        expect(transform.transformStart(-3, -6)).toEqual({ row: 5, col: 9 });
        expect(transform.transformStart(-4, -6)).toEqual({ row: 4, col: 9 });
        expect(transform.transformStart(-5, -6)).toEqual({ row: 3, col: 9 });
        expect(transform.transformStart(-999, -6)).toEqual({ row: 0, col: 9 });
        expect(transform.transformStart(1, -6)).toEqual({ row: 9, col: 9 });
        expect(transform.transformStart(2, -6)).toEqual({ row: 9, col: 9 });
        expect(transform.transformStart(999, -6)).toEqual({ row: 9, col: 9 });
      }
    });

    it('should return coords that points to the row header when offset is used', () => {
      const transform = createTransformation({
        range: createSelectionRange(5, 2),
      });

      transform.setOffsetSize({
        x: 3,
        y: 0,
      });

      expect(transform.transformStart(0, -3)).toEqual({ row: 5, col: -1 });
      expect(transform.transformStart(0, -4)).toEqual({ row: 5, col: -2 });
      expect(transform.transformStart(0, -5)).toEqual({ row: 5, col: -3 });
      expect(transform.transformStart(0, -6)).toEqual({ row: 5, col: -3 });
      expect(transform.transformStart(0, -999)).toEqual({ row: 5, col: -3 });
    });

    it('should return coords that points to the column header when offset is used', () => {
      const transform = createTransformation({
        range: createSelectionRange(2, 5),
      });

      transform.setOffsetSize({
        x: 0,
        y: 3,
      });

      expect(transform.transformStart(-3, 0)).toEqual({ row: -1, col: 5 });
      expect(transform.transformStart(-4, 0)).toEqual({ row: -2, col: 5 });
      expect(transform.transformStart(-5, 0)).toEqual({ row: -3, col: 5 });
      expect(transform.transformStart(-6, 0)).toEqual({ row: -3, col: 5 });
      expect(transform.transformStart(-999, 0)).toEqual({ row: -3, col: 5 });
    });

    it('should return coords that points to the next column when the row delta is bigger than table total records count ' +
       '(rows + column headers used as offset) and `autoWrapCol` is enabled', () => {
      {
        const transform = createTransformation({
          range: createSelectionRange(5, -3),
          autoWrapCol: true,
        });

        transform.setOffsetSize({
          x: 3,
          y: 3,
        });

        expect(transform.transformStart(5, 0)).toEqual({ row: -3, col: -2 });
        expect(transform.transformStart(7, 0)).toEqual({ row: -1, col: -2 });
        expect(transform.transformStart(10, 0)).toEqual({ row: 2, col: -2 });
        expect(transform.transformStart(13, 0)).toEqual({ row: 5, col: -2 });
        expect(transform.transformStart(999, 0)).toEqual({ row: 9, col: -2 });
        expect(transform.transformStart(5, -1)).toEqual({ row: -3, col: -3 });
        expect(transform.transformStart(5, -2)).toEqual({ row: -3, col: -3 });
        expect(transform.transformStart(5, -999)).toEqual({ row: -3, col: -3 });
        expect(transform.transformStart(5, 1)).toEqual({ row: -3, col: -1 });
        expect(transform.transformStart(5, 2)).toEqual({ row: -3, col: 0 });
        expect(transform.transformStart(5, 7)).toEqual({ row: -3, col: 5 });
        expect(transform.transformStart(5, 8)).toEqual({ row: -3, col: 6 });
        expect(transform.transformStart(5, 9)).toEqual({ row: -3, col: 7 });
        expect(transform.transformStart(5, 999)).toEqual({ row: -3, col: 9 });
      }
      {
        const transform = createTransformation({
          range: createSelectionRange(5, 5),
          autoWrapCol: true,
        });

        transform.setOffsetSize({
          x: 3,
          y: 3,
        });

        expect(transform.transformStart(5, 0)).toEqual({ row: -3, col: 6 });
        expect(transform.transformStart(7, 0)).toEqual({ row: -1, col: 6 });
        expect(transform.transformStart(10, 0)).toEqual({ row: 2, col: 6 });
        expect(transform.transformStart(13, 0)).toEqual({ row: 5, col: 6 });
        expect(transform.transformStart(999, 0)).toEqual({ row: 9, col: 6 });
        expect(transform.transformStart(5, -1)).toEqual({ row: -3, col: 5 });
        expect(transform.transformStart(5, -2)).toEqual({ row: -3, col: 4 });
        expect(transform.transformStart(5, -999)).toEqual({ row: -3, col: -3 });
        expect(transform.transformStart(5, 1)).toEqual({ row: -3, col: 7 });
        expect(transform.transformStart(5, 2)).toEqual({ row: -3, col: 8 });
        expect(transform.transformStart(5, 7)).toEqual({ row: -3, col: 0 });
        expect(transform.transformStart(5, 9)).toEqual({ row: -3, col: 2 });
        expect(transform.transformStart(5, 999)).toEqual({ row: -3, col: 9 });
      }
      {
        const transform = createTransformation({
          range: createSelectionRange(5, 9),
          autoWrapCol: true,
        });

        transform.setOffsetSize({
          x: 3,
          y: 3,
        });

        expect(transform.transformStart(5, 0)).toEqual({ row: -3, col: -3 });
        expect(transform.transformStart(7, 0)).toEqual({ row: -1, col: -3 });
        expect(transform.transformStart(10, 0)).toEqual({ row: 2, col: -3 });
        expect(transform.transformStart(13, 0)).toEqual({ row: 5, col: -3 });
        expect(transform.transformStart(999, 0)).toEqual({ row: 9, col: -3 });
        expect(transform.transformStart(5, -1)).toEqual({ row: -3, col: 9 });
        expect(transform.transformStart(5, -2)).toEqual({ row: -3, col: 8 });
        expect(transform.transformStart(5, -999)).toEqual({ row: -3, col: -3 });
        expect(transform.transformStart(5, 1)).toEqual({ row: -3, col: -2 });
        expect(transform.transformStart(5, 2)).toEqual({ row: -3, col: -1 });
        expect(transform.transformStart(5, 7)).toEqual({ row: -3, col: 4 });
        expect(transform.transformStart(5, 9)).toEqual({ row: -3, col: 6 });
        expect(transform.transformStart(5, 999)).toEqual({ row: -3, col: 9 });
      }
    });

    it('should return coords that points to the previous column when the row delta is lower than the table total records count ' +
       '(rows + column headers used as offset) and `autoWrapCol` is enabled', () => {
      {
        const transform = createTransformation({
          range: createSelectionRange(5, -3),
          autoWrapCol: true,
        });

        transform.setOffsetSize({
          x: 3,
          y: 3,
        });

        expect(transform.transformStart(-9, 0)).toEqual({ row: 9, col: 9 });
        expect(transform.transformStart(-15, 0)).toEqual({ row: 3, col: 9 });
        expect(transform.transformStart(-18, 0)).toEqual({ row: 0, col: 9 });
        expect(transform.transformStart(-21, 0)).toEqual({ row: -3, col: 9 });
        expect(transform.transformStart(-999, 0)).toEqual({ row: -3, col: 9 });
        expect(transform.transformStart(-9, -1)).toEqual({ row: 9, col: 8 });
        expect(transform.transformStart(-9, -2)).toEqual({ row: 9, col: 7 });
        expect(transform.transformStart(-9, -3)).toEqual({ row: 9, col: 6 });
        expect(transform.transformStart(-9, -9)).toEqual({ row: 9, col: 0 });
        expect(transform.transformStart(-9, -10)).toEqual({ row: 9, col: -1 });
        expect(transform.transformStart(-9, -999)).toEqual({ row: 9, col: -3 });
        expect(transform.transformStart(-9, 1)).toEqual({ row: 9, col: -3 });
        expect(transform.transformStart(-9, 2)).toEqual({ row: 9, col: -2 });
        expect(transform.transformStart(-9, 999)).toEqual({ row: 9, col: 9 });
      }
      {
        const transform = createTransformation({
          range: createSelectionRange(5, 5),
          autoWrapCol: true,
        });

        transform.setOffsetSize({
          x: 3,
          y: 3,
        });

        expect(transform.transformStart(-9, 0)).toEqual({ row: 9, col: 4 });
        expect(transform.transformStart(-15, 0)).toEqual({ row: 3, col: 4 });
        expect(transform.transformStart(-18, 0)).toEqual({ row: 0, col: 4 });
        expect(transform.transformStart(-21, 0)).toEqual({ row: -3, col: 4 });
        expect(transform.transformStart(-999, 0)).toEqual({ row: -3, col: 4 });
        expect(transform.transformStart(-9, -1)).toEqual({ row: 9, col: 3 });
        expect(transform.transformStart(-9, -2)).toEqual({ row: 9, col: 2 });
        expect(transform.transformStart(-9, -3)).toEqual({ row: 9, col: 1 });
        expect(transform.transformStart(-9, -9)).toEqual({ row: 9, col: 8 });
        expect(transform.transformStart(-9, -10)).toEqual({ row: 9, col: 7 });
        expect(transform.transformStart(-9, -999)).toEqual({ row: 9, col: -3 });
        expect(transform.transformStart(-9, 1)).toEqual({ row: 9, col: 5 });
        expect(transform.transformStart(-9, 2)).toEqual({ row: 9, col: 6 });
        expect(transform.transformStart(-9, 999)).toEqual({ row: 9, col: 9 });
      }
      {
        const transform = createTransformation({
          range: createSelectionRange(5, 9),
          autoWrapCol: true,
        });

        transform.setOffsetSize({
          x: 3,
          y: 3,
        });

        expect(transform.transformStart(-9, 0)).toEqual({ row: 9, col: 8 });
        expect(transform.transformStart(-15, 0)).toEqual({ row: 3, col: 8 });
        expect(transform.transformStart(-18, 0)).toEqual({ row: 0, col: 8 });
        expect(transform.transformStart(-21, 0)).toEqual({ row: -3, col: 8 });
        expect(transform.transformStart(-999, 0)).toEqual({ row: -3, col: 8 });
        expect(transform.transformStart(-9, -1)).toEqual({ row: 9, col: 7 });
        expect(transform.transformStart(-9, -2)).toEqual({ row: 9, col: 6 });
        expect(transform.transformStart(-9, -3)).toEqual({ row: 9, col: 5 });
        expect(transform.transformStart(-9, -9)).toEqual({ row: 9, col: -1 });
        expect(transform.transformStart(-9, -10)).toEqual({ row: 9, col: -2 });
        expect(transform.transformStart(-9, -999)).toEqual({ row: 9, col: -3 });
        expect(transform.transformStart(-9, 1)).toEqual({ row: 9, col: 9 });
        expect(transform.transformStart(-9, 2)).toEqual({ row: 9, col: 9 });
        expect(transform.transformStart(-9, 999)).toEqual({ row: 9, col: 9 });
      }
    });

    it('should return coords that points to the next row when the column delta is bigger than table total records count ' +
       '(columns + row headers used as offset) and `autoWrapRow` is enabled', () => {
      {
        const transform = createTransformation({
          range: createSelectionRange(-3, 5),
          autoWrapRow: true,
        });

        transform.setOffsetSize({
          x: 3,
          y: 3,
        });

        expect(transform.transformStart(0, 5)).toEqual({ row: -2, col: -3 });
        expect(transform.transformStart(0, 7)).toEqual({ row: -2, col: -1 });
        expect(transform.transformStart(0, 10)).toEqual({ row: -2, col: 2 });
        expect(transform.transformStart(0, 13)).toEqual({ row: -2, col: 5 });
        expect(transform.transformStart(0, 999)).toEqual({ row: -2, col: 9 });
        expect(transform.transformStart(-1, 5)).toEqual({ row: -3, col: -3 });
        expect(transform.transformStart(-2, 5)).toEqual({ row: -3, col: -3 });
        expect(transform.transformStart(-999, 5)).toEqual({ row: -3, col: -3 });
        expect(transform.transformStart(1, 5)).toEqual({ row: -1, col: -3 });
        expect(transform.transformStart(2, 5)).toEqual({ row: 0, col: -3 });
        expect(transform.transformStart(7, 5)).toEqual({ row: 5, col: -3 });
        expect(transform.transformStart(8, 5)).toEqual({ row: 6, col: -3 });
        expect(transform.transformStart(9, 5)).toEqual({ row: 7, col: -3 });
        expect(transform.transformStart(999, 5)).toEqual({ row: 9, col: -3 });
      }
      {
        const transform = createTransformation({
          range: createSelectionRange(5, 5),
          autoWrapRow: true,
        });

        transform.setOffsetSize({
          x: 3,
          y: 3,
        });

        expect(transform.transformStart(0, 5)).toEqual({ row: 6, col: -3 });
        expect(transform.transformStart(0, 7)).toEqual({ row: 6, col: -1 });
        expect(transform.transformStart(0, 10)).toEqual({ row: 6, col: 2 });
        expect(transform.transformStart(0, 13)).toEqual({ row: 6, col: 5 });
        expect(transform.transformStart(0, 999)).toEqual({ row: 6, col: 9 });
        expect(transform.transformStart(-1, 5)).toEqual({ row: 5, col: -3 });
        expect(transform.transformStart(-2, 5)).toEqual({ row: 4, col: -3 });
        expect(transform.transformStart(-999, 5)).toEqual({ row: -3, col: -3 });
        expect(transform.transformStart(1, 5)).toEqual({ row: 7, col: -3 });
        expect(transform.transformStart(2, 5)).toEqual({ row: 8, col: -3 });
        expect(transform.transformStart(7, 5)).toEqual({ row: 0, col: -3 });
        expect(transform.transformStart(9, 5)).toEqual({ row: 2, col: -3 });
        expect(transform.transformStart(999, 5)).toEqual({ row: 9, col: -3 });
      }
      {
        const transform = createTransformation({
          range: createSelectionRange(9, 5),
          autoWrapRow: true,
        });

        transform.setOffsetSize({
          x: 3,
          y: 3,
        });

        expect(transform.transformStart(0, 5)).toEqual({ row: -3, col: -3 });
        expect(transform.transformStart(0, 7)).toEqual({ row: -3, col: -1 });
        expect(transform.transformStart(0, 10)).toEqual({ row: -3, col: 2 });
        expect(transform.transformStart(0, 13)).toEqual({ row: -3, col: 5 });
        expect(transform.transformStart(0, 999)).toEqual({ row: -3, col: 9 });
        expect(transform.transformStart(-1, 5)).toEqual({ row: 9, col: -3 });
        expect(transform.transformStart(-2, 5)).toEqual({ row: 8, col: -3 });
        expect(transform.transformStart(-999, 5)).toEqual({ row: -3, col: -3 });
        expect(transform.transformStart(1, 5)).toEqual({ row: -2, col: -3 });
        expect(transform.transformStart(2, 5)).toEqual({ row: -1, col: -3 });
        expect(transform.transformStart(7, 5)).toEqual({ row: 4, col: -3 });
        expect(transform.transformStart(9, 5)).toEqual({ row: 6, col: -3 });
        expect(transform.transformStart(999, 5)).toEqual({ row: 9, col: -3 });
      }
    });

    it('should return coords that points to the previous row when the column delta is lower than the table total records count ' +
       '(cells + headers used as offset) and `autoWrapRow` is enabled', () => {
      {
        const transform = createTransformation({
          range: createSelectionRange(-3, 5),
          autoWrapRow: true,
        });

        transform.setOffsetSize({
          x: 3,
          y: 3,
        });

        expect(transform.transformStart(0, -9)).toEqual({ row: 9, col: 9 });
        expect(transform.transformStart(0, -15)).toEqual({ row: 9, col: 3 });
        expect(transform.transformStart(0, -18)).toEqual({ row: 9, col: 0 });
        expect(transform.transformStart(0, -21)).toEqual({ row: 9, col: -3 });
        expect(transform.transformStart(0, -999)).toEqual({ row: 9, col: -3 });
        expect(transform.transformStart(-1, -9)).toEqual({ row: 8, col: 9 });
        expect(transform.transformStart(-2, -9)).toEqual({ row: 7, col: 9 });
        expect(transform.transformStart(-3, -9)).toEqual({ row: 6, col: 9 });
        expect(transform.transformStart(-9, -9)).toEqual({ row: 0, col: 9 });
        expect(transform.transformStart(-10, -9)).toEqual({ row: -1, col: 9 });
        expect(transform.transformStart(-999, -9)).toEqual({ row: -3, col: 9 });
        expect(transform.transformStart(1, -9)).toEqual({ row: -3, col: 9 });
        expect(transform.transformStart(2, -9)).toEqual({ row: -2, col: 9 });
        expect(transform.transformStart(999, -9)).toEqual({ row: 9, col: 9 });
      }
      {
        const transform = createTransformation({
          range: createSelectionRange(5, 5),
          autoWrapRow: true,
        });

        transform.setOffsetSize({
          x: 3,
          y: 3,
        });

        expect(transform.transformStart(0, -9)).toEqual({ row: 4, col: 9 });
        expect(transform.transformStart(0, -15)).toEqual({ row: 4, col: 3 });
        expect(transform.transformStart(0, -18)).toEqual({ row: 4, col: 0 });
        expect(transform.transformStart(0, -21)).toEqual({ row: 4, col: -3 });
        expect(transform.transformStart(0, -999)).toEqual({ row: 4, col: -3 });
        expect(transform.transformStart(-1, -9)).toEqual({ row: 3, col: 9 });
        expect(transform.transformStart(-2, -9)).toEqual({ row: 2, col: 9 });
        expect(transform.transformStart(-3, -9)).toEqual({ row: 1, col: 9 });
        expect(transform.transformStart(-9, -9)).toEqual({ row: 8, col: 9 });
        expect(transform.transformStart(-10, -9)).toEqual({ row: 7, col: 9 });
        expect(transform.transformStart(-999, -9)).toEqual({ row: -3, col: 9 });
        expect(transform.transformStart(1, -9)).toEqual({ row: 5, col: 9 });
        expect(transform.transformStart(2, -9)).toEqual({ row: 6, col: 9 });
        expect(transform.transformStart(999, -9)).toEqual({ row: 9, col: 9 });
      }
      {
        const transform = createTransformation({
          range: createSelectionRange(9, 5),
          autoWrapRow: true,
        });

        transform.setOffsetSize({
          x: 3,
          y: 3,
        });

        expect(transform.transformStart(0, -9)).toEqual({ row: 8, col: 9 });
        expect(transform.transformStart(0, -15)).toEqual({ row: 8, col: 3 });
        expect(transform.transformStart(0, -18)).toEqual({ row: 8, col: 0 });
        expect(transform.transformStart(0, -21)).toEqual({ row: 8, col: -3 });
        expect(transform.transformStart(0, -999)).toEqual({ row: 8, col: -3 });
        expect(transform.transformStart(-1, -9)).toEqual({ row: 7, col: 9 });
        expect(transform.transformStart(-2, -9)).toEqual({ row: 6, col: 9 });
        expect(transform.transformStart(-3, -9)).toEqual({ row: 5, col: 9 });
        expect(transform.transformStart(-9, -9)).toEqual({ row: -1, col: 9 });
        expect(transform.transformStart(-10, -9)).toEqual({ row: -2, col: 9 });
        expect(transform.transformStart(-999, -9)).toEqual({ row: -3, col: 9 });
        expect(transform.transformStart(1, -9)).toEqual({ row: 9, col: 9 });
        expect(transform.transformStart(2, -9)).toEqual({ row: 9, col: 9 });
        expect(transform.transformStart(999, -9)).toEqual({ row: 9, col: 9 });
      }
    });

    describe('`insertRowRequire` hook', () => {
      it('should fired when the row delta exceeds the row beyond the table range', () => {
        const hookListener = { insertRowRequire() {} };

        spyOn(hookListener, 'insertRowRequire');

        const transform = createTransformation({
          range: createSelectionRange(0, 0),
          minSpareRows: 1,
        });

        transform.addLocalHook('insertRowRequire', hookListener.insertRowRequire);
        transform.transformStart(10, 2, true);

        expect(hookListener.insertRowRequire).toHaveBeenCalledWith(10);
      });

      it('should not be fired when the row delta does not exceed the row beyond the table range', () => {
        const hookListener = { insertRowRequire() {} };

        spyOn(hookListener, 'insertRowRequire');

        const transform = createTransformation({
          range: createSelectionRange(0, 0),
          minSpareRows: 1,
        });

        transform.addLocalHook('insertRowRequire', hookListener.insertRowRequire);
        transform.transformStart(1, 2, true);

        expect(hookListener.insertRowRequire).not.toHaveBeenCalled();
      });

      it('should not be fired when the `minSpareRows` options equals to 0', () => {
        const hookListener = { insertRowRequire() {} };

        spyOn(hookListener, 'insertRowRequire');

        const transform = createTransformation({
          range: createSelectionRange(0, 0),
          minSpareRows: 0,
        });

        transform.addLocalHook('insertRowRequire', hookListener.insertRowRequire);
        transform.transformStart(10, 2, true);

        expect(hookListener.insertRowRequire).not.toHaveBeenCalled();
      });

      it('should not be fired when the `fixedRowsBottom` options is greater than to 0', () => {
        const hookListener = { insertRowRequire() {} };

        spyOn(hookListener, 'insertRowRequire');

        const transform = createTransformation({
          range: createSelectionRange(0, 0),
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

        const transform = createTransformation({
          range: createSelectionRange(0, 0),
          minSpareCols: 1,
        });

        transform.addLocalHook('insertColRequire', hookListener.insertColRequire);
        transform.transformStart(2, 10, true);

        expect(hookListener.insertColRequire).toHaveBeenCalledWith(10);
      });

      it('should not be fired when the column delta does not exceed the column beyond the table range', () => {
        const hookListener = { insertColRequire() {} };

        spyOn(hookListener, 'insertColRequire');

        const transform = createTransformation({
          range: createSelectionRange(0, 0),
          minSpareCols: 1,
        });

        transform.addLocalHook('insertColRequire', hookListener.insertColRequire);
        transform.transformStart(2, 1, true);

        expect(hookListener.insertColRequire).not.toHaveBeenCalled();
      });

      it('should not be fired when the `minSpareCols` options equals to 0', () => {
        const hookListener = { insertColRequire() {} };

        spyOn(hookListener, 'insertColRequire');

        const transform = createTransformation({
          range: createSelectionRange(0, 0),
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

        const transform = createTransformation({
          range: createSelectionRange(1, 1)
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

        const transform = createTransformation({
          range: createSelectionRange(1, 1)
        });

        transform.addLocalHook('afterTransformStart', hookListener.afterTransformStart);
        transform.transformStart(4, 2);

        expect(hookListener.afterTransformStart).toHaveBeenCalledWith({ row: 5, col: 3 }, 0, 0);
      });

      it('should be fired with arguments that indicates the row index exceeded the limit of the table range ' +
         '(upper limit)', () => {
        const hookListener = { afterTransformStart() {} };

        spyOn(hookListener, 'afterTransformStart');

        const transform = createTransformation({
          range: createSelectionRange(1, 1),
        });

        transform.setOffsetSize({
          x: 3,
          y: 3,
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

          const transform = createTransformation({
            range: createSelectionRange(1, 1),
          });

          transform.setOffsetSize({
            x: 3,
            y: 3,
          });

          transform.addLocalHook('afterTransformStart', hookListener.afterTransformStart);
          transform.transformStart(-999, 0);

          expect(hookListener.afterTransformStart).toHaveBeenCalledWith({ row: -3, col: 1 }, -1, 0);
        }
        {
          const hookListener = { afterTransformStart() {} };

          spyOn(hookListener, 'afterTransformStart');

          const transform = createTransformation({
            range: createSelectionRange(1, 1),
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

        const transform = createTransformation({
          range: createSelectionRange(1, 1),
        });

        transform.setOffsetSize({
          x: 3,
          y: 3,
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

          const transform = createTransformation({
            range: createSelectionRange(1, 1),
          });

          transform.setOffsetSize({
            x: 3,
            y: 3,
          });

          transform.addLocalHook('afterTransformStart', hookListener.afterTransformStart);
          transform.transformStart(0, -999);

          expect(hookListener.afterTransformStart).toHaveBeenCalledWith({ row: 1, col: -3 }, 0, -1);
        }
        {
          const hookListener = { afterTransformStart() {} };

          spyOn(hookListener, 'afterTransformStart');

          const transform = createTransformation({
            range: createSelectionRange(1, 1),
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

        const transform = createTransformation({
          range: createSelectionRange(4, 4),
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

        const transform = createTransformation({
          range: createSelectionRange(5, 5),
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

        const transform = createTransformation({
          range: createSelectionRange(9, 9),
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

        const transform = createTransformation({
          range: createSelectionRange(0, 0),
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

        const transform = createTransformation({
          range: createSelectionRange(5, 5),
        });

        transform.addLocalHook('beforeColumnWrap', hookListener.beforeColumnWrap);
        transform.transformStart(1, 0);

        expect(hookListener.beforeColumnWrap).not.toHaveBeenCalled();
      });

      it('should be fired with first argument as `true` when wrapping is enabled', () => {
        const hookListener = { beforeColumnWrap() {} };

        spyOn(hookListener, 'beforeColumnWrap');

        const transform = createTransformation({
          range: createSelectionRange(4, 4),
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

        const transform = createTransformation({
          range: createSelectionRange(4, 4),
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

        const transform = createTransformation({
          range: createSelectionRange(4, 4),
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

        const transform = createTransformation({
          range: createSelectionRange(5, 5),
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

        const transform = createTransformation({
          range: createSelectionRange(9, 9),
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

        const transform = createTransformation({
          range: createSelectionRange(0, 0),
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

        const transform = createTransformation({
          range: createSelectionRange(5, 5),
        });

        transform.addLocalHook('beforeRowWrap', hookListener.beforeRowWrap);
        transform.transformStart(0, 1);

        expect(hookListener.beforeRowWrap).not.toHaveBeenCalled();
      });

      it('should be fired with first argument as `true` when wrapping is enabled', () => {
        const hookListener = { beforeRowWrap() {} };

        spyOn(hookListener, 'beforeRowWrap');

        const transform = createTransformation({
          range: createSelectionRange(4, 4),
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

        const transform = createTransformation({
          range: createSelectionRange(4, 4),
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
      const transform = createTransformation({
        range: createSelectionRange(null, null, 0, 0, 3, 4)
      });

      expect(transform.transformEnd(0, 0)).toEqual({ row: 3, col: 4 });
    });

    it('should return coords with row moved by row delta (positive value)', () => {
      const transform = createTransformation({
        range: createSelectionRange(0, 0, 0, 0, 1, 1)
      });

      expect(transform.transformEnd(0, 0)).toEqual({ row: 1, col: 1 });
      expect(transform.transformEnd(4, 0)).toEqual({ row: 5, col: 1 });
    });

    it('should return coords with column moved by column delta (positive value)', () => {
      const transform = createTransformation({
        range: createSelectionRange(0, 0, 0, 0, 1, 1)
      });

      expect(transform.transformEnd(0, 0)).toEqual({ row: 1, col: 1 });
      expect(transform.transformEnd(0, 4)).toEqual({ row: 1, col: 5 });
    });

    it('should return coords with row moved by row delta (negative value)', () => {
      const transform = createTransformation({
        range: createSelectionRange(0, 0, 0, 0, 8, 8)
      });

      expect(transform.transformEnd(-4, 0)).toEqual({ row: 4, col: 8 });
    });

    it('should return coords with column moved by column delta (negative value)', () => {
      const transform = createTransformation({
        range: createSelectionRange(0, 0, 0, 0, 8, 8)
      });

      expect(transform.transformEnd(0, -4)).toEqual({ row: 8, col: 4 });
    });

    it('should not return coords that point out of the table when row delta is bigger than total number of rows (positive value)', () => {
      const transform = createTransformation({
        range: createSelectionRange(0, 0, 0, 0, 1, 1)
      });

      expect(transform.transformEnd(8, 0)).toEqual({ row: 9, col: 1 });
      expect(transform.transformEnd(9, 0)).toEqual({ row: 9, col: 1 });
      expect(transform.transformEnd(999, 0)).toEqual({ row: 9, col: 1 });
    });

    it('should not return coords that point out of the table when column delta is bigger than total number of columns (positive value)', () => {
      const transform = createTransformation({
        range: createSelectionRange(0, 0, 0, 0, 1, 1)
      });

      expect(transform.transformEnd(0, 8)).toEqual({ row: 1, col: 9 });
      expect(transform.transformEnd(0, 9)).toEqual({ row: 1, col: 9 });
      expect(transform.transformEnd(0, 999)).toEqual({ row: 1, col: 9 });
    });

    it('should not return coords that point out of the table when row delta is bigger than total number of rows (negative value)', () => {
      const transform = createTransformation({
        range: createSelectionRange(0, 0, 0, 0, 9, 9)
      });

      expect(transform.transformEnd(-8, 0)).toEqual({ row: 1, col: 9 });
      expect(transform.transformEnd(-9, 0)).toEqual({ row: 0, col: 9 });
      expect(transform.transformEnd(-999, 0)).toEqual({ row: 0, col: 9 });
    });

    it('should not return coords that point out of the table when column delta is bigger than total number of columns (negative value)', () => {
      const transform = createTransformation({
        range: createSelectionRange(0, 0, 0, 0, 9, 9)
      });

      expect(transform.transformEnd(0, -8)).toEqual({ row: 9, col: 1 });
      expect(transform.transformEnd(0, -9)).toEqual({ row: 9, col: 0 });
      expect(transform.transformEnd(0, -999)).toEqual({ row: 9, col: 0 });
    });

    it('should return coords that points to the first column when the offset is not used', () => {
      const transform = createTransformation({
        range: createSelectionRange(0, 0, 0, 0, 5, 2),
      });

      expect(transform.transformEnd(0, -3)).toEqual({ row: 5, col: 0 });
      expect(transform.transformEnd(0, -4)).toEqual({ row: 5, col: 0 });
      expect(transform.transformEnd(0, -5)).toEqual({ row: 5, col: 0 });
      expect(transform.transformEnd(0, -6)).toEqual({ row: 5, col: 0 });
      expect(transform.transformEnd(0, -999)).toEqual({ row: 5, col: 0 });
    });

    it('should return coords that points to the first row when the offset is not used', () => {
      const transform = createTransformation({
        range: createSelectionRange(0, 0, 0, 0, 2, 5),
      });

      expect(transform.transformEnd(-3, 0)).toEqual({ row: 0, col: 5 });
      expect(transform.transformEnd(-4, 0)).toEqual({ row: 0, col: 5 });
      expect(transform.transformEnd(-5, 0)).toEqual({ row: 0, col: 5 });
      expect(transform.transformEnd(-6, 0)).toEqual({ row: 0, col: 5 });
      expect(transform.transformEnd(-999, 0)).toEqual({ row: 0, col: 5 });
    });

    it('should return coords that points to the row header when the offset is used', () => {
      const transform = createTransformation({
        range: createSelectionRange(0, 0, 0, 0, 5, 2),
      });

      transform.setOffsetSize({
        x: 3,
        y: 3,
      });

      expect(transform.transformEnd(0, -1)).toEqual({ row: 5, col: 1 });
      expect(transform.transformEnd(0, -2)).toEqual({ row: 5, col: 0 });
      expect(transform.transformEnd(0, -3)).toEqual({ row: 5, col: -1 });
      expect(transform.transformEnd(0, -4)).toEqual({ row: 5, col: -2 });
      expect(transform.transformEnd(0, -5)).toEqual({ row: 5, col: -3 });
      expect(transform.transformEnd(0, -6)).toEqual({ row: 5, col: -3 });
      expect(transform.transformEnd(0, -999)).toEqual({ row: 5, col: -3 });
    });

    it('should return coords that points to the column header when the offset is used', () => {
      const transform = createTransformation({
        range: createSelectionRange(0, 0, 0, 0, 2, 5),
      });

      transform.setOffsetSize({
        x: 3,
        y: 3,
      });

      expect(transform.transformEnd(-1, 0)).toEqual({ row: 1, col: 5 });
      expect(transform.transformEnd(-2, 0)).toEqual({ row: 0, col: 5 });
      expect(transform.transformEnd(-3, 0)).toEqual({ row: -1, col: 5 });
      expect(transform.transformEnd(-4, 0)).toEqual({ row: -2, col: 5 });
      expect(transform.transformEnd(-5, 0)).toEqual({ row: -3, col: 5 });
      expect(transform.transformEnd(-6, 0)).toEqual({ row: -3, col: 5 });
      expect(transform.transformEnd(-999, 0)).toEqual({ row: -3, col: 5 });
    });

    describe('`beforeTransformEnd` hook', () => {
      it('should be fired after `transformEnd` method call', () => {
        const hookListener = { beforeTransformEnd() {} };

        spyOn(hookListener, 'beforeTransformEnd');

        const transform = createTransformation({
          range: createSelectionRange(0, 0, 0, 0, 1, 1)
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

        const transform = createTransformation({
          range: createSelectionRange(0, 0, 0, 0, 1, 1)
        });

        transform.addLocalHook('afterTransformEnd', hookListener.afterTransformEnd);
        transform.transformEnd(4, 2);

        expect(hookListener.afterTransformEnd).toHaveBeenCalledWith({ row: 5, col: 3 }, 0, 0);
      });

      it('should be fired with arguments that indicates the row index exceeded the limit of the table range ' +
         '(upper limit)', () => {
        const hookListener = { afterTransformEnd() {} };

        spyOn(hookListener, 'afterTransformEnd');

        const transform = createTransformation({
          range: createSelectionRange(0, 0, 0, 0, 1, 1),
        });

        transform.setOffsetSize({
          x: 3,
          y: 3,
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

          const transform = createTransformation({
            range: createSelectionRange(0, 0, 0, 0, 1, 1),
          });

          transform.setOffsetSize({
            x: 3,
            y: 3,
          });

          transform.addLocalHook('afterTransformEnd', hookListener.afterTransformEnd);
          transform.transformEnd(-999, 0);

          expect(hookListener.afterTransformEnd).toHaveBeenCalledWith({ row: -3, col: 1 }, -1, 0);
        }
        {
          const hookListener = { afterTransformEnd() {} };

          spyOn(hookListener, 'afterTransformEnd');

          const transform = createTransformation({
            range: createSelectionRange(0, 0, 0, 0, 1, 1),
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

        const transform = createTransformation({
          range: createSelectionRange(0, 0, 0, 0, 1, 1),
        });

        transform.setOffsetSize({
          x: 3,
          y: 3,
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

          const transform = createTransformation({
            range: createSelectionRange(0, 0, 0, 0, 1, 1),
          });

          transform.setOffsetSize({
            x: 3,
            y: 3,
          });

          transform.addLocalHook('afterTransformEnd', hookListener.afterTransformEnd);
          transform.transformEnd(0, -999);

          expect(hookListener.afterTransformEnd).toHaveBeenCalledWith({ row: 1, col: -3 }, 0, -1);
        }
        {
          const hookListener = { afterTransformEnd() {} };

          spyOn(hookListener, 'afterTransformEnd');

          const transform = createTransformation({
            range: createSelectionRange(0, 0, 0, 0, 1, 1),
          });

          transform.addLocalHook('afterTransformEnd', hookListener.afterTransformEnd);
          transform.transformEnd(0, -999);

          expect(hookListener.afterTransformEnd).toHaveBeenCalledWith({ row: 1, col: 0 }, 0, -1);
        }
      });
    });
  });
});
