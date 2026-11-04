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
import { ScopeIdentifier, HotRendererProps } from './types';
import { createPortal, getCellContentRoot, warnAboutClassicFunctionRenderer } from './helpers';
import { RenderersPortalManagerRef } from './renderersPortalManager';

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
   * @param {number} columnIndex Column index.
   */
  readonly emitColumnSettings: (columnSettings: Handsontable.ColumnSettings, columnIndex: number) => void;

  /**
   * Trim the column settings array to the given length. Used to drop slots
   * left over from HotColumn children that have unmounted.
   *
   * @param {number} length Target length for the column settings array.
   */
  readonly trimColumnSettings: (length: number) => void;

  /**
   * Return a renderer wrapper function for the provided renderer component.
   *
   * @param {ComponentType<HotRendererProps>} Renderer React renderer component.
   * @returns {Handsontable.renderers.BaseRenderer} The Handsontable rendering function.
   */
  readonly getRendererWrapper:
    (Renderer: ComponentType<HotRendererProps>) => typeof Handsontable.renderers.BaseRenderer;

  /**
   * Starts a view-render pass: forgets which portal containers the previous pass rendered.
   */
  readonly resetRenderedPortals: () => void;

  /**
   * Records a cell element the grid painted in the current view-render pass, whatever its renderer.
   *
   * @param {HTMLTableCellElement} TD The painted cell element.
   */
  readonly markCellPainted: (TD: HTMLTableCellElement) => void;

  /**
   * Returns the number of portal containers currently retained by the cache.
   * Diagnostic hook used to assert the cache stays bounded to the viewport
   * (it must not grow with the total scrolled row/column count).
   *
   * @returns {number} The portal container cache size.
   */
  readonly getPortalContainerCacheSize: () => number;

  /**
   * Set the renderers portal manager dispatch function.
   *
   * @param {RenderersPortalManagerRef} pm The PortalManager dispatch function.
   */
  readonly setRenderersPortalManagerRef: (pm: RenderersPortalManagerRef) => void;

  /**
   * Evicts the portals of the cells that left the grid and puts the rest into the portal manager.
   */
  readonly pushCellPortalsIntoPortalManager: () => void;
}

const HotTableContext = createContext<HotTableContextImpl | undefined>(undefined);

const HotTableContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const columnsSettings = useRef<Handsontable.ColumnSettings[]>([]);

  const setHotColumnSettings = useCallback((columnSettings: Handsontable.ColumnSettings, columnIndex: number) => {
    columnsSettings.current[columnIndex] = columnSettings;
  }, []);

  const trimColumnSettings = useCallback((length: number) => {
    columnsSettings.current.length = length;
  }, []);

  const componentRendererColumns = useRef<Map<number | 'global', boolean>>(new Map());
  // One entry per cell the grid shows with a component renderer: the cell element, the container in
  // it, and the portal that renders the component into the container. Keyed by the portal container key.
  const cellPortals = useRef<Map<string, {
    TD: HTMLTableCellElement,
    container: HTMLElement,
    portal: ReactPortal,
  }>>(new Map());

  /**
   * The renderer function made for each renderer component. It reads everything else through refs, so
   * one function serves every render, and an update that passes the same `<HotColumn>` settings again
   * finds them unchanged and leaves `columns` out.
   */
  const rendererWrappers = useRef<WeakMap<ComponentType<HotRendererProps>, typeof Handsontable.renderers.BaseRenderer>>(
    new WeakMap()
  );
  // Keys of the portal containers rendered in the current view-render pass.
  // Reset every `beforeViewRender` and used after the render to tell the cells
  // the pass painted from the ones it did not (see pushCellPortalsIntoPortalManager).
  const renderedPortalContainerKeys = useRef<Set<string>>(new Set());
  // Cell elements the grid painted in the current view-render pass, with any renderer. A cell element
  // the grid reuses for another cell keeps a component container when the new renderer does not clear
  // the element, so a connected container alone does not prove its cell is still shown.
  const paintedCells = useRef<Set<HTMLTableCellElement>>(new Set());
  const resetRenderedPortals = useCallback(() => {
    renderedPortalContainerKeys.current.clear();
    paintedCells.current.clear();
  }, []);
  const markCellPainted = useCallback((TD: HTMLTableCellElement) => {
    if (cellPortals.current.size > 0) {
      paintedCells.current.add(TD);
    }
  }, []);
  const getPortalContainerCacheSize = useCallback(() => cellPortals.current.size, []);

  // Stable id per table element the grid draws into. Handsontable renders the
  // same cell once per table it appears in — the master table plus an overlay
  // table for every fixed row/column edge — and each draw gets its own TD.
  const tableIds = useRef<WeakMap<Element, number>>(new WeakMap());
  const nextTableId = useRef(0);

  /**
   * Identify the table a rendered cell belongs to, so the master table and the
   * overlay tables get separate portal containers for the same cell.
   *
   * @param {HTMLTableCellElement} TD The cell being rendered.
   * @returns {number} The id of the table the cell belongs to.
   */
  const getTableId = useCallback((TD: HTMLTableCellElement): number => {
    // TD -> TR -> TBODY. The section belongs to exactly one table, and the
    // overlay tables are built once and never hand their cells to another
    // table, so it is a stable identity for the draw. Two property hops rather
    // than a selector walk, because this runs for every component-rendered
    // cell on every render.
    const tableSection: Element = TD.parentElement?.parentElement ?? TD;
    const cachedId = tableIds.current.get(tableSection);

    if (cachedId !== undefined) {
      return cachedId;
    }

    const id = nextTableId.current;

    nextTableId.current += 1;
    tableIds.current.set(tableSection, id);

    return id;
  }, []);

  const getRendererWrapper = useCallback((
    Renderer: ComponentType<HotRendererProps>
  ): typeof Handsontable.renderers.BaseRenderer => {
    const cachedWrapper = rendererWrappers.current.get(Renderer);

    if (cachedWrapper) {
      return cachedWrapper;
    }

    warnAboutClassicFunctionRenderer(Renderer);

    const wrapper = function __internalRenderer(instance, TD, row, col, prop, value, cellProperties) {
      const key = `${row}-${col}`;

      // Handsontable.Core type is missing guid
      const instanceGuid = (instance as unknown as { guid: string }).guid;

      if (TD && !TD.getAttribute('ghost-table')) {
        // The table has to be part of the key. A cell that sits in a fixed
        // column is drawn both in the master table and in the inline-start
        // overlay; keyed by coordinates alone, both draws share one container,
        // which then moves into whichever table rendered last and leaves the
        // other cell empty. The two tables then size their rows from different
        // content and stop lining up (see issue #9063).
        const tableId = getTableId(TD);
        const portalContainerKey = `${instanceGuid}-${tableId}-${key}`;
        const portalKey = `${key}-${tableId}-${instanceGuid}`;
        const cachedPortalContainer = cellPortals.current.get(portalContainerKey)?.container;
        // When the cached portal container is still attached to the same
        // TD as the previous render, the DOM is already correct and must
        // not be wiped. Wiping detaches the React-managed children, which
        // forces a full remount of the renderer component on every grid
        // render (see issue #10800).
        // A row rendered at an exact height (the `rowHeights` option) keeps the cell's content inside a
        // `div.htCellClip` wrapper that the grid adds after this renderer ran. The container then sits in
        // the wrapper, and wiping the cell on the next render would detach it all over again.
        const contentRoot = getCellContentRoot(TD);
        const containerInPlace = !!cachedPortalContainer && cachedPortalContainer.parentNode === contentRoot;

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
          while (contentRoot.firstChild) {
            contentRoot.removeChild(contentRoot.firstChild);
          }
          contentRoot.appendChild(portalContainer);
        }

        cellPortals.current.set(portalContainerKey, { TD, container: portalContainer, portal });
        renderedPortalContainerKeys.current.add(portalContainerKey);
      }

      return TD;
    };

    rendererWrappers.current.set(Renderer, wrapper);

    return wrapper;
  }, [getTableId]);

  const renderersPortalManager = useRef<RenderersPortalManagerRef>(() => undefined);

  const setRenderersPortalManagerRef = useCallback((pmComponent: RenderersPortalManagerRef) => {
    renderersPortalManager.current = pmComponent;
  }, []);

  const pushCellPortalsIntoPortalManager = useCallback(() => {
    // A cell this pass did not paint with its component either left the grid or
    // was skipped. The grid skips a cell that did not change (`renderMode:
    // 'onChange'`) and leaves its element as it is, so the portal must stay or
    // React unmounts the component and the cell goes blank. A cell that left the
    // grid had its element removed (the container is detached), or its element
    // was painted for another cell this pass (with a renderer that may not clear
    // the element): evict those, or the cache leaks O(rows × cols) nodes and a
    // stale component stays visible. Kept entries also preserve the in-place
    // reuse that avoids remounting renderer components on every grid render
    // (#10800).
    const paintedKeys = renderedPortalContainerKeys.current;
    const portals: ReactPortal[] = [];

    cellPortals.current.forEach(({ TD, container, portal }, cacheKey) => {
      if (!paintedKeys.has(cacheKey) && (!container.isConnected || paintedCells.current.has(TD))) {
        cellPortals.current.delete(cacheKey);

        return;
      }

      portals.push(portal);
    });

    renderersPortalManager.current!(portals);
  }, []);

  const contextImpl: HotTableContextImpl = useMemo(() => ({
    componentRendererColumns: componentRendererColumns.current,
    columnsSettings: columnsSettings.current,
    emitColumnSettings: setHotColumnSettings,
    trimColumnSettings,
    getRendererWrapper,
    resetRenderedPortals,
    markCellPainted,
    getPortalContainerCacheSize,
    setRenderersPortalManagerRef,
    pushCellPortalsIntoPortalManager
  }), [
    setHotColumnSettings,
    trimColumnSettings,
    getRendererWrapper,
    resetRenderedPortals,
    markCellPainted,
    getPortalContainerCacheSize,
    setRenderersPortalManagerRef,
    pushCellPortalsIntoPortalManager,
  ]);

  return (
    <HotTableContext.Provider value={contextImpl}>{children}</HotTableContext.Provider>
  );
};

/**
 * Exposes the table context object to components
 *
 * @returns {HotTableContextImpl} HotTableContext
 */
function useHotTableContext(): HotTableContextImpl {
  return useContext(HotTableContext)!;
}

export { HotTableContextProvider, useHotTableContext };
