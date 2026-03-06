import HyperFormula from 'hyperformula';

describe('Formulas', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('Integration with Copy/Paste', () => {
    it('should allow pasting data near the table borders (thus extending the table)', async() => {
      handsontable({
        data: [[1, 'x'], ['=A1 + 1', 'y']],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
      });

      const copyEvent = getClipboardEvent();
      const copyPastePlugin = getPlugin('CopyPaste');

      await selectCell(0, 0, 1, 1);

      copyPastePlugin.onCopy(copyEvent);

      await selectCell(1, 1);

      copyPastePlugin.onPaste(copyEvent);

      expect(countRows()).toEqual(3);
      expect(countCols()).toEqual(3);
      expect(getData()).toEqual([
        [1, 'x', null],
        [2, '1', 'x'],
        [null, '2', 'y']
      ]);
    });
  });
});
