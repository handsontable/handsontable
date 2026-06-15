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
  /**
   * The underlying Walkontable core instance with backward compatibility support.
   *
   * @type {CoreAbstract & Record<string, any>}
   */
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

  /**
   * Initializes the facade from a settings object.
   *
   * @param {Record<string, any>} settings - The Walkontable settings configuration.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _initFromSettings(settings: Record<string, any>) {
    settings.facade = (instance: CoreAbstract) => {
      const facade = new WalkontableFacade(instance);

      return () => facade;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._wot = new Walkontable(settings.table, settings) as CoreAbstract & Record<string, any>;
  }

  /**
   * Gets the unique identifier of the Walkontable instance.
   *
   * @returns {*} The unique identifier.
   */
  get guid() {
    return this._wot.guid;
  }

  /**
   * Gets the root document used by the Walkontable instance.
   *
   * @returns {*} The root document.
   */
  get rootDocument() {
    return this._wot.domBindings.rootDocument;
  }

  /**
   * Gets the root window used by the Walkontable instance.
   *
   * @returns {*} The root window.
   */
  get rootWindow() {
    return this._wot.domBindings.rootWindow;
  }
  /**
   * Gets the settings manager for the Walkontable instance.
   *
   * @returns {*} The settings manager.
   */
  get wtSettings() {
    return this._wot.wtSettings; // todo create facade
  }
  /**
   * Gets the clone source of the Walkontable instance.
   *
   * @returns {*} The clone source.
   */
  get cloneSource() {
    return this._wot.cloneSource; // todo create facade
  }
  /**
   * Gets the clone overlay of the Walkontable instance.
   *
   * @returns {Overlay} The clone overlay.
   */
  get cloneOverlay(): Overlay {
    return this._wot.cloneOverlay as Overlay; // todo create facade
  }
  /**
   * Gets the selection manager of the Walkontable instance.
   *
   * @returns {*} The selection manager.
   */
  get selectionManager() {
    return this._wot.selectionManager; // todo create facade
  }
  /**
   * Gets the viewport manager of the Walkontable instance.
   *
   * @returns {*} The viewport manager.
   */
  get wtViewport() {
    return this._wot.wtViewport; // todo create facade
  }
  /**
   * Gets the overlays manager of the Walkontable instance.
   *
   * @returns {*} The overlays manager.
   */
  get wtOverlays() {
    return this._wot.wtOverlays; // todo create facade
  }
  /**
   * Gets the table manager of the Walkontable instance.
   *
   * @returns {*} The table manager.
   */
  get wtTable() {
    return this._wot.wtTable; // todo create facade
  }
  /**
   * Gets the event manager of the Walkontable instance.
   *
   * @returns {*} The event manager.
   */
  get wtEvent() {
    return this._wot.wtEvent; // todo create facade
  }
  /**
   * Gets the scroll manager of the Walkontable instance.
   *
   * @returns {*} The scroll manager.
   */
  get wtScroll() {
    return this._wot.wtScroll; // todo create facade
  }
  /**
   * Gets whether the Walkontable instance has been drawn.
   *
   * @returns {*} True if drawn, false otherwise.
   */
  get drawn() {
    return this._wot.drawn;
  }
  /**
   * Sets whether the Walkontable instance has been drawn.
   *
   * @param {*} value - The drawn state.
   */
  set drawn(value) {
    this._wot.drawn = value;
  }
  /**
   * Gets the name of the active overlay.
   *
   * @returns {*} The active overlay name.
   */
  get activeOverlayName() {
    return this._wot.activeOverlayName;
  }
  /**
   * Gets whether drawing has been interrupted.
   *
   * @returns {*} True if drawing is interrupted, false otherwise.
   */
  get drawInterrupted() {
    return this._wot.drawInterrupted;
  }
  /**
   * Sets whether drawing has been interrupted.
   *
   * @param {*} value - The interrupted state.
   */
  set drawInterrupted(value) {
    this._wot.drawInterrupted = value;
  }
  /**
   * Gets the last element that was moused over.
   *
   * @returns {HTMLElement | null} The last moused-over element, or null.
   */
  get lastMouseOver(): HTMLElement | null {
    return this._wot.lastMouseOver as HTMLElement | null;
  }
  /**
   * Sets the last element that was moused over.
   *
   * @param {*} value - The element to set.
   */
  set lastMouseOver(value) {
    this._wot.lastMouseOver = value;
  }
  /**
   * Gets the momentum scrolling state.
   *
   * @returns {{ ongoing?: boolean; _timeout?: ReturnType<typeof setTimeout> }} The momentum scrolling state.
   */
  get momentumScrolling(): { ongoing?: boolean; _timeout?: ReturnType<typeof setTimeout> } {
    return this._wot.momentumScrolling as { ongoing?: boolean; _timeout?: ReturnType<typeof setTimeout> };
  }
  /**
   * Sets the momentum scrolling state.
   *
   * @param {*} value - The momentum scrolling state.
   */
  set momentumScrolling(value) {
    this._wot.momentumScrolling = value;
  }
  /**
   * Gets whether touch input has been applied.
   *
   * @returns {boolean} True if touch was applied, false otherwise.
   */
  get touchApplied(): boolean {
    return this._wot.touchApplied as boolean;
  }
  /**
   * Sets whether touch input has been applied.
   *
   * @param {*} value - The touch applied state.
   */
  set touchApplied(value) {
    this._wot.touchApplied = value;
  }
  /**
   * Gets the DOM bindings configuration.
   *
   * @returns {*} The DOM bindings.
   */
  get domBindings() {
    return this._wot.domBindings;
  }
  /**
   * Gets the list of event listeners.
   *
   * @returns {unknown[]} The array of event listeners.
   */
  get eventListeners(): unknown[] {
    return this._wot.eventListeners as unknown[];
  }
  /**
   * Sets the list of event listeners.
   *
   * @param {*} value - The event listeners array.
   */
  set eventListeners(value) {
    this._wot.eventListeners = value;
  }
  /**
   * Gets the event manager instance.
   *
   * @returns {*} The event manager.
   */
  get eventManager() {
    return this._wot.eventManager;
  }
  /**
   * Creates a new cell coordinates object.
   *
   * @param {number} row - The row index.
   * @param {number} column - The column index.
   * @returns {*} The new cell coordinates object.
   */
  createCellCoords(row: number, column: number) {
    return this._wot.createCellCoords(row, column);
  }

  /**
   * Creates a new cell range.
   *
   * @param {CellCoords} highlight - The highlighted cell coordinates.
   * @param {CellCoords} from - The starting cell coordinates.
   * @param {CellCoords} to - The ending cell coordinates.
   * @returns {*} The new cell range.
   */
  createCellRange(highlight: CellCoords, from: CellCoords, to: CellCoords) {
    return this._wot.createCellRange(highlight, from, to);
  }

  /**
   * Redraws the table.
   *
   * @param {boolean} [fastDraw=false] - Whether to perform a fast draw.
   * @returns {WalkontableFacade} This instance for method chaining.
   */
  draw(fastDraw = false) {
    this._wot.draw(fastDraw);

    return this;
  }

  /**
   * Gets the DOM cell element at the specified coordinates.
   *
   * @param {CellCoords} coords - The cell coordinates.
   * @param {boolean} [topmost=false] - Whether to get the topmost element.
   * @returns {*} The DOM cell element.
   */
  getCell(coords: CellCoords, topmost = false) {
    return this._wot.getCell(coords, topmost);
  }

  /**
   * Scrolls the viewport to the specified cell coordinates.
   *
   * @param {CellCoords} coords - The cell coordinates to scroll to.
   * @param {string} horizontalSnap - The horizontal snap setting.
   * @param {string} verticalSnap - The vertical snap setting.
   * @returns {*} The result of the scroll operation.
   */
  scrollViewport(coords: CellCoords, horizontalSnap: string, verticalSnap: string) {
    return this._wot.scrollViewport(coords, horizontalSnap, verticalSnap);
  }

  /**
   * Scrolls the viewport horizontally.
   *
   * @param {number} column - The column index to scroll to.
   * @param {string} snapping - The snapping setting.
   * @returns {*} The result of the scroll operation.
   */
  scrollViewportHorizontally(column: number, snapping: string) {
    return this._wot.scrollViewportHorizontally(column, snapping);
  }

  /**
   * Scrolls the viewport vertically.
   *
   * @param {number} row - The row index to scroll to.
   * @param {string} snapping - The snapping setting.
   * @returns {*} The result of the scroll operation.
   */
  scrollViewportVertically(row: number, snapping: string) {
    return this._wot.scrollViewportVertically(row, snapping);
  }

  /**
   * Gets the current viewport dimensions.
   *
   * @returns {*} The viewport dimensions.
   */
  getViewport() {
    return this._wot.getViewport();
  }

  /**
   * Gets the name of the currently active overlay.
   *
   * @returns {string} The overlay type name, or 'master' if no clone overlay.
   */
  getOverlayName() {
    return this._wot.cloneOverlay ? (this._wot.cloneOverlay as Overlay).type : 'master';
  }

  /**
   * Gets an overlay by its name.
   *
   * @param {string} overlayName - The name of the overlay to retrieve.
   * @returns {Overlay | null} The overlay, or null if not found.
   */
  getOverlayByName(overlayName: string): Overlay | null {
    return this._wot.getOverlayByName(overlayName) as Overlay | null;
  }

  /**
   * Exports the current settings as CSS class names on the table element.
   */
  exportSettingsAsClassNames(): void {
    this._wot.exportSettingsAsClassNames();
  }

  /**
   * Updates Walkontable settings.
   *
   * @param {string | Record<string, unknown>} settings - The setting key or settings object.
   * @param {unknown} value - The value to set (when settings is a string).
   * @returns {WalkontableFacade} This instance for method chaining.
   */
  update(settings: string | Record<string, unknown>, value: unknown) {
    this._wot.wtSettings.update(settings, value);

    return this;
  }

  /**
   * Gets a setting value.
   *
   * @param {string} key - The setting key.
   * @param {unknown} param1 - Optional parameter.
   * @param {unknown} param2 - Optional parameter.
   * @param {unknown} param3 - Optional parameter.
   * @param {unknown} param4 - Optional parameter.
   * @returns {unknown} The setting value.
   */
  getSetting(key: string, param1: unknown, param2: unknown, param3: unknown, param4: unknown): unknown {
    return this._wot.wtSettings.getSetting(key, param1, param2, param3, param4);
  }

  /**
   * Checks whether a setting exists.
   *
   * @param {string} key - The setting key.
   * @returns {*} True if the setting exists, false otherwise.
   */
  hasSetting(key: string) {
    return this._wot.wtSettings.has(key);
  }

  /**
   * Destroys the Walkontable instance and cleans up resources.
   */
  destroy() {
    this._wot.destroy();
  }
}
