// Not a Handsontable file in code: it mentions Handsontable only in this comment.
const form = { maxLength: 20, rowHeights: 50 };
const table = createTable();

table.spliceCol(1, 1, 1);
table.getCopyableData(0, 0);
