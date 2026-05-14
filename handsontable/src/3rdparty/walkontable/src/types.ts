/**
 * Internal type definitions for the Walkontable rendering engine.
 * These are NOT part of the public Handsontable API.
 */
import type { CellCoords, CellRange } from '../../../common';

export interface WotSelectionManager {
  getBorderInstances(selection: object): object[];
  getFocusSelection(): { cellRange: CellRange | null; settings: Record<string, unknown>; [key: string]: unknown } | null;
  getAreaSelection(): { cellRange: CellRange | null; settings: Record<string, unknown>; [key: string]: unknown } | null;
  setActiveOverlay(activeWot: WalkontableInstance): WotSelectionManager;
  render(fastDraw: boolean): void;
  [key: string]: unknown;
}

export interface WalkontableInstance {
  wtTable: WtTable;
  wtViewport: WtViewport;
  wtOverlays: WtOverlays;
  wtSettings: WtSettings;
  selectionManager: WotSelectionManager;
  cloneSource: WalkontableInstance;
  drawn: boolean;
  domBindings: DomBindings;
  rootDocument: Document;
  rootWindow: Window & typeof globalThis;
  eventManager: Record<string, Function>;
  activeOverlayName: string;
  wtEvent: Record<string, unknown>;
  drawInterrupted: boolean;
  guid: string;
  createCellCoords(row: number, column: number): CellCoords;
  createCellRange(highlight: CellCoords, from: CellCoords, to: CellCoords): CellRange;
  getSetting(key: string, ...args: unknown[]): unknown;
  update(key: string, value: unknown): WalkontableInstance;
  draw(fastDraw?: boolean): WalkontableInstance;
  scrollViewport(coords: CellCoords | { row: number; col: number }, snapToTop?: boolean | string, snapToRight?: boolean | string, snapToBottom?: boolean, snapToLeft?: boolean): boolean;
  scrollViewportHorizontally(column: number, snapping?: string): boolean;
  scrollViewportVertically(row: number, snapping?: string): boolean;
  getCell(coords: CellCoords | { row: number; col: number }, topmost?: boolean): HTMLTableCellElement | number;
  getOverlayName(): string;
  getOverlayByName(name: string): WalkontableInstance | null;
  exportSettingsAsClassNames(): string[];
  hasSetting(key: string): boolean;
  destroy(): void;
  wtScroll: WtScroll;
  [key: string]: unknown;
}

export interface WtScroll {
  getFirstVisibleRow(): number;
  getLastVisibleRow(): number;
  getFirstVisibleColumn(): number;
  getLastVisibleColumn(): number;
  getFirstPartiallyVisibleRow(): number;
  getLastPartiallyVisibleRow(): number;
  getFirstPartiallyVisibleColumn(): number;
  getLastPartiallyVisibleColumn(): number;
  [key: string]: unknown;
}

export interface WtTable {
  TABLE: HTMLTableElement;
  THEAD: HTMLTableSectionElement;
  TBODY: HTMLTableSectionElement;
  holder: HTMLElement;
  hider: HTMLElement;
  spreader: HTMLElement;
  wtRootElement: HTMLElement;
  bordersHolder: HTMLElement;
  name: string;
  getCell(coords: CellCoords, topmost?: boolean): HTMLTableCellElement | number;
  getCoords(element: HTMLElement): CellCoords;
  getColumnHeader(col: number, level?: number): HTMLElement | undefined;
  getRowHeader(row: number, level?: number): HTMLElement | undefined;
  getColumnHeaders(column?: number): Function[] | HTMLTableCellElement[];
  getColumnHeadersCount(): number;
  getRowHeaders(row?: number): Function[] | HTMLTableCellElement[];
  getRowHeadersCount(): number;
  getRenderedRowsCount(): number;
  getRenderedColumnsCount(): number;
  getVisibleRowsCount(): number;
  getVisibleColumnsCount(): number;
  getFirstRenderedRow(): number;
  getFirstRenderedColumn(): number;
  getLastRenderedRow(): number;
  getLastRenderedColumn(): number;
  getFirstVisibleRow(): number;
  getFirstVisibleColumn(): number;
  getLastVisibleRow(): number;
  getLastVisibleColumn(): number;
  getFirstPartiallyVisibleRow(): number;
  getFirstPartiallyVisibleColumn(): number;
  getLastPartiallyVisibleRow(): number;
  getLastPartiallyVisibleColumn(): number;
  isRowBeforeRenderedRows(row: number): boolean;
  isRowAfterRenderedRows(row: number): boolean;
  isColumnBeforeRenderedColumns(column: number): boolean;
  isColumnAfterRenderedColumns(column: number): boolean;
  isVisible(): boolean;
  hasDefinedSize(): boolean;
  isAriaEnabled(): boolean;
  tableOffset: { top: number; left: number };
  renderedRowToSource(row: number): number;
  renderedColumnToSource(column: number): number;
  columnFilter: { sourceToRendered(index: number): number; renderedToSource(index: number): number; [key: string]: unknown };
  rowFilter: { sourceToRendered(index: number): number; renderedToSource(index: number): number; [key: string]: unknown };
  getTotalWidth(): number;
  getTotalHeight(): number;
  getWidth(): number;
  getHeight(): number;
  getRowHeight(sourceRow: number): number;
  getColumnWidth(sourceColumn: number): number;
  getColumnHeaderHeight(level: number): number;
  draw(fastDraw?: boolean): unknown;
  alignOverlaysWithTrimmingContainer(): void;
  holderOffset: { top: number; left: number } | number;
  [key: string]: unknown;
}

