/**
 * Interfaces for the Selection module
 */

import CellCoords from "../cell/coords";

/**
 * Border settings for Selection
 */
export interface BorderSettings {
  color?: string;
  width?: number;
  hide?: boolean;
}

/**
 * Settings for the Selection class
 */
export interface SelectionSettings {
  className?: string;
  createLayers?: boolean;
  border?: {
    width: number;
    color: string;
  };
  selectionType?: string;
  layerLevel?: number;
  createCellRange(coords: CellCoords): CellRange;
  headerAttributes?: Array<[string, string | number | boolean]>;
  [key: string]: any;
}

/**
 * Settings for Border class
 */
export interface BorderOptions {
  className?: string;
  border?: {
    width: number;
    color: string;
  };
  selectionType?: string;
  top?: BorderSettings;
  bottom?: BorderSettings;
  start?: BorderSettings;
  end?: BorderSettings;
  corner?: BorderSettings;
  [key: string]: any;
}

/**
 * Walkontable interface with only the methods needed for Selection functionality
 */
export interface WalkontableInterface {
  rootDocument: Document;
  eventManager: {
    addEventListener(element: HTMLElement | Document | Window, event: string, callback: (event?: Event) => void): void;
    removeEventListener(element: HTMLElement | Document | Window, event: string, callback: (event?: Event) => void): void;
  };
  wtTable: {
    TABLE: HTMLTableElement;
    bordersHolder?: HTMLElement;
    spreader: HTMLElement;
    getColumnHeadersCount(): number;
    getRowHeadersCount(): number;
    getRenderedRowsCount(): number;
    getRenderedColumnsCount(): number;
    getFirstRenderedColumn(): number;
    getLastRenderedColumn(): number;
    getFirstRenderedRow(): number;
    getLastRenderedRow(): number;
    getCell(coords: CellCoords): HTMLElement;
    getColumnHeader(col: number, level: number): HTMLElement;
    getRowHeader(row: number, level: number): HTMLElement;
    rowFilter: {
      renderedToSource(row: number): number;
    };
    columnFilter: {
      renderedToSource(column: number): number;
    };
  };
  wtSettings: {
    getSetting(setting: string, ...args: any[]): any;
  };
  getSetting(setting: string, ...args: any[]): any;
  createCellCoords(row: number, column: number): CellCoords;
  stylesHandler: {
    isClassicTheme(): boolean;
    getCSSVariableValue(variable: string): number;
    isAriaEnabled?(overlayName: string): boolean;
  };
}

/**
 * Interface for the Highlight class that manages Selection instances
 */
export interface HighlightInterface {
  options?: {
    cellAttributes?: Array<[string, string | number | boolean]>;
    headerAttributes?: Array<[string, string | number | boolean]>;
  };
  getFocus(): SelectionInterface | null;
  createLayeredArea(): SelectionInterface | null;
  [Symbol.iterator](): Iterator<SelectionInterface>;
}

/**
 * Interface for the Selection class
 */
export interface SelectionInterface {
  settings: SelectionSettings;
  cellRange: CellRange | null;
  isEmpty(): boolean;
  add(coords: CellCoords): SelectionInterface;
  replace(oldCoords: CellCoords, newCoords: CellCoords): boolean;
  clear(): SelectionInterface;
  getCorners(): number[];
  destroy(): void;
  addLocalHook(hookName: string, callback: (...args: any[]) => void): void;
}

/**
 * Corner style
 */
export interface CornerStyle {
  width: number;
  height: number;
  borderWidth: number;
  borderStyle: string;
  borderColor: string | number;
}

/**
 * Selection handles
 */
export interface SelectionHandles {
  top: HTMLDivElement;
  topHitArea: HTMLDivElement;
  bottom: HTMLDivElement;
  bottomHitArea: HTMLDivElement;
  styles?: {
    top: CSSStyleDeclaration;
    topHitArea: CSSStyleDeclaration;
    bottom: CSSStyleDeclaration;
    bottomHitArea: CSSStyleDeclaration;
  };
} 