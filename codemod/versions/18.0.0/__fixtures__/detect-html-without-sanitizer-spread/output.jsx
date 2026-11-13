import Handsontable from 'handsontable';
import { HotTable } from '@handsontable/react-wrapper';
import { remote } from './remote';

const shared = {
  nestedHeaders: [['<b>Book</b>', 'Desk']],
};

const withSanitizer = {
  nestedHeaders: [['<b>Book</b>']],
  sanitizer: html => html,
};

const chained = {
  ...remote,
  colHeaders: ['<i>A</i>'],
};

const plain = { colHeaders: ['A', 'B'] };

// TODO(handsontable-codemod 18.0.0/html-without-sanitizer): Add a sanitizer option if any of the markup in this grid is untrusted. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-built-in-dompurify-with-a-custom-sanitizer
new Handsontable(document.body, { ...shared, licenseKey: 'x' });
new Handsontable(document.body, { ...withSanitizer });
new Handsontable(document.body, { ...chained });
// TODO(handsontable-codemod 18.0.0/html-without-sanitizer): Check that one of the spread ...remote sets a sanitizer option, because the tool could not see... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-built-in-dompurify-with-a-custom-sanitizer
new Handsontable(document.body, { ...remote, ...shared });
new Handsontable(document.body, { ...remote, ...withSanitizer });
new Handsontable(document.body, { ...remote, ...plain });
new Handsontable(document.body, { ...plain });

export function Page({ rows, props }) {
  return (
    <>
      {/* TODO(handsontable-codemod 18.0.0/html-without-sanitizer): Add a sanitizer option if any of the markup in this grid is untrusted. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-built-in-dompurify-with-a-custom-sanitizer */}
      <HotTable {...shared} data={rows} />
      <HotTable {...withSanitizer} data={rows} />
      {/* TODO(handsontable-codemod 18.0.0/html-without-sanitizer): Check that one of the spread ...props sets a sanitizer option, because the tool could not see... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-built-in-dompurify-with-a-custom-sanitizer */}
      <HotTable {...shared} {...props} data={rows} />
      <HotTable {...withSanitizer} {...props} data={rows} />
      <HotTable {...plain} {...props} data={rows} />
      <HotTable {...plain} data={rows} />
    </>
  );
}
