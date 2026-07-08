import Handsontable, { RemoveIndexSignature } from 'handsontable/base';
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
 * from component-based render prop. Uses conditional types so it works with both GridSettings
 * and ColumnSettings.
 *
 * `RemoveIndexSignature` (imported from the core package) strips the `[key: string]: any` index
 * signature that `GridSettings`/`ColumnSettings` carry. Without it, `Omit` widens `keyof T` to
 * `string` and collapses to a bare index signature, dropping every named option — which is why
 * `HotTableProps`/`HotColumnProps` had no option names to autocomplete. It is defined in core (and
 * imported here rather than redefined) because this package's declaration compiler predates the
 * `as` key-remapping the helper relies on.
 */
type ReplaceRenderersEditors<T> = Omit<RemoveIndexSignature<T>, 'renderer' | 'editor'> & {
  hotRenderer?: T extends { renderer?: infer R } ? R : never,
  renderer?: ComponentType<HotRendererProps>,
  hotEditor?: T extends { editor?: infer E } ? E : never,
  editor?: ComponentType | boolean,
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
