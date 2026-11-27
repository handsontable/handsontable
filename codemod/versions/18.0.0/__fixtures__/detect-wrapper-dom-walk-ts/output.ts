import Handsontable from 'handsontable';

const container = document.querySelector('#grid') as HTMLElement;

new Handsontable(container, { data: [[1]], licenseKey: 'my-own-key' });

// Position-based walks of the old structure, with an optional chain, a non-null assertion, and a cast.
// TODO(handsontable-codemod 18.0.0/wrapper-dom-selectors): Select by class instead, for example .ht-grid-content > .handsontable or .ht-wrapper.handsontable. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#update-css-selectors-and-dom-queries-for-the-new-wrapper-structure
const first = document.querySelector('.ht-grid')?.firstElementChild;
// TODO(handsontable-codemod 18.0.0/wrapper-dom-selectors): Select by class instead, for example .ht-grid-content > .handsontable or .ht-wrapper.handsontable. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#update-css-selectors-and-dom-queries-for-the-new-wrapper-structure
const kids = document.querySelector(".ht-grid")!.children;
// TODO(handsontable-codemod 18.0.0/wrapper-dom-selectors): Select by class instead, for example .ht-grid-content > .handsontable or .ht-wrapper.handsontable. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#update-css-selectors-and-dom-queries-for-the-new-wrapper-structure
const node = (document.querySelector('.ht-grid') as HTMLElement).firstChild;
// TODO(handsontable-codemod 18.0.0/wrapper-dom-selectors): Select by class instead, for example .ht-grid-content > .handsontable or .ht-wrapper.handsontable. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#update-css-selectors-and-dom-queries-for-the-new-wrapper-structure
const typed = (document.querySelector<HTMLElement>('.ht-grid')! as HTMLElement)?.children;

function firstOf(): ChildNode | null {
  // TODO(handsontable-codemod 18.0.0/wrapper-dom-selectors): Select by class instead, for example .ht-grid-content > .handsontable or .ht-wrapper.handsontable. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#update-css-selectors-and-dom-queries-for-the-new-wrapper-structure
  return (document.querySelector('.ht-grid') as HTMLElement).firstChild;
}

// The new structure, other elements, a call that only takes the grid, and no walk at all are not reported.
const content = document.querySelector('.ht-grid-content')?.firstElementChild;
const sibling = (document.querySelector('.ht-grid-extra') as HTMLElement).children;
const wrapper = document.querySelector('.ht-grid') as HTMLElement;
const measured = measure(document.querySelector('.ht-grid') as HTMLElement).children;
const optional = document.querySelector('.ht-grid')?.className;
