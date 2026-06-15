import type { HotInstance } from '../../core/types';
import { arrayEach } from '../../helpers/array';

interface CellRangeLike {
  forAll(callback: (row: number, col: number) => void | boolean): void;
}

/**
 * @param {string} className The full element class name to process.
 * @param {string} alignment The alignment class name to compare with.
 * @returns {string}
 */
export function prepareVerticalAlignClass(className: string, alignment: string) {
  if (className.indexOf(alignment) !== -1) {
    return className;
  }

  const replacedClassName = className
    .replace('htTop', '')
    .replace('htMiddle', '')
    .replace('htBottom', '')
    .replace('  ', '');

  return `${replacedClassName} ${alignment}`;
}

/**
 * @param {string} className The full element class name to process.
 * @param {string} alignment The alignment class name to compare with.
 * @returns {string}
 */
export function prepareHorizontalAlignClass(className: string, alignment: string) {
  if (className.indexOf(alignment) !== -1) {
    return className;
  }
  const replacedClassName = className
    .replace('htLeft', '')
    .replace('htCenter', '')
    .replace('htRight', '')
    .replace('htJustify', '')
    .replace('  ', '');

  return `${replacedClassName} ${alignment}`;
}

/**
 * @param {CellRange[]} ranges An array of the cell ranges.
 * @param {Function} callback The callback function.
 * @returns {object}
 */
export function getAlignmentClasses(ranges: CellRangeLike[], callback: (row: number, col: number) => string) {
  const classes: Record<number, string[]> = {};

  arrayEach(ranges, (range: CellRangeLike) => {
    range.forAll((row: number, col: number) => {
      // Alignment classes should only collected within cell ranges. We skip header coordinates.
      if (row >= 0 && col >= 0) {
        if (!classes[row]) {
          classes[row] = [];
        }

        classes[row][col] = callback(row, col);
      }
    });
  });

  return classes;
}

/**
 * @param {CellRange[]} ranges An array of the cell ranges.
 * @param {string} type The type of the alignment axis ('horizontal' or 'vertical').
 * @param {string} alignment CSS class name to add.
 * @param {Function} cellDescriptor The function which fetches the cell meta object based in passed coordinates.
 * @param {Function} propertySetter The function which contains logic for added/removed alignment.
 */
export function align(
  ranges: CellRangeLike[],
  type: string,
  alignment: string,
  cellDescriptor: (row: number, col: number) => Record<string, unknown>,
  propertySetter: (row: number, col: number, key: string, value: string) => void
) {
  arrayEach(ranges, (range: CellRangeLike) => {
    range.forAll((row: number, col: number) => {
      // Alignment classes should only collected within cell ranges. We skip header coordinates.
      if (row >= 0 && col >= 0) {
        applyAlignClassName(row, col, type, alignment, cellDescriptor, propertySetter);
      }
    });
  });
}

/**
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @param {string} type The type of the alignment axis ('horizontal' or 'vertical').
 * @param {string} alignment CSS class name to add.
 * @param {Function} cellDescriptor The function which fetches the cell meta object based in passed coordinates.
 * @param {Function} propertySetter The function which contains logic for added/removed alignment.
 */
function applyAlignClassName(
  row: number,
  col: number,
  type: string,
  alignment: string,
  cellDescriptor: (row: number, col: number) => Record<string, unknown>,
  propertySetter: (row: number, col: number, key: string, value: string) => void
) {
  const cellMeta = cellDescriptor(row, col);
  let className = alignment;

  if (cellMeta.className) {
    if (type === 'vertical') {
      className = prepareVerticalAlignClass(cellMeta.className as string, alignment);
    } else {
      className = prepareHorizontalAlignClass(cellMeta.className as string, alignment);
    }
  }

  propertySetter(row, col, 'className', className);
}

/**
 * @param {string} label The label text.
 * @returns {string}
 */
export function markLabelAsSelected(label: string) {
  // workaround for https://github.com/handsontable/handsontable/issues/1946
  return `<span class="selected">${String.fromCharCode(10003)}</span>${label}`;
}

/**
 * @param {CellRange[]} ranges An array of the cell ranges.
 * @param {Function} comparator The comparator function.
 * @returns {boolean}
 */
export function checkSelectionConsistency(ranges: CellRangeLike[], comparator: (row: number, col: number) => boolean) {
  let result = false;

  if (Array.isArray(ranges)) {
    arrayEach(ranges, (range) => {
      (range as CellRangeLike).forAll((row: number, col: number) => {
        // Selection consistency should only check within cell ranges. We skip header coordinates.
        if (row >= 0 && col >= 0 && comparator(row, col)) {
          result = true;

          return false;
        }
      });

      return result;
    });
  }

  return result;
}

/**
 * Returns document offset based on the passed element. If the document objects between element and the
 * base document are not the same the offset as top and left properties will be returned.
 *
 * @param {Element} elementToCheck The element to compare with Document object.
 * @param {Document} baseDocument The base Document object.
 * @returns {{ top: number, left: number }}
 */
export function getDocumentOffsetByElement(elementToCheck: HTMLElement, baseDocument: Document) {
  const offset = { top: 0, left: 0 };

  if (baseDocument !== elementToCheck.ownerDocument) {
    const { frameElement } = baseDocument.defaultView as Window;
    const { top, left } = (frameElement as HTMLElement).getBoundingClientRect();

    offset.top = top;
    offset.left = left;
  }

  return offset;
}

/**
 * Prepares comparator function consumable by checkSelectionConsistency
 * Comparator function checks if the cell has the provided class name.
 *
 * @param  {string} htClassName The class name to check.
 * @returns {Function} Returns the comparator function.
 * Use with .bind, .call or .apply to pass the Handsontable instance.
 */
export function getAlignmentComparatorByClass(htClassName: string) {
  return function(this: HotInstance, row: number, col: number): boolean {
    const className = this.getCellMeta(row, col).className as string | string[] | undefined;

    return Boolean(className && className.indexOf(htClassName) !== -1);
  };
}
