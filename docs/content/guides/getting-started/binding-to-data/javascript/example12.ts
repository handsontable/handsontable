import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example12')!;
const sourceRows: Array<{ id: number; name: string; city: string }> = [
  { id: 1, name: 'Alice', city: 'London' },
  { id: 2, name: 'Bob', city: 'Paris' },
  { id: 3, name: 'Charlie', city: 'Berlin' },
  { id: 4, name: 'Diana', city: 'Warsaw' },
];

new Handsontable(container, {
  dataProvider: async(queryParameters, { signal }) => {
    const { page, pageSize } = queryParameters;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, 200);

      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new Error('Request aborted'));
      });
    });

    return {
      rows: sourceRows.slice(start, end),
      totalRows: sourceRows.length,
    };
  },
  rowId: 'id',
  colHeaders: ['ID', 'Name', 'City'],
  columns: [
    { data: 'id' },
    { data: 'name' },
    { data: 'city' },
  ],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
