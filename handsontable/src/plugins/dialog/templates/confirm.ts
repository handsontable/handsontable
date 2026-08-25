import { DIALOG_CLASS_NAME } from '../constants';
import { throwWithCause } from '../../../helpers/errors';
import { htmlToPlainText } from '../../../helpers/string';
import { buildTemplate, type TemplateSpec } from '../../../helpers/dom/template';

/**
 * The `confirmTemplate` function returns the confirm dialog template.
 *
 * @param {object} vars The variables to use for the template.
 * @param {string} vars.id The ID of the confirm.
 * @param {string} vars.title The title of the confirm.
 * @param {string} vars.description The description of the confirm.
 * @param {object[]} vars.buttons The buttons to display in the confirm.
 *   - `text`: The text of the button.
 *   - `type`: The type of the button ('primary' | 'secondary').
 *   - `callback`: The callback to trigger when the button is clicked.
 * @returns {object} The template.
 */
export function confirmTemplate({ id = '', title = '', description = '', buttons = [] }: {
  id?: string, title?: string, description?: string,
  buttons?: Array<{ type: string, text: string, callback?: Function }>
}) {
  /**
   * Button types the `buttons` option documents. A value outside this set is not rendered as a
   * class name: it used to be interpolated straight into `class="ht-button ht-button--..."`,
   * where a quote in the value escaped the attribute. Building the DOM removes the escape
   * route, and validating here keeps a stray value from producing a junk class as well.
   */
  const BUTTON_TYPES = ['primary', 'secondary'];

  /**
   * Returns the template spec.
   *
   * @returns {TemplateSpec} The template.
   */
  function template(): TemplateSpec {
    return {
      tag: 'div',
      ref: 'contentElement',
      className: `${DIALOG_CLASS_NAME}__content-wrapper-inner`,
      attrs: { tabindex: '-1' },
      children: [
        {
          tag: 'div',
          className: `${DIALOG_CLASS_NAME}__content`,
          children: [
            {
              tag: 'h2',
              className: `${DIALOG_CLASS_NAME}__title`,
              attrs: { id: `${id}-dialog-confirm-title` },
              text: htmlToPlainText(title),
            },
            {
              tag: 'p',
              className: `${DIALOG_CLASS_NAME}__description`,
              attrs: { id: `${id}-dialog-confirm-description` },
              text: htmlToPlainText(description),
            },
          ],
        },
        buttons.length > 0 && {
          tag: 'div',
          ref: 'buttonsContainer',
          className: `${DIALOG_CLASS_NAME}__buttons`,
          children: buttons.map(button => ({
            tag: 'button',
            className: `ht-button ht-button--${BUTTON_TYPES.includes(button.type) ? button.type : 'secondary'}`,
            text: htmlToPlainText(button.text),
          })),
        },
      ],
    };
  }

  let fragment: DocumentFragment | null = null;
  const refs: Record<string, HTMLElement> = {};

  /**
   * Compiles the template.
   *
   * @param {Document} rootDocument The document to build the nodes in.
   * @returns {object} The compiled template.
   */
  function compile(rootDocument: Document) {
    const elements = buildTemplate(template(), rootDocument);

    Object.assign(refs, elements.refs);
    fragment = elements.fragment;

    return elements;
  }

  /**
   * Gets the focusable elements of the template.
   *
   * @returns {HTMLElement[]} The focusable elements.
   */
  function focusableElements() {
    if (fragment === null) {
      throwWithCause('Compile the template first.');
    }

    const {
      contentElement,
      buttonsContainer,
    } = refs;

    const elements = [];

    if (buttonsContainer) {
      elements.push(...Array.from(buttonsContainer.children));
    } else {
      elements.push(contentElement);
    }

    return elements;
  }

  return {
    TEMPLATE_NAME: 'confirm',
    dialogA11YOptions() {
      return {
        role: 'alertdialog',
        ariaLabelledby: `${id}-dialog-confirm-title`,
        ariaDescribedby: description ? `${id}-dialog-confirm-description` : undefined,
      };
    },
    compile,
    focusableElements,
  };
}
