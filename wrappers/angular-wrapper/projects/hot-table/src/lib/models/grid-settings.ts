import Handsontable from 'handsontable';
import { ColumnSettings, ColumnSettingsInternal } from './column-settings';

export interface GridSettings extends Handsontable.GridSettings {
  columns?: ColumnSettings[] | ((index: number) => ColumnSettings);
}

export interface GridSettingsInternal extends Omit<GridSettings, 'columns'> {
  columns?: ColumnSettingsInternal[] | ((index: number) => ColumnSettingsInternal);
}
