/**
 * Retrieves checkbox element from the item element.
 *
 * @param {HTMLLIElement} itemElement
 * @returns {HTMLInputElement|null}
 */
export function getCheckboxElement(itemElement) {
  return itemElement.querySelector('input[type="checkbox"]');
}
