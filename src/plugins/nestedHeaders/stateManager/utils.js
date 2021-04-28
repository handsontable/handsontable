/**
 * Creates the header settings object with default values.
 *
 * @param {object} initialValues The initial values for the header settings object.
 * @returns {object}
 */
export function createDefaultHeaderSettings({
  label = '',
  colspan = 1,
  origColspan = 1,
  collapsible = false,
  crossHiddenColumns = [],
  isCollapsed = false,
  isHidden = false,
  isRoot = false,
  isPlaceholder = false,
} = {}) {
  return {
    /**
     * The name/label of the column header.
     *
     * @type {string}
     */
    label,
    /**
     * Current calculated colspan value of the rendered column header element.
     *
     * @type {number}
     */
    colspan,
    /**
     * Original colspan value, set once while parsing user-defined nested header settings.
     *
     * @type {number}
     */
    origColspan,
    /**
     * The flag determines whether the node is collapsible (can be collpased/expanded).
     *
     * @type {boolean}
     */
    collapsible,
    /**
     * The flag determines whether the node is collapsed.
     *
     * @type {boolean}
     */
    isCollapsed,
    /**
     * The list of visual column indexes which indicates that the specified columns within
     * the header settings are hidden.
     *
     * @type {number[]}
     */
    crossHiddenColumns,
    /**
     * The flag determines whether the column header at specified index is hidden. If true
     * the TH element will be rendered as hidden (display: none).
     *
     * @type {boolean}
     */
    isHidden,
    /**
     * The flag which determines whether the column header settings is accually not renderable. That kind
     * of objects are generated after colspaned header to fill an array to correct size.
     *
     * For example for header with colspan = 8 the 7 blank objects are generated to fill the array settings
     * to length = 8.
     *
     * @type {boolean}
     */
    isRoot,
    /**
     * The flag determines whether the column header at the specified index is non-renderable.
     *
     * @type {boolean}
     */
    isPlaceholder,
  };
}

/**
 * Creates the header settings placeholder object. Those settings tell the header renderers
 * that this TH element should not be rendered (the node will be overlapped by the previously
 * created node with colspan bigger than 1).
 *
 * @returns {object}
 */
export function createPlaceholderHeaderSettings() {
  return {
    label: '',
    isPlaceholder: true,
  };
}
