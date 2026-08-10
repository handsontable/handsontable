import type { HotInstance } from '../../../../core/types';
import type { VisualHfIndexMapping } from '../../types';
import type {
  FormulaBuilderPluginLike,
  HandsontableAdapterOptions,
} from '../../handsontableAdapter';

/**
 * Minimal index-mapper surface the adapter consumes to detect hidden rows/columns.
 */
export interface IndexMapperStub {
  getRenderableFromVisualIndex: (visualIndex: number) => number | null;
}

/**
 * Members of the Handsontable surface the adapter and controller touch in unit tests.
 */
export interface HotStubShape {
  getCell: (row: number, col: number, topmost?: boolean) => HTMLElement | null;
  getCoords: (td: HTMLElement) => { row: number | null; col: number | null } | null;
  getSettings: () => Record<string, unknown>;
  countRows: () => number;
  countCols: () => number;
  getDataAtCell: (row: number, col: number) => unknown;
  getActiveEditor: () => unknown;
  getSelectedRangeLast: () => { highlight: { row: number; col: number } } | undefined;
  getCellMetaTransient: (row: number, col: number) => { readOnly?: boolean } & Record<string, unknown>;
  rowIndexMapper: IndexMapperStub;
  columnIndexMapper: IndexMapperStub;
  addHook: (name: string, callback: (...args: unknown[]) => void) => void;
  removeHook: (name: string, callback: (...args: unknown[]) => void) => void;
  render: () => void;
  scrollViewportTo: (coords: {
    row?: number;
    col?: number;
    verticalSnap?: 'top' | 'bottom';
    horizontalSnap?: 'start' | 'end';
  }) => boolean;
  getFirstFullyVisibleRow: () => number;
  getLastFullyVisibleRow: () => number;
  getFirstFullyVisibleColumn: () => number;
  getLastFullyVisibleColumn: () => number;
  getFirstRenderedVisibleRow: () => number;
  getLastRenderedVisibleRow: () => number;
  getFirstRenderedVisibleColumn: () => number;
  getLastRenderedVisibleColumn: () => number;
  rootDocument: Document;
  rootWindow: Window & typeof globalThis;
  rootElement: HTMLElement;
  getCurrentThemeName: () => string | null;
  view: {
    getOverlayByName: (overlayName: string) => {
      holder: HTMLElement | Window;
      clone: { wtTable: { wtRootElement: HTMLElement } } | null;
    } | null;
  };
}

/**
 * Builds a Handsontable stub exposing exactly the surface the adapter consumes.
 *
 * @param {Partial<HotStubShape>} overrides Per-test member overrides.
 * @returns {HotInstance}
 */
export function makeHotStub(overrides: Partial<HotStubShape> = {}): HotInstance {
  const stub: HotStubShape = {
    getCell: () => null,
    getCoords: () => null,
    getSettings: () => ({}),
    countRows: () => 0,
    countCols: () => 0,
    getDataAtCell: () => null,
    getActiveEditor: () => undefined,
    getSelectedRangeLast: () => undefined,
    getCellMetaTransient: () => ({}),
    rowIndexMapper: { getRenderableFromVisualIndex: (visualIndex: number) => visualIndex },
    columnIndexMapper: { getRenderableFromVisualIndex: (visualIndex: number) => visualIndex },
    addHook: () => undefined,
    removeHook: () => undefined,
    render: () => undefined,
    scrollViewportTo: () => true,
    getFirstFullyVisibleRow: () => -1,
    getLastFullyVisibleRow: () => -1,
    getFirstFullyVisibleColumn: () => -1,
    getLastFullyVisibleColumn: () => -1,
    getFirstRenderedVisibleRow: () => 0,
    getLastRenderedVisibleRow: () => Number.MAX_SAFE_INTEGER,
    getFirstRenderedVisibleColumn: () => 0,
    getLastRenderedVisibleColumn: () => Number.MAX_SAFE_INTEGER,
    rootDocument: document,
    rootWindow: window as Window & typeof globalThis,
    rootElement: document.body,
    getCurrentThemeName: () => null,
    view: { getOverlayByName: () => null },
    ...overrides,
  };

  return stub as unknown as HotInstance;
}

/**
 * Builds an identity visual/HyperFormula index mapping.
 *
 * @param {Partial<VisualHfIndexMapping>} overrides Per-test member overrides.
 * @returns {VisualHfIndexMapping}
 */
export function makeIdentityMapping(
  overrides: Partial<VisualHfIndexMapping> = {},
): VisualHfIndexMapping {
  return {
    visualToHfRow: row => row,
    visualToHfCol: col => col,
    hfToVisualRow: row => row,
    hfToVisualCol: col => col,
    ...overrides,
  };
}

/**
 * Builds a plugin stub implementing the adapter-facing plugin surface.
 *
 * @returns {FormulaBuilderPluginLike}
 */
export function makePluginStub(): FormulaBuilderPluginLike {
  return {
    getActiveFormulaCell: () => null,
    onFormulaCellSelection: () => () => undefined,
    getRawCellText: () => '',
    onInlineEditStart: () => () => undefined,
    onEditorClose: () => () => undefined,
    onSwitchToInline: () => () => undefined,
    commitInlineEdit: () => undefined,
    cancelInlineEdit: () => undefined,
    setInlineEditorVisible: () => undefined,
    selectFirstFormulaCell: () => undefined,
    selectFormulaCell: () => undefined,
    selectFormulaCells: () => undefined,
  };
}

/**
 * Builds full adapter construction options around a Handsontable stub.
 *
 * @param {HotInstance} hot The Handsontable stub.
 * @param {HTMLElement} overlayHost The overlay host element.
 * @param {Partial<VisualHfIndexMapping>} mappingOverrides Index-mapping overrides.
 * @returns {HandsontableAdapterOptions}
 */
export function makeAdapterOptions(
  hot: HotInstance,
  overlayHost: HTMLElement,
  mappingOverrides: Partial<VisualHfIndexMapping> = {},
): HandsontableAdapterOptions {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const core = require('@hfe/core');

  return {
    hot,
    overlayHost,
    sheetName: '',
    core,
    indexMapping: makeIdentityMapping(mappingOverrides),
  };
}
