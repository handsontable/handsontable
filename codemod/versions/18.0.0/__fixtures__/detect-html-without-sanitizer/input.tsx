import Handsontable from 'handsontable';
import { HotTable } from '@handsontable/react-wrapper';

const container = document.querySelector<HTMLElement>('#grid')!;

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

new Handsontable(container, {
  ...sharedSettings,
  colHeaders: ['<b>Name</b>'],
});

export const Grid = () => <HotTable colHeaders={['<b>Name</b>']} />;
