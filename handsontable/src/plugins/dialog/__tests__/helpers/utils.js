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
 * Returns the dialog inner wrapper element.
 *
 * @returns {HTMLElement}
 */
export function getDialogInnerWrapperElement() {
  return getDialogContainerElement().querySelector('.ht-dialog__content-wrapper-inner');
}

/**
 * Returns the dialog primary button element.
 *
 * @returns {HTMLElement}
 */
export function getDialogPrimaryButtonElement() {
  return getDialogContainerElement().querySelector('.ht-dialog__buttons .ht-button--primary');
}

/**
 * Returns the dialog secondary button element.
 *
 * @returns {HTMLElement}
 */
export function getDialogSecondaryButtonElement() {
  return getDialogContainerElement().querySelector('.ht-dialog__buttons .ht-button--secondary');
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

/**
 * Returns the first focus catcher element.
 *
 * @returns {HTMLElement}
 */
export function getDialogFirstFocusCatcherElement() {
  return getDialogContainerElement().querySelectorAll('.htFocusCatcher')[0];
}

/**
 * Returns the last focus catcher element.
 *
 * @returns {HTMLElement}
 */
export function getDialogLastFocusCatcherElement() {
  return getDialogContainerElement().querySelectorAll('.htFocusCatcher')[1];
}
