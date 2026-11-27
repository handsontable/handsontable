/**
 * Constants for parts of translation.
 */

export const COMMON_NAMESPACE = 'Common:';

export const OK = `${COMMON_NAMESPACE}ok`;
export const CANCEL = `${COMMON_NAMESPACE}cancel`;

export const CONTEXT_MENU_ITEMS_NAMESPACE = 'ContextMenu:items';

const CM_ALIAS = CONTEXT_MENU_ITEMS_NAMESPACE;

export const CONTEXTMENU_LABEL = 'ContextMenu:label';
export const DROPDOWNMENU_LABEL = 'DropdownMenu:label';

export const CONTEXTMENU_ITEMS_NO_ITEMS = `${CM_ALIAS}.noItems`;
export const CONTEXTMENU_ITEMS_ROW_ABOVE = `${CM_ALIAS}.insertRowAbove`;
export const CONTEXTMENU_ITEMS_ROW_BELOW = `${CM_ALIAS}.insertRowBelow`;
export const CONTEXTMENU_ITEMS_INSERT_LEFT = `${CM_ALIAS}.insertColumnOnTheLeft`;
export const CONTEXTMENU_ITEMS_INSERT_RIGHT = `${CM_ALIAS}.insertColumnOnTheRight`;
export const CONTEXTMENU_ITEMS_REMOVE_ROW = `${CM_ALIAS}.removeRow`;
export const CONTEXTMENU_ITEMS_REMOVE_COLUMN = `${CM_ALIAS}.removeColumn`;
export const CONTEXTMENU_ITEMS_UNDO = `${CM_ALIAS}.undo`;
export const CONTEXTMENU_ITEMS_REDO = `${CM_ALIAS}.redo`;
export const CONTEXTMENU_ITEMS_READ_ONLY = `${CM_ALIAS}.readOnly`;
export const CONTEXTMENU_ITEMS_CLEAR_COLUMN = `${CM_ALIAS}.clearColumn`;

export const CONTEXTMENU_ITEMS_COPY = `${CM_ALIAS}.copy`;
export const CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_HEADERS = `${CM_ALIAS}.copyWithHeaders`;
export const CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_GROUP_HEADERS = `${CM_ALIAS}.copyWithGroupHeaders`;
export const CONTEXTMENU_ITEMS_COPY_COLUMN_HEADERS_ONLY = `${CM_ALIAS}.copyHeadersOnly`;
export const CONTEXTMENU_ITEMS_CUT = `${CM_ALIAS}.cut`;

export const CONTEXTMENU_ITEMS_EXPORT = `${CM_ALIAS}.export`;
export const CONTEXTMENU_ITEMS_EXPORT_FILE_CSV = `${CM_ALIAS}.exportFileCsv`;
export const CONTEXTMENU_ITEMS_EXPORT_FILE_XLSX = `${CM_ALIAS}.exportFileXlsx`;

export const CONTEXTMENU_ITEMS_FREEZE_COLUMN = `${CM_ALIAS}.freezeColumn`;
export const CONTEXTMENU_ITEMS_UNFREEZE_COLUMN = `${CM_ALIAS}.unfreezeColumn`;
export const CONTEXTMENU_ITEMS_MOVE_COLUMN_LEFT = `${CM_ALIAS}.moveColumnLeft`;
export const CONTEXTMENU_ITEMS_MOVE_COLUMN_RIGHT = `${CM_ALIAS}.moveColumnRight`;
export const CONTEXTMENU_ITEMS_MOVE_ROW_UP = `${CM_ALIAS}.moveRowUp`;
export const CONTEXTMENU_ITEMS_MOVE_ROW_DOWN = `${CM_ALIAS}.moveRowDown`;

export const CONTEXTMENU_ITEMS_RENAME_HEADER = `${CM_ALIAS}.renameHeader`;

export const CONTEXTMENU_ITEMS_MERGE_CELLS = `${CM_ALIAS}.mergeCells`;
export const CONTEXTMENU_ITEMS_UNMERGE_CELLS = `${CM_ALIAS}.unmergeCells`;

export const CONTEXTMENU_ITEMS_ADD_COMMENT = `${CM_ALIAS}.addComment`;
export const CONTEXTMENU_ITEMS_EDIT_COMMENT = `${CM_ALIAS}.editComment`;
export const CONTEXTMENU_ITEMS_REMOVE_COMMENT = `${CM_ALIAS}.removeComment`;
export const CONTEXTMENU_ITEMS_READ_ONLY_COMMENT = `${CM_ALIAS}.readOnlyComment`;

