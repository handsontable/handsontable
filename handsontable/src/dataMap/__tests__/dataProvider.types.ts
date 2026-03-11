import Handsontable from 'handsontable';

// Synchronous dataProvider returning array of arrays.
new Handsontable(document.createElement('div'), {
  dataProvider(request: { type: string }) {
    return [
      ['A1', 'B1'],
      ['A2', 'B2'],
    ];
  },
});

// Synchronous dataProvider returning array of objects.
new Handsontable(document.createElement('div'), {
  dataProvider(request: { type: string }) {
    return [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];
  },
});

// Asynchronous dataProvider returning a Promise.
new Handsontable(document.createElement('div'), {
  dataProvider(request: { type: string }) {
    return Promise.resolve([
      ['A1', 'B1'],
      ['A2', 'B2'],
    ]);
  },
});

// dataProvider alongside other options.
new Handsontable(document.createElement('div'), {
  dataProvider(request: { type: string }) {
    return [['A1']];
  },
  colHeaders: true,
  rowHeaders: true,
});

// dataProvider is optional.
new Handsontable(document.createElement('div'), {});
