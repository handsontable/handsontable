import Handsontable from 'handsontable';

const container = document.querySelector('#grid') as HTMLElement;

new Handsontable(container, { data: [[1]], licenseKey: 'my-own-key' });

// The other members that walk down from the wrapper or the grid element, and the root wrapper itself.
const childNodes = document.querySelector('.ht-grid')!.childNodes[0];
const lastElement = document.querySelector('.ht-grid')?.lastElementChild;
const lastNode = (document.querySelector('.ht-grid') as HTMLElement).lastChild;
const rootWrapper = document.querySelector('.ht-root-wrapper')?.firstElementChild;
const rootWrapperKids = document.querySelector(".ht-root-wrapper")!.children;
