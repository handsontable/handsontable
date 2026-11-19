import type { MenuItemCheckedState } from './utils';

export type PredefinedMenuItemKey =
  | 'row_above' | 'row_below' | 'col_left' | 'col_right'
  | '---------' | 'remove_row' | 'remove_col' | 'clear_column' | 'undo' | 'redo'
  | 'make_read_only' | 'alignment' | 'cut' | 'copy' | 'copy_column_headers_only'
  | 'copy_with_column_group_headers' | 'copy_with_column_headers' | 'freeze_column'
  | 'unfreeze_column' | 'borders' | 'commentsAddEdit' | 'commentsRemove' | 'commentsReadOnly'
  | 'mergeCells' | 'add_child' | 'detach_from_parent' | 'hidden_columns_hide' | 'hidden_columns_show'
  | 'hidden_rows_hide' | 'hidden_rows_show' | 'filter_by_condition' | 'filter_operators'
  | 'filter_by_condition2' | 'filter_by_value' | 'filter_action_bar' | 'export_file'
  | 'row_selection_remove' | 'row_selection_clear';

export interface MenuItemConfig {
  key?: string;
  name: string | (() => string);
  hidden?: boolean | (() => boolean);
  disabled?: boolean | (() => boolean);
  /**
   * Whether the item is marked as checked. `true` draws a check mark, `false` draws none, and
   * `'mixed'` draws a dash for a state that applies to only part of the selection. The value also
   * sets the item's `aria-checked` attribute.
   */
  checked?: MenuItemCheckedState | (() => MenuItemCheckedState);
  callback?: (key: string, selection: unknown[], clickEvent: MouseEvent) => void;
  renderer?: (
    hot: unknown, wrapper: HTMLElement, row: number, col: number, prop: string | number, itemValue: string
  ) => HTMLElement;
  submenu?: { items: MenuItemConfig[] };
  [key: string]: unknown;
}
