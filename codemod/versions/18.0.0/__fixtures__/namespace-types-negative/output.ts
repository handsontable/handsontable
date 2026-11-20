// Handsontable types that stay in the namespace in 18.0, and look-alike paths on other objects.
import Handsontable from 'handsontable';
import * as Other from 'other-grid';

export let core: Handsontable.Core;
export let settings: Handsontable.GridSettings;
export let sorting: Handsontable.plugins.ColumnSorting;
export let comments: Handsontable.plugins.Comments;
export let cell: Handsontable.CellProperties;
export let otherProvider: Other.plugins.DataProvider.Settings;
export let otherCoords: Other.CellCoords;
export let otherEditor: Other.EditorType;
export let otherHelper: Other.helper.Comparator;
