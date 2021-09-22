import React, { ReactPortal } from 'react';
import { HotTableProps, HotColumnProps } from './types';
import {
  addUnsafePrefixes,
  createEditorPortal,
  getExtendedEditorElement
} from './helpers';
import { SettingsMapper } from './settingsMapper';
import Handsontable from 'handsontable';

class HotColumn extends React.Component<HotColumnProps, {}> {
  internalProps: string[];
  columnSettings: Handsontable.ColumnSettings;

  /**
   * Local editor portal cache.
   *
   * @private
   * @type {ReactPortal}
   */
  private localEditorPortal: ReactPortal = null;

  /**
   * HotColumn class constructor.
   *
   * @param {HotColumnProps} props Component props.
   * @param {*} [context] Component context.
   */
  constructor(props: HotColumnProps, context?: any) {
    super(props, context);

    addUnsafePrefixes(this);
  }

  /**
   * Get the local editor portal cache property.
   *
   * @return {ReactPortal} Local editor portal.
   */
  getLocalEditorPortal(): ReactPortal {
    return this.localEditorPortal;
  }

  /**
   * Set the local editor portal cache property.
   *
   * @param {ReactPortal} portal Local editor portal.
   */
  setLocalEditorPortal(portal): void {
    this.localEditorPortal = portal;
  }

  /**
   * Filter out all the internal properties and return an object with just the Handsontable-related props.
   *
   * @returns {Object}
   */
  getSettingsProps(): HotTableProps {
    this.internalProps = ['__componentRendererColumns', '_emitColumnSettings', '_columnIndex', '_getChildElementByType', '_getRendererWrapper',
      '_getEditorClass', '_getEditorCache', '_getOwnerDocument', 'hot-renderer', 'hot-editor', 'children'];

    return Object.keys(this.props)
      .filter(key => {
        return !this.internalProps.includes(key);
      })
      .reduce((obj, key) => {
        obj[key] = this.props[key];

        return obj;
      }, {});
  }

  /**
   * Check whether the HotColumn component contains a provided prop.
   *
   * @param {String} propName Property name.
   * @returns {Boolean}
   */
  hasProp(propName: string): boolean {
    return !!this.props[propName];
  }

  /**
   * Get the editor element for the current column.
   *
   * @returns {React.ReactElement} React editor component element.
   */
  getLocalEditorElement(): React.ReactElement | null {
    return getExtendedEditorElement(this.props.children, this.props._getEditorCache());
  }

  /**
   * Create the column settings based on the data provided to the `HotColumn` component and it's child components.
   */
  createColumnSettings(): void {
    const rendererElement: React.ReactElement = this.props._getChildElementByType(this.props.children, 'hot-renderer');
    const editorElement: React.ReactElement = this.getLocalEditorElement();

    this.columnSettings = SettingsMapper.getSettings(this.getSettingsProps()) as unknown as Handsontable.ColumnSettings;

    if (rendererElement !== null) {
      this.columnSettings.renderer = this.props._getRendererWrapper(rendererElement);
      this.props._componentRendererColumns.set(this.props._columnIndex, true);

    } else if (this.hasProp('renderer')) {
      this.columnSettings.renderer = this.props.renderer;

    } else {
      this.columnSettings.renderer = void 0;
    }

    if (editorElement !== null) {
      this.columnSettings.editor = this.props._getEditorClass(editorElement);

    } else if (this.hasProp('editor')) {
      this.columnSettings.editor = this.props.editor;

    } else {
      this.columnSettings.editor = void 0;
    }
  }

  /**
   * Create the local editor portal and its destination HTML element if needed.
   *
   * @param {React.ReactNode} [children] Children of the HotTable instance. Defaults to `this.props.children`.
   */
  createLocalEditorPortal(children = this.props.children): void {
    const editorCache = this.props._getEditorCache();
    const localEditorElement: React.ReactElement = getExtendedEditorElement(children, editorCache);

    if (localEditorElement) {
      this.setLocalEditorPortal(createEditorPortal(this.props._getOwnerDocument(), localEditorElement, editorCache));
    }
  }

  /**
   * Emit the column settings to the parent using a prop passed from the parent.
   */
  emitColumnSettings(): void {
    this.props._emitColumnSettings(this.columnSettings, this.props._columnIndex);
  }

  /*
  ---------------------------------------
  ------- React lifecycle methods -------
  ---------------------------------------
  */

  /**
   * Logic performed before the mounting of the HotColumn component.
   */
  componentWillMount(): void {
    this.createLocalEditorPortal();
  }

  /**
   * Logic performed after the mounting of the HotColumn component.
   */
  componentDidMount(): void {
    this.createColumnSettings();
    this.emitColumnSettings();
  }

  /**
   * Logic performed before the updating of the HotColumn component.
   */
  componentWillUpdate(nextProps: Readonly<HotColumnProps>, nextState: Readonly<{}>, nextContext: any): void {
    this.createLocalEditorPortal(nextProps.children);
  }

  /**
   * Logic performed after the updating of the HotColumn component.
   */
  componentDidUpdate(): void {
    this.createColumnSettings();
    this.emitColumnSettings();
  }

  /**
   * Render the portals of the editors, if there are any.
   *
   * @returns {React.ReactElement}
   */
  render(): React.ReactElement {
    return (
      <React.Fragment>
        {this.getLocalEditorPortal()}
      </React.Fragment>
    )
  }
}

export { HotColumn };
