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
    it('should be possible to collapse all columns', async() => {
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

      await selectCell(-1, 3); // D3
      await keyDownUp('enter');

      expect(`
        |   ║                                   |
        |   ║   :           :               :   |
        |   ║   :       : # :       :       :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await selectCell(-1, 2); // B3
      await keyDownUp('enter');

      expect(`
        |   ║                               |
        |   ║   :       :               :   |
        |   ║   : # :   :       :       :   |
        |===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await selectCell(-2, 7); // F2
      await keyDownUp('enter');

      expect(`
        |   ║                       |
        |   ║   :       : #   # :   |
        |   ║   :   :   :       :   |
        |===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await selectCell(-3, 1); // A1
      await keyDownUp('enter');

      expect(`
        |   ║ # |
        |   ║   |
        |   ║   |
        |===:===|
        |   ║   |
      `).toBeMatchToSelectionPattern();
    });

    it('should be possible to collapse a single column column header is selected', async() => {
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

      await selectCell(-1, 5);
      await listen();
      await keyDownUp('enter');

      expect(`
        |   ║                                   |
        |   ║   :               :           :   |
        |   ║   :       :       : # :       :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should not be possible to collapse a single column when a range columns are selected', async() => {
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

      await selectColumns(3, 6, -1); // D3-F3
      await listen();
      await keyDownUp('enter');

      expect(`
        |   ║                                       |
        |   ║   :               :               :   |
        |   ║   :       : *   * : *   * :       :   |
        |===:===:===:===:===:===:===:===:===:===:===|
        | - ║   :   :   : A : 0 : 0 : 0 :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should be possible to expand all columns', async() => {
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

      await selectCell(-3, 0); // A1
      await keyDownUp('enter');

      expect(`
        |   ║ #   #   #   # |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await selectCell(-2, 5); // F2
      await keyDownUp('enter');

      expect(`
        |   ║                       |
        |   ║   :   : #   #   # :   |
        |   ║   :   :   :       :   |
        |===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await selectCell(-1, 1); // B3
      await keyDownUp('enter');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   : #   # :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await selectCell(-1, 5); // F3
      await keyDownUp('enter');

      expect(`
        |   ║                               |
        |   ║   :       :               :   |
        |   ║   :       : #   # :       :   |
        |===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await selectCell(-2, 1); // B2
      await keyDownUp('enter');

      expect(`
        |   ║                                       |
        |   ║   : #   #   #   # :               :   |
        |   ║   :       :       :       :       :   |
        |===:===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should be possible to expand a single column when a column header is selected', async() => {
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

      await selectCell(-1, 3);
      await listen();
      await keyDownUp('enter');

      expect(`
        |   ║                                   |
        |   ║   :               :           :   |
        |   ║   :       : #   # :   :       :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should not be possible to expand a single column when a range columns are selected', async() => {
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

      await selectColumns(3, 6, -1); // D3-F3
      await listen();
      await keyDownUp('enter');

      expect(`
        |   ║                               |
        |   ║   :           :           :   |
        |   ║   :       : * : * :       :   |
        |===:===:===:===:===:===:===:===:===|
        | - ║   :   :   : A : 0 :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should be possible to collapse/expand only collapsible headers', async() => {
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

      await selectCell(-1, 1); // B3
      await selectCell(-1, 3); // D3
      await selectCell(-2, 1); // B2
      await keyDownUp('enter');

      expect(`
        |   ║                                       |
        |   ║   : #   #   #   # :               :   |
        |   ║   :       :       :       :       :   |
        |===:===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await selectCell(-3, 0); // A1
      await keyDownUp('enter'); // collapse

      expect(`
        |   ║ # |
        |   ║   |
        |   ║   |
        |===:===|
        |   ║   |
      `).toBeMatchToSelectionPattern();

      await selectCell(-3, 0); // A1
      await keyDownUp('enter'); // expand

      expect(`
        |   ║ #   #   #   #   #   #   #   #   #   # |
        |   ║   :               :               :   |
        |   ║   :       :       :       :       :   |
        |===:===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should not trigger the editor to be opened', async() => {
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

      await selectCell(-1, 3); // D3
      await listen();
      await keyDownUp('enter');

      expect(getActiveEditor()).toBeUndefined();
    });
  });
});