export const CONTEXTMENU_ITEMS_ALIGNMENT = `${CM_ALIAS}.align`;
export const CONTEXTMENU_ITEMS_ALIGNMENT_LEFT = `${CM_ALIAS}.align.left`;
export const CONTEXTMENU_ITEMS_ALIGNMENT_CENTER = `${CM_ALIAS}.align.center`;
export const CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT = `${CM_ALIAS}.align.right`;
export const CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY = `${CM_ALIAS}.align.justify`;
export const CONTEXTMENU_ITEMS_ALIGNMENT_TOP = `${CM_ALIAS}.align.top`;
export const CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE = `${CM_ALIAS}.align.middle`;
export const CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM = `${CM_ALIAS}.align.bottom`;

export const CONTEXTMENU_ITEMS_BORDERS = `${CM_ALIAS}.borders`;
export const CONTEXTMENU_ITEMS_BORDERS_TOP = `${CM_ALIAS}.borders.top`;
export const CONTEXTMENU_ITEMS_BORDERS_RIGHT = `${CM_ALIAS}.borders.right`;
export const CONTEXTMENU_ITEMS_BORDERS_BOTTOM = `${CM_ALIAS}.borders.bottom`;
export const CONTEXTMENU_ITEMS_BORDERS_LEFT = `${CM_ALIAS}.borders.left`;
export const CONTEXTMENU_ITEMS_REMOVE_BORDERS = `${CM_ALIAS}.borders.remove`;

export const CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD = `${CM_ALIAS}.nestedHeaders.insertChildRow`; // eslint-disable-line max-len
export const CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD = `${CM_ALIAS}.nestedHeaders.detachFromParent`; // eslint-disable-line max-len

export const CONTEXTMENU_ITEMS_HIDE_COLUMN = `${CM_ALIAS}.hideColumn`;
export const CONTEXTMENU_ITEMS_SHOW_COLUMN = `${CM_ALIAS}.showColumn`;

export const CONTEXTMENU_ITEMS_HIDE_ROW = `${CM_ALIAS}.hideRow`;
export const CONTEXTMENU_ITEMS_SHOW_ROW = `${CM_ALIAS}.showRow`;

export const FILTERS_NAMESPACE = 'Filters:';
export const FILTERS_CONDITIONS_NAMESPACE = `${FILTERS_NAMESPACE}conditions`;
export const FILTERS_CONDITIONS_NONE = `${FILTERS_CONDITIONS_NAMESPACE}.none`;
export const FILTERS_CONDITIONS_EMPTY = `${FILTERS_CONDITIONS_NAMESPACE}.isEmpty`;
export const FILTERS_CONDITIONS_NOT_EMPTY = `${FILTERS_CONDITIONS_NAMESPACE}.isNotEmpty`;
export const FILTERS_CONDITIONS_CHECKED = `${FILTERS_CONDITIONS_NAMESPACE}.isChecked`;
export const FILTERS_CONDITIONS_UNCHECKED = `${FILTERS_CONDITIONS_NAMESPACE}.isUnchecked`;
export const FILTERS_CONDITIONS_EQUAL = `${FILTERS_CONDITIONS_NAMESPACE}.isEqualTo`;
export const FILTERS_CONDITIONS_NOT_EQUAL = `${FILTERS_CONDITIONS_NAMESPACE}.isNotEqualTo`;
export const FILTERS_CONDITIONS_BEGINS_WITH = `${FILTERS_CONDITIONS_NAMESPACE}.beginsWith`;
export const FILTERS_CONDITIONS_ENDS_WITH = `${FILTERS_CONDITIONS_NAMESPACE}.endsWith`;
export const FILTERS_CONDITIONS_CONTAINS = `${FILTERS_CONDITIONS_NAMESPACE}.contains`;
export const FILTERS_CONDITIONS_NOT_CONTAIN = `${FILTERS_CONDITIONS_NAMESPACE}.doesNotContain`;
export const FILTERS_CONDITIONS_BY_VALUE = `${FILTERS_CONDITIONS_NAMESPACE}.byValue`;
export const FILTERS_CONDITIONS_GREATER_THAN = `${FILTERS_CONDITIONS_NAMESPACE}.greaterThan`;
export const FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL = `${FILTERS_CONDITIONS_NAMESPACE}.greaterThanOrEqualTo`;
export const FILTERS_CONDITIONS_LESS_THAN = `${FILTERS_CONDITIONS_NAMESPACE}.lessThan`;
export const FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL = `${FILTERS_CONDITIONS_NAMESPACE}.lessThanOrEqualTo`;
export const FILTERS_CONDITIONS_BETWEEN = `${FILTERS_CONDITIONS_NAMESPACE}.isBetween`;
export const FILTERS_CONDITIONS_NOT_BETWEEN = `${FILTERS_CONDITIONS_NAMESPACE}.isNotBetween`;
export const FILTERS_CONDITIONS_AFTER = `${FILTERS_CONDITIONS_NAMESPACE}.after`;
export const FILTERS_CONDITIONS_AFTER_OR_EQUAL = `${FILTERS_CONDITIONS_NAMESPACE}.afterOrEqual`;
export const FILTERS_CONDITIONS_BEFORE = `${FILTERS_CONDITIONS_NAMESPACE}.before`;
export const FILTERS_CONDITIONS_BEFORE_OR_EQUAL = `${FILTERS_CONDITIONS_NAMESPACE}.beforeOrEqual`;
export const FILTERS_CONDITIONS_TODAY = `${FILTERS_CONDITIONS_NAMESPACE}.today`;
export const FILTERS_CONDITIONS_TOMORROW = `${FILTERS_CONDITIONS_NAMESPACE}.tomorrow`;
export const FILTERS_CONDITIONS_YESTERDAY = `${FILTERS_CONDITIONS_NAMESPACE}.yesterday`;

