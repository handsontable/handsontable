import { html } from '../../helpers/templateLiteralTag';
import { addClass, removeClass } from '../../helpers/dom/element';

const EMPTY_DATA_STATE_CLASS_NAME = 'ht-empty-data-state';

const TEMPLATE = `<div data-ref="emptyDataStateElement" class="${EMPTY_DATA_STATE_CLASS_NAME}">
  <div class="${EMPTY_DATA_STATE_CLASS_NAME}__content-wrapper">
    <div data-ref="emptyDataStateInner" class="${EMPTY_DATA_STATE_CLASS_NAME}__content-wrapper-inner"></div>
  </div>
</div>`;

const templateContent = ({ title, description }) => `
  <div class="${EMPTY_DATA_STATE_CLASS_NAME}__content">
    ${title ? `<h2 class="ht-empty-data-state__title">${title}</h2>` : ''}
    ${description ? `<p class="ht-empty-data-state__description">${description}</p>` : ''}
  </div>
`;

const TEMPLATE_ACTIONS = `<div data-ref="emptyDataStateActions" class="${EMPTY_DATA_STATE_CLASS_NAME}__actions"></div>`;

/**
 * EmptyDataStateUI is a UI component that renders and manages empty data state elements.
 *
 * @private
 * @class EmptyDataStateUI
 */
export class EmptyDataStateUI {
  /**
   * The view instance.
   *
   * @type {View}
   */
  #view;
  /**
   * The references to the UI elements.
   *
   * @type {object}
   */
  #refs;

  constructor({
    view,
  }) {
    this.#view = view;
  }

  /**
   * Creates the empty data state UI elements and sets up the structure.
   */
  create() {
    if (this.#refs?.emptyDataStateElement) {
      return;
    }

    const elements = html`${TEMPLATE}`;

    this.#refs = elements.refs;

    this.updateHeight();
    this.updateClassNames();

    this.#view._wt.wtTable.holder.appendChild(elements.fragment);
  }

  /**
   * Gets the empty data state element.
   *
   * @returns {HTMLElement} The empty data state element.
   */
  getElement() {
    return this.#refs?.emptyDataStateElement;
  }

  /**
   * Updates the content of the empty data state element.
   *
   * @param {string | object} message - The message to update.
   */
  updateContent(message) {
    const { emptyDataStateInner } = this.#refs;

    let content = '';

    if (typeof message === 'string') {
      content = {
        description: message,
      };
    } else {
      content = {
        title: message?.title,
        description: message?.description,
      };
    }

    if (content.title || content.description) {
      emptyDataStateInner.innerHTML = templateContent(content);
    } else {
      emptyDataStateInner.innerHTML = '';
    }

    if (message?.actions) {
      const actionsElement = html`${TEMPLATE_ACTIONS}`;
      const { emptyDataStateActions } = actionsElement.refs;

      message.actions.forEach((action) => {
        const button = this.#view.hot.rootDocument.createElement('button');

        button.classList.add('ht-button', `ht-button--${action.type}`);
        button.textContent = action.text;
        button.addEventListener('click', action.callback);

        emptyDataStateActions.appendChild(button);
      });

      emptyDataStateInner.appendChild(emptyDataStateActions);
    }
  }

  /**
   * Updates the class names of the empty data state element.
   */
  updateClassNames() {
    const { emptyDataStateElement } = this.#refs;

    if (this.#view._wt.wtTable.hider.clientHeight > 1) {
      addClass(emptyDataStateElement, 'ht-empty-data-state--disable-top-border');
    } else {
      removeClass(emptyDataStateElement, 'ht-empty-data-state--disable-top-border');
    }
  }

  /**
   * Updates the height of the empty data state element.
   */
  updateHeight() {
    const { emptyDataStateElement } = this.#refs;

    const hider = this.#view._wt.wtTable.hider;

    if (hider.clientWidth > 1) {
      emptyDataStateElement.style.maxWidth = `${hider.clientWidth}px`;
    }

    emptyDataStateElement.style.maxHeight = `calc(100% - ${hider.clientHeight}px)`;

    // Fix for 1px miscalculation issue when autoRowSize is disabled
    if (this.#view.hot.getPlugin('autoRowSize')?.isEnabled()) {
      emptyDataStateElement.style.marginTop = undefined;
    } else {
      emptyDataStateElement.style.marginTop = '-1px';
    }
  }

  /**
   * Removes the empty data state UI elements from the DOM and clears the refs.
   */
  destroy() {
    this.#view._wt.wtTable.holder.style.minHeight = undefined;
    this.#refs?.emptyDataStateElement.remove();
    this.#refs = null;
  }
}
