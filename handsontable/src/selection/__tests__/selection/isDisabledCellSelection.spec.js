describe('Selection', () => {
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

  describe('`isDisabledCellSelection` option', () => {
    it('should disable any kind of selection when set as `true` on table settings layer', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
        disableVisualSelection: true,
      });

      await selectColumns(1, 1, -1);
      await keyDown('control/meta');
      await selectRows(1, 1, -1);
      await keyUp('control/meta');

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: -1,1 from: -1,1 to: 4,1',
        'highlight: 1,-1 from: 1,-1 to: 1,4',
      ]);
      expect(`
        |   ║   :   :   :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();

      await updateSettings({
        disableVisualSelection: ['current', 'area', 'header'],
      });

      await selectColumns(1, 1, -1);
      await keyDown('control/meta');
      await selectRows(1, 1, -1);
      await keyUp('control/meta');

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: -1,1 from: -1,1 to: 4,1',
        'highlight: 1,-1 from: 1,-1 to: 1,4',
      ]);
      expect(`
        |   ║   :   :   :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should disable all "current" selection types', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
        disableVisualSelection: 'current',
      });

      await selectColumns(1, 1, -1);
      await keyDown('control/meta');
      await selectRows(1, 1, -1);
      await keyUp('control/meta');

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: -1,1 from: -1,1 to: 4,1',
        'highlight: 1,-1 from: 1,-1 to: 1,4',
      ]);
      expect(`
        |   ║ - : * : - : - : - |
        |===:===:===:===:===:===|
        | - ║   : 0 :   :   :   |
        | * ║ 0 : 1 : 0 : 0 : 0 |
        | - ║   : 0 :   :   :   |
        | - ║   : 0 :   :   :   |
        | - ║   : 0 :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should disable all "area" selection types', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
        disableVisualSelection: 'area',
      });

      await selectColumns(1, 1, -1);
      await keyDown('control/meta');
      await selectRows(1, 1, -1);
      await keyUp('control/meta');

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: -1,1 from: -1,1 to: 4,1',
        'highlight: 1,-1 from: 1,-1 to: 1,4',
      ]);
      expect(`
        |   ║ - : * : - : - : - |
        |===:===:===:===:===:===|
        | - ║   :   :   :   :   |
        | # ║   :   :   :   :   |
        | - ║   :   :   :   :   |
        | - ║   :   :   :   :   |
        | - ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should disable all "header" selection types', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
        disableVisualSelection: 'header',
      });

      await selectColumns(1, 1, -1);
      await keyDown('control/meta');
      await selectRows(1, 1, -1);
      await keyUp('control/meta');

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: -1,1 from: -1,1 to: 4,1',
        'highlight: 1,-1 from: 1,-1 to: 1,4',
      ]);
      expect(`
        |   ║   :   :   :   :   |
        |===:===:===:===:===:===|
        |   ║   : 0 :   :   :   |
        | # ║ 0 : 1 : 0 : 0 : 0 |
        |   ║   : 0 :   :   :   |
        |   ║   : 0 :   :   :   |
        |   ║   : 0 :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should disable all "header" and "current" selection types', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
        disableVisualSelection: ['current', 'header'],
      });

      await selectColumns(1, 1, -1);
      await keyDown('control/meta');
      await selectRows(1, 1, -1);
      await keyUp('control/meta');

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: -1,1 from: -1,1 to: 4,1',
        'highlight: 1,-1 from: 1,-1 to: 1,4',
      ]);
      expect(`
        |   ║   :   :   :   :   |
        |===:===:===:===:===:===|
        |   ║   : 0 :   :   :   |
        |   ║ 0 : 1 : 0 : 0 : 0 |
        |   ║   : 0 :   :   :   |
        |   ║   : 0 :   :   :   |
        |   ║   : 0 :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should disable all "area" and "header" selection types', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
        disableVisualSelection: ['area', 'header'],
      });

      await selectColumns(1, 1, -1);
      await keyDown('control/meta');
      await selectRows(1, 1, -1);
      await keyUp('control/meta');

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: -1,1 from: -1,1 to: 4,1',
        'highlight: 1,-1 from: 1,-1 to: 1,4',
      ]);
      expect(`
        |   ║   :   :   :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | # ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should disable all kind of selection types for specific rows and columns (navigableHeaders: false)', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: false,
        cells(row) {
          const cellProperties = {};

          if (row === 1) {
            cellProperties.disableVisualSelection = true;
          }

          return cellProperties;
        },
        columns: [
          {},
          { disableVisualSelection: true },
          {},
          {},
          {},
        ]
      });

      await selectColumns(1);
      await keyDown('control/meta');
      await selectColumns(2);
      await selectRows(1);
      await selectRows(2);
      await keyUp('control/meta');

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,1 from: -1,1 to: 4,1',
        'highlight: 0,2 from: -1,2 to: 4,2',
        'highlight: 1,0 from: 1,-1 to: 1,4',
        'highlight: 2,0 from: 2,-1 to: 2,4',
      ]);
      expect(`
        |   ║ - : - : * : - : - |
        |===:===:===:===:===:===|
        | - ║   :   : 0 :   :   |
        | - ║   :   : 0 :   :   |
        | * ║ A : 0 : 1 : 0 : 0 |
        | - ║   :   : 0 :   :   |
        | - ║   :   : 0 :   :   |
        `).toBeMatchToSelectionPattern();
    });

    // headers doesn't support `disableVisualSelection` option defined in the cell meta
    it('should not disable all kind of selection types for specific rows and columns (navigableHeaders: true)', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
        cells(row) {
          const cellProperties = {};

          if (row === 1) {
            cellProperties.disableVisualSelection = true;
          }

          return cellProperties;
        },
        columns: [
          {},
          { disableVisualSelection: true },
          {},
          {},
          {},
        ]
      });
      await selectColumns(1, 1, -1);
      await keyDown('control/meta');
      await selectColumns(2, 2, -1);
      await selectRows(1, 1, -1);
      await selectRows(2, 2, -1);
      await keyUp('control/meta');

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: -1,1 from: -1,1 to: 4,1',
        'highlight: -1,2 from: -1,2 to: 4,2',
        'highlight: 1,-1 from: 1,-1 to: 1,4',
        'highlight: 2,-1 from: 2,-1 to: 2,4',
      ]);
      expect(`
        |   ║ - : * : * : - : - |
        |===:===:===:===:===:===|
        | - ║   : 0 : 0 :   :   |
        | * ║ 0 : 1 : 1 : 0 : 0 |
        | # ║ 0 : 1 : 1 : 0 : 0 |
        | - ║   : 0 : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should enable the selection for specific rows and columns when the whole table has disabled it', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: false,
        disableVisualSelection: true,
        cells(row) {
          const cellProperties = {};

          if (row === 1) {
            cellProperties.disableVisualSelection = false;
          }

          return cellProperties;
        },
        columns: [
          {},
          { disableVisualSelection: false },
          {},
          {},
          {},
        ]
      });

      await selectColumns(1);
      await keyDown('control/meta');
      await selectColumns(2);
      await selectRows(1);
      await selectRows(2);
      await keyUp('control/meta');

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,1 from: -1,1 to: 4,1',
        'highlight: 0,2 from: -1,2 to: 4,2',
        'highlight: 1,0 from: 1,-1 to: 1,4',
        'highlight: 2,0 from: 2,-1 to: 2,4',
      ]);
      expect(`
        |   ║ - : * : - : - : - |
        |===:===:===:===:===:===|
        | - ║   : 0 :   :   :   |
        | * ║ 0 : 1 : 0 : 0 : 0 |
        | - ║   : 0 :   :   :   |
        | - ║   : 0 :   :   :   |
        | - ║   : 0 :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should disable the "current" selection type for specific rows and columns', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: false,
        cells(row) {
          const cellProperties = {};

          if (row === 1) {
            cellProperties.disableVisualSelection = 'current';
          }

          return cellProperties;
        },
        columns: [
          {},
          { disableVisualSelection: 'current' },
          {},
          {},
          {},
        ]
      });

      await selectColumns(1);
      await keyDown('control/meta');
      await selectColumns(2);
      await selectRows(1);
      await selectRows(2);
      await keyUp('control/meta');

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,1 from: -1,1 to: 4,1',
        'highlight: 0,2 from: -1,2 to: 4,2',
        'highlight: 1,0 from: 1,-1 to: 1,4',
        'highlight: 2,0 from: 2,-1 to: 2,4',
      ]);
      expect(`
        |   ║ - : * : * : - : - |
        |===:===:===:===:===:===|
        | - ║   : 0 : 0 :   :   |
        | * ║ 0 : 1 : 1 : 0 : 0 |
        | * ║ A : 1 : 1 : 0 : 0 |
        | - ║   : 0 : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should disable the "area" selection type for specific rows and columns', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: false,
        cells(row) {
          const cellProperties = {};

          if (row === 1) {
            cellProperties.disableVisualSelection = 'area';
          }

          return cellProperties;
        },
        columns: [
          {},
          { disableVisualSelection: 'area' },
          {},
          {},
          {},
        ]
      });

      await selectColumns(1);
      await keyDown('control/meta');
      await selectColumns(2);
      await selectRows(1);
      await selectRows(2);
      await keyUp('control/meta');

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,1 from: -1,1 to: 4,1',
        'highlight: 0,2 from: -1,2 to: 4,2',
        'highlight: 1,0 from: 1,-1 to: 1,4',
        'highlight: 2,0 from: 2,-1 to: 2,4',
      ]);
      expect(`
        |   ║ - : * : * : - : - |
        |===:===:===:===:===:===|
        | - ║   :   : 0 :   :   |
        | * ║   :   : 0 :   :   |
        | * ║ A : 0 : 1 : 0 : 0 |
        | - ║   :   : 0 :   :   |
        | - ║   :   : 0 :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should disable the "header" selection type for specific rows and columns', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: false,
        cells(row) {
          const cellProperties = {};

          if (row === 1) {
            cellProperties.disableVisualSelection = 'header';
          }

          return cellProperties;
        },
        columns: [
          {},
          { disableVisualSelection: 'header' },
          {},
          {},
          {},
        ]
      });

      await selectColumns(1);
      await keyDown('control/meta');
      await selectRows(1);
      await keyUp('control/meta');

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,1 from: -1,1 to: 4,1',
        'highlight: 1,0 from: 1,-1 to: 1,4',
      ]);
      expect(`
        |   ║   :   :   :   :   |
        |===:===:===:===:===:===|
        |   ║   : 0 :   :   :   |
        |   ║ A : 1 : 0 : 0 : 0 |
        |   ║   : 0 :   :   :   |
        |   ║   : 0 :   :   :   |
        |   ║   : 0 :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should disable the selection highlight after call updateData()', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
        disableVisualSelection: true,
      });

      await selectCell(1, 1);
      await updateData(createSpreadsheetData(5, 5), 'updateSettings');

      expect(`
        |   ║   :   :   :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });
  });
});
