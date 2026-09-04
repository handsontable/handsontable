import type { WalkontableInstance } from '../types';
import type Selection from './selection';

/**
 * Minimal interface for the selections container passed to SelectionManager.
 * The full implementation is in src/selection/highlight/highlight.ts.
 */
interface SelectionsContainer {
  getFocus(): Selection | null;
  createLayeredArea(): Selection | null;
  options?: {
    cellAttributes?: Array<[string, string | number | boolean]>;
    headerAttributes?: Array<[string, string | number | boolean]>;
  };
  [Symbol.iterator](): Iterator<Selection>;
}
import { isHTMLElement } from '../../../../helpers/dom/element';
import { SelectionScanner } from './scanner';
import type { CellScanResult } from './scanner';
import {
  applySelection,
  buildSelectionSignature,
  clearAppliedSelection,
  expandLayeredClassNames,
  getAppliedSelection,
  removeAppliedSelection,
} from './appliedSelection';
import type { SelectionAttribute } from './appliedSelection';
import { SelectionScanCache, buildBandKey } from './scanCache';
import Border from './border/border';
import { ACTIVE_HEADER_TYPE, CUSTOM_SELECTION_TYPE } from './constants';

/**
 * Module responsible for rendering selections (CSS classes) and borders based on the
 * collection of the Selection instances provided throughout the `selections` Walkontable
 * setting.
 *
 * @private
 */
export class SelectionManager {
  /**
   * The overlay's Walkontable instance that are currently processed.
   *
   * @type {Walkontable}
   */
  #activeOverlaysWot: WalkontableInstance | null = null;
  /**
   * The Highlight instance that holds Selections instances within it.
   *
   * @type {Highlight|null}
   */
  #selections: SelectionsContainer | null;
  /**
   * The SelectionScanner allows to scan and collect the cell and header elements that matches
   * to the coords defined in the selections.
   *
   * @type {SelectionScanner}
   */
  #scanner = new SelectionScanner();
  /**
   * The elements that carried selection classes after the previous pass, per overlay. Diffed against
   * the next pass so an element that left the selection is cleaned up without querying the DOM.
   *
   * @type {WeakMap}
   */
  #appliedElements = new WeakMap<WalkontableInstance, Set<HTMLElement>>();
  /**
   * The cache of the cell elements each selection layer resolved to (see {@link SelectionScanCache}).
   *
   * @type {SelectionScanCache}
   */
  #scanCache = new SelectionScanCache();
  /**
   * The Map tracks applied "destroy" listeners for Selection instances.
   *
   * @type {WeakMap}
   */
  #destroyListeners = new WeakSet();
  /**
   * The Map holds references to Border classes for Selection instances which requires that when
   * the "border" setting is defined.
   *
   * @type {Map}
   */
  #selectionBorders = new Map<Selection, Map<WalkontableInstance, Border>>();

  /**
   * Creates a new SelectionManager instance.
   *
   * @param {SelectionsContainer | null} selections The Highlight instance that holds Selection instances.
   */
  constructor(selections: SelectionsContainer | null) {
    this.#selections = selections;
  }

  /**
   * Sets the active Walkontable instance.
   *
   * @param {Walkontable} activeWot The overlays or master Walkontable instance.
   * @returns {SelectionManager}
   */
  setActiveOverlay(activeWot: WalkontableInstance) {
    this.#activeOverlaysWot = activeWot;
    this.#scanner.setActiveOverlay(this.#activeOverlaysWot);

    return this;
  }

  /**
   * Gets the Selection instance of the "focus" type.
   *
   * @returns {Selection|null}
   */
  getFocusSelection() {
    return this.#selections !== null ? this.#selections.getFocus() : null;
  }

  /**
   * Gets the Selection instance of the "area" type.
   *
   * @returns {Selection|null}
   */
  getAreaSelection() {
    return this.#selections !== null ? this.#selections.createLayeredArea() : null;
  }

