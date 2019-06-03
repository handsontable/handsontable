import Handsontable from 'handsontable';

const elem = document.createElement('div');

// Verify the various top-level namespace APIs exist
Handsontable.baseVersion.toUpperCase();
Handsontable.buildDate.toUpperCase();
Handsontable.packageName == 'handsontable';
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
new Handsontable.Core(elem, {});
const defaultSettings: Handsontable.GridSettings = new Handsontable.DefaultSettings();
new Handsontable.EventManager({});