export interface ViewportCalculator {
  startRow: number | null;
  endRow: number | null;
  startColumn: number | null;
  endColumn: number | null;
  startPosition: number;
  count: number;
  rowStartOffset: number;
  rowEndOffset: number;
  columnStartOffset: number;
  columnEndOffset: number;
  isVisibleInTrimmingContainer: boolean;
  [key: string]: unknown;
}

export interface WtViewport {
  columnsRenderCalculator: ViewportCalculator;
  columnsVisibleCalculator: ViewportCalculator;
  columnsPartiallyVisibleCalculator: ViewportCalculator;
  rowsRenderCalculator: ViewportCalculator;
  rowsVisibleCalculator: ViewportCalculator;
  rowsPartiallyVisibleCalculator: ViewportCalculator;
  getWorkspaceWidth(): number;
  getWorkspaceHeight(): number;
  getViewportWidth(): number;
  getViewportHeight(): number;
  getRowHeaderWidth(): number;
  getColumnHeaderHeight(): number;
  hasOversizedColumnHeadersMarked: Record<string, boolean>;
  oversizedRows: Record<number, number | undefined>;
  oversizedColumnHeaders: Record<number, number | undefined>;
  createCalculators(fastDraw?: boolean): boolean;
  createVisibleCalculators(): void;
  isHorizontallyScrollableByWindow(): boolean;
  isVerticallyScrollableByWindow(): boolean;
  hasVerticalScroll(): boolean;
  hasHorizontalScroll(): boolean;
  getWorkspaceOffset(): { top: number; left: number };
  resetHasOversizedColumnHeadersMarked(): void;
  invalidateColumnWidthCache(): void;
  invalidateRowHeightCache(): void;
  rowHeightCache: { ensureBuilt(): void; invalidate(): void };
  columnWidthCache: { ensureBuilt(): void; invalidate(): void };
  [key: string]: unknown;
}

export interface WtOverlays {
  topOverlay: OverlayInstance;
  bottomOverlay: OverlayInstance;
  inlineStartOverlay: OverlayInstance;
  topInlineStartCornerOverlay: OverlayInstance;
  bottomInlineStartCornerOverlay: OverlayInstance;
  adjustElementsSize(force?: boolean): void;
  applyToDOM(): void;
  updateMainScrollableElements(): void;
  refreshAll(): void;
  beforeDraw(): void;
  afterDraw(): void;
  refresh(fastDraw?: boolean): void;
  expandHiderVerticallyBy(heightDelta: number): void;
  expandHiderHorizontallyBy(widthDelta: number): void;
  syncOverlayTableClassNames(): void;
  scrollableElement: HTMLElement | Window;
  getParentOverlay(element: HTMLElement): { wtTable: WtTable; wtViewport: WtViewport; [key: string]: unknown } | null;
  destroy(): void;
  [key: string]: unknown;
}

export interface OverlayInstance {
  clone: WalkontableInstance | null;
  mainTableScrollableElement: HTMLElement | Window;
  needFullRender: boolean;
  type: string;
  getScrollPosition(): number;
  getTableParentOffset(): number;
  trimmingContainer: HTMLElement;
  destroy(): void;
  refresh(fastDraw?: boolean): void;
  applyToDOM(): void;
  adjustElementsSize(): void;
  resetFixedPosition(): boolean;
  holder: HTMLElement | Window;
  getRelativeCellPosition(element: HTMLElement, row: number, col: number): { start: number; top: number };
  getOverlayOffset(): number;
  scrollTo(sourceIndex: number, snapToBottom?: boolean): boolean;
  sumCellSizes(from: number, to: number): number;
  hasRenderingStateChanged(): boolean;
  updateStateOfRendering(phase: string): void;
  updateMainScrollableElement(): void;
  reset(): void;
  onScroll(): void;
  shouldBeRendered(): boolean;
  [key: string]: unknown;
}

export interface DomBindings {
  rootDocument: Document;
  rootWindow: Window;
  rootElement: HTMLElement;
  rootTable: HTMLTableElement;
  [key: string]: unknown;
}

export interface WtSettings {
  getSetting(key: string, ...args: unknown[]): unknown;
  getSettingPure(key: string): unknown;
  update(key: string, value: unknown): void;
  has(key: string): boolean;
  [key: string]: unknown;
}

/**
 * Overlay type names used by Walkontable.
 */
export type OverlayType = 'inline_start' | 'top' | 'top_inline_start_corner' | 'bottom' |
  'bottom_inline_start_corner' | 'master';
