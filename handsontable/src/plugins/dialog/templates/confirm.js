import { DIALOG_CLASS_NAME } from '../constants';
import { stripTags } from '../../../helpers/string';
import { html } from '../../../helpers/templateLiteralTag';

/**
 * The `confirmTemplate` function returns a HTML string with the confirm template.
 *
 * @param {object} vars The variables to use for the template.
 * @param {string} vars.id The ID of the confirm.
 * @param {string} vars.title The title of the confirm.
 * @param {string} vars.description The description of the confirm.
 * @param {object[]} vars.buttons The buttons to display in the confirm.
 *   - `text`: The text of the button.
 *   - `type`: The type of the button ('primary' | 'secondary').
 *   - `callback`: The callback to trigger when the button is clicked.
 * @returns {string} HTML string with the confirm template.
 */
export function confirmTemplate({ id = '', title = '', description = '', buttons = [] }) {
  /**
   * Returns the HTML string for the template.
   *
   * @returns {string}
   */
  function template() {
    return `
      <div tabindex="-1" data-ref="contentElement" class="${DIALOG_CLASS_NAME}__content-wrapper-inner">
        <div class="${DIALOG_CLASS_NAME}__content">
          <h2
            id="${id}-dialog-confirm-title"
            class="${DIALOG_CLASS_NAME}__title">${stripTags(title)}</h2>
          <p
            id="${id}-dialog-confirm-description"
            class="${DIALOG_CLASS_NAME}__description">${stripTags(description)}</p>
        </div>
        ${buttons.length > 0 ? `
          <div data-ref="buttonsContainer" class="${DIALOG_CLASS_NAME}__buttons">
            ${buttons.map(button => `
              <button class="ht-button ht-button--${button.type}">${stripTags(button.text)}</button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  let fragment = null;
  const refs = {};

  /**
   * Compiles the template.
   *
   * @returns {object} The compiled template.
   */
  function compile() {
    const elements = html`${template()}`;

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
      throw new Error('Compile the template first.');
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
