import Handsontable from 'handsontable';
import { data } from './nestedHeadersData';
import { getThemeNameFromURL } from '../../utils';

const root = document.getElementById('root');
// const removeHeightBtn = document.createElement('button');
// removeHeightBtn.id = 'remove-height-btn';
// removeHeightBtn.textContent = 'Remove Height';
// root.appendChild(removeHeightBtn);
const container = document.createElement('div');
root.appendChild(container);


export function initializeNestedHeadersDemo() {
  const hot = new Handsontable(container, {
    data: data,
    themeName: getThemeNameFromURL(),
    height: 450,
    colHeaders: true,
    nestedHeaders: [
      [
        { label: 'Product', colspan: 4 },
        { label: 'Category', colspan: 3 },
        { label: 'User', colspan: 2 },
        { label: 'System', colspan: 2 },
      ],
      [
        'Product ID',
        'Mobile Apps',
        'Pricing',
        'Rating',
        'Data Type',
        'Industry',
        'Business Scale',
        'User Type',
        'No of Users',
        'Deployment',
        'OS',
      ],
    ],
    collapsibleColumns: true,
    columns: [
      { data: 'product_id', type: 'numeric' },
      { data: 'mobile_apps', type: 'text' },
      { data: 'pricing', type: 'text' },
      { data: 'rating', type: 'numeric' },
      { data: 'dataType', type: 'text' },
      { data: 'industry', type: 'text' },
      { data: 'business_scale', type: 'text' },
      { data: 'user_type', type: 'text' },
      { data: 'no_of_users', type: 'text' },
      { data: 'deployment', type: 'text' },
      { data: 'OS', type: 'text' },
    ],
    mergeCells: true,
    dropdownMenu: true,
    hiddenColumns: {
      indicators: true,
    },
    navigableHeaders: true,
    contextMenu: true,
    multiColumnSorting: true,
    filters: true,
    rowHeaders: true,
    manualRowMove: true,
    comments: true,
    manualColumnMove: true,
    customBorders: true,
    autoWrapCol: true,
    autoWrapRow: true,
    fixedRowsBottom: 2,
    cell: [{ row: 1, col: 1, comment: { value: 'Comments' } }],
    licenseKey: 'non-commercial-and-evaluation',
  });
  hot.selectColumns(2, 3);

  // removeHeightBtn.addEventListener('click', () => {
  //   hot.updateSettings({
  //     height: null,
  //   });
  //   hot.render();
  // });
  console.log(
    `Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`
  );
}
