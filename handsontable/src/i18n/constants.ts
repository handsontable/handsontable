/**
 * Constants for parts of translation.
 */

export const CONTEXT_MENU_ITEMS_NAMESPACE: string = 'ContextMenu:items';

const CM_ALIAS: string = CONTEXT_MENU_ITEMS_NAMESPACE;

export const CONTEXTMENU_ITEMS_NO_ITEMS: string = `${CM_ALIAS}.noItems`;
export const CONTEXTMENU_ITEMS_ROW_ABOVE: string = `${CM_ALIAS}.insertRowAbove`;
export const CONTEXTMENU_ITEMS_ROW_BELOW: string = `${CM_ALIAS}.insertRowBelow`;
export const CONTEXTMENU_ITEMS_INSERT_LEFT: string = `${CM_ALIAS}.insertColumnOnTheLeft`;
export const CONTEXTMENU_ITEMS_INSERT_RIGHT: string = `${CM_ALIAS}.insertColumnOnTheRight`;
export const CONTEXTMENU_ITEMS_REMOVE_ROW: string = `${CM_ALIAS}.removeRow`;
export const CONTEXTMENU_ITEMS_REMOVE_COLUMN: string = `${CM_ALIAS}.removeColumn`;
export const CONTEXTMENU_ITEMS_UNDO: string = `${CM_ALIAS}.undo`;
export const CONTEXTMENU_ITEMS_REDO: string = `${CM_ALIAS}.redo`;
export const CONTEXTMENU_ITEMS_READ_ONLY: string = `${CM_ALIAS}.readOnly`;
export const CONTEXTMENU_ITEMS_CLEAR_COLUMN: string = `${CM_ALIAS}.clearColumn`;

export const CONTEXTMENU_ITEMS_COPY: string = `${CM_ALIAS}.copy`;
export const CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_HEADERS: string = `${CM_ALIAS}.copyWithHeaders`;
export const CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_GROUP_HEADERS: string = `${CM_ALIAS}.copyWithGroupHeaders`;
export const CONTEXTMENU_ITEMS_COPY_COLUMN_HEADERS_ONLY: string = `${CM_ALIAS}.copyHeadersOnly`;
export const CONTEXTMENU_ITEMS_CUT: string = `${CM_ALIAS}.cut`;

export const CONTEXTMENU_ITEMS_FREEZE_COLUMN: string = `${CM_ALIAS}.freezeColumn`;
export const CONTEXTMENU_ITEMS_UNFREEZE_COLUMN: string = `${CM_ALIAS}.unfreezeColumn`;

export const CONTEXTMENU_ITEMS_MERGE_CELLS: string = `${CM_ALIAS}.mergeCells`;
export const CONTEXTMENU_ITEMS_UNMERGE_CELLS: string = `${CM_ALIAS}.unmergeCells`;

export const CONTEXTMENU_ITEMS_ADD_COMMENT: string = `${CM_ALIAS}.addComment`;
export const CONTEXTMENU_ITEMS_EDIT_COMMENT: string = `${CM_ALIAS}.editComment`;
export const CONTEXTMENU_ITEMS_REMOVE_COMMENT: string = `${CM_ALIAS}.removeComment`;
export const CONTEXTMENU_ITEMS_READ_ONLY_COMMENT: string = `${CM_ALIAS}.readOnlyComment`;

export const CONTEXTMENU_ITEMS_ALIGNMENT: string = `${CM_ALIAS}.align`;
export const CONTEXTMENU_ITEMS_ALIGNMENT_LEFT: string = `${CM_ALIAS}.align.left`;
export const CONTEXTMENU_ITEMS_ALIGNMENT_CENTER: string = `${CM_ALIAS}.align.center`;
export const CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT: string = `${CM_ALIAS}.align.right`;
export const CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY: string = `${CM_ALIAS}.align.justify`;
export const CONTEXTMENU_ITEMS_ALIGNMENT_TOP: string = `${CM_ALIAS}.align.top`;
export const CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE: string = `${CM_ALIAS}.align.middle`;
export const CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM: string = `${CM_ALIAS}.align.bottom`;

export const CONTEXTMENU_ITEMS_BORDERS: string = `${CM_ALIAS}.borders`;
export const CONTEXTMENU_ITEMS_BORDERS_TOP: string = `${CM_ALIAS}.borders.top`;
export const CONTEXTMENU_ITEMS_BORDERS_RIGHT: string = `${CM_ALIAS}.borders.right`;
export const CONTEXTMENU_ITEMS_BORDERS_BOTTOM: string = `${CM_ALIAS}.borders.bottom`;
export const CONTEXTMENU_ITEMS_BORDERS_LEFT: string = `${CM_ALIAS}.borders.left`;
export const CONTEXTMENU_ITEMS_REMOVE_BORDERS: string = `${CM_ALIAS}.borders.remove`;

export const CONTEXTMENU_ITEMS_NESTED_ROWS_INSERT_CHILD: string = `${CM_ALIAS}.nestedHeaders.insertChildRow`; // eslint-disable-line max-len
export const CONTEXTMENU_ITEMS_NESTED_ROWS_DETACH_CHILD: string = `${CM_ALIAS}.nestedHeaders.detachFromParent`; // eslint-disable-line max-len

export const CONTEXTMENU_ITEMS_HIDE_COLUMN: string = `${CM_ALIAS}.hideColumn`;
export const CONTEXTMENU_ITEMS_SHOW_COLUMN: string = `${CM_ALIAS}.showColumn`;

