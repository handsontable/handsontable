describe('CopyPaste', () => {
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

  describe('context menu', () => {
    it('should contain only "copy" and "cut" actions when the `copyPaste` option is set as `true`', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: true,
      });

      contextMenu(getCell(1, 1));

      expect($('.htContextMenu tbody tr td').text()).toBe([
        'Insert row above',
        'Insert row below',
        'Insert column left',
        'Insert column right',
        'Remove row',
        'Remove column',
        'Undo',
        'Redo',
        'Read only',
        'Alignment',
        'Copy',
        'Cut',
      ].join(''));
    });

    it('should contain all "copy" actions in right order', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnHeadersOnly: true,
          copyColumnGroupHeaders: true,
          copyColumnHeaders: true,
        },
      });

      contextMenu(getCell(1, 1));

      expect($('.htContextMenu tbody tr td').text()).toBe([
        'Insert row above',
        'Insert row below',
        'Insert column left',
        'Insert column right',
        'Remove row',
        'Remove column',
        'Undo',
        'Redo',
        'Read only',
        'Alignment',
        'Copy',
        'Copy with header',
        'Copy with group header',
        'Copy header only',
        'Cut',
      ].join(''));
    });
  });
});
