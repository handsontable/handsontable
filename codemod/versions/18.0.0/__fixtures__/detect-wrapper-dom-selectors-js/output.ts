import Handsontable from 'handsontable';

const container = document.querySelector<HTMLElement>('#grid')!;
const hot = new Handsontable(container, {});

// TODO(handsontable-codemod 18.0.0/wrapper-dom-selectors): Select by class instead, for example .ht-grid-content > .handsontable or .ht-wrapper.handsontable. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#update-css-selectors-and-dom-queries-for-the-new-wrapper-structure
const legacy = hot.rootElement.querySelector('.ht-grid > .handsontable');
// TODO(handsontable-codemod 18.0.0/wrapper-dom-selectors): Select by class instead, for example .ht-grid-content > .handsontable or .ht-wrapper.handsontable. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#update-css-selectors-and-dom-queries-for-the-new-wrapper-structure
const first = hot.rootElement.querySelector(`.ht-root-wrapper > :first-child`);
const safe = hot.rootElement.querySelector('.ht-wrapper.handsontable');
const content = hot.rootElement.querySelector('.ht-grid > .ht-grid-content');
const unrelated = document.querySelector('.card > :first-child');
