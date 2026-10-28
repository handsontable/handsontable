/**
 * Type contract tests for the `Handsontable.*` namespace surface.
 *
 * Tests use actual imported values assigned to namespace-typed variables.
 * A compile error here means the namespace type alias disagrees with the
 * real exported type, which is a regression in the generated declarations.
 */
import Handsontable, {
  CellCoords,
  CellRange,
  IndexMapper,
} from 'handsontable';
import type {
  BaseEditorInstance,
  BaseTheme,
  CellType,
  ColumnDataGetterSetterFunction,
  DensityType,
  EditorType,
  Events,
  HooksRegistry,
  OverlayType,
  RangeType,
  RendererType,
  SelectOptionsObject,
  SourceRowData,
  RowIdKey,
  RowIdSetting,
  SettingsUpdate,
  ThemeBuilder,
  ThemeColorScheme,
  ThemeColorsConfig,
  ThemeConfig,
  ThemeDensityConfig,
  ThemeDensitySizes,
  ThemeIconsConfig,
  ThemeLightDarkValue,
  ThemeParams,
  ThemeSizingConfig,
  ThemeTokenValue,
  ThemeTokensConfig,
  ValidatorType,
  HotInstance,
} from 'handsontable';
import {
  AutocompleteEditor,
  BaseEditor,
  CheckboxEditor,
  DateEditor,
  DropdownEditor,
  HandsontableEditor,
  IntlDateEditor,
  IntlTimeEditor,
  NumericEditor,
  PasswordEditor,
  SelectEditor,
  TextEditor,
  TimeEditor,
} from 'handsontable/editors';
import {
  AutoColumnSize,
  Autofill,
  AutoRowSize,
  BindRowsWithHeaders,
  CollapsibleColumns,
  ColumnSorting,
  ColumnSummary,
  Comments,
  ContextMenu,
  CopyPaste,
  CustomBorders,
  DragToScroll,
  DropdownMenu,
  EmptyDataState,
  ExportFile,
  Filters,
  FormulaBuilder,
  Formulas,
  HiddenColumns,
  HiddenRows,
  Loading,
  ManualColumnFreeze,
  ManualColumnMove,
  ManualColumnResize,
  ManualRowMove,
  ManualRowResize,
  MergeCells,
  MultiColumnSorting,
  MultipleSelectionHandles,
  NestedHeaders,
  NestedRows,
  Notification,
  Pagination,
  Search,
  StretchColumns,
  TouchScroll,
  TrimRows,
  UndoRedo,
} from 'handsontable/plugins';
import {
  autocompleteRenderer,
  baseRenderer,
  checkboxRenderer,
  dateRenderer,
  dropdownRenderer,
  handsontableRenderer,
  htmlRenderer,
  intlDateRenderer,
  intlTimeRenderer,
  numericRenderer,
  passwordRenderer,
  selectRenderer,
  textRenderer,
  timeRenderer,
} from 'handsontable/renderers';
import {
  autocompleteValidator,
  checkboxValidator,
  dateValidator,
  dropdownValidator,
  intlDateValidator,
  intlTimeValidator,
  numericValidator,
  timeValidator,
} from 'handsontable/validators';

const elem = document.createElement('div');
const hot = Handsontable(elem, {}) as unknown as HotInstance;

// ---------------------------------------------------------------------------
// CellCoords / CellRange — runtime value exports, also usable as types
// ---------------------------------------------------------------------------
const coords = new CellCoords(0, 0);
const range = new CellRange(coords, coords, coords);

// IndexMapper — exported as runtime value from 'handsontable' and 'handsontable/base'
const indexMapper = new IndexMapper();

// ---------------------------------------------------------------------------
// editors namespace: namespace type aliases must match the real classes
// ---------------------------------------------------------------------------
const _autocompleteEditor: Handsontable.editors.AutocompleteEditor = new AutocompleteEditor(hot);
const _baseEditor: Handsontable.editors.BaseEditor = new BaseEditor(hot);
const _checkboxEditor: Handsontable.editors.CheckboxEditor = new CheckboxEditor(hot);
const _dateEditor: Handsontable.editors.DateEditor = new DateEditor(hot);
const _dropdownEditor: Handsontable.editors.DropdownEditor = new DropdownEditor(hot);
const _handsontableEditor: Handsontable.editors.HandsontableEditor = new HandsontableEditor(hot);
const _intlDateEditor: Handsontable.editors.IntlDateEditor = new IntlDateEditor(hot);
const _intlTimeEditor: Handsontable.editors.IntlTimeEditor = new IntlTimeEditor(hot);
const _numericEditor: Handsontable.editors.NumericEditor = new NumericEditor(hot);
const _passwordEditor: Handsontable.editors.PasswordEditor = new PasswordEditor(hot);
const _selectEditor: Handsontable.editors.SelectEditor = new SelectEditor(hot);
const _textEditor: Handsontable.editors.TextEditor = new TextEditor(hot);