export const FILTERS_DIVS_FILTER_BY_CONDITION = `${FILTERS_NAMESPACE}labels.filterByCondition`;
export const FILTERS_DIVS_FILTER_BY_VALUE = `${FILTERS_NAMESPACE}labels.filterByValue`;

export const FILTERS_LABELS_CONJUNCTION = `${FILTERS_NAMESPACE}labels.conjunction`;
export const FILTERS_LABELS_DISJUNCTION = `${FILTERS_NAMESPACE}labels.disjunction`;

export const FILTERS_VALUES_BLANK_CELLS = `${FILTERS_NAMESPACE}values.blankCells`;

export const FILTERS_BUTTONS_SELECT_ALL = `${FILTERS_NAMESPACE}buttons.selectAll`;
export const FILTERS_BUTTONS_CLEAR = `${FILTERS_NAMESPACE}buttons.clear`;
export const FILTERS_BUTTONS_OK = `${FILTERS_NAMESPACE}buttons.ok`;
export const FILTERS_BUTTONS_CANCEL = `${FILTERS_NAMESPACE}buttons.cancel`;

export const FILTERS_BUTTONS_PLACEHOLDER_SEARCH = `${FILTERS_NAMESPACE}buttons.placeholder.search`;
export const FILTERS_BUTTONS_PLACEHOLDER_VALUE = `${FILTERS_NAMESPACE}buttons.placeholder.value`;
export const FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE = `${FILTERS_NAMESPACE}buttons.placeholder.secondValue`;

export const PAGINATION_NAMESPACE = 'Pagination:';
export const PAGINATION_SECTION = `${PAGINATION_NAMESPACE}section.pagination`;
export const PAGINATION_PAGE_SIZE_AUTO = `${PAGINATION_NAMESPACE}.pageSize.auto`;
export const PAGINATION_PAGE_SIZE_SECTION = `${PAGINATION_NAMESPACE}section.pageSize`;
export const PAGINATION_COUNTER_SECTION = `${PAGINATION_NAMESPACE}section.counter`;
export const PAGINATION_NAV_SECTION = `${PAGINATION_NAMESPACE}section.navigation`;
export const PAGINATION_FIRST_PAGE = `${PAGINATION_NAMESPACE}firstPage`;
export const PAGINATION_PREV_PAGE = `${PAGINATION_NAMESPACE}prevPage`;
export const PAGINATION_NEXT_PAGE = `${PAGINATION_NAMESPACE}nextPage`;
export const PAGINATION_LAST_PAGE = `${PAGINATION_NAMESPACE}lastPage`;

