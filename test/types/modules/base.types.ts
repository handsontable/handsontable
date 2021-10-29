import Handsontable from 'handsontable/base';

const elem = document.createElement('div');

// Verify the various top-level namespace APIs exist
Handsontable.baseVersion.toUpperCase();
Handsontable.buildDate.toUpperCase();
Handsontable.packageName === 'handsontable';
Handsontable.version.split('');
Handsontable.cellTypes;
Handsontable.languages;
Handsontable.dom;
Handsontable.editors;
Handsontable.helper;
Handsontable.hooks;
Handsontable.plugins;
Handsontable.renderers;
Handsontable.validators;

const hot = new Handsontable.Core(elem, {});

hot.alter('insert_col', 0, 1);
hot.addHook('afterCopy', () => {});

const defaultSettings: Handsontable.GridSettings = Handsontable.DefaultSettings;

new Handsontable.EventManager({});
