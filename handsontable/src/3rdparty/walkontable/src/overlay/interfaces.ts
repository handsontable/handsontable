import { DomBindings, EventManager, FacadeGetter, Settings, TableDao } from '../types';
import Table from '../table';
import Walkontable from '../core/core';

export interface OverlayOptions {
  source: Walkontable;
  overlay: OverlayBase;
  viewport: any;
  event: any;
  selectionManager: any;
  stylesHandler: any;
}

/**
 * Base interface for overlay classes
 */
export interface OverlayBase {
  facadeGetter: FacadeGetter;
  wot: Walkontable;
  domBindings: DomBindings;
  instance: Walkontable;
  type: string;
  mainTableScrollableElement: HTMLElement | Window | null;
  TABLE: HTMLTableElement;
  hider: HTMLElement;
  spreader: HTMLElement;
  holder: HTMLElement | null;
  wtRootElement: HTMLElement;
  trimmingContainer: HTMLElement;
  needFullRender: boolean;
  clone: Table;
  needAdjustColumns: boolean;
  needAdjustRows: boolean;
  rootDocument: Document;
  rootWindow: Window;
  wtSettings: Settings;

  hasRenderingStateChanged(): boolean;
  updateStateOfRendering(drawPhase: 'before' | 'after'): void;
  shouldBeRendered(): boolean;
  updateTrimmingContainer(): void;
  updateMainScrollableElement(): void;
  getRelativeCellPosition(element: HTMLElement, rowIndex: number, columnIndex: number): { top: number, start: number } | undefined;
  getRelativeStartPosition(el: HTMLElement): number;
  makeClone(): Table;
  refresh(fastDraw?: boolean): void;
  reset(): void;
  isRtl(): boolean;
  destroy(): void;
  setNeedAdjust(type?: string): void;
  isNeedAdjust(type?: string): boolean;
  clearNeedAdjust(type?: string): void;
  getAdjustedElementHeight(): number;
  getAdjustedElementWidth(): number;
  adjustElementsSize(): boolean;
  getHeight(): number;
  getWidth(): number;
  isVisible(): boolean;
  getParentOverlay(): OverlayBase | null;
  resetFixedPosition(): void;
  getScrollPosition(): number;
  getTableParentOffset(): number;
  adjustHeaderHeights(): void;
  getScrollableElement(): HTMLElement;
  scrollTo(...args: any[]): void;
  onScroll(): void;
}

/**
 * Interface for top overlay
 */
export interface TopOverlayInterface extends OverlayBase {
  sumCellSizes(from: number, to: number): number;
  adjustElementsSize(): boolean;
  setScrollPosition(pos: number): boolean;
  scrollTo(sourceRow: number, bottomEdge?: boolean): void;
  getMaxScrollY(): number;
}

/**
 * Interface for inline start overlay (left in LTR, right in RTL)
 */
export interface InlineStartOverlayInterface extends OverlayBase {
  sumCellSizes(from: number, to: number): number;
  adjustElementsSize(): boolean;
  setScrollPosition(pos: number): boolean;
  scrollTo(sourceCol: number, alignToRight?: boolean): void;
  getMaxScrollX(): number;
}

/**
 * Interface for bottom overlay
 */
export interface BottomOverlayInterface extends OverlayBase {
  adjustElementsSize(): boolean;
  resetFixedPosition(): void;
  sumCellSizes(from: number, to: number): number;
  setScrollPosition(pos: number): boolean;
  scrollTo(sourceRow: number, bottomEdge?: boolean): void;
}

/**
 * Interface for top-inline-start corner overlay
 */
export interface TopInlineStartCornerOverlayInterface extends OverlayBase {
  adjustElementsSize(): boolean;
}

/**
 * Interface for bottom-inline-start corner overlay
 */
export interface BottomInlineStartCornerOverlayInterface extends OverlayBase {
  adjustElementsSize(): boolean;
}

/**
 * Interface for the overlay settings used in constructor
 */
export interface OverlayOptions {
  className: string;
  dir?: string;
  top?: number;
  inlineStart?: number;
  bottom?: number;
  inlineEnd?: number;
  [key: string]: any;
} 