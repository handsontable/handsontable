import Handsontable from 'tmp-hot/base';

export interface HotTableProps extends Handsontable.GridSettings {
  id?: string,
  settings?: Handsontable.GridSettings,
  [additional: string]: any;
}

export type VueProps<T> = { [P in keyof T]: any };
