import Handsontable from 'handsontable';

const container = document.querySelector<HTMLElement>('#grid')!;
const hot = new Handsontable(container, {});

const legacy = hot.rootElement.querySelector('.ht-grid > .handsontable');
const first = hot.rootElement.querySelector(`.ht-root-wrapper > :first-child`);
const safe = hot.rootElement.querySelector('.ht-wrapper.handsontable');
const content = hot.rootElement.querySelector('.ht-grid > .ht-grid-content');
const unrelated = document.querySelector('.card > :first-child');
