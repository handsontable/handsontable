import { buildTemplate, type TemplateSpec } from '../../helpers/dom/template';
import {
  addClass, removeClass, removeAttribute, getScrollbarWidth, setAttribute, empty
} from '../../helpers/dom/element';
import { A11Y_TABINDEX, A11Y_BUSY } from '../../helpers/a11y';
import { htmlToPlainText } from '../../helpers/string';
import { resolveButtonType } from '../../helpers/uiButton';
import type { default as ViewInstance } from '../../tableView';

const EMPTY_DATA_STATE_CLASS_NAME = 'ht-empty-data-state';
const MIN_HEIGHT = 150;

const TEMPLATE: TemplateSpec = {
  tag: 'div',
  ref: 'emptyDataStateElement',
  className: `${EMPTY_DATA_STATE_CLASS_NAME} handsontable`,
  children: [{
    tag: 'div',
    className: `${EMPTY_DATA_STATE_CLASS_NAME}__content-wrapper`,
    children: [{
      tag: 'div',
      ref: 'emptyDataStateInner',
      className: `${EMPTY_DATA_STATE_CLASS_NAME}__content-wrapper-inner`,
    }],
  }],
};

/**
 * A button of the `message` option, as it arrives from the settings.
 *
 * `type` is `unknown` rather than `ButtonType`, because the value comes from a plugin setting and
 * `resolveButtonType()` is what decides whether it is one of the supported types. Declaring the
 * narrow type here would claim a check that has not happened yet.
 */
type MessageButton = { type: unknown, text: string, callback?: Function };

/**
 * The resolved `message` content.
 */
type MessageContent = { title?: string, description?: string, buttons?: MessageButton[] };

const templateContent = ({ title, description, buttons }: MessageContent, isLoading = false): TemplateSpec[] => {
  const hasButtons = !!buttons?.length;

  return [
    isLoading && {
      tag: 'div',
      className: `${EMPTY_DATA_STATE_CLASS_NAME}__spinner`,
      attrs: { 'aria-hidden': 'true' },
    },
    {
      tag: 'div',
      className: `${EMPTY_DATA_STATE_CLASS_NAME}__content`,
      children: [
        title ? {
          tag: 'h2', className: `${EMPTY_DATA_STATE_CLASS_NAME}__title`, text: htmlToPlainText(title),
        } : null,
        description ? {
          tag: 'p', className: `${EMPTY_DATA_STATE_CLASS_NAME}__description`, text: htmlToPlainText(description),
        } : null,
      ],
    },
    {
      tag: 'div',
      ref: 'emptyDataStateButtons',
      className: `${EMPTY_DATA_STATE_CLASS_NAME}__buttons${
        hasButtons ? ` ${EMPTY_DATA_STATE_CLASS_NAME}__buttons--has-buttons` : ''}`,
      children: !isLoading && hasButtons ? buttons!.map(button => ({
        tag: 'button',
        className: `ht-button ht-button--${resolveButtonType(button.type)}`,
        text: htmlToPlainText(button.text),
      })) : [],
    },
  ].filter(Boolean) as TemplateSpec[];
};

/**
 * Creates, updates, or removes the min-height placeholder when there are no renderable rows.
 *
 * @param {Document} rootDocument - Root document for creating elements.
 * @param {View} view - The view instance.
 * @param {number} rows - Renderable row count.
 * @param {string} classNamePrefix - Base class name for the empty data state.
 * @param {{ element: HTMLElement | null }} placeholderState - In/out placeholder element reference.
 * @returns {void}
 */
function syncEmptyDataStatePlaceholder(
  rootDocument: Document, view: ViewInstance, rows: number,
  classNamePrefix: string, placeholderState: { element: HTMLElement | null }
) {
  if (rows !== 0) {
    placeholderState.element?.remove();
    placeholderState.element = null;

    return;
  }

  if (!placeholderState.element) {
    placeholderState.element = rootDocument.createElement('div');
    placeholderState.element.classList.add(`${classNamePrefix}-placeholder`);
    view._wt.wtTable.holder.appendChild(placeholderState.element);
  }

  placeholderState.element.style.width = '100%';
  placeholderState.element.style.height = `${MIN_HEIGHT}px`;
}

