// This invoice module has nothing to do with Handsontable. It only mentions the name so the cheap
// precheck lets the file through, and every rule must still stay silent.
export const invoiceColumns = [
  { type: 'number', numericFormat: { pattern: '0,0.00 $' } },
  { type: 'date', dateFormat: 'DD/MM/YYYY' },
  { type: 'time', timeFormat: 'h:mm:ss a' },
];

export const toast = {
  loading: { title: 'Loading <strong>sales</strong>', description: 'Step 1<br>of 3' },
  colHeaders: ['<b>Name</b>'],
};

export const selectors = ['.ht-grid > .handsontable', '.pika-single'];

export const hooks = { beforeColumnMove() {}, afterColumnMove() {} };

window.addHook?.('afterColumnMove', () => {});
