import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const container = document.getElementById('example3')!;

const hot = new Handsontable(container, {
  themeName: 'ht-theme-main',
  data: [],
  colHeaders: true,
  rowHeaders: true,
  columns: [
    {
      title: 'Model',
      type: 'text',
      data: 'model',
      width: 150,
      headerClassName: 'htLeft',
    },
    {
      title: 'Price',
      type: 'numeric',
      data: 'price',
      width: 80,
      numericFormat: {
        pattern: '$0,0.00',
        culture: 'en-US',
      },
      className: 'htRight',
      headerClassName: 'htRight',
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      width: 130,
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
      headerClassName: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      width: 90,
      timeFormat: 'hh:mm A',
      correctFormat: true,
      className: 'htRight',
      headerClassName: 'htRight',
    },
    {
      title: 'In stock',
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
      headerClassName: 'htCenter',
    },
  ],
  width: '100%',
  height: 300,
  stretchH: 'all',
  loading: true,
  licenseKey: 'non-commercial-and-evaluation',
});

// Get loading plugin instance
const loadingPlugin = hot.getPlugin('loading');

const loadDataButton = document.getElementById('loadData') as HTMLButtonElement;

// Simulate data loading
async function loadData(): Promise<void> {
  // Show loading dialog
  loadingPlugin.show();
  loadDataButton.disabled = true;

  try {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Simulated data
    const data = [
      { model: 'Trail Helmet', price: 1298.14, sellDate: 'Aug 31, 2025', sellTime: '02:12 PM', inStock: true },
      { model: 'Windbreaker Jacket', price: 178.9, sellDate: 'May 10, 2025', sellTime: '10:26 PM', inStock: false },
      { model: 'Cycling Cap', price: 288.1, sellDate: 'Sep 15, 2025', sellTime: '09:37 AM', inStock: true },
      { model: 'HL Mountain Frame', price: 94.49, sellDate: 'Jan 17, 2025', sellTime: '02:19 PM', inStock: false },
      { model: 'Racing Socks', price: 430.38, sellDate: 'May 10, 2025', sellTime: '01:42 PM', inStock: true },
      { model: 'Racing Socks', price: 138.85, sellDate: 'Sep 20, 2025', sellTime: '02:48 PM', inStock: true },
      { model: 'HL Mountain Frame', price: 1909.63, sellDate: 'Sep 5, 2025', sellTime: '09:35 AM', inStock: false },
      { model: 'Carbon Handlebar', price: 1080.7, sellDate: 'Oct 24, 2025', sellTime: '10:58 PM', inStock: false },
      { model: 'Aero Bottle', price: 1571.13, sellDate: 'May 24, 2025', sellTime: '12:24 AM', inStock: true },
      { model: 'Windbreaker Jacket', price: 919.09, sellDate: 'Jul 16, 2025', sellTime: '07:11 PM', inStock: true },
    ];
  
    // Load data into the table
    hot.loadData(data);

    // Hide loading dialog
    loadingPlugin.hide();
    loadDataButton.disabled = false;
    loadDataButton.innerHTML = 'Reload Data';
  } catch (error) {
    // Handle error
    setTimeout(() => {
      loadingPlugin.hide();
      loadDataButton.disabled = false;
      loadDataButton.innerHTML = 'Load Data';
    }, 2000);
  }
}

loadDataButton.addEventListener('click', loadData);
