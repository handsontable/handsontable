describe('Core_modifySourceData', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('`get` mode', () => {
    describe('array of arrays datasource', () => {
      it('should replace the source value for a cell using the `valueHolder` object of the hook callback', () => {
        const data = [
          [1, 2, 3],
          [4, 5, 6]
        ];

        handsontable({
          data,
          modifySourceData: (row, column, valueHolder, mode) => {
            if (mode === 'get') {
              valueHolder.value += `->${row}-${column}-${mode}`;
            }
          }
        });

        data.forEach((row, rowIndex) => {
          row.forEach((cell, columnIndex) => {
            const dataCellValue = data[rowIndex][columnIndex];
            const modifiedSourceCellValue = `${data[rowIndex][columnIndex]}->${rowIndex}-${columnIndex}-get`;

            // Check if it doesn't modify the data, only source data
            expect(getDataAtCell(rowIndex, columnIndex)).toEqual(dataCellValue);
            expect(getDataAtRow(rowIndex)[columnIndex]).toEqual(dataCellValue);
            expect(getData()[rowIndex][columnIndex]).toEqual(dataCellValue);

            // Check for multiple API endpoints
            expect(getSourceDataAtCell(rowIndex, columnIndex)).toEqual(modifiedSourceCellValue);
            expect(getSourceDataAtRow(rowIndex)[columnIndex]).toEqual(modifiedSourceCellValue);
            expect(getSourceDataAtCol(columnIndex)[rowIndex]).toEqual(modifiedSourceCellValue);
            expect(getSourceData()[rowIndex][columnIndex]).toEqual(modifiedSourceCellValue);
            expect(getSourceData(0, 0, 1, 2)[rowIndex][columnIndex]).toEqual(modifiedSourceCellValue);
            expect(getSourceDataArray()[rowIndex][columnIndex]).toEqual(modifiedSourceCellValue);
            expect(getSourceDataArray(0, 0, 1, 2)[rowIndex][columnIndex]).toEqual(modifiedSourceCellValue);
          });
        });
      });
    });

    describe('array of objects datasource', () => {
      it('should replace the source value for a cell using the `valueHolder` object of the hook callback', () => {
        const data = [
          { a: 1, b: 2, c: 3 },
          { a: 4, b: 5, c: 6 },
        ];

        handsontable({
          data,
          modifySourceData: (row, column, valueHolder, mode) => {
            if (mode === 'get') {
              valueHolder.value += `->${row}-${column}-${mode}`;
            }
          }
        });

        data.forEach((row, rowIndex) => {
          Object.keys(row).forEach((colProp) => {
            const columnIndex = propToCol(colProp);
            const dataCellValue = data[rowIndex][colProp];
            const modifiedSourceCellValue = `${data[rowIndex][colProp]}->${rowIndex}-${colProp}-get`;

            // Check if it doesn't modify the data, only source data
            expect(getDataAtCell(rowIndex, columnIndex)).toEqual(dataCellValue);
            expect(getDataAtRow(rowIndex)[columnIndex]).toEqual(dataCellValue);
            expect(getData()[rowIndex][columnIndex]).toEqual(dataCellValue);

            // Check for multiple API endpoints
            expect(getSourceDataAtCell(rowIndex, columnIndex)).toEqual(modifiedSourceCellValue);
            expect(getSourceDataAtCell(rowIndex, colProp)).toEqual(modifiedSourceCellValue);
            expect(getSourceDataAtRow(rowIndex)[colProp]).toEqual(modifiedSourceCellValue);
            expect(getSourceDataAtCol(columnIndex)[rowIndex]).toEqual(modifiedSourceCellValue);
            expect(getSourceData()[rowIndex][colProp]).toEqual(modifiedSourceCellValue);
            expect(getSourceData(0, 0, 1, 2)[rowIndex][colProp]).toEqual(modifiedSourceCellValue);
            expect(getSourceDataArray()[rowIndex][columnIndex]).toEqual(modifiedSourceCellValue);
            expect(getSourceDataArray(0, 0, 1, 2)[rowIndex][columnIndex]).toEqual(modifiedSourceCellValue);
          });
        });
      });

      it('should be called only for cells not filtered using the `columns` option, when using the `getSourceDataArray` method', () => {
        const data = [
          { a: { test: 1, x: 'c' }, b: 2, c: 3 },
          { a: { test: 4, x: 'd' }, b: 5, c: 6 },
        ];
        const msdCallback = jasmine.createSpy('msdCallback');

        handsontable({
          data,
          modifySourceData: msdCallback,
          columns: [
            {
              data: 'a.test'
            }
          ]
        });

        getSourceDataArray();

        expect(msdCallback).toHaveBeenCalledTimes(2);
      });

      it('should be called only for cells not filtered using the `columns` option, when using the `getSourceData` method with a provided range', () => {
        const data = [
          { a: { test: 1, x: 'c' }, b: 2, c: 3 },
          { a: { test: 4, x: 'd' }, b: 5, c: 6 },
          { a: { test: 7, x: 'e' }, b: 8, c: 9 },
          { a: { test: 10, x: 'f' }, b: 11, c: 12 },
        ];
        const msdCallback = jasmine.createSpy('msdCallback');

        handsontable({
          data,
          modifySourceData: msdCallback,
          columns: [
            {
              data: 'a.test'
            }
          ]
        });

        getSourceData(0, 0, 1, 1);

        expect(msdCallback).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('`set` mode', () => {
    describe('array of arrays datasource', () => {
      it('should replace the source value for a cell using the `valueHolder` object of the hook callback', () => {
        const changesList = [
          [0, 0, 'a'], [0, 1, 'b'], [0, 2, 'c'],
          [1, 0, 'd'], [1, 1, 'e'], [1, 2, 'f'],
        ];

        handsontable({
          data: Handsontable.helper.createEmptySpreadsheetData(2, 3),
          modifySourceData: (row, column, valueHolder, mode) => {
            if (mode === 'set') {
              valueHolder.value += `->${row}-${column}-${mode}`;
            }
          }
        });

        setSourceDataAtCell(changesList);

        changesList.forEach((change) => {
          const [rowIndex, columnIndex, dataCellValue] = change;
          const modifiedSourceCellValue = `${dataCellValue}->${rowIndex}-${columnIndex}-set`;

          expect(getDataAtCell(rowIndex, columnIndex)).toEqual(modifiedSourceCellValue);
          expect(getDataAtRow(rowIndex)[columnIndex]).toEqual(modifiedSourceCellValue);
          expect(getData()[rowIndex][columnIndex]).toEqual(modifiedSourceCellValue);

          // Check for multiple API endpoints
          expect(getSourceDataAtCell(rowIndex, columnIndex)).toEqual(modifiedSourceCellValue);
          expect(getSourceDataAtRow(rowIndex)[columnIndex]).toEqual(modifiedSourceCellValue);
          expect(getSourceDataAtCol(columnIndex)[rowIndex]).toEqual(modifiedSourceCellValue);
          expect(getSourceData()[rowIndex][columnIndex]).toEqual(modifiedSourceCellValue);
          expect(getSourceData(0, 0, 1, 2)[rowIndex][columnIndex]).toEqual(modifiedSourceCellValue);
          expect(getSourceDataArray()[rowIndex][columnIndex]).toEqual(modifiedSourceCellValue);
          expect(getSourceDataArray(0, 0, 1, 2)[rowIndex][columnIndex]).toEqual(modifiedSourceCellValue);
        });
      });
    });

    describe('array of objects datasource', () => {
      it('should replace the source value for a cell using the `valueHolder` object of the hook callback', () => {
        const changesList = [
          [0, 'x', 'a'], [0, 'y', 'b'], [0, 'z', 'c'],
          [1, 'x', 'd'], [1, 'y', 'e'], [1, 'z', 'f'],
        ];

        handsontable({
          dataSchema: [{ x: 0, y: 0, z: 0 }],
          startRows: 2,
          columns: [
            { data: 'x' },
            { data: 'y' },
            { data: 'z' }
          ],
          modifySourceData: (row, column, valueHolder, mode) => {
            if (mode === 'set') {
              valueHolder.value += `->${row}-${column}-${mode}`;
            }
          }
        });

        setSourceDataAtCell(changesList);

        changesList.forEach((change) => {
          const [rowIndex, prop, dataCellValue] = change;
          const columnIndex = propToCol(prop);
          const modifiedSourceCellValue = `${dataCellValue}->${rowIndex}-${columnIndex}-set`;

          expect(getDataAtCell(rowIndex, columnIndex)).toEqual(modifiedSourceCellValue);
          expect(getDataAtRow(rowIndex)[columnIndex]).toEqual(modifiedSourceCellValue);
          expect(getData()[rowIndex][columnIndex]).toEqual(modifiedSourceCellValue);

          // Check for multiple API endpoints
          expect(getSourceDataAtCell(rowIndex, columnIndex)).toEqual(modifiedSourceCellValue);
          expect(getSourceDataAtRow(rowIndex)[prop]).toEqual(modifiedSourceCellValue);
          expect(getSourceDataAtCol(columnIndex)[rowIndex]).toEqual(modifiedSourceCellValue);
          expect(getSourceData()[rowIndex][prop]).toEqual(modifiedSourceCellValue);
          expect(getSourceData(0, 0, 1, 2)[rowIndex][prop]).toEqual(modifiedSourceCellValue);
          expect(getSourceDataArray()[rowIndex][columnIndex]).toEqual(modifiedSourceCellValue);
          expect(getSourceDataArray(0, 0, 1, 2)[rowIndex][columnIndex]).toEqual(modifiedSourceCellValue);
        });
      });
    });
  });
});
