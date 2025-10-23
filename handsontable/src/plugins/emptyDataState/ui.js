import { html } from '../../helpers/templateLiteralTag';
import { addClass, removeClass } from '../../helpers/dom/element';

const EMPTY_DATA_STATE_CLASS_NAME = 'ht-empty-data-state';
const MIN_HEIGHT = 200;

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
   * The root element where the emptyDataState UI will be installed.
   *
   * @type {HTMLElement}
   */
  #rootElement;
  /**
   * The root document where the emptyDataState UI will be installed.
   *
   * @type {Document}
   */
  #rootDocument;
  /**
   * The references to the UI elements.
   *
   * @type {object}
   */
  #refs;
  /**
   * The placeholder element.
   *
   * @type {HTMLElement}
   */
  #placeholderElement;

  constructor({
    rootElement,
    rootDocument,
  }) {
    this.#rootElement = rootElement;
    this.#rootDocument = rootDocument;

    this.install();
  }

  /**
   * Creates the emptyDataState UI elements and sets up the structure.
   */
  install() {
    if (this.#refs?.emptyDataStateElement) {
      return;
    }

    const elements = html`${TEMPLATE}`;

    this.#refs = elements.refs;

    this.#rootElement.after(elements.fragment);
  }

  /**
   * Gets the emptyDataState element.
   *
   * @returns {HTMLElement} The empty data state element.
   */
  getElement() {
    return this.#refs?.emptyDataStateElement;
  }

  /**
   * Gets the focusable elements of the emptyDataState element.
   *
   * @returns {HTMLElement[]} The focusable elements.
   */
  getFocusableElements() {
    if (!this.#refs?.emptyDataStateActions) {
      return [];
    }

    return Array.from(this.#refs?.emptyDataStateActions?.children);
  }

  /**
   * Shows the emptyDataState element.
   */
  show() {
    if (!this.#refs?.emptyDataStateElement) {
      return;
    }

    this.#refs.emptyDataStateElement.style.display = 'block';
  }

  /**
   * Hides the emptyDataState element.
   */
  hide() {
    if (!this.#refs?.emptyDataStateElement) {
      return;
    }

    this.#placeholderElement?.remove();
    this.#placeholderElement = null;

    this.#refs.emptyDataStateElement.style.display = 'none';
  }

  /**
   * Updates the content of the emptyDataState element.
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

      this.#refs = { ...this.#refs, ...actionsElement.refs };

      const { emptyDataStateActions } = actionsElement.refs;

      message.actions.forEach((action) => {
        const button = this.#rootDocument.createElement('button');

        button.classList.add('ht-button', `ht-button--${action.type}`);
        button.textContent = action.text;
        button.addEventListener('click', action.callback);

        emptyDataStateActions.appendChild(button);
      });

      emptyDataStateInner.appendChild(emptyDataStateActions);
    } else {
      delete this.#refs?.emptyDataStateActions;
    }
  }

  /**
   * Updates the class names of the emptyDataState element.
   *
   * @param {View} view - The view instance.
   */
  updateClassNames(view) {
    const { emptyDataStateElement } = this.#refs;
    const holder = view._wt.wtTable.holder;
    const scrollbarHeight = holder.offsetHeight - holder.clientHeight;

    if (view._wt.wtTable.hider.clientHeight > 1) {
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
   * Updates the size of the emptyDataState element.
   *
   * @param {View} view - The view instance.
   */
  updateSize(view) {
    const { emptyDataStateElement } = this.#refs;
    const isAutoRowSizeEnabled = view.hot.getPlugin('autoRowSize')?.isEnabled();

    const holder = view._wt.wtTable.holder;
    const hider = view._wt.wtTable.hider;

    const additionalHeight = isAutoRowSizeEnabled ? 0 : 1;

    emptyDataStateElement.style.top = `${hider.clientHeight - additionalHeight}px`;

    if (hider.clientWidth > 1) {
      if (holder.clientWidth < hider.clientWidth) {
        emptyDataStateElement.style.maxWidth = `${holder.clientWidth}px`;
      } else {
        emptyDataStateElement.style.maxWidth = `${hider.clientWidth}px`;
      }
    }

    if (!this.#placeholderElement) {
      this.#placeholderElement = this.#rootDocument.createElement('div');
      this.#placeholderElement.classList.add(`${EMPTY_DATA_STATE_CLASS_NAME}-placeholder`);

      view._wt.wtTable.holder.appendChild(this.#placeholderElement);
    }

    this.#placeholderElement.style.width = '100%';
    this.#placeholderElement.style.height = `calc(100% - ${hider.clientHeight}px)`;

    if (holder.clientHeight - hider.clientHeight < 1) {
      this.#placeholderElement.style.minHeight = `${MIN_HEIGHT}px`;
    }

    emptyDataStateElement.style.height = `${this.#placeholderElement.clientHeight + additionalHeight}px`;
  }

  /**
   * Removes the emptyDataState UI elements from the DOM and clears the refs.
   */
  destroy() {
    this.#refs?.emptyDataStateElement?.remove();
    this.#placeholderElement?.remove();
    this.#placeholderElement = null;
    this.#refs = null;
  }
}
