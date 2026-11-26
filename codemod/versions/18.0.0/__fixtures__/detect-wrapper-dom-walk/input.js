import Handsontable from 'handsontable';

const container = document.querySelector('#grid');

new Handsontable(container, { data: [[1]], licenseKey: 'my-own-key' });

// Position-based walks of the old structure.
const first = document.querySelector('.ht-grid').firstElementChild;
const kids = document.querySelector(".ht-grid").children;
const node = document.querySelector('.ht-grid').firstChild;

// The new structure, selected by class, and other elements, are not reported.
const content = document.querySelector('.ht-grid-content').firstElementChild;
const sibling = document.querySelector('.ht-grid-extra').children;
const wrapper = document.querySelector('.ht-grid');
