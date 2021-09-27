import React from 'react';
import Handsontable from 'handsontable';
import { SettingsMapper } from './settingsMapper';
import { PortalManager } from './portalManager';
import { HotColumn } from './hotColumn';
import * as packageJson from '../package.json';
import {
  HotTableProps,
  HotEditorElement
} from './types';
import {
  HOT_DESTROYED_WARNING,
  AUTOSIZE_WARNING,
  createEditorPortal,
  createPortal,
  getChildElementByType,
  getContainerAttributesProps,
  getExtendedEditorElement,
  getOriginalEditorClass,
  addUnsafePrefixes,
  removeEditorContainers,
  warn
} from './helpers';
import PropTypes from 'prop-types';

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
 * @class HotTable
 */
class HotTable extends React.Component<HotTableProps, {}> {
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
   * Array of object containing the column settings.
   *
   * @type {Array}
   */
  columnSettings: Handsontable.ColumnSettings[] = [];

  /**
   * Component used to manage the renderer portals.
   *
   * @type {React.Component}
   */
  portalManager: PortalManager = null;

  /**
   * Array containing the portals cashed to be rendered in bulk after Handsontable's render cycle.
   */
  portalCacheArray: React.ReactPortal[] = [];

  /**
   * Global editor portal cache.
   *
   * @private
   * @type {React.ReactPortal}
   */
  private globalEditorPortal: React.ReactPortal = null;

  /**
   * The rendered cells cache.
   *
   * @private
   * @type {Map}
   */
  private renderedCellCache: Map<string, HTMLTableCellElement> = new Map();

  /**
   * Editor cache.
   *
   * @private
   * @type {Map}
   */
  private editorCache: Map<Function, React.Component> = new Map();

  /**
   * Map with column indexes (or a string = 'global') as keys, and booleans as values. Each key represents a component-based editor
   * declared for the used column index, or a global one, if the key is the `global` string.
   *
   * @private
   * @type {Map}
   */
  private componentRendererColumns: Map<number | string, boolean> = new Map();

  /**
   * HotTable class constructor.
   *
   * @param {HotTableProps} props Component props.
   * @param {*} [context] Component context.
   */
  constructor(props: HotTableProps, context?: any) {
    super(props, context);

    addUnsafePrefixes(this);
  }

  /**
   * Package version getter.
   *
   * @returns The version number of the package.
   */
  static get version(): string {
    return (packageJson as any).version;
  }

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
   * Get the rendered table cell cache.
   *
   * @returns {Map}
   */
  getRenderedCellCache(): Map<string, HTMLTableCellElement> {
    return this.renderedCellCache;
  }

  /**
   * Get the editor cache and return it.
   *
   * @returns {Map}
   */
  getEditorCache(): Map<Function, React.Component> {
    return this.editorCache;
  }

  /**
   * Get the global editor portal property.
   *
   * @return {React.ReactPortal} The global editor portal.
   */
  getGlobalEditorPortal(): React.ReactPortal {
    return this.globalEditorPortal;
  }

  /**
   * Set the private editor portal cache property.
   *
   * @param {React.ReactPortal} portal Global editor portal.
   */
  setGlobalEditorPortal(portal: React.ReactPortal): void {
    this.globalEditorPortal = portal;
  }

  /**
   * Clear both the editor and the renderer cache.
   */
  clearCache(): void {
    const renderedCellCache = this.getRenderedCellCache();

    this.setGlobalEditorPortal(null);
    removeEditorContainers(this.getOwnerDocument());
    this.getEditorCache().clear();

    renderedCellCache.clear();

    this.componentRendererColumns.clear();
  }

