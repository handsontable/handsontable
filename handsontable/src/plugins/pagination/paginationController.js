/**
 * Creates a pagination controller instance.
 *
 * @param {HTMLElement[]} focusableElements The focusable elements.
 * @param {Document} rootDocument The root document.
 * @returns {PaginationController} The pagination controller instance.
 */
export function createPaginationController(focusableElements, rootDocument) {
  /**
   * Handles the click event on an element.
   *
   * @param {Function} callback The callback to handle the click event.
   * @returns {void}
   */
  function onElementClick(callback) {
    focusableElements.forEach((element) => {
      element.addEventListener('click', callback);
    });
  }

  /**
   * Focuses the next element.
   *
   * @returns {boolean} True if the element was focused, false otherwise.
   */
  function focusNextElement() {
    const { activeElement } = rootDocument;

    if (!activeElement) {
      return false;
    }

    const index = focusableElements.indexOf(activeElement);

    const nextElement = focusableElements
      .find((element, elementIndex) => elementIndex > index && !element.disabled);

    if (!nextElement) {
      return false;
    }

    nextElement.focus();

    return true;
  }

  /**
   * Focuses the previous element.
   *
   * @returns {boolean} True if the element was focused, false otherwise.
   */
  function focusPreviousElement() {
    const { activeElement } = rootDocument;

    if (!activeElement) {
      return false;
    }

    const index = focusableElements.indexOf(activeElement);

    const reversedIndex = focusableElements.length - 1 - index;
    const previousElement = focusableElements
      .toReversed()
      .find((element, elementIndex) => elementIndex > reversedIndex && !element.disabled);

    if (!previousElement) {
      return false;
    }

    previousElement.focus();

    return true;
  }

  /**
   * Focuses the first element.
   *
   * @returns {void}
   */
  function focusFirstElement() {
    const firstNonDisabledElement = focusableElements.find(element => !element.disabled);

    if (firstNonDisabledElement) {
      firstNonDisabledElement.focus();
    }
  }

  /**
   * Focuses the last element.
   *
   * @returns {void}
   */
  function focusLastElement() {
    const lastNonDisabledElement = focusableElements.toReversed().find(element => !element.disabled);

    if (lastNonDisabledElement) {
      lastNonDisabledElement.focus();
    }
  }

  return {
    onElementClick,
    focusNextElement,
    focusPreviousElement,
    focusFirstElement,
    focusLastElement,
  };
}