// Structural check: BaseEditor exposes getValue
const editorValue: ReturnType<Handsontable.editors.BaseEditor['getValue']> = _baseEditor.getValue();

// ---------------------------------------------------------------------------
// plugins namespace: namespace type aliases must match the real classes
// ---------------------------------------------------------------------------
const _autoColumnSize: Handsontable.plugins.AutoColumnSize = new AutoColumnSize(hot);
const _autofill: Handsontable.plugins.Autofill = new Autofill(hot);
const _autoRowSize: Handsontable.plugins.AutoRowSize = new AutoRowSize(hot);
const _bindRowsWithHeaders: Handsontable.plugins.BindRowsWithHeaders = new BindRowsWithHeaders(hot);
const _collapsibleColumns: Handsontable.plugins.CollapsibleColumns = new CollapsibleColumns(hot);
const _columnSorting: Handsontable.plugins.ColumnSorting = new ColumnSorting(hot);
const _columnSummary: Handsontable.plugins.ColumnSummary = new ColumnSummary(hot);
const _comments: Handsontable.plugins.Comments = new Comments(hot);
const _contextMenu: Handsontable.plugins.ContextMenu = new ContextMenu(hot);
const _copyPaste: Handsontable.plugins.CopyPaste = new CopyPaste(hot);
const _customBorders: Handsontable.plugins.CustomBorders = new CustomBorders(hot);
const _dragToScroll: Handsontable.plugins.DragToScroll = new DragToScroll(hot);
const _dropdownMenu: Handsontable.plugins.DropdownMenu = new DropdownMenu(hot);
const _emptyDataState: Handsontable.plugins.EmptyDataState = new EmptyDataState(hot);
const _exportFile: Handsontable.plugins.ExportFile = new ExportFile(hot);
const _filters: Handsontable.plugins.Filters = new Filters(hot);
const _formulaBuilder: Handsontable.plugins.FormulaBuilder = new FormulaBuilder(hot);
const _formulas: Handsontable.plugins.Formulas = new Formulas(hot);
const _hiddenColumns: Handsontable.plugins.HiddenColumns = new HiddenColumns(hot);
const _hiddenRows: Handsontable.plugins.HiddenRows = new HiddenRows(hot);
const _loading: Handsontable.plugins.Loading = new Loading(hot);
const _manualColumnFreeze: Handsontable.plugins.ManualColumnFreeze = new ManualColumnFreeze(hot);
const _manualColumnMove: Handsontable.plugins.ManualColumnMove = new ManualColumnMove(hot);
const _manualColumnResize: Handsontable.plugins.ManualColumnResize = new ManualColumnResize(hot);
const _manualRowMove: Handsontable.plugins.ManualRowMove = new ManualRowMove(hot);
const _manualRowResize: Handsontable.plugins.ManualRowResize = new ManualRowResize(hot);
const _mergeCells: Handsontable.plugins.MergeCells = new MergeCells(hot);
const _multiColumnSorting: Handsontable.plugins.MultiColumnSorting = new MultiColumnSorting(hot);
const _multipleSelectionHandles: Handsontable.plugins.MultipleSelectionHandles = new MultipleSelectionHandles(hot);
const _nestedHeaders: Handsontable.plugins.NestedHeaders = new NestedHeaders(hot);
const _nestedRows: Handsontable.plugins.NestedRows = new NestedRows(hot);
const _notification: Handsontable.plugins.Notification = new Notification(hot);
const _pagination: Handsontable.plugins.Pagination = new Pagination(hot);
const _search: Handsontable.plugins.Search = new Search(hot);
const _stretchColumns: Handsontable.plugins.StretchColumns = new StretchColumns(hot);
const _touchScroll: Handsontable.plugins.TouchScroll = new TouchScroll(hot);
const _trimRows: Handsontable.plugins.TrimRows = new TrimRows(hot);
const _undoRedo: Handsontable.plugins.UndoRedo = new UndoRedo(hot);

