// Custom configuration example for Empty Data State plugin
// This example shows how to customize the empty data state message

import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.getElementById('example2') as HTMLElement;

const hot = new Handsontable(container, {
  themeName: 'ht-theme-main',
  data: [], // Empty data to trigger empty state
  height: 'auto',
  colHeaders: ['First Name', 'Last Name', 'Email'],
  rowHeaders: true,
  navigableHeaders: true,
  dropdownMenu: true,
  filters: true,
  emptyDataState: {
    message: {
      title: 'No data available',
      description: 'Please add some data to get started.',
      buttons: [
        {
          text: 'Add Sample Data',
          type: 'primary',
          callback: () => {
            // Add some sample data
            hot.loadData([
              ['John', 'Doe', 'john@example.com'],
              ['Jane', 'Smith', 'jane@example.com'],
              ['Bob', 'Johnson', 'bob@example.com'],
              ['Alice', 'Johnson', 'alice@example.com'],
            ]);
          }
        }
      ]
    }
  },
  licenseKey: 'non-commercial-and-evaluation'
});
