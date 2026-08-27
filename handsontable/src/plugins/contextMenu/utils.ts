import type { HotInstance } from '../../core/types';
import { arrayEach } from '../../helpers/array';
import { normalizeClassNames } from '../../helpers/dom/element';

interface CellRangeLike {
  forAll(callback: (row: number, col: number) => void | boolean): void;
}

const VERTICAL_ALIGNMENT_CLASS_NAMES = ['htTop', 'htMiddle', 'htBottom'];
const HORIZONTAL_ALIGNMENT_CLASS_NAMES = ['htLeft', 'htCenter', 'htRight', 'htJustify'];

/**
 * Swaps the alignment class of one axis, leaving every other class name untouched.
 *
 * The class name is compared token by token. Matching substrings is not enough - it both destroys
 * custom classes that merely contain an alignment name (`htTopBar`) and, once a token is cut out of
 * the middle of the string, glues its two neighbours together (#7122).
 *
 * @param {string|string[]} className The full element class name to process.
 * @param {string} alignment The alignment class name to apply.
 * @param {string[]} axisClassNames The alignment class names of the axis being changed.
 * @returns {string}
 */
function prepareAlignClass(className: string | string[], alignment: string, axisClassNames: string[]): string {
  const classNames = normalizeClassNames(className);

  if (classNames.includes(alignment)) {
    return classNames.join(' ');
  }

  return [...classNames.filter(name => !axisClassNames.includes(name)), alignment].join(' ');
}

/**
 * @param {string|string[]} className The full element class name to process.
 * @param {string} alignment The alignment class name to compare with.
 * @returns {string}
 */
export function prepareVerticalAlignClass(className: string | string[], alignment: string) {
  return prepareAlignClass(className, alignment, VERTICAL_ALIGNMENT_CLASS_NAMES);
}

/**
 * @param {string|string[]} className The full element class name to process.
 * @param {string} alignment The alignment class name to compare with.
 * @returns {string}
 */
export function prepareHorizontalAlignClass(className: string | string[], alignment: string) {
  return prepareAlignClass(className, alignment, HORIZONTAL_ALIGNMENT_CLASS_NAMES);
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
      className = prepareVerticalAlignClass(cellMeta.className as string | string[], alignment);
    } else {
      className = prepareHorizontalAlignClass(cellMeta.className as string | string[], alignment);
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
    const className = this.getCellMetaTransient(row, col).className as string | string[] | undefined;

    return Boolean(className && className.indexOf(htClassName) !== -1);
  };
}
