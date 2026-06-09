import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#exampleExcludeRowsFromFiltering');

new Handsontable(container, {
  data: [
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: '2023-05-03',
      sellTime: '11:27',
      inStock: 11,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: '2023-03-27',
      sellTime: '03:17',
      inStock: 0,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: '2023-08-28',
      sellTime: '08:01',
      inStock: 1,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: '2023-10-02',
      sellTime: '13:23',
      inStock: 3,
    },
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: '2023-10-11',
      sellTime: '01:23',
      inStock: 5,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: '2023-05-03',
      sellTime: '11:27',
      inStock: 22,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: '2023-03-27',
      sellTime: '03:17',
      inStock: 13,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: '2023-08-28',
      sellTime: '08:01',
      inStock: 0,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: '2023-10-02',
      sellTime: '13:23',
      inStock: 14,
    },
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: '2023-10-11',
      sellTime: '01:23',
      inStock: 16,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: '2023-05-03',
      sellTime: '11:27',
      inStock: 18,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: '2023-03-27',
      sellTime: '03:17',
      inStock: 3,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: '2023-08-28',
      sellTime: '08:01',
      inStock: 0,
    },
    {
      brand: 'Vinte',
      model: 'ML Road Frame-W',
      price: 30,
      sellDate: '2023-10-11',
      sellTime: '01:23',
      inStock: 2,
    },
  ],
  columns: [
    {
      title: 'Brand',
      type: 'text',
      data: 'brand',
    },
    {
      title: 'Model',
      type: 'text',
      data: 'model',
    },
    {
      title: 'Price',
      type: 'numeric',
      data: 'price',
      locale: 'en-US',
      numericFormat: {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      },
      className: 'htRight',
    },
    {
      title: 'Date',
      type: 'intl-date',
      data: 'sellDate',
      locale: 'en-US',
      dateFormat: { month: 'short', day: 'numeric', year: 'numeric' },
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'intl-time',
      data: 'sellTime',
      locale: 'en-US',
      timeFormat: { hour: '2-digit', minute: '2-digit', hour12: true },
      className: 'htRight',
    },
    {
      title: 'In stock',
      type: 'numeric',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  height: 200,
  colWidths: [120, 150, 120, 140, 120, 120],
  fixedRowsTop: 1,
  fixedRowsBottom: 1,
  minSpareRows: 1,
  colHeaders: true,
  // enable filtering
  filters: true,
  // enable the column menu
  dropdownMenu: true,
  afterFilter() {
    const filtersPlugin = this.getPlugin('filters');
    const filtersRowsMap = filtersPlugin.filtersRowsMap;

    filtersRowsMap.setValueAtIndex(0, false);
    filtersRowsMap.setValueAtIndex(filtersRowsMap.indexedValues.length - 1, false);
  },
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
