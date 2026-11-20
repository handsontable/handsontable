import Handsontable from 'handsontable';

export const safe = Handsontable.helper.sanitize('<b>a</b>');

// Not the helper of Handsontable.
export const other = purifier.sanitize('<b>b</b>');