export const SHEETS_BAR_NAMESPACE = 'SheetsBar:';
export const SHEETS_BAR_SECTION = `${SHEETS_BAR_NAMESPACE}section.sheetsBar`;
export const SHEETS_BAR_ADD_SHEET = `${SHEETS_BAR_NAMESPACE}addSheet`;
export const SHEETS_BAR_ALL_SHEETS = `${SHEETS_BAR_NAMESPACE}allSheets`;
export const SHEETS_BAR_SHEET_MENU = `${SHEETS_BAR_NAMESPACE}sheetMenu`;
export const SHEETS_BAR_RENAME_SHEET = `${SHEETS_BAR_NAMESPACE}renameSheet`;
export const SHEETS_BAR_ITEMS_DELETE = `${SHEETS_BAR_NAMESPACE}items.delete`;
export const SHEETS_BAR_ITEMS_DUPLICATE = `${SHEETS_BAR_NAMESPACE}items.duplicate`;
export const SHEETS_BAR_ITEMS_RENAME = `${SHEETS_BAR_NAMESPACE}items.rename`;
export const SHEETS_BAR_ITEMS_MOVE_RIGHT = `${SHEETS_BAR_NAMESPACE}items.moveRight`;
export const SHEETS_BAR_ITEMS_MOVE_LEFT = `${SHEETS_BAR_NAMESPACE}items.moveLeft`;
export const SHEETS_BAR_PAGE_PREV = `${SHEETS_BAR_NAMESPACE}pagePrev`;
export const SHEETS_BAR_PAGE_NEXT = `${SHEETS_BAR_NAMESPACE}pageNext`;
export const SHEETS_BAR_SHEET_CHANGED = `${SHEETS_BAR_NAMESPACE}announcement.sheetChanged`;
export const SHEETS_BAR_RENAME_REJECTED = `${SHEETS_BAR_NAMESPACE}announcement.renameRejected`;
export const SHEETS_BAR_RENAME_NOT_CHANGED = `${SHEETS_BAR_NAMESPACE}announcement.renameNotChanged`;
export const SHEETS_BAR_SHEET_DUPLICATED = `${SHEETS_BAR_NAMESPACE}announcement.sheetDuplicated`;
export const SHEETS_BAR_SHEET_MOVED = `${SHEETS_BAR_NAMESPACE}announcement.sheetMoved`;
export const SHEETS_BAR_DEFAULT_SHEET_NAME = `${SHEETS_BAR_NAMESPACE}defaultSheetName`;

export const CHECKBOX_RENDERER_NAMESPACE = 'CheckboxRenderer:';
export const CHECKBOX_CHECKED = `${CHECKBOX_RENDERER_NAMESPACE}checked`;
export const CHECKBOX_UNCHECKED = `${CHECKBOX_RENDERER_NAMESPACE}unchecked`;
export const CHECKBOX_HEADER_CHECK_ALL = `${CHECKBOX_RENDERER_NAMESPACE}headerCheckAll`;

export const LOADING_NAMESPACE = 'Loading:';
export const LOADING_TITLE = `${LOADING_NAMESPACE}title`;

export const NOTIFICATION_NAMESPACE = 'Notification:';
export const NOTIFICATION_BUTTONS_CLOSE = `${NOTIFICATION_NAMESPACE}buttons.close`;

export const EXPORT_FILE_NAMESPACE = 'ExportFile:';
export const EXPORT_FILE_DIALOG_TITLE = `${EXPORT_FILE_NAMESPACE}dialog.title`;

export const EMPTY_DATA_STATE_NAMESPACE = 'EmptyDataState:';
export const EMPTY_DATA_STATE_TITLE = `${EMPTY_DATA_STATE_NAMESPACE}title`;
export const EMPTY_DATA_STATE_DESCRIPTION = `${EMPTY_DATA_STATE_NAMESPACE}description`;
export const EMPTY_DATA_STATE_TITLE_FILTERS = `${EMPTY_DATA_STATE_NAMESPACE}title.filters`;
export const EMPTY_DATA_STATE_DESCRIPTION_FILTERS = `${EMPTY_DATA_STATE_NAMESPACE}description.filters`;
export const EMPTY_DATA_STATE_BUTTONS_FILTERS_RESET = `${EMPTY_DATA_STATE_NAMESPACE}buttons.filters.reset`;
export const EMPTY_DATA_STATE_TITLE_LOADING = `${EMPTY_DATA_STATE_NAMESPACE}title.loading`;
export const EMPTY_DATA_STATE_DESCRIPTION_LOADING = `${EMPTY_DATA_STATE_NAMESPACE}description.loading`;
export const EMPTY_DATA_STATE_LOADED = `${EMPTY_DATA_STATE_NAMESPACE}loaded`;

