import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#exampleFilterDifferentTypes')!;

new Handsontable(container, {
  data: [
    {
      model: 'Racing Socks',
      size: 'S',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
      color: 'Black',
    },
    {
      model: 'HL Mountain Shirt',
      size: 'XS',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
      color: 'White',
    },
    {
      model: 'Cycling Cap',
      size: 'L',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
      color: 'Green',
    },
    {
      model: 'Ski Jacket',
      size: 'M',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
      color: 'Blue',
    },
    {
      model: 'HL Goggles',
      size: 'XL',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '01:23 AM',
      inStock: true,
      color: 'Black',
    },
  ],
  columns: [
    {
      title: 'Model',
      // set the type of the 'Model' column
      type: 'text', // 'text' is the default type, so you can omit this line
      data: 'model',
    },
    {
      title: 'Price',
      // set the type of the 'Price' column
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US',
      },
    },
    {
      title: 'Sold on',
      // set the type of the 'Date' column
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      // set the type of the 'Time' column
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'In stock',
      // set the type of the 'In stock' column
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
    {
      title: 'Size',
      // set the type of the 'Size' column
      type: 'dropdown',
      data: 'size',
      source: ['XS', 'S', 'M', 'L', 'XL'],
      className: 'htCenter',
    },
    {
      title: 'Color',
      // set the type of the 'Size' column
      type: 'autocomplete',
      data: 'color',
      source: ['White', 'Black', 'Yellow', 'Blue', 'Green'],
      className: 'htCenter',
    },
  ],
  // enable filtering
  filters: true,
  // enable the column menu
  dropdownMenu: true,
  height: 175,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
