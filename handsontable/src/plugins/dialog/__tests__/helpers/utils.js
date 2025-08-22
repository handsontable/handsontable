/**
 * Returns the dialog container element.
 *
 * @returns {HTMLElement}
 */
export function getDialogContainerElement() {
  return hot().rootWrapperElement.querySelector('.ht-dialog');
}

/**
 * Returns the dialog content container element.
 *
 * @returns {HTMLElement}
 */
export function getDialogContentContainerElement() {
  return getDialogContainerElement().querySelector('.ht-dialog__content');
}

/**
 * Returns the content (HTML string) of the dialog container element.
 *
 * @returns {string}
 */
export function getDialogContentHTML() {
  return getDialogContentContainerElement()
    .innerHTML
    .replace(/\n/g, '')
    .trim();
}
