import Handsontable from 'handsontable/base';
import React, {
  ComponentType,
  FC,
  PropsWithChildren,
  ReactPortal,
  createContext,
  useCallback,
  useRef,
  useMemo,
  useContext,
} from 'react';
import { ScopeIdentifier, HotRendererProps } from './types'
import { createPortal } from './helpers'
import { RenderersPortalManagerRef } from './renderersPortalManager'

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
   * @param {ComponentType<HotRendererProps>} Renderer React renderer component.
   * @returns {Handsontable.renderers.BaseRenderer} The Handsontable rendering function.
   */
  readonly getRendererWrapper: (Renderer: ComponentType<HotRendererProps>) => typeof Handsontable.renderers.BaseRenderer;

  /**
   * Clears portals cache.
   */
  readonly clearPortalCache: () => void;

  /**
   * Clears rendered cells cache.
   */
  readonly clearRenderedCellCache: () => void;

  /**
   * Set the renderers portal manager dispatch function.
   *
   * @param {RenderersPortalManagerRef} pm The PortalManager dispatch function.
   */
  readonly setRenderersPortalManagerRef: (pm: RenderersPortalManagerRef) => void;

  /**
   * Puts cell portals into portal manager and purges portals cache.
   */
  readonly pushCellPortalsIntoPortalManager: () => void;
}

const HotTableContext = createContext<HotTableContextImpl | undefined>(undefined);

const HotTableContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const columnsSettings = useRef<Handsontable.ColumnSettings[]>([]);

  const setHotColumnSettings = useCallback((columnSettings: Handsontable.ColumnSettings, columnIndex: number) => {
    columnsSettings.current[columnIndex] = columnSettings;
  }, [])

  const componentRendererColumns = useRef<Map<number | 'global', boolean>>(new Map());
  const renderedCellCache = useRef<Map<string, HTMLTableCellElement>>(new Map());
  const clearRenderedCellCache = useCallback(() => renderedCellCache.current.clear(), []);
  const portalCache = useRef<Map<string, ReactPortal>>(new Map());
  const clearPortalCache = useCallback(() => portalCache.current.clear(), []);
  const portalContainerCache = useRef<Map<string, HTMLElement>>(new Map());

  const getRendererWrapper = useCallback((Renderer: ComponentType<HotRendererProps>): typeof Handsontable.renderers.BaseRenderer => {
    return function __internalRenderer(instance, TD, row, col, prop, value, cellProperties) {
      const key = `${row}-${col}`;

      // Handsontable.Core type is missing guid
      const instanceGuid = (instance as unknown as { guid: string }).guid;

      const portalContainerKey = `${instanceGuid}-${key}`
      const portalKey = `${key}-${instanceGuid}`

      if (renderedCellCache.current.has(key)) {
        TD.innerHTML = renderedCellCache.current.get(key)!.innerHTML;
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

  const renderersPortalManager = useRef<RenderersPortalManagerRef>(() => undefined);

  const setRenderersPortalManagerRef = useCallback((pmComponent: RenderersPortalManagerRef) => {
    renderersPortalManager.current = pmComponent;
  }, []);

  const pushCellPortalsIntoPortalManager = useCallback(() => {
    renderersPortalManager.current!([...portalCache.current.values()]);
  }, []);

  const contextImpl: HotTableContextImpl = useMemo(() => ({
    componentRendererColumns: componentRendererColumns.current,
    columnsSettings: columnsSettings.current,
    emitColumnSettings: setHotColumnSettings,
    getRendererWrapper,
    clearPortalCache,
    clearRenderedCellCache,
    setRenderersPortalManagerRef,
    pushCellPortalsIntoPortalManager
  }), [setHotColumnSettings, getRendererWrapper, clearRenderedCellCache, setRenderersPortalManagerRef, pushCellPortalsIntoPortalManager]);

  return (
    <HotTableContext.Provider value={contextImpl}>{children}</HotTableContext.Provider>
  );
};

/**
 * Exposes the table context object to components
 *
 * @returns HotTableContext
 */
function useHotTableContext(): HotTableContextImpl {
  return useContext(HotTableContext)!;
}

export { HotTableContextProvider, useHotTableContext };
