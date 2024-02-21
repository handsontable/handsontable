import React from 'react';
import Handsontable from 'handsontable/base';
import { SettingsMapper } from './settingsMapper';
import { RenderersPortalManager } from './renderersPortalManager';
import { isHotColumn } from './hotColumn';
import * as packageJson from '../package.json';
import { HotEditorHooks, HotTableProps } from './types';
import {
  HOT_DESTROYED_WARNING,
  AUTOSIZE_WARNING,
  createEditorPortal,
  getContainerAttributesProps,
  isCSR,
  warn,
  displayObsoleteRenderersEditorsWarning
} from './helpers';
import PropTypes from 'prop-types';
import { getRenderer } from 'handsontable/renderers/registry';
import { getEditor } from 'handsontable/editors/registry';
import { HotTableContext } from './hotTableContext'
import { HotColumnContextProvider } from './hotColumnContext'
import { EditorContextProvider, makeEditorClass } from "./hotEditor";

/**
 * A Handsontable-ReactJS wrapper.
 *
 * To implement, use the `HotTable` tag with properties corresponding to Handsontable options.
 * For example:
 *
 * ```js
 * <HotTable id="hot" data={dataObject} contextMenu={true} colHeaders={true} width={600} height={300} stretchH="all" />
 *
 * // is analogous to
 * let hot = new Handsontable(document.getElementById('hot'), {
 *    data: dataObject,
 *    contextMenu: true,
 *    colHeaders: true,
 *    width: 600
 *    height: 300
 * });
 *
 * ```
 *
 * @class HotTableCB
 */
class HotTableClass extends React.Component<HotTableProps, {}> {
  /**
   * The `id` of the main Handsontable DOM element.
   *
   * @type {String}
   */
  id: string = null;
  /**
   * Reference to the Handsontable instance.
   *
   * @private
   * @type {Object}
   */
  __hotInstance: Handsontable | null = null;
  /**
   * Reference to the main Handsontable DOM element.
   *
   * @type {HTMLElement}
   */
  hotElementRef: HTMLElement = null;
  /**
   * Class name added to the component DOM element.
   *
   * @type {String}
   */
  className: string;
  /**
   * Style object passed to the component.
   *
   * @type {React.CSSProperties}
   */
  style: React.CSSProperties;

  /**
   * Reference to component-based editor overridden hooks object.
   * @private
   */
  private globalEditorHooksRef = React.createRef<HotEditorHooks>();

  /**
   * Reference to HOT-native custom editor class instance.
   * @private
   */
  private globalEditorClassInstance = React.createRef<Handsontable.editors.BaseEditor>();

  /**
   * Package version getter.
   *
   * @returns The version number of the package.
   */
  static get version(): string {
    return (packageJson as any).version;
  }

  /**
   * HotTableContext type assignment
   */
  static contextType = HotTableContext;

  declare context: React.ContextType<typeof HotTableContext>;

  /**
   * Getter for the property storing the Handsontable instance.
   */
  get hotInstance(): Handsontable | null {
    if (!this.__hotInstance || (this.__hotInstance && !this.__hotInstance.isDestroyed)) {

      // Will return the Handsontable instance or `null` if it's not yet been created.
      return this.__hotInstance;

    } else {
      console.warn(HOT_DESTROYED_WARNING);

      return null;
    }
  }

  /**
   * Setter for the property storing the Handsontable instance.
   * @param {Handsontable} hotInstance The Handsontable instance.
   */
  set hotInstance(hotInstance) {
    this.__hotInstance = hotInstance;
  }

  /**
   * Prop types to be checked at runtime.
   */
  static propTypes: object = {
    style: PropTypes.object,
    id: PropTypes.string,
    className: PropTypes.string
  };

  /**
   * Clear both the editor and the renderer cache.
   */
  clearCache(): void {
    this.context.clearRenderedCellCache();
    this.context.componentRendererColumns.clear();
  }

  /**
   * Get the `Document` object corresponding to the main component element.
   *
   * @returns The `Document` object used by the component.
   */
  getOwnerDocument(): Document | null {
    if (isCSR()) {
      return this.hotElementRef ? this.hotElementRef.ownerDocument : document;
    }

    return null;
  }

  /**
   * Set the reference to the main Handsontable DOM element.
   *
   * @param {HTMLElement} element The main Handsontable DOM element.
   */
  private setHotElementRef(element: HTMLElement): void {
    this.hotElementRef = element;
  }