export const DATA_PROVIDER_NAMESPACE = 'DataProvider:';
export const DATA_PROVIDER_ERRORS_FETCH = `${DATA_PROVIDER_NAMESPACE}errors.fetch`;
export const DATA_PROVIDER_ERRORS_CREATE = `${DATA_PROVIDER_NAMESPACE}errors.create`;
export const DATA_PROVIDER_ERRORS_UPDATE = `${DATA_PROVIDER_NAMESPACE}errors.update`;
export const DATA_PROVIDER_ERRORS_REMOVE = `${DATA_PROVIDER_NAMESPACE}errors.remove`;
export const DATA_PROVIDER_ERRORS_REQUEST_FAILED = `${DATA_PROVIDER_NAMESPACE}errors.requestFailed`;
export const DATA_PROVIDER_BUTTONS_REFETCH = `${DATA_PROVIDER_NAMESPACE}buttons.refetch`;

export const ROW_SELECTION_NAMESPACE = 'RowSelection:';
export const ROW_SELECTION_SELECT_ROW = `${ROW_SELECTION_NAMESPACE}selectRow`;
export const ROW_SELECTION_SELECT_ALL = `${ROW_SELECTION_NAMESPACE}selectAll`;
export const ROW_SELECTION_ANNOUNCE_ROW_SELECTED = `${ROW_SELECTION_NAMESPACE}announce.rowSelected`;
export const ROW_SELECTION_ANNOUNCE_ROW_DESELECTED = `${ROW_SELECTION_NAMESPACE}announce.rowDeselected`;
export const ROW_SELECTION_ANNOUNCE_COUNT = `${ROW_SELECTION_NAMESPACE}announce.count`;
export const ROW_SELECTION_MENU_REMOVE = `${ROW_SELECTION_NAMESPACE}menu.removeSelectedRows`;
export const ROW_SELECTION_MENU_CLEAR = `${ROW_SELECTION_NAMESPACE}menu.clearSelection`;

export const FREEZE_BAR_NAMESPACE = 'FreezeBar:';
export const FREEZE_BAR_ROWS_TOP = `${FREEZE_BAR_NAMESPACE}rows.top`;
export const FREEZE_BAR_ROWS_BOTTOM = `${FREEZE_BAR_NAMESPACE}rows.bottom`;
export const FREEZE_BAR_COLUMNS_START = `${FREEZE_BAR_NAMESPACE}columns.start`;
export const FREEZE_BAR_COLUMNS_END = `${FREEZE_BAR_NAMESPACE}columns.end`;

export const ARMED_PICK_NAMESPACE = 'ArmedPick:';
export const ARMED_PICK_STARTED = `${ARMED_PICK_NAMESPACE}started`;
export const ARMED_PICK_CANCELED = `${ARMED_PICK_NAMESPACE}canceled`;

export const MANUAL_RESIZE_NAMESPACE = 'ManualResize:';
export const MANUAL_RESIZE_COLUMN_STARTED = `${MANUAL_RESIZE_NAMESPACE}columnStarted`;
export const MANUAL_RESIZE_ROW_STARTED = `${MANUAL_RESIZE_NAMESPACE}rowStarted`;
export const MANUAL_RESIZE_COMMENT_STARTED = `${MANUAL_RESIZE_NAMESPACE}commentStarted`;
export const MANUAL_RESIZE_WIDTH = `${MANUAL_RESIZE_NAMESPACE}width`;
export const MANUAL_RESIZE_HEIGHT = `${MANUAL_RESIZE_NAMESPACE}height`;

export const MANUAL_MOVE_NAMESPACE = 'ManualMove:';
export const MANUAL_MOVE_COLUMN_STARTED = `${MANUAL_MOVE_NAMESPACE}columnStarted`;
export const MANUAL_MOVE_ROW_STARTED = `${MANUAL_MOVE_NAMESPACE}rowStarted`;
export const MANUAL_MOVE_COLUMN_POSITION = `${MANUAL_MOVE_NAMESPACE}columnPosition`;
export const MANUAL_MOVE_ROW_POSITION = `${MANUAL_MOVE_NAMESPACE}rowPosition`;
export const MANUAL_MOVE_BLOCKED = `${MANUAL_MOVE_NAMESPACE}blocked`;

