import Handsontable from 'handsontable';

// TODO(handsontable-codemod 19.0.0/helper-sanitize): Review Handsontable.helper.sanitize() by hand. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#removed-deprecated-apis
export const safe = Handsontable.helper.sanitize('<b>a</b>');

// Not the helper of Handsontable.
export const other = purifier.sanitize('<b>b</b>');
