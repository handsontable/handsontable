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
   * Trim the column settings array to the given length. Used to drop slots
   * left over from HotColumn children that have unmounted.
   *
   * @param {Number} length Target length for the column settings array.
   */
  readonly trimColumnSettings: (length: number) => void;

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

  const trimColumnSettings = useCallback((length: number) => {
    columnsSettings.current.length = length;
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

      const portalContainerKey = `${instanceGuid}-${key}`;
      const portalKey = `${key}-${instanceGuid}`;

      if (TD && !TD.getAttribute('ghost-table')) {
        const cachedPortalContainer = portalContainerCache.current.get(portalContainerKey);
        // When the cached portal container is still attached to the same
        // TD as the previous render, the DOM is already correct and must
        // not be wiped. Wiping detaches the React-managed children, which
        // forces a full remount of the renderer component on every grid
        // render (see issue #10800).
        const containerInPlace = !!cachedPortalContainer && cachedPortalContainer.parentNode === TD;

        const rendererElement = (
          <Renderer instance={instance}
                    TD={TD}
                    row={row}
                    col={col}
                    prop={prop}
                    value={value}
                    cellProperties={cellProperties}/>
        );

        const { portal, portalContainer } = createPortal(
          rendererElement, TD.ownerDocument, portalKey, cachedPortalContainer
        );

        if (!containerInPlace) {
          while (TD.firstChild) {
            TD.removeChild(TD.firstChild);
          }
          TD.appendChild(portalContainer);
        }

        portalContainerCache.current.set(portalContainerKey, portalContainer);
        portalCache.current.set(portalKey, portal);
      }

      renderedCellCache.current.set(key, TD);
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
    trimColumnSettings,
    getRendererWrapper,
    clearPortalCache,
    clearRenderedCellCache,
    setRenderersPortalManagerRef,
    pushCellPortalsIntoPortalManager
  }), [setHotColumnSettings, trimColumnSettings, getRendererWrapper, clearRenderedCellCache, setRenderersPortalManagerRef, pushCellPortalsIntoPortalManager]);

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
