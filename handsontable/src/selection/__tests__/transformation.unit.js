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
    countRows() { return options.countRows ?? 10; },
    countCols() { return options.countCols ?? 10; },
    fixedRowsBottom() { return options.fixedRowsBottom ?? 0; },
    minSpareRows() { return options.minSpareRows ?? 0; },
    minSpareCols() { return options.minSpareCols ?? 0; },
    countRowHeaders() { return options.countRowHeaders ?? 0; },
    countColHeaders() { return options.countColHeaders ?? 0; },
    autoWrapRow() { return options.autoWrapRow ?? false; },
    autoWrapCol() { return options.autoWrapCol ?? false; },
  });
}

describe('Transformation class', () => {
  describe('transformStart()', () => {
    it('should fire `beforeTransformStart` local hook with delta', () => {
      const hookListener = { beforeTransformStart() {} };

      spyOn(hookListener, 'beforeTransformStart');

      const transform = createTransformation({
        range: createSelectionRange(1, 1)
      });

      transform.addLocalHook('beforeTransformStart', hookListener.beforeTransformStart);
      transform.transformStart(4, 2);

      expect(hookListener.beforeTransformStart).toHaveBeenCalledWith({ row: 4, col: 2 });
    });

    it('should return coords with row moved by row delta (positive value)', () => {
      const transform = createTransformation({
        range: createSelectionRange(1, 1)
      });

      expect(transform.transformStart(4, 0)).toEqual({ row: 5, col: 1 });
    });

    it('should return coords with column moved by column delta (positive value)', () => {
      const transform = createTransformation({
        range: createSelectionRange(1, 1)
      });

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
      expect(transform.transformStart(90, 0)).toEqual({ row: 9, col: 1 });
    });

    it('should not return coords that point out of the table when column delta is bigger than total number of columns (positive value)', () => {
      const transform = createTransformation({
        range: createSelectionRange(1, 1)
      });

      expect(transform.transformStart(0, 8)).toEqual({ row: 1, col: 9 });
      expect(transform.transformStart(0, 9)).toEqual({ row: 1, col: 9 });
      expect(transform.transformStart(0, 99)).toEqual({ row: 1, col: 9 });
    });

    it('should not return coords that point out of the table when row delta is bigger than total number of rows (negative value)', () => {
      const transform = createTransformation({
        range: createSelectionRange(9, 9)
      });

      expect(transform.transformStart(-8, 0)).toEqual({ row: 1, col: 9 });
      expect(transform.transformStart(-9, 0)).toEqual({ row: 0, col: 9 });
      expect(transform.transformStart(-90, 0)).toEqual({ row: 0, col: 9 });
    });

    it('should not return coords that point out of the table when column delta is bigger than total number of columns (negative value)', () => {
      const transform = createTransformation({
        range: createSelectionRange(9, 9)
      });

      expect(transform.transformStart(0, -8)).toEqual({ row: 9, col: 1 });
      expect(transform.transformStart(0, -9)).toEqual({ row: 9, col: 0 });
      expect(transform.transformStart(0, -90)).toEqual({ row: 9, col: 0 });
    });

    it('should return coords that points to the row header', () => {
      const transform = createTransformation({
        range: createSelectionRange(5, 2),
        countRowHeaders: 3,
        countColHeaders: 3,
      });

      expect(transform.transformStart(0, -3)).toEqual({ row: 5, col: -1 });
      expect(transform.transformStart(0, -4)).toEqual({ row: 5, col: -2 });
      expect(transform.transformStart(0, -5)).toEqual({ row: 5, col: -3 });
      expect(transform.transformStart(0, -6)).toEqual({ row: 5, col: -3 });
      expect(transform.transformStart(0, -90)).toEqual({ row: 5, col: -3 });
    });

    it('should return coords that points to the column header', () => {
      const transform = createTransformation({
        range: createSelectionRange(2, 5),
        countRowHeaders: 3,
        countColHeaders: 3,
      });

      expect(transform.transformStart(-3, 0)).toEqual({ row: -1, col: 5 });
      expect(transform.transformStart(-4, 0)).toEqual({ row: -2, col: 5 });
      expect(transform.transformStart(-5, 0)).toEqual({ row: -3, col: 5 });
      expect(transform.transformStart(-6, 0)).toEqual({ row: -3, col: 5 });
      expect(transform.transformStart(-90, 0)).toEqual({ row: -3, col: 5 });
    });

    it('should return coords that points to the next column when the row delta is bigger than table total rows count and `autoWrapCol` is enabled', () => {
      {
        const transform = createTransformation({
          range: createSelectionRange(5, -3),
          autoWrapCol: true,
          countRowHeaders: 3,
          countColHeaders: 3,
        });

        expect(transform.transformStart(5, 0)).toEqual({ row: -3, col: -2 });
        expect(transform.transformStart(5, 1)).toEqual({ row: -3, col: -2 });
        expect(transform.transformStart(5, 90)).toEqual({ row: -3, col: -2 });
      }
      {
        const transform = createTransformation({
          range: createSelectionRange(5, 5),
          autoWrapCol: true,
          countRowHeaders: 3,
          countColHeaders: 3,
        });

        expect(transform.transformStart(5, 0)).toEqual({ row: -3, col: 6 });
        expect(transform.transformStart(5, 1)).toEqual({ row: -3, col: 6 });
        expect(transform.transformStart(5, 90)).toEqual({ row: -3, col: 6 });
      }
      {
        const transform = createTransformation({
          range: createSelectionRange(5, 9),
          autoWrapCol: true,
          countRowHeaders: 3,
          countColHeaders: 3,
        });

        expect(transform.transformStart(5, 0)).toEqual({ row: -3, col: -3 });
        expect(transform.transformStart(5, 1)).toEqual({ row: -3, col: -3 });
        expect(transform.transformStart(5, 90)).toEqual({ row: -3, col: -3 });
      }
    });
  });
});
