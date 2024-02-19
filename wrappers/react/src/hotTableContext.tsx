import Handsontable from 'handsontable/base';
import React from 'react';
import { EditorScopeIdentifier, HotEditorCache, HotEditorElement } from './types'
import { createPortal, getOriginalEditorClass, GLOBAL_EDITOR_SCOPE } from './helpers'
import { RenderersPortalManager } from './renderersPortalManager'

export interface HotTableContextImpl {
  /**
   * Map with column indexes (or a string = 'global') as keys, and booleans as values. Each key represents a component-based editor
   * declared for the used column index, or a global one, if the key is the `global` string.
   */
  readonly componentRendererColumns: Map<EditorScopeIdentifier, boolean>;

  /**
   * Array of object containing the column settings.
   */
  readonly columnsSettings: Handsontable.ColumnSettings[];

  /**
   * Sets the column settings based on information received from HotColumn.
   *
   * @param {HotTableProps} columnSettings Column settings object.
   * @param {Number} columnIndex Column index.
   */
  readonly emitColumnSettings: (columnSettings: Handsontable.ColumnSettings, columnIndex: number) => void;

  /**
   * Editor cache.
   */
  readonly editorCache: HotEditorCache;

  /**
   * Return a renderer wrapper function for the provided renderer component.
   *
   * @param {React.ReactElement} rendererElement React renderer component.
   * @returns {Handsontable.renderers.Base} The Handsontable rendering function.
   */
  readonly getRendererWrapper: (rendererNode: React.ReactElement) => typeof Handsontable.renderers.BaseRenderer;

  /**
   * Clears portals cache.
   */
  readonly clearPortalCache: () => void;

  /**
   * Clears rendered cells cache.
   */
  readonly clearRenderedCellCache: () => void;

  /**
   * Create a fresh class to be used as an editor, based on the provided editor React element.
   *
   * @param {React.ReactElement} editorElement React editor component.
   * @param {string|number} [editorColumnScope] The editor scope (column index or a 'global' string). Defaults to
   * 'global'.
   * @returns {Function} A class to be passed to the Handsontable editor settings.
   */
  readonly getEditorClass: (editorElement: HotEditorElement, editorColumnScope?: EditorScopeIdentifier) => typeof Handsontable.editors.BaseEditor | undefined;

  /**
   * Set the renderers portal manager ref.
   *
   * @param {React.ReactComponent} pmComponent The PortalManager component.
   */
  readonly setRenderersPortalManagerRef: (pmComponent: RenderersPortalManager) => void;

  /**
   * Puts cell portals into portal manager and purges portals cache.
   */
  readonly pushCellPortalsIntoPortalManager: () => void;
}

const HotTableContext = React.createContext<HotTableContextImpl | undefined>(undefined);

/**
 * Create a class to be passed to the Handsontable's settings.
 *
 * @param {React.ReactElement} editorComponent React editor component.
 * @returns {Function} A class to be passed to the Handsontable editor settings.
 */
