/**
 * Default properties for nested header settings.
 *
 * @type {object}
 */
export const HEADER_DEFAULT_SETTINGS = {
  /**
   * The name/label of the column header.
   *
   * @type {string}
   */
  label: '',
  /**
   * Current calculated colspan value of the rendered column header element.
   *
   * @type {number}
   */
  colspan: 1,
  /**
   * Original colspan value, set once while parsing user-defined nested header settings.
   *
   * @type {number}
   */
  origColspan: 1,
  /**
   * The flag which determines whether the node is collapsible (can be collpased/expanded).
   *
   * @type {boolean}
   */
  collapsible: false,
  /**
   * The flag which determines whether the node was collapsed.
   *
   * @type {boolean}
   */
  isCollapsed: false,
  /**
   * The flag which determines whether the column header should be rendered as hidden (display: none).
   *
   * @type {boolean}
   */
  isHidden: false,
  /**
   * The flag which determines whether the column header settings is accually not renderable. That kind
   * of objects are generated after colspaned header to fill an array to correct size.
   *
   * For example for header with colspan = 8 the 7 blank objects are generated to fil an array settings
   * to length = 8.
   *
   * @type {boolean}
   */
  isBlank: false,
};

/**
 * List of properties which are configurable. That properties can be changed using public API.
 *
 * @type {string[]}
 */
export const HEADER_CONFIGURABLE_PROPS = ['label', 'collapsible'];
