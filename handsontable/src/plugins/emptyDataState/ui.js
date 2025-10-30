import { html } from '../../helpers/templateLiteralTag';
import { addClass, removeClass, getScrollbarWidth, setAttribute } from '../../helpers/dom/element';
import { A11Y_TABINDEX } from '../../helpers/a11y';
import { stripTags } from '../../helpers/string';

const EMPTY_DATA_STATE_CLASS_NAME = 'ht-empty-data-state';
const MIN_HEIGHT = 150;

const TEMPLATE = `<div data-ref="emptyDataStateElement" class="${EMPTY_DATA_STATE_CLASS_NAME} handsontable">
  <div class="${EMPTY_DATA_STATE_CLASS_NAME}__content-wrapper">
    <div data-ref="emptyDataStateInner" class="${EMPTY_DATA_STATE_CLASS_NAME}__content-wrapper-inner"></div>
  </div>
</div>`;

const templateContent = ({ title, description, buttons }) => `
  <div class="${EMPTY_DATA_STATE_CLASS_NAME}__content">
    ${title ? `<h2 class="${EMPTY_DATA_STATE_CLASS_NAME}__title">${stripTags(title)}</h2>` : ''}
    ${description ? `<p class="${EMPTY_DATA_STATE_CLASS_NAME}__description">${stripTags(description)}</p>` : ''}
  </div>
  <div 
    data-ref="emptyDataStateButtons" 
    class="${EMPTY_DATA_STATE_CLASS_NAME}__buttons${buttons?.length > 0 ?
  ` ${EMPTY_DATA_STATE_CLASS_NAME}__buttons--has-buttons`
  : ''}"
  >${buttons?.length > 0 ?
    buttons.map(button =>
      `<button class="ht-button ht-button--${button.type}">${stripTags(button.text)}</button>`).join('')
    : ''}</div>`;

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

    const { emptyDataStateInner } = this.#refs;

    setAttribute(emptyDataStateInner, [
      A11Y_TABINDEX(-1),
    ]);

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
    const { emptyDataStateButtons, emptyDataStateInner } = this.#refs;
    const emptyDataStateButtonsElements = Array.from(emptyDataStateButtons?.children);

    if (emptyDataStateButtonsElements.length === 0) {
      return [emptyDataStateInner];
    }

    return emptyDataStateButtonsElements;
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
        title: message,
      };
    } else {
      content = {
        title: message?.title,
        description: message?.description,
        buttons: message?.buttons,
      };
    }

    const template = html`${templateContent(content)}`;

    this.#refs = { ...this.#refs, ...template.refs };

    emptyDataStateInner.innerHTML = '';
    emptyDataStateInner.appendChild(template.fragment);

    if (content.buttons?.length > 0) {
      Array.from(this.#refs.emptyDataStateButtons.children).forEach((button, index) => {
        button.addEventListener('click', content.buttons[index].callback);
      });
    }
  }

  /**
   * Updates the class names of the emptyDataState element.
   *
   * @param {View} view - The view instance.
   */
  updateClassNames(view) {
    const { emptyDataStateElement } = this.#refs;

    if (view.countRenderableColumns() > 0) {
      addClass(emptyDataStateElement, `${EMPTY_DATA_STATE_CLASS_NAME}--disable-top-border`);
    } else {
      removeClass(emptyDataStateElement, `${EMPTY_DATA_STATE_CLASS_NAME}--disable-top-border`);
    }

    if (view.countRenderableRows() > 0) {
      addClass(emptyDataStateElement, `${EMPTY_DATA_STATE_CLASS_NAME}--disable-inline-border`);
    } else {
      removeClass(emptyDataStateElement, `${EMPTY_DATA_STATE_CLASS_NAME}--disable-inline-border`);
    }

    if (view.hasHorizontalScroll() && !view.isHorizontallyScrollableByWindow()) {
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

    const scrollbarSize = view.hasHorizontalScroll() ? getScrollbarWidth(view.hot.rootDocument) : 0;
    const rows = view.countRenderableRows();
    const cols = view.countRenderableColumns();

    emptyDataStateElement.style.top = cols > 0 ? `${view.getColumnHeaderHeight()}px` : '0px';
    emptyDataStateElement.style.insetInlineStart = rows > 0 ? `${view.getRowHeaderWidth()}px` : '0px';

    if (rows === 0) {
      if (!this.#placeholderElement) {
        this.#placeholderElement = this.#rootDocument.createElement('div');
        this.#placeholderElement.classList.add(`${EMPTY_DATA_STATE_CLASS_NAME}-placeholder`);

        view._wt.wtTable.holder.appendChild(this.#placeholderElement);
      }

      this.#placeholderElement.style.width = '100%';
      this.#placeholderElement.style.height = `${MIN_HEIGHT}px`;
    } else {
      this.#placeholderElement?.remove();
      this.#placeholderElement = null;
    }

    let width = view.getWorkspaceWidth();
    let height = view.getTableHeight();

    if (view.isHorizontallyScrollableByWindow()) {
      if (cols > 0) {
        width = view.getTotalTableWidth();
      } else if (rows > 0) {
        width = view.getViewportWidth();
      }
    } else if (rows > 0) {
      width = view.getViewportWidth();
    } else if (view.getTableWidth() - view.getRowHeaderWidth() < view.getViewportWidth() && cols > 0) {
      width = view.getTableWidth();
    }

    if (view.isVerticallyScrollableByWindow()) {
      if (cols > 0) {
        height = view.hot.getTableHeight() - view.getColumnHeaderHeight();
      } else {
        height = view.hot.getTableHeight();
      }
    } else if (rows === 0) {
      height = view.getViewportHeight() - scrollbarSize;
    }

    emptyDataStateElement.style.width = `${width}px`;
    emptyDataStateElement.style.height = `${height}px`;
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
