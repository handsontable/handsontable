import Handsontable from './base';
import EventManager, { getListenersCounter } from './eventManager';
import { getRegisteredMapsCounter } from './translations/mapCollection';
import Hooks from './pluginHooks';
import { metaSchemaFactory } from './dataMap/index';

import jQueryWrapper from './helpers/wrappers/jquery';

import { getRegisteredEditorNames, getEditor, registerEditor } from './editors';
import { getRegisteredRendererNames, getRenderer, registerRenderer } from './renderers';
import { getRegisteredValidatorNames, getValidator, registerValidator } from './validators';
import { getRegisteredCellTypeNames, getCellType, registerCellType } from './cellTypes';
import { getPlugin, getPluginsNames, registerPlugin } from './plugins';

import GhostTable from './utils/ghostTable';
import * as parseTableHelpers from './utils/parseTable';
import * as arrayHelpers from './helpers/array';
import * as browserHelpers from './helpers/browser';
import * as dataHelpers from './helpers/data';
import * as dateHelpers from './helpers/date';
import * as featureHelpers from './helpers/feature';
import * as functionHelpers from './helpers/function';
import * as mixedHelpers from './helpers/mixed';
import * as numberHelpers from './helpers/number';
import * as objectHelpers from './helpers/object';
import * as stringHelpers from './helpers/string';
import * as unicodeHelpers from './helpers/unicode';
import * as domHelpers from './helpers/dom/element';
import * as domEventHelpers from './helpers/dom/event';

import { BaseEditor, EDITOR_TYPE as BASE_EDITOR } from './editors/baseEditor';
import { AutocompleteEditor, EDITOR_TYPE as AUTOCOMPLETE_EDITOR } from './editors/autocompleteEditor';
import { CheckboxEditor, EDITOR_TYPE as CHECKBOX_EDITOR } from './editors/checkboxEditor';
import { DateEditor, EDITOR_TYPE as DATE_EDITOR } from './editors/dateEditor';
import { DropdownEditor, EDITOR_TYPE as DROPDOWN_EDITOR } from './editors/dropdownEditor';
import { HandsontableEditor, EDITOR_TYPE as HANDSONTABLE_EDITOR } from './editors/handsontableEditor';
import { NumericEditor, EDITOR_TYPE as NUMERIC_EDITOR } from './editors/numericEditor';
import { PasswordEditor, EDITOR_TYPE as PASSWORD_EDITOR } from './editors/passwordEditor';
import { SelectEditor, EDITOR_TYPE as SELECT_EDITOR } from './editors/selectEditor';
import { TextEditor, EDITOR_TYPE as TEXT_EDITOR } from './editors/textEditor';

import { baseRenderer, RENDERER_TYPE as BASE_RENDERER } from './renderers/baseRenderer';
import { autocompleteRenderer, RENDERER_TYPE as AUTOCOMPLETE_RENDERER } from './renderers/autocompleteRenderer';
import { checkboxRenderer, RENDERER_TYPE as CHECKBOX_RENDERER } from './renderers/checkboxRenderer';
import { htmlRenderer, RENDERER_TYPE as HTML_RENDERER } from './renderers/htmlRenderer';
import { numericRenderer, RENDERER_TYPE as NUMERIC_RENDERER } from './renderers/numericRenderer';
import { passwordRenderer, RENDERER_TYPE as PASSWORD_RENDERER } from './renderers/passwordRenderer';
import { textRenderer, RENDERER_TYPE as TEXT_RENDERER } from './renderers/textRenderer';

import { autocompleteValidator, VALIDATOR_TYPE as AUTOCOMPLETE_VALIDATOR } from './validators/autocompleteValidator';
import { dateValidator, VALIDATOR_TYPE as DATE_VALIDATOR } from './validators/dateValidator';
import { numericValidator, VALIDATOR_TYPE as NUMERIC_VALIDATOR } from './validators/numericValidator';
import { timeValidator, VALIDATOR_TYPE as TIME_VALIDATOR } from './validators/timeValidator';

