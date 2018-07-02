import * as Handsontable from 'handsontable';

const copyPaste = Handsontable.plugins.CopyPaste;

copyPaste.columnsLimit = 10;
copyPaste.rowsLimit = 10;
copyPaste.pasteMode = 'overwrite';
copyPaste.pasteMode = 'shift_down';
copyPaste.pasteMode = 'shift_right';

copyPaste.copy();
copyPaste.copy(true);

copyPaste.cut();
copyPaste.cut(true);

copyPaste.paste();
copyPaste.paste(true);

copyPaste.getRangedData([{ startRow: 1, startCol: 1, endRow: 2, endCol: 2 }]);
copyPaste.getRangedCopyableData([{ startRow: 1, startCol: 1, endRow: 2, endCol: 2 }]);
copyPaste.setCopyableText();