  /**
   * Create a new settings object containing the column settings and global editors and renderers.
   *
   * @returns {Handsontable.GridSettings} New global set of settings for Handsontable.
   */
  createNewGlobalSettings(): Handsontable.GridSettings {
    const newSettings = SettingsMapper.getSettings(this.props);

    newSettings.columns = this.context.columnsSettings.length ? this.context.columnsSettings : newSettings.columns;

    if (this.props.renderer) {
      newSettings.renderer = this.context.getRendererWrapper(this.props.renderer);
      this.context.componentRendererColumns.set('global', true);
    } else {
      newSettings.renderer = this.props.hotRenderer || getRenderer('text');
    }

    if (this.props.editor) {
      newSettings.editor = makeEditorClass(this.globalEditorHooksRef, this.globalEditorClassInstance);
    } else {
      newSettings.editor = this.props.hotEditor || getEditor('text');
    }

    return newSettings;
  }

  /**
   * Detect if `autoRowSize` or `autoColumnSize` is defined, and if so, throw an incompatibility warning.
   *
   * @param {Handsontable.GridSettings} newGlobalSettings New global settings passed as Handsontable config.
   */
  displayAutoSizeWarning(newGlobalSettings: Handsontable.GridSettings): void {
    if (
      this.hotInstance &&
      (
        this.hotInstance.getPlugin('autoRowSize')?.enabled ||
        this.hotInstance.getPlugin('autoColumnSize')?.enabled
      )
    ) {
      if (this.context.componentRendererColumns.size > 0) {
        warn(AUTOSIZE_WARNING);
      }
    }
  }

  /**
   * Handsontable's `beforeViewRender` hook callback.
   */
  handsontableBeforeViewRender(): void {
    this.context.clearPortalCache();
    this.context.clearRenderedCellCache();
  }

  /**
   * Handsontable's `afterViewRender` hook callback.
   */
  handsontableAfterViewRender(): void {
    this.context.pushCellPortalsIntoPortalManager();
  }

  /**
   * Call the `updateSettings` method for the Handsontable instance.
   *
   * @param {Object} newSettings The settings object.
   */
  private updateHot(newSettings: Handsontable.GridSettings): void {
    if (this.hotInstance) {
      this.hotInstance.updateSettings(newSettings, false);
    }
  }

  /*
  ---------------------------------------
  ------- React lifecycle methods -------
  ---------------------------------------
  */

  /**
   * Initialize Handsontable after the component has mounted.
   */
  componentDidMount(): void {
    const newGlobalSettings = this.createNewGlobalSettings();

    this.hotInstance = new Handsontable.Core(this.hotElementRef, newGlobalSettings);

    this.hotInstance.addHook('beforeViewRender', () => this.handsontableBeforeViewRender());
    this.hotInstance.addHook('afterViewRender', () => this.handsontableAfterViewRender());

    // `init` missing in Handsontable's type definitions.
    (this.hotInstance as any).init();

    this.displayAutoSizeWarning(newGlobalSettings);
    displayObsoleteRenderersEditorsWarning(this.props.children);
  }

  /**
   * Logic performed after the component update.
   */
  componentDidUpdate(): void {
    this.clearCache();

    const newGlobalSettings = this.createNewGlobalSettings();

    this.updateHot(newGlobalSettings);
    this.displayAutoSizeWarning(newGlobalSettings);
    displayObsoleteRenderersEditorsWarning(this.props.children);
  }

  /**
   * Destroy the Handsontable instance when the parent component unmounts.
   */
  componentWillUnmount(): void {
    this.clearCache();

    if (this.hotInstance) {
      this.hotInstance.destroy();
    }
  }

  /**
   * Render the component.
   */
  render(): React.ReactElement {
    const hotColumnWrapped = React.Children.toArray(this.props.children)
      .filter(isHotColumn)
      .map((childNode, columnIndex) => (
        <HotColumnContextProvider columnIndex={columnIndex}
                                  getOwnerDocument={this.getOwnerDocument.bind(this)}
                                  key={columnIndex}>
          {childNode}
        </HotColumnContextProvider>
      ));

    const containerProps = getContainerAttributesProps(this.props);
    const editorPortal = createEditorPortal(this.getOwnerDocument(), this.props.editor);

    return (
      <React.Fragment>
        <div ref={this.setHotElementRef.bind(this)} {...containerProps}>
          {hotColumnWrapped}
        </div>
        <RenderersPortalManager ref={this.context.setRenderersPortalManagerRef} />
        <EditorContextProvider hooksRef={this.globalEditorHooksRef}
                               hotCustomEditorInstanceRef={this.globalEditorClassInstance}>
          {editorPortal}
        </EditorContextProvider>
      </React.Fragment>
    )
  }
}

export default HotTableClass;
export { HotTableClass };