  /**
   * Gets the Border instance associated with Selection instance.
   *
   * @param {Selection} selection The selection instance.
   * @returns {Border|null} Returns the Border instance (new for each overlay Walkontable instance).
   */
  getBorderInstance(selection: Selection) {
    if (!selection.settings.border) {
      return null;
    }

    if (this.#selectionBorders.has(selection)) {
      const borders = this.#selectionBorders.get(selection)!;

      if (borders.has(this.#activeOverlaysWot!)) {
        return borders.get(this.#activeOverlaysWot!);
      }

      const border = new Border(this.#activeOverlaysWot!, selection.settings);

      borders.set(this.#activeOverlaysWot!, border);

      return border;
    }

    const border = new Border(this.#activeOverlaysWot!, selection.settings);

    this.#selectionBorders.set(selection, new Map([[this.#activeOverlaysWot!, border]]));

    return border;
  }

  /**
   * Gets all Border instances associated with Selection instance for all overlays.
   *
   * @param {Selection} selection The selection instance.
   * @returns {Border[]}
   */
  getBorderInstances(selection: Selection) {
    return Array.from(this.#selectionBorders.get(selection)?.values() ?? []);
  }

  /**
   * Checks whether a custom-border selection falls entirely outside the active overlay's rendered
   * cell range, so its border does not need to be drawn (and its DOM does not need to exist) here.
   * Mirrors the range test `Border#appear` performs before it early-outs, so culling produces the
   * same visual result while avoiding the cost of materializing off-screen border DOM.
   *
   * @param {Selection} selection The custom-border selection instance.
   * @returns {boolean}
   */
  #isCustomSelectionOffscreen(selection: Selection): boolean {
    // A hidden/trimmed cell has a `null` cellRange (nothing to draw); treat it as off-screen and
    // avoid `getCorners()`, which dereferences the range.
    if (selection.isEmpty()) {
      return true;
    }

    const { wtTable } = this.#activeOverlaysWot!;
    const [fromRow, fromColumn, toRow, toColumn] = selection.getCorners();
    const firstRow = wtTable.getFirstRenderedRow();
    const lastRow = wtTable.getLastRenderedRow();
    const firstColumn = wtTable.getFirstRenderedColumn();
    const lastColumn = wtTable.getLastRenderedColumn();

    // Nothing (or only headers) rendered in this overlay - the border cannot be visible here.
    if ((firstRow < 0 && lastRow < 0) || (firstColumn < 0 && lastColumn < 0)) {
      return true;
    }

    return toRow < firstRow || fromRow > lastRow || toColumn < firstColumn || fromColumn > lastColumn;
  }

  /**
   * Destroys the Border instance associated with Selection instance.
   *
   * @param {Selection} selection The selection instance.
   */
  destroyBorders(selection: Selection) {
    this.#selectionBorders.get(selection)?.forEach(border => border.destroy());
    this.#selectionBorders.delete(selection);
    this.#scanCache.delete(selection);
  }

  /**
   * Refreshes the multiple selector handle styles on all border instances after a theme change.
   */
  refreshAllBorderHandleStyles() {
    this.#selectionBorders.forEach((bordersMap) => {
      bordersMap.forEach((border) => {
        type BorderWithHandles = { updateMultipleSelectorHandlesStyles: () => void };
        const hasMethod = 'updateMultipleSelectorHandlesStyles' in border &&
          typeof (border as BorderWithHandles).updateMultipleSelectorHandlesStyles === 'function';

        if (hasMethod) {
          (border as BorderWithHandles).updateMultipleSelectorHandlesStyles();
        }
      });
    });
  }

  /**
   * Renders all the selections (add CSS classes to cells and draw borders).
   *
   * The pass first collects, per element, the class names and attributes every layer wants on it,
   * then applies that collection as a diff against what each element carried after the previous
   * pass (`appliedSelection.ts`). An element whose selection state is unchanged is not touched, and
   * the cell and header renderers clear the record of every element they wipe, so a repainted
   * element is written again. This is what keeps a draw from toggling the classes of every selected
   * cell, which the browser would otherwise turn into a style recalculation over the whole table.
   */
  render() {
    if (this.#selections === null) {
      return;
    }

    const wot = this.#activeOverlaysWot!;

    this.#removeLegacyClassNames();

    const bandKey = buildBandKey(wot, wot.wtSettings.getSetting<number>('renderEpoch'));
    const selections: Selection[] = Array.from(this.#selections);
    const classNamesMap = new Map<HTMLElement, Map<string, number>>();
    const headerAttributesMap = new Map<HTMLElement, SelectionAttribute[]>();

    for (let i = 0; i < selections.length; i++) {
      const selection = selections[i];
      const { className, selectionType } = selection.settings;

      if (!this.#destroyListeners.has(selection)) {
        this.#destroyListeners.add(selection);
        selection.addLocalHook('destroy', () => this.destroyBorders(selection));
      }

      // Virtualize custom borders. A per-cell custom-border selection outside this overlay's rendered
      // range draws nothing anyway - `appear()` early-outs once `getCell()` reports the cell as not
      // rendered. Skipping it here (without calling `getBorderInstance`) means its Border DOM is never
      // created while off-screen, which is what lets grids with very many bordered cells scale: only
      // the visible borders get DOM and layout work, mirroring cell virtualization. The visual result
      // is identical to letting `appear()` early-out, just without the O(all-borders) DOM.
      if (selectionType === CUSTOM_SELECTION_TYPE && this.#isCustomSelectionOffscreen(selection)) {
        this.#selectionBorders.get(selection)?.get(wot)?.disappear();
        this.#scanCache.delete(selection);

        continue; // eslint-disable-line no-continue
      }

      const borderInstance = this.getBorderInstance(selection);

      if (selection.isEmpty()) {
        borderInstance?.disappear();
        // A skipped layer's cached scan is not validated against the band; drop it, or the layer can
        // come back under the same key onto elements the engine has since replaced.
        this.#scanCache.delete(selection);

        continue; // eslint-disable-line no-continue
      }

      if (className) {
        this.#collectSelection(selection, bandKey, classNamesMap, headerAttributesMap);
      }

      const corners = selection.getCorners();

      if (selectionType === ACTIVE_HEADER_TYPE && className) {
        this.#markFrozenColumnSeamHeader(corners, className as string, classNamesMap);
        this.#markFrozenTopRowSeamHeader(corners, className as string, classNamesMap);
        this.#markFrozenBottomRowSeamHeader(corners, className as string, classNamesMap);
      }

      wot.getSetting('onBeforeDrawBorders', corners, selectionType);
      borderInstance?.appear(corners);
    }

    this.#applyCollected(classNamesMap, headerAttributesMap);
  }

  /**
   * Resolves the elements one selection layer covers on the active overlay and records the class
   * names and attributes it wants on each of them. The header part of the scan runs on every draw
   * (plugins redirect headers through hooks inside it); the cell part is cached per layer and overlay
   * and reused while the layer's corners, the rendered band, and the render epoch are unchanged.
   *
   * @param {Selection} selection The selection layer.
   * @param {string} bandKey The active overlay's band key (see {@link buildBandKey}).
   * @param {Map} classNamesMap The pass's element → class name layers map.
   * @param {Map} headerAttributesMap The pass's header element → attributes map.
   */
  #collectSelection(
    selection: Selection,
    bandKey: string,
    classNamesMap: Map<HTMLElement, Map<string, number>>,
    headerAttributesMap: Map<HTMLElement, SelectionAttribute[]>,
  ) {
    const wot = this.#activeOverlaysWot!;
    const { className, headerAttributes, createLayers, selectionType } = selection.settings;
    const layered = createLayers === true;
    const isActiveHeader = selectionType === ACTIVE_HEADER_TYPE;

    this.#scanner.setActiveSelection(selection);

    const cacheKey = `${selection.getCorners().join(',')};${bandKey}`;
    let cellScan: CellScanResult | undefined = this.#scanCache.get(selection, wot, cacheKey);

    if (cellScan === undefined) {
      cellScan = this.#scanner.scanCells();
      this.#scanCache.set(selection, wot, cacheKey, cellScan);
    }

    const collect = (element: HTMLElement) => {
      this.#addClassLayer(classNamesMap, element, className as string, layered);

      if (headerAttributes && element.nodeName === 'TH') {
        const attributes = headerAttributesMap.get(element) ?? [];

        attributes.push(...(headerAttributes as SelectionAttribute[]));
        headerAttributesMap.set(element, attributes);
      }

      // Tag the active-header neighbour classes in this same pass, so the scanned element set is
      // walked once. Order into `classNamesMap` does not matter — it is applied after the loop.
      if (isActiveHeader) {
        this.#markActiveHeaderNeighbor(element, className as string, classNamesMap);
      }
    };

    // The `onAfterDrawSelection` setting (the public `afterDrawSelection` hook) may name an extra class
    // for a cell of an area-type layer. Its answer depends on plugin state, so it is asked on every
    // draw, cache hit or not; only the element lookup is cached.
    const asksExtraClass = selectionType === 'area' || selectionType === 'fill' || selectionType === 'focus';
    const { layerLevel } = selection.settings;

    this.#scanner.scanHeaders().forEach(collect);
    cellScan.cells.forEach((coordinates, element) => {
      if (asksExtraClass) {
        coordinates.forEach(([sourceRow, sourceColumn]) => {
          const extraClassName = wot.getSetting('onAfterDrawSelection', sourceRow, sourceColumn, layerLevel);

          if (typeof extraClassName === 'string') {
            this.#addClassLayer(classNamesMap, element, extraClassName, false);
          }
        });
      }

      collect(element);
    });
  }

  /**
   * Records one class name for an element. A layered selection type (`createLayers`) counts how many
   * layers reach the element, which `expandLayeredClassNames` turns into the `<className>-<n>` set.
   *
   * @param {Map} classNamesMap The pass's element → class name layers map.
   * @param {HTMLElement} element The cell or header element.
   * @param {string} className The class name to record.
   * @param {boolean} layered Whether repeated occurrences count as layers.
   */
  #addClassLayer(
    classNamesMap: Map<HTMLElement, Map<string, number>>,
    element: HTMLElement,
    className: string,
    layered: boolean,
  ) {
    let classNamesLayers = classNamesMap.get(element);

    if (classNamesLayers === undefined) {
      classNamesLayers = new Map<string, number>();
      classNamesMap.set(element, classNamesLayers);
    }

    const occurrences = classNamesLayers.get(className);

    classNamesLayers.set(className, occurrences !== undefined && layered ? occurrences + 1 : 1);
  }

  /**
   * Applies the collected class names and attributes as a diff against the previous pass: unchanged
   * elements are left alone, changed ones are rewritten, and elements that left the selection have
   * their recorded classes and attributes removed.
   *
   * @param {Map} classNamesMap The pass's element → class name layers map.
   * @param {Map} headerAttributesMap The pass's header element → attributes map.
   */
  #applyCollected(
    classNamesMap: Map<HTMLElement, Map<string, number>>,
    headerAttributesMap: Map<HTMLElement, SelectionAttribute[]>,
  ) {
    const wot = this.#activeOverlaysWot!;
    const previous = this.#appliedElements.get(wot) ?? new Set<HTMLElement>();
    const next = new Set<HTMLElement>();
    const cellAttributes = (this.#selections!.options?.cellAttributes ?? []) as SelectionAttribute[];

    classNamesMap.forEach((classNamesLayers, element) => {
      const classNames = expandLayeredClassNames(classNamesLayers);
      const attributes = element.nodeName === 'TD' ? cellAttributes : (headerAttributesMap.get(element) ?? []);
      const signature = buildSelectionSignature(classNames, attributes);

      next.add(element);

      if (getAppliedSelection(element) === signature) {
        return;
      }

      removeAppliedSelection(element);
      applySelection(element, classNames, attributes, signature);
    });

    previous.forEach((element) => {
      if (!next.has(element)) {
        removeAppliedSelection(element);
      }
    });

    this.#appliedElements.set(wot, next);
  }

  /**
   * Removes the class names the `onBeforeRemoveCellClassNames` setting names, by querying the table.
   * Classes the engine applies itself are diffed and need no query; this exists for the public
   * `beforeRemoveCellClassNames` hook, which predates the diff and may still be used by a plugin that
   * writes selection classes on its own.
   */
  #removeLegacyClassNames() {
    const wot = this.#activeOverlaysWot!;
    const classNames = wot.wtSettings.getSetting<unknown>('onBeforeRemoveCellClassNames');

    if (!Array.isArray(classNames) || classNames.length === 0) {
      return;
    }

    classNames.forEach((className: string) => {
      const elements = wot.wtTable.TABLE.querySelectorAll(`.${className}`);

      for (let i = 0; i < elements.length; i++) {
        (elements[i] as HTMLElement).classList.remove(className);
        // The element no longer carries what its record says, so the diff must write it again.
        clearAppliedSelection(elements[i] as HTMLElement);
      }
    });
  }

  /**
   * Tags the neighbours of a single active-header cell: the TH directly BEFORE an active header gets
   * `<className>-prev` (the theme colors its inline-end border, giving the active header its
   * inline-start accent), and every TH of the TBODY row directly ABOVE an active row header gets
   * `<className>-prev-row` (the theme colors its bottom border, giving the active row header its top
   * accent). Selecting on these stamped classes replaces the former
   * `th:has(+ th.ht__active_highlight)` and `tr:has(+ tr > th.ht__active_highlight) th` theme rules:
   * with the class name inside a `:has()` argument, every toggle of it (the selection pass re-applies
   * it on each draw, and it moves between the recycled header nodes while scrolling) forced a style
   * invalidation scaled to the whole host page. The row tag lands on TH elements (not the TR) so the
   * per-band header render and the applied-selection diff fully own its cleanup. Called once per scanned
   * active-header element, from the class-applying pass in `render`.
   *
   * @param {HTMLElement} element A scanned active-header element.
   * @param {string} activeHeaderClassName The active header class name (the neighbour classes derive from it).
   * @param {Map} classNamesMap The render cycle's element→classNames map (applied and cleaned up later).
   */
  #markActiveHeaderNeighbor(
    element: HTMLElement,
    activeHeaderClassName: string,
    classNamesMap: Map<HTMLElement, Map<string, number>>
  ) {
    if (element.nodeName !== 'TH') {
      return;
    }

    const previousHeader = element.previousElementSibling;

    if (previousHeader !== null && previousHeader.nodeName === 'TH') {
      this.#tagSeamClass(classNamesMap, previousHeader as HTMLElement, `${activeHeaderClassName}-prev`);
    }

    this.#markPreviousRowHeaders(element, activeHeaderClassName, classNamesMap);
  }

