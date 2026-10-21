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

  // These two used to assert that only the ACTIVE layer was populated. That was the defect reported
  // in DEV-103, not a decision - the same chord with no editor open has always filled every layer,
  // and the keyboard-shortcuts guide never documented a single-layer limit for it. The expectations
  // now describe the fill reaching all three layers; the selection assertions are unchanged, since
  // where the focus lands afterwards is not what the fix touched.
  describe('"Ctrl/Meta + Enter"', () => {
    it('should populate value from the cell to every selection layer', async() => {
      handsontable({
        data: createSpreadsheetData(6, 6)
      });

      await selectCells([[0, 0, 1, 1], [2, 2, 3, 3], [4, 4, 5, 5]]);

      await keyDownUp('F2');
      await keyDownUp(['control/meta', 'enter']);

      expect(getData()).toEqual([
        ['E5', 'E5', 'C1', 'D1', 'E1', 'F1'],
        ['E5', 'E5', 'C2', 'D2', 'E2', 'F2'],
        ['A3', 'B3', 'E5', 'E5', 'E3', 'F3'],
        ['A4', 'B4', 'E5', 'E5', 'E4', 'F4'],
        ['A5', 'B5', 'C5', 'D5', 'E5', 'E5'],
        ['A6', 'B6', 'C6', 'D6', 'E5', 'E5'],
      ]);
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 1,1',
        'highlight: 2,2 from: 2,2 to: 3,3',
        'highlight: 5,4 from: 4,4 to: 5,5',
      ]);
    });

    it('should populate value from the cell to every selection layer (change active selection layer)', async() => {
      handsontable({
        data: createSpreadsheetData(6, 6)
      });

      await selectCells([[0, 0, 1, 1], [2, 2, 3, 3], [4, 4, 5, 5]]);
      await keyDownUp(['shift', 'tab']); // select the previous selection layer

      await keyDownUp('F2');
      await keyDownUp(['control/meta', 'enter']);

      // The value comes from the layer that holds the focus, and it still reaches every layer.
      expect(getData()).toEqual([
        ['D4', 'D4', 'C1', 'D1', 'E1', 'F1'],
        ['D4', 'D4', 'C2', 'D2', 'E2', 'F2'],
        ['A3', 'B3', 'D4', 'D4', 'E3', 'F3'],
        ['A4', 'B4', 'D4', 'D4', 'E4', 'F4'],
        ['A5', 'B5', 'C5', 'D5', 'D4', 'D4'],
        ['A6', 'B6', 'C6', 'D6', 'D4', 'D4'],
      ]);
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 1,1',
        'highlight: 3,3 from: 2,2 to: 3,3',
        'highlight: 4,4 from: 4,4 to: 5,5',
      ]);
    });
  });
});
