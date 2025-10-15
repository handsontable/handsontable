/**
 * Constants for parts of translation.
 */

export const CONTEXT_MENU_ITEMS_NAMESPACE = 'ContextMenu:items';

const CM_ALIAS = CONTEXT_MENU_ITEMS_NAMESPACE;

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

export const CONTEXTMENU_ITEMS_FREEZE_COLUMN = `${CM_ALIAS}.freezeColumn`;
export const CONTEXTMENU_ITEMS_UNFREEZE_COLUMN = `${CM_ALIAS}.unfreezeColumn`;

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
export const FILTERS_CONDITIONS_BEFORE = `${FILTERS_CONDITIONS_NAMESPACE}.before`;
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

export const CHECKBOX_RENDERER_NAMESPACE = 'CheckboxRenderer:';
export const CHECKBOX_CHECKED = `${CHECKBOX_RENDERER_NAMESPACE}checked`;
export const CHECKBOX_UNCHECKED = `${CHECKBOX_RENDERER_NAMESPACE}unchecked`;

export const LOADING_NAMESPACE = 'Loading:';
export const LOADING_TITLE = `${LOADING_NAMESPACE}title`;

export const EMPTY_DATA_STATE_NAMESPACE = 'EmptyDataState:';
export const EMPTY_DATA_STATE_TITLE = `${EMPTY_DATA_STATE_NAMESPACE}title`;
export const EMPTY_DATA_STATE_DESCRIPTION = `${EMPTY_DATA_STATE_NAMESPACE}description`;
export const EMPTY_DATA_STATE_TITLE_FILTERS = `${EMPTY_DATA_STATE_NAMESPACE}title.filters`;
export const EMPTY_DATA_STATE_DESCRIPTION_FILTERS = `${EMPTY_DATA_STATE_NAMESPACE}description.filters`;
export const EMPTY_DATA_STATE_ACTION_FILTERS_BUTTONS_RESET = `${EMPTY_DATA_STATE_NAMESPACE}action.filters.buttons.reset`; // eslint-disable-line max-len
