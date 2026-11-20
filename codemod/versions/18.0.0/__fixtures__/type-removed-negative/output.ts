// Handsontable types that 18.0 still exports, and removed names that another package exports.
import type { CommentObject } from 'handsontable/plugins/comments';
import type { MenuItemConfig } from 'handsontable/plugins/contextMenu';
import type { ConditionId } from 'handsontable/plugins/filters';
import type { CellType, EditorType, RendererType, ValidatorType } from 'handsontable';
import type { Direction, Plugins } from 'other-grid/plugins';
import type { Formats } from 'other-grid/plugins/exportFile';
import type { Shortcut } from 'other-grid/editors/factory';
import type { CellSettings } from 'other-grid/settings';
import type { Endpoints } from './columnSummary';
import type { Selection } from 'handsontable-extras/plugins/contextMenu';

export const comment: CommentObject | null = null;
export const item: MenuItemConfig | null = null;
export const condition: ConditionId | null = null;
export const kinds: [CellType, EditorType, RendererType, ValidatorType] | null = null;
export const other: [Direction, Plugins, Formats, Shortcut, CellSettings, Endpoints, Selection] | null = null;
export const modes: Omit<{ a: number; b: number }, 'a'> | null = null;
