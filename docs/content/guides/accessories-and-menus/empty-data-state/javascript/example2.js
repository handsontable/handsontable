// Custom configuration example for Empty Data State plugin
// This example shows how to customize the empty data state message

import Handsontable from 'handsontable';

const container = document.getElementById('example2');

const hot = new Handsontable(container, {
  data: [], // Empty data to trigger empty state
  height: 'auto',
  colHeaders: ['Name', 'Job title', 'Department', 'City'],
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
          text: 'Load employees',
          type: 'primary',
          callback: () => {
            hot.loadData([
              ['Ana García', 'Senior Engineer', 'Engineering', 'Austin'],
              ['James Okafor', 'Product Manager', 'Product', 'Chicago'],
              ['Li Wei', 'Data Analyst', 'Analytics', 'Seattle'],
              ['Priya Raman', 'Marketing Lead', 'Marketing', 'Denver'],
              ['Marcus Johnson', 'HR Business Partner', 'People Operations', 'Atlanta'],
            ]);
          },
        },
      ],
    },
  },
  licenseKey: 'non-commercial-and-evaluation',
});
