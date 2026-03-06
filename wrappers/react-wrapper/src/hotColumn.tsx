import React, {
  FC,
  ReactElement,
  useEffect,
  useRef,
} from 'react';
import { HotTableProps, HotColumnProps, HotEditorHooks } from './types';
import {
  createEditorPortal,
  displayAnyChildrenWarning,
  displayObsoleteRenderersEditorsWarning
} from './helpers';
import { SettingsMapper } from './settingsMapper';
import Handsontable from 'handsontable/base';
import { useHotTableContext } from './hotTableContext'
import { useHotColumnContext } from './hotColumnContext'
import { EditorContextProvider, makeEditorClass } from './hotEditor';

const isHotColumn = (childNode: any): childNode is ReactElement => childNode.type === HotColumn;

const internalProps = ['_columnIndex', '_getOwnerDocument', 'children'];

const HotColumn: FC<HotColumnProps> = (props) => {
  const { componentRendererColumns, emitColumnSettings, getRendererWrapper } = useHotTableContext();
  const { columnIndex, getOwnerDocument } = useHotColumnContext();

  /**
   * Reference to component-based editor overridden hooks object.
   */
  const localEditorHooksRef = useRef<HotEditorHooks | null>(null);

  /**
   * Reference to HOT-native custom editor class instance.
   */
  const localEditorClassInstance = useRef<Handsontable.editors.BaseEditor | null>(null);

  /**
   * Logic performed after mounting & updating of the HotColumn component.
   */
  useEffect(() => {

    /**
     * Filter out all the internal properties and return an object with just the Handsontable-related props.
     *
     * @returns {Object}
     */
    const getSettingsProps = (): HotTableProps => {
      return Object.keys(props)
        .filter(key => !internalProps.includes(key))
        .reduce<HotTableProps>((obj, key) => {
          (obj as any)[key] = props[key];
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

    if (!displayObsoleteRenderersEditorsWarning(props.children)) {
      displayAnyChildrenWarning(props.children);
    }
  });

  const editorPortal = createEditorPortal(getOwnerDocument(), props.editor);

  /**
   * Render the portals of the editors, if there are any.
   *
   * @returns {ReactElement}
   */
  return (
    <EditorContextProvider hooksRef={localEditorHooksRef}
                           hotCustomEditorInstanceRef={localEditorClassInstance}>
      {editorPortal}
    </EditorContextProvider>
  )
}

export { HotColumn, isHotColumn };