  /**
   * Get the `Document` object corresponding to the main component element.
   *
   * @returns The `Document` object used by the component.
   */
  getOwnerDocument() {
    return this.hotElementRef ? this.hotElementRef.ownerDocument : document;
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
   * Return a renderer wrapper function for the provided renderer component.
   *
   * @param {React.ReactElement} rendererElement React renderer component.
   * @returns {Handsontable.renderers.Base} The Handsontable rendering function.
   */
  getRendererWrapper(rendererElement: React.ReactElement): Handsontable.renderers.Base | any {
    const hotTableComponent = this;

    return function (instance, TD, row, col, prop, value, cellProperties) {
      const renderedCellCache = hotTableComponent.getRenderedCellCache();

      if (renderedCellCache.has(`${row}-${col}`)) {
        TD.innerHTML = renderedCellCache.get(`${row}-${col}`).innerHTML;
      }

      if (TD && !TD.getAttribute('ghost-table')) {

        const {portal, portalContainer} = createPortal(rendererElement, {
          TD,
          row,
          col,
          prop,
          value,
          cellProperties,
          isRenderer: true
        }, () => {
        }, TD.ownerDocument);

        while (TD.firstChild) {
          TD.removeChild(TD.firstChild);
        }

        TD.appendChild(portalContainer);

        hotTableComponent.portalCacheArray.push(portal);
      }

      renderedCellCache.set(`${row}-${col}`, TD);

      return TD;
    };
  }

  /**
   * Create a fresh class to be used as an editor, based on the provided editor React element.
   *
   * @param {React.ReactElement} editorElement React editor component.
   * @returns {Function} A class to be passed to the Handsontable editor settings.
   */
  getEditorClass(editorElement: HotEditorElement): typeof Handsontable.editors.BaseEditor {
    const editorClass = getOriginalEditorClass(editorElement);
    const editorCache = this.getEditorCache();
    let cachedComponent: React.Component = editorCache.get(editorClass);

    return this.makeEditorClass(cachedComponent);
  }

  /**
   * Create a class to be passed to the Handsontable's settings.
   *
   * @param {React.ReactElement} editorComponent React editor component.
   * @returns {Function} A class to be passed to the Handsontable editor settings.
   */
  makeEditorClass(editorComponent: React.Component): typeof Handsontable.editors.BaseEditor {
    const customEditorClass = class CustomEditor extends Handsontable.editors.BaseEditor implements Handsontable._editors.Base {
      editorComponent: React.Component;

      constructor(hotInstance, row, col, prop, TD, cellProperties) {
        super(hotInstance, row, col, prop, TD, cellProperties);

        (editorComponent as any).hotCustomEditorInstance = this;

        this.editorComponent = editorComponent;
      }

      focus() {
      }

      getValue() {
      }

      setValue() {
      }

      open() {
      }

      close() {
      }
    } as any;

    // Fill with the rest of the BaseEditor methods
    Object.getOwnPropertyNames(Handsontable.editors.BaseEditor.prototype).forEach(propName => {
      if (propName === 'constructor') {
        return;
      }

      customEditorClass.prototype[propName] = function (...args) {
        return editorComponent[propName].call(editorComponent, ...args);
      }
    });

    return customEditorClass;
  }

  /**
   * Get the renderer element for the entire HotTable instance.
   *
   * @returns {React.ReactElement} React renderer component element.
   */
  getGlobalRendererElement(): React.ReactElement {
    const hotTableSlots: React.ReactNode = this.props.children;

    return getChildElementByType(hotTableSlots, 'hot-renderer');
  }

  /**
   * Get the editor element for the entire HotTable instance.
   *
   * @param {React.ReactNode} [children] Children of the HotTable instance. Defaults to `this.props.children`.
   * @returns {React.ReactElement} React editor component element.
   */
  getGlobalEditorElement(children: React.ReactNode = this.props.children): HotEditorElement | null {
    return getExtendedEditorElement(children, this.getEditorCache());
  }

  /**
   * Create the global editor portal and its destination HTML element if needed.
   *
   * @param {React.ReactNode} [children] Children of the HotTable instance. Defaults to `this.props.children`.
   */
  createGlobalEditorPortal(children: React.ReactNode = this.props.children): void {
    const globalEditorElement: HotEditorElement = this.getGlobalEditorElement(children);

    if (globalEditorElement) {
      this.setGlobalEditorPortal(createEditorPortal(this.getOwnerDocument() ,globalEditorElement, this.getEditorCache()))
    }
  }

  /**
   * Create a new settings object containing the column settings and global editors and renderers.
   *
   * @returns {Handsontable.GridSettings} New global set of settings for Handsontable.
   */
  createNewGlobalSettings(): Handsontable.GridSettings {
    const newSettings = SettingsMapper.getSettings(this.props);
    const globalRendererNode = this.getGlobalRendererElement();
    const globalEditorNode = this.getGlobalEditorElement();

    newSettings.columns = this.columnSettings.length ? this.columnSettings : newSettings.columns;

    if (globalEditorNode) {
      newSettings.editor = this.getEditorClass(globalEditorNode);

    } else {
      newSettings.editor = this.props.editor || (this.props.settings ? this.props.settings.editor : void 0);
    }

    if (globalRendererNode) {
      newSettings.renderer = this.getRendererWrapper(globalRendererNode);
      this.componentRendererColumns.set('global', true);

    } else {
      newSettings.renderer = this.props.renderer || (this.props.settings ? this.props.settings.renderer : void 0);
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
        this.hotInstance.getPlugin('autoRowSize').enabled ||
        this.hotInstance.getPlugin('autoColumnSize').enabled
      )
    ){
      if (this.componentRendererColumns.size > 0) {
        warn(AUTOSIZE_WARNING);
      }
    }
  }

