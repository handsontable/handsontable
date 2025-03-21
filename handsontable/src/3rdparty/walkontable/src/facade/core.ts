import Walkontable from '../core/core';
import CoreAbstract from '../core/_base';
import { IWalkontableFacade, WalkontableSettings } from './interfaces';
import CellCoords from '../cell/coords';
import CellRange from '../cell/range';

/**
 * This layer cares about backward compatibility.
 *
 * @class WalkontableFacade
 * @augments Walkontable
 * @inheritDoc
 */
export default class WalkontableFacade implements IWalkontableFacade {
  /**
   * The internal Walkontable instance.
   */
  protected _wot: Walkontable;
  
  /**
   * @param {SettingsPure|Walkontable} settingsOrInstance The Walkontable settings.
   */
  constructor(settingsOrInstance: WalkontableSettings | CoreAbstract) {
    if (settingsOrInstance instanceof CoreAbstract) {
      this._wot = settingsOrInstance as unknown as Walkontable;
    } else {
      this._initFromSettings(settingsOrInstance);
    }
  }

  _initFromSettings(settings: WalkontableSettings): void {
    settings.facade = (instance: Walkontable) => {
      const facade = new WalkontableFacade(instance);

      return () => facade;
    };

    this._wot = new Walkontable(settings.table, settings);
  }

  get guid(): string {
    return this._wot.guid;
  }

  get rootDocument(): Document {
    return this._wot.domBindings.rootDocument;
  }

  get rootWindow(): WindowProxy {
    return this._wot.domBindings.rootWindow;
  }
  get wtSettings(): any {
    return this._wot.wtSettings; // todo create facade
  }
  get cloneSource(): CoreAbstract | undefined {
    return this._wot.cloneSource; // todo create facade
  }
  get cloneOverlay(): any {
    return (this._wot as any).cloneOverlay; // todo create facade
  }
  get selectionManager(): any {
    return this._wot.selectionManager; // todo create facade
  }
  get wtViewport(): any {
    return this._wot.wtViewport; // todo create facade
  }
  get wtOverlays(): any {
    return this._wot.wtOverlays; // todo create facade
  }
  get wtTable(): any {
    return this._wot.wtTable; // todo create facade
  }
  get wtEvent(): any {
    return this._wot.wtEvent; // todo create facade
  }
  get wtScroll(): any {
    return this._wot.wtScroll; // todo create facade
  }
  get drawn(): boolean {
    return this._wot.drawn;
  }
  set drawn(value: boolean) {
    this._wot.drawn = value;
  }
  get activeOverlayName(): string {
    return this._wot.activeOverlayName;
  }
  get drawInterrupted(): boolean {
    return this._wot.drawInterrupted;
  }
  set drawInterrupted(value: boolean) {
    this._wot.drawInterrupted = value;
  }
  get lastMouseOver(): any {
    return (this._wot as any).lastMouseOver;
  }
  set lastMouseOver(value: any) {
    (this._wot as any).lastMouseOver = value;
  }
  get momentumScrolling(): any {
    return (this._wot as any).momentumScrolling;
  }
  set momentumScrolling(value: any) {
    (this._wot as any).momentumScrolling = value;
  }
  get touchApplied(): any {
    return (this._wot as any).touchApplied;
  }
  set touchApplied(value: any) {
    (this._wot as any).touchApplied = value;
  }
  get domBindings(): any {
    return this._wot.domBindings;
  }
  get eventListeners(): any {
    return (this._wot as any).eventListeners;
  }
  set eventListeners(value: any) {
    (this._wot as any).eventListeners = value;
  }
  get eventManager(): any {
    return this._wot.eventManager;
  }
  get stylesHandler(): any {
    return this._wot.stylesHandler;
  }

  createCellCoords(row: number, column: number): CellCoords {
    return this._wot.createCellCoords(row, column);
  }

  createCellRange(highlight: CellCoords, from: CellCoords, to: CellCoords): CellRange {
    return this._wot.createCellRange(highlight, from, to);
  }

  draw(fastDraw: boolean = false): this {
    this._wot.draw(fastDraw);

    return this;
  }

  getCell(coords: CellCoords, topmost: boolean = false): HTMLElement {
    return this._wot.getCell(coords, topmost);
  }

  scrollViewport(coords: CellCoords, horizontalSnap?: 'auto' | 'start' | 'end', verticalSnap?: 'auto' | 'top' | 'bottom'): boolean {
    return this._wot.scrollViewport(coords, horizontalSnap, verticalSnap);
  }

  scrollViewportHorizontally(column: number, snapping?: 'auto' | 'start' | 'end'): boolean {
    return this._wot.scrollViewportHorizontally(column, snapping);
  }

  scrollViewportVertically(row: number, snapping?: 'auto' | 'top' | 'bottom'): boolean {
    return this._wot.scrollViewportVertically(row, snapping);
  }

  getViewport(): number[] {
    return this._wot.getViewport();
  }

  getOverlayName(): string {
    const wotAny = this._wot as any;
    return wotAny.cloneOverlay ? wotAny.cloneOverlay.type : 'master';
  }

  getOverlayByName(overlayName: string): any {
    return this._wot.getOverlayByName(overlayName as any);
  }

  exportSettingsAsClassNames(): void {
    return this._wot.exportSettingsAsClassNames();
  }

  update(settings: any, value?: any): this {
    this._wot.wtSettings.update(settings, value);

    return this;
  }

  getSetting(key: string, param1?: any, param2?: any, param3?: any, param4?: any): any {
    return this._wot.wtSettings.getSetting(key, param1, param2, param3, param4);
  }

  hasSetting(key: string): boolean {
    return this._wot.wtSettings.hasSetting(key);
  }

  destroy(): void {
    this._wot.destroy();
  }
}
