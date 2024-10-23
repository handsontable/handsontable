import Handsontable from 'handsontable/base';
import React, {
  ComponentType,
  CSSProperties,
  Dispatch,
  DispatchWithoutAction,
  ReactNode,
} from 'react';

/**
 * Type of the identifier under which the cached components are stored.
 */
export type ScopeIdentifier = 'global' | number;

/**
 * Interface for the props of the component-based renderers.
 */
export interface HotRendererProps {
  instance: Handsontable.Core,
  TD: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: any,
  cellProperties: Handsontable.CellProperties
}

/**
 * Interface for component-based editor overridden hooks object.
 */
export interface HotEditorHooks {
  onOpen?: () => void
  onClose?: () => void
  onPrepare?: (row: number, column: number, prop: string | number, TD: HTMLTableCellElement, originalValue: any, cellProperties: Handsontable.CellProperties) => void
  onFocus?: () => void
}

/**
 * Interface for custom component-based editor API exposed by useHotEditor
 */
export interface UseHotEditorImpl<T> {
  value?: T
  setValue: Dispatch<T>
  isOpen: boolean
  finishEditing: DispatchWithoutAction
  row?: number
  col?: number
}

/**
 * Helper type to expose GridSettings/ColumnSettings props with native renderers/editors separately
 *  from component-based render prop.
 */
type ReplaceRenderersEditors<T extends Pick<Handsontable.GridSettings, 'renderer' | 'editor'>> = Omit<T, 'renderer' | 'editor'> & {
  hotRenderer?: T['renderer'],
  renderer?: ComponentType<HotRendererProps>,
  hotEditor?: T['editor'],
  editor?: ComponentType,
}

/**
 * Interface for the `prop` of the HotTable component - extending the default Handsontable settings with additional,
 * component-related properties.
 */
export interface HotTableProps extends ReplaceRenderersEditors<Handsontable.GridSettings> {
  id?: string,
  className?: string,
  style?: CSSProperties,
  children?: ReactNode
}

/**
 * Properties related to the HotColumn architecture.
 */
export interface HotColumnProps extends ReplaceRenderersEditors<Handsontable.ColumnSettings> {
  children?: ReactNode;
}


/**
 * Type of interface exposed to parent components by HotTable instance via React ref
 */
export interface HotTableRef {
  /**
   * Reference to the main Handsontable DOM element.
   */
  hotElementRef: HTMLElement

  /**
   * Reference to the Handsontable instance.
   */
  hotInstance: Handsontable | null
}