  /**
   * Sets the column settings based on information received from HotColumn.
   *
   * @param {HotTableProps} columnSettings Column settings object.
   * @param {Number} columnIndex Column index.
   */
  setHotColumnSettings(columnSettings: Handsontable.ColumnSettings, columnIndex: number): void {
    this.columnSettings[columnIndex] = columnSettings;
  }

  /**
   * Handsontable's `beforeViewRender` hook callback.
   */
  handsontableBeforeViewRender(): void {
    this.getRenderedCellCache().clear();
  }

  /**
   * Handsontable's `afterViewRender` hook callback.
   */
  handsontableAfterViewRender(): void {
    this.portalManager.setState(() => {
      return Object.assign({}, {
        portals: this.portalCacheArray
      });

    }, () => {
      this.portalCacheArray.length = 0;
    });
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

  /**
   * Set the portal manager ref.
   *
   * @param {React.ReactComponent} pmComponent The PortalManager component.
   */
  private setPortalManagerRef(pmComponent: PortalManager): void {
    this.portalManager = pmComponent;
  }

  /*
  ---------------------------------------
  ------- React lifecycle methods -------
  ---------------------------------------
  */

  /**
   * Logic performed before the mounting of the component.
   */
  componentWillMount(): void {
    this.clearCache();
    this.createGlobalEditorPortal();
  }

  /**
   * Initialize Handsontable after the component has mounted.
   */
  componentDidMount(): void {
    const hotTableComponent = this;
    const newGlobalSettings = this.createNewGlobalSettings();

    this.hotInstance = new Handsontable.Core(this.hotElementRef, newGlobalSettings);

    this.hotInstance.addHook('beforeViewRender', function (isForced) {
      hotTableComponent.handsontableBeforeViewRender();
    });

    this.hotInstance.addHook('afterViewRender', function () {
      hotTableComponent.handsontableAfterViewRender();
    });

    // `init` missing in Handsontable's type definitions.
    (this.hotInstance as any).init();

    this.displayAutoSizeWarning(newGlobalSettings);
  }

  /**
   * Logic performed before the component update.
   */
  componentWillUpdate(nextProps: Readonly<HotTableProps>, nextState: Readonly<{}>, nextContext: any): void {
    this.clearCache();
    removeEditorContainers(this.getOwnerDocument());
    this.createGlobalEditorPortal(nextProps.children);
  }

  /**
   * Logic performed after the component update.
   */
  componentDidUpdate(): void {
    const newGlobalSettings = this.createNewGlobalSettings();
    this.updateHot(newGlobalSettings);

    this.displayAutoSizeWarning(newGlobalSettings);
  }

  /**
   * Destroy the Handsontable instance when the parent component unmounts.
   */
  componentWillUnmount(): void {
    if (this.hotInstance) {
      this.hotInstance.destroy();
    }

    removeEditorContainers(this.getOwnerDocument());
  }

  /**
   * Render the component.
   */
  render(): React.ReactElement {
    const {id, className, style} = getContainerAttributesProps(this.props);
    const isHotColumn = (childNode: any) => childNode.type === HotColumn;
    let children = React.Children.toArray(this.props.children);

    // filter out anything that's not a HotColumn
    children = children.filter(function (childNode: any) {
      return isHotColumn(childNode);
    });

    // clone the HotColumn nodes and extend them with the callbacks
    let childClones = children.map((childNode: React.ReactElement, columnIndex: number) => {
      return React.cloneElement(childNode, {
        _componentRendererColumns: this.componentRendererColumns,
        _emitColumnSettings: this.setHotColumnSettings.bind(this),
        _columnIndex: columnIndex,
        _getChildElementByType: getChildElementByType.bind(this),
        _getRendererWrapper: this.getRendererWrapper.bind(this),
        _getEditorClass: this.getEditorClass.bind(this),
        _getOwnerDocument: this.getOwnerDocument.bind(this),
        _getEditorCache: this.getEditorCache.bind(this),
        children: childNode.props.children
      } as object);
    });

    // add the global editor to the list of children
    childClones.push(this.getGlobalEditorPortal());

    return (
      <React.Fragment>
        <div ref={this.setHotElementRef.bind(this)} id={id} className={className} style={style}>
          {childClones}
        </div>
        <PortalManager ref={this.setPortalManagerRef.bind(this)}></PortalManager>
      </React.Fragment>
    )
  }
}

export default HotTable;
export { HotTable };
