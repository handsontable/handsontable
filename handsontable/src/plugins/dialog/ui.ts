import { html, toSingleLine } from '../../helpers/templateLiteralTag';
import { throwWithCause } from '../../helpers/errors';
import { mixin } from '../../helpers/object';
import localHooks from '../../mixins/localHooks';
import {
  addClass,
  removeClass,
  hasClass,
  fastInnerHTML,
  isHTMLElement,
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

/**
 * Represents the compiled template object returned by template factory functions.
 */
export interface DialogTemplateResult {
  TEMPLATE_NAME: string;
  dialogA11YOptions(): Record<string, string | undefined>;
  compile(): { fragment: DocumentFragment; refs: Record<string, HTMLElement> };
  focusableElements(): HTMLElement[];
}

/**
 * Dialog accessibility settings.
 */
interface DialogA11ySettings {
  role?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
}

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
   * The overlay container where the dialog UI will be installed.
   *
   * @type {HTMLElement}
   */
  #overlayContainer: HTMLElement;
  /**
   * The references to the UI elements.
   *
   * @type {object}
   */
  #refs: Record<string, HTMLElement> | undefined;
  /**
   * Indicates if the UI is in RTL mode.
   *
   * @type {boolean}
   */
  #isRtl = false;
  /**
   * Indicates if the animation has started.
   *
   * @type {boolean}
   */
  #animationStarted = false;
  /**
   * The template to use for the dialog.
   *
   * @type {function(): string}
   */
  #template: DialogTemplateResult = TEMPLATES.get('base')!() as DialogTemplateResult;
  /**
   * The callbacks of the template buttons to trigger when the button is clicked.
   *
   * @type {Array<function(MouseEvent)>}
   */
  #templateButtonCallbacks: EventListener[] = [];
  /**
   * Optional sanitizer for dialog content (from settings).
   */
  #sanitizer?: (html: string) => string | undefined;

  /**
   * Initializes the dialog UI with an overlay container, RTL layout flag, and an optional HTML sanitizer, then installs the DOM structure.
   */
  constructor({ overlayContainer, isRtl, sanitizer }: {
    overlayContainer: HTMLElement; isRtl: boolean; sanitizer?: (html: string) => string | undefined;
  }) {
    this.#overlayContainer = overlayContainer;
    this.#isRtl = isRtl;
    this.#sanitizer = sanitizer;

    this.install();
  }

  /**
   * Uses the specified template for the dialog.
   *
   * @param {string} templateName The name of the template to use.
   * @param {object} templateVars The variables to use for the template.
   */
  useTemplate(templateName: string, templateVars: Record<string, unknown> = {}) {
    if (!TEMPLATES.has(templateName) || templateName === 'base') {
      const validTemplates = Array.from(TEMPLATES.keys())
        .filter(template => template !== 'base')
        .join(', ');

      throwWithCause(toSingleLine`Invalid template: ${templateName}.\x20
        Valid templates are: ${validTemplates}.`);
    }

    this.#template = TEMPLATES.get(templateName)!(templateVars);
    this.#templateButtonCallbacks = ((templateVars.buttons ?? []) as Array<Record<string, unknown>>)
      .map(button => button.callback as EventListener);
  }

  /**
   * Uses the default template for the dialog for the `content` option.
   */
  useDefaultTemplate() {
    this.#template = TEMPLATES.get('base')!();
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

    const { dialogElement } = this.#refs!;

    // Set ARIA attributes
    setAttribute(dialogElement, [
      A11Y_MODAL(),
      ['dir', this.#isRtl ? 'rtl' : 'ltr'],
    ]);

    dialogElement.addEventListener('transitionstart', () => this.#onTransitionStart());
    dialogElement.addEventListener('transitionend', () => this.#onTransitionEnd());

    if (this.#overlayContainer) {
      this.#overlayContainer.appendChild(elements.fragment);
    }
  }

  /**
   * Returns the dialog element.
   *
   * @returns {HTMLElement} The dialog element.
   */
  getContainer() {
    return this.#refs!.dialogElement;
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
    isVisible, content, customClassName, background, contentBackground, animation, a11y
  }: Record<string, unknown>) {
    const elements = this.#template.compile();
    const { dialogElement, dialogWrapperElement } = this.#refs!;
    const typedA11y = a11y as DialogA11ySettings;

    dialogWrapperElement.innerHTML = '';
    dialogWrapperElement.appendChild(elements.fragment);

    Object.assign(this.#refs!, elements.refs);

    const { contentElement, buttonsContainer } = this.#refs!;

    if (this.#template.TEMPLATE_NAME !== 'base') {
      Object.assign(typedA11y, this.#template.dialogA11YOptions());
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

    if (this.#template.TEMPLATE_NAME === 'base') {
      setAttribute(dialogElement, [A11Y_TABINDEX(-1)]);
    }

    // Dialog aria attributes
    setAttribute(dialogElement, [
      typedA11y.role === 'alertdialog' ? A11Y_ALERTDIALOG() : A11Y_DIALOG(),
    ]);

    if (typedA11y.ariaLabel && !typedA11y.ariaLabelledby) {
      setAttribute(dialogElement, [
        A11Y_LABEL(typedA11y.ariaLabel),
      ]);
    } else {
      removeAttribute(dialogElement, 'aria-label');
    }

    if (typedA11y.ariaLabelledby) {
      setAttribute(dialogElement, [
        A11Y_LABELED_BY(typedA11y.ariaLabelledby),
      ]);
    } else {
      removeAttribute(dialogElement, 'aria-labelledby');
    }

    if (typedA11y.ariaDescribedby) {
      setAttribute(dialogElement, [
        A11Y_DESCRIBED_BY(typedA11y.ariaDescribedby),
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
        fastInnerHTML(contentElement, content,
          this.#sanitizer ? (html: string, ctx: string) => this.#sanitizer!(html) ?? html : undefined,
          'dialog');

      } else if (isHTMLElement(content) || content instanceof DocumentFragment) {
        contentElement.appendChild(content);
      }

    } else if (buttonsContainer) {
      Array.from(buttonsContainer.children).forEach((button, index) => {
        const callback = this.#templateButtonCallbacks[index];

        if (callback) {
          button.addEventListener('click', callback as EventListener);
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
  showDialog(animation: boolean) {
    const { dialogElement } = this.#refs!;

    dialogElement.style.display = 'block';

    if (animation) {
      // Triggers style and layout recalculation, so the display: block is fully committed before adding
      // the class ht-dialog--show.
      // eslint-disable-next-line no-unused-expressions
      dialogElement.offsetHeight;
    }

    addClass(dialogElement, `${DIALOG_CLASS_NAME}--show`);
    this.#animationStarted = false;

    return this;
  }

  /**
   * Hides the dialog with optional animation.
   *
   * @param {boolean} animation - Whether to add the animation class to the dialog.
   * @returns {DialogUI} The instance of the DialogUI.
   */
  hideDialog(animation: boolean) {
    const { dialogElement } = this.#refs!;

    removeClass(dialogElement, `${DIALOG_CLASS_NAME}--show`);

    if ((animation && !this.#animationStarted) || !animation) {
      dialogElement.style.display = 'none';
    }

    this.#animationStarted = false;

    return this;
  }

  /**
   * Focuses the dialog element.
   */
  focusDialog() {
    this.#refs!.dialogElement.focus();
  }

  /**
   * Updates the width of the dialog container to the same size as the table.
   *
   * @param {number} width - The width of the table.
   * @returns {DialogUI} The instance of the DialogUI.
   */
  updateWidth(width: number) {
    this.#refs!.dialogElement.style.width = `${width}px`;

    return this;
  }

  /**
   * Removes the dialog UI elements from the DOM and clears the refs.
   */
  destroyDialog() {
    this.#refs?.dialogElement.remove();
    this.#refs = undefined;
  }

  /**
   * Handles the transition end event.
   */
  #onTransitionEnd() {
    const { dialogElement } = this.#refs!;

    if (!hasClass(dialogElement, `${DIALOG_CLASS_NAME}--show`)) {
      dialogElement.style.display = 'none';
    }
  }

  /**
   * Handles the transition start event. This is used to track if the animation has started.
   */
  #onTransitionStart() {
    this.#animationStarted = true;
  }
}

mixin(DialogUI, localHooks);