export const CELL_DESCRIPTION_NAMESPACE = 'CellDescription:';
export const CELL_DESCRIPTION_READ_ONLY = `${CELL_DESCRIPTION_NAMESPACE}readOnly`;
export const CELL_DESCRIPTION_LINK = `${CELL_DESCRIPTION_NAMESPACE}link`;
export const CELL_DESCRIPTION_MERGED = `${CELL_DESCRIPTION_NAMESPACE}merged`;

export const FORMULAS_NAMESPACE = 'Formulas:';
export const FORMULAS_CELL_DESCRIPTION = `${FORMULAS_NAMESPACE}cellDescription`;

export const NESTED_ROWS_NAMESPACE = 'NestedRows:';
export const NESTED_ROWS_ANNOUNCEMENT_EXPANDED = `${NESTED_ROWS_NAMESPACE}announcement.expanded`;
export const NESTED_ROWS_ANNOUNCEMENT_COLLAPSED = `${NESTED_ROWS_NAMESPACE}announcement.collapsed`;
export const NESTED_ROWS_ANNOUNCEMENT_LEVEL = `${NESTED_ROWS_NAMESPACE}announcement.level`;
export const NESTED_ROWS_ANNOUNCEMENT_LEVEL_EXPANDED = `${NESTED_ROWS_NAMESPACE}announcement.level.expanded`;
export const NESTED_ROWS_ANNOUNCEMENT_LEVEL_COLLAPSED = `${NESTED_ROWS_NAMESPACE}announcement.level.collapsed`;

export const COLLAPSIBLE_COLUMNS_NAMESPACE = 'CollapsibleColumns:';
export const COLLAPSIBLE_COLUMNS_ANNOUNCEMENT_EXPANDED = `${COLLAPSIBLE_COLUMNS_NAMESPACE}announcement.expanded`;
export const COLLAPSIBLE_COLUMNS_ANNOUNCEMENT_COLLAPSED = `${COLLAPSIBLE_COLUMNS_NAMESPACE}announcement.collapsed`;

export const COLUMN_SORTING_NAMESPACE = 'ColumnSorting:';
export const COLUMN_SORTING_ANNOUNCEMENT_ASCENDING = `${COLUMN_SORTING_NAMESPACE}announcement.ascending`;
export const COLUMN_SORTING_ANNOUNCEMENT_DESCENDING = `${COLUMN_SORTING_NAMESPACE}announcement.descending`;
export const COLUMN_SORTING_ANNOUNCEMENT_REMOVED = `${COLUMN_SORTING_NAMESPACE}announcement.removed`;
export const COLUMN_SORTING_ANNOUNCEMENT_ASCENDING_PRIORITY =
  `${COLUMN_SORTING_NAMESPACE}announcement.ascending.priority`;
export const COLUMN_SORTING_ANNOUNCEMENT_DESCENDING_PRIORITY =
  `${COLUMN_SORTING_NAMESPACE}announcement.descending.priority`;

export const SELECTION_NAMESPACE = 'Selection:';
export const SELECTION_ANNOUNCEMENT_RANGE = `${SELECTION_NAMESPACE}announcement.range`;
export const SELECTION_ANNOUNCEMENT_ALL = `${SELECTION_NAMESPACE}announcement.all`;
export const SELECTION_ANNOUNCEMENT_COLUMN = `${SELECTION_NAMESPACE}announcement.column`;
export const SELECTION_ANNOUNCEMENT_COLUMNS = `${SELECTION_NAMESPACE}announcement.columns`;
export const SELECTION_ANNOUNCEMENT_ROW = `${SELECTION_NAMESPACE}announcement.row`;
export const SELECTION_ANNOUNCEMENT_ROWS = `${SELECTION_NAMESPACE}announcement.rows`;
export const SELECTION_ANNOUNCEMENT_ADDED = `${SELECTION_NAMESPACE}announcement.added`;
export const SELECTION_ANNOUNCEMENT_ADDED_CELL = `${SELECTION_NAMESPACE}announcement.added.cell`;
export const SELECTION_ANNOUNCEMENT_ADDED_RANGE = `${SELECTION_NAMESPACE}announcement.added.range`;
export const SELECTION_ANNOUNCEMENT_ADDED_ALL = `${SELECTION_NAMESPACE}announcement.added.all`;
export const SELECTION_ANNOUNCEMENT_ADDED_COLUMN = `${SELECTION_NAMESPACE}announcement.added.column`;
export const SELECTION_ANNOUNCEMENT_ADDED_COLUMNS = `${SELECTION_NAMESPACE}announcement.added.columns`;
export const SELECTION_ANNOUNCEMENT_ADDED_ROW = `${SELECTION_NAMESPACE}announcement.added.row`;
export const SELECTION_ANNOUNCEMENT_ADDED_ROWS = `${SELECTION_NAMESPACE}announcement.added.rows`;