import { AutocompleteCellType, CELL_TYPE as AUTOCOMPLETE_TYPE } from './cellTypes/autocompleteType';
import { CheckboxCellType, CELL_TYPE as CHECKBOX_TYPE } from './cellTypes/checkboxType';
import { DateCellType, CELL_TYPE as DATE_TYPE } from './cellTypes/dateType';
import { DropdownCellType, CELL_TYPE as DROPDOWN_TYPE } from './cellTypes/dropdownType';
import { HandsontableCellType, CELL_TYPE as HANDSONTABLE_TYPE } from './cellTypes/handsontableType';
import { NumericCellType, CELL_TYPE as NUMERIC_TYPE } from './cellTypes/numericType';
import { PasswordCellType, CELL_TYPE as PASSWORD_TYPE } from './cellTypes/passwordType';
import { TimeCellType, CELL_TYPE as TIME_TYPE } from './cellTypes/timeType';

// 'PersistentState' has to be initialized as first module to have priority in listening hooks
import {
  PLUGIN_KEY as PERSISTENTSTATE_KEY,
  PLUGIN_PRIORITY as PERSISTENTSTATE_PRIORYTY,
  PersistentState,
} from './plugins/persistentState';
import {
  PLUGIN_KEY as AUTOCOLUMNSIZE_KEY,
  PLUGIN_PRIORITY as AUTOCOLUMNSIZE_PRIORYTY,
  AutoColumnSize,
} from './plugins/autoColumnSize';
import {
  PLUGIN_KEY as AUTOFILL_KEY,
  PLUGIN_PRIORITY as AUTOFILL_PRIORYTY,
  Autofill,
} from './plugins/autofill';
import {
  PLUGIN_KEY as MANUALROWRESIZE_KEY,
  PLUGIN_PRIORITY as MANUALROWRESIZE_PRIORYTY,
  ManualRowResize,
} from './plugins/manualRowResize';
import {
  PLUGIN_KEY as AUTOROWSIZE_KEY,
  PLUGIN_PRIORITY as AUTOROWSIZE_PRIORYTY,
  AutoRowSize,
} from './plugins/autoRowSize';
import {
  PLUGIN_KEY as COLUMNSORTING_KEY,
  PLUGIN_PRIORITY as COLUMNSORTING_PRIORYTY,
  ColumnSorting,
} from './plugins/columnSorting';
import {
  PLUGIN_KEY as COMMENTS_KEY,
  PLUGIN_PRIORITY as COMMENTS_PRIORYTY,
  Comments,
} from './plugins/comments';
import {
  PLUGIN_KEY as CONTEXTMENU_KEY,
  PLUGIN_PRIORITY as CONTEXTMENU_PRIORYTY,
  ContextMenu,
} from './plugins/contextMenu';
import {
  PLUGIN_KEY as COPYPASTE_KEY,
  PLUGIN_PRIORITY as COPYPASTE_PRIORYTY,
  CopyPaste,
} from './plugins/copyPaste';
import {
  PLUGIN_KEY as CUSTOMBORDERS_KEY,
  PLUGIN_PRIORITY as CUSTOMBORDERS_PRIORYTY,
  CustomBorders,
} from './plugins/customBorders';
import {
  PLUGIN_KEY as DRAGTOSCROLL_KEY,
  PLUGIN_PRIORITY as DRAGTOSCROLL_PRIORYTY,
  DragToScroll,
} from './plugins/dragToScroll';
import {
  PLUGIN_KEY as MANUALCOLUMNFREEZE_KEY,
  PLUGIN_PRIORITY as MANUALCOLUMNFREEZE_PRIORYTY,
  ManualColumnFreeze,
} from './plugins/manualColumnFreeze';
import {
  PLUGIN_KEY as MANUALCOLUMNMOVE_KEY,
  PLUGIN_PRIORITY as MANUALCOLUMNMOVE_PRIORYTY,
  ManualColumnMove,
} from './plugins/manualColumnMove';
import {
  PLUGIN_KEY as MANUALCOLUMNRESIZE_KEY,
  PLUGIN_PRIORITY as MANUALCOLUMNRESIZE_PRIORYTY,
  ManualColumnResize,
} from './plugins/manualColumnResize';
import {
  PLUGIN_KEY as MANUALROWMOVE_KEY,
  PLUGIN_PRIORITY as MANUALROWMOVE_PRIORYTY,
  ManualRowMove,
} from './plugins/manualRowMove';
import {
  PLUGIN_KEY as MERGECELLS_KEY,
  PLUGIN_PRIORITY as MERGECELLS_PRIORYTY,
  MergeCells,
} from './plugins/mergeCells';
import {
  PLUGIN_KEY as MULTIPLESELECTIONHANDLES_KEY,
  PLUGIN_PRIORITY as MULTIPLESELECTIONHANDLES_PRIORYTY,
  MultipleSelectionHandles,
} from './plugins/multipleSelectionHandles';
import {
  PLUGIN_KEY as MULTICOLUMNSORTING_KEY,
  PLUGIN_PRIORITY as MULTICOLUMNSORTING_PRIORYTY,
  MultiColumnSorting,
} from './plugins/multiColumnSorting';
import {
  PLUGIN_KEY as OBSERVECHANGES_KEY,
  PLUGIN_PRIORITY as OBSERVECHANGES_PRIORYTY,
  ObserveChanges,
} from './plugins/observeChanges';
import {
  PLUGIN_KEY as SEARCH_KEY,
  PLUGIN_PRIORITY as SEARCH_PRIORYTY,
  Search,
} from './plugins/search';
import {
  PLUGIN_KEY as TOUCHSCROLL_KEY,
  PLUGIN_PRIORITY as TOUCHSCROLL_PRIORYTY,
  TouchScroll,
} from './plugins/touchScroll';
import {
  PLUGIN_KEY as UNDOREDO_KEY,
  UndoRedo,
} from './plugins/undoRedo';
import {
  PLUGIN_KEY as BASE_KEY,
  BasePlugin,
} from './plugins/base';
import {
  PLUGIN_KEY as BINDROWSWITHHEADERS_KEY,
  PLUGIN_PRIORITY as BINDROWSWITHHEADERS_PRIORYTY,
  BindRowsWithHeaders,
} from './plugins/bindRowsWithHeaders';
import {
  PLUGIN_KEY as COLUMNSUMMARY_KEY,
  PLUGIN_PRIORITY as COLUMNSUMMARY_PRIORYTY,
  ColumnSummary,
} from './plugins/columnSummary';
import {
  PLUGIN_KEY as DROPDOWNMENU_KEY,
  PLUGIN_PRIORITY as DROPDOWNMENU_PRIORYTY,
  DropdownMenu,
} from './plugins/dropdownMenu';
import {
  PLUGIN_KEY as EXPORTFILE_KEY,
  PLUGIN_PRIORITY as EXPORTFILE_PRIORYTY,
  ExportFile,
} from './plugins/exportFile';
import {
  PLUGIN_KEY as FILTERS_KEY,
  PLUGIN_PRIORITY as FILTERS_PRIORYTY,
  Filters,
} from './plugins/filters';
import {
  PLUGIN_KEY as FORMULAS_KEY,
  PLUGIN_PRIORITY as FORMULAS_PRIORYTY,
  Formulas,
} from './plugins/formulas';
import {
  PLUGIN_KEY as HEADERTOOLTIPS_KEY,
  PLUGIN_PRIORITY as HEADERTOOLTIPS_PRIORYTY,
  HeaderTooltips
} from './plugins/headerTooltips';
import {
  PLUGIN_KEY as NESTEDHEADERS_KEY,
  PLUGIN_PRIORITY as NESTEDHEADERS_PRIORYTY,
  NestedHeaders,
} from './plugins/nestedHeaders';
import {
  PLUGIN_KEY as COLLAPSIBLECOLUMNS_KEY,
  PLUGIN_PRIORITY as COLLAPSIBLECOLUMNS_PRIORYTY,
  CollapsibleColumns,
} from './plugins/collapsibleColumns';
import {
  PLUGIN_KEY as NESTEDROWS_KEY,
  PLUGIN_PRIORITY as NESTEDROWS_PRIORYTY,
  NestedRows,
} from './plugins/nestedRows';
import {
  PLUGIN_KEY as HIDDENCOLUMNS_KEY,
  PLUGIN_PRIORITY as HIDDENCOLUMNS_PRIORYTY,
  HiddenColumns,
} from './plugins/hiddenColumns';
import {
  PLUGIN_KEY as HIDDENROWS_KEY,
  PLUGIN_PRIORITY as HIDDENROWS_PRIORYTY,
  HiddenRows,
} from './plugins/hiddenRows';
import {
  PLUGIN_KEY as TRIMROWS_KEY,
  PLUGIN_PRIORITY as TRIMROWS_PRIORYTY,
  TrimRows,
} from './plugins/trimRows';

