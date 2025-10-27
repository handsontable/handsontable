// Dynamic messages based on source example for Empty Data State plugin
// This example shows how to provide different messages based on the source of empty state

import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.getElementById('example3');

const hot = new Handsontable(container, {
  themeName: 'ht-theme-main',
  data: [],
  height: 'auto',
  colHeaders: ['First Name', 'Last Name', 'Email'],
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
                }
              }
            ]
          };
        default:
          return {
            title: 'No data available',
            description: 'There\'s nothing to display yet. Add some data to get started.',
            buttons: [
              {
                text: 'Add Sample Data',
                type: 'primary',
                callback: () => {
                  hot.loadData([
                    ['John', 'Doe', 'john@example.com'],
                    ['Jane', 'Smith', 'jane@example.com'],
                    ['Bob', 'Johnson', 'bob@example.com'],
                    ['Alice', 'Johnson', 'alice@example.com'],
                  ]);
                }
              }
            ]
          };
      }
    }
  },
  licenseKey: 'non-commercial-and-evaluation'
});