// Plugin sub-namespace types (structural checks)
const _contextMenuKey: Handsontable.plugins.ContextMenu.PredefinedMenuItemKey = 'row_above';
const _filtersConditionId: Handsontable.plugins.Filters.ConditionId = { name: 'begins_with', args: [] };
const _filtersOperationType: Handsontable.plugins.Filters.OperationType = 'conjunction';
const _filtersAvailableConditions: Handsontable.plugins.Filters.AvailableConditions = {
  numeric: { exclude: ['not_between'] },
};
const _filtersAvailableConditionsRule: Handsontable.plugins.Filters.AvailableConditionsRule = ['eq', 'gt'];
const _filtersAvailableConditionsList: Handsontable.plugins.Filters.AvailableConditionsList = ['eq'];
const _filtersAvailableConditionsExclusion: Handsontable.plugins.Filters.AvailableConditionsExclusion = {
  exclude: ['gt'],
};
const _filtersAvailableConditionsDataType: Handsontable.plugins.Filters.AvailableConditionsDataType = 'intl-date';
const _filtersAvailableCondition: Handsontable.plugins.Filters.AvailableCondition = { name: 'gt', inputsCount: 1 };

// ---------------------------------------------------------------------------
// renderers namespace: verify function type aliases
// ---------------------------------------------------------------------------
const _autocompleteRenderer: Handsontable.renderers.AutocompleteRenderer = autocompleteRenderer;
const _baseRenderer: Handsontable.renderers.BaseRenderer = baseRenderer;
const _cellDecorator: Handsontable.renderers.cellDecorator = baseRenderer;
const _checkboxRenderer: Handsontable.renderers.CheckboxRenderer = checkboxRenderer;
const _dateRenderer: Handsontable.renderers.DateRenderer = dateRenderer;
const _dropdownRenderer: Handsontable.renderers.DropdownRenderer = dropdownRenderer;
const _handsontableRenderer: Handsontable.renderers.HandsontableRenderer = handsontableRenderer;
const _htmlRenderer: Handsontable.renderers.HtmlRenderer = htmlRenderer;
const _intlDateRenderer: Handsontable.renderers.IntlDateRenderer = intlDateRenderer;
const _intlTimeRenderer: Handsontable.renderers.IntlTimeRenderer = intlTimeRenderer;
const _numericRenderer: Handsontable.renderers.NumericRenderer = numericRenderer;
const _passwordRenderer: Handsontable.renderers.PasswordRenderer = passwordRenderer;
const _selectRenderer: Handsontable.renderers.SelectRenderer = selectRenderer;
const _textRenderer: Handsontable.renderers.TextRenderer = textRenderer;
const _timeRenderer: Handsontable.renderers.TimeRenderer = timeRenderer;

// ---------------------------------------------------------------------------
// validators namespace: verify function type aliases
// ---------------------------------------------------------------------------
const _autocompleteValidator: Handsontable.validators.AutocompleteValidator = autocompleteValidator;
const _checkboxValidator: Handsontable.validators.CheckboxValidator = checkboxValidator;
const _dateValidator: Handsontable.validators.DateValidator = dateValidator;
const _dropdownValidator: Handsontable.validators.DropdownValidator = dropdownValidator;
const _intlDateValidator: Handsontable.validators.IntlDateValidator = intlDateValidator;
const _intlTimeValidator: Handsontable.validators.IntlTimeValidator = intlTimeValidator;
const _numericValidator: Handsontable.validators.NumericValidator = numericValidator;
const _timeValidator: Handsontable.validators.TimeValidator = timeValidator;

// ---------------------------------------------------------------------------
// UMD pattern: Handsontable.editors.*, Handsontable.plugins.* used as constructors
// (mirrors how CDN/browser users consume the namespace at runtime)
// ---------------------------------------------------------------------------
const UMDDateEditor = Handsontable.editors.DateEditor;
const _umdDateEditor: Handsontable.editors.DateEditor = new UMDDateEditor(hot);

const UMDAutoColumnSize = Handsontable.plugins.AutoColumnSize;
const _umdAutoColumnSize: Handsontable.plugins.AutoColumnSize = new UMDAutoColumnSize(hot);

const UMDTextRenderer = Handsontable.renderers.TextRenderer;
const _umdTextRendererResult = UMDTextRenderer(
  {} as unknown as Parameters<typeof UMDTextRenderer>[0],
  {} as HTMLTableCellElement, 0, 0, 0, null,
  {} as Parameters<typeof UMDTextRenderer>[6]
);

const UMDNumericValidator = Handsontable.validators.NumericValidator;
const _umdValidatorResult = UMDNumericValidator.call(hot as unknown as Handsontable.CellProperties, 42, () => {});

// ---------------------------------------------------------------------------
// dom namespace: Handsontable.dom.* must be properly typed (not unknown)
// ---------------------------------------------------------------------------
const _domElem = document.createElement('div');

