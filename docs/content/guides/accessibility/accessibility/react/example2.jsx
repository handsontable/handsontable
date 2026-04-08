import { useState } from 'react';
import { HotTable, HotColumn } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

/* start:skip-in-preview */
const data = [
  {
    companyName: 'Hodkiewicz - Hintz',
    productName: 'Rustic Soft Ball',
    sellDate: '2023-07-05',
    inStock: false,
    qty: 82,
    orderId: '16-3974628',
    country: 'United Kingdom',
  },
  {
    companyName: 'Rath LLC',
    productName: 'Small Frozen Tuna',
    sellDate: '2023-05-31',
    inStock: false,
    qty: 459,
    orderId: '77-7839351',
    country: 'Costa Rica',
  },
  {
    companyName: 'Reichert LLC',
    productName: 'Rustic Soft Ball',
    sellDate: '2023-03-16',
    inStock: false,
    qty: 318,
    orderId: '75-6343150',
    country: 'United States of America',
  },
  {
    companyName: 'Kozey Inc',
    productName: 'Sleek Wooden Bacon',
    sellDate: '2023-04-24',
    inStock: true,
    qty: 177,
    orderId: '56-3608689',
    country: 'Pitcairn Islands',
  },
  {
    companyName: 'Nader - Fritsch',
    productName: 'Awesome Wooden Hat',
    sellDate: '2023-04-29',
    inStock: true,
    qty: 51,
    orderId: '58-1204318',
    country: 'Argentina',
  },
  {
    companyName: 'Gerhold - Rowe',
    productName: 'Tasty Frozen Table',
    sellDate: '2023-03-27',
    inStock: false,
    qty: 439,
    orderId: '62-6066132',
    country: 'Senegal',
  },
  {
    companyName: 'Rath LLC',
    productName: 'Awesome Wooden Hat',
    sellDate: '2022-11-24',
    inStock: false,
    qty: 493,
    orderId: '76-7785471',
    country: 'Cyprus',
  },
  {
    companyName: 'Kozey Inc',
    productName: 'Rustic Soft Ball',
    sellDate: '2023-08-11',
    inStock: false,
    qty: 225,
    orderId: '34-3551159',
    country: 'Saint Martin',
  },
  {
    companyName: 'Hodkiewicz - Hintz',
    productName: 'Awesome Wooden Hat',
    sellDate: '2023-02-07',
    inStock: false,
    qty: 261,
    orderId: '77-1112514',
    country: 'Chile',
  },
  {
    companyName: 'Hegmann Inc',
    productName: 'Tasty Frozen Table',
    sellDate: '2023-05-06',
    inStock: false,
    qty: 439,
    orderId: '12-3252385',
    country: 'Switzerland',
  },
  {
    companyName: 'Weber Inc',
    productName: 'Awesome Wooden Hat',
    sellDate: '2023-04-22',
    inStock: true,
    qty: 235,
    orderId: '71-7639998',
    country: 'Brazil',
  },
  {
    companyName: 'Jacobi - Kutch',
    productName: 'Sleek Wooden Bacon',
    sellDate: '2022-12-13',
    inStock: true,
    qty: 163,
    orderId: '68-1588829',
    country: 'Burkina Faso',
  },
  {
    companyName: 'Jenkins LLC',
    productName: 'Small Rubber Shoes',
    sellDate: '2023-03-26',
    inStock: true,
    qty: 8,
    orderId: '61-6324553',
    country: 'Virgin Islands, U.S.',
  },
  {
    companyName: 'Koepp and Sons',
    productName: 'Sleek Wooden Bacon',
    sellDate: '2023-05-04',
    inStock: true,
    qty: 355,
    orderId: '74-6985005',
    country: 'Mozambique',
  },
  {
    companyName: 'Doyle Group',
    productName: 'Awesome Wooden Hat',
    sellDate: '2023-08-01',
    inStock: false,
    qty: 186,
    orderId: '84-4370131',
    country: 'Cocos (Keeling) Islands',
  },
  {
    companyName: 'Rempel - Durgan',
    productName: 'Tasty Frozen Table',
    sellDate: '2023-09-30',
    inStock: false,
    qty: 284,
    orderId: '13-6461825',
    country: 'Monaco',
  },
  {
    companyName: 'Lesch - Jakubowski',
    productName: 'Small Fresh Bacon',
    sellDate: '2023-09-26',
    inStock: true,
    qty: 492,
    orderId: '13-9465439',
    country: 'Iran',
  },
  {
    companyName: 'Jacobi - Kutch',
    productName: 'Rustic Cotton Ball',
    sellDate: '2023-05-04',
    inStock: true,
    qty: 300,
    orderId: '76-5194058',
    country: 'Indonesia',
  },
  {
    companyName: 'Gerhold - Rowe',
    productName: 'Rustic Cotton Ball',
    sellDate: '2023-07-07',
    inStock: true,
    qty: 493,
    orderId: '61-8600792',
    country: 'Norfolk Island',
  },
  {
    companyName: 'Johnston - Wisozk',
    productName: 'Small Fresh Fish',
    sellDate: '2023-07-14',
    inStock: false,
    qty: 304,
    orderId: '10-6007287',
    country: 'Romania',
  },
  {
    companyName: 'Gutkowski Inc',
    productName: 'Small Fresh Bacon',
    sellDate: '2023-01-10',
    inStock: true,
    qty: 375,
    orderId: '25-1164132',
    country: 'Afghanistan',
  },
  {
    companyName: 'Koepp and Sons',
    productName: 'Small Fresh Fish',
    sellDate: '2023-03-30',
    inStock: false,
    qty: 365,
    orderId: '75-7975820',
    country: 'Germany',
  },
  {
    companyName: 'Zboncak and Sons',
    productName: 'Small Fresh Fish',
    sellDate: '2023-08-17',
    inStock: false,
    qty: 308,
    orderId: '59-6251875',
    country: 'Tajikistan',
  },
  {
    companyName: 'Mills Group',
    productName: 'Rustic Soft Ball',
    sellDate: '2023-09-30',
    inStock: false,
    qty: 191,
    orderId: '67-7521441',
    country: 'Puerto Rico',
  },
  {
    companyName: 'Zboncak and Sons',
    productName: 'Awesome Wooden Hat',
    sellDate: '2023-03-18',
    inStock: false,
    qty: 208,
    orderId: '19-4264192',
    country: 'Bolivia',
  },
  {
    companyName: 'Rath LLC',
    productName: 'Rustic Soft Ball',
    sellDate: '2023-06-14',
    inStock: true,
    qty: 191,
    orderId: '78-5742060',
    country: 'Benin',
  },
  {
    companyName: 'Upton - Reichert',
    productName: 'Tasty Frozen Table',
    sellDate: '2023-02-27',
    inStock: false,
    qty: 45,
    orderId: '26-6191298',
    country: 'Tunisia',
  },
  {
    companyName: 'Carroll Group',
    productName: 'Rustic Soft Ball',
    sellDate: '2022-12-12',
    inStock: true,
    qty: 385,
    orderId: '13-7828353',
    country: 'Switzerland',
  },
  {
    companyName: 'Reichel Group',
    productName: 'Small Frozen Tuna',
    sellDate: '2022-12-12',
    inStock: true,
    qty: 117,
    orderId: '67-9643738',
    country: 'Mongolia',
  },
  {
    companyName: 'Kozey Inc',
    productName: 'Rustic Soft Ball',
    sellDate: '2023-03-24',
    inStock: false,
    qty: 335,
    orderId: '78-1331653',
    country: 'Angola',
  },
  {
    companyName: 'Brown LLC',
    productName: 'Small Rubber Shoes',
    sellDate: '2023-06-13',
    inStock: true,
    qty: 305,
    orderId: '63-2315723',
    country: 'Switzerland',
  },
  {
    companyName: 'Weber Inc',
    productName: 'Rustic Cotton Ball',
    sellDate: '2023-09-07',
    inStock: true,
    qty: 409,
    orderId: '53-6782557',
    country: 'Indonesia',
  },
  {
    companyName: 'OReilly LLC',
    productName: 'Tasty Frozen Table',
    sellDate: '2023-05-18',
    inStock: true,
    qty: 318,
    orderId: '91-7787675',
    country: 'Mayotte',
  },
  {
    companyName: 'Weber Inc',
    productName: 'Sleek Wooden Bacon',
    sellDate: '2023-04-20',
    inStock: false,
    qty: 234,
    orderId: '41-3560672',
    country: 'Switzerland',
  },
  {
    companyName: 'Hodkiewicz Inc',
    productName: 'Tasty Frozen Table',
    sellDate: '2023-10-19',
    inStock: true,
    qty: 136,
    orderId: '48-6028776',
    country: 'Peru',
  },
  {
    companyName: 'Lesch and Sons',
    productName: 'Rustic Cotton Ball',
    sellDate: '2023-09-29',
    inStock: false,
    qty: 187,
    orderId: '84-3770456',
    country: 'Central African Republic',
  },
  {
    companyName: 'Pouros - Brakus',
    productName: 'Small Frozen Tuna',
    sellDate: '2023-01-29',
    inStock: false,
    qty: 350,
    orderId: '08-4844950',
    country: 'Isle of Man',
  },
  {
    companyName: 'Batz - Rice',
    productName: 'Small Rubber Shoes',
    sellDate: '2023-11-06',
    inStock: false,
    qty: 252,
    orderId: '88-4899852',
    country: 'Burundi',
  },
  {
    companyName: 'Kub Inc',
    productName: 'Small Fresh Fish',
    sellDate: '2023-09-05',
    inStock: true,
    qty: 306,
    orderId: '06-5022461',
    country: 'Mauritius',
  },
  {
    companyName: 'Hills and Sons',
    productName: 'Small Frozen Tuna',
    sellDate: '2023-11-07',
    inStock: false,
    qty: 435,
    orderId: '99-5539911',
    country: 'Somalia',
  },
  {
    companyName: 'Shanahan - Boyle',
    productName: 'Small Frozen Tuna',
    sellDate: '2023-06-19',
    inStock: true,
    qty: 171,
    orderId: '82-8162453',
    country: 'Virgin Islands, U.S.',
  },
  {
    companyName: 'Luettgen Inc',
    productName: 'Awesome Wooden Hat',
    sellDate: '2023-09-30',
    inStock: false,
    qty: 6,
    orderId: '02-8118250',
    country: 'Colombia',
  },
  {
    companyName: 'Hegmann Inc',
    productName: 'Small Rubber Shoes',
    sellDate: '2023-02-16',
    inStock: true,
    qty: 278,
    orderId: '07-9773343',
    country: 'Central African Republic',
  },
  {
    companyName: 'Kub Inc',
    productName: 'Small Frozen Tuna',
    sellDate: '2023-08-08',
    inStock: false,
    qty: 264,
    orderId: '66-4470479',
    country: 'Norfolk Island',
  },
  {
    companyName: 'Kub Inc',
    productName: 'Tasty Frozen Table',
    sellDate: '2023-06-06',
    inStock: true,
    qty: 494,
    orderId: '13-1175339',
    country: 'Liechtenstein',
  },
  {
    companyName: 'Hahn - Welch',
    productName: 'Small Frozen Tuna',
    sellDate: '2023-06-12',
    inStock: false,
    qty: 485,
    orderId: '32-9127309',
    country: 'Bahrain',
  },
  {
    companyName: 'Nader - Fritsch',
    productName: 'Small Frozen Tuna',
    sellDate: '2023-04-08',
    inStock: true,
    qty: 332,
    orderId: '41-3774568',
    country: 'Montserrat',
  },
  {
    companyName: 'Crona and Sons',
    productName: 'Small Fresh Bacon',
    sellDate: '2023-06-21',
    inStock: true,
    qty: 104,
    orderId: '48-9995090',
    country: 'Syrian Arab Republic',
  },
  {
    companyName: 'Lind Group',
    productName: 'Rustic Cotton Ball',
    sellDate: '2023-08-17',
    inStock: false,
    qty: 51,
    orderId: '68-9599400',
    country: 'Czech Republic',
  },
  {
    companyName: 'Labadie LLC',
    productName: 'Small Fresh Bacon',
    sellDate: '2023-04-20',
    inStock: true,
    qty: 155,
    orderId: '52-4334332',
    country: 'Croatia',
  },
  {
    companyName: 'Doyle Group',
    productName: 'Sleek Wooden Bacon',
    sellDate: '2023-07-23',
    inStock: false,
    qty: 465,
    orderId: '63-8894526',
    country: 'Indonesia',
  },
];

