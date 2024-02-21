import Handsontable from 'handsontable/base';
import React from 'react';
import { ScopeIdentifier, HotRendererProps } from './types'
import { createPortal } from './helpers'
import { RenderersPortalManager } from './renderersPortalManager'

export interface HotTableContextImpl {
  /**
   * Map with column indexes (or a string = 'global') as keys, and booleans as values. Each key represents a component-based editor
   * declared for the used column index, or a global one, if the key is the `global` string.
   */
  readonly componentRendererColumns: Map<ScopeIdentifier, boolean>;

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
   * Return a renderer wrapper function for the provided renderer component.
   *
   * @param {React.ComponentType<HotRendererProps>} Renderer React renderer component.
   * @returns {Handsontable.renderers.Base} The Handsontable rendering function.
   */
  readonly getRendererWrapper: (Renderer: React.ComponentType<HotRendererProps>) => typeof Handsontable.renderers.BaseRenderer;

  /**
   * Clears portals cache.
   */
  readonly clearPortalCache: () => void;

  /**
   * Clears rendered cells cache.
   */
  readonly clearRenderedCellCache: () => void;

  /**
   * Set the renderers portal manager ref.
   *
   * @param {RenderersPortalManager} pmComponent The PortalManager component.
   */
  readonly setRenderersPortalManagerRef: (pmComponent: RenderersPortalManager) => void;

  /**
   * Puts cell portals into portal manager and purges portals cache.
   */
  readonly pushCellPortalsIntoPortalManager: () => void;
}

const HotTableContext = React.createContext<HotTableContextImpl | undefined>(undefined);

const HotTableContextProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const columnsSettings = React.useRef<Handsontable.ColumnSettings[]>([]);

  const setHotColumnSettings = React.useCallback((columnSettings: Handsontable.ColumnSettings, columnIndex: number) => {
    columnsSettings.current[columnIndex] = columnSettings;
  }, [])

  const componentRendererColumns = React.useRef<Map<number | 'global', boolean>>(new Map());
  const renderedCellCache = React.useRef<Map<string, HTMLTableCellElement>>(new Map());
  const clearRenderedCellCache = React.useCallback(() => renderedCellCache.current.clear(), []);
  const portalCache = React.useRef<Map<string, React.ReactPortal>>(new Map());
  const clearPortalCache = React.useCallback(() => portalCache.current.clear(), []);
  const portalContainerCache = React.useRef<Map<string, HTMLElement>>(new Map());

  const getRendererWrapper = React.useCallback((Renderer: React.ComponentType<HotRendererProps>): typeof Handsontable.renderers.BaseRenderer => {
    return function __internalRenderer(instance, TD, row, col, prop, value, cellProperties) {
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
          const rendererElement = (
            <Renderer instance={instance}
                      TD={TD}
                      row={row}
                      col={col}
                      prop={prop}
                      value={value}
                      cellProperties={cellProperties}/>
          );

          const {portal, portalContainer} = createPortal(rendererElement, TD.ownerDocument, portalKey, cachedPortalContainer);

          portalContainerCache.current.set(portalContainerKey, portalContainer);
          TD.appendChild(portalContainer);

          portalCache.current.set(portalKey, portal);
        }
      }

      renderedCellCache.current.set(`${row}-${col}`, TD);
      return TD;
    };
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
    getRendererWrapper,
    clearPortalCache,
    clearRenderedCellCache,
    setRenderersPortalManagerRef,
    pushCellPortalsIntoPortalManager
  }), [setHotColumnSettings, getRendererWrapper, clearRenderedCellCache, setRenderersPortalManagerRef]);

  return (
    <HotTableContext.Provider value={contextImpl}>{children}</HotTableContext.Provider>
  );
};

export { HotTableContext, HotTableContextProvider };
