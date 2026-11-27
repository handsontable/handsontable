import Handsontable from 'handsontable';

const container = document.querySelector<HTMLElement>('#grid')!;
const hot = new Handsontable(container, {});

const holder = document.querySelector('.htDatepickerHolder');
const picker = hot.rootElement.querySelector(`.pika-single`);
const unrelated = document.querySelector('.speaker-pika');
