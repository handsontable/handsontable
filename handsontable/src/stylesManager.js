/**
 * Manages the theme variables value.
 */
export class StylesManager {
  /**
   * The Handsontable instance's root element.
   *
   * @type {HTMLElement}
   */
  #rootElement;

  /**
   * The computed style of the root element.
   *
   * @type {CSSStyleDeclaration}
   * @private
   */
  #rootComputedStyle;

  /**
   * `true` if the legacy theme is enabled, `false` otherwise.
   *
   * @type {boolean}
   */
  static #legacyTheme = false;

  /**
   * Keeps a value of cell vertical padding css variable.
   *
   * @type {number}
   */
  static #cellVerticalPadding;

  /**
   * Keeps a value of cell horizontal padding css variable.
   *
   * @type {number}
   */
  static #cellHorizontalPadding;

  /**
   * `box-sizing` value of the cell.
   *
   * @type {string}
   */
  static #cellBoxSizing;

  /**
   * Keeps a value of cell bottom border width css variable.
   *
   * @type {number}
   */
  static #cellBottomBorderWidth;

  /**
   * Keeps a value of cell top border width css variable.
   *
   * @type {number}
   */
  static #cellTopBorderWidth;

  /**
   * Keeps a value of cell line height css variable.
   *
   * @type {number}
   */
  static #cellLineHeight;

  /**
   * Creates an instance of StylesManager.
   *
   * @param {HTMLElement} rootElement - The root element of the Handsontable instance.
   */
  constructor(rootElement) {
    this.#rootElement = rootElement;
    this.#rootComputedStyle = getComputedStyle(this.#rootElement);

    if (this.#rootComputedStyle?.getPropertyValue('--ht-line-height') === '') {
      StylesManager.#legacyTheme = true;

      return;
    }

    StylesManager.#cellVerticalPadding = this.#getParsedCSSValue('--ht-cell-vertical-padding');
    StylesManager.#cellHorizontalPadding = this.#getParsedCSSValue('--ht-cell-horizontal-padding');
    StylesManager.#cellLineHeight = this.#getParsedCSSValue('--ht-line-height');

    // Some of the properties are not stored in the CSS variables, so we need to get them from the computed style.
    this.#getCSSValuesFromTempElement(
      { type: 'div', className: 'handsontable' },
      { type: 'td', className: '' },
      (computedStyle) => {
        StylesManager.#cellBoxSizing = computedStyle['box-sizing'];
        StylesManager.#cellTopBorderWidth = parseInt(computedStyle['border-top-width'], 10);
        StylesManager.#cellBottomBorderWidth = parseInt(computedStyle['border-bottom-width'], 10);
      },
    );
  }

  /**
   * Gets the value indicating whether the legacy theme is enabled.
   *
   * @returns {boolean} `true` if the legacy theme is enabled, `false` otherwise.
   */
  static get isLegacyTheme() {
    return StylesManager.#legacyTheme;
  }

  /**
   * Gets the cell vertical padding value.
   *
   * @returns {number} The cell vertical padding value.
   */
  static get CELL_VERTICAL_PADDING() {
    return StylesManager.#cellVerticalPadding;
  }

  /**
   * Gets the cell `box-sizing` value.
   *
   * @returns {string} The cell box-sizing value.
   */
  static get CELL_BOX_SIZING() {
    if (StylesManager.#legacyTheme) {
      return 'content-box';
    }

    return StylesManager.#cellBoxSizing;
  }

  /**
   * Gets the row height value.
   *
   * @returns {number} The row height value.
   */
  static get ROW_HEIGHT() {
    if (StylesManager.#legacyTheme) {
      return 23;
    }

    return StylesManager.#cellTopBorderWidth +
      (StylesManager.#cellHorizontalPadding * 2) +
      StylesManager.#cellLineHeight +
      StylesManager.#cellBottomBorderWidth;
  }

  /**
   * Retrieves the value of a specified CSS property before the element is rendered.
   *
   * @param {object} parentElementInfo - Information about the parent element to create.
   * @param {string} parentElementInfo.type - The type of the parent element (e.g., 'div').
   * @param {string} parentElementInfo.className - The class name of the parent element.
   * @param {object} childElementInfo - Information about the child element to create.
   * @param {string} childElementInfo.type - The type of the child element (e.g., 'td').
   * @param {string} childElementInfo.className - The class name of the child element.
   * @param {Function} getterCallback - The callback to get the computed style.
   * @param {Document} [doc=this.#rootElement.ownerDocument] - The document to use for creating elements.
   * @private
   */
  #getCSSValuesFromTempElement(
    parentElementInfo,
    childElementInfo = { type: 'div', className: '' },
    getterCallback,
    doc = this.#rootElement.ownerDocument) {
    let parentElement;

    if (parentElementInfo) {
      parentElement = doc.createElement(parentElementInfo.type);
      parentElement.style.display = 'none';
      parentElement.className = parentElementInfo.className;
    }

    const childElement = doc.createElement(childElementInfo.type);

    childElement.className = childElementInfo.className;

    if (parentElement) {
      doc.body.appendChild(parentElement);
      parentElement.appendChild(childElement);

    } else {
      doc.body.appendChild(childElement);
    }

    getterCallback(getComputedStyle(childElement));

    doc.body.removeChild(parentElement || childElement);
  }

  /**
   * Parses the value of a specified CSS property from the root element's computed style.
   *
   * @param {string} property - The CSS property to retrieve and parse.
   * @returns {number} The parsed value of the CSS property.
   */
  #getParsedCSSValue(property) {
    return parseInt(this.#rootComputedStyle?.getPropertyValue(property), 10);
  }
}
