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
      expect(transform.transformStart(0, -999)).toEqual({ row: 5, col: -3 });
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
      expect(transform.transformStart(-999, 0)).toEqual({ row: -3, col: 5 });
    });

    it('should return coords that points to the next column when the row delta is bigger than table total records count ' +
       '(rows + column headers) and `autoWrapCol` is enabled', () => {
      {
        const transform = createTransformation({
          range: createSelectionRange(5, -3),
          autoWrapCol: true,
          countRowHeaders: 3,
          countColHeaders: 3,
        });

        expect(transform.transformStart(5, 0)).toEqual({ row: -3, col: -2 });
        expect(transform.transformStart(5, 1)).toEqual({ row: -3, col: -2 });
        expect(transform.transformStart(5, 999)).toEqual({ row: -3, col: -2 });
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
        expect(transform.transformStart(5, 999)).toEqual({ row: -3, col: 6 });
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
        expect(transform.transformStart(5, 999)).toEqual({ row: -3, col: -3 });
      }
    });

    it('should return coords that points to the previous column when the row delta is lower than the table total records count ' +
       '(rows + column headers) and `autoWrapCol` is enabled', () => {
      {
        const transform = createTransformation({
          range: createSelectionRange(5, -3),
          autoWrapCol: true,
          countRowHeaders: 3,
          countColHeaders: 3,
        });

        expect(transform.transformStart(-9, 0)).toEqual({ row: 9, col: 9 });
        expect(transform.transformStart(-9, 1)).toEqual({ row: 9, col: 9 });
        expect(transform.transformStart(-9, 999)).toEqual({ row: 9, col: 9 });
      }
      {
        const transform = createTransformation({
          range: createSelectionRange(5, 5),
          autoWrapCol: true,
          countRowHeaders: 3,
          countColHeaders: 3,
        });

        expect(transform.transformStart(-9, 0)).toEqual({ row: 9, col: 4 });
        expect(transform.transformStart(-9, 1)).toEqual({ row: 9, col: 4 });
        expect(transform.transformStart(-9, 999)).toEqual({ row: 9, col: 4 });
      }
      {
        const transform = createTransformation({
          range: createSelectionRange(5, 9),
          autoWrapCol: true,
          countRowHeaders: 3,
          countColHeaders: 3,
        });

        expect(transform.transformStart(-9, 0)).toEqual({ row: 9, col: 8 });
        expect(transform.transformStart(-9, 1)).toEqual({ row: 9, col: 8 });
        expect(transform.transformStart(-9, 999)).toEqual({ row: 9, col: 8 });
      }
    });

    it('should return coords that points to the next row when the column delta is bigger than table total records count ' +
       '(columns + row headers) and `autoWrapRow` is enabled', () => {
      {
        const transform = createTransformation({
          range: createSelectionRange(-3, 5),
          autoWrapRow: true,
          countRowHeaders: 3,
          countColHeaders: 3,
        });

        expect(transform.transformStart(0, 5)).toEqual({ row: -2, col: -3 });
        expect(transform.transformStart(1, 5)).toEqual({ row: -2, col: -3 });
        expect(transform.transformStart(999, 5)).toEqual({ row: -2, col: -3 });
      }
      {
        const transform = createTransformation({
          range: createSelectionRange(5, 5),
          autoWrapRow: true,
          countRowHeaders: 3,
          countColHeaders: 3,
        });

        expect(transform.transformStart(0, 5)).toEqual({ row: 6, col: -3 });
        expect(transform.transformStart(1, 5)).toEqual({ row: 6, col: -3 });
        expect(transform.transformStart(999, 5)).toEqual({ row: 6, col: -3 });
      }
      {
        const transform = createTransformation({
          range: createSelectionRange(9, 5),
          autoWrapRow: true,
          countRowHeaders: 3,
          countColHeaders: 3,
        });

        expect(transform.transformStart(0, 5)).toEqual({ row: -3, col: -3 });
        expect(transform.transformStart(1, 5)).toEqual({ row: -3, col: -3 });
        expect(transform.transformStart(999, 5)).toEqual({ row: -3, col: -3 });
      }
    });

    it('should return coords that points to the previous row when the column delta is lower than the table total records count ' +
       '(cells + headers) and `autoWrapRow` is enabled', () => {
      {
        const transform = createTransformation({
          range: createSelectionRange(-3, 5),
          autoWrapRow: true,
          countRowHeaders: 3,
          countColHeaders: 3,
        });

        expect(transform.transformStart(0, -9)).toEqual({ row: 9, col: 9 });
        expect(transform.transformStart(1, -9)).toEqual({ row: 9, col: 9 });
        expect(transform.transformStart(999, -9)).toEqual({ row: 9, col: 9 });
      }
      {
        const transform = createTransformation({
          range: createSelectionRange(5, 5),
          autoWrapRow: true,
          countRowHeaders: 3,
          countColHeaders: 3,
        });

        expect(transform.transformStart(0, -9)).toEqual({ row: 4, col: 9 });
        expect(transform.transformStart(1, -9)).toEqual({ row: 4, col: 9 });
        expect(transform.transformStart(999, -9)).toEqual({ row: 4, col: 9 });
      }
      {
        const transform = createTransformation({
          range: createSelectionRange(9, 5),
          autoWrapRow: true,
          countRowHeaders: 3,
          countColHeaders: 3,
        });

        expect(transform.transformStart(0, -9)).toEqual({ row: 8, col: 9 });
        expect(transform.transformStart(1, -9)).toEqual({ row: 8, col: 9 });
        expect(transform.transformStart(999, -9)).toEqual({ row: 8, col: 9 });
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
          countRowHeaders: 3,
          countColHeaders: 3,
        });

        transform.addLocalHook('afterTransformStart', hookListener.afterTransformStart);
        transform.transformStart(999, 0);

        expect(hookListener.afterTransformStart).toHaveBeenCalledWith({ row: 9, col: 1 }, 1, 0);
      });

      it('should be fired with arguments that indicates the row index exceeded the limit of the table range ' +
         '(lower limit)', () => {
        const hookListener = { afterTransformStart() {} };

        spyOn(hookListener, 'afterTransformStart');

        const transform = createTransformation({
          range: createSelectionRange(1, 1),
          countRowHeaders: 3,
          countColHeaders: 3,
        });

        transform.addLocalHook('afterTransformStart', hookListener.afterTransformStart);
        transform.transformStart(-999, 0);

        expect(hookListener.afterTransformStart).toHaveBeenCalledWith({ row: -3, col: 1 }, -1, 0);
      });

      it('should be fired with arguments that indicates the column index exceeded the limit of the table range ' +
         '(upper limit)', () => {
        const hookListener = { afterTransformStart() {} };

        spyOn(hookListener, 'afterTransformStart');

        const transform = createTransformation({
          range: createSelectionRange(1, 1),
          countRowHeaders: 3,
          countColHeaders: 3,
        });

        transform.addLocalHook('afterTransformStart', hookListener.afterTransformStart);
        transform.transformStart(0, 999);

        expect(hookListener.afterTransformStart).toHaveBeenCalledWith({ row: 1, col: 9 }, 0, 1);
      });

      it('should be fired with arguments that indicates the column index exceeded the limit of the table range ' +
         '(lower limit)', () => {
        const hookListener = { afterTransformStart() {} };

        spyOn(hookListener, 'afterTransformStart');

        const transform = createTransformation({
          range: createSelectionRange(1, 1),
          countRowHeaders: 3,
          countColHeaders: 3,
        });

        transform.addLocalHook('afterTransformStart', hookListener.afterTransformStart);
        transform.transformStart(0, -999);

        expect(hookListener.afterTransformStart).toHaveBeenCalledWith({ row: 1, col: -3 }, 0, -1);
      });
    });
  });
});
