import Handsontable, { CellCoords } from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  comments: true,
});
new Handsontable(document.createElement('div'), {
  comments: {
    displayDelay: 100,
  },
});
const comments = hot.getPlugin('comments');

comments.focusEditor();
comments.setRange({ from: new CellCoords(1, 1), to: new CellCoords(2, 2) });
comments.clearRange();
comments.setCommentAtCell(1, 2, 'test');
comments.removeComment();
comments.removeComment(true);
comments.removeCommentAtCell(1, 2);
comments.removeCommentAtCell(1, 2, true);
comments.hide();
comments.refreshEditor();
comments.refreshEditor(true);
comments.updateCommentMeta(1, 2, { test: 'test' });

const comment: string = comments.getComment();
const commentAt: string = comments.getCommentAtCell(1, 2);
const isShown: boolean = comments.show();
const isShownAt: boolean = comments.showAtCell(1, 2);
const testMeta: string = comments.getCommentMeta(1, 2, 'test');
