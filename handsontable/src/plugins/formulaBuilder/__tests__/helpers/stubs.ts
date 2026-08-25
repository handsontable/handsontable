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
 * Minimal fake of a grid custom-selection instance, mirroring what the adapter
 * reads back from `selection.highlight.customSelections`.
 */
export interface CustomSelectionStub {
  /**
   * The settings the selection was created with (border props spread to the top level).
   */
  settings: Record<string, unknown>;
  /**
   * The visual cell range the selection was created with.
   */
  visualCellRange: unknown;
  /**
   * Destroy spy.
   */
  destroy: () => void;
  /**
   * Commit spy (called after in-place `visualCellRange` updates).
   */
  commit: () => void;
}

/**
 * Minimal fake of the grid highlight controller consumed by the adapter.
 */
export interface HighlightStub {
  /**
   * The custom selections registered so far.
   */
  customSelections: CustomSelectionStub[];
  /**
   * Creates a custom-selection stub from the config and appends it to the collection.
   *
   * @param {Record<string, unknown>} config The selection configuration.
   */
  addCustomSelection: (config: Record<string, unknown>) => void;
}

/**
 * Plain visual coordinates used by the stubbed coordinate factory.
 */
export interface CoordsStub {
  /**
   * Visual row index.
   */
  row: number;
  /**
   * Visual column index.
   */
  col: number;
}

/**
 * Plain cell-range fake produced by the stubbed `_createCellRange`. `isEqual` is
 * defined non-enumerably so `toEqual({ highlight, from, to })` assertions keep
 * passing.
 */
export interface RangeStub {
  /**
   * The highlight coordinates.
   */
  highlight: CoordsStub;
  /**
   * The start coordinates.
   */
  from: CoordsStub;
  /**
   * The end coordinates.
   */
  to: CoordsStub;
  /**
   * Coordinate equality, mirroring the walkontable `CellRange.isEqual` contract.
   */
  isEqual: (other: RangeStub) => boolean;
}

/**
 * The grid selection/rendering API fragment the adapter consumes, shared by every
 * test-local Handsontable stub.
 */
export interface GridSelectionApiStub {
  guid: string;
  view: {
    getOverlayByName: (overlayName: string) => {
      holder: HTMLElement | Window;
      clone: { wtTable: { wtRootElement: HTMLElement } } | null;
    } | null;
    render: jest.Mock;
  };
  selection: { highlight: HighlightStub };
  _createCellCoords: (row: number, col: number) => CoordsStub;
  _createCellRange: (highlight: CoordsStub, from?: CoordsStub, to?: CoordsStub) => RangeStub;
}

/**
 * Builds a cell-range fake with a non-enumerable `isEqual`.
 *
 * @param {CoordsStub} highlight The highlight coordinates.
 * @param {CoordsStub} [from] The start coordinates (defaults to the highlight).
 * @param {CoordsStub} [to] The end coordinates (defaults to the highlight).
 * @returns {RangeStub}
 */
export function makeRangeStub(highlight: CoordsStub, from?: CoordsStub, to?: CoordsStub): RangeStub {
  const range = { highlight, from: from ?? highlight, to: to ?? highlight } as RangeStub;

  Object.defineProperty(range, 'isEqual', {
    enumerable: false,
    value: (other: RangeStub) =>
      range.from.row === other.from.row && range.from.col === other.from.col &&
      range.to.row === other.to.row && range.to.col === other.to.col,
  });

  return range;
}

/**
 * Builds the grid selection/rendering API fragment (`guid`, `view`, `selection`,
 * coordinate factory) every test-local Handsontable stub needs since the adapter
 * renders highlights through custom selections.
 *
 * @param {string} [guid] The grid instance id used to scope generated class names.
 * @returns {GridSelectionApiStub}
 */
export function makeGridSelectionApiStub(guid = 'ht_teststub'): GridSelectionApiStub {
  return {
    guid,
    view: { getOverlayByName: () => null, render: jest.fn() },
    selection: { highlight: makeHighlightStub() },
    _createCellCoords: (row: number, col: number) => ({ row, col }),
    _createCellRange: makeRangeStub,
  };
}

/**
 * Members of the Handsontable surface the adapter and controller touch in unit tests.
 */
export interface HotStubShape extends GridSelectionApiStub {
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
}

/**
 * Builds a highlight-controller stub whose `addCustomSelection` records lightweight
 * custom-selection fakes.
 *
 * @returns {HighlightStub}
 */
export function makeHighlightStub(): HighlightStub {
  const highlight: HighlightStub = {
    customSelections: [],
    addCustomSelection: (config: Record<string, unknown>) => {
      const { border, visualCellRange, ...restOptions } = config;

      highlight.customSelections.push({
        settings: { ...(border as Record<string, unknown>), ...restOptions },
        visualCellRange,
        destroy: jest.fn(),
        commit: jest.fn(),
      });
    },
  };

  return highlight;
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
    ...makeGridSelectionApiStub(),
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
