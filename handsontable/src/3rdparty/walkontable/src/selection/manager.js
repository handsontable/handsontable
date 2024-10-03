import {
  removeClass,
  addClass,
  setAttribute,
  removeAttribute
} from '../../../../helpers/dom/element';
import { SelectionScanner } from './scanner';
import Border from './border/border';

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
  #activeOverlaysWot;
  /**
   * The Highlight instance that holds Selections instances within it.
   *
   * @type {Highlight|null}
   */
  #selections;
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
  #appliedClasses = new WeakMap();
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
  #selectionBorders = new Map();

  constructor(selections) {
    this.#selections = selections;
  }

  /**
   * Sets the active Walkontable instance.
   *
   * @param {Walkontable} activeWot The overlays or master Walkontable instance.
   * @returns {SelectionManager}
   */
  setActiveOverlay(activeWot) {
    this.#activeOverlaysWot = activeWot;
    this.#scanner.setActiveOverlay(this.#activeOverlaysWot);

    if (!this.#appliedClasses.has(this.#activeOverlaysWot)) {
      this.#appliedClasses.set(this.#activeOverlaysWot, new Set());
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
  getBorderInstance(selection) {
    if (!selection.settings.border) {
      return null;
    }

    if (this.#selectionBorders.has(selection)) {
      const borders = this.#selectionBorders.get(selection);

      if (borders.has(this.#activeOverlaysWot)) {
        return borders.get(this.#activeOverlaysWot);
      }

      const border = new Border(this.#activeOverlaysWot, selection.settings);

      borders.set(this.#activeOverlaysWot, border);

      return border;
    }

    const border = new Border(this.#activeOverlaysWot, selection.settings);

    this.#selectionBorders.set(selection, new Map([[this.#activeOverlaysWot, border]]));

    return border;
  }

  /**
   * Gets all Border instances associated with Selection instance for all overlays.
   *
   * @param {Selection} selection The selection instance.
   * @returns {Border[]}
   */
  getBorderInstances(selection) {
    return Array.from(this.#selectionBorders.get(selection)?.values() ?? []);
  }

  /**
   * Destroys the Border instance associated with Selection instance.
   *
   * @param {Selection} selection The selection instance.
   */
  destroyBorders(selection) {
    this.#selectionBorders.get(selection).forEach(border => border.destroy());
    this.#selectionBorders.delete(selection);
  }

  /**
   * Renders all the selections (add CSS classes to cells and draw borders).
   *
   * @param {boolean} fastDraw Indicates the render cycle type (fast/slow).
   */
  render(fastDraw) {
    if (this.#selections === null) {
      return;
    }

    if (fastDraw) {
      // there was no rerender, so we need to remove classNames by ourselves
      this.#resetCells();
    }

    const selections = Array.from(this.#selections);
    const classNamesMap = new Map();
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
          .scan();

        elements.forEach((element) => {
          if (classNamesMap.has(element)) {
            const classNamesLayers = classNamesMap.get(element);

            if (classNamesLayers.has(className) && createLayers === true) {
              classNamesLayers.set(className, classNamesLayers.get(className) + 1);
            } else {
              classNamesLayers.set(className, 1);
            }

          } else {
            classNamesMap.set(element, new Map([[className, 1]]));
          }

          if (headerAttributes) {
            if (!headerAttributesMap.has(element)) {
              headerAttributesMap.set(element, []);
            }

            if (element.nodeName === 'TH') {
              headerAttributesMap.get(element).push(...headerAttributes);
            }
          }
        });
      }

      const corners = selection.getCorners();

      this.#activeOverlaysWot.getSetting('onBeforeDrawBorders', corners, selectionType);
      borderInstance?.appear(corners);
    }

    classNamesMap.forEach((classNamesLayers, element) => {
      const classNames = Array.from(classNamesLayers).map(([className, occurrenceCount]) => {
        if (occurrenceCount === 1) {
          return className;
        }

        return [className, ...Array.from({
          length: occurrenceCount - 1
        }, (_, i) => `${className}-${i + 1}`)];
      }).flat();

      classNames.forEach(className => this.#appliedClasses
        .get(this.#activeOverlaysWot)
        .add(className));

      addClass(element, classNames);

      if (element.nodeName === 'TD' && Array.isArray(this.#selections.options?.cellAttributes)) {
        setAttribute(element, this.#selections.options.cellAttributes);
      }
    });

    // Set the attributes for the headers if they're focused.
    Array.from(headerAttributesMap.keys()).forEach((element) => {
      setAttribute(element, [...headerAttributesMap.get(element)]);
    });
  }

  /**
   * Resets the elements to their initial state (remove the CSS classes that are added in the
   * previous render cycle).
   */
  #resetCells() {
    const appliedOverlaysClasses = this.#appliedClasses.get(this.#activeOverlaysWot);
    const classesToRemove = this.#activeOverlaysWot.wtSettings.getSetting('onBeforeRemoveCellClassNames');

    if (Array.isArray(classesToRemove)) {
      for (let i = 0; i < classesToRemove.length; i++) {
        appliedOverlaysClasses.add(classesToRemove[i]);
      }
    }

    appliedOverlaysClasses.forEach((className) => {
      const nodes = this.#activeOverlaysWot.wtTable.TABLE.querySelectorAll(`.${className}`);
      let cellAttributes = [];

      if (Array.isArray(this.#selections.options?.cellAttributes)) {
        cellAttributes = this.#selections.options.cellAttributes.map(el => el[0]);
      }

      if (Array.isArray(this.#selections.options?.headerAttributes)) {
        cellAttributes = [...cellAttributes, ...this.#selections.options.headerAttributes.map(el => el[0])];
      }

      for (let i = 0, len = nodes.length; i < len; i++) {
        removeClass(nodes[i], className);

        removeAttribute(nodes[i], cellAttributes);
      }
    });

    appliedOverlaysClasses.clear();
  }
}
