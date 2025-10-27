import { DIALOG_CLASS_NAME } from '../constants';

/**
 * The `alertTemplate` function returns a HTML string with the alert template.
 *
 * @param {object} vars The variables to use for the template.
 * @param {string} vars.title The title of the alert. Default: 'Alert'.
 * @param {string} vars.description The description of the alert. Default: ''.
 * @param {object[]} vars.buttons The buttons to display in the alert. Default: [{ text: 'OK', type: 'primary' }].
 *   - `text`: The text of the button. Default: 'OK'.
 *   - `type`: The type of the button ('primary' | 'secondary'). Default: 'primary'.
 *   - `callback`: The callback to trigger when the button is clicked. Default: `undefined`.
 * @returns {string} HTML string with the alert template.
 */
export function alertTemplate({ title = 'Alert', description = '', buttons = [{ text: 'OK', type: 'primary' }] }) {
  return `
    <div data-ref="contentElement" class="${DIALOG_CLASS_NAME}__content-wrapper-inner">
      <div class="${DIALOG_CLASS_NAME}__content">
        <h2 class="${DIALOG_CLASS_NAME}__title">${title}</h2>
        <p class="${DIALOG_CLASS_NAME}__description">${description}</p>
      </div>
      <div data-ref="buttonsContainer" class="${DIALOG_CLASS_NAME}__buttons">
        ${buttons.slice(0, 1).map(button => `
          <button class="ht-button ht-button--${button.type}">${button.text}</button>
        `).join('')}
      </div>
    </div>
  `;
}

alertTemplate.TEMPLATE_NAME = 'alert';
