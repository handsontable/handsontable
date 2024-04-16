describe('CollapsibleColumns keyboard shortcut', () => {
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

  describe('"Enter"', () => {
    it('should be possible to collapse all columns', () => {
      handsontable({
        data: createSpreadsheetData(1, 10),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          [{ label: 'A1', colspan: 10 }],
          ['A2', { label: 'B2', colspan: 4 }, { label: 'F2', colspan: 4 }, 'J2'],
          ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 2 }, { label: 'F3', colspan: 2 },
            { label: 'H3', colspan: 2 }, 'J3'],
        ],
        collapsibleColumns: true,
      });

      selectCell(-1, 3); // D3
      keyDownUp('enter');

      expect(`
        |   ║                                   |
        |   ║   :           :               :   |
        |   ║   :       : # :       :       :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      selectCell(-1, 2); // B3
      keyDownUp('enter');

      expect(`
        |   ║                               |
        |   ║   :       :               :   |
        |   ║   : # :   :       :       :   |
        |===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      selectCell(-2, 7); // F2
      keyDownUp('enter');

      expect(`
        |   ║                       |
        |   ║   :       : #   # :   |
        |   ║   :   :   :       :   |
        |===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      selectCell(-3, 1); // A1
      keyDownUp('enter');

      expect(`
        |   ║ # |
        |   ║   |
        |   ║   |
        |===:===|
        |   ║   |
      `).toBeMatchToSelectionPattern();
    });

    it('should be possible to collapse a single column column header is selected', () => {
      handsontable({
        data: createSpreadsheetData(1, 10),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          [{ label: 'A1', colspan: 10 }],
          ['A2', { label: 'B2', colspan: 4 }, { label: 'F2', colspan: 4 }, 'J2'],
          ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 2 }, { label: 'F3', colspan: 2 },
            { label: 'H3', colspan: 2 }, 'J3'],
        ],
        collapsibleColumns: true,
      });

      selectCell(-1, 5);
      listen();
      keyDownUp('enter');

      expect(`
        |   ║                                   |
        |   ║   :               :           :   |
        |   ║   :       :       : # :       :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should not be possible to collapse a single column when a range columns are selected', () => {
      handsontable({
        data: createSpreadsheetData(1, 10),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          [{ label: 'A1', colspan: 10 }],
          ['A2', { label: 'B2', colspan: 4 }, { label: 'F2', colspan: 4 }, 'J2'],
          ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 2 }, { label: 'F3', colspan: 2 },
            { label: 'H3', colspan: 2 }, 'J3'],
        ],
        collapsibleColumns: true,
      });

      selectColumns(3, 6, -1); // D3-F3
      listen();
      keyDownUp('enter');

      expect(`
        |   ║                                       |
        |   ║   :               :               :   |
        |   ║   :       : *   * : *   * :       :   |
        |===:===:===:===:===:===:===:===:===:===:===|
        | - ║   :   :   : A : 0 : 0 : 0 :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should be possible to expand all columns', () => {
      handsontable({
        data: createSpreadsheetData(1, 10),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          [{ label: 'A1', colspan: 10 }],
          ['A2', { label: 'B2', colspan: 4 }, { label: 'F2', colspan: 4 }, 'J2'],
          ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 2 }, { label: 'F3', colspan: 2 },
            { label: 'H3', colspan: 2 }, 'J3'],
        ],
        collapsibleColumns: true,
      });

      getPlugin('collapsibleColumns').collapseSection({ row: -1, col: 1 }); // B3
      getPlugin('collapsibleColumns').collapseSection({ row: -1, col: 5 }); // F3
      getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 1 }); // B2
      getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 5 }); // F2
      getPlugin('collapsibleColumns').collapseSection({ row: -3, col: 0 }); // A1

      selectCell(-3, 0); // A1
      keyDownUp('enter');

      expect(`
        |   ║ #   #   #   # |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();

      selectCell(-2, 5); // F2
      keyDownUp('enter');

      expect(`
        |   ║                       |
        |   ║   :   : #   #   # :   |
        |   ║   :   :   :       :   |
        |===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      selectCell(-1, 1); // B3
      keyDownUp('enter');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   : #   # :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      selectCell(-1, 5); // F3
      keyDownUp('enter');

      expect(`
        |   ║                               |
        |   ║   :       :               :   |
        |   ║   :       : #   # :       :   |
        |===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      selectCell(-2, 1); // B2
      keyDownUp('enter');

      expect(`
        |   ║                                       |
        |   ║   : #   #   #   # :               :   |
        |   ║   :       :       :       :       :   |
        |===:===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should be possible to expand a single column when a column header is selected', () => {
      handsontable({
        data: createSpreadsheetData(1, 10),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          [{ label: 'A1', colspan: 10 }],
          ['A2', { label: 'B2', colspan: 4 }, { label: 'F2', colspan: 4 }, 'J2'],
          ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 2 }, { label: 'F3', colspan: 2 },
            { label: 'H3', colspan: 2 }, 'J3'],
        ],
        collapsibleColumns: true,
      });

      getPlugin('collapsibleColumns').collapseSection({ row: -1, col: 3 }); // D3
      getPlugin('collapsibleColumns').collapseSection({ row: -1, col: 5 }); // F3

      selectCell(-1, 3);
      listen();
      keyDownUp('enter');

      expect(`
        |   ║                                   |
        |   ║   :               :           :   |
        |   ║   :       : #   # :   :       :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should not be possible to expand a single column when a range columns are selected', () => {
      handsontable({
        data: createSpreadsheetData(1, 10),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          [{ label: 'A1', colspan: 10 }],
          ['A2', { label: 'B2', colspan: 4 }, { label: 'F2', colspan: 4 }, 'J2'],
          ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 2 }, { label: 'F3', colspan: 2 },
            { label: 'H3', colspan: 2 }, 'J3'],
        ],
        collapsibleColumns: true,
      });

      getPlugin('collapsibleColumns').collapseSection({ row: -1, col: 3 }); // D3
      getPlugin('collapsibleColumns').collapseSection({ row: -1, col: 5 }); // F3

      selectColumns(3, 6, -1); // D3-F3
      listen();
      keyDownUp('enter');

      expect(`
        |   ║                               |
        |   ║   :           :           :   |
        |   ║   :       : * : * :       :   |
        |===:===:===:===:===:===:===:===:===|
        | - ║   :   :   : A : 0 :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should be possible to collapse/expand only collapsible headers', () => {
      handsontable({
        data: createSpreadsheetData(1, 10),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          [{ label: 'A1', colspan: 10 }],
          ['A2', { label: 'B2', colspan: 4 }, { label: 'F2', colspan: 4 }, 'J2'],
          ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 2 }, { label: 'F3', colspan: 2 },
            { label: 'H3', colspan: 2 }, 'J3'],
        ],
        collapsibleColumns: [
          { row: -3, col: 0, collapsible: true },
        ],
      });

      selectCell(-1, 1); // B3
      selectCell(-1, 3); // D3
      selectCell(-2, 1); // B2
      keyDownUp('enter');

      expect(`
        |   ║                                       |
        |   ║   : #   #   #   # :               :   |
        |   ║   :       :       :       :       :   |
        |===:===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      selectCell(-3, 0); // A1
      keyDownUp('enter'); // collapse

      expect(`
        |   ║ # |
        |   ║   |
        |   ║   |
        |===:===|
        |   ║   |
      `).toBeMatchToSelectionPattern();

      selectCell(-3, 0); // A1
      keyDownUp('enter'); // expand

      expect(`
        |   ║ #   #   #   #   #   #   #   #   #   # |
        |   ║   :               :               :   |
        |   ║   :       :       :       :       :   |
        |===:===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should not trigger the editor to be opened', () => {
      handsontable({
        data: createSpreadsheetData(1, 10),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          [{ label: 'A1', colspan: 10 }],
          ['A2', { label: 'B2', colspan: 4 }, { label: 'F2', colspan: 4 }, 'J2'],
          ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 2 }, { label: 'F3', colspan: 2 },
            { label: 'H3', colspan: 2 }, 'J3'],
        ],
        collapsibleColumns: true,
      });

      selectCell(-1, 3); // D3
      listen();
      keyDownUp('enter');

      expect(getActiveEditor()).toBeUndefined();
    });
  });
});
