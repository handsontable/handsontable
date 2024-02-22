import React from 'react';
import { HotTableProps, HotColumnProps, HotEditorHooks } from './types';
import {
  createEditorPortal,
  displayObsoleteRenderersEditorsWarning
} from './helpers';
import { SettingsMapper } from './settingsMapper';
import Handsontable from 'handsontable/base';
import { useHotTableContext } from './hotTableContext'
import { useHotColumnContext } from './hotColumnContext'
import { EditorContextProvider, makeEditorClass } from "./hotEditor";

const isHotColumn = (childNode: any): childNode is React.ReactElement => childNode.type === HotColumn;

const internalProps = ['_columnIndex', '_getOwnerDocument', 'children'];

const HotColumn: React.FC<HotColumnProps> = (props) => {
  const { componentRendererColumns, emitColumnSettings, getRendererWrapper } = useHotTableContext();
  const { columnIndex, getOwnerDocument } = useHotColumnContext();

  /**
   * Reference to component-based editor overridden hooks object.
   */
  const localEditorHooksRef = React.useRef<HotEditorHooks>();

  /**
   * Reference to HOT-native custom editor class instance.
   */
  const localEditorClassInstance = React.useRef<Handsontable.editors.BaseEditor>();

  /**
   * Logic performed after mounting & updating of the HotColumn component.
   */
  React.useEffect(() => {

    /**
     * Filter out all the internal properties and return an object with just the Handsontable-related props.
     *
     * @returns {Object}
     */
    const getSettingsProps = (): HotTableProps => {
      return Object.keys(props)
        .filter(key => !internalProps.includes(key))
        .reduce((obj, key) => {
          obj[key] = props[key];
          return obj;
        }, {});
    };

    /**
     * Create the column settings based on the data provided to the `HotColumn` component and its child components.
     */
    const createColumnSettings = (): Handsontable.ColumnSettings => {
      const columnSettings = SettingsMapper.getSettings(getSettingsProps()) as unknown as Handsontable.ColumnSettings;

      if (props.renderer) {
        columnSettings.renderer = getRendererWrapper(props.renderer);
        componentRendererColumns.set(columnIndex, true);
      } else if (props.hotRenderer) {
        columnSettings.renderer = props.hotRenderer;
      }

      if (props.editor) {
        columnSettings.editor = makeEditorClass(localEditorHooksRef, localEditorClassInstance);
      } else if (props.hotEditor) {
        columnSettings.editor = props.hotEditor;
      }

      return columnSettings
    };

    const columnSettings = createColumnSettings();
    emitColumnSettings(columnSettings, columnIndex);
    displayObsoleteRenderersEditorsWarning(props.children);
  });

  const editorPortal = createEditorPortal(getOwnerDocument(), props.editor);

  /**
   * Render the portals of the editors, if there are any.
   *
   * @returns {React.ReactElement}
   */
  return (
    <EditorContextProvider hooksRef={localEditorHooksRef}
                           hotCustomEditorInstanceRef={localEditorClassInstance}>
      {editorPortal}
    </EditorContextProvider>
  )
}

export { HotColumn, isHotColumn };
