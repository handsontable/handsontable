import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

/* start:skip-in-preview */
interface Product {
  companyName: string;
  productName: string;
  sellDate: string;
  inStock: boolean;
  qty: number;
  orderId: string;
  country: string;
}

/* start:skip-in-preview */
const products: Product[] = [
  {
    companyName: 'Hodkiewicz - Hintz',
    productName: 'Rustic Soft Ball',
    sellDate: '05/07/2023',
    inStock: false,
    qty: 82,
    orderId: '16-3974628',
    country: 'United Kingdom',
  },
  {
    companyName: 'Rath LLC',
    productName: 'Small Frozen Tuna',
    sellDate: '31/05/2023',
    inStock: false,
    qty: 459,
    orderId: '77-7839351',
    country: 'Costa Rica',
  },
  {
    companyName: 'Reichert LLC',
    productName: 'Rustic Soft Ball',
    sellDate: '16/03/2023',
    inStock: false,
    qty: 318,
    orderId: '75-6343150',
    country: 'United States of America',
  },
  {
    companyName: 'Kozey Inc',
    productName: 'Sleek Wooden Bacon',
    sellDate: '24/04/2023',
    inStock: true,
    qty: 177,
    orderId: '56-3608689',
    country: 'Pitcairn Islands',
  },
  {
    companyName: 'Nader - Fritsch',
    productName: 'Awesome Wooden Hat',
    sellDate: '29/04/2023',
    inStock: true,
    qty: 51,
    orderId: '58-1204318',
    country: 'Argentina',
  },
  {
    companyName: 'Gerhold - Rowe',
    productName: 'Tasty Frozen Table',
    sellDate: '27/03/2023',
    inStock: false,
    qty: 439,
    orderId: '62-6066132',
    country: 'Senegal',
  },
  {
    companyName: 'Rath LLC',
    productName: 'Awesome Wooden Hat',
    sellDate: '24/11/2022',
    inStock: false,
    qty: 493,
    orderId: '76-7785471',
    country: 'Cyprus',
  },
  {
    companyName: 'Kozey Inc',
    productName: 'Rustic Soft Ball',
    sellDate: '11/08/2023',
    inStock: false,
    qty: 225,
    orderId: '34-3551159',
    country: 'Saint Martin',
  },
  {
    companyName: 'Hodkiewicz - Hintz',
    productName: 'Awesome Wooden Hat',
    sellDate: '07/02/2023',
    inStock: false,
    qty: 261,
    orderId: '77-1112514',
    country: 'Chile',
  },
  {
    companyName: 'Hegmann Inc',
    productName: 'Tasty Frozen Table',
    sellDate: '06/05/2023',
    inStock: false,
    qty: 439,
    orderId: '12-3252385',
    country: 'Switzerland',
  },
  {
    companyName: 'Weber Inc',
    productName: 'Awesome Wooden Hat',
    sellDate: '22/04/2023',
    inStock: true,
    qty: 235,
    orderId: '71-7639998',
    country: 'Brazil',
  },
  {
    companyName: 'Jacobi - Kutch',
    productName: 'Sleek Wooden Bacon',
    sellDate: '13/12/2022',
    inStock: true,
    qty: 163,
    orderId: '68-1588829',
    country: 'Burkina Faso',
  },
  {
    companyName: 'Jenkins LLC',
    productName: 'Small Rubber Shoes',
    sellDate: '26/03/2023',
    inStock: true,
    qty: 8,
    orderId: '61-6324553',
    country: 'Virgin Islands, U.S.',
  },
  {
    companyName: 'Koepp and Sons',
    productName: 'Sleek Wooden Bacon',
    sellDate: '04/05/2023',
    inStock: true,
    qty: 355,
    orderId: '74-6985005',
    country: 'Mozambique',
  },
  {
    companyName: 'Doyle Group',
    productName: 'Awesome Wooden Hat',
    sellDate: '01/08/2023',
    inStock: false,
    qty: 186,
    orderId: '84-4370131',
    country: 'Cocos (Keeling) Islands',
  },
  {
    companyName: 'Rempel - Durgan',
    productName: 'Tasty Frozen Table',
    sellDate: '30/09/2023',
    inStock: false,
    qty: 284,
    orderId: '13-6461825',
    country: 'Monaco',
  },
  {
    companyName: 'Lesch - Jakubowski',
    productName: 'Small Fresh Bacon',
    sellDate: '26/09/2023',
    inStock: true,
    qty: 492,
    orderId: '13-9465439',
    country: 'Iran',
  },
  {
    companyName: 'Jacobi - Kutch',
    productName: 'Rustic Cotton Ball',
    sellDate: '04/05/2023',
    inStock: true,
    qty: 300,
    orderId: '76-5194058',
    country: 'Indonesia',
  },
  {
    companyName: 'Gerhold - Rowe',
    productName: 'Rustic Cotton Ball',
    sellDate: '07/07/2023',
    inStock: true,
    qty: 493,
    orderId: '61-8600792',
    country: 'Norfolk Island',
  },
  {
    companyName: 'Johnston - Wisozk',
    productName: 'Small Fresh Fish',
    sellDate: '14/07/2023',
    inStock: false,
    qty: 304,
    orderId: '10-6007287',
    country: 'Romania',
  },
  {
    companyName: 'Gutkowski Inc',
    productName: 'Small Fresh Bacon',
    sellDate: '10/01/2023',
    inStock: true,
    qty: 375,
    orderId: '25-1164132',
    country: 'Afghanistan',
  },
  {
    companyName: 'Koepp and Sons',
    productName: 'Small Fresh Fish',
    sellDate: '30/03/2023',
    inStock: false,
    qty: 365,
    orderId: '75-7975820',
    country: 'Germany',
  },
  {
    companyName: 'Zboncak and Sons',
    productName: 'Small Fresh Fish',
    sellDate: '17/08/2023',
    inStock: false,
    qty: 308,
    orderId: '59-6251875',
    country: 'Tajikistan',
  },
  {
    companyName: 'Mills Group',
    productName: 'Rustic Soft Ball',
    sellDate: '30/09/2023',
    inStock: false,
    qty: 191,
    orderId: '67-7521441',
    country: 'Puerto Rico',
  },
  {
    companyName: 'Zboncak and Sons',
    productName: 'Awesome Wooden Hat',
    sellDate: '18/03/2023',
    inStock: false,
    qty: 208,
    orderId: '19-4264192',
    country: 'Bolivia',
  },
  {
    companyName: 'Rath LLC',
    productName: 'Rustic Soft Ball',
    sellDate: '14/06/2023',
    inStock: true,
    qty: 191,
    orderId: '78-5742060',
    country: 'Benin',
  },
  {
    companyName: 'Upton - Reichert',
    productName: 'Tasty Frozen Table',
    sellDate: '27/02/2023',
    inStock: false,
    qty: 45,
    orderId: '26-6191298',
    country: 'Tunisia',
  },
  {
    companyName: 'Carroll Group',
    productName: 'Rustic Soft Ball',
    sellDate: '12/12/2022',
    inStock: true,
    qty: 385,
    orderId: '13-7828353',
    country: 'Switzerland',
  },
  {
    companyName: 'Reichel Group',
    productName: 'Small Frozen Tuna',
    sellDate: '12/12/2022',
    inStock: true,
    qty: 117,
    orderId: '67-9643738',
    country: 'Mongolia',
  },
  {
    companyName: 'Kozey Inc',
    productName: 'Rustic Soft Ball',
    sellDate: '24/03/2023',
    inStock: false,
    qty: 335,
    orderId: '78-1331653',
    country: 'Angola',
  },
  {
    companyName: 'Brown LLC',
    productName: 'Small Rubber Shoes',
    sellDate: '13/06/2023',
    inStock: true,
    qty: 305,
    orderId: '63-2315723',
    country: 'Switzerland',
  },
  {
    companyName: 'Weber Inc',
    productName: 'Rustic Cotton Ball',
    sellDate: '07/09/2023',
    inStock: true,
    qty: 409,
    orderId: '53-6782557',
    country: 'Indonesia',
  },
  {
    companyName: 'OReilly LLC',
    productName: 'Tasty Frozen Table',
    sellDate: '18/05/2023',
    inStock: true,
    qty: 318,
    orderId: '91-7787675',
    country: 'Mayotte',
  },
  {
    companyName: 'Weber Inc',
    productName: 'Sleek Wooden Bacon',
    sellDate: '20/04/2023',
    inStock: false,
    qty: 234,
    orderId: '41-3560672',
    country: 'Switzerland',
  },
  {
    companyName: 'Hodkiewicz Inc',
    productName: 'Tasty Frozen Table',
    sellDate: '19/10/2023',
    inStock: true,
    qty: 136,
    orderId: '48-6028776',
    country: 'Peru',
  },
  {
    companyName: 'Lesch and Sons',
    productName: 'Rustic Cotton Ball',
    sellDate: '29/09/2023',
    inStock: false,
    qty: 187,
    orderId: '84-3770456',
    country: 'Central African Republic',
  },
  {
    companyName: 'Pouros - Brakus',
    productName: 'Small Frozen Tuna',
    sellDate: '29/01/2023',
    inStock: false,
    qty: 350,
    orderId: '08-4844950',
    country: 'Isle of Man',
  },
  {
    companyName: 'Batz - Rice',
    productName: 'Small Rubber Shoes',
    sellDate: '06/11/2023',
    inStock: false,
    qty: 252,
    orderId: '88-4899852',
    country: 'Burundi',
  },
  {
    companyName: 'Kub Inc',
    productName: 'Small Fresh Fish',
    sellDate: '05/09/2023',
    inStock: true,
    qty: 306,
    orderId: '06-5022461',
    country: 'Mauritius',
  },
  {
    companyName: 'Hills and Sons',
    productName: 'Small Frozen Tuna',
    sellDate: '07/11/2023',
    inStock: false,
    qty: 435,
    orderId: '99-5539911',
    country: 'Somalia',
  },
  {
    companyName: 'Shanahan - Boyle',
    productName: 'Small Frozen Tuna',
    sellDate: '19/06/2023',
    inStock: true,
    qty: 171,
    orderId: '82-8162453',
    country: 'Virgin Islands, U.S.',
  },
  {
    companyName: 'Luettgen Inc',
    productName: 'Awesome Wooden Hat',
    sellDate: '30/09/2023',
    inStock: false,
    qty: 6,
    orderId: '02-8118250',
    country: 'Colombia',
  },
  {
    companyName: 'Hegmann Inc',
    productName: 'Small Rubber Shoes',
    sellDate: '16/02/2023',
    inStock: true,
    qty: 278,
    orderId: '07-9773343',
    country: 'Central African Republic',
  },
  {
    companyName: 'Kub Inc',
    productName: 'Small Frozen Tuna',
    sellDate: '08/08/2023',
    inStock: false,
    qty: 264,
    orderId: '66-4470479',
    country: 'Norfolk Island',
  },
  {
    companyName: 'Kub Inc',
    productName: 'Tasty Frozen Table',
    sellDate: '06/06/2023',
    inStock: true,
    qty: 494,
    orderId: '13-1175339',
    country: 'Liechtenstein',
  },
  {
    companyName: 'Hahn - Welch',
    productName: 'Small Frozen Tuna',
    sellDate: '12/06/2023',
    inStock: false,
    qty: 485,
    orderId: '32-9127309',
    country: 'Bahrain',
  },
  {
    companyName: 'Nader - Fritsch',
    productName: 'Small Frozen Tuna',
    sellDate: '08/04/2023',
    inStock: true,
    qty: 332,
    orderId: '41-3774568',
    country: 'Montserrat',
  },
  {
    companyName: 'Crona and Sons',
    productName: 'Small Fresh Bacon',
    sellDate: '21/06/2023',
    inStock: true,
    qty: 104,
    orderId: '48-9995090',
    country: 'Syrian Arab Republic',
  },
  {
    companyName: 'Lind Group',
    productName: 'Rustic Cotton Ball',
    sellDate: '17/08/2023',
    inStock: false,
    qty: 51,
    orderId: '68-9599400',
    country: 'Czech Republic',
  },
  {
    companyName: 'Labadie LLC',
    productName: 'Small Fresh Bacon',
    sellDate: '20/04/2023',
    inStock: true,
    qty: 155,
    orderId: '52-4334332',
    country: 'Croatia',
  },
  {
    companyName: 'Doyle Group',
    productName: 'Sleek Wooden Bacon',
    sellDate: '23/07/2023',
    inStock: false,
    qty: 465,
    orderId: '63-8894526',
    country: 'Indonesia',
  },
];