export const CONTEXTMENU_ITEMS_HIDE_ROW: string = `${CM_ALIAS}.hideRow`;
export const CONTEXTMENU_ITEMS_SHOW_ROW: string = `${CM_ALIAS}.showRow`;

export const FILTERS_NAMESPACE: string = 'Filters:';
export const FILTERS_CONDITIONS_NAMESPACE: string = `${FILTERS_NAMESPACE}conditions`;
export const FILTERS_CONDITIONS_NONE: string = `${FILTERS_CONDITIONS_NAMESPACE}.none`;
export const FILTERS_CONDITIONS_EMPTY: string = `${FILTERS_CONDITIONS_NAMESPACE}.isEmpty`;
export const FILTERS_CONDITIONS_NOT_EMPTY: string = `${FILTERS_CONDITIONS_NAMESPACE}.isNotEmpty`;
export const FILTERS_CONDITIONS_EQUAL: string = `${FILTERS_CONDITIONS_NAMESPACE}.isEqualTo`;
export const FILTERS_CONDITIONS_NOT_EQUAL: string = `${FILTERS_CONDITIONS_NAMESPACE}.isNotEqualTo`;
export const FILTERS_CONDITIONS_BEGINS_WITH: string = `${FILTERS_CONDITIONS_NAMESPACE}.beginsWith`;
export const FILTERS_CONDITIONS_ENDS_WITH: string = `${FILTERS_CONDITIONS_NAMESPACE}.endsWith`;
export const FILTERS_CONDITIONS_CONTAINS: string = `${FILTERS_CONDITIONS_NAMESPACE}.contains`;
export const FILTERS_CONDITIONS_NOT_CONTAIN: string = `${FILTERS_CONDITIONS_NAMESPACE}.doesNotContain`;
export const FILTERS_CONDITIONS_BY_VALUE: string = `${FILTERS_CONDITIONS_NAMESPACE}.byValue`;
export const FILTERS_CONDITIONS_GREATER_THAN: string = `${FILTERS_CONDITIONS_NAMESPACE}.greaterThan`;
export const FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL: string = `${FILTERS_CONDITIONS_NAMESPACE}.greaterThanOrEqualTo`;
export const FILTERS_CONDITIONS_LESS_THAN: string = `${FILTERS_CONDITIONS_NAMESPACE}.lessThan`;
export const FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL: string = `${FILTERS_CONDITIONS_NAMESPACE}.lessThanOrEqualTo`;
export const FILTERS_CONDITIONS_BETWEEN: string = `${FILTERS_CONDITIONS_NAMESPACE}.isBetween`;
export const FILTERS_CONDITIONS_NOT_BETWEEN: string = `${FILTERS_CONDITIONS_NAMESPACE}.isNotBetween`;
export const FILTERS_CONDITIONS_AFTER: string = `${FILTERS_CONDITIONS_NAMESPACE}.after`;
export const FILTERS_CONDITIONS_BEFORE: string = `${FILTERS_CONDITIONS_NAMESPACE}.before`;
export const FILTERS_CONDITIONS_TODAY: string = `${FILTERS_CONDITIONS_NAMESPACE}.today`;
export const FILTERS_CONDITIONS_TOMORROW: string = `${FILTERS_CONDITIONS_NAMESPACE}.tomorrow`;
export const FILTERS_CONDITIONS_YESTERDAY: string = `${FILTERS_CONDITIONS_NAMESPACE}.yesterday`;

export const FILTERS_DIVS_FILTER_BY_CONDITION: string = `${FILTERS_NAMESPACE}labels.filterByCondition`;
export const FILTERS_DIVS_FILTER_BY_VALUE: string = `${FILTERS_NAMESPACE}labels.filterByValue`;

export const FILTERS_LABELS_CONJUNCTION: string = `${FILTERS_NAMESPACE}labels.conjunction`;
export const FILTERS_LABELS_DISJUNCTION: string = `${FILTERS_NAMESPACE}labels.disjunction`;

export const FILTERS_VALUES_BLANK_CELLS: string = `${FILTERS_NAMESPACE}values.blankCells`;

export const FILTERS_BUTTONS_SELECT_ALL: string = `${FILTERS_NAMESPACE}buttons.selectAll`;
export const FILTERS_BUTTONS_CLEAR: string = `${FILTERS_NAMESPACE}buttons.clear`;
export const FILTERS_BUTTONS_OK: string = `${FILTERS_NAMESPACE}buttons.ok`;
export const FILTERS_BUTTONS_CANCEL: string = `${FILTERS_NAMESPACE}buttons.cancel`;

export const FILTERS_BUTTONS_PLACEHOLDER_SEARCH: string = `${FILTERS_NAMESPACE}buttons.placeholder.search`;
export const FILTERS_BUTTONS_PLACEHOLDER_VALUE: string = `${FILTERS_NAMESPACE}buttons.placeholder.value`;
export const FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE: string = `${FILTERS_NAMESPACE}buttons.placeholder.secondValue`;

export const CHECKBOX_RENDERER_NAMESPACE: string = 'CheckboxRenderer:';
export const CHECKBOX_CHECKED: string = `${CHECKBOX_RENDERER_NAMESPACE}checked`;
export const CHECKBOX_UNCHECKED: string = `${CHECKBOX_RENDERER_NAMESPACE}unchecked`;
