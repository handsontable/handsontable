import Handsontable, {
  CellCoords,
  CellRange,
} from 'handsontable';

const elem = document.createElement('div');

const cellCoords = new CellCoords(1, 2);
const cellRange = new CellRange(cellCoords, cellCoords, cellCoords);

const cellCoordsNS = new Handsontable.CellCoords(1, 2);
const cellRangeNS = new Handsontable.CellRange(cellCoordsNS, cellCoordsNS, cellCoordsNS);

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
new Handsontable.Core(elem, {});

const defaultSettings: Handsontable.GridSettings = Handsontable.DefaultSettings;

new Handsontable.EventManager({});
