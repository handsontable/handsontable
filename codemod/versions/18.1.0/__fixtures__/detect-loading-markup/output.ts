import Handsontable from 'handsontable';

const container = document.querySelector<HTMLElement>('#grid')!;

new Handsontable(container, {
  licenseKey: 'your-license-key',
  loading: {
    // TODO(handsontable-codemod 18.1.0/loading-markup): Drop the markup and style .ht-loading__title and .ht-loading__description with CSS. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#expect-markup-in-the-loading-plugins-title-and-description-to-render-as-text
    title: 'Loading <strong>sales data</strong>',
    // TODO(handsontable-codemod 18.1.0/loading-markup): Drop the markup and style .ht-loading__title and .ht-loading__description with CSS. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#expect-markup-in-the-loading-plugins-title-and-description-to-render-as-text
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
