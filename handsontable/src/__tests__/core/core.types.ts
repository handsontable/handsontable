import Handsontable, {
  CellCoords,
  CellRange,
} from 'handsontable';
import { HotInstance } from 'handsontable';
import EventManager from 'handsontable/eventManager';

const elem = document.createElement('div');

const cellCoords = new CellCoords(1, 2);
const cellRange = new CellRange(cellCoords, cellCoords, cellCoords);

const cellCoordsNS = new Handsontable.CellCoords(1, 2);
const cellRangeNS = new Handsontable.CellRange(cellCoordsNS, cellCoordsNS, cellCoordsNS);

// Verify the various top-level namespace APIs exist
(Handsontable.buildDate as string).toUpperCase();
(Handsontable.packageName as string) === 'handsontable';
(Handsontable.version as string).split('');
Handsontable.cellTypes;
(Handsontable.cellTypes as Record<string, unknown>).autocomplete;
(Handsontable.cellTypes as Record<string, unknown>).checkbox;
(Handsontable.cellTypes as Record<string, unknown>).date;
(Handsontable.cellTypes as Record<string, unknown>).dropdown;
(Handsontable.cellTypes as Record<string, unknown>).handsontable;
(Handsontable.cellTypes as Record<string, unknown>).numeric;
(Handsontable.cellTypes as Record<string, unknown>).password;
(Handsontable.cellTypes as Record<string, unknown>).text;
(Handsontable.cellTypes as Record<string, unknown>).select;
(Handsontable.cellTypes as Record<string, unknown>).time;
(Handsontable.cellTypes as Record<string, unknown>).registerCellType;
(Handsontable.cellTypes as Record<string, unknown>).getCellType;
Handsontable.languages;
(Handsontable.languages as Record<string, unknown>).getLanguageDictionary;
(Handsontable.languages as Record<string, unknown>).getLanguagesDictionaries;
(Handsontable.languages as Record<string, unknown>).getTranslatedPhrase;
(Handsontable.languages as Record<string, unknown>).registerLanguageDictionary;
Handsontable.dom;
Handsontable.editors;
(Handsontable.editors as Record<string, unknown>).AutocompleteEditor;
(Handsontable.editors as Record<string, unknown>).BaseEditor;
(Handsontable.editors as Record<string, unknown>).CheckboxEditor;
(Handsontable.editors as Record<string, unknown>).DateEditor;
(Handsontable.editors as Record<string, unknown>).DropdownEditor;
(Handsontable.editors as Record<string, unknown>).HandsontableEditor;
(Handsontable.editors as Record<string, unknown>).NumericEditor;
(Handsontable.editors as Record<string, unknown>).PasswordEditor;
(Handsontable.editors as Record<string, unknown>).SelectEditor;
(Handsontable.editors as Record<string, unknown>).TextEditor;
(Handsontable.editors as Record<string, unknown>).TimeEditor;
(Handsontable.editors as Record<string, unknown>).registerEditor;
(Handsontable.editors as Record<string, unknown>).getEditor;
Handsontable.helper;
Handsontable.hooks;
Handsontable.plugins;
(Handsontable.plugins as Record<string, unknown>).AutoColumnSize;
(Handsontable.plugins as Record<string, unknown>).Autofill;
(Handsontable.plugins as Record<string, unknown>).AutoRowSize;
(Handsontable.plugins as Record<string, unknown>).BindRowsWithHeaders;
(Handsontable.plugins as Record<string, unknown>).CollapsibleColumns;
(Handsontable.plugins as Record<string, unknown>).ColumnSorting;
(Handsontable.plugins as Record<string, unknown>).ColumnSummary;
(Handsontable.plugins as Record<string, unknown>).Comments;
(Handsontable.plugins as Record<string, unknown>).ContextMenu;
(Handsontable.plugins as Record<string, unknown>).CopyPaste;
(Handsontable.plugins as Record<string, unknown>).CustomBorders;
(Handsontable.plugins as Record<string, unknown>).DragToScroll;
(Handsontable.plugins as Record<string, unknown>).DropdownMenu;
(Handsontable.plugins as Record<string, unknown>).ExportFile;
(Handsontable.plugins as Record<string, unknown>).Filters;
(Handsontable.plugins as Record<string, unknown>).Formulas;
(Handsontable.plugins as Record<string, unknown>).HiddenColumns;
(Handsontable.plugins as Record<string, unknown>).HiddenRows;
(Handsontable.plugins as Record<string, unknown>).ManualColumnFreeze;
(Handsontable.plugins as Record<string, unknown>).ManualColumnMove;
(Handsontable.plugins as Record<string, unknown>).ManualColumnResize;
(Handsontable.plugins as Record<string, unknown>).ManualRowMove;
(Handsontable.plugins as Record<string, unknown>).ManualRowResize;
(Handsontable.plugins as Record<string, unknown>).MergeCells;
(Handsontable.plugins as Record<string, unknown>).MultiColumnSorting;
(Handsontable.plugins as Record<string, unknown>).MultipleSelectionHandles;
(Handsontable.plugins as Record<string, unknown>).NestedHeaders;
(Handsontable.plugins as Record<string, unknown>).NestedRows;
(Handsontable.plugins as Record<string, unknown>).Pagination;
(Handsontable.plugins as Record<string, unknown>).PersistentState;
(Handsontable.plugins as Record<string, unknown>).Search;
(Handsontable.plugins as Record<string, unknown>).TouchScroll;
(Handsontable.plugins as Record<string, unknown>).TrimRows;
(Handsontable.plugins as Record<string, unknown>).UndoRedo;
Handsontable.renderers;
(Handsontable.renderers as Record<string, unknown>).AutocompleteRenderer;
(Handsontable.renderers as Record<string, unknown>).DropdownRenderer;
(Handsontable.renderers as Record<string, unknown>).BaseRenderer;
(Handsontable.renderers as Record<string, unknown>).CheckboxRenderer;
(Handsontable.renderers as Record<string, unknown>).HtmlRenderer;
(Handsontable.renderers as Record<string, unknown>).HandsontableRenderer;
(Handsontable.renderers as Record<string, unknown>).NumericRenderer;
(Handsontable.renderers as Record<string, unknown>).PasswordRenderer;
(Handsontable.renderers as Record<string, unknown>).TextRenderer;
(Handsontable.renderers as Record<string, unknown>).DateRenderer;
(Handsontable.renderers as Record<string, unknown>).SelectRenderer;
(Handsontable.renderers as Record<string, unknown>).TimeRenderer;
(Handsontable.renderers as Record<string, unknown>).registerRenderer;
(Handsontable.renderers as Record<string, unknown>).getRenderer;
Handsontable.validators;
(Handsontable.validators as Record<string, unknown>).AutocompleteValidator;
(Handsontable.validators as Record<string, unknown>).DropdownValidator;
(Handsontable.validators as Record<string, unknown>).DateValidator;
(Handsontable.validators as Record<string, unknown>).NumericValidator;
(Handsontable.validators as Record<string, unknown>).registerValidator;
(Handsontable.validators as Record<string, unknown>).getValidator;

new Handsontable.Core(elem, {});

const defaultSettings: Record<string, unknown> = Handsontable.DefaultSettings;

new EventManager({});
