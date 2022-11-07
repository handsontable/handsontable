/**
 * Constants for parts of translation.
 */

export const CONTEXT_MENU_ITEMS_NAMESPACE = 'ContextMenu:items';

const CM_NS = CONTEXT_MENU_ITEMS_NAMESPACE;

export const CONTEXTMENU_ITEMS_NO_ITEMS = `${CM_NS}.noItems`;
export const CONTEXTMENU_ITEMS_ROW_ABOVE = `${CM_NS}.insertRowAbove`;
export const CONTEXTMENU_ITEMS_ROW_BELOW = `${CM_NS}.insertRowBelow`;
export const CONTEXTMENU_ITEMS_INSERT_LEFT = `${CM_NS}.insertColumnOnTheLeft`;
export const CONTEXTMENU_ITEMS_INSERT_RIGHT = `${CM_NS}.insertColumnOnTheRight`;
export const CONTEXTMENU_ITEMS_REMOVE_ROW = `${CM_NS}.removeRow`;
export const CONTEXTMENU_ITEMS_REMOVE_COLUMN = `${CM_NS}.removeColumn`;
export const CONTEXTMENU_ITEMS_UNDO = `${CM_NS}.undo`;
export const CONTEXTMENU_ITEMS_REDO = `${CM_NS}.redo`;
export const CONTEXTMENU_ITEMS_READ_ONLY = `${CM_NS}.readOnly`;
export const CONTEXTMENU_ITEMS_CLEAR_COLUMN = `${CM_NS}.clearColumn`;

export const CONTEXTMENU_ITEMS_COPY = `${CM_NS}.copy`;
export const CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_HEADERS = `${CM_NS}.copyWithHeaders`;
export const CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_GROUP_HEADERS = `${CM_NS}.copyWithGroupHeaders`;
export const CONTEXTMENU_ITEMS_COPY_COLUMN_HEADERS_ONLY = `${CM_NS}.copyHeadersOnly`;
export const CONTEXTMENU_ITEMS_CUT = `${CM_NS}.cut`;

export const CONTEXTMENU_ITEMS_FREEZE_COLUMN = `${CM_NS}.freezeColumn`;
export const CONTEXTMENU_ITEMS_UNFREEZE_COLUMN = `${CM_NS}.unfreezeColumn`;

export const CONTEXTMENU_ITEMS_MERGE_CELLS = `${CM_NS}.mergeCells`;
export const CONTEXTMENU_ITEMS_UNMERGE_CELLS = `${CM_NS}.unmergeCells`;

export const CONTEXTMENU_ITEMS_ADD_COMMENT = `${CM_NS}.addComment`;
export const CONTEXTMENU_ITEMS_EDIT_COMMENT = `${CM_NS}.editComment`;
export const CONTEXTMENU_ITEMS_REMOVE_COMMENT = `${CM_NS}.removeComment`;
export const CONTEXTMENU_ITEMS_READ_ONLY_COMMENT = `${CM_NS}.readOnlyComment`;

export const CONTEXTMENU_ITEMS_ALIGNMENT = `${CM_NS}.align`;
export const CONTEXTMENU_ITEMS_ALIGNMENT_LEFT = `${CM_NS}.align.left`;
export const CONTEXTMENU_ITEMS_ALIGNMENT_CENTER = `${CM_NS}.align.center`;
export const CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT = `${CM_NS}.align.right`;
export const CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY = `${CM_NS}.align.justify`;
export const CONTEXTMENU_ITEMS_ALIGNMENT_TOP = `${CM_NS}.align.top`;
export const CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE = `${CM_NS}.align.middle`;
export const CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM = `${CM_NS}.align.bottom`;

export const CONTEXTMENU_ITEMS_BORDERS = `${CM_NS}.borders`;
export const CONTEXTMENU_ITEMS_BORDERS_TOP = `${CM_NS}.borders.top`;
export const CONTEXTMENU_ITEMS_BORDERS_RIGHT = `${CM_NS}.borders.right`;
export const CONTEXTMENU_ITEMS_BORDERS_BOTTOM = `${CM_NS}.borders.bottom`;
export const CONTEXTMENU_ITEMS_BORDERS_LEFT = `${CM_NS}.borders.left`;
export const CONTEXTMENU_ITEMS_REMOVE_BORDERS = `${CM_NS}.borders.remove`;

export const CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD = `${CM_NS}.nestedHeaders.insertChildRow`; // eslint-disable-line max-len
export const CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD = `${CM_NS}.nestedHeaders.detachFromParent`; // eslint-disable-line max-len

export const CONTEXTMENU_ITEMS_HIDE_COLUMN = `${CM_NS}.hideColumn`;
export const CONTEXTMENU_ITEMS_SHOW_COLUMN = `${CM_NS}.showColumn`;

export const CONTEXTMENU_ITEMS_HIDE_ROW = `${CM_NS}.hideRow`;
export const CONTEXTMENU_ITEMS_SHOW_ROW = `${CM_NS}.showRow`;

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
