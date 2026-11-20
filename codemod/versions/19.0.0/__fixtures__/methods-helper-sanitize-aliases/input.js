import HT from 'handsontable';
import DOMPurify from 'dompurify';

const { helper } = HT;
const { sanitize } = helper;

export const a = helper.sanitize('<i>a</i>');
export const b = sanitize('<i>b</i>');
export const sanitizer = HT.helper.sanitize;
export const clean = DOMPurify.sanitize('<b>c</b>');
