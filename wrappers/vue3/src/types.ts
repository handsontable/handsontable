import Handsontable from 'handsontable/base';

export type VNode = any;
export type Vue = any;

export interface HotTableProps extends Handsontable.GridSettings {
  id?: string,
  settings?: Handsontable.GridSettings,
  wrapperRendererCacheSize?: number,
  usesRendererComponent?: boolean,
  [additional: string]: any;
}

export type VueProps<T> = { [P in keyof T]: any };

export interface RendererEntryCache {
  component: VNode,
  lastUsedTD: HTMLTableCellElement | null,
}
