import Handsontable from 'handsontable';

const container = document.querySelector('#grid') as HTMLElement;

new Handsontable(container, { data: [[1]], licenseKey: 'my-own-key' });

// Position-based walks of the old structure, in the spellings a selector and an accessor can take.
const staticTemplate = document.querySelector(`.ht-grid`).firstElementChild;
const bracket = document.querySelector('.ht-grid')['firstElementChild'];
const optionalBracket = document.querySelector('.ht-grid')?.['children'];
const angleCast = (<HTMLElement>document.querySelector('.ht-grid')).firstElementChild;
const angleCastNonNull = (<HTMLElement>document.querySelector('.ht-grid')!)!.firstChild;