jQueryWrapper(Handsontable);

registerEditor(BASE_EDITOR, BaseEditor);
registerEditor(AUTOCOMPLETE_EDITOR, AutocompleteEditor);
registerEditor(CHECKBOX_EDITOR, CheckboxEditor);
registerEditor(DATE_EDITOR, DateEditor);
registerEditor(DROPDOWN_EDITOR, DropdownEditor);
registerEditor(HANDSONTABLE_EDITOR, HandsontableEditor);
registerEditor(NUMERIC_EDITOR, NumericEditor);
registerEditor(PASSWORD_EDITOR, PasswordEditor);
registerEditor(SELECT_EDITOR, SelectEditor);
registerEditor(TEXT_EDITOR, TextEditor);

registerRenderer(BASE_RENDERER, baseRenderer);
registerRenderer(AUTOCOMPLETE_RENDERER, autocompleteRenderer);
registerRenderer(CHECKBOX_RENDERER, checkboxRenderer);
registerRenderer(HTML_RENDERER, htmlRenderer);
registerRenderer(NUMERIC_RENDERER, numericRenderer);
registerRenderer(PASSWORD_RENDERER, passwordRenderer);
registerRenderer(TEXT_RENDERER, textRenderer);

registerValidator(AUTOCOMPLETE_VALIDATOR, autocompleteValidator);
registerValidator(DATE_VALIDATOR, dateValidator);
registerValidator(NUMERIC_VALIDATOR, numericValidator);
registerValidator(TIME_VALIDATOR, timeValidator);

