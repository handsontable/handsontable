import Handsontable from 'handsontable';

const container = document.querySelector<HTMLElement>('#grid')!;
const hot = new Handsontable(container, {});

// TODO(handsontable-codemod 18.0.0/pikaday-leftovers): Remove this code, or style the native input instead. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-date-and-time-cells-to-iso-8601-format
const holder = document.querySelector('.htDatepickerHolder');
// TODO(handsontable-codemod 18.0.0/pikaday-leftovers): Remove this code, or style the native input instead. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-date-and-time-cells-to-iso-8601-format
const picker = hot.rootElement.querySelector(`.pika-single`);
const unrelated = document.querySelector('.speaker-pika');
