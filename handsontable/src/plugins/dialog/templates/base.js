import { DIALOG_CLASS_NAME } from '../constants';

/**
 * The `baseTemplate` function returns a HTML string with the base template.
 *
 * @returns {string} HTML string with the base template.
 */
export function baseTemplate() {
  return `
    <div data-ref="contentElement" class="${DIALOG_CLASS_NAME}__content"></div>
  `;
}

baseTemplate.TEMPLATE_NAME = 'base';
