import { DIALOG_CLASS_NAME } from '../constants';
import { html } from '../../../helpers/templateLiteralTag';

/**
 * The `baseTemplate` function returns a HTML string with the base template.
 *
 * @returns {string} HTML string with the base template.
 */
export function baseTemplate() {
  /**
   * Returns the HTML string for the template.
   *
   * @returns {string}
   */
  function template() {
    return `
      <div data-ref="contentElement" class="${DIALOG_CLASS_NAME}__content"></div>
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

    return [];
  }

  return {
    TEMPLATE_NAME: 'base',
    dialogA11YOptions() {
      return {
        role: 'dialog',
      };
    },
    compile,
    focusableElements,
  };
}
