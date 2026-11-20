import Handsontable from 'handsontable';

const container = document.querySelector<HTMLElement>('#grid')!;

const hot = new Handsontable(container, {
  licenseKey: 'your-license-key',
  manualColumnMove: true,
  afterColumnMove(movedColumns, finalIndex) {
    track(movedColumns, finalIndex);
  },
  afterColumnSort() {},
});

hot.addHook('beforeColumnMove', () => true);
Handsontable.hooks.add('afterColumnMove', () => {});

const options = { afterColumnMove: 'not a hook of a grid' };