const countries = data.reduce((acc, curr) => {
  if (acc.includes(curr.country)) {
    return acc;
  }

  return [...acc, curr.country];
}, []);

/* end:skip-in-preview */
// Handsontable options
const hotOptions = {
  data,
  height: 464,
  colWidths: [160, 165, 130, 120, 100, 110, 216],
  autoRowSize: true,
  colHeaders: ['Company name', 'Product name', 'Sell date', 'In stock', 'Qty', 'Order ID', 'Country'],
  dropdownMenu: true,
  hiddenColumns: {
    indicators: true,
  },
  multiColumnSorting: true,
  filters: true,
  rowHeaders: true,
  manualRowMove: true,
  licenseKey: 'non-commercial-and-evaluation',
};

const ExampleComponent = () => {
  const [toggleableOptions, setToggleableOptions] = useState({
    tabNavigation: true,
    navigableHeaders: true,
    renderAllRows: false,
    renderAllColumns: false,
    enterBeginsEditing: true,
    autoWrapRow: true,
    autoWrapCol: true,
    headerClassName: 'htLeft',
    enterMoves: { col: 0, row: 1 },
  });

  return (
    <div className="example-container">
      {/* DemoOptions component for changing Handsontable options */}
      <DemoOptions changeToggleOptions={setToggleableOptions} {...toggleableOptions} />

      <input className="placeholder-input" type="text" placeholder="Focusable text input" />

      {/* Handsontable component with dynamic options */}
      <HotTable
        // Handsontable needs to reload when changing virtualization
        // by changing the key, we force the component to reload
        key={String(toggleableOptions.renderAllRows)}
        {...hotOptions}
        // Pass in the options which can change for demo
        {...toggleableOptions}
      >
        {/* Define HotColumns for the data */}
        <HotColumn data="companyName" type="text" />
        <HotColumn data="productName" type="text" />
        <HotColumn
          data="sellDate"
          locale="en-GB"
          dateFormat={{ day: '2-digit', month: '2-digit', year: 'numeric' }}
          type="intl-date"
        />
        <HotColumn data="inStock" type="checkbox" className="htCenter" headerClassName="htCenter" />
        <HotColumn data="qty" type="numeric" headerClassName="htRight" />
        <HotColumn data="orderId" type="text" />
        <HotColumn data="country" type="dropdown" source={countries} />
      </HotTable>
      <input className="placeholder-input" type="text" placeholder="Focusable text input" />
    </div>
  );
};

