import Handsontable from 'handsontable/base';
import React from 'react';
import { ConnectedComponent } from 'react-redux';

/**
 * Type of the editor component's ReactElement.
 */
export type HotEditorElement = React.ReactElement<{}, ConnectedComponent<React.FunctionComponent, any> | any>;

/**
 * Type of the identifier under which the cached editor components are stored.
 */
export type EditorScopeIdentifier = 'global' | number;

/**
 * Type of the cache map for the Handsontable editor components.
 */
export type HotEditorCache = Map<Function, Map<EditorScopeIdentifier, React.Component>>;

/**
 * Interface for the `prop` of the HotTable component - extending the default Handsontable settings with additional,
 * component-related properties.
 */
export interface HotTableProps extends Handsontable.GridSettings {
  id?: string,
  className?: string,
  style?: React.CSSProperties,
  settings?: Handsontable.GridSettings
  children?: React.ReactNode
}

/**
 * Interface for the props of the component-based editors.
 */
export interface HotEditorProps {
  "hot-editor": any,
  id?: string,
  className?: string,
  style?: React.CSSProperties,
}
