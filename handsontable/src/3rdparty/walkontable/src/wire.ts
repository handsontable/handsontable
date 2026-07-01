/**
 * Composition root for the Walkontable rendering engine.
 *
 * `buildContext()` assembles the single `EngineContext` — the stable references (settings, DOM
 * window, geometry-read port) plus every late-bound and cyclic dependency, each defined ONCE as a
 * lazy thunk. Modules never receive this object directly; their narrow dependency sets are assembled
 * from it at their construction sites (today inline in `core/_base.ts` and `core/core.ts`; later via
 * per-slice `createXxxDeps(ctx)` factories). Centralizing the thunks here removes the duplication
 * where `getWtTable`/`getWtViewport`/`getTopOverlay`/`isDrawn` were re-declared in `ScrollDeps`,
 * `ViewportDeps`, and `TableDeps` separately.
 *
 * Behavior note: the thunks resolve `wtTable`/`wtViewport`/`wtOverlays` at call time, exactly when
 * the former DAO getters resolved them — so construction order and freshness are unchanged. Per the
 * refactor rules, the context exposes the STABLE owners (`getWtViewport()`), never the volatile
 * per-draw calculators; the row/column range-query mixins read the current calculator off the owner.
 */
import type { WalkontableInstance } from './types';
import type { default as Settings } from './settings';
import type { default as Table } from './table';
import type { default as Viewport } from './viewport';
import type { default as Overlays } from './overlays';
import type { SelectionManager } from './selection/manager';
import type { Overlay } from './overlay/_base';
import type { GeometryReader } from './geometry/geometryReader';
import type { default as EventManager } from '../../../eventManager';

/**
 * The engine composition context — the single source of truth for the engine's stable references and
 * its late-bound dependency thunks. Consumed only by the composition root and the per-module
 * dependency assembly; it is not passed to modules as-is.
 */
export interface EngineContext {
  wot: WalkontableInstance;
  wtSettings: Settings;
  // The DOM roots, flattened (there is no `domBindings` bag). `rootElement` is intentionally omitted:
  // it is assigned later by TableView and is never read inside the engine.
  rootDocument: Document;
  rootWindow: Window;
  rootTable: HTMLTableElement;
  geometryReader: GeometryReader;
  /**
   * Creates a fresh `EventManager` bound to the instance. Each module gets its own manager (matching
   * the previous `this.eventManager` getter), so the factory calls this once and stores the result —
   * it must not store the function and call it repeatedly.
   */
  makeEventManager: () => EventManager;
  /**
   * Resolves the facade for this instance. Per-instance (master and each clone differ), so it is a
   * thunk resolved at call time, never computed once and shared.
   */
  getFacade: () => Function;
  isDrawn: () => boolean;
  setDrawn: (value: boolean) => void;
  getWtTable: () => Table;
  getWtViewport: () => Viewport;
  getWtOverlays: () => Overlays;
  getWtEvent: () => WalkontableInstance['wtEvent'];
  getSelectionManager: () => SelectionManager;
  getCloneSource: () => WalkontableInstance;
  getParentTableOffset: () => { top: number; left: number } | number;
  getColumnHeaders: () => Function[];
  getRowHeaders: () => Function[];
  getTopOverlay: () => Overlay;
  getInlineStartOverlay: () => Overlay;
  getBottomOverlay: () => Overlay;
}

/**
 * Builds the engine composition context for a Walkontable instance (master or clone).
 *
 * Stable references (settings, window, geometry reader) are read once, up front. Everything the
 * engine creates later — the table, viewport, overlays, selection manager, and (for clones) the
 * clone source — is exposed as a thunk resolved at call time, so it stays fresh and the construction
 * order is unchanged.
 *
 * @param {WalkontableInstance} wot The Walkontable instance the context belongs to.
 * @returns {EngineContext}
 */
export function buildContext(wot: WalkontableInstance): EngineContext {
  return {
    wot,
    wtSettings: wot.wtSettings,
    rootDocument: wot.domBindings.rootDocument,
    rootWindow: wot.domBindings.rootWindow,
    rootTable: wot.domBindings.rootTable,
    geometryReader: wot.domBindings.geometryReader,
    makeEventManager: () => wot.eventManager,
    getFacade: () => wot.wtSettings.getSetting<Function>('facade', wot),
    isDrawn: () => wot.drawn,
    setDrawn: (value: boolean) => {
      wot.drawn = value;
    },
    getWtTable: () => wot.wtTable,
    getWtViewport: () => wot.wtViewport,
    getWtOverlays: () => wot.wtOverlays,
    getWtEvent: () => wot.wtEvent,
    getSelectionManager: () => wot.selectionManager,
    getCloneSource: () => wot.cloneSource,
    getParentTableOffset: () => wot.cloneSource.wtTable.tableOffset,
    getColumnHeaders: () => wot.wtSettings.getSetting<Function[]>('columnHeaders'),
    getRowHeaders: () => wot.wtSettings.getSetting<Function[]>('rowHeaders'),
    getTopOverlay: () => wot.wtOverlays.topOverlay,
    getInlineStartOverlay: () => wot.wtOverlays.inlineStartOverlay,
    getBottomOverlay: () => wot.wtOverlays.bottomOverlay,
  };
}
