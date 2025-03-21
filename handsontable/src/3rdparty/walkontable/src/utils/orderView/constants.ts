/**
 * Describes that ViewSizeSet instance doesn't share sizes with another
 * instance (root node can contain only one type of children nodes).
 *
 * @type {number}
 */
export const WORKING_SPACE_ALL: number = 0;
/**
 * Describes that ViewSizeSet instance share sizes with another instance and
 * set working space for this instance to 'top' (root node can contain multiple
 * types of children and this instance will be occupied top space of the root node).
 *
 * @type {number}
 */
export const WORKING_SPACE_TOP: number = 1;
/**
 * Describes that ViewSizeSet instance share sizes with another instance and
 * set working space for this instance to 'bottom' (root node can contain multiple
 * types of children and this instance will be occupied bottom space of the root node).
 *
 * @type {number}
 */
export const WORKING_SPACE_BOTTOM: number = 2;

/**
 * Enum for working space types.
 * 
 * @enum {number}
 */
export enum WorkingSpace {
  /** Root node can contain only one type of children nodes */
  ALL = WORKING_SPACE_ALL,
  /** This instance will be occupied top space of the root node */
  TOP = WORKING_SPACE_TOP,
  /** This instance will be occupied bottom space of the root node */
  BOTTOM = WORKING_SPACE_BOTTOM,
}
