describe('BaseEditor keyboard shortcuts', () => {
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

  describe('"Ctrl/Meta + Shift + Enter"', () => {
    it('should populate value from the cell to active selection layer only', async() => {
      handsontable({
        data: createSpreadsheetData(6, 6)
      });

      await selectCells([[0, 0, 1, 1], [2, 2, 3, 3], [4, 4, 5, 5]]);

      await keyDownUp('F2');
      await keyDownUp(['control/meta', 'shift', 'enter']);

      expect(getData()).toEqual([
        ['A1', 'B1', 'C1', 'D1', 'E1', 'F1'],
        ['A2', 'B2', 'C2', 'D2', 'E2', 'F2'],
        ['A3', 'B3', 'C3', 'D3', 'E3', 'F3'],
        ['A4', 'B4', 'C4', 'D4', 'E4', 'F4'],
        ['A5', 'B5', 'C5', 'D5', 'E5', 'E5'],
        ['A6', 'B6', 'C6', 'D6', 'E5', 'E5'],
      ]);
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 1,1',
        'highlight: 3,3 from: 2,2 to: 3,3',
        'highlight: 4,4 from: 4,4 to: 5,5',
      ]);
    });

    it('should populate value from the cell to active selection layer only (change active selection layer)', async() => {
      handsontable({
        data: createSpreadsheetData(6, 6)
      });

      await selectCells([[0, 0, 1, 1], [2, 2, 3, 3], [4, 4, 5, 5]]);
      await keyDownUp(['shift', 'tab']); // select the previous selection layer

      await keyDownUp('F2');
      await keyDownUp(['control/meta', 'shift', 'enter']);

      expect(getData()).toEqual([
        ['A1', 'B1', 'C1', 'D1', 'E1', 'F1'],
        ['A2', 'B2', 'C2', 'D2', 'E2', 'F2'],
        ['A3', 'B3', 'D4', 'D4', 'E3', 'F3'],
        ['A4', 'B4', 'D4', 'D4', 'E4', 'F4'],
        ['A5', 'B5', 'C5', 'D5', 'E5', 'F5'],
        ['A6', 'B6', 'C6', 'D6', 'E6', 'F6'],
      ]);
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 1,1',
        'highlight: 2,3 from: 2,2 to: 3,3',
        'highlight: 4,4 from: 4,4 to: 5,5',
      ]);
    });
  });
});
