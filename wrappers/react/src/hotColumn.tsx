import React from 'react';
import { HotTableProps, HotColumnProps, HotEditorHooks } from './types';
import {
  createEditorPortal,
  displayObsoleteRenderersEditorsWarning
} from './helpers';
import { SettingsMapper } from './settingsMapper';
import Handsontable from 'handsontable/base';
import { HotTableContext } from './hotTableContext'
import { useHotColumnContext } from './hotColumnContext'
import { EditorContextProvider, makeEditorClass } from "./hotEditor";

const isHotColumn = (childNode: any): childNode is React.ReactElement => childNode.type === HotColumn;

const internalProps = ['_columnIndex', '_getOwnerDocument', 'children'];

interface HotColumnInnerProps extends HotColumnProps {
  _columnIndex: number;
  _getOwnerDocument: () => Document | null;
}

class HotColumnInner extends React.Component<HotColumnInnerProps, {}> {
  columnSettings: Handsontable.ColumnSettings;

  /**
   * Reference to component-based editor overridden hooks object.
   * @private
   */
  private localEditorHooksRef = React.createRef<HotEditorHooks>();

  /**
   * Reference to HOT-native custom editor class instance.
   * @private
   */
  private localEditorClassInstance = React.createRef<Handsontable.editors.BaseEditor>();

  /**
   * HotTableContext type assignment
   */
  static contextType = HotTableContext;

  declare context: React.ContextType<typeof HotTableContext>;

  /**
   * Filter out all the internal properties and return an object with just the Handsontable-related props.
   *
   * @returns {Object}
   */
  getSettingsProps(): HotTableProps {
    return Object.keys(this.props)
      .filter(key => {
        return !internalProps.includes(key);
      })
      .reduce((obj, key) => {
        obj[key] = this.props[key];

        return obj;
      }, {});
  }

  /**
   * Create the column settings based on the data provided to the `HotColumn` component and it's child components.
   */
  createColumnSettings(): void {
    this.columnSettings = SettingsMapper.getSettings(this.getSettingsProps()) as unknown as Handsontable.ColumnSettings;

    if (this.props.renderer) {
      this.columnSettings.renderer = this.context.getRendererWrapper(this.props.renderer);
      this.context.componentRendererColumns.set(this.props._columnIndex, true);
    } else if (this.props.hotRenderer) {
      this.columnSettings.renderer = this.props.hotRenderer;
    }

    if (this.props.editor) {
      this.columnSettings.editor = makeEditorClass(this.localEditorHooksRef, this.localEditorClassInstance);
    } else if (this.props.hotEditor) {
      this.columnSettings.editor = this.props.hotEditor;
    }
  }

  /**
   * Emit the column settings to the parent using a prop passed from the parent.
   */
  emitColumnSettings(): void {
    this.context.emitColumnSettings(this.columnSettings, this.props._columnIndex);
  }

  /*
  ---------------------------------------
  ------- React lifecycle methods -------
  ---------------------------------------
  */

  /**
   * Logic performed after the mounting of the HotColumn component.
   */
  componentDidMount(): void {
    this.createColumnSettings();
    this.emitColumnSettings();
    displayObsoleteRenderersEditorsWarning(this.props.children);
  }

  /**
   * Logic performed after the updating of the HotColumn component.
   */
  componentDidUpdate(): void {
    this.createColumnSettings();
    this.emitColumnSettings();
    displayObsoleteRenderersEditorsWarning(this.props.children);
  }

  /**
   * Render the portals of the editors, if there are any.
   *
   * @returns {React.ReactElement}
   */
  render(): React.ReactElement {
    const editorPortal = createEditorPortal(this.props._getOwnerDocument(), this.props.editor);

    return (
      <EditorContextProvider hooksRef={this.localEditorHooksRef}
                             hotCustomEditorInstanceRef={this.localEditorClassInstance}>
        {editorPortal}
      </EditorContextProvider>
    )
  }
}

const HotColumn: React.FC<HotColumnProps> = (props) => {
  const { columnIndex, getOwnerDocument } = useHotColumnContext()
  return <HotColumnInner {...props} _columnIndex={columnIndex} _getOwnerDocument={getOwnerDocument} />
}

export { HotColumn, isHotColumn };
