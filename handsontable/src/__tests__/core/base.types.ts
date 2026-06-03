import Handsontable, {
  CellCoords,
  CellRange,
} from 'handsontable/base';
import type { HotInstance } from 'handsontable';
import EventManager from 'handsontable/eventManager';

const elem = document.createElement('div');

const cellCoords = new CellCoords(1, 2);
const cellRange = new CellRange(cellCoords, cellCoords, cellCoords);

// Verify the various top-level namespace APIs exist
(Handsontable.buildDate as string).toUpperCase();
(Handsontable.packageName as string) === 'handsontable';
(Handsontable.version as string).split('');
Handsontable.cellTypes;
Handsontable.languages;
Handsontable.dom;
Handsontable.editors;
Handsontable.helper;
Handsontable.hooks;
Handsontable.plugins;
Handsontable.renderers;
Handsontable.validators;

const hot: HotInstance = new Handsontable.Core(elem, {});

hot.alter('insert_col_start', 0, 1);
hot.addHook('afterCopy', () => {});
hot.addHook('afterCopy', () => {}, 1);

const defaultSettings: Record<string, unknown> = Handsontable.DefaultSettings;

new EventManager({});
