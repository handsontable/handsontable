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
Handsontable.cellTypes.autocomplete;
Handsontable.cellTypes.checkbox;
Handsontable.cellTypes.date;
Handsontable.cellTypes.dropdown;
Handsontable.cellTypes.handsontable;
Handsontable.cellTypes.numeric;
Handsontable.cellTypes.password;
Handsontable.cellTypes.text;
Handsontable.cellTypes.select;
Handsontable.cellTypes.time;
Handsontable.cellTypes.registerCellType;
Handsontable.cellTypes.getCellType;
Handsontable.languages;
Handsontable.languages.getLanguageDictionary;
Handsontable.languages.getLanguagesDictionaries;
Handsontable.languages.getTranslatedPhrase;
Handsontable.languages.registerLanguageDictionary;
Handsontable.dom;
Handsontable.editors;
Handsontable.editors.AutocompleteEditor;
Handsontable.editors.BaseEditor;
Handsontable.editors.CheckboxEditor;
Handsontable.editors.DateEditor;
Handsontable.editors.DropdownEditor;
Handsontable.editors.HandsontableEditor;
Handsontable.editors.NumericEditor;
Handsontable.editors.PasswordEditor;
Handsontable.editors.SelectEditor;
Handsontable.editors.TextEditor;
Handsontable.editors.TimeEditor;
Handsontable.editors.registerEditor;
Handsontable.editors.getEditor;
Handsontable.helper;
Handsontable.hooks;
Handsontable.plugins;
Handsontable.plugins.AutoColumnSize;
Handsontable.plugins.Autofill;
Handsontable.plugins.AutoRowSize;
Handsontable.plugins.BindRowsWithHeaders;
Handsontable.plugins.CollapsibleColumns;
Handsontable.plugins.ColumnSorting;
Handsontable.plugins.ColumnSummary;
Handsontable.plugins.Comments;
Handsontable.plugins.ContextMenu;
Handsontable.plugins.CopyPaste;
Handsontable.plugins.CustomBorders;
Handsontable.plugins.DragToScroll;
Handsontable.plugins.DropdownMenu;
Handsontable.plugins.ExportFile;
Handsontable.plugins.Filters;
Handsontable.plugins.Formulas;
Handsontable.plugins.HiddenColumns;
Handsontable.plugins.HiddenRows;
Handsontable.plugins.ManualColumnFreeze;
Handsontable.plugins.ManualColumnMove;
Handsontable.plugins.ManualColumnResize;
Handsontable.plugins.ManualRowMove;
Handsontable.plugins.ManualRowResize;
Handsontable.plugins.MergeCells;
Handsontable.plugins.MultiColumnSorting;
Handsontable.plugins.MultipleSelectionHandles;
Handsontable.plugins.NestedHeaders;
Handsontable.plugins.NestedRows;
Handsontable.plugins.Pagination;
Handsontable.plugins.PersistentState;
Handsontable.plugins.Search;
Handsontable.plugins.TouchScroll;
Handsontable.plugins.TrimRows;
Handsontable.plugins.UndoRedo;
Handsontable.renderers;
Handsontable.renderers.AutocompleteRenderer;
Handsontable.renderers.DropdownRenderer;
Handsontable.renderers.BaseRenderer;
Handsontable.renderers.CheckboxRenderer;
Handsontable.renderers.HtmlRenderer;
Handsontable.renderers.HandsontableRenderer;
Handsontable.renderers.NumericRenderer;
Handsontable.renderers.PasswordRenderer;
Handsontable.renderers.TextRenderer;
Handsontable.renderers.DateRenderer;
Handsontable.renderers.SelectRenderer;
Handsontable.renderers.TimeRenderer;
Handsontable.renderers.registerRenderer;
Handsontable.renderers.getRenderer;
Handsontable.validators;
Handsontable.validators.AutocompleteValidator;
Handsontable.validators.DropdownValidator;
Handsontable.validators.DateValidator;
Handsontable.validators.NumericValidator;
Handsontable.validators.registerValidator;
Handsontable.validators.getValidator;

new Handsontable.Core(elem, {});

const defaultSettings: Handsontable.GridSettings = Handsontable.DefaultSettings;

new Handsontable.EventManager({});