const countries = products.reduce<string[]>((acc, curr) => {
  if (acc.includes(curr.country)) {
    return acc;
  }

  return [...acc, curr.country];
}, []);

/* end:skip-in-preview */

// Get the DOM element with the ID 'example1' where the Handsontable will be rendered
const app = document.getElementById('example1')!;

// Define configuration options for the Handsontable
const hotOptions: Handsontable.GridSettings = {
  data: products,
  height: 464,
  colWidths: [160, 165, 130, 120, 100, 110, 216],
  autoRowSize: true,
  colHeaders: [
    'Company name',
    'Product name',
    'Sell date',
    'In stock',
    'Qty',
    'Order ID',
    'Country',
  ],
  columns: [
    { data: 'companyName', type: 'text' },
    { data: 'productName', type: 'text' },
    {
      data: 'sellDate',
      type: 'date',
      dateFormat: 'DD/MM/YYYY',
      allowInvalid: false,
    },
    {
      data: 'inStock',
      type: 'checkbox',
      className: 'htCenter',
      headerClassName: 'htCenter',
    },
    {
      data: 'qty',
      type: 'numeric',
      headerClassName: 'htRight',
    },
    {
      data: 'orderId',
      type: 'text',
    },
    {
      data: 'country',
      type: 'dropdown',
      source: countries,
    },
  ],
  dropdownMenu: true,
  hiddenColumns: {
    indicators: true,
  },
  contextMenu: true,
  navigableHeaders: true, // New accessibility feature
  tabNavigation: true, // New accessibility feature
  autoWrapRow: true,
  autoWrapCol: true,
  multiColumnSorting: true,
  filters: true,
  rowHeaders: true,
  manualRowMove: true,
  headerClassName: 'htLeft',
  licenseKey: 'non-commercial-and-evaluation',
};

