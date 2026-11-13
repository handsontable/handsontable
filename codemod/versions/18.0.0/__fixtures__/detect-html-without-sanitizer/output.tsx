import Handsontable from 'handsontable';
import { HotTable } from '@handsontable/react-wrapper';

const container = document.querySelector<HTMLElement>('#grid')!;

// TODO(handsontable-codemod 18.0.0/html-without-sanitizer): Add a sanitizer option if any of the markup in this grid is untrusted. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-built-in-dompurify-with-a-custom-sanitizer
new Handsontable(container, {
  colHeaders: ['<b>Name</b>', '<i>Status</i>'],
});

new Handsontable(container, {
  colHeaders: ['<b>Name</b>'],
  sanitizer: (html: string) => htmlCleaner.clean(html),
});

new Handsontable(container, {
  colHeaders: ['Name', 'Status'],
});

// TODO(handsontable-codemod 18.0.0/html-without-sanitizer): Check that one of the spread ...sharedSettings sets a sanitizer option, because the tool could... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-built-in-dompurify-with-a-custom-sanitizer
new Handsontable(container, {
  ...sharedSettings,
  colHeaders: ['<b>Name</b>'],
});

// TODO(handsontable-codemod 18.0.0/html-without-sanitizer): Add a sanitizer option if any of the markup in this grid is untrusted. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-built-in-dompurify-with-a-custom-sanitizer
export const Grid = () => <HotTable colHeaders={['<b>Name</b>']} />;
