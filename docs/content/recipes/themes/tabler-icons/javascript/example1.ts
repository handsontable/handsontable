import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { mainTheme, registerTheme } from 'handsontable/themes';

// Register all Handsontable's modules.
registerAllModules();

/* start:skip-in-preview */
// In your project, install `@tabler/icons-webfont` and import its stylesheet instead.
const tablerCss = document.createElement('link');

tablerCss.rel = 'stylesheet';
tablerCss.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.31.0/dist/tabler-icons.min.css';
document.head.appendChild(tablerCss);
/* end:skip-in-preview */

// Every icon slot the grid renders, mapped to a Tabler Icons class list.
const tablerTheme = registerTheme(mainTheme);

tablerTheme.params({
  icons: {
    arrowRight: 'ti ti-chevron-right',
    arrowRightWithBar: 'ti ti-chevron-right-pipe',
    arrowLeft: 'ti ti-chevron-left',
    arrowLeftWithBar: 'ti ti-chevron-left-pipe',
    arrowDown: 'ti ti-chevron-down',
    menu: 'ti ti-menu-2',
    selectArrow: 'ti ti-caret-down-filled',
    arrowNarrowUp: 'ti ti-arrow-narrow-up',
    arrowNarrowDown: 'ti ti-arrow-narrow-down',
    check: 'ti ti-check',
    checkbox: 'ti ti-check',
    caretHiddenLeft: 'ti ti-caret-left-filled',
    caretHiddenRight: 'ti ti-caret-right-filled',
    caretHiddenUp: 'ti ti-caret-up-filled',
    caretHiddenDown: 'ti ti-caret-down-filled',
    collapseOff: 'ti ti-minus',
    collapseOn: 'ti ti-plus',
    radio: 'ti ti-point-filled',
    chipClose: 'ti ti-x',
    search: 'ti ti-search',
    plus: 'ti ti-plus',
    menuList: 'ti ti-list',
  },
});

const container = document.querySelector('#example1')!;

new Handsontable(container, {
  // The mapping applies only when the theme is passed as an object.
  theme: tablerTheme,
  data: [
    { product: 'Standing desk', category: 'Furniture', inStock: true, units: 24 },
    { product: 'Monitor arm', category: 'Accessories', inStock: true, units: 61 },
    { product: 'Ergonomic chair', category: 'Furniture', inStock: false, units: 0 },
    { product: 'USB-C dock', category: 'Electronics', inStock: true, units: 138 },
    { product: 'Desk lamp', category: 'Lighting', inStock: true, units: 45 },
    { product: 'Cable tray', category: 'Accessories', inStock: false, units: 0 },
  ],
  columns: [
    { data: 'product' },
    { data: 'category', type: 'dropdown', source: ['Furniture', 'Accessories', 'Electronics', 'Lighting'] },
    { data: 'inStock', type: 'checkbox' },
    { data: 'units', type: 'numeric' },
  ],
  colHeaders: ['Product', 'Category', 'In stock', 'Units'],
  rowHeaders: true,
  columnSorting: true,
  dropdownMenu: true,
  filters: true,
  hiddenColumns: { indicators: true },
  height: 260,
  licenseKey: 'non-commercial-and-evaluation',
});
