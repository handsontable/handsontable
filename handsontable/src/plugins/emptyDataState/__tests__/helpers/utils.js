/**
 * Returns the empty data state container element.
 *
 * @returns {HTMLElement}
 */
export function getEmptyDataStateContainerElement() {
  return hot().rootWrapperElement.querySelector('.ht-empty-data-state');
}

/**
 * Returns the empty data state content element.
 *
 * @returns {HTMLElement}
 */
export function getEmptyDataStateContentElement() {
  return getEmptyDataStateContainerElement().querySelector('.ht-empty-data-state__content-wrapper-inner');
}

/**
 * Returns the content (HTML string) of the dialog container element.
 *
 * @returns {string}
 */
export function getEmptyDataStateContentHTML() {
  return getEmptyDataStateContentElement()
    .innerHTML
    .replace(/\n/g, '')
    .trim();
}
