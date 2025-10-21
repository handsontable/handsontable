import { html } from '../../helpers/templateLiteralTag';
import { addClass, removeClass } from '../../helpers/dom/element';
import EventManager from '../../eventManager';

const EMPTY_DATA_STATE_CLASS_NAME = 'ht-empty-data-state';

const TEMPLATE = `<div data-ref="emptyDataStateElement" class="${EMPTY_DATA_STATE_CLASS_NAME} handsontable">
  <div class="${EMPTY_DATA_STATE_CLASS_NAME}__content-wrapper">
    <div data-ref="emptyDataStateInner" class="${EMPTY_DATA_STATE_CLASS_NAME}__content-wrapper-inner"></div>
  </div>
</div>`;

const templateContent = ({ title, description }) => `
  <div class="${EMPTY_DATA_STATE_CLASS_NAME}__content">
    ${title ? `<h2 class="${EMPTY_DATA_STATE_CLASS_NAME}__title">${title}</h2>` : ''}
    ${description ? `<p class="${EMPTY_DATA_STATE_CLASS_NAME}__description">${description}</p>` : ''}
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
  /**
   * Instance of EventManager.
   *
   * @type {EventManager}
   */
  #eventManager;

  /**
   * The placeholder element.
   *
   * @type {HTMLElement}
   */
  #placeholderElement;

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

    this.#eventManager = new EventManager(this);

    this.#eventManager.addEventListener(
      this.#refs.emptyDataStateElement,
      'wheel',
      event => this.#mouseWheelHandler(event),
    );

    this.#view.hot.rootGridElement.after(elements.fragment);
  }

  /**
   * Handles the mouse wheel event.
   *
   * @param {WheelEvent} event - The wheel event.
   */
  #mouseWheelHandler(event) {
    const deltaX = isNaN(event.deltaX) ? (-1) * event.wheelDeltaX : event.deltaX;

    this.#view._wt.wtTable.holder.scrollLeft += deltaX;
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
    const holder = this.#view._wt.wtTable.holder;
    const scrollbarHeight = holder.offsetHeight - holder.clientHeight;

    if (this.#view._wt.wtTable.hider.clientHeight > 1) {
      addClass(emptyDataStateElement, `${EMPTY_DATA_STATE_CLASS_NAME}--disable-top-border`);
    } else {
      removeClass(emptyDataStateElement, `${EMPTY_DATA_STATE_CLASS_NAME}--disable-top-border`);
    }

    if (scrollbarHeight > 0) {
      addClass(emptyDataStateElement, `${EMPTY_DATA_STATE_CLASS_NAME}--disable-bottom-border`);
    } else {
      removeClass(emptyDataStateElement, `${EMPTY_DATA_STATE_CLASS_NAME}--disable-bottom-border`);
    }
  }

  /**
   * Updates the size of the empty data state element.
   */
  updateSize() {
    const { emptyDataStateElement } = this.#refs;
    const isAutoRowSizeEnabled = this.#view.hot.getPlugin('autoRowSize')?.isEnabled();

    const holder = this.#view._wt.wtTable.holder;
    const hider = this.#view._wt.wtTable.hider;

    const additionalHeight = isAutoRowSizeEnabled ? 0 : 1;

    emptyDataStateElement.style.top = `${hider.clientHeight - additionalHeight}px`;

    if (hider.clientWidth > 1) {
      if (holder.clientWidth < hider.clientWidth) {
        emptyDataStateElement.style.maxWidth = `${holder.clientWidth}px`;
      } else {
        emptyDataStateElement.style.maxWidth = `${hider.clientWidth}px`;
      }
    }

    if (holder.clientHeight - hider.clientHeight < 1) {
      this.#placeholderElement = this.#view.hot.rootDocument.createElement('div');
      this.#placeholderElement.classList.add(`${EMPTY_DATA_STATE_CLASS_NAME}-placeholder`);

      this.#view._wt.wtTable.holder.appendChild(this.#placeholderElement);

      this.#placeholderElement.style.width = '100%';
      this.#placeholderElement.style.height = `${emptyDataStateElement.clientHeight - additionalHeight}px`;
    } else {
      emptyDataStateElement.style.height = `${holder.clientHeight - hider.clientHeight + additionalHeight}px`;
    }
  }

  /**
   * Removes the empty data state UI elements from the DOM and clears the refs.
   */
  destroy() {
    this.#eventManager.destroy();
    this.#eventManager = null;
    this.#refs?.emptyDataStateElement.remove();
    this.#placeholderElement.remove();
    this.#placeholderElement = null;
    this.#refs = null;
  }
}
