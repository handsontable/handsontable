import { BasePlugin } from '../base';

export type PredefinedMenuItemKey = 'row_above' | 'row_below' | 'col_left' | 'col_right' |
  '---------' | 'remove_row' | 'remove_col' | 'clear_column' | 'undo' | 'redo' |
  'make_read_only' | 'alignment' | 'cut' | 'copy' | 'freeze_column' | 'unfreeze_column' |
  'borders' | 'commentsAddEdit' | 'commentsRemove' | 'commentsReadOnly' | 'mergeCells' |
  'add_child' | 'detach_from_parent' | 'hidden_columns_hide' | 'hidden_columns_show' |
  'hidden_rows_hide' | 'hidden_rows_show' | 'filter_by_condition' | 'filter_operators' |
  'filter_by_condition2' | 'filter_by_value' | 'filter_action_bar';

export type SeparatorObject = {
  name: string;
}

export class ContextMenu extends BasePlugin {
  static DEFAULT_ITEMS: PredefinedMenuItemKey[];
  static SEPARATOR: SeparatorObject;

  constructor(hotInstance: any);
  isEnabled(): boolean;
  open(event: Event): void;
  close(): void;
  executeCommand(commandName: string, ...params: any): void;
}