/**
 * Resolves the empty-data-state overlay width for the current view and column layout.
 *
 * @param {View} view - The view instance.
 * @param {number} cols - Renderable column count.
 * @param {boolean} treatAsPopulatedRowsForSizing - When `true`, use viewport width if horizontally window-scrollable.
 * @returns {number} Width in pixels.
 */
function computeEmptyDataStateWidth(view: ViewInstance, cols: number, treatAsPopulatedRowsForSizing: boolean) {
  let width = view.getWorkspaceWidth();

  if (view.isHorizontallyScrollableByWindow()) {
    if (cols > 0) {
      width = view.getTotalTableWidth();
    } else if (treatAsPopulatedRowsForSizing) {
      width = view.getViewportWidth();
    }
  } else if (view.getTableWidth() - view.getRowHeaderWidth() < view.getViewportWidth() && cols > 0) {
    width = view.getTableWidth();
  }

  return width;
}

/**
 * Resolves the empty-data-state overlay height for the current view and header layout.
 *
 * @param {View} view - The view instance.
 * @param {number} cols - Renderable column count.
 * @param {number} headerCols - Column header count.
 * @param {number} scrollbarSize - Horizontal scrollbar thickness when scrollbars are shown.
 * @returns {number} Height in pixels.
 */
function computeEmptyDataStateHeight(view: ViewInstance, cols: number, headerCols: number, scrollbarSize: number) {
  let height = view.getTableHeight();

  if (view.isVerticallyScrollableByWindow() || view.hasVerticalScroll()) {
    if (cols > 0) {
      height = view.hot.getTableHeight() - view.getColumnHeaderHeight();
    } else {
      height = view.hot.getTableHeight();
    }
  } else if (headerCols > 0 && cols > 0) {
    height = view.getViewportHeight() - scrollbarSize;
  } else if (headerCols > 0 && cols === 0) {
    height = view.getWorkspaceHeight() - scrollbarSize;
  }

  return height;
}

/**
 * EmptyDataStateUI is a UI component that renders and manages empty data state elements.
 *
 * @private
 * @class EmptyDataStateUI
 */
export class EmptyDataStateUI {
  /**
   * The grid container where the emptyDataState UI will be installed (`ht-grid`). It overlays the
   * grid, so it is a sibling of the grid content rather than a wrapper-level slot.
   *
   * @type {HTMLElement}
   */
  #gridContainer: HTMLElement;
  /**
   * The root document where the emptyDataState UI will be installed.
   *
   * @type {Document}
   */
  #rootDocument: Document;
  /**
   * The references to the UI elements.
   *
   * @type {object}
   */
  #refs: Record<string, HTMLElement> | null = null;
  /**
   * The placeholder element.
   *
   * @type {HTMLElement}
   */
  #placeholderElement: HTMLElement | null = null;

