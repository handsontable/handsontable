import { html } from '../../helpers/templateLiteralTag';

const EMPTY_DATA_STATE_CLASS_NAME = 'ht-empty-data-state';

const TEMPLATE = `<div data-ref="emptyDataStateElement" class="${EMPTY_DATA_STATE_CLASS_NAME}"></div>`;

/**
 * EmptyDataStateUI is a UI component that renders and manages empty data state elements.
 *
 * @private
 * @class EmptyDataStateUI
 */
export class EmptyDataStateUI {
  /**
   * The root element where the empty data state UI will be installed.
   *
   * @type {HTMLElement}
   */
  #rootElement;
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
    rootElement,
    view,
  }) {
    this.#rootElement = rootElement;
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

    const { emptyDataStateElement } = this.#refs;

    const wtOverlays = this.#view._wt.wtOverlays;
    const topOverlay = wtOverlays.topOverlay;
    const topCloneElement = topOverlay.clone.wtTable.wtRootElement;
    const topCloneHeight = topCloneElement ? topCloneElement.offsetHeight : 0;

    const startOverlay = wtOverlays.inlineStartOverlay;
    const startCloneElement = startOverlay.clone.wtTable.wtRootElement;
    const startCloneWidth = startCloneElement ? startCloneElement.offsetWidth : 0;

    const bottomOverlay = wtOverlays.bottomOverlay;
    const bottomCloneElement = bottomOverlay.clone.wtTable.wtRootElement;
    const bottomCloneHeight = bottomCloneElement ? bottomCloneElement.offsetHeight : 0;

    emptyDataStateElement.style.paddingTop = `${topCloneHeight}px`;
    emptyDataStateElement.style.paddingLeft = `${startCloneWidth}px`;
    emptyDataStateElement.style.paddingRight = `${startCloneWidth}px`;
    emptyDataStateElement.style.paddingBottom = `${bottomCloneHeight}px`;

    this.#view._wt.wtTable.holder.style.minHeight = `${topCloneHeight + bottomCloneHeight + 100}px`;
    this.#rootElement.appendChild(elements.fragment);
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
   * @param {string} content - The content to update.
   */
  updateContent(content) {
    const { emptyDataStateElement } = this.#refs;

    if (emptyDataStateElement) {
      emptyDataStateElement.innerHTML = content;
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