// element helpers
const _addClass: ReturnType<typeof Handsontable.dom.addClass> = Handsontable.dom.addClass(_domElem, 'foo');
const _removeClass: ReturnType<typeof Handsontable.dom.removeClass> = Handsontable.dom.removeClass(_domElem, 'foo');
const _hasClass: boolean = Handsontable.dom.hasClass(_domElem, 'foo');
const _empty: void = Handsontable.dom.empty(_domElem);
const _getParent: HTMLElement | null = Handsontable.dom.getParent(_domElem);

// event helpers
const _domEvent = new Event('click');
const _isRightClick: boolean = Handsontable.dom.isRightClick(_domEvent);
const _isLeftClick: boolean = Handsontable.dom.isLeftClick(_domEvent);
const _stopImmediatePropagation: void = Handsontable.dom.stopImmediatePropagation(_domEvent);

// ---------------------------------------------------------------------------
// helper namespace: Handsontable.helper.* must be properly typed (not unknown)
// ---------------------------------------------------------------------------
const _arrayEach: ReturnType<typeof Handsontable.helper.arrayEach> = Handsontable.helper.arrayEach([], () => {});
const _isObject: boolean = Handsontable.helper.isObject({});
const _stringify: string = Handsontable.helper.stringify('foo');

// ---------------------------------------------------------------------------
// The type aliases on the namespace must stay the same types as the named exports. Under `node16` the default
// import used to be the module namespace, so code reads `Handsontable.Events` as well as `Events`.
// ---------------------------------------------------------------------------
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

const _sameEvents: Same<Handsontable.Events, Events> = true;
const _sameHotInstance: Same<Handsontable.HotInstance, HotInstance> = true;
const _sameRangeType: Same<Handsontable.RangeType, RangeType> = true;
const _sameOverlayType: Same<Handsontable.OverlayType, OverlayType> = true;
const _sameBaseEditorInstance: Same<Handsontable.BaseEditorInstance, BaseEditorInstance> = true;
const _sameHooksRegistry: Same<Handsontable.HooksRegistry, HooksRegistry> = true;
const _sameCellCoords: Same<Handsontable.CellCoords, CellCoords> = true;
const _sameCellRange: Same<Handsontable.CellRange, CellRange> = true;
const _sameIndexMapper: Same<Handsontable.IndexMapper, IndexMapper> = true;
const _sameSourceRowData: Same<Handsontable.SourceRowData, SourceRowData> = true;
const _sameRowIdSetting: Same<Handsontable.RowIdSetting, RowIdSetting> = true;
const _sameRowIdKey: Same<Handsontable.RowIdKey, RowIdKey> = true;
const _sameSettingsUpdate: Same<Handsontable.SettingsUpdate, SettingsUpdate> = true;
const _sameColumnDataGetterSetterFunction: Same<
  Handsontable.ColumnDataGetterSetterFunction, ColumnDataGetterSetterFunction
> = true;
const _sameSelectOptionsObject: Same<Handsontable.SelectOptionsObject, SelectOptionsObject> = true;
const _sameCellType: Same<Handsontable.CellType, CellType> = true;
const _sameEditorType: Same<Handsontable.EditorType, EditorType> = true;
const _sameRendererType: Same<Handsontable.RendererType, RendererType> = true;
const _sameValidatorType: Same<Handsontable.ValidatorType, ValidatorType> = true;
const _sameBaseTheme: Same<Handsontable.BaseTheme, BaseTheme> = true;
const _sameDensityType: Same<Handsontable.DensityType, DensityType> = true;
const _sameThemeBuilder: Same<Handsontable.ThemeBuilder, ThemeBuilder> = true;
const _sameThemeColorScheme: Same<Handsontable.ThemeColorScheme, ThemeColorScheme> = true;
const _sameThemeColorsConfig: Same<Handsontable.ThemeColorsConfig, ThemeColorsConfig> = true;
const _sameThemeConfig: Same<Handsontable.ThemeConfig, ThemeConfig> = true;
const _sameThemeDensityConfig: Same<Handsontable.ThemeDensityConfig, ThemeDensityConfig> = true;
const _sameThemeDensitySizes: Same<Handsontable.ThemeDensitySizes, ThemeDensitySizes> = true;
const _sameThemeIconsConfig: Same<Handsontable.ThemeIconsConfig, ThemeIconsConfig> = true;
const _sameThemeLightDarkValue: Same<Handsontable.ThemeLightDarkValue, ThemeLightDarkValue> = true;
const _sameThemeParams: Same<Handsontable.ThemeParams, ThemeParams> = true;
const _sameThemeSizingConfig: Same<Handsontable.ThemeSizingConfig, ThemeSizingConfig> = true;
const _sameThemeTokenValue: Same<Handsontable.ThemeTokenValue, ThemeTokenValue> = true;
const _sameThemeTokensConfig: Same<Handsontable.ThemeTokensConfig, ThemeTokensConfig> = true;
