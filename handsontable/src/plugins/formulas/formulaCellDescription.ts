/**
 * The attribute that carries the text assistive technology reads after the value of a formula cell. The
 * stylesheet draws it as generated content (`td[data-ht-formula]::after`, `_formulas.scss`), which is part
 * of the cell's accessible name and is not part of its `textContent`, `innerText` or the copied text, and
 * it is never drawn. Walkontable recycles cell elements and resets their class and ARIA attributes, but not
 * this one, so a paint always sets it or removes it.
 */
export const DESCRIPTION_ATTRIBUTE = 'data-ht-formula';

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