function makeEditorClass(editorComponent: React.Component): typeof Handsontable.editors.BaseEditor {
  const customEditorClass = class CustomEditor extends Handsontable.editors.BaseEditor implements Handsontable.editors.BaseEditor {
    editorComponent: React.Component;

    constructor(hotInstance: Handsontable.Core) {
      super(hotInstance);

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
  };

  // Fill with the rest of the BaseEditor methods
  Object.getOwnPropertyNames(Handsontable.editors.BaseEditor.prototype).forEach(propName => {
    if (propName === 'constructor') {
      return;
    }

    (customEditorClass as any).prototype[propName] = function (...args: any[]) {
      return (editorComponent as any)[propName].call(editorComponent, ...args);
    }
  });

  return customEditorClass;
}

const HotTableContextProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const columnsSettings = React.useRef<Handsontable.ColumnSettings[]>([]);

  const setHotColumnSettings = React.useCallback((columnSettings: Handsontable.ColumnSettings, columnIndex: number) => {
    columnsSettings.current[columnIndex] = columnSettings;
  }, [])

  const componentRendererColumns = React.useRef<Map<number | 'global', boolean>>(new Map());
  const editorCache = React.useRef<HotEditorCache>(new Map());
  const renderedCellCache = React.useRef<Map<string, HTMLTableCellElement>>(new Map());
  const clearRenderedCellCache = React.useCallback(() => renderedCellCache.current.clear(), []);
  const portalCache = React.useRef<Map<string, React.ReactPortal>>(new Map());
  const clearPortalCache = React.useCallback(() => portalCache.current.clear(), []);
  const portalContainerCache = React.useRef<Map<string, HTMLElement>>(new Map());

  const getRendererWrapper = React.useCallback((rendererElement: React.ReactElement): typeof Handsontable.renderers.BaseRenderer => {
    return function (instance, TD, row, col, prop, value, cellProperties) {
      const key = `${row}-${col}`;

      // Handsontable.Core type is missing guid
      const instanceGuid = (instance as unknown as { guid: string }).guid;

      const portalContainerKey = `${instanceGuid}-${key}`
      const portalKey = `${key}-${instanceGuid}`

      if (renderedCellCache.current.has(key)) {
        TD.innerHTML = renderedCellCache.current.get(key).innerHTML;
      }

      if (TD && !TD.getAttribute('ghost-table')) {
        const cachedPortal = portalCache.current.get(portalKey);
        const cachedPortalContainer = portalContainerCache.current.get(portalContainerKey);

        while (TD.firstChild) {
          TD.removeChild(TD.firstChild);
        }

        // if portal already exists, do not recreate
        if (cachedPortal && cachedPortalContainer) {
          TD.appendChild(cachedPortalContainer);
        } else {
          const { portal, portalContainer } = createPortal(rendererElement, {
            TD,
            row,
            col,
            prop,
            value,
            cellProperties,
            isRenderer: true
          }, TD.ownerDocument, portalKey, cachedPortalContainer);

          portalContainerCache.current.set(portalContainerKey, portalContainer);
          TD.appendChild(portalContainer);

          portalCache.current.set(portalKey, portal);
        }
      }

      renderedCellCache.current.set(`${row}-${col}`, TD);
      return TD;
    };
  }, []);

  const getEditorClass = React.useCallback((editorElement: HotEditorElement, editorColumnScope: EditorScopeIdentifier = GLOBAL_EDITOR_SCOPE): typeof Handsontable.editors.BaseEditor | undefined => {
    const editorClass = getOriginalEditorClass(editorElement);
    const cachedComponent = editorCache.current.get(editorClass)?.get(editorColumnScope);

    if (cachedComponent) {
      return makeEditorClass(cachedComponent);
    }
  }, []);

  const renderersPortalManager = React.useRef<RenderersPortalManager | null>(null);

  const setRenderersPortalManagerRef = React.useCallback((pmComponent: RenderersPortalManager) => {
    renderersPortalManager.current = pmComponent;
  }, []);

  const pushCellPortalsIntoPortalManager = React.useCallback(() => {
    renderersPortalManager.current!.setState({
      portals: [...portalCache.current.values()]
    });
  }, []);

  const contextImpl: HotTableContextImpl = React.useMemo(() => ({
    componentRendererColumns: componentRendererColumns.current,
    columnsSettings: columnsSettings.current,
    emitColumnSettings: setHotColumnSettings,
    editorCache: editorCache.current,
    getRendererWrapper,
    clearPortalCache,
    clearRenderedCellCache,
    getEditorClass,
    setRenderersPortalManagerRef,
    pushCellPortalsIntoPortalManager
  }), [setHotColumnSettings, getRendererWrapper, clearRenderedCellCache, getEditorClass, setRenderersPortalManagerRef]);

  return (
    <HotTableContext.Provider value={contextImpl}>{children}</HotTableContext.Provider>
  );
};

export { HotTableContext, HotTableContextProvider };
