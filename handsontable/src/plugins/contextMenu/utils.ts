import type { HotInstance } from '../../core/types';
import { arrayEach } from '../../helpers/array';
import { normalizeClassNames } from '../../helpers/dom/element';

interface CellRangeLike {
  forAll(callback: (row: number, col: number) => void | boolean): void;
}

const VERTICAL_ALIGNMENT_CLASS_NAMES = ['htTop', 'htMiddle', 'htBottom'];
const HORIZONTAL_ALIGNMENT_CLASS_NAMES = ['htLeft', 'htCenter', 'htRight', 'htJustify'];

/**
 * The third state of a checkable menu item, for a selection that is only partly on. Maps to
 * `aria-checked="mixed"`. Declared here, not in `menu/utils.ts`, because that module reaches this one
 * through `predefinedItems`, so a value import the other way is a cycle. `menu/utils.ts` re-exports it.
 */
export const MENU_ITEM_MIXED = 'mixed';

export type MenuItemCheckedState = boolean | typeof MENU_ITEM_MIXED;

/**
 * Swaps the alignment class of one axis, leaving every other class name untouched.
 *
 * The class name is compared token by token. Matching substrings is not enough – it both destroys
 * custom classes that merely contain an alignment name (`htTopBar`) and, once a token is cut out of
 * the middle of the string, glues its two neighbors together (#7122).
 *
 * Every class name of the axis is dropped, including the one being applied. Returning early when the
 * picked alignment is already there would leave a competing class name of the same axis in place.
 *
 * @param {string|string[]|undefined} className The full element class name to process.
 * @param {string} alignment The alignment class name to apply.
 * @param {string[]} axisClassNames The alignment class names of the axis being changed.
 * @returns {string}
 */
function prepareAlignClass(
  className: string | string[] | undefined,
  alignment: string,
  axisClassNames: string[]
): string {
  const classNames = normalizeClassNames(className)
    .filter(name => name !== alignment && !axisClassNames.includes(name));

  return [...classNames, alignment].join(' ');
}

/**
 * @param {string|string[]|undefined} className The full element class name to process.
 * @param {string} alignment The alignment class name to compare with.
 * @returns {string}
 */
export function prepareVerticalAlignClass(className: string | string[] | undefined, alignment: string) {
  return prepareAlignClass(className, alignment, VERTICAL_ALIGNMENT_CLASS_NAMES);
}

/**
 * @param {string|string[]|undefined} className The full element class name to process.
 * @param {string} alignment The alignment class name to compare with.
 * @returns {string}
 */
export function prepareHorizontalAlignClass(className: string | string[] | undefined, alignment: string) {
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
  const { className: currentClassName } = cellDescriptor(row, col) as { className?: string | string[] };
  const className = type === 'vertical' ?
    prepareVerticalAlignClass(currentClassName, alignment) :
    prepareHorizontalAlignClass(currentClassName, alignment);

  propertySetter(row, col, 'className', className);
}

/**
 * Reports whether every, no, or only some of the selected cells satisfy the comparator. Use it for a
 * check mark; `checkSelectionConsistency()` answers "at least one", which marks a partly-on
 * selection as fully on. Stops as soon as both a match and a non-match are seen.
 *
 * The comparator returns `null` for a cell that does not take part, such as a hidden cell under a
 * merged block. Only `null` skips a cell: any other falsy value, `undefined` included, is a
 * non-match, so a comparator that returns an unset `meta.readOnly` still reads a writable cell as
 * "no". A selection in which no cell takes part reports `false`.
 *
 * @param {CellRange[]} ranges An array of the cell ranges.
 * @param {Function} comparator The comparator function.
 * @returns {boolean|string}
 */
export function getSelectionCheckState(
  ranges: CellRangeLike[], comparator: (row: number, col: number) => boolean | null
): MenuItemCheckedState {
  let seenMatch = false;
  let seenMiss = false;

  if (Array.isArray(ranges)) {
    arrayEach(ranges, (range) => {
      (range as CellRangeLike).forAll((row: number, col: number) => {
        // Only cell ranges carry the meta a comparator reads. Header coordinates are skipped, as
        // they are in `checkSelectionConsistency()`, so a column selection is judged by its cells.
        if (row < 0 || col < 0) {
          return;
        }

        const matches = comparator(row, col);

        if (matches === null) {
          return;
        }

        if (matches) {
          seenMatch = true;
        } else {
          seenMiss = true;
        }

        if (seenMatch && seenMiss) {
          return false;
        }
      });

      return !(seenMatch && seenMiss);
    });
  }

  if (seenMatch && seenMiss) {
    return MENU_ITEM_MIXED;
  }

  return seenMatch;
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

    // Compared token by token. A substring match would report `htLeftPanel` as being aligned left.
    return normalizeClassNames(className).includes(htClassName);
  };
}

/**
 * Prefixes a label with the check mark the context menu draws for a checked item.
 *
 * Legacy, and unused by Handsontable itself: a menu item carries its state in the `checked` option
 * and the item renderer builds the mark as a DOM node, because a label built here reaches
 * `innerHTML` and throws under a CSP enforcing Trusted Types (DEV-2650). Kept, and not deprecated,
 * because this module ships with a declaration file next to it, so `moduleResolution: node`
 * resolves it whatever the package `exports` map says - a caller cannot be assumed not to exist.
 *
 * @param {string} label The label text.
 * @returns {string}
 */
export function markLabelAsSelected(label: string) {
  // workaround for https://github.com/handsontable/handsontable/issues/1946
  return `<span class="selected">${String.fromCharCode(10003)}</span>${label}`;
}
