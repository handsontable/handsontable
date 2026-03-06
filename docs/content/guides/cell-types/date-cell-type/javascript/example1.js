import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example1');
const localeSelect = document.querySelector('#localeSelect');
const data = [
  {
    car: 'Mercedes A 160',
    product_date: '2002-06-15',
    payment_date: '2002-05-20',
    registration_date: '2002-07-01',
  },
  {
    car: 'Citroën C4 Coupe',
    product_date: '2007-03-22',
    payment_date: '2007-02-28',
    registration_date: '2007-04-10',
  },
  {
    car: 'Audi A4 Avant',
    product_date: '2011-09-08',
    payment_date: '2011-08-15',
    registration_date: '2011-09-20',
  },
  {
    car: 'Opel Astra',
    product_date: '2012-01-30',
    payment_date: '2012-01-10',
    registration_date: '2012-02-14',
  },
  {
    car: 'BMW 320i Coupe',
    product_date: '2004-11-12',
    payment_date: '2004-10-20',
    registration_date: '2004-12-01',
  },
];

const hot = new Handsontable(container, {
  data,
  colHeaders: ['Car', 'Product date', 'Payment date', 'Registration date'],
  columns: [
    {
      type: 'text',
      data: 'car',
    },
    {
      type: 'intl-date',
      data: 'product_date',
      dateFormat: {
        dateStyle: 'short',
      },
    },
    {
      type: 'intl-date',
      data: 'payment_date',
      dateFormat: {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      },
    },
    {
      type: 'intl-date',
      data: 'registration_date',
      dateFormat: {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    },
  ],
  columnSorting: true,
  filters: true,
  dropdownMenu: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  autoWrapRow: true,
  autoWrapCol: true,
});

// Handle locale change
localeSelect.addEventListener('change', (event) => {
  hot.updateSettings({
    locale: event.target.value,
  });
});
