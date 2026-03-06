describe('NestedHeaders', () => {
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

  describe('navigation in headers (navigableHeaders on)', () => {
    it('should be possible to move the focus around the headers (autoWrap off)', async() => {
      handsontable({
        data: createSpreadsheetData(1, 7),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 5 }, 'G1'],
          ['A2', { label: 'B2', colspan: 4 }, 'F2', 'G2'],
          ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 2 }, 'F3', 'G3'],
        ],
      });

      await selectCell(0, 6);
      await keyDownUp('arrowup');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   :       :       :   : # |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,6 from: -1,6 to: -1,6']);

      await keyDownUp('arrowleft');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   :       :       : # :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,5 from: -1,5 to: -1,5']);

      await keyDownUp('arrowleft');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   :       : #   # :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,4 from: -1,4 to: -1,4']);

      await keyDownUp('arrowleft');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   : #   # :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: -1,2']);

      await keyDownUp('arrowleft');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║ # :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);

      await keyDownUp('arrowleft');
      await keyDownUp('arrowleft'); // the movement should be ignored
      await keyDownUp('arrowleft'); // the movement should be ignored

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        | # ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: -1,-1']);

      await keyDownUp('arrowup');

      expect(`
        |   ║   :                   :   |
        | # ║   :               :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,-1 from: -2,-1 to: -2,-1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :                   :   |
        |   ║ # :               :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,0 from: -2,0 to: -2,0']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :                   :   |
        |   ║   : #   #   #   # :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,1 from: -2,1 to: -2,1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :                   :   |
        |   ║   :               : # :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,5 from: -2,5 to: -2,5']);

      await keyDownUp('arrowright');
      await keyDownUp('arrowright'); // the movement should be ignored
      await keyDownUp('arrowright'); // the movement should be ignored

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   : # |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,6 from: -2,6 to: -2,6']);

      await keyDownUp('arrowup');
      await keyDownUp('arrowup'); // the movement should be ignored
      await keyDownUp('arrowup'); // the movement should be ignored

      expect(`
        |   ║   :                   : # |
        |   ║   :               :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,6 from: -3,6 to: -3,6']);

      await keyDownUp('arrowleft');

      expect(`
        |   ║   : #   #   #   #   # :   |
        |   ║   :               :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,5 from: -3,5 to: -3,5']);

      await keyDownUp('arrowleft');

      expect(`
        |   ║ # :                   :   |
        |   ║   :               :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,0 from: -3,0 to: -3,0']);

      await keyDownUp('arrowleft');
      await keyDownUp('arrowleft'); // the movement should be ignored
      await keyDownUp('arrowleft'); // the movement should be ignored

      expect(`
        | # ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,-1 from: -3,-1 to: -3,-1']);
    });

    it('should be possible to move the focus vertically (autoWrap on)', async() => {
      handsontable({
        data: createSpreadsheetData(1, 7),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        autoWrapCol: true,
        autoWrapRow: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 5 }, 'G1'],
          ['A2', { label: 'B2', colspan: 4 }, 'F2', 'G2'],
          ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 2 }, 'F3', 'G3'],
        ],
      });

      await selectCell(-3, -1);
      await keyDownUp('arrowdown');

      expect(`
        |   ║   :                   :   |
        | # ║   :               :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,-1 from: -2,-1 to: -2,-1']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        | # ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: -1,-1']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        | # ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,-1 from: 0,-1 to: 0,-1']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║ # :                   :   |
        |   ║   :               :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,0 from: -3,0 to: -3,0']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   :                   :   |
        |   ║ # :               :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,0 from: -2,0 to: -2,0']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║ # :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║ - :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        | - ║ # :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   : #   #   #   #   # :   |
        |   ║   :               :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,1 from: -3,1 to: -3,1']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   :                   :   |
        |   ║   : #   #   #   # :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,1 from: -2,1 to: -2,1']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   : #   # :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: -1,1']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   : -   - :       :   :   |
        |===:===:===:===:===:===:===:===|
        | - ║   : # :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   : #   #   #   #   # :   |
        |   ║   :               :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,2 from: -3,2 to: -3,2']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   :                   :   |
        |   ║   : #   #   #   # :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,2 from: -2,2 to: -2,2']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   : #   # :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: -1,2']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   : -   - :       :   :   |
        |===:===:===:===:===:===:===:===|
        | - ║   :   : # :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   : #   #   #   #   # :   |
        |   ║   :               :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,3 from: -3,3 to: -3,3']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   :                   :   |
        |   ║   : #   #   #   # :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,3 from: -2,3 to: -2,3']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   :       : #   # :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,3 from: -1,3 to: -1,3']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   :       : -   - :   :   |
        |===:===:===:===:===:===:===:===|
        | - ║   :   :   : # :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: 0,3 to: 0,3']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   : #   #   #   #   # :   |
        |   ║   :               :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,4 from: -3,4 to: -3,4']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   :                   :   |
        |   ║   : #   #   #   # :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,4 from: -2,4 to: -2,4']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   :       : #   # :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,4 from: -1,4 to: -1,4']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   :       : -   - :   :   |
        |===:===:===:===:===:===:===:===|
        | - ║   :   :   :   : # :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: 0,4 to: 0,4']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   : #   #   #   #   # :   |
        |   ║   :               :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,5 from: -3,5 to: -3,5']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   :                   :   |
        |   ║   :               : # :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,5 from: -2,5 to: -2,5']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   :       :       : # :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,5 from: -1,5 to: -1,5']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   :       :       : - :   |
        |===:===:===:===:===:===:===:===|
        | - ║   :   :   :   :   : # :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,5 from: 0,5 to: 0,5']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   :                   : # |
        |   ║   :               :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,6 from: -3,6 to: -3,6']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   : # |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,6 from: -2,6 to: -2,6']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   :       :       :   : # |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,6 from: -1,6 to: -1,6']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   :       :       :   : - |
        |===:===:===:===:===:===:===:===|
        | - ║   :   :   :   :   :   : # |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,6 from: 0,6 to: 0,6']);

      await keyDownUp('arrowdown');

      expect(`
        | # ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,-1 from: -3,-1 to: -3,-1']);
    });

    it('should be possible to move the focus horizontally (autoWrap on)', async() => {
      handsontable({
        data: createSpreadsheetData(1, 7),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        autoWrapCol: true,
        autoWrapRow: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 5 }, 'G1'],
          ['A2', { label: 'B2', colspan: 4 }, 'F2', 'G2'],
          ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 2 }, 'F3', 'G3'],
        ],
      });

      await selectCell(-3, -1);
      await keyDownUp('arrowright');

      expect(`
        |   ║ # :                   :   |
        |   ║   :               :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,0 from: -3,0 to: -3,0']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   : #   #   #   #   # :   |
        |   ║   :               :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,1 from: -3,1 to: -3,1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :                   : # |
        |   ║   :               :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,6 from: -3,6 to: -3,6']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :                   :   |
        | # ║   :               :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,-1 from: -2,-1 to: -2,-1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :                   :   |
        |   ║ # :               :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,0 from: -2,0 to: -2,0']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :                   :   |
        |   ║   : #   #   #   # :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,1 from: -2,1 to: -2,1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :                   :   |
        |   ║   :               : # :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,5 from: -2,5 to: -2,5']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   : # |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,6 from: -2,6 to: -2,6']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        | # ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: -1,-1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║ # :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   : #   # :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: -1,1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   :       : #   # :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,3 from: -1,3 to: -1,3']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   :       :       : # :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,5 from: -1,5 to: -1,5']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   :       :       :   : # |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,6 from: -1,6 to: -1,6']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        | # ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,-1 from: 0,-1 to: 0,-1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║ - :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        | - ║ # :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   : -   - :       :   :   |
        |===:===:===:===:===:===:===:===|
        | - ║   : # :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   : -   - :       :   :   |
        |===:===:===:===:===:===:===:===|
        | - ║   :   : # :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   :       : -   - :   :   |
        |===:===:===:===:===:===:===:===|
        | - ║   :   :   : # :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: 0,3 to: 0,3']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   :       : -   - :   :   |
        |===:===:===:===:===:===:===:===|
        | - ║   :   :   :   : # :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: 0,4 to: 0,4']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   :       :       : - :   |
        |===:===:===:===:===:===:===:===|
        | - ║   :   :   :   :   : # :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,5 from: 0,5 to: 0,5']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   :       :       :   : - |
        |===:===:===:===:===:===:===:===|
        | - ║   :   :   :   :   :   : # |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,6 from: 0,6 to: 0,6']);

      await keyDownUp('arrowright');

      expect(`
        | # ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,-1 from: -3,-1 to: -3,-1']);
    });

    it('should be possible to move the focus around the headers when some columns are hidden (autoWrap off)', async() => {
      handsontable({
        data: createSpreadsheetData(1, 7),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 5 }, 'G1'],
          ['A2', { label: 'B2', colspan: 4 }, 'F2', 'G2'],
          ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 2 }, 'F3', 'G3'],
        ],
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(1, true); // Hide column that contains cells B{n}
      hidingMap.setValueAtIndex(2, true); // Hide column that contains cells C{n}
      hidingMap.setValueAtIndex(5, true); // Hide column that contains cells F{n}
      await render();

      await selectCell(0, 6);
      await keyDownUp('arrowup');

      expect(`
        |   ║   :       :   |
        |   ║   :       :   |
        |   ║   :       : # |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,6 from: -1,6 to: -1,6']);

      await keyDownUp('arrowleft');

      expect(`
        |   ║   :       :   |
        |   ║   :       :   |
        |   ║   : #   # :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,4 from: -1,4 to: -1,4']);

      await keyDownUp('arrowleft');

      expect(`
        |   ║   :       :   |
        |   ║   :       :   |
        |   ║ # :       :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);

      await keyDownUp('arrowleft');

      expect(`
        |   ║   :       :   |
        |   ║   :       :   |
        | # ║   :       :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: -1,-1']);

      await keyDownUp('arrowup');

      expect(`
        |   ║   :       :   |
        | # ║   :       :   |
        |   ║   :       :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,-1 from: -2,-1 to: -2,-1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :       :   |
        |   ║ # :       :   |
        |   ║   :       :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,0 from: -2,0 to: -2,0']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :       :   |
        |   ║   : #   # :   |
        |   ║   :       :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,3 from: -2,3 to: -2,3']);

      await keyDownUp('arrowright');

      expect(`
        |   ║   :       :   |
        |   ║   :       : # |
        |   ║   :       :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,6 from: -2,6 to: -2,6']);

      await keyDownUp('arrowup');

      expect(`
        |   ║   :       : # |
        |   ║   :       :   |
        |   ║   :       :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,6 from: -3,6 to: -3,6']);

      await keyDownUp('arrowleft');

      expect(`
        |   ║   : #   # :   |
        |   ║   :       :   |
        |   ║   :       :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,4 from: -3,4 to: -3,4']);

      await keyDownUp('arrowleft');

      expect(`
        |   ║ # :       :   |
        |   ║   :       :   |
        |   ║   :       :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,0 from: -3,0 to: -3,0']);

      await keyDownUp('arrowleft');

      expect(`
        | # ║   :       :   |
        |   ║   :       :   |
        |   ║   :       :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,-1 from: -3,-1 to: -3,-1']);
    });

    it('should be possible to move the focus vertically when some columns are hidden (autoWrap on)', async() => {
      handsontable({
        data: createSpreadsheetData(1, 7),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        autoWrapCol: true,
        autoWrapRow: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 5 }, 'G1'],
          ['A2', { label: 'B2', colspan: 4 }, 'F2', 'G2'],
          ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 2 }, 'F3', 'G3'],
        ],
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(0, true); // Hide column that contains cells A{n}
      hidingMap.setValueAtIndex(2, true); // Hide column that contains cells C{n}
      hidingMap.setValueAtIndex(4, true); // Hide column that contains cells F{n}
      await render();

      await selectCell(-3, -1);
      await keyDownUp('arrowdown');

      expect(`
        |   ║           :   |
        | # ║       :   :   |
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,-1 from: -2,-1 to: -2,-1']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║           :   |
        |   ║       :   :   |
        | # ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: -1,-1']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║           :   |
        |   ║       :   :   |
        |   ║   :   :   :   |
        |===:===:===:===:===|
        | # ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,-1 from: 0,-1 to: 0,-1']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║ #   #   # :   |
        |   ║       :   :   |
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,1 from: -3,1 to: -3,1']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║           :   |
        |   ║ #   # :   :   |
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,1 from: -2,1 to: -2,1']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║           :   |
        |   ║       :   :   |
        |   ║ # :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: -1,1']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║           :   |
        |   ║       :   :   |
        |   ║ - :   :   :   |
        |===:===:===:===:===|
        | - ║ # :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║ #   #   # :   |
        |   ║       :   :   |
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,3 from: -3,3 to: -3,3']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║           :   |
        |   ║ #   # :   :   |
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,3 from: -2,3 to: -2,3']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║           :   |
        |   ║       :   :   |
        |   ║   : # :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,3 from: -1,3 to: -1,3']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║           :   |
        |   ║       :   :   |
        |   ║   : - :   :   |
        |===:===:===:===:===|
        | - ║   : # :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: 0,3 to: 0,3']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║ #   #   # :   |
        |   ║       :   :   |
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,5 from: -3,5 to: -3,5']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║           :   |
        |   ║       : # :   |
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,5 from: -2,5 to: -2,5']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║           :   |
        |   ║       :   :   |
        |   ║   :   : # :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,5 from: -1,5 to: -1,5']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║           :   |
        |   ║       :   :   |
        |   ║   :   : - :   |
        |===:===:===:===:===|
        | - ║   :   : # :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,5 from: 0,5 to: 0,5']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║           : # |
        |   ║       :   :   |
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,6 from: -3,6 to: -3,6']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║           :   |
        |   ║       :   : # |
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,6 from: -2,6 to: -2,6']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║           :   |
        |   ║       :   :   |
        |   ║   :   :   : # |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,6 from: -1,6 to: -1,6']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║           :   |
        |   ║       :   :   |
        |   ║   :   :   : - |
        |===:===:===:===:===|
        | - ║   :   :   : # |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,6 from: 0,6 to: 0,6']);

      await keyDownUp('arrowdown');

      expect(`
        | # ║           :   |
        |   ║       :   :   |
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,-1 from: -3,-1 to: -3,-1']);
    });

    it('should be possible to move the focus horizontally when some columns are hidden (autoWrap on)', async() => {
      handsontable({
        data: createSpreadsheetData(1, 7),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        autoWrapCol: true,
        autoWrapRow: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 5 }, 'G1'],
          ['A2', { label: 'B2', colspan: 4 }, 'F2', 'G2'],
          ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 2 }, 'F3', 'G3'],
        ],
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(0, true); // Hide column that contains cells A{n}
      hidingMap.setValueAtIndex(2, true); // Hide column that contains cells C{n}
      hidingMap.setValueAtIndex(4, true); // Hide column that contains cells F{n}
      await render();

      await selectCell(-3, -1);
      await keyDownUp('arrowright');

      expect(`
        |   ║ #   #   # :   |
        |   ║       :   :   |
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,1 from: -3,1 to: -3,1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║           : # |
        |   ║       :   :   |
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,6 from: -3,6 to: -3,6']);

      await keyDownUp('arrowright');

      expect(`
        |   ║           :   |
        | # ║       :   :   |
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,-1 from: -2,-1 to: -2,-1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║           :   |
        |   ║ #   # :   :   |
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,1 from: -2,1 to: -2,1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║           :   |
        |   ║       : # :   |
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,5 from: -2,5 to: -2,5']);

      await keyDownUp('arrowright');

      expect(`
        |   ║           :   |
        |   ║       :   : # |
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,6 from: -2,6 to: -2,6']);

      await keyDownUp('arrowright');

      expect(`
        |   ║           :   |
        |   ║       :   :   |
        | # ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: -1,-1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║           :   |
        |   ║       :   :   |
        |   ║ # :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: -1,1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║           :   |
        |   ║       :   :   |
        |   ║   : # :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,3 from: -1,3 to: -1,3']);

      await keyDownUp('arrowright');

      expect(`
        |   ║           :   |
        |   ║       :   :   |
        |   ║   :   : # :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,5 from: -1,5 to: -1,5']);

      await keyDownUp('arrowright');

      expect(`
        |   ║           :   |
        |   ║       :   :   |
        |   ║   :   :   : # |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,6 from: -1,6 to: -1,6']);

      await keyDownUp('arrowright');

      expect(`
        |   ║           :   |
        |   ║       :   :   |
        |   ║   :   :   :   |
        |===:===:===:===:===|
        | # ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,-1 from: 0,-1 to: 0,-1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║           :   |
        |   ║       :   :   |
        |   ║ - :   :   :   |
        |===:===:===:===:===|
        | - ║ # :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║           :   |
        |   ║       :   :   |
        |   ║   : - :   :   |
        |===:===:===:===:===|
        | - ║   : # :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: 0,3 to: 0,3']);

      await keyDownUp('arrowright');

      expect(`
        |   ║           :   |
        |   ║       :   :   |
        |   ║   :   : - :   |
        |===:===:===:===:===|
        | - ║   :   : # :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,5 from: 0,5 to: 0,5']);

      await keyDownUp('arrowright');

      expect(`
        |   ║           :   |
        |   ║       :   :   |
        |   ║   :   :   : - |
        |===:===:===:===:===|
        | - ║   :   :   : # |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,6 from: 0,6 to: 0,6']);

      await keyDownUp('arrowright');

      expect(`
        | # ║           :   |
        |   ║       :   :   |
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,-1 from: -3,-1 to: -3,-1']);
    });

    it('should keep the selected column coordinates untouched when the focus moves up from the cells to nested headers', async() => {
      handsontable({
        data: createSpreadsheetData(1, 7),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 5 }, 'G1'],
          ['A2', { label: 'B2', colspan: 4 }, 'F2', 'G2'],
          ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 2 }, 'F3', 'G3'],
        ],
      });

      await selectCell(0, 4);

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   :       : -   - :   :   |
        |===:===:===:===:===:===:===:===|
        | - ║   :   :   :   : # :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: 0,4 to: 0,4']);

      await keyDownUp('arrowup');

      expect(`
        |   ║   :                   :   |
        |   ║   :               :   :   |
        |   ║   :       : #   # :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,4 from: -1,4 to: -1,4']);

      await keyDownUp('arrowup');

      expect(`
        |   ║   :                   :   |
        |   ║   : #   #   #   # :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,4 from: -2,4 to: -2,4']);

      await keyDownUp('arrowup');

      expect(`
        |   ║   : #   #   #   #   # :   |
        |   ║   :               :   :   |
        |   ║   :       :       :   :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,4 from: -3,4 to: -3,4']);
    });

    it('should scroll the viewport correctly while navigating horizontally using arrows (from left to right)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 40),
        height: 200,
        width: 300,
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          [
            { label: 'A', colspan: 1 }, { label: 'B', colspan: 2 }, { label: 'C', colspan: 3 },
            { label: 'D', colspan: 4 }, { label: 'E', colspan: 5 }, { label: 'F', colspan: 7 },
            { label: 'G', colspan: 8 }, 'H'
          ],
          [],
        ],
      });

      await selectCell(-2, -1);
      await keyDownUp('arrowright'); // "A"
      await keyDownUp('arrowright'); // "B"

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(inlineStartOverlay().getScrollPosition()).toBe(0);

      await keyDownUp('arrowright'); // "C"

      expect(topOverlay().getScrollPosition()).toBe(0);
      // 300 column width - 250 viewport width + 15 scrollbar compensation + 1 header border compensation
      expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(66);
        main.toBe(66);
        horizon.toBe(74);
      });

      await keyDownUp('arrowright'); // "D"

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(266);
        main.toBe(266);
        horizon.toBe(279);
      });

      await keyDownUp('arrowright'); // "E"

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(516);
        main.toBe(516);
        horizon.toBe(539);
      });

      await keyDownUp('arrowright'); // "F"

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(866);
        main.toBe(866);
        horizon.toBe(900);
      });

      await keyDownUp('arrowright'); // "G"

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(1266);
        main.toBe(1280);
        horizon.toBe(1354);
      });

      await keyDownUp('arrowright'); // "H"

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(1316);
        main.toBe(1333);
        horizon.toBe(1415);
      });
    });

    it('should scroll the viewport correctly while navigating horizontally using arrows (from right to left)', async() => {
      handsontable({
        data: createSpreadsheetData(2, 40),
        height: 200,
        width: 300,
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          [
            { label: 'A', colspan: 1 }, { label: 'B', colspan: 2 }, { label: 'C', colspan: 3 },
            { label: 'D', colspan: 4 }, { label: 'E', colspan: 5 }, { label: 'F', colspan: 7 },
            { label: 'G', colspan: 8 }, 'H'
          ],
          [],
        ],
      });

      await sleep(10);

      await selectCell(-2, 30);
      await keyDownUp('arrowleft'); // "G"

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(inlineStartOverlay().getScrollPosition()).toBe(1100);

      await keyDownUp('arrowleft'); // "F"

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(inlineStartOverlay().getScrollPosition()).toBe(750);

      await keyDownUp('arrowleft'); // "E"

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(inlineStartOverlay().getScrollPosition()).toBe(500);

      await keyDownUp('arrowleft'); // "D"

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(inlineStartOverlay().getScrollPosition()).toBe(300);

      await keyDownUp('arrowleft'); // "C"

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(inlineStartOverlay().getScrollPosition()).toBe(150);

      await keyDownUp('arrowleft'); // "B"

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(inlineStartOverlay().getScrollPosition()).toBe(50);

      await keyDownUp('arrowleft'); // "A"

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    });

    it('should scroll the viewport correctly while navigating vertically using arrows ' +
       '(from cell visible in viewport to the right header that is partially visible)', async() => {
      handsontable({
        data: createSpreadsheetData(2, 40),
        height: 200,
        width: 300,
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          [
            { label: 'A', colspan: 1 }, { label: 'B', colspan: 2 }, { label: 'C', colspan: 3 },
            { label: 'D', colspan: 4 }, { label: 'E', colspan: 5 }, { label: 'F', colspan: 7 },
            { label: 'G', colspan: 8 }, 'H'
          ],
          [],
        ],
      });

      await selectCell(0, 4);
      await keyDownUp('arrowup');

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(inlineStartOverlay().getScrollPosition()).toBe(0);

      await keyDownUp('arrowup'); // "C"

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
    });

    it('should scroll the viewport correctly while navigating vertically using arrows ' +
        '(from cell visible in viewport to the left header that is partially visible)', async() => {
      handsontable({
        data: createSpreadsheetData(2, 40),
        height: 200,
        width: 300,
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          [
            { label: 'A', colspan: 1 }, { label: 'B', colspan: 2 }, { label: 'C', colspan: 3 },
            { label: 'D', colspan: 4 }, { label: 'E', colspan: 5 }, { label: 'F', colspan: 7 },
            { label: 'G', colspan: 8 }, 'H'
          ],
          [],
        ],
      });

      await selectCell(0, 6);
      await selectCell(0, 2);
      await keyDownUp('arrowup');

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(inlineStartOverlay().getScrollPosition()).toBe(100);

      await keyDownUp('arrowup'); // "B"

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(inlineStartOverlay().getScrollPosition()).toBe(50);
    });

    it('should scroll the viewport when the focus enter to the nested header that is wider than the viewport width', async() => {
      handsontable({
        data: createSpreadsheetData(2, 40),
        height: 200,
        width: 300,
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          [
            { label: 'A', colspan: 1 }, { label: 'B', colspan: 2 }, { label: 'C', colspan: 3 },
            { label: 'D', colspan: 4 }, { label: 'E', colspan: 5 }, { label: 'F', colspan: 7 },
            { label: 'G', colspan: 8 }, 'H'
          ],
          [],
        ],
      });

      await sleep(10);

      await selectCell(-1, 20);

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(inlineStartOverlay().getScrollPosition()).toBe(801);

      await keyDownUp('arrowup'); // scroll to the beginning of the "F" header

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(inlineStartOverlay().getScrollPosition()).toBe(750);

      await keyDownUp('arrowdown');

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(inlineStartOverlay().getScrollPosition()).toBe(801);

      await keyDownUp('arrowup'); // scroll to the beginning of the "F" header

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(inlineStartOverlay().getScrollPosition()).toBe(750);
    });
  });

  describe('focusing table elements', () => {
    it('should focus on the leftmost element of the merged header when navigating the headers in both directions' +
      ' (left and right)', async() => {
      handsontable({
        startRows: 2,
        startCols: 4,
        colHeaders: true,
        nestedHeaders: [
          ['a', { label: 'b', colspan: 2 }, 'c'],
        ],
        navigableHeaders: true,
      });

      await selectCell(-1, 0);

      expect(document.activeElement).toEqual(getCell(-1, 0));

      await keyDownUp('arrowright');

      expect(document.activeElement).toEqual(getCell(-1, 1));

      await keyDownUp('arrowright');

      expect(document.activeElement).toEqual(getCell(-1, 3));

      await keyDownUp('arrowleft');

      expect(document.activeElement).toEqual(getCell(-1, 1));

      await keyDownUp('arrowleft');

      expect(document.activeElement).toEqual(getCell(-1, 0));
    });
  });
});
