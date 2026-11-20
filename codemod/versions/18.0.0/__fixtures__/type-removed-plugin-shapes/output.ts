// TODO(handsontable-codemod 18.0.0/type-autofill-direction): Direction: Use the inline union `'vertical' | 'horizontal'`. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
import type { Direction } from 'handsontable/plugins/autofill';
// TODO(handsontable-codemod 18.0.0/type-columnsummary-endpoints): Endpoints: Read the endpoints from the plugin instance... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
import type { Endpoints } from 'handsontable/plugins/columnSummary';
// TODO(handsontable-codemod 18.0.0/type-comments-config): CommentConfig: Use `GridSettings['comments']`, or describe the object inline. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
// TODO(handsontable-codemod 18.0.0/type-comments-config): CommentsRangeObject: Use `GridSettings['comments']`, or describe the object inline. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
import type { CommentConfig, CommentObject, CommentsRangeObject } from 'handsontable/plugins/comments';
// TODO(handsontable-codemod 18.0.0/type-contextmenu-menuconfig): MenuConfig: Use `Record<string, MenuItemConfig | PredefinedMenuItemKey>`. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
// TODO(handsontable-codemod 18.0.0/type-contextmenu-submenu): SubmenuConfig: Use `MenuItemConfig` from 'handsontable/plugins/contextMenu'. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
// TODO(handsontable-codemod 18.0.0/type-contextmenu-submenu): SubmenuItemConfig: Use `MenuItemConfig` from 'handsontable/plugins/contextMenu'. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
// TODO(handsontable-codemod 18.0.0/type-contextmenu-selection): Selection: Use the inline type `{ start: CellCoords; end: CellCoords }` (import type {... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
import type { MenuConfig, Selection, SubmenuConfig, SubmenuItemConfig } from 'handsontable/plugins/contextMenu';
// TODO(handsontable-codemod 18.0.0/type-menu-separatorobject): SeparatorObject: Use the inline type `{ name: string }`. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
import type { SeparatorObject } from 'handsontable/plugins/dropdownMenu';
// TODO(handsontable-codemod 18.0.0/type-customborders-shapes): BorderDescriptor: Describe the object inline, using `BorderSettings` from... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
// TODO(handsontable-codemod 18.0.0/type-customborders-shapes): BorderRange: Describe the object inline, using `BorderSettings` from... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
// TODO(handsontable-codemod 18.0.0/type-customborders-shapes): ComputedBorder: Describe the object inline, using `BorderSettings` from... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
import type { BorderDescriptor, BorderRange, ComputedBorder } from 'handsontable/plugins/customBorders';
// TODO(handsontable-codemod 18.0.0/type-plugin-config-types): DialogConfig: Use `GridSettings['dialog']` (import type { GridSettings } from 'handsontable')... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
// TODO(handsontable-codemod 18.0.0/type-plugin-config-types): TemplateOptions: Use `GridSettings['dialog']` (import type { GridSettings } from... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
import type { DialogConfig, TemplateOptions } from 'handsontable/plugins/dialog';
// TODO(handsontable-codemod 18.0.0/type-plugin-config-types): LoadingConfig: Use `GridSettings['loading']` (import type { GridSettings } from 'handsontable')... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
import type { LoadingConfig } from 'handsontable/plugins/loading';
// TODO(handsontable-codemod 18.0.0/type-plugin-config-types): EmptyDataStateConfig: Use `GridSettings['emptyDataState']` (import type { GridSettings } from... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
// TODO(handsontable-codemod 18.0.0/type-plugin-config-types): EmptyDataStateMessage: Use `GridSettings['emptyDataState']` (import type { GridSettings } from... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
import type { EmptyDataStateConfig, EmptyDataStateMessage } from 'handsontable/plugins/emptyDataState';
// TODO(handsontable-codemod 18.0.0/type-filters-conditionname): ConditionName: Use `ConditionId['name']` (import type { ConditionId } from... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
// TODO(handsontable-codemod 18.0.0/type-filters-config): FiltersConfig: Use `GridSettings['filters']`, or describe the object inline. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
// TODO(handsontable-codemod 18.0.0/type-filters-config): CellLikeData: Use `GridSettings['filters']`, or describe the object inline. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
import type { ConditionId, ConditionName, FiltersConfig, CellLikeData } from 'handsontable/plugins/filters';
// TODO(handsontable-codemod 18.0.0/type-formulas-hyperformula): HyperFormulaSettings: Use `GridSettings['formulas']`, or describe the settings inline. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
// TODO(handsontable-codemod 18.0.0/type-formulas-hyperformula): NamedExpressions: Use `GridSettings['formulas']`, or describe the settings inline. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
import type { HyperFormulaSettings, NamedExpressions } from 'handsontable/plugins/formulas';
// TODO(handsontable-codemod 18.0.0/type-mergecells-settings): MergeCellsSettings: Use `GridSettings['mergeCells']`, or describe the object inline. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
import type { MergeCellsSettings } from 'handsontable/plugins/mergeCells';
// TODO(handsontable-codemod 18.0.0/type-dragtoscroll-domboundaries): DOMBoundaries: Use the inline type `{ left: number; right: number; top: number; bottom: number }`. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
import type { DOMBoundaries } from 'handsontable/plugins/dragToScroll';
// TODO(handsontable-codemod 18.0.0/type-pagination-types): PageSizeOption: Use `number | 'auto'` for `PageSizeOption`. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
// TODO(handsontable-codemod 18.0.0/type-pagination-types): PaginationData: Use `number | 'auto'` for `PageSizeOption`. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
import type { PageSizeOption, PaginationData } from 'handsontable/plugins/pagination';
// TODO(handsontable-codemod 18.0.0/type-search-types): SearchCallback: Describe the function inline. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
// TODO(handsontable-codemod 18.0.0/type-search-types): SearchQueryMethod: Describe the function inline. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
import type { SearchCallback, SearchQueryMethod } from 'handsontable/plugins/search';
// TODO(handsontable-codemod 18.0.0/type-copypaste-modes): CopyModeType: Use the inline union. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
// TODO(handsontable-codemod 18.0.0/type-copypaste-modes): PasteModeType: Use the inline union. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
import type { CopyModeType, PasteModeType } from 'handsontable/plugins/copyPaste';
// TODO(handsontable-codemod 18.0.0/type-undoredo-actions): ChangeAction: Use `UndoRedoAction` from 'handsontable/plugins/undoRedo'. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
// TODO(handsontable-codemod 18.0.0/type-undoredo-actions): InsertRowAction: Use `UndoRedoAction` from 'handsontable/plugins/undoRedo'. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
import type { ChangeAction, InsertRowAction, UndoRedoAction } from 'handsontable/plugins/undoRedo';
// TODO(handsontable-codemod 18.0.0/type-exportfile-formats): Formats: Use the inline union `'csv' | 'xlsx'`. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
import type { Formats } from 'handsontable/plugins/exportFile';

export const direction: Direction = 'vertical';
export const endpoints: Endpoints = [];
export const comment: [CommentConfig, CommentObject, CommentsRangeObject] | null = null;
export const menu: [MenuConfig, Selection, SubmenuConfig, SubmenuItemConfig] | null = null;
export const separator: SeparatorObject = { name: '---------' };
export const borders: [BorderDescriptor, BorderRange, ComputedBorder] | null = null;
export const dialog: [DialogConfig, TemplateOptions, LoadingConfig] | null = null;
export const empty: [EmptyDataStateConfig, EmptyDataStateMessage] | null = null;
export const filters: [ConditionId, ConditionName, FiltersConfig, CellLikeData] | null = null;
export const formulas: [HyperFormulaSettings, NamedExpressions] | null = null;
export const merged: MergeCellsSettings = [];
export const boundaries: DOMBoundaries | null = null;
export const paging: [PageSizeOption, PaginationData] | null = null;
export const search: [SearchCallback, SearchQueryMethod] | null = null;
export const modes: [CopyModeType, PasteModeType] | null = null;
export const actions: [ChangeAction, InsertRowAction, UndoRedoAction] | null = null;
export const format: Formats = 'csv';