  /**
   * Tags every TH of the TBODY row directly above the given active row-header cell — the row-axis
   * half of {@link SelectionManager#markActiveHeaderNeighbor}.
   *
   * @param {HTMLElement} element The active row-header cell.
   * @param {string} activeHeaderClassName The active header class name (the neighbour class derives from it).
   * @param {Map} classNamesMap The render cycle's element→classNames map (applied and cleaned up later).
   */
  #markPreviousRowHeaders(
    element: HTMLElement,
    activeHeaderClassName: string,
    classNamesMap: Map<HTMLElement, Map<string, number>>
  ) {
    const row = element.parentElement;

    if (row === null || row.nodeName !== 'TR' ||
        row.parentElement === null || row.parentElement.nodeName !== 'TBODY') {
      return;
    }

    const previousRow = row.previousElementSibling;

    if (previousRow === null || previousRow.nodeName !== 'TR') {
      return;
    }

    for (let i = 0; i < previousRow.children.length; i++) {
      const cell = previousRow.children[i];

      if (cell.nodeName !== 'TH') {
        break;
      }

      this.#tagSeamClass(classNamesMap, cell as HTMLElement, `${activeHeaderClassName}-prev-row`);
    }
  }

  /**
   * Adds a seam class to a header element in the render cycle's class map, creating the per-element
   * entry on first use. Shared by the frozen column/row seam taggers.
   *
   * @param {Map} classNamesMap The render cycle's element→classNames map (applied and cleaned up later).
   * @param {HTMLElement} th The header element to tag.
   * @param {string} seamClassName The seam class to add.
   */
  #tagSeamClass(
    classNamesMap: Map<HTMLElement, Map<string, number>>,
    th: HTMLElement,
    seamClassName: string
  ) {
    if (classNamesMap.has(th)) {
      classNamesMap.get(th)!.set(seamClassName, 1);
    } else {
      classNamesMap.set(th, new Map<string, number>([[seamClassName, 1]]));
    }
  }

  /**
   * Tags the last frozen column header with a seam class when the first non-frozen column is the
   * active header. That header's inline-start edge lands on the frozen-pane seam, which is drawn by
   * the frozen overlay (a separate table) and is therefore out of reach of the neighbour `:has()`
   * rule that gives every other active header its inline-start accent. The class lets the theme color
   * that seam to match. No-op unless `fixedColumnsStart` is used and this is the frozen overlay.
   *
   * @param {number[]} corners The active-header selection corners `[fromRow, fromColumn, toRow, toColumn]`.
   * @param {string} activeHeaderClassName The active header class name (the seam class derives from it).
   * @param {Map} classNamesMap The render cycle's element→classNames map (applied and cleaned up later).
   */
  #markFrozenColumnSeamHeader(
    corners: number[],
    activeHeaderClassName: string,
    classNamesMap: Map<HTMLElement, Map<string, number>>
  ) {
    const wot = this.#activeOverlaysWot!;
    const fixedColumnsStart = wot.getSetting('fixedColumnsStart') as number;

    if (fixedColumnsStart <= 0) {
      return;
    }

    const { wtTable } = wot;

    // Only the overlay that renders the frozen columns (and nothing past them) owns the seam line.
    if (wtTable.getLastRenderedColumn() !== fixedColumnsStart - 1) {
      return;
    }

    // The selection's inline-start column must sit exactly on the freeze line.
    if (Math.min(corners[1], corners[3]) !== fixedColumnsStart) {
      return;
    }

    const seamClassName = `${activeHeaderClassName}-seam`;
    const headerLevels = wtTable.getColumnHeadersCount();

    for (let level = 0; level < headerLevels; level++) {
      const th = wtTable.getColumnHeader(fixedColumnsStart - 1, level) as HTMLElement | undefined;

      if (isHTMLElement(th)) {
        this.#tagSeamClass(classNamesMap, th, seamClassName);
      }
    }
  }

  /**
   * Row-axis mirror of {@link SelectionManager#markFrozenColumnSeamHeader} for the top freeze:
   * tags the last top-frozen row header with a seam class when the first non-frozen row is the
   * active header. That row's top edge lands on the top freeze line, which is drawn by the top
   * overlay (a separate table) and is therefore out of reach of the `:has(+ tr ...)` rule that gives
   * every other active row header its top accent. The class lets the theme color the seam's bottom
   * border to match. No-op unless `fixedRowsTop` is used and this is the top overlay.
   *
   * @param {number[]} corners The active-header selection corners `[fromRow, fromColumn, toRow, toColumn]`.
   * @param {string} activeHeaderClassName The active header class name (the seam class derives from it).
   * @param {Map} classNamesMap The render cycle's element→classNames map (applied and cleaned up later).
   */
  #markFrozenTopRowSeamHeader(
    corners: number[],
    activeHeaderClassName: string,
    classNamesMap: Map<HTMLElement, Map<string, number>>
  ) {
    const wot = this.#activeOverlaysWot!;
    const fixedRowsTop = wot.getSetting('fixedRowsTop') as number;

    if (fixedRowsTop <= 0) {
      return;
    }

    const { wtTable } = wot;
    const lastFrozenRow = fixedRowsTop - 1;

    // Only the overlay that renders the top-frozen rows (ending exactly on the freeze line) owns the
    // seam line.
    if (wtTable.getLastRenderedRow() !== lastFrozenRow) {
      return;
    }

    // The selection's top row must sit exactly on the first non-frozen row.
    if (Math.min(corners[0], corners[2]) !== fixedRowsTop) {
      return;
    }

    const seamClassName = `${activeHeaderClassName}-row-seam-top`;
    const headerLevels = wtTable.getRowHeadersCount();

    for (let level = 0; level < headerLevels; level++) {
      const th = wtTable.getRowHeader(lastFrozenRow, level) as HTMLElement | undefined;

      // Overlays without row headers (e.g. the plain `top` overlay) return a TD here; only tag actual
      // row-header cells.
      if (isHTMLElement(th) && th.nodeName === 'TH') {
        this.#tagSeamClass(classNamesMap, th, seamClassName);
      }
    }
  }

  /**
   * Row-axis mirror of {@link SelectionManager#markFrozenColumnSeamHeader} for the bottom freeze:
   * tags the first bottom-frozen row header with a seam class when the last non-frozen row is the
   * active header. That row's bottom edge lands on the bottom freeze line, which is drawn by the
   * bottom overlay (a separate table) and is therefore out of reach of the `:has(+ tr ...)` rule that
   * gives every other active row header its top accent. The class lets the theme color the seam's top
   * border to match. No-op unless `fixedRowsBottom` is used and this is the bottom overlay.
   *
   * @param {number[]} corners The active-header selection corners `[fromRow, fromColumn, toRow, toColumn]`.
   * @param {string} activeHeaderClassName The active header class name (the seam class derives from it).
   * @param {Map} classNamesMap The render cycle's element→classNames map (applied and cleaned up later).
   */
  #markFrozenBottomRowSeamHeader(
    corners: number[],
    activeHeaderClassName: string,
    classNamesMap: Map<HTMLElement, Map<string, number>>
  ) {
    const wot = this.#activeOverlaysWot!;
    const fixedRowsBottom = wot.getSetting('fixedRowsBottom') as number;

    if (fixedRowsBottom <= 0) {
      return;
    }

    const { wtTable } = wot;
    const totalRows = wot.getSetting('totalRows') as number;
    const firstFrozenRow = totalRows - fixedRowsBottom;

    // Only the overlay that renders the bottom-frozen rows (starting exactly on the freeze line) owns
    // the seam line.
    if (wtTable.getFirstRenderedRow() !== firstFrozenRow) {
      return;
    }

    // The selection's bottom row must sit exactly on the last non-frozen row.
    if (Math.max(corners[0], corners[2]) !== firstFrozenRow - 1) {
      return;
    }

    const seamClassName = `${activeHeaderClassName}-row-seam-bottom`;
    const headerLevels = wtTable.getRowHeadersCount();

    for (let level = 0; level < headerLevels; level++) {
      const th = wtTable.getRowHeader(firstFrozenRow, level) as HTMLElement | undefined;

      // Overlays without row headers (e.g. the plain `bottom` overlay) return a TD here; only tag
      // actual row-header cells.
      if (isHTMLElement(th) && th.nodeName === 'TH') {
        this.#tagSeamClass(classNamesMap, th, seamClassName);
      }
    }
  }
}
