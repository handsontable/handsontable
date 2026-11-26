import Handsontable from 'handsontable';

const container = document.querySelector('#grid');

new Handsontable(container, { data: [[1]], licenseKey: 'my-own-key' });

// Position-based walks of the old structure.
// TODO(handsontable-codemod 18.0.0/wrapper-dom-selectors): Select by class instead, for example .ht-grid-content > .handsontable or .ht-wrapper.handsontable. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#update-css-selectors-and-dom-queries-for-the-new-wrapper-structure
const first = document.querySelector('.ht-grid').firstElementChild;
// TODO(handsontable-codemod 18.0.0/wrapper-dom-selectors): Select by class instead, for example .ht-grid-content > .handsontable or .ht-wrapper.handsontable. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#update-css-selectors-and-dom-queries-for-the-new-wrapper-structure
const kids = document.querySelector(".ht-grid").children;
// TODO(handsontable-codemod 18.0.0/wrapper-dom-selectors): Select by class instead, for example .ht-grid-content > .handsontable or .ht-wrapper.handsontable. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#update-css-selectors-and-dom-queries-for-the-new-wrapper-structure
const node = document.querySelector('.ht-grid').firstChild;

// The new structure, selected by class, and other elements, are not reported.
const content = document.querySelector('.ht-grid-content').firstElementChild;
const sibling = document.querySelector('.ht-grid-extra').children;
const wrapper = document.querySelector('.ht-grid');
