import { html } from '../../helpers/templateLiteralTag';
import {
  addClass,
  removeClass,
  hasClass,
  fastInnerHTML,
  setAttribute,
} from '../../helpers/dom/element';
import { A11Y_DIALOG, A11Y_MODAL } from '../../helpers/a11y';

const DIALOG_CLASS_NAME = 'ht-dialog';

const TEMPLATE = `
<div data-ref="dialogElement" class="${DIALOG_CLASS_NAME}">
  <input type="text" name="dialog-input-focus-catcher" data-ref="inputFocusCatcher" 
    class="${DIALOG_CLASS_NAME}__input-focus-catcher"/>
  <div data-ref="contentWrapperElement" class="${DIALOG_CLASS_NAME}__content-wrapper">
    <div data-ref="contentElement" class="${DIALOG_CLASS_NAME}__content"></div>
  </div>
</div>
`;

/**
 * DialogUI is a UI component that renders and manages dialog elements.
 * It handles dialog creation, content updates, visibility toggling, and styling.
 *
 * @private
 * @class DialogUI
 */
export class DialogUI {
  /**
   * The root element where the dialog UI will be installed.
   *
   * @type {HTMLElement}
   */
  #rootElement;
  /**
   * The references to the UI elements.
   *
   * @type {object}
   */
  #refs;

  constructor({
    rootElement,
  }) {
    this.#rootElement = rootElement;

    this.install();
  }

  /**
   * Creates the dialog UI elements and sets up the structure.
   */
  install() {
    if (this.#refs?.dialogElement) {
      return;
    }

    const elements = html`${TEMPLATE}`;

    this.#refs = elements.refs;

    // Set ARIA attributes
    setAttribute(this.#refs.dialogElement, [
      A11Y_DIALOG(),
      A11Y_MODAL(),
    ]);

    // Append to Handsontable root wrapper
    this.#rootElement.appendChild(elements.fragment);
  }

  /**
   * Focuses the input element.
   */
  focusInput() {
    this.#refs.inputFocusCatcher.focus();
  }

  /**
   * Updates the dialog class name based on current configuration.
   *
   * @param {object} options - Class name update options.
   * @param {boolean} options.isVisible - Whether the dialog is visible.
   * @param {string|HTMLElement} options.content - The content to render in the dialog.
   * @param {string} options.customClassName - The custom class name to add to the dialog.
   * @param {string} options.background - The background to add to the dialog.
   * @param {boolean} options.contentBackground - Whether to show content background.
   * @param {string} options.contentDirections - The flex direction for content layout.
   * @param {boolean} options.animation - Whether to add the animation class to the dialog.
   *
   * @returns {DialogUI} The instance of the DialogUI for method chaining.
   */
  updateDialog({
    isVisible,
    content,
    customClassName,
    background,
    contentBackground,
    contentDirections,
    animation,
  }) {
    // Dialog class name
    const customClass = customClassName ?
      ` ${customClassName}` : '';
    const backgroundClass = background ?
      ` ${DIALOG_CLASS_NAME}--background-${background}` : '';
    const animationClass = animation ?
      ` ${DIALOG_CLASS_NAME}--animation` : '';
    const showClass = isVisible ? ` ${DIALOG_CLASS_NAME}--show` : '';

    // Update dialog class name
    this.#refs.dialogElement.className =
      `${DIALOG_CLASS_NAME}${customClass}${backgroundClass}${animationClass}${showClass}`;

    // Dialog content class name
    const contentBackgroundClass = contentBackground ?
      ` ${DIALOG_CLASS_NAME}__content--background` : '';
    const contentDirectionsClass = contentDirections ?
      ` ${DIALOG_CLASS_NAME}__content--flex-${contentDirections}` : '';

    // Update content class name
    this.#refs.contentElement.className =
      `${DIALOG_CLASS_NAME}__content${contentBackgroundClass}${contentDirectionsClass}`;

    // Clear existing dialog content
    this.#refs.contentElement.innerHTML = '';

    // Render new dialog content
    if (typeof content === 'string') {
      fastInnerHTML(this.#refs.contentElement, content);
    } else if (content instanceof HTMLElement || content instanceof DocumentFragment) {
      this.#refs.contentElement.appendChild(content);
    }

    return this;
  }

  /**
   * Shows the dialog with optional animation.
   *
   * @param {boolean} animation - Whether to add the animation class to the dialog.
   * @returns {DialogUI} The instance of the DialogUI for method chaining.
   */
  showDialog(animation) {
    this.#refs.dialogElement.style.display = 'block';

    if (animation) {
      // Triggers style and layout recalculation, so the display: block is fully committed before adding
      // the class ht-dialog--show.
      // eslint-disable-next-line no-unused-expressions
      this.#refs.dialogElement.offsetHeight;
    }

    addClass(this.#refs.dialogElement, `${DIALOG_CLASS_NAME}--show`);
    this.focusInput();

    return this;
  }

  /**
   * Hides the dialog with optional animation.
   *
   * @param {boolean} animation - Whether to add the animation class to the dialog.
   * @returns {DialogUI} The instance of the DialogUI for method chaining.
   */
  hideDialog(animation) {
    removeClass(this.#refs.dialogElement, `${DIALOG_CLASS_NAME}--show`);

    if (animation) {
      this.#refs.dialogElement.addEventListener('transitionend', () => {
        if (!hasClass(this.#refs.dialogElement, `${DIALOG_CLASS_NAME}--show`)) {
          this.#refs.dialogElement.style.display = 'none';
        }
      }, { once: true });
    } else {
      this.#refs.dialogElement.style.display = 'none';
    }

    return this;
  }

  /**
   * Removes the dialog UI elements from the DOM and clears the refs.
   */
  destroyDialog() {
    this.#refs?.dialogElement.remove();
    this.#refs = null;
  }
}