  /**
   * Initializes the empty data state UI with the grid container and document, then builds and inserts the DOM structure.
   */
  constructor({
    gridContainer,
    rootDocument,
  }: { gridContainer: HTMLElement, rootDocument: Document }) {
    this.#gridContainer = gridContainer;
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

    const elements = buildTemplate(TEMPLATE, this.#rootDocument);

    this.#refs = elements.refs;

    const { emptyDataStateInner, emptyDataStateElement } = this.#refs;

    setAttribute(emptyDataStateInner, [
      A11Y_TABINDEX(-1),
    ]);
    setAttribute(emptyDataStateElement, [
      A11Y_TABINDEX(-1),
    ]);

    if (this.#gridContainer) {
      this.#gridContainer.appendChild(elements.fragment);
    }
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
  getFocusableElements(): HTMLElement[] {
    const { emptyDataStateButtons, emptyDataStateInner } = this.#refs!;
    // HTMLCollection<Element> → cast once here so callers receive HTMLElement[]
    const emptyDataStateButtonsElements = Array.from(emptyDataStateButtons?.children ?? []) as HTMLElement[];

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
   * @param {boolean} isLoading - When `true`, shows a loading spinner.
   * @returns {void}
   */
  updateContent(message: string | Record<string, unknown>, isLoading = false) {
    const { emptyDataStateElement, emptyDataStateInner } = this.#refs!;

    let content: MessageContent;

    if (typeof message === 'string') {
      content = {
        title: message,
      };
    } else {
      content = {
        title: message?.title as string | undefined,
        description: message?.description as string | undefined,
        buttons: message?.buttons as MessageButton[] | undefined,
      };
    }

    const template = buildTemplate(
      templateContent(content, isLoading), this.#rootDocument
    );

    if (isLoading) {
      addClass(emptyDataStateElement, `${EMPTY_DATA_STATE_CLASS_NAME}--loading`);
      setAttribute(emptyDataStateInner, [
        A11Y_BUSY(),
      ]);
    } else {
      removeClass(emptyDataStateElement, `${EMPTY_DATA_STATE_CLASS_NAME}--loading`);
      removeAttribute(emptyDataStateInner, A11Y_BUSY()[0]);
    }

    this.#refs = { ...this.#refs, ...template.refs };

    empty(emptyDataStateInner);
    emptyDataStateInner.appendChild(template.fragment);

    if (!isLoading && content.buttons?.length && content.buttons.length > 0) {
      Array.from(this.#refs.emptyDataStateButtons.children).forEach((button, index) => {
        (button as HTMLElement).addEventListener('click', content.buttons![index].callback as EventListener);
      });
    }
  }

  /**
   * Updates the class names of the emptyDataState element.
   *
   * @param {View} view - The view instance.
   */
  updateClassNames(view: ViewInstance) {
    const { emptyDataStateElement } = this.#refs!;

    if (view.countRenderableColumns() > 0 && view.getColumnHeadersCount() > 0) {
      addClass(emptyDataStateElement, `${EMPTY_DATA_STATE_CLASS_NAME}--disable-top-border`);
    } else {
      removeClass(emptyDataStateElement, `${EMPTY_DATA_STATE_CLASS_NAME}--disable-top-border`);
    }

    if (view.countRenderableRows() > 0 && view.getRowHeadersCount() > 0) {
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
   * @param {boolean} [isLoading] - When `true` and the grid has renderable columns, use the same
   *   workspace sizing as when renderable rows exist (e.g. DataProvider fetch while a page is still shown).
   */
  updateSize(view: ViewInstance, isLoading = false) {
    const { emptyDataStateElement } = this.#refs!;

    const scrollbarSize = view.hasHorizontalScroll()
      ? getScrollbarWidth((view as ViewInstance & { hot: { rootDocument: Document } }).hot.rootDocument)
      : 0;
    const rows = view.countRenderableRows();
    const cols = view.countRenderableColumns();
    const headerCols = view.getColumnHeadersCount();

    const extendLayoutForLoading = isLoading === true && cols > 0;
    const treatAsPopulatedRowsForSizing = rows > 0 || extendLayoutForLoading;

    emptyDataStateElement.style.top = cols > 0 ? `${view.getColumnHeaderHeight()}px` : '0px';
    emptyDataStateElement.style.insetInlineStart = '0px';

    const placeholderState = { element: this.#placeholderElement };

    syncEmptyDataStatePlaceholder(this.#rootDocument, view, rows, EMPTY_DATA_STATE_CLASS_NAME, placeholderState);
    this.#placeholderElement = placeholderState.element;

    const width = computeEmptyDataStateWidth(view, cols, treatAsPopulatedRowsForSizing);
    const height = computeEmptyDataStateHeight(view, cols, headerCols, scrollbarSize);

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
