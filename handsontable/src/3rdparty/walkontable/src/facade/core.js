import Walkontable from '../core/core';
import ACore from "../core/_base";

/**
 * @class WalkontableFacade
 * @augments Walkontable
 * @inheritDoc
 */
export default class WalkontableFacade {
  /**
   * @param {SettingsPure|Walkontable} settingsOrInstance The Walkontable settings.
   */
  constructor(settingsOrInstance) {
    if (settingsOrInstance instanceof ACore) {
      this._wot = settingsOrInstance;
    } else {
      this._initFromSettings(settingsOrInstance);
    }
  }

  _initFromSettings(settings) {
    settings.facade = (instance) => {
      const facade = new WalkontableFacade(instance);

      return () => facade;
    };

    this._wot = new Walkontable(settings.table, settings);
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
  get cloneOverlay() {
    return this._wot.cloneOverlay; // todo create facade
  }
  get selections() {
    return this._wot.selections; // todo create facade
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
  get drawInterrupted() {
    return this._wot.drawInterrupted;
  }
  set drawInterrupted(value) {
    this._wot.drawInterrupted = value;
  }
  get lastMouseOver() {
    return this._wot.lastMouseOver;
  }
  set lastMouseOver(value) {
    this._wot.lastMouseOver = value;
  }
  get momentumScrolling() {
    return this._wot.momentumScrolling;
  }
  set momentumScrolling(value) {
    this._wot.momentumScrolling = value;
  }
  get touchApplied() {
    return this._wot.touchApplied;
  }
  set touchApplied(value) {
    this._wot.touchApplied = value;
  }
  get domBindings() {
    return this._wot.domBindings;
  }
  get eventListeners() {
    return this._wot.eventListeners;
  }
  set eventListeners(value) {
    this._wot.eventListeners = value;
  }
  get eventManager() {
    return this._wot.eventManager;
  }
  draw(fastDraw = false) {
    this._wot.draw(fastDraw);

    return this;
  }

  getCell(coords, topmost = false) {
    return this._wot.getCell(coords, topmost);
  }

  scrollViewport(coords, snapToTop, snapToRight, snapToBottom, snapToLeft) {
    return this._wot.scrollViewport(coords, snapToTop, snapToRight, snapToBottom, snapToLeft);
  }

  scrollViewportHorizontally(column, snapToRight, snapToLeft) {
    return this._wot.scrollViewportHorizontally(column, snapToRight, snapToLeft);
  }

  scrollViewportVertically(row, snapToTop, snapToBottom) {
    return this._wot.scrollViewportVertically(row, snapToTop, snapToBottom);
  }

  getViewport() {
    return this._wot.getViewport();
  }

  getOverlayName() {
    return this._wot.cloneOverlay ? this._wot.cloneOverlay.type : 'master';
  }

  exportSettingsAsClassNames() {
    return this._wot.exportSettingsAsClassNames();
  }

  update(settings, value) {
    this._wot.wtSettings.update(settings, value);

    return this;
  }

  getSetting(key, param1, param2, param3, param4) {
    return this._wot.wtSettings.getSetting(key, param1, param2, param3, param4);
  }

  hasSetting(key) {
    return this._wot.wtSettings.hasSetting(key);
  }

  destroy() {
    this._wot.destroy();
  }

}
