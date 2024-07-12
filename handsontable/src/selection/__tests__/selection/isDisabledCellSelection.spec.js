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
    it('should disable any kind of selection when set as `true` on table settings layer', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
        disableVisualSelection: true,
      });

      selectColumns(1, 1, -1);
      keyDown('control/meta');
      selectRows(1, 1, -1);
      keyUp('control/meta');

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

      updateSettings({
        disableVisualSelection: ['current', 'area', 'header'],
      });

      selectColumns(1, 1, -1);
      keyDown('control/meta');
      selectRows(1, 1, -1);
      keyUp('control/meta');

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

    it('should disable all "current" selection types', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
        disableVisualSelection: 'current',
      });

      selectColumns(1, 1, -1);
      keyDown('control/meta');
      selectRows(1, 1, -1);
      keyUp('control/meta');

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

    it('should disable all "area" selection types', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
        disableVisualSelection: 'area',
      });

      selectColumns(1, 1, -1);
      keyDown('control/meta');
      selectRows(1, 1, -1);
      keyUp('control/meta');

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

    it('should disable all "header" selection types', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
        disableVisualSelection: 'header',
      });

      selectColumns(1, 1, -1);
      keyDown('control/meta');
      selectRows(1, 1, -1);
      keyUp('control/meta');

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

    it('should disable all "header" and "current" selection types', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
        disableVisualSelection: ['current', 'header'],
      });

      selectColumns(1, 1, -1);
      keyDown('control/meta');
      selectRows(1, 1, -1);
      keyUp('control/meta');

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

    it('should disable all "area" and "header" selection types', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
        disableVisualSelection: ['area', 'header'],
      });

      selectColumns(1, 1, -1);
      keyDown('control/meta');
      selectRows(1, 1, -1);
      keyUp('control/meta');

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

    it('should disable all kind of selection types for specific rows and columns (navigableHeaders: false)', () => {
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

      selectColumns(1);
      keyDown('control/meta');
      selectColumns(2);
      selectRows(1);
      selectRows(2);
      keyUp('control/meta');

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
    it('should not disable all kind of selection types for specific rows and columns (navigableHeaders: true)', () => {
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
      selectColumns(1, 1, -1);
      keyDown('control/meta');
      selectColumns(2, 2, -1);
      selectRows(1, 1, -1);
      selectRows(2, 2, -1);
      keyUp('control/meta');

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

    it('should enable the selection for specific rows and columns when the whole table has disabled it', () => {
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

      selectColumns(1);
      keyDown('control/meta');
      selectColumns(2);
      selectRows(1);
      selectRows(2);
      keyUp('control/meta');

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

    it('should disable the "current" selection type for specific rows and columns', () => {
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

      selectColumns(1);
      keyDown('control/meta');
      selectColumns(2);
      selectRows(1);
      selectRows(2);
      keyUp('control/meta');

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

    it('should disable the "area" selection type for specific rows and columns', () => {
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

      selectColumns(1);
      keyDown('control/meta');
      selectColumns(2);
      selectRows(1);
      selectRows(2);
      keyUp('control/meta');

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

    it('should disable the "header" selection type for specific rows and columns', () => {
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

      selectColumns(1);
      keyDown('control/meta');
      selectRows(1);
      keyUp('control/meta');

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
  });
});
