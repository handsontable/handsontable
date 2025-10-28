import { DIALOG_CLASS_NAME } from '../constants';
import { stripTags } from '../../../helpers/string';

/**
 * The `confirmTemplate` function returns a HTML string with the confirm template.
 *
 * @param {object} vars The variables to use for the template.
 * @param {string} vars.title The title of the confirm.
 * @param {string} vars.description The description of the confirm.
 * @param {object[]} vars.buttons The buttons to display in the confirm.
 *   - `text`: The text of the button.
 *   - `type`: The type of the button ('primary' | 'secondary').
 *   - `callback`: The callback to trigger when the button is clicked.
 * @returns {string} HTML string with the confirm template.
 */
export function confirmTemplate({ title = '', description = '', buttons = [] }) {
  return `
    <div data-ref="contentElement" class="${DIALOG_CLASS_NAME}__content-wrapper-inner">
      <div class="${DIALOG_CLASS_NAME}__content">
        <h2 class="${DIALOG_CLASS_NAME}__title">${stripTags(title)}</h2>
        <p class="${DIALOG_CLASS_NAME}__description">${stripTags(description)}</p>
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

confirmTemplate.TEMPLATE_NAME = 'confirm';
