import { removeClass, addClass } from '../../../../helpers/dom/element';
import { SelectionScanner } from './scanner';

export class SelectionManager {
  #mainWot;
  #activeOverlaysWot;
  #selections;
  #scanner = new SelectionScanner();
  #appliedClasses = new WeakMap();

  constructor(mainWot, selections) {
    this.#mainWot = mainWot;
    this.#selections = selections;
  }

  setActiveOverlay(activeWot) {
    this.#activeOverlaysWot = activeWot;
    this.#scanner.setActiveOverlay(this.#activeOverlaysWot);

    if (!this.#appliedClasses.has(this.#activeOverlaysWot)) {
      this.#appliedClasses.set(this.#activeOverlaysWot, new Set());
    }

    return this;
  }

  getFocusSelection() {
    return this.#selections.getCell();
  }

  getAreaSelection() {
    return this.#selections.createOrGetArea();
  }

  render(fastDraw) {
    const selections = Array.from(this.#selections);

    if (fastDraw) {
      // there was no rerender, so we need to remove classNames by ourselves
      this.#resetCells();
    }

    const classNamesMap = new Map();

    for (let i = 0; i < selections.length; i++) {
      const selection = selections[i];

      if (selection.isEmpty()) {
        if (selection.settings.border) {
          selection.getBorder(this.#activeOverlaysWot).disappear();
        }

        continue;
      }

      const elements = [];
      const {
        className,
        layerLevel,
        border
      } = selection.settings;

      if (className) {
        this.#scanner.setActiveSelection(selection);

        if (selection.settings.selectionType === 'active-header') {
          elements.push(...this.#scanner.scanColumnsInHeadersRange());
          elements.push(...this.#scanner.scanRowsInHeadersRange());

        } else if (selection.settings.selectionType === 'area') {
          elements.push(...this.#scanner.scanCellsRange());

        } else if (selection.settings.selectionType === 'focus') {
          elements.push(...this.#scanner.scanColumnsInHeadersRange());
          elements.push(...this.#scanner.scanRowsInHeadersRange());
          elements.push(...this.#scanner.scanCellsRange());

        } else if (selection.settings.selectionType === 'fill') {
          elements.push(...this.#scanner.scanCellsRange());

        } else if (selection.settings.selectionType === 'header') {
          elements.push(...this.#scanner.scanColumnsInHeadersRange());
          elements.push(...this.#scanner.scanRowsInHeadersRange());

        } else if (selection.settings.selectionType === 'row') {
          elements.push(...this.#scanner.scanRowsInHeadersRange());
          elements.push(...this.#scanner.scanRowsInCellsRange());

        } else if (selection.settings.selectionType === 'column') {
          elements.push(...this.#scanner.scanColumnsInHeadersRange());
          elements.push(...this.#scanner.scanColumnsInCellsRange());
        }

        elements.forEach((element) => {
          if (classNamesMap.has(element)) {
            const classNamesLayers = classNamesMap.get(element);

            if (classNamesLayers.has(className) && layerLevel !== void 0) {
              classNamesLayers.set(className, classNamesLayers.get(className) + 1);
            } else {
              classNamesLayers.set(className, 1);
            }

          } else {
            classNamesMap.set(element, new Map([[className, 1]]));
          }
        });
      }

      if (border) {
        selection.getBorder(this.#activeOverlaysWot).appear(selection.getCorners());
      }
    }

    classNamesMap.forEach((classNamesMap, element) => {
      const classNames = Array.from(classNamesMap).map(([className, occurrenceCount]) => {
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
    });
  }

  #resetCells() {
    const appliedOverlaysClasses = this.#appliedClasses.get(this.#activeOverlaysWot);
    const additionalClassesToRemove = this.#mainWot.wtSettings.getSetting('onBeforeRemoveCellClassNames');

    if (Array.isArray(additionalClassesToRemove)) {
      for (let i = 0; i < additionalClassesToRemove.length; i++) {
        appliedOverlaysClasses.add(additionalClassesToRemove[i]);
      }
    }

    appliedOverlaysClasses.forEach(className => {
      const nodes = this.#activeOverlaysWot.wtTable.TABLE.querySelectorAll(`.${className}`);

      for (let i = 0, len = nodes.length; i < len; i++) {
        removeClass(nodes[i], className);
      }
    });

    appliedOverlaysClasses.clear();
  }
}
