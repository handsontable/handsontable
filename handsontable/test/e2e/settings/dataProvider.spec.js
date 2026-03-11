describe('settings', () => {
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

  describe('dataProvider', () => {
    it('should be `undefined` by default', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
      });

      expect(getSettings().dataProvider).toBeUndefined();
    });

    it('should render data returned synchronously from the dataProvider function', async() => {
      handsontable({
        dataProvider() {
          return [
            ['A1', 'B1', 'C1'],
            ['A2', 'B2', 'C2'],
            ['A3', 'B3', 'C3'],
          ];
        },
      });

      expect(countRows()).toBe(3);
      expect(countCols()).toBe(3);
      expect(getDataAtCell(0, 0)).toBe('A1');
      expect(getDataAtCell(1, 1)).toBe('B2');
      expect(getDataAtCell(2, 2)).toBe('C3');
    });

    it('should render data returned asynchronously from the dataProvider function', async() => {
      const data = [
        ['A1', 'B1', 'C1'],
        ['A2', 'B2', 'C2'],
      ];

      handsontable({
        dataProvider() {
          return new Promise((resolve) => {
            setTimeout(() => resolve(data), 50);
          });
        },
      });

      // Initially the grid is empty.
      expect(countRows()).toBe(5);
      expect(getDataAtCell(0, 0)).toBeNull();

      await sleep(200);

      expect(countRows()).toBe(2);
      expect(countCols()).toBe(3);
      expect(getDataAtCell(0, 0)).toBe('A1');
      expect(getDataAtCell(1, 2)).toBe('C2');
    });

    it('should call the dataProvider function with a request object containing type "all"', async() => {
      const providerSpy = jasmine.createSpy('dataProvider').and.returnValue(
        createSpreadsheetData(2, 2)
      );

      handsontable({
        dataProvider: providerSpy,
      });

      expect(providerSpy).toHaveBeenCalledTimes(1);
      expect(providerSpy).toHaveBeenCalledWith({ type: 'all' });
    });

    it('should take precedence over the `data` option', async() => {
      handsontable({
        data: [
          ['X1', 'X2'],
        ],
        dataProvider() {
          return [
            ['A1', 'B1'],
            ['A2', 'B2'],
          ];
        },
      });

      expect(countRows()).toBe(2);
      expect(getDataAtCell(0, 0)).toBe('A1');
      expect(getDataAtCell(1, 1)).toBe('B2');
    });

    it('should support array of objects as data source', async() => {
      handsontable({
        dataProvider() {
          return [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
          ];
        },
        columns: [
          { data: 'id' },
          { data: 'name' },
        ],
      });

      expect(countRows()).toBe(2);
      expect(getDataAtCell(0, 0)).toBe(1);
      expect(getDataAtCell(0, 1)).toBe('Alice');
      expect(getDataAtCell(1, 0)).toBe(2);
      expect(getDataAtCell(1, 1)).toBe('Bob');
    });

    it('should fire `beforeLoadData` and `afterLoadData` hooks with synchronous provider', async() => {
      const beforeLoadDataSpy = jasmine.createSpy('beforeLoadData');
      const afterLoadDataSpy = jasmine.createSpy('afterLoadData');

      handsontable({
        dataProvider() {
          return createSpreadsheetData(2, 2);
        },
        beforeLoadData: beforeLoadDataSpy,
        afterLoadData: afterLoadDataSpy,
      });

      expect(beforeLoadDataSpy).toHaveBeenCalled();
      expect(afterLoadDataSpy).toHaveBeenCalled();
    });

    it('should fire `beforeLoadData` and `afterLoadData` hooks with async provider', async() => {
      const afterLoadDataCalls = [];

      handsontable({
        dataProvider() {
          return new Promise((resolve) => {
            setTimeout(() => resolve(createSpreadsheetData(2, 2)), 50);
          });
        },
        afterLoadData(data, initialLoad, source) {
          afterLoadDataCalls.push({ data, initialLoad, source });
        },
      });

      await sleep(200);

      const dataProviderCall = afterLoadDataCalls.find(call => call.source === 'dataProvider');

      expect(dataProviderCall).toBeDefined();
      expect(dataProviderCall.data.length).toBe(2);
    });

    it('should update data when `dataProvider` is changed via `updateSettings`', async() => {
      handsontable({
        dataProvider() {
          return createSpreadsheetData(2, 2);
        },
      });

      expect(countRows()).toBe(2);
      expect(getDataAtCell(0, 0)).toBe('A1');

      await updateSettings({
        dataProvider() {
          return [
            ['X1', 'Y1', 'Z1'],
            ['X2', 'Y2', 'Z2'],
            ['X3', 'Y3', 'Z3'],
          ];
        },
      });

      expect(countRows()).toBe(3);
      expect(countCols()).toBe(3);
      expect(getDataAtCell(0, 0)).toBe('X1');
      expect(getDataAtCell(2, 2)).toBe('Z3');
    });

    it('should update data when async `dataProvider` is changed via `updateSettings`', async() => {
      handsontable({
        dataProvider() {
          return createSpreadsheetData(2, 2);
        },
      });

      expect(countRows()).toBe(2);

      await updateSettings({
        dataProvider() {
          return new Promise((resolve) => {
            setTimeout(() => resolve([
              ['X1', 'Y1'],
              ['X2', 'Y2'],
              ['X3', 'Y3'],
              ['X4', 'Y4'],
            ]), 50);
          });
        },
      });

      await sleep(200);

      expect(countRows()).toBe(4);
      expect(getDataAtCell(0, 0)).toBe('X1');
      expect(getDataAtCell(3, 1)).toBe('Y4');
    });

    it('should render an empty grid when the synchronous provider returns `null`', async() => {
      handsontable({
        dataProvider() {
          return null;
        },
      });

      expect(countRows()).toBe(5);
      expect(countCols()).toBe(5);
      expect(getDataAtCell(0, 0)).toBeNull();
    });

    it('should work with `colHeaders` option', async() => {
      handsontable({
        dataProvider() {
          return createSpreadsheetData(3, 3);
        },
        colHeaders: true,
      });

      expect(countRows()).toBe(3);
      expect(countCols()).toBe(3);
      expect(getColHeader(0)).toBe('A');
      expect(getDataAtCell(0, 0)).toBe('A1');
    });

    it('should work with `rowHeaders` option', async() => {
      handsontable({
        dataProvider() {
          return createSpreadsheetData(3, 3);
        },
        rowHeaders: true,
      });

      expect(countRows()).toBe(3);
      expect(getCell(0, -1).textContent).toBe('1');
      expect(getDataAtCell(0, 0)).toBe('A1');
    });

    it('should be callable only once during initialization', async() => {
      let callCount = 0;

      handsontable({
        dataProvider() {
          callCount += 1;

          return createSpreadsheetData(2, 2);
        },
      });

      expect(callCount).toBe(1);
    });
  });
});
