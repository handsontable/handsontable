import { html } from '../../helpers/templateLiteralTag';
import { mixin } from '../../helpers/object';
import localHooks from '../../mixins/localHooks';
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
   * Updates the dialog class name based on current configuration.
   *
   * @param {string} customClassName - The custom class name to add to the dialog.
   * @param {string} background - The background to add to the dialog.
   * @param {boolean} animation - Whether to add the animation class to the dialog.
   * @param {boolean} isVisible - Whether the dialog is visible.
   *
   * @returns {DialogUI} The instance of the DialogUI for method chaining.
   */
  updateDialogClassName(customClassName, background, animation, isVisible) {
    const customClass = customClassName ?
      ` ${customClassName}` : '';
    const backgroundClass = background ?
      ` ${DIALOG_CLASS_NAME}--background-${background}` : '';
    const animationClass = animation ?
      ` ${DIALOG_CLASS_NAME}--animation` : '';
    const showClass = isVisible ? ` ${DIALOG_CLASS_NAME}--show` : '';

    this.#refs.dialogElement.className =
      `${DIALOG_CLASS_NAME}${customClass}${backgroundClass}${animationClass}${showClass}`;

    return this;
  }

  /**
   * Updates the dialog content and styling.
   *
   * @param {object} options - Content update options.
   * @param {string|HTMLElement} options.content - The content to render in the dialog.
   * @param {string} options.contentDirections - The flex direction for content layout.
   * @param {boolean} options.contentBackground - Whether to show content background.
   * @returns {DialogUI} The instance of the DialogUI for method chaining.
   */
  updateDialogContent({ content, contentDirections, contentBackground }) {
    // Clear existing content
    this.#refs.contentElement.innerHTML = '';

    // Render new content
    if (typeof content === 'string') {
      fastInnerHTML(this.#refs.contentElement, content);
    } else if (content instanceof HTMLElement) {
      this.#refs.contentElement.appendChild(content);
    }

    const contentBackgroundClass = contentBackground ?
      ` ${DIALOG_CLASS_NAME}__content--background` : '';
    const contentDirectionsClass = contentDirections ?
      ` ${DIALOG_CLASS_NAME}__content--flex-${contentDirections}` : '';

    this.#refs.contentElement.className =
      `${DIALOG_CLASS_NAME}__content${contentBackgroundClass}${contentDirectionsClass}`;

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
    if (this.#refs.dialogElement && this.#refs.dialogElement.parentNode) {
      this.#refs.dialogElement.parentNode.removeChild(this.#refs.dialogElement);
    }

    this.#refs = null;
  }
}

mixin(DialogUI, localHooks);