registerCellType(AUTOCOMPLETE_TYPE, AutocompleteCellType);
registerCellType(CHECKBOX_TYPE, CheckboxCellType);
registerCellType(DATE_TYPE, DateCellType);
registerCellType(DROPDOWN_TYPE, DropdownCellType);
registerCellType(HANDSONTABLE_TYPE, HandsontableCellType);
registerCellType(NUMERIC_TYPE, NumericCellType);
registerCellType(PASSWORD_TYPE, PasswordCellType);
registerCellType(TIME_TYPE, TimeCellType);

registerPlugin(PERSISTENTSTATE_KEY, PersistentState, PERSISTENTSTATE_PRIORYTY);
registerPlugin(AUTOCOLUMNSIZE_KEY, AutoColumnSize, AUTOCOLUMNSIZE_PRIORYTY);
registerPlugin(AUTOFILL_KEY, Autofill, AUTOFILL_PRIORYTY);
registerPlugin(MANUALROWRESIZE_KEY, ManualRowResize, MANUALROWRESIZE_PRIORYTY);
registerPlugin(AUTOROWSIZE_KEY, AutoRowSize, AUTOROWSIZE_PRIORYTY);
registerPlugin(COLUMNSORTING_KEY, ColumnSorting, COLUMNSORTING_PRIORYTY);
registerPlugin(COMMENTS_KEY, Comments, COMMENTS_PRIORYTY);
registerPlugin(CONTEXTMENU_KEY, ContextMenu, CONTEXTMENU_PRIORYTY);
registerPlugin(COPYPASTE_KEY, CopyPaste, COPYPASTE_PRIORYTY);
registerPlugin(CUSTOMBORDERS_KEY, CustomBorders, CUSTOMBORDERS_PRIORYTY);
registerPlugin(DRAGTOSCROLL_KEY, DragToScroll, DRAGTOSCROLL_PRIORYTY);
registerPlugin(MANUALCOLUMNFREEZE_KEY, ManualColumnFreeze, MANUALCOLUMNFREEZE_PRIORYTY);
registerPlugin(MANUALCOLUMNMOVE_KEY, ManualColumnMove, MANUALCOLUMNMOVE_PRIORYTY);
registerPlugin(MANUALCOLUMNRESIZE_KEY, ManualColumnResize, MANUALCOLUMNRESIZE_PRIORYTY);
registerPlugin(MANUALROWMOVE_KEY, ManualRowMove, MANUALROWMOVE_PRIORYTY);
registerPlugin(MERGECELLS_KEY, MergeCells, MERGECELLS_PRIORYTY);
registerPlugin(MULTIPLESELECTIONHANDLES_KEY, MultipleSelectionHandles, MULTIPLESELECTIONHANDLES_PRIORYTY);
registerPlugin(MULTICOLUMNSORTING_KEY, MultiColumnSorting, MULTICOLUMNSORTING_PRIORYTY);
registerPlugin(OBSERVECHANGES_KEY, ObserveChanges, OBSERVECHANGES_PRIORYTY);
registerPlugin(SEARCH_KEY, Search, SEARCH_PRIORYTY);
registerPlugin(TOUCHSCROLL_KEY, TouchScroll, TOUCHSCROLL_PRIORYTY);
registerPlugin(BINDROWSWITHHEADERS_KEY, BindRowsWithHeaders, BINDROWSWITHHEADERS_PRIORYTY);
registerPlugin(COLUMNSUMMARY_KEY, ColumnSummary, COLUMNSUMMARY_PRIORYTY);
registerPlugin(DROPDOWNMENU_KEY, DropdownMenu, DROPDOWNMENU_PRIORYTY);
registerPlugin(EXPORTFILE_KEY, ExportFile, EXPORTFILE_PRIORYTY);
registerPlugin(FILTERS_KEY, Filters, FILTERS_PRIORYTY);
registerPlugin(FORMULAS_KEY, Formulas, FORMULAS_PRIORYTY);
registerPlugin(HEADERTOOLTIPS_KEY, HeaderTooltips, HEADERTOOLTIPS_PRIORYTY);
registerPlugin(NESTEDHEADERS_KEY, NestedHeaders, NESTEDHEADERS_PRIORYTY);
registerPlugin(COLLAPSIBLECOLUMNS_KEY, CollapsibleColumns, COLLAPSIBLECOLUMNS_PRIORYTY);
registerPlugin(NESTEDROWS_KEY, NestedRows, NESTEDROWS_PRIORYTY);
registerPlugin(HIDDENCOLUMNS_KEY, HiddenColumns, HIDDENCOLUMNS_PRIORYTY);
registerPlugin(HIDDENROWS_KEY, HiddenRows, HIDDENROWS_PRIORYTY);
registerPlugin(TRIMROWS_KEY, TrimRows, TRIMROWS_PRIORYTY);

