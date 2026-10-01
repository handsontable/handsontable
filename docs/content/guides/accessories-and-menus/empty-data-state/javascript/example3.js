// Dynamic messages based on source example for Empty Data State plugin
// This example shows how to provide different messages based on the source of empty state

import Handsontable from 'handsontable';

const container = document.getElementById('example3');

const hot = new Handsontable(container, {
  data: [],
  height: 'auto',
  colHeaders: ['Name', 'Job title', 'Department', 'City'],
  rowHeaders: true,
  navigableHeaders: true,
  dropdownMenu: true,
  filters: true,
  contextMenu: true,
  emptyDataState: {
    message: (source) => {
      switch (source) {
        case 'filters':
          return {
            title: 'No results found',
            description: 'Your current filters are hiding all results. Try adjusting your search criteria.',
            buttons: [
              {
                text: 'Clear Filters',
                type: 'secondary',
                callback: () => {
                  const filtersPlugin = hot.getPlugin('filters');

                  if (filtersPlugin) {
                    filtersPlugin.clearConditions();
                    filtersPlugin.filter();
                  }
                },
              },
            ],
          };
        default:
          return {
            title: 'No data available',
            description: "There's nothing to display yet. Add some data to get started.",
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
          };
      }
    },
  },
  licenseKey: 'non-commercial-and-evaluation',
});
