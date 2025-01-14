import Handsontable from 'handsontable';
import { data } from './complexData';
import { getThemeNameFromURL, getDirectionFromURL } from '../../utils';

const root = document.getElementById('root');
const container = document.createElement('div');

root.appendChild(container);

export function initializeComplexDemo() {
  new Handsontable(container, {
    data,
    themeName: getThemeNameFromURL(),
    layoutDirection: getDirectionFromURL(),
    columns: [
      {
        data: 'isActive',
        type: 'checkbox',
        label: {
          position: 'after',
          property: 'isActive',
        },
      },
      { data: 'name' },
      { data: 'password', type: 'password' },
      { data: 'age', type: 'numeric' },
      {
        data: 'interest',
        editor: 'select',
        selectOptions: [
          'Electronics',
          'Fashion',
          'Tech Gadgets',
          'Home Decor',
          'Sports & Fitness',
          'Books & Literature',
          'Beauty & Personal Care',
          'Food & Cooking',
          'Travel & Adventure',
          'Art & Collectibles',
        ],
      },
      {
        data: 'favoriteProduct',
        type: 'handsontable',
        handsontable: {
          colHeaders: ['Name', 'Category', 'Price'],
          autoColumnSize: true,
          data: [
            ['iPhone 13 Pro', 'Smartphone', 999.99],
            ['MacBook Air', 'Laptop', 1099.99],
            ['Apple Watch Series 7', 'Smartwatch', 399.99],
            ['iPad Pro', 'Tablet', 799.99],
            ['Fitbit Charge 5', 'Fitness Tracker', 149.95],
            ['Urban Decay Makeup Set', 'Makeup Set', 49.0],
            ['Osprey Farpoint 40 Travel Backpack', 'Travel Backpack', 160.0],
            ['Starry Night by Vincent van Gogh Reproduction', 'Artwork', 120.0],
            ['Samsung Galaxy S21', 'Smartphone', 799.99],
            ['Louis Vuitton MM Monogram Canvas', 'Handbag', 1490.0],
            ['Apple AirPods Pro', 'Wireless Earbuds', 249.0],
            ['Philips Hue Smart Bulb', 'Smart Home', 149.99],
            ['Manduka PRO Yoga Mat', 'Yoga Accessories', 120.0],
            ['Estée Lauder Skincare Set', 'Skincare Set', 99.0],
            ['The Great Gatsby by F. Scott Fitzgerald', 'Book', 9.99],
          ],
          getValue() {
            const selection = this.getSelectedLast();

            // Get the manufacturer name of the clicked row and ignore header
            // coordinates (negative values)
            return this.getDataAtCell(selection[0], selection[1]);
          },
        },
      },
      {
        data: 'country',
        type: 'autocomplete',
        source: [
          'USA',
          'Canada',
          'UK',
          'Australia',
          'Spain',
          'Japan',
          'Brazil',
          'South Korea',
          'Mexico',
        ],
        strict: true,
        allowInvalid: true,
      },
      {
        data: 'city',
        type: 'dropdown',
        source: [
          'New York',
          'Toronto',
          'London',
          'Sydney',
          'Los Angeles',
          'Barcelona',
          'Tokyo',
          'Manchester',
          'Sao Paulo',
          'Miami',
          'Madrid',
          'Seoul',
          'Vancouver',
          'Valencia',
          'Chicago',
          'Mexico City',
          'Houston',
        ],
      },
      {
        data: 'lastLoginDate',
        type: 'date',
        dateFormat: 'YYYY-MM-DD',
        correctFormat: true,
        defaultDate: '01-01-1900',
        // datePicker additional options
        // (see https://github.com/dbushell/Pikaday#configuration)
        datePickerConfig: {
          // First day of the week (0: Sunday, 1: Monday, etc)
          firstDay: 1,
          showWeekNumber: true,
          disableDayFn(date) {
            // Disable Sunday and Saturday
            return date.getDay() === 0 || date.getDay() === 6;
          },
        },
      },
      { data: 'lastLoginTime', type: 'time' },
      {},
    ],
    colHeaders: true,
    nestedHeaders: [
      ['A', { label: 'B', colspan: 8 }, 'C'],
      ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
      [
        'H',
        { label: 'I', colspan: 2 },
        { label: 'J', colspan: 2 },
        { label: 'K', colspan: 2 },
        { label: 'L', colspan: 2 },
        'M',
      ],
      [
        'Active',
        'Name',
        'Password',
        'Age',
        'Interest',
        'Favorite Product',
        'Country',
        'City',
        'Last Login (date)',
        'Last Login (time)',
        '(empty)',
      ],
    ],
    mergeCells: [{ row: 1, col: 4, rowspan: 2, colspan: 2 }],
    nestedRows: true,
    fixedRowsTop: 1,
    fixedRowsBottom: 1,
    fixedColumnsStart: 1,
    collapsibleColumns: true,
    filters: true,
    dropdownMenu: true,
    contextMenu: true,
    hiddenColumns: {
      indicators: true,
    },
    hiddenRows: {
      indicators: true,
    },
    comments: true,
    cell: [{ row: 1, col: 1, comment: { value: 'Hello world!' } }],
    multiColumnSorting: true,
    manualColumnMove: true,
    manualColumnResize: true,
    manualRowMove: true,
    manualRowResize: true,
    autoWrapRow: true,
    rowHeaders: true,
    navigableHeaders: true,
    licenseKey: 'non-commercial-and-evaluation',
  });

  console.log(
    `Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`
  );
}
