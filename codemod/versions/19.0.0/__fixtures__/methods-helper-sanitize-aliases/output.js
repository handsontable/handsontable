import HT from 'handsontable';
import DOMPurify from 'dompurify';

const { helper } = HT;
const { sanitize } = helper;

// TODO(handsontable-codemod 19.0.0/helper-sanitize): Review Handsontable.helper.sanitize() by hand. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#removed-deprecated-apis
export const a = helper.sanitize('<i>a</i>');
// TODO(handsontable-codemod 19.0.0/helper-sanitize): Review Handsontable.helper.sanitize() by hand. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#removed-deprecated-apis
export const b = sanitize('<i>b</i>');
// TODO(handsontable-codemod 19.0.0/helper-sanitize): Replace Handsontable.helper.sanitize by hand: it is exported here, so it is used in other files. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#removed-deprecated-apis
export const sanitizer = HT.helper.sanitize;
export const clean = DOMPurify.sanitize('<b>c</b>');
