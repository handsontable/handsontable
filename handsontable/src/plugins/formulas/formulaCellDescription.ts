/**
 * The attribute that carries the text assistive technology reads after the value of a formula cell. The
 * stylesheet draws it as generated content (`td[data-ht-formula]::after`, `_cell-name-suffix.scss`, in the
 * `::after` it shares with the NestedRows level), which is part of the cell's accessible name and is not
 * part of its `textContent`, `innerText` or the copied text, and it is never drawn. Walkontable recycles cell
 * elements and resets their class and ARIA attributes, but not this one, so a paint always sets it or
 * removes it.
 */
export const DESCRIPTION_ATTRIBUTE = 'data-ht-formula';

/**
 * The most characters of a formula the description holds. The generated text is laid out on every paint and
 * read aloud on every move onto the cell, and both grow with its length: a live grid of 620 cells took about
 * 6 ms to render with 300-character formulas and about 16 ms with their description.
 */
export const MAX_FORMULA_TEXT_LENGTH = 120;

/**
 * Cuts a formula that is longer than {@link MAX_FORMULA_TEXT_LENGTH} and marks the cut with an ellipsis.
 *
 * @param {string} formula The formula text.
 * @returns {string}
 */
export function limitFormulaText(formula: string): string {
  if (formula.length <= MAX_FORMULA_TEXT_LENGTH) {
    return formula;
  }

  let end = MAX_FORMULA_TEXT_LENGTH;
  const lastCode = formula.charCodeAt(end - 1);

  // Do not leave the first half of a surrogate pair at the cut.
  if (lastCode >= 0xD800 && lastCode <= 0xDBFF) {
    end -= 1;
  }

  return `${formula.slice(0, end)}…`;
}

/**
 * Takes the description off a cell element.
 *
 * @param {HTMLTableCellElement} TD The cell element.
 */
export function undescribeFormulaCell(TD: HTMLTableCellElement): void {
  if (TD.hasAttribute(DESCRIPTION_ATTRIBUTE)) {
    TD.removeAttribute(DESCRIPTION_ATTRIBUTE);
  }
}

/**
 * Takes the description off every cell inside an element, the overlay clones included.
 *
 * @param {HTMLElement} container The grid's root element.
 */
export function undescribeFormulaCells(container: HTMLElement): void {
  container.querySelectorAll<HTMLTableCellElement>(`td[${DESCRIPTION_ATTRIBUTE}]`)
    .forEach(undescribeFormulaCell);
}

/**
 * Sets the description of a cell element. A description that is already there with the same text is not
 * written again, so a paint that changes nothing writes nothing.
 *
 * @param {HTMLTableCellElement} TD The cell element.
 * @param {string} text The text assistive technology reads after the cell's value.
 */
export function describeFormulaCell(TD: HTMLTableCellElement, text: string): void {
  if (TD.getAttribute(DESCRIPTION_ATTRIBUTE) !== text) {
    TD.setAttribute(DESCRIPTION_ATTRIBUTE, text);
  }
}