// Demo Options allows you to change the Handsontable options
// This allows us to change the Handsontable settings from the UI, showcasing
// the flexibility of Handsontable in configuring according to your needs.
function DemoOptions({
  tabNavigation,
  navigableHeaders,
  renderAllRows,
  renderAllColumns,
  enterBeginsEditing,
  autoWrapRow,
  autoWrapCol,
  enterMoves,
  changeToggleOptions,
}) {
  // on checkbox change, update handsontable option
  const handleCheckboxChange = (checkboxName) => {
    switch (checkboxName) {
      case 'enable-tab-navigation':
        changeToggleOptions((existing) => ({
          ...existing,
          tabNavigation: !tabNavigation,
        }));

        break;
      case 'enable-header-navigation':
        changeToggleOptions((existing) => ({
          ...existing,
          navigableHeaders: !navigableHeaders,
        }));

        break;
      case 'enable-cell-virtualization':
        changeToggleOptions((existing) => ({
          ...existing,
          renderAllRows: !renderAllRows,
          renderAllColumns: !renderAllColumns,
        }));

        break;
      case 'enable-cell-enter-editing':
        changeToggleOptions((existing) => ({
          ...existing,
          enterBeginsEditing: !enterBeginsEditing,
        }));

        break;
      case 'enable-arrow-rl-first-last-column':
        changeToggleOptions((existing) => ({
          ...existing,
          autoWrapRow: !autoWrapRow,
        }));

        break;
      case 'enable-arrow-td-first-last-column':
        changeToggleOptions((existing) => ({
          ...existing,
          autoWrapCol: !autoWrapCol,
        }));

        break;
      case 'enable-enter-focus-editing':
        changeToggleOptions((existing) => ({
          ...existing,
          enterMoves: enterMoves.row !== 1 ? { col: 0, row: 1 } : { col: 0, row: 0 },
        }));

        break;
      default:
        break;
    }
  };

  return (
    <>
      <div className="checkbox-container">
          <div>
            <label className="option-label" htmlFor="enable-tab-navigation" id="tab-navigation-label">
              <input
                checked={tabNavigation}
                type="checkbox"
                id="enable-tab-navigation"
                name="enable-tab-navigation"
                aria-label="Enable navigation with the Tab key"
                onChange={() => handleCheckboxChange('enable-tab-navigation')}
              />
              Enable navigation with the Tab key
            </label>
            <a
              href="https://handsontable.com/docs/react-data-grid/api/options/#tabnavigation"
              target="_blank"
              className="external-link"
              rel="noopener noreferrer"
              aria-label="Learn more enabling/disabling tab navigation (opens in a new window)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" x="0px" y="0px" viewBox="0 0 100 100" width="15" height="15" className="icon outbound">
                <path fill="currentColor" d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z" />
                <polygon fill="currentColor" points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9" />
              </svg>
            </a>
          </div>
          <div>
            <label className="option-label" htmlFor="enable-header-navigation" id="header-navigation-label">
              <input
                checked={navigableHeaders}
                type="checkbox"
                id="enable-header-navigation"
                name="enable-header-navigation"
                aria-labelledby="header-navigation-label"
                onChange={() => handleCheckboxChange('enable-header-navigation')}
              />
              Enable navigation across headers
            </label>
            <a
              href="https://handsontable.com/docs/react-data-grid/api/options/#navigableheaders"
              target="_blank"
              className="external-link"
              rel="noopener noreferrer"
              aria-label="Learn more about enabling/disabling tab navigation across headers (opens in a new window)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" x="0px" y="0px" viewBox="0 0 100 100" width="15" height="15" className="icon outbound">
                <path fill="currentColor" d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z" />
                <polygon fill="currentColor" points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9" />
              </svg>
            </a>
          </div>
          <div>
            <label className="option-label" htmlFor="enable-cell-virtualization" id="cell-virtualization-label">
              <input
                checked={!renderAllRows}
                type="checkbox"
                id="enable-cell-virtualization"
                name="enable-cell-virtualization"
                aria-labelledby="cell-virtualization-label"
                onChange={() => handleCheckboxChange('enable-cell-virtualization')}
              />
              Enable cells virtualization
            </label>
            <a
              href="https://handsontable.com/docs/react-data-grid/api/options/#renderAllRows"
              target="_blank"
              className="external-link"
              rel="noopener noreferrer"
              aria-label="Learn more about row virtualization (opens in a new window)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" x="0px" y="0px" viewBox="0 0 100 100" width="15" height="15" className="icon outbound">
                <path fill="currentColor" d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z" />
                <polygon fill="currentColor" points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9" />
              </svg>
            </a>
          </div>
          <div>
            <label className="option-label" htmlFor="enable-cell-enter-editing" id="cell-enter-editing-label">
              <input
                checked={enterBeginsEditing}
                type="checkbox"
                id="enable-cell-enter-editing"
                name="enable-cell-enter-editing"
                aria-labelledby="cell-enter-editing-label"
                onChange={() => handleCheckboxChange('enable-cell-enter-editing')}
              />
              The Enter key begins cell editing
            </label>
            <a
              href="https://handsontable.com/docs/react-data-grid/api/options/#enterbeginsediting"
              target="_blank"
              className="external-link"
              rel="noopener noreferrer"
              aria-label="Learn more about Enter key cell editing (opens in a new window)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" x="0px" y="0px" viewBox="0 0 100 100" width="15" height="15" className="icon outbound">
                <path fill="currentColor" d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z" />
                <polygon fill="currentColor" points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9" />
              </svg>
            </a>
          </div>
          <div>
            <label className="option-label" htmlFor="enable-arrow-rl-first-last-column" id="arrow-rl-first-last-column-label">
              <input
                checked={autoWrapRow}
                type="checkbox"
                id="enable-arrow-rl-first-last-column"
                name="enableArrowFirstLastColumn"
                aria-labelledby="arrow-rl-first-last-column-label"
                onChange={() => handleCheckboxChange('enable-arrow-rl-first-last-column')}
              />
              The right/left arrow keys move the focus to the first/last column
            </label>
            <a
              href="https://handsontable.com/docs/react-data-grid/api/options/#autowrapcol"
              target="_blank"
              className="external-link"
              rel="noopener noreferrer"
              aria-label="Learn more about right/left arrow key behavior (opens in a new window)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" x="0px" y="0px" viewBox="0 0 100 100" width="15" height="15" className="icon outbound">
                <path fill="currentColor" d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z" />
                <polygon fill="currentColor" points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9" />
              </svg>
            </a>
          </div>
          <div>
            <label className="option-label" htmlFor="enable-arrow-td-first-last-column" id="arrow-td-first-last-column-label">
              <input
                checked={autoWrapCol}
                type="checkbox"
                id="enable-arrow-td-first-last-column"
                name="enable-arrow-td-first-last-column"
                aria-labelledby="arrow-td-first-last-column-label"
                onChange={() => handleCheckboxChange('enable-arrow-td-first-last-column')}
              />
              The up/down arrow keys move the focus to the first/last row
            </label>
            <a
              href="https://handsontable.com/docs/react-data-grid/api/options/#autowraprow"
              target="_blank"
              className="external-link"
              rel="noopener noreferrer"
              aria-label="Learn more about up/down arrow key behavior (opens in a new window)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" x="0px" y="0px" viewBox="0 0 100 100" width="15" height="15" className="icon outbound">
                <path fill="currentColor" d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z" />
                <polygon fill="currentColor" points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9" />
              </svg>
            </a>
          </div>
          <div>
            <label className="option-label" htmlFor="enable-enter-focus-editing" id="enter-focus-editing-label">
              <input
                checked={enterMoves.row !== 0}
                type="checkbox"
                id="enable-enter-focus-editing"
                name="enable-enter-focus-editing"
                aria-labelledby="enter-focus-editing-label"
                onChange={() => handleCheckboxChange('enable-enter-focus-editing')}
              />
              The Enter key moves the focus after cell edition
            </label>
            <a
              href="https://handsontable.com/docs/react-data-grid/api/options/#entermoves"
              target="_blank"
              className="external-link"
              rel="noopener noreferrer"
              aria-label="Learn more about Enter key focus behavior (opens in a new window)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" x="0px" y="0px" viewBox="0 0 100 100" width="15" height="15" className="icon outbound">
                <path fill="currentColor" d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z" />
                <polygon fill="currentColor" points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9" />
              </svg>
            </a>
          </div>
      </div>
    </>
  );
}

export default ExampleComponent;