// TODO: Remove this exports after rewrite tests about this module
Handsontable.__GhostTable = GhostTable;

Handsontable._getListenersCounter = getListenersCounter; // For MemoryLeak tests
Handsontable._getRegisteredMapsCounter = getRegisteredMapsCounter; // For MemoryLeak tests

Handsontable.DefaultSettings = metaSchemaFactory();
Handsontable.EventManager = EventManager;

// Export Hooks singleton
Handsontable.hooks = Hooks.getSingleton();

// Export all helpers to the Handsontable object
const HELPERS = [
  arrayHelpers,
  browserHelpers,
  dataHelpers,
  dateHelpers,
  featureHelpers,
  functionHelpers,
  mixedHelpers,
  numberHelpers,
  objectHelpers,
  stringHelpers,
  unicodeHelpers,
  parseTableHelpers,
];
const DOM = [
  domHelpers,
  domEventHelpers,
];

Handsontable.helper = {};
Handsontable.dom = {};

// Fill general helpers.
arrayHelpers.arrayEach(HELPERS, (helper) => {
  arrayHelpers.arrayEach(Object.getOwnPropertyNames(helper), (key) => {
    if (key.charAt(0) !== '_') {
      Handsontable.helper[key] = helper[key];
    }
  });
});

// Fill DOM helpers.
arrayHelpers.arrayEach(DOM, (helper) => {
  arrayHelpers.arrayEach(Object.getOwnPropertyNames(helper), (key) => {
    if (key.charAt(0) !== '_') {
      Handsontable.dom[key] = helper[key];
    }
  });
});

