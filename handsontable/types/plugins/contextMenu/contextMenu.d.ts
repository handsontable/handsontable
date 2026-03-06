import CellCoords from '../../3rdparty/walkontable/src/cell/coords';
import Core from '../../core';
import { BasePlugin } from '../base';

export type PredefinedMenuItemKey = 'row_above' | 'row_below' | 'col_left' | 'col_right' |
  '---------' | 'remove_row' | 'remove_col' | 'clear_column' | 'undo' | 'redo' |
  'make_read_only' | 'alignment' | 'cut' | 'copy' | 'copy_column_headers_only' |
  'copy_with_column_group_headers' | 'copy_with_column_headers' | 'freeze_column' |
  'unfreeze_column' | 'borders' | 'commentsAddEdit' | 'commentsRemove' | 'commentsReadOnly' |
  'mergeCells' | 'add_child' | 'detach_from_parent' | 'hidden_columns_hide' | 'hidden_columns_show' |
  'hidden_rows_hide' | 'hidden_rows_show' | 'filter_by_condition' | 'filter_operators' |
  'filter_by_condition2' | 'filter_by_value' | 'filter_action_bar';

export interface SeparatorObject {
  name: string;
}

export interface Selection {
  start: CellCoords;
  end: CellCoords;
}

export interface MenuConfig {
  [key: string]: MenuItemConfig | PredefinedMenuItemKey;
}

export interface MenuItemConfig {
  name?: string | ((this: Core) => string);
  key?: string;
  hidden?: boolean | ((this: Core) => boolean | void);
  disabled?: boolean | ((this: Core) => boolean | void);
  disableSelection?: boolean;
  isCommand?: boolean;
  callback?(this: Core, key: string, selection: Selection[], clickEvent: MouseEvent): void;
  renderer?(this: MenuItemConfig, hot: Core, wrapper: HTMLElement, row: number, col: number, prop: number | string, itemValue: string): HTMLElement;
  submenu?: SubmenuConfig;
}

export interface SubmenuConfig {
  items: SubmenuItemConfig[];
}

export interface SubmenuItemConfig extends Omit<MenuItemConfig, "key"> {
  /**
   * Submenu item `key` must be defined as "parent_key:sub_key" where "parent_key" is the parent MenuItemConfig key.
   */
  key: string;
}

export interface DetailedSettings {
  callback?: (key: string, selection: Selection[], clickEvent: MouseEvent) => void;
  uiContainer?: HTMLElement,
  items?: PredefinedMenuItemKey[] | MenuConfig;
}

export type Settings = boolean | PredefinedMenuItemKey[] | DetailedSettings;

export class ContextMenu extends BasePlugin {
  static DEFAULT_ITEMS: PredefinedMenuItemKey[];
  static SEPARATOR: SeparatorObject;

  constructor(hotInstance: Core);
  isEnabled(): boolean;
  open(position: { left: number, top: number } | Event, offset?: { above?: number, below?: number, left?: number, right?: number }): void;
  close(): void;
  executeCommand(commandName: string, ...params: any): void;
}
