/**
 * Describes that ViewSizeSet instance doesn't share sizes with another
 * instance (root node can contain only one type of children nodes).
 *
 * @type {number}
 */
export const WORKING_SPACE_ALL = 0;
/**
 * Describes that ViewSizeSet instance share sizes with another instance and
 * set working space for this instance to 'top' (root node can contain multiple
 * types of children and this instance will be occupied top space of the root node).
 *
 * @type {number}
 */
export const WORKING_SPACE_TOP = 1;
/**
 * Describes that ViewSizeSet instance share sizes with another instance and
 * set working space for this instance to 'bottom' (root node can contain multiple
 * types of children and this instance will be occupied bottom space of the root node).
 *
 * @type {number}
 */
export const WORKING_SPACE_BOTTOM = 2;

/**
 * Command type: no action needed, element is already in correct position.
 *
 * @type {number}
 */
export const CMD_NONE = 0;
/**
 * Command type: remove the element from the root node.
 *
 * @type {number}
 */
export const CMD_REMOVE = 1;
/**
 * Command type: append the element at the end of the root node.
 *
 * @type {number}
 */
export const CMD_APPEND = 2;
/**
 * Command type: prepend the element at the beginning of the root node.
 *
 * @type {number}
 */
export const CMD_PREPEND = 3;
/**
 * Command type: insert the element before another element in the root node.
 *
 * @type {number}
 */
export const CMD_INSERT_BEFORE = 4;
/**
 * Command type: replace an existing element with a new one in the root node.
 *
 * @type {number}
 */
export const CMD_REPLACE = 5;
