import React from 'react';
import { HotTableProps, HotColumnProps } from './types';
import {
  createEditorPortal,
  displayObsoleteRenderersWarning,
  getExtendedEditorElement
} from './helpers';
import { SettingsMapper } from './settingsMapper';
import Handsontable from 'handsontable/base';
import { HotTableContext } from './hotTableContext'
import { useHotColumnContext } from './hotColumnContext'

const isHotColumn = (childNode: any): childNode is React.ReactElement => childNode.type === HotColumn;

const internalProps = ['_columnIndex', '_getOwnerDocument', 'hot-editor', 'children'];

interface HotColumnInnerProps extends HotColumnProps {
  _columnIndex: number;
  _getOwnerDocument: () => Document | null;
}

class HotColumnInner extends React.Component<HotColumnInnerProps, {}> {
  columnSettings: Handsontable.ColumnSettings;

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
   * Get the editor element for the current column.
   *
   * @returns {React.ReactElement} React editor component element.
   */
  getLocalEditorElement(): React.ReactElement | null {
    return getExtendedEditorElement(this.props.children, this.context.editorCache, this.props._columnIndex);
  }

  /**
   * Create the column settings based on the data provided to the `HotColumn` component and it's child components.
   */
  createColumnSettings(): void {
    const editorElement = this.getLocalEditorElement();

    this.columnSettings = SettingsMapper.getSettings(this.getSettingsProps()) as unknown as Handsontable.ColumnSettings;

    if (this.props.renderer) {
      this.columnSettings.renderer = this.context.getRendererWrapper(this.props.renderer);
      this.context.componentRendererColumns.set(this.props._columnIndex, true);
    } else if (this.props.hotRenderer) {
      this.columnSettings.renderer = this.props.hotRenderer;
    }

    if (editorElement !== null) {
      this.columnSettings.editor = this.context.getEditorClass(editorElement, this.props._columnIndex);
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
    displayObsoleteRenderersWarning(this.props.children);
  }

  /**
   * Logic performed after the updating of the HotColumn component.
   */
  componentDidUpdate(): void {
    this.createColumnSettings();
    this.emitColumnSettings();
    displayObsoleteRenderersWarning(this.props.children);
  }

  /**
   * Render the portals of the editors, if there are any.
   *
   * @returns {React.ReactElement}
   */
  render(): React.ReactElement {
    const ownerDocument = this.props._getOwnerDocument();
    const editorPortal = createEditorPortal(ownerDocument, this.getLocalEditorElement());

    return (
      <React.Fragment>
        {editorPortal}
      </React.Fragment>
    )
  }
}

const HotColumn: React.FC<HotColumnProps> = (props) => {
  const { columnIndex, getOwnerDocument } = useHotColumnContext()
  return <HotColumnInner {...props} _columnIndex={columnIndex} _getOwnerDocument={getOwnerDocument} />
}

export { HotColumn, isHotColumn };
