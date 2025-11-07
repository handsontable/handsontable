import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  emptyDataState: true,
});

new Handsontable(document.createElement('div'), {
  emptyDataState: {
    message: 'No data available',
  },
});

new Handsontable(document.createElement('div'), {
  emptyDataState: {
    message: {
      title: 'No data available',
      description: 'There\'s nothing to display yet.',
    },
  },
});

new Handsontable(document.createElement('div'), {
  emptyDataState: {
    message: {
      title: 'No data available',
      description: 'There\'s nothing to display yet.',
      buttons: [
        {
          text: 'Reset filters',
          type: 'secondary',
          callback: () => {},
        },
      ],
    },
  },
});

new Handsontable(document.createElement('div'), {
  emptyDataState: {
    message: (source: string) => {
      switch (source) {
        case 'filters':
          return {
            title: 'No data available',
            description: 'There\'s nothing to display yet.',
            buttons: [
              {
                text: 'Primary action',
                type: 'primary',
                callback: () => {},
              },
              {
                text: 'Secondary action',
                type: 'secondary',
                callback: () => {},
              },
            ],
          };
        default:
          return {
            title: 'No data available',
            description: 'There\'s nothing to display yet.',
          };
      }
    },
  },
});

const emptyDataState = hot.getPlugin('emptyDataState');

emptyDataState.isVisible();
