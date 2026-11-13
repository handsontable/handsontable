import Handsontable from 'handsontable';

const container = document.querySelector<HTMLElement>('#grid')!;

const hot = new Handsontable(container, {
  licenseKey: 'your-license-key',
  manualColumnMove: true,
  // TODO(handsontable-codemod 18.1.0/column-move-hooks): Move header-click logic from this hook to afterColumnSort or afterOnCellMouseUp. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#update-code-that-reacts-to-a-column-header-click
  afterColumnMove(movedColumns, finalIndex) {
    track(movedColumns, finalIndex);
  },
  afterColumnSort() {},
});

// TODO(handsontable-codemod 18.1.0/column-move-hooks): Move header-click logic from this hook to afterColumnSort or afterOnCellMouseUp. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#update-code-that-reacts-to-a-column-header-click
hot.addHook('beforeColumnMove', () => true);
// TODO(handsontable-codemod 18.1.0/column-move-hooks): Move header-click logic from this hook to afterColumnSort or afterOnCellMouseUp. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#update-code-that-reacts-to-a-column-header-click
Handsontable.hooks.add('afterColumnMove', () => {});

const options = { afterColumnMove: 'not a hook of a grid' };