// Initialize the Handsontable instance with the specified configuration options
let hot = new Handsontable(app, hotOptions);

// Helper function to set up checkbox event handling
const setupCheckbox = (
  element: HTMLInputElement,
  callback: (val: boolean) => void
) => element.addEventListener('click', () => callback(element.checked));

// Set up event listeners for various checkboxes to update Handsontable settings.
// This allows us to change the Handsontable settings from the UI, showcasing
// the flexibility of Handsontable in configuring according to your needs.

// Checkbox: Enable/Disable Tab Navigation
setupCheckbox(
  document.querySelector('#enable-tab-navigation') as HTMLInputElement,
  (checked) => {
    hotOptions.tabNavigation = checked;
    hot.updateSettings({
      tabNavigation: hotOptions.tabNavigation,
    });
    console.log(
      'Updated setting: tabNavigation to',
      hot.getSettings().tabNavigation
    );
  }
);

// Checkbox: Enable/Disable Header Navigation
setupCheckbox(
  document.querySelector('#enable-header-navigation') as HTMLInputElement,
  (checked) => {
    hotOptions.navigableHeaders = checked;
    hot.updateSettings({
      navigableHeaders: hotOptions.navigableHeaders,
    });
    console.log(
      'Updated setting: navigableHeaders to',
      hot.getSettings().navigableHeaders
    );
  }
);

