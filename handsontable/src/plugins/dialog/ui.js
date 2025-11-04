import { html, toSingleLine } from '../../helpers/templateLiteralTag';
import { mixin } from '../../helpers/object';
import localHooks from '../../mixins/localHooks';
import {
  addClass,
  removeClass,
  hasClass,
  fastInnerHTML,
  setAttribute,
  removeAttribute,
} from '../../helpers/dom/element';
import {
  A11Y_DIALOG,
  A11Y_MODAL,
  A11Y_TABINDEX,
  A11Y_LABEL,
  A11Y_LABELED_BY,
  A11Y_DESCRIBED_BY,
  A11Y_ALERTDIALOG,
} from '../../helpers/a11y';
import { TEMPLATES } from './templates';
import { DIALOG_CLASS_NAME } from './constants';

const CONTAINER_TEMPLATE = `
<div data-ref="dialogElement" class="${DIALOG_CLASS_NAME}">
  <div data-ref="dialogWrapperElement" class="${DIALOG_CLASS_NAME}__content-wrapper">
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
  /**
   * Indicates if the UI is in RTL mode.
   *
   * @type {boolean}
   */
  #isRtl = false;
  /**
   * The template to use for the dialog.
   *
   * @type {function(): string}
   */
  #template = TEMPLATES.get('base');
  /**
   * The callbacks of the template buttons to trigger when the button is clicked.
   *
   * @type {Array<function(MouseEvent)>}
   */
  #templateButtonCallbacks = [];

  constructor({
    rootElement,
    isRtl,
  }) {
    this.#rootElement = rootElement;
    this.#isRtl = isRtl;

    this.install();
  }

  /**
   * Uses the specified template for the dialog.
   *
   * @param {string} templateName The name of the template to use.
   * @param {object} templateVars The variables to use for the template.
   */
  useTemplate(templateName, templateVars = {}) {
    if (!TEMPLATES.has(templateName) || templateName === 'base') {
      const validTemplates = Array.from(TEMPLATES.keys())
        .filter(template => template !== 'base')
        .join(', ');

      throw new Error(toSingleLine`Invalid template: ${templateName}.\x20
        Valid templates are: ${validTemplates}.`);
    }

    this.#template = TEMPLATES.get(templateName)(templateVars);
    this.#templateButtonCallbacks = (templateVars.buttons ?? []).map(button => button.callback);
  }

  /**
   * Uses the default template for the dialog for the `content` option.
   */
  useDefaultTemplate() {
    this.#template = TEMPLATES.get('base')();
    this.#templateButtonCallbacks = [];
  }

  /**
   * Creates the dialog UI elements and sets up the structure.
   */
  install() {
    if (this.#refs?.dialogElement) {
      return;
    }

    const elements = html`${CONTAINER_TEMPLATE}`;

    this.#refs = elements.refs;

    const { dialogElement } = this.#refs;

    // Set ARIA attributes
    setAttribute(dialogElement, [
      A11Y_MODAL(),
      ['dir', this.#isRtl ? 'rtl' : 'ltr'],
    ]);

    // Append to Handsontable after table grid element
    this.#rootElement.after(elements.fragment);
  }

  /**
   * Returns the dialog element.
   *
   * @returns {HTMLElement} The dialog element.
   */
  getContainer() {
    return this.#refs.dialogElement;
  }

  /**
   * Gets the focusable elements.
   *
   * @returns {HTMLElement[]} The focusable elements.
   */
  getFocusableElements() {
    return this.#template.focusableElements();
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
   * @param {boolean} options.animation - Whether to add the animation class to the dialog.
   * @param {object} options.a11y - The accessibility options for the dialog.
   *
   * @returns {DialogUI} The instance of the DialogUI.
   */
  updateDialog({
    isVisible,
    content,
    customClassName,
    background,
    contentBackground,
    animation,
    a11y,
  }) {
    const elements = this.#template.compile();
    const { dialogElement, dialogWrapperElement } = this.#refs;

    dialogWrapperElement.innerHTML = '';
    dialogWrapperElement.appendChild(elements.fragment);

    Object.assign(this.#refs, elements.refs);

    const { contentElement, buttonsContainer } = this.#refs;

    if (this.#template.TEMPLATE_NAME !== 'base') {
      Object.assign(a11y, this.#template.dialogA11YOptions());
    }

    // Dialog class name
    const customClass = customClassName ?
      ` ${customClassName}` : '';
    const backgroundClass = background ?
      ` ${DIALOG_CLASS_NAME}--background-${background}` : '';
    const animationClass = animation ?
      ` ${DIALOG_CLASS_NAME}--animation` : '';
    const showClass = isVisible ? ` ${DIALOG_CLASS_NAME}--show` : '';

    // Update dialog class name
    dialogElement.className = [
      DIALOG_CLASS_NAME,
      `${DIALOG_CLASS_NAME}--${this.#template.TEMPLATE_NAME}`,
      'handsontable',
      customClass,
      backgroundClass,
      animationClass,
      showClass
    ].join(' ');

    setAttribute(dialogElement, [
      this.#template.TEMPLATE_NAME === 'base' ? A11Y_TABINDEX(-1) : undefined,
    ]);

    // Dialog aria attributes
    setAttribute(dialogElement, [
      a11y.role === 'alertdialog' ? A11Y_ALERTDIALOG() : A11Y_DIALOG(),
    ]);

    if (a11y.ariaLabel && !a11y.ariaLabelledby) {
      setAttribute(dialogElement, [
        a11y.ariaLabel ? A11Y_LABEL(a11y.ariaLabel) : undefined,
      ]);
    } else {
      removeAttribute(dialogElement, 'aria-label');
    }

    if (a11y.ariaLabelledby) {
      setAttribute(dialogElement, [
        A11Y_LABELED_BY(a11y.ariaLabelledby),
      ]);
    } else {
      removeAttribute(dialogElement, 'aria-labelledby');
    }

    if (a11y.ariaDescribedby) {
      setAttribute(dialogElement, [
        A11Y_DESCRIBED_BY(a11y.ariaDescribedby),
      ]);
    } else {
      removeAttribute(dialogElement, 'aria-describedby');
    }

    // Dialog content class name
    const contentBackgroundClass = contentBackground ?
      ` ${DIALOG_CLASS_NAME}__content--background` : '';

    // Update content class name
    addClass(contentElement, `${DIALOG_CLASS_NAME}__content${contentBackgroundClass}`);

    if (this.#template.TEMPLATE_NAME === 'base') {
      // Clear existing dialog content
      contentElement.innerHTML = '';

      // Render new dialog content
      if (typeof content === 'string') {
        fastInnerHTML(contentElement, content);
      } else if (content instanceof HTMLElement || content instanceof DocumentFragment) {
        contentElement.appendChild(content);
      }

    } else if (buttonsContainer) {
      Array.from(buttonsContainer.children).forEach((button, index) => {
        const callback = this.#templateButtonCallbacks[index];

        if (callback) {
          button.addEventListener('click', callback);
        }
      });
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
   * Focuses the dialog element.
   */
  focusDialog() {
    this.#refs.dialogElement.focus();
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
