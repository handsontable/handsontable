/**
 * @typedef {object} DefaultHeaderSettings
 * @property {string} label The name/label of the column header.
 * @property {number} colspan Current calculated colspan value of the rendered column header element.
 * @property {number} origColspan Original colspan value, set once while parsing user-defined nested header settings.
 * @property {boolean} collapsible The flag determines whether the node is collapsible (can be collapsed/expanded).
 * @property {number[]} crossHiddenColumns The list of visual column indexes which indicates that the specified columns within
 *                                         the header settings are hidden.
 * @property {boolean} isCollapsed The flag determines whether the node is collapsed.
 * @property {boolean} isHidden The flag determines whether the column header at specified index is hidden. If true
 *                              the TH element will be rendered as hidden (display: none).
 * @property {boolean} isRoot The flag which determines whether the column header settings is actually not renderable. That kind
 *                            of objects are generated after colspaned header to fill an array to correct size.
 *                            For example for header with colspan = 8 the 7 blank objects are generated to fill the array settings
 *                            to length = 8.
 * @property {boolean} isPlaceholder The flag determines whether the column header at the specified index is non-renderable.
 * @property {string[]} headerClassNames The list of CSS classes that will be added to the `div` element inside the
 * header Acts as a replacement for the analogous property from the Handsontable settings.
 */

/**
 * Creates the header settings object with default values.
 *
 * @param {DefaultHeaderSettings} initialValues The initial values for the header settings object.
 * @returns {DefaultHeaderSettings}
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
  headerClassNames = []
} = {}) {
  return {
    label,
    colspan,
    origColspan,
    collapsible,
    isCollapsed,
    crossHiddenColumns,
    isHidden,
    isRoot,
    isPlaceholder,
    headerClassNames,
  };
}

/**
 * Creates the placeholder header settings object. Those settings tell the header renderers
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
