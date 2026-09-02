import { DIALOG_CLASS_NAME } from '../constants';
import { throwWithCause } from '../../../helpers/errors';
import { buildTemplate } from '../../../helpers/dom/template';

/**
 * The `baseTemplate` function returns the base dialog template.
 *
 * @returns {object} The template.
 */
export function baseTemplate() {

  let fragment: DocumentFragment | null = null;
  const refs = {};

  /**
   * Compiles the template.
   *
   * @param {Document} rootDocument The document to build the nodes in.
   * @returns {object} The compiled template.
   */
  function compile(rootDocument: Document) {
    const elements = buildTemplate(
      { tag: 'div', ref: 'contentElement', className: `${DIALOG_CLASS_NAME}__content` }, rootDocument
    );

    Object.assign(refs, elements.refs);
    fragment = elements.fragment;

    return elements;
  }

  /**
   * Gets the focusable elements of the template.
   *
   * @returns {HTMLElement[]} The focusable elements.
   */
  function focusableElements(): HTMLElement[] {
    if (fragment === null) {
      throwWithCause('Compile the template first.');
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
