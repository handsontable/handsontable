import Handsontable from 'handsontable';

// Test loading plugin with dialog integration
const hot = new Handsontable(document.createElement('div'), {
  loading: true,
});

// Test loading plugin with custom configuration
new Handsontable(document.createElement('div'), {
  loading: {
    icon: '<svg>...</svg>',
    title: 'Custom Loading',
    description: 'Please wait...',
  },
});

// Test loading plugin with boolean settings
new Handsontable(document.createElement('div'), {
  loading: true,
});

// Test loading plugin methods with dialog integration
const loading = hot.getPlugin('loading');

// Test isVisible method (delegates to dialog)
loading.isVisible();

// Test show method with loading options
loading.show();
loading.show({
  icon: '<svg>...</svg>',
  title: 'Loading...',
  description: 'Please wait while data loads',
});

// Test hide method (delegates to dialog)
loading.hide();

// Test update method with loading options
loading.update();
loading.update({
  icon: '<svg>...</svg>',
  title: 'Updated Loading',
  description: 'Still loading...',
});
