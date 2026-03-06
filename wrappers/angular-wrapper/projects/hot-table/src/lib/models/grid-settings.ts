import Handsontable from 'handsontable/base';
import { ColumnSettings, ColumnSettingsInternal } from './column-settings';

export interface GridSettings extends Omit<Handsontable.GridSettings, 'columns' | 'data'> {
  columns?: ColumnSettings[] | ((index: number) => ColumnSettings);
}

export interface GridSettingsInternal extends Omit<GridSettings, 'columns'> {
  columns?: ColumnSettingsInternal[] | ((index: number) => ColumnSettingsInternal);
}