// Export cell types.
Handsontable.cellTypes = {};

arrayHelpers.arrayEach(getRegisteredCellTypeNames(), (cellTypeName) => {
  Handsontable.cellTypes[cellTypeName] = getCellType(cellTypeName);
});

Handsontable.cellTypes.registerCellType = registerCellType;
Handsontable.cellTypes.getCellType = getCellType;

// Export all registered editors from the Handsontable.
Handsontable.editors = {};

arrayHelpers.arrayEach(getRegisteredEditorNames(), (editorName) => {
  Handsontable.editors[`${stringHelpers.toUpperCaseFirst(editorName)}Editor`] = getEditor(editorName);
});

Handsontable.editors.registerEditor = registerEditor;
Handsontable.editors.getEditor = getEditor;

// Export all registered renderers from the Handsontable.
Handsontable.renderers = {};

arrayHelpers.arrayEach(getRegisteredRendererNames(), (rendererName) => {
  const renderer = getRenderer(rendererName);

  if (rendererName === 'base') {
    Handsontable.renderers.cellDecorator = renderer;
  }
  Handsontable.renderers[`${stringHelpers.toUpperCaseFirst(rendererName)}Renderer`] = renderer;
});

Handsontable.renderers.registerRenderer = registerRenderer;
Handsontable.renderers.getRenderer = getRenderer;

// Export all registered validators from the Handsontable.
Handsontable.validators = {};

arrayHelpers.arrayEach(getRegisteredValidatorNames(), (validatorName) => {
  Handsontable.validators[`${stringHelpers.toUpperCaseFirst(validatorName)}Validator`] = getValidator(validatorName);
});

Handsontable.validators.registerValidator = registerValidator;
Handsontable.validators.getValidator = getValidator;

// Export all registered plugins from the Handsontable.
Handsontable.plugins = {
  [`${stringHelpers.toUpperCaseFirst(BASE_KEY)}Plugin`]: BasePlugin,
  [`${stringHelpers.toUpperCaseFirst(UNDOREDO_KEY)}Redo`]: UndoRedo,
};

arrayHelpers.arrayEach(getPluginsNames(), (pluginName) => {
  Handsontable.plugins[pluginName] = getPlugin(pluginName);
});

Handsontable.plugins.registerPlugin = registerPlugin;
Handsontable.plugins.getPlugin = getPlugin;

export default Handsontable;
