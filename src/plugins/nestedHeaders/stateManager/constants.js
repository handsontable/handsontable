/* eslint-disable import/prefer-default-export */
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
   * The flag which determines whether the column header should be rendered as hidden (display: none).
   *
   * @type {boolean}
   */
  hidden: false,
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
};
