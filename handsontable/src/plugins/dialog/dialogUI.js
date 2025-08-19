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

    const { dialogElement } = this.#refs;

    dialogElement.addEventListener('click', () => this.runLocalHooks('clickDialogElement'));

    // Set ARIA attributes
    setAttribute(dialogElement, [
      A11Y_DIALOG(),
      A11Y_MODAL(),
    ]);

    // Append to Handsontable after table grid element
    this.#rootElement.after(elements.fragment);
  }

  /**
   * Returns the dialog element.
   *
   * @returns {HTMLElement} The dialog element.
   */
  getDialogElement() {
    return this.#refs.dialogElement;
  }

  /**
   * Checks if the given element is inside the dialog.
   *
   * @param {HTMLElement} element - The element to check.
   * @returns {boolean} Returns `true` if the element is inside the dialog, `false` otherwise.
   */
  isInsideDialog(element) {
    return this.#refs.dialogElement.contains(element);
  }

  /**
   * Updates the dialog content and class name.
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
   * @returns {DialogUI} The instance of the DialogUI.
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
    const { dialogElement, contentElement } = this.#refs;

    // Dialog class name
    const customClass = customClassName ?
      ` ${customClassName}` : '';
    const backgroundClass = background ?
      ` ${DIALOG_CLASS_NAME}--background-${background}` : '';
    const animationClass = animation ?
      ` ${DIALOG_CLASS_NAME}--animation` : '';
    const showClass = isVisible ? ` ${DIALOG_CLASS_NAME}--show` : '';

    // Update dialog class name
    dialogElement.className =
      `${DIALOG_CLASS_NAME}${customClass}${backgroundClass}${animationClass}${showClass}`;

    // Dialog content class name
    const contentBackgroundClass = contentBackground ?
      ` ${DIALOG_CLASS_NAME}__content--background` : '';
    const contentDirectionsClass = contentDirections ?
      ` ${DIALOG_CLASS_NAME}__content--flex-${contentDirections}` : '';

    // Update content class name
    contentElement.className =
      `${DIALOG_CLASS_NAME}__content${contentBackgroundClass}${contentDirectionsClass}`;

    // Clear existing dialog content
    contentElement.innerHTML = '';

    // Render new dialog content
    if (typeof content === 'string') {
      fastInnerHTML(contentElement, content);
    } else if (content instanceof HTMLElement || content instanceof DocumentFragment) {
      contentElement.appendChild(content);
    }

    return this;
  }

  /**
   * Shows the dialog with optional animation.
   *
   * @param {boolean} animation - Whether to add the animation class to the dialog.
   * @returns {DialogUI} The instance of the DialogUI.
   */
  showDialog(animation) {
    const { dialogElement } = this.#refs;

    dialogElement.style.display = 'block';

    if (animation) {
      // Triggers style and layout recalculation, so the display: block is fully committed before adding
      // the class ht-dialog--show.
      // eslint-disable-next-line no-unused-expressions
      dialogElement.offsetHeight;
    }

    addClass(dialogElement, `${DIALOG_CLASS_NAME}--show`);

    return this;
  }

  /**
   * Hides the dialog with optional animation.
   *
   * @param {boolean} animation - Whether to add the animation class to the dialog.
   * @returns {DialogUI} The instance of the DialogUI.
   */
  hideDialog(animation) {
    const { dialogElement } = this.#refs;

    removeClass(dialogElement, `${DIALOG_CLASS_NAME}--show`);

    if (animation) {
      dialogElement.addEventListener('transitionend', () => {
        if (!hasClass(dialogElement, `${DIALOG_CLASS_NAME}--show`)) {
          dialogElement.style.display = 'none';
        }
      }, { once: true });
    } else {
      dialogElement.style.display = 'none';
    }

    return this;
  }

  /**
   * Updates the width of the dialog container to the same size as the table.
   *
   * @param {number} width - The width of the table.
   * @returns {DialogUI} The instance of the DialogUI.
   */
  updateWidth(width) {
    this.#refs.dialogElement.style.width = `${width}px`;

    return this;
  }

  /**
   * Updates the height of the dialog container.
   *
   * @param {number} licenseInfoHeight - The height of the license info.
   * @returns {DialogUI} The instance of the DialogUI.
   */
  updateHeight(licenseInfoHeight) {
    this.#refs.dialogElement.style.height = `calc(100% - ${licenseInfoHeight}px)`;

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

mixin(DialogUI, localHooks);
