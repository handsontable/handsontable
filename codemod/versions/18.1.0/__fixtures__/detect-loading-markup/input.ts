import Handsontable from 'handsontable';

const container = document.querySelector<HTMLElement>('#grid')!;

new Handsontable(container, {
  licenseKey: 'your-license-key',
  loading: {
    title: 'Loading <strong>sales data</strong>',
    description: 'Step 1 of 3<br>This can take a minute',
  },
});

new Handsontable(container, {
  licenseKey: 'your-license-key',
  loading: {
    title: 'Loading sales data',
    description: 'Step 1 of 3. This can take a minute.',
    icon: '<svg viewBox="0 0 8 8"></svg>',
  },
});

const label = { loading: { title: 'Loading <b>x</b>' } };
