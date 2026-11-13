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

new Handsontable(document.body, { ...shared, licenseKey: 'x' });
new Handsontable(document.body, { ...withSanitizer });
new Handsontable(document.body, { ...chained });
new Handsontable(document.body, { ...remote, ...shared });
new Handsontable(document.body, { ...remote, ...withSanitizer });
new Handsontable(document.body, { ...remote, ...plain });
new Handsontable(document.body, { ...plain });

export function Page({ rows, props }) {
  return (
    <>
      <HotTable {...shared} data={rows} />
      <HotTable {...withSanitizer} data={rows} />
      <HotTable {...shared} {...props} data={rows} />
      <HotTable {...withSanitizer} {...props} data={rows} />
      <HotTable {...plain} {...props} data={rows} />
      <HotTable {...plain} data={rows} />
    </>
  );
}
