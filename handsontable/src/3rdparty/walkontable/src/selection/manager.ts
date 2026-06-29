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
import {
  removeClass,
  addClass,
  setAttribute,
  removeAttribute,
  isHTMLElement
} from '../../../../helpers/dom/element';
import { SelectionScanner } from './scanner';
import Border from './border/border';
import { ACTIVE_HEADER_TYPE } from './constants';

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
   * The Map tracks applied CSS classes. It's used to reset the elements state to their initial state.
   *
   * @type {WeakMap}
   */
  #appliedClasses = new WeakMap<WalkontableInstance, Set<string>>();
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

    if (!this.#appliedClasses.has(this.#activeOverlaysWot!)) {
      this.#appliedClasses.set(this.#activeOverlaysWot!, new Set());
    }

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
   * Destroys the Border instance associated with Selection instance.
   *
   * @param {Selection} selection The selection instance.
   */
  destroyBorders(selection: Selection) {
    this.#selectionBorders.get(selection)?.forEach(border => border.destroy());
    this.#selectionBorders.delete(selection);
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
   * @param {boolean} fastDraw Indicates the render cycle type (fast/slow).
   */
  render(fastDraw: boolean) {
    if (this.#selections === null) {
      return;
    }

    if (fastDraw) {
      // there was no rerender, so we need to remove classNames by ourselves
      this.#resetCells();
    }

    const selections: Selection[] = Array.from(this.#selections);
    const classNamesMap = new Map<HTMLElement, Map<string, number>>();
    const headerAttributesMap = new Map();

    for (let i = 0; i < selections.length; i++) {
      const selection = selections[i];
      const {
        className,
        headerAttributes,
        createLayers,
        selectionType,
      } = selection.settings;

      if (!this.#destroyListeners.has(selection)) {
        this.#destroyListeners.add(selection);
        selection.addLocalHook('destroy', () => this.destroyBorders(selection));
      }

      const borderInstance = this.getBorderInstance(selection);

      if (selection.isEmpty()) {
        borderInstance?.disappear();

        continue; // eslint-disable-line no-continue
      }

      if (className) {
        const elements = this.#scanner
          .setActiveSelection(selection)
          .scan() as Set<HTMLElement>;

        elements.forEach((element: HTMLElement) => {
          if (classNamesMap.has(element)) {
            const classNamesLayers = classNamesMap.get(element)!;

            if (classNamesLayers.has(className as string) && createLayers === true) {
              classNamesLayers.set(className as string, (classNamesLayers.get(className as string) ?? 0) + 1);
            } else {
              classNamesLayers.set(className as string, 1);
            }

          } else {
            classNamesMap.set(element, new Map<string, number>([[className as string, 1]]));
          }

          if (headerAttributes) {
            if (!headerAttributesMap.has(element)) {
              headerAttributesMap.set(element, []);
            }

            if (element.nodeName === 'TH') {
              const attrs = headerAttributes as Array<[string, string | number | boolean]>;

              headerAttributesMap.get(element).push(...attrs);
            }
          }
        });
      }

      const corners = selection.getCorners();

      if (selectionType === ACTIVE_HEADER_TYPE && className) {
        this.#markFrozenColumnSeamHeader(corners, className as string, classNamesMap);
        this.#markFrozenTopRowSeamHeader(corners, className as string, classNamesMap);
        this.#markFrozenBottomRowSeamHeader(corners, className as string, classNamesMap);
      }

      this.#activeOverlaysWot!.getSetting('onBeforeDrawBorders', corners, selectionType);
      borderInstance?.appear(corners);
    }

    classNamesMap.forEach((classNamesLayers, element) => {
      const classNames: string[] = Array.from(classNamesLayers).map(([className, occurrenceCount]) => {
        if (occurrenceCount === 1) {
          return className;
        }

        return [className, ...Array.from({
          length: occurrenceCount - 1
        }, (_, i) => `${className}-${i + 1}`)];
      }).flat();

      classNames.forEach((className: string) => this.#appliedClasses
        .get(this.#activeOverlaysWot!)
        ?.add(className));

      addClass(element, classNames as string[]);

      if (element.nodeName === 'TD' && Array.isArray(this.#selections!.options?.cellAttributes)) {
        setAttribute(element, this.#selections!.options.cellAttributes);
      }
    });

    // Set the attributes for the headers if they're focused.
    Array.from(headerAttributesMap.keys()).forEach((element) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      setAttribute(element, [...headerAttributesMap.get(element)]);
    });
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

  /**
   * Resets the elements to their initial state (remove the CSS classes that are added in the
   * previous render cycle).
   */
  #resetCells() {
    const appliedOverlaysClasses = this.#appliedClasses.get(this.#activeOverlaysWot!);

    if (!appliedOverlaysClasses) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const classesToRemove = this.#activeOverlaysWot!.wtSettings.getSetting('onBeforeRemoveCellClassNames');

    if (Array.isArray(classesToRemove)) {
      for (let i = 0; i < classesToRemove.length; i++) {
        appliedOverlaysClasses.add(classesToRemove[i]);
      }
    }

    appliedOverlaysClasses.forEach((className: string) => {
      const nodes = this.#activeOverlaysWot!.wtTable.TABLE.querySelectorAll(`.${className}`);
      let cellAttributes: string[] = [];

      if (Array.isArray(this.#selections!.options?.cellAttributes)) {
        cellAttributes = this.#selections!.options.cellAttributes.map(el => el[0]);
      }

      if (Array.isArray(this.#selections!.options?.headerAttributes)) {
        cellAttributes = [
          ...cellAttributes, ...this.#selections!.options.headerAttributes.map(el => el[0])];
      }

      for (let i = 0, len = nodes.length; i < len; i++) {
        removeClass(nodes[i] as HTMLElement, className);

        removeAttribute(nodes[i] as HTMLElement, cellAttributes);
      }
    });

    appliedOverlaysClasses.clear();
  }
}
