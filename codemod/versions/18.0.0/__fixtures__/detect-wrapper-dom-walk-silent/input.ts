import Handsontable from 'handsontable';

const container = document.querySelector('#grid') as HTMLElement;

new Handsontable(container, { data: [[1]], licenseKey: 'my-own-key' });

// One walk with a generic call and a template literal is reported.
const generic = document.querySelector<HTMLElement>(`.ht-grid`)?.['childNodes'];

// A parent, the new structure, another class, a template with an expression, a variable selector, and a call that only
// takes the element are not reported.
const parent = document.querySelector('.ht-grid')?.parentElement;
const content = document.querySelector('.ht-grid-content')?.firstElementChild;
const other = document.querySelector(`.ht-grid-extra`).childNodes;
const dynamic = document.querySelector(`.ht-${name}`).children;
const variable = document.querySelector(selector).children;
const wrapped = measure(<HTMLElement>document.querySelector('.ht-grid')).children;
const measured = measure(document.querySelector('.ht-grid') as HTMLElement).lastChild;
const bracketName = document.querySelector('.ht-grid')?.['className'];
const indexed = document.querySelector('.ht-grid')[0];
