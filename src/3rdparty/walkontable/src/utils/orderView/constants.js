/**
 * Describes that ViewSizeSet instance doesn't share sizes with another
 * instance (root node can contain only one type of children nodes).
 *
 * @type {Number}
 */
export const WORKING_SPACE_ALL = 0;
/**
 * Describes that ViewSizeSet instance share sizes with another instance and
 * set working space for this instance to 'top' (root node can contain multiple
 * types of children and this instance will be occupied top space of the root node).
 *
 * @type {Number}
 */
export const WORKING_SPACE_TOP = 1;
/**
 * Describes that ViewSizeSet instance share sizes with another instance and
 * set working space for this instance to 'bottom' (root node can contain multiple
 * types of children and this instance will be occupied bottom space of the root node).
 *
 * @type {Number}
 */
export const WORKING_SPACE_BOTTOM = 2;
