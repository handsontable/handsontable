import type CellCoords from '../cell/coords';
import type { Overlay } from '../overlay/_base';
import Walkontable from '../core/core';
import CoreAbstract from '../core/_base';

/**
 * This layer cares about backward compatibility.
 *
 * @class WalkontableFacade
 * @augments Walkontable
 * @inheritDoc
 */
export default class WalkontableFacade {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  declare _wot: CoreAbstract & Record<string, any>;

  /**
   * @param {SettingsPure|Walkontable} settingsOrInstance The Walkontable settings.
   */
  constructor(settingsOrInstance: CoreAbstract | Record<string, unknown>) {
    if (settingsOrInstance instanceof CoreAbstract) {
      this._wot = settingsOrInstance;
    } else {
      this._initFromSettings(settingsOrInstance);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _initFromSettings(settings: Record<string, any>) {
    settings.facade = (instance: CoreAbstract) => {
      const facade = new WalkontableFacade(instance);

      return () => facade;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._wot = new Walkontable(settings.table, settings) as CoreAbstract & Record<string, any>;
  }

  get guid() {
    return this._wot.guid;
  }

  get rootDocument() {
    return this._wot.domBindings.rootDocument;
  }

  get rootWindow() {
    return this._wot.domBindings.rootWindow;
  }
  get wtSettings() {
    return this._wot.wtSettings; // todo create facade
  }
  get cloneSource() {
    return this._wot.cloneSource; // todo create facade
  }
  get cloneOverlay(): Overlay {
    return this._wot.cloneOverlay as Overlay; // todo create facade
  }
  get selectionManager() {
    return this._wot.selectionManager; // todo create facade
  }
  get wtViewport() {
    return this._wot.wtViewport; // todo create facade
  }
  get wtOverlays() {
    return this._wot.wtOverlays; // todo create facade
  }
  get wtTable() {
    return this._wot.wtTable; // todo create facade
  }
  get wtEvent() {
    return this._wot.wtEvent; // todo create facade
  }
  get wtScroll() {
    return this._wot.wtScroll; // todo create facade
  }
  get drawn() {
    return this._wot.drawn;
  }
  set drawn(value) {
    this._wot.drawn = value;
  }
  get activeOverlayName() {
    return this._wot.activeOverlayName;
  }
  get drawInterrupted() {
    return this._wot.drawInterrupted;
  }
  set drawInterrupted(value) {
    this._wot.drawInterrupted = value;
  }
  get lastMouseOver(): HTMLElement | null {
    return this._wot.lastMouseOver as HTMLElement | null;
  }
  set lastMouseOver(value) {
    this._wot.lastMouseOver = value;
  }
  get momentumScrolling(): { ongoing?: boolean; _timeout?: ReturnType<typeof setTimeout> } {
    return this._wot.momentumScrolling as { ongoing?: boolean; _timeout?: ReturnType<typeof setTimeout> };
  }
  set momentumScrolling(value) {
    this._wot.momentumScrolling = value;
  }
  get touchApplied(): boolean {
    return this._wot.touchApplied as boolean;
  }
  set touchApplied(value) {
    this._wot.touchApplied = value;
  }
  get domBindings() {
    return this._wot.domBindings;
  }
  get eventListeners(): unknown[] {
    return this._wot.eventListeners as unknown[];
  }
  set eventListeners(value) {
    this._wot.eventListeners = value;
  }
  get eventManager() {
    return this._wot.eventManager;
  }
  createCellCoords(row: number, column: number) {
    return this._wot.createCellCoords(row, column);
  }

  createCellRange(highlight: CellCoords, from: CellCoords, to: CellCoords) {
    return this._wot.createCellRange(highlight, from, to);
  }

  draw(fastDraw = false) {
    this._wot.draw(fastDraw);

    return this;
  }

  getCell(coords: CellCoords, topmost = false) {
    return this._wot.getCell(coords, topmost);
  }

  scrollViewport(coords: CellCoords, horizontalSnap: string, verticalSnap: string) {
    return this._wot.scrollViewport(coords, horizontalSnap, verticalSnap);
  }

  scrollViewportHorizontally(column: number, snapping: string) {
    return this._wot.scrollViewportHorizontally(column, snapping);
  }

  scrollViewportVertically(row: number, snapping: string) {
    return this._wot.scrollViewportVertically(row, snapping);
  }

  getViewport() {
    return this._wot.getViewport();
  }

  getOverlayName() {
    return this._wot.cloneOverlay ? (this._wot.cloneOverlay as Overlay).type : 'master';
  }

  getOverlayByName(overlayName: string): Overlay | null {
    return this._wot.getOverlayByName(overlayName) as Overlay | null;
  }

  exportSettingsAsClassNames(): void {
    this._wot.exportSettingsAsClassNames();
  }

  update(settings: string | Record<string, unknown>, value: unknown) {
    this._wot.wtSettings.update(settings, value);

    return this;
  }

  getSetting(key: string, param1: unknown, param2: unknown, param3: unknown, param4: unknown): unknown {
    return this._wot.wtSettings.getSetting(key, param1, param2, param3, param4) as unknown;
  }

  hasSetting(key: string) {
    return this._wot.wtSettings.has(key);
  }

  destroy() {
    this._wot.destroy();
  }
}