export const FORMULA_BUILDER_NAMESPACE = 'FormulaBuilder:';
export const FORMULA_BUILDER_EDITOR = `${FORMULA_BUILDER_NAMESPACE}labels.formulaEditor`;
export const FORMULA_BUILDER_INPUT = `${FORMULA_BUILDER_NAMESPACE}labels.formulaInput`;
export const FORMULA_BUILDER_CELL_ADDRESS = `${FORMULA_BUILDER_NAMESPACE}labels.cellAddress`;
export const FORMULA_BUILDER_SUGGESTIONS = `${FORMULA_BUILDER_NAMESPACE}labels.formulaSuggestions`;
export const FORMULA_BUILDER_ACCEPT_HINT = `${FORMULA_BUILDER_NAMESPACE}hints.acceptSuggestion`;
export const FORMULA_BUILDER_NAVIGATE_HINT = `${FORMULA_BUILDER_NAMESPACE}hints.navigateSuggestions`;
export const FORMULA_BUILDER_FUNCTION_HELP = `${FORMULA_BUILDER_NAMESPACE}labels.functionHelp`;
export const FORMULA_BUILDER_FUNCTION_HELP_FOR = `${FORMULA_BUILDER_NAMESPACE}labels.functionHelpFor`;
export const FORMULA_BUILDER_FUNCTION_EXAMPLE = `${FORMULA_BUILDER_NAMESPACE}labels.functionExample`;
export const FORMULA_BUILDER_FUNCTION_DESCRIPTION = `${FORMULA_BUILDER_NAMESPACE}labels.functionDescription`;
export const FORMULA_BUILDER_OPTIONAL_ARGUMENT = `${FORMULA_BUILDER_NAMESPACE}labels.optionalArgument`;
export const FORMULA_BUILDER_REPEATABLE_ARGUMENT = `${FORMULA_BUILDER_NAMESPACE}labels.repeatableArgument`;
export const FORMULA_BUILDER_LEARN_MORE = `${FORMULA_BUILDER_NAMESPACE}labels.learnMore`;
export const FORMULA_BUILDER_CLOSE = `${FORMULA_BUILDER_NAMESPACE}labels.close`;
export const FORMULA_BUILDER_INVALID_ADDRESS = `${FORMULA_BUILDER_NAMESPACE}announce.invalidCellAddress`;
export const FORMULA_BUILDER_CELL_UNAVAILABLE = `${FORMULA_BUILDER_NAMESPACE}announce.cellUnavailable`;
export const FORMULA_BUILDER_CELL_ERROR = `${FORMULA_BUILDER_NAMESPACE}announce.cellError`;
export const FORMULA_BUILDER_DEPENDENT_ERROR = `${FORMULA_BUILDER_NAMESPACE}announce.dependentCellError`;
export const FORMULA_BUILDER_DEPENDENT_ERRORS = `${FORMULA_BUILDER_NAMESPACE}announce.dependentCellErrors`;

export const EDITOR_NAMESPACE = 'Editor:';
export const EDITOR_INPUT_LABEL = `${EDITOR_NAMESPACE}labels.cellInput`;
export const EDITOR_INPUT_LABEL_ROW_HEADER = `${EDITOR_NAMESPACE}labels.cellInputWithRowHeader`;

export const COMMENTS_NAMESPACE = 'Comments:';
export const COMMENTS_EDITOR_LABEL = `${COMMENTS_NAMESPACE}labels.editor`;
export const COMMENTS_EDITOR_LABEL_ROW_HEADER = `${COMMENTS_NAMESPACE}labels.editorWithRowHeader`;

export const EDITABLE_HEADERS_NAMESPACE = 'EditableHeaders:';
export const EDITABLE_HEADERS_INPUT_LABEL = `${EDITABLE_HEADERS_NAMESPACE}inputLabel`;
export const EDITABLE_HEADERS_RENAMED = `${EDITABLE_HEADERS_NAMESPACE}announcement.renamed`;
