import type CellCoords from '../cell/coords';
import type from '../overlay/_base';
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
   * The underlying Walkontable core instance that this facade delegates to.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  declare _wot: CoreAbstract & Record<string, any>;

  /**
   * @param settingsOrInstance The Walkontable settings.
   */
  constructor(settingsOrInstance: CoreAbstract | Record<string, unknown>) {
    if (settingsOrInstance instanceof CoreAbstract) {
      this._wot = settingsOrInstance;
    } else {
      this._initFromSettings(settingsOrInstance);
    }
  }

  /**
   * Initializes the facade by creating a new Walkontable instance from a plain settings object.
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
   * Returns the unique identifier of the underlying Walkontable instance.
   */
  get guid() {
    return this._wot.guid;
  }

  /**
   * Returns the root document associated with the table element.
   */
  get rootDocument() {
    return this._wot.domBindings.rootDocument;
  }

  /**
   * Returns the window object associated with the table element.
   */
  get rootWindow() {
    return this._wot.domBindings.rootWindow;
  }

  /**
   * Returns the settings instance of the underlying Walkontable.
   */
  get wtSettings() {
    return this._wot.wtSettings; // todo create facade
  }

  /**
   * Returns the source Walkontable instance that this clone originated from.
   */
  get cloneSource() {
    return this._wot.cloneSource; // todo create facade
  }

  /**
   * Returns the overlay instance associated with this clone.
   */
  get cloneOverlay(): Overlay {
    return this._wot.cloneOverlay as Overlay; // todo create facade
  }

  /**
   * Returns the selection manager that tracks highlighted cells and headers.
   */
  get selectionManager() {
    return this._wot.selectionManager; // todo create facade
  }

  /**
   * Returns the viewport calculator that determines which rows and columns are visible.
   */
  get wtViewport() {
    return this._wot.wtViewport; // todo create facade
  }

  /**
   * Returns the overlay manager that coordinates all frozen-row and frozen-column overlays.
   */
  get wtOverlays() {
    return this._wot.wtOverlays; // todo create facade
  }

  /**
   * Returns the table renderer that manages the DOM structure of the grid.
   */
  get wtTable() {
    return this._wot.wtTable; // todo create facade
  }

  /**
   * Returns the event handler that manages mouse and keyboard interactions.
   */
  get wtEvent() {
    return this._wot.wtEvent; // todo create facade
  }

  /**
   * Returns the scroll controller that handles viewport scrolling.
   */
  get wtScroll() {
    return this._wot.wtScroll; // todo create facade
  }

  /**
   * Indicates whether the table has been rendered at least once.
   */
  get drawn() {
    return this._wot.drawn;
  }

  /**
   * Sets whether the table has been drawn, used to track initial render state.
   */
  set drawn(value) {
    this._wot.drawn = value;
  }

  /**
   * Returns the name of the overlay that is currently active during rendering.
   */
  get activeOverlayName() {
    return this._wot.activeOverlayName;
  }

  /**
   * Indicates whether the last draw call was interrupted because the table was hidden or had zero height.
   */
  get drawInterrupted() {
    return this._wot.drawInterrupted;
  }

  /**
   * Sets the flag that records whether the last draw was interrupted.
   */
  set drawInterrupted(value) {
    this._wot.drawInterrupted = value;
  }

  /**
   * Returns the DOM element that the pointer was last detected over.
   */
  get lastMouseOver(): HTMLElement | null {
    return this._wot.lastMouseOver as HTMLElement | null;
  }

  /**
   * Sets the DOM element that the pointer is currently hovering over.
   */
  set lastMouseOver(value) {
    this._wot.lastMouseOver = value;
  }

  /**
   * Returns the object that tracks ongoing momentum scrolling state and its timeout handle.
   */
  get momentumScrolling(): {
    return this._wot.momentumScrolling as { ongoing?: boolean; _timeout?: ReturnType<typeof setTimeout> };
  }

  /**
   * Sets the momentum scrolling state object.
   */
  set momentumScrolling(value) {
    this._wot.momentumScrolling = value;
  }

  /**
   * Indicates whether a touch interaction is currently active on the table.
   */
  get touchApplied(): boolean {
    return this._wot.touchApplied as boolean;
  }

  /**
   * Sets the flag that records whether a touch is currently applied.
   */
  set touchApplied(value) {
    this._wot.touchApplied = value;
  }

  /**
   * Returns the DOM bindings object containing the root table, document, and window references.
   */
  get domBindings() {
    return this._wot.domBindings;
  }

  /**
   * Returns the list of registered DOM event listeners attached by the Walkontable event system.
   */
  get eventListeners(): unknown[] {
    return this._wot.eventListeners as unknown[];
  }

  /**
   * Sets the list of registered DOM event listeners.
   */
  set eventListeners(value) {
    this._wot.eventListeners = value;
  }

  /**
   * Returns the event manager bound to the underlying Walkontable instance.
   */
  get eventManager() {
    return this._wot.eventManager;
  }

  /**
   * Creates and returns a CellCoords instance for the given row and column indexes.
   */
  createCellCoords(row: number, column: number) {
    return this._wot.createCellCoords(row, column);
  }

  /**
   * Creates and returns a CellRange spanning from the highlight coordinate to the given from/to corners.
   */
  createCellRange(highlight: CellCoords, from: CellCoords, to: CellCoords) {
    return this._wot.createCellRange(highlight, from, to);
  }

  /**
   * Triggers a full or fast redraw of the table, skipping the render if the table is not visible.
   */
  draw(fastDraw = false) {
    this._wot.draw(fastDraw);

    return this;
  }

  /**
   * Returns the TD element at the given coordinates, optionally from the topmost overlay layer.
   */
  getCell(coords: CellCoords, topmost = false) {
    return this._wot.getCell(coords, topmost);
  }

  /**
   * Scrolls the viewport so that the cell at the given coordinates becomes visible.
   */
  scrollViewport(coords: CellCoords, horizontalSnap: string, verticalSnap: string) {
    return this._wot.scrollViewport(coords, horizontalSnap, verticalSnap);
  }

  /**
   * Scrolls the viewport horizontally to make the given column visible.
   */
  scrollViewportHorizontally(column: number, snapping: string) {
    return this._wot.scrollViewportHorizontally(column, snapping);
  }

  /**
   * Scrolls the viewport vertically to make the given row visible.
   */
  scrollViewportVertically(row: number, snapping: string) {
    return this._wot.scrollViewportVertically(row, snapping);
  }

  /**
   * Returns an array describing the currently visible rows and columns in the viewport.
   */
  getViewport() {
    return this._wot.getViewport();
  }

  /**
   * Returns the type name of the currently active overlay, or `'master'` for the main table.
   */
  getOverlayName() {
    return this._wot.cloneOverlay ? (this._wot.cloneOverlay as Overlay).type : 'master';
  }

  /**
   * Returns the overlay instance registered under the given name, or `null` if it does not exist.
   */
  getOverlayByName(overlayName: string): Overlay | null {
    return this._wot.getOverlayByName(overlayName) as Overlay | null;
  }

  /**
   * Exports the current Walkontable settings as CSS class names applied to the root element.
   */
  exportSettingsAsClassNames(): void {
    this._wot.exportSettingsAsClassNames();
  }

  /**
   * Updates one or more settings on the underlying Walkontable instance.
   */
  update(settings: string | Record<string, unknown>, value: unknown) {
    this._wot.wtSettings.update(settings, value);

    return this;
  }

  /**
   * Retrieves the value of a named setting, passing up to four optional parameters.
   */
  getSetting(key: string, param1: unknown, param2: unknown, param3: unknown, param4: unknown): unknown {
    return this._wot.wtSettings.getSetting(key, param1, param2, param3, param4) as unknown;
  }

  /**
   * Returns whether the given setting key has been defined in the current settings.
   */
  hasSetting(key: string) {
    return this._wot.wtSettings.has(key);
  }

  /**
   * Destroys the underlying Walkontable instance and releases all associated resources.
   */
  destroy() {
    this._wot.destroy();
  }
}
