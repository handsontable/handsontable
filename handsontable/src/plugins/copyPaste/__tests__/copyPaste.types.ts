import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  copyPaste: true,
});

new Handsontable(document.createElement('div'), {
  copyPaste: {
    pasteMode: 'overwrite',
    rowsLimit: 10,
    columnsLimit: 20,
    copyColumnHeaders: true,
    copyColumnGroupHeaders: true,
    copyColumnHeadersOnly: true,
    uiContainer: document.body,
  },
});

new Handsontable(document.createElement('div'), {
  copyPaste: {
    pasteMode: 'shift_down',
    copyColumnHeaders: true,
    copyColumnGroupHeaders: true,
    copyColumnHeadersOnly: true,
  },
});

new Handsontable(document.createElement('div'), {
  copyPaste: {
    pasteMode: 'shift_right',
  },
});

const copyPaste = hot.getPlugin('copyPaste');

copyPaste.columnsLimit = 10;
copyPaste.rowsLimit = 10;
copyPaste.pasteMode = 'overwrite';
copyPaste.pasteMode = 'shift_down';
copyPaste.pasteMode = 'shift_right';

copyPaste.copy();
copyPaste.copy('cells-only');
copyPaste.copy('column-headers-only');
copyPaste.copy('with-all-column-headers');
copyPaste.copy('with-column-headers');
copyPaste.copyCellsOnly();
copyPaste.copyColumnHeadersOnly();
copyPaste.copyWithAllColumnHeaders();
copyPaste.copyWithColumnHeaders();
copyPaste.cut();
copyPaste.getRangedData([{ startRow: 1, startCol: 1, endRow: 2, endCol: 2 }]);
copyPaste.getRangedCopyableData([{ startRow: 1, startCol: 1, endRow: 2, endCol: 2 }]);
copyPaste.paste();
copyPaste.paste('A1\tB1');
copyPaste.paste(undefined, '<table><tbody><tr><td>A1</td><td>B1</td></tr></tbody></table>');
copyPaste.paste('A1\tB1', '<table><tbody><tr><td>A1</td><td>B1</td></tr></tbody></table>');
copyPaste.setCopyableText();
