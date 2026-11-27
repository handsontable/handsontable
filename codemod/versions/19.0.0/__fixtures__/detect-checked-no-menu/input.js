import Handsontable from 'handsontable';

// A file with no context menu or column menu is not reported.
export const state = { checked: true };

new Handsontable(document.querySelector('#grid'), { data: [[1]] });
