import Walkontable from '../core/core';
import CoreAbstract from '../core/_base';
import CellCoords from '../cell/coords';
import CellRange from '../cell/range';
import { DomBindings, Settings, FacadeGetter } from '../types';
import EventManager from '../../../../eventManager';

/**
 * Interface for the WalkontableFacade class
 */
export interface IWalkontableFacade {
  readonly guid: string;
  readonly rootDocument: Document;
  readonly rootWindow: WindowProxy;
  readonly wtSettings: Settings;
  readonly cloneSource: CoreAbstract | undefined;
  readonly cloneOverlay: any;
  readonly selectionManager: any;
  readonly wtViewport: any;
  readonly wtOverlays: any;
  readonly wtTable: any;
  readonly wtEvent: any;
  readonly wtScroll: any;
  drawn: boolean;
  activeOverlayName: string;
  drawInterrupted: boolean;
  lastMouseOver: any;
  momentumScrolling: any;
  touchApplied: any;
  readonly domBindings: DomBindings;
  eventListeners: any;
  readonly eventManager: EventManager;
  readonly stylesHandler: any;

  createCellCoords(row: number, column: number): CellCoords;
  createCellRange(highlight: CellCoords, from: CellCoords, to: CellCoords): CellRange;
  draw(fastDraw?: boolean): IWalkontableFacade;
  getCell(coords: CellCoords, topmost?: boolean): HTMLElement;
  scrollViewport(coords: CellCoords, horizontalSnap?: 'auto' | 'start' | 'end', verticalSnap?: 'auto' | 'top' | 'bottom'): boolean;
  scrollViewportHorizontally(column: number, snapping?: 'auto' | 'start' | 'end'): boolean;
  scrollViewportVertically(row: number, snapping?: 'auto' | 'top' | 'bottom'): boolean;
  getViewport(): number[];
  getOverlayName(): string;
  getOverlayByName(overlayName: string): any;
  exportSettingsAsClassNames(): void;
  update(settings: any, value?: any): IWalkontableFacade;
  getSetting(key: string, param1?: any, param2?: any, param3?: any, param4?: any): any;
  hasSetting(key: string): boolean;
  destroy(): void;
}

/**
 * Interface for the Walkontable settings used in the facade
 */
export interface WalkontableSettings {
  table: HTMLTableElement;
  facade?: (instance: Walkontable) => FacadeGetter;
  [key: string]: any;
} 