import { removeClass } from '../../../../helpers/dom/element';

export class SelectionManager {
  mainWot;
  selections;
  constructor(mainWot, selections) {
    this.mainWot = mainWot;
    this.selections = selections;
  }

  getFocusSelection() {
    return this.selections.getCell();
  }

  getAreaSelection() {
    return this.selections.createOrGetArea();
  }

  render(overlaysWot, fastDraw) {
    const selections = Array.from(this.selections);

    console.log(1);

    if (fastDraw) {
      // there was no rerender, so we need to remove classNames by ourselves
      this.#resetCells(overlaysWot, selections);
    }

    for (let i = 0; i < selections.length; i++) {
      selections[i].draw(overlaysWot, fastDraw);
    }
  }

  #resetCells(overlaysWot, selections) {
    const classesToRemove = [];

    for (let i = 0; i < selections.length; i++) {
      const classNames = selections[i].classNames;
      const classNamesLength = classNames.length;

      for (let j = 0; j < classNamesLength; j++) {
        if (!classesToRemove.includes(classNames[j])) {
          classesToRemove.push(classNames[j]);
        }
      }
    }

    const additionalClassesToRemove = this.mainWot.wtSettings.getSetting('onBeforeRemoveCellClassNames');

    if (Array.isArray(additionalClassesToRemove)) {
      for (let i = 0; i < additionalClassesToRemove.length; i++) {
        classesToRemove.push(additionalClassesToRemove[i]);
      }
    }

    const classesToRemoveLength = classesToRemove.length;

    for (let i = 0; i < classesToRemoveLength; i++) {
      removeClassFromCells(overlaysWot, classesToRemove[i]);
    }
  }
}

/**
 * @param {string} className The CSS class name to remove from the table cells.
 */
function removeClassFromCells(overlaysWot, className) {
  const nodes = overlaysWot.wtTable.TABLE.querySelectorAll(`.${className}`);

  for (let i = 0, len = nodes.length; i < len; i++) {
    removeClass(nodes[i], className);
  }
}