// Checkbox: Enable/Disable Cell Virtualization
setupCheckbox(
  document.querySelector('#enable-cell-virtualization') as HTMLInputElement,
  (checked) => {
    hot.destroy();
    hot = new Handsontable(document.getElementById('example1')!, {
      ...hotOptions,
      renderAllRows: !checked,
      renderAllColumns: !checked,
    });
    console.log('Updated virtualization settings:', {
      renderAllRows: hot.getSettings().renderAllRows,
      renderAllColumns: hot.getSettings().renderAllColumns,
    });
  }
);

// Checkbox: Enable/Disable Cell Enter Editing
setupCheckbox(
  document.querySelector('#enable-cell-enter-editing') as HTMLInputElement,
  (checked) => {
    hotOptions.enterBeginsEditing = checked;
    hot.updateSettings({
      enterBeginsEditing: hotOptions.enterBeginsEditing,
    });
    console.log(
      'Updated setting: enable-cell-enter-editing to',
      hot.getSettings().enterBeginsEditing
    );
  }
);

// Checkbox: Enable/Disable Arrow Navigation for First/Last Row
setupCheckbox(
  document.querySelector(
    '#enable-arrow-rl-first-last-column'
  ) as HTMLInputElement,
  (checked) => {
    hotOptions.autoWrapRow = checked;
    hot.updateSettings({
      autoWrapRow: hotOptions.autoWrapRow,
    });
    console.log(
      'Updated setting: autoWrapRow to',
      hot.getSettings().autoWrapRow
    );
  }
);

// Checkbox: Enable/Disable Arrow Navigation for First/Last Column
setupCheckbox(
  document.querySelector(
    '#enable-arrow-td-first-last-column'
  ) as HTMLInputElement,
  (checked) => {
    hotOptions.autoWrapCol = checked;
    hot.updateSettings({
      autoWrapCol: hotOptions.autoWrapCol,
    });
    console.log(
      'Updated setting: autoWrapCol to',
      hot.getSettings().autoWrapCol
    );
  }
);

// Checkbox: Enable/Disable Enter Key Focus for Editing
setupCheckbox(
  document.querySelector('#enable-enter-focus-editing') as HTMLInputElement,
  (checked) => {
    hotOptions.enterMoves = checked ? { col: 0, row: 1 } : { col: 0, row: 0 };
    hot.updateSettings({
      enterMoves: hotOptions.enterMoves,
    });
    console.log('Updated setting: enterMoves to', hot.getSettings().enterMoves);
  }
);
