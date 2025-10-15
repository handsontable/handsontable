import { html } from '../../helpers/templateLiteralTag';
import { addClass, removeClass } from '../../helpers/dom/element';

const EMPTY_DATA_STATE_CLASS_NAME = 'ht-empty-data-state';

const TEMPLATE = `<div data-ref="emptyDataStateElement" class="${EMPTY_DATA_STATE_CLASS_NAME}">
  <div class="${EMPTY_DATA_STATE_CLASS_NAME}__content-wrapper">
    <div class="${EMPTY_DATA_STATE_CLASS_NAME}__content-wrapper-inner">
      <div data-ref="emptyDataStateContent" class="${EMPTY_DATA_STATE_CLASS_NAME}__content"></div>
      <div data-ref="emptyDataStateActions" class="${EMPTY_DATA_STATE_CLASS_NAME}__actions"></div>
    </div>
  </div>
</div>`;

const templateContent = ({ title, description }) => `
  ${title ? `<h2 class="ht-empty-data-state__title">${title}</h2>` : ''}
  ${description ? `<p class="ht-empty-data-state__description">${description}</p>` : ''}
`;

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
    const { emptyDataStateContent, emptyDataStateActions } = this.#refs;

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

    emptyDataStateContent.innerHTML = templateContent(content);
    emptyDataStateActions.innerHTML = '';

    if (message?.actions) {
      message?.actions.forEach((action) => {
        const button = this.#view.hot.rootDocument.createElement('button');

        button.classList.add('ht-button', `ht-button__${action.type}`);
        button.textContent = action.text;
        button.addEventListener('click', action.callback);

        emptyDataStateActions.appendChild(button);
      });
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

    const wtOverlays = this.#view._wt.wtOverlays;

    const topOverlay = wtOverlays.topOverlay;
    const topCloneElement = topOverlay.clone.wtTable.wtRootElement;
    const topCloneHeight = topCloneElement ? topCloneElement.offsetHeight : 0;

    if (this.#view._wt.wtTable.hider.clientWidth > 1) {
      emptyDataStateElement.style.maxWidth = `${this.#view._wt.wtTable.hider.clientWidth}px`;
    }

    emptyDataStateElement.style.maxHeight = `calc(100% - ${topCloneHeight + 1}px)`;
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
