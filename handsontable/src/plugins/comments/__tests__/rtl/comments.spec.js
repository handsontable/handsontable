describe('Comments (RTL mode)', () => {
  const id = 'testContainer';

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('Styling', () => {
    it('should display comment indicators in the appropriate cells', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true,
        cell: [
          { row: 1, col: 1, comment: { value: 'test' } },
          { row: 2, col: 2, comment: { value: 'test' } }
        ]
      });

      expect(getCell(1, 1).classList.contains('htCommentCell')).toBeTrue();
      expect(getComputedStyle(getCell(1, 1), ':after').left).toBe('0px');
      expect(getComputedStyle(getCell(1, 1), ':after').right).toBe('43px');
      expect(getComputedStyle(getCell(1, 1), ':after').borderLeftWidth).toBe('0px');
      expect(getComputedStyle(getCell(1, 1), ':after').borderRightWidth).toBe('6px');
      expect(getCell(2, 2).classList.contains('htCommentCell')).toBeTrue();
      expect(getComputedStyle(getCell(1, 1), ':after').left).toBe('0px');
      expect(getComputedStyle(getCell(1, 1), ':after').right).toBe('43px');
      expect(getComputedStyle(getCell(2, 2), ':after').borderLeftWidth).toBe('0px');
      expect(getComputedStyle(getCell(2, 2), ':after').borderRightWidth).toBe('6px');
    });

    it('should display the comment editor in the correct place', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        comments: true,
      });

      const plugin = getPlugin('comments');
      const $editor = $(plugin.editor.getInputElement());

      plugin.showAtCell(0, 1);

      const cellOffset = $(getCell(0, 1)).offset();
      const editorOffset = $editor.offset();
      const editorWidth = $editor.outerWidth();

      expect(editorOffset.top).toBeCloseTo(cellOffset.top, 0);
      expect(editorOffset.left).toBeCloseTo(cellOffset.left - editorWidth, 0);
    });
  });
});
