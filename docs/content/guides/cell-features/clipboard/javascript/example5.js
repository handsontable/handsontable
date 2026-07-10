import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
// Register all Handsontable's modules.
registerAllModules();
const container = document.querySelector('#example5');
let copiedComments = [];
function collectComments(hot, coords) {
    const source = coords[0];
    const comments = hot.getPlugin('comments');
    const copied = [];
    if (!source) {
        return copied;
    }
    for (let row = source.startRow; row <= source.endRow; row += 1) {
        const rowComments = [];
        for (let col = source.startCol; col <= source.endCol; col += 1) {
            rowComments.push(comments.getCommentAtCell(row, col));
        }
        copied.push(rowComments);
    }
    return copied;
}
function applyComments(hot, coords) {
    const target = coords[0];
    const comments = hot.getPlugin('comments');
    if (!target) {
        return;
    }
    hot.batch(() => {
        copiedComments.forEach((rowComments, rowOffset) => {
            rowComments.forEach((comment, colOffset) => {
                const row = target.startRow + rowOffset;
                const col = target.startCol + colOffset;
                if (comment) {
                    comments.setCommentAtCell(row, col, comment);
                }
                else {
                    comments.removeCommentAtCell(row, col, false);
                }
            });
        });
    });
    hot.render();
}
new Handsontable(container, {
    data: [
        ['Wireless mouse', 142, 'In stock'],
        ['USB-C cable', 67, 'In stock'],
        ['Mechanical keyboard', 0, 'Backordered'],
        ['Laptop stand', 38, 'In stock'],
        ['HDMI adapter', 210, 'In stock'],
    ],
    colHeaders: ['Product', 'Stock', 'Status'],
    rowHeaders: true,
    comments: true,
    cell: [
        { row: 0, col: 1, comment: { value: 'Counted during the July audit.' } },
        { row: 2, col: 1, comment: { value: 'Reorder request sent to Harbor Goods.' } },
        { row: 2, col: 2, comment: { value: 'Expected delivery is July 18.' } },
    ],
    afterCopy(_data, coords) {
        copiedComments = collectComments(this, coords);
    },
    afterPaste(_data, coords) {
        applyComments(this, coords);
    },
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: 'non-commercial-and-evaluation',
});
