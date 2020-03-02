/* eslint-disable import/prefer-default-export */
import { extend } from './../../helpers/object';

/**
 * Returns a class declaration ready to instantiate and use by target highlight.
 * The prototype object, of that class adds the ability to overwrite (control)
 * properties used by target modules without noticing them about the changes.
 *
 * The same technique is used in the CellMeta layers.
 *
 * @param {object} defaultStyles An object with default properties to be set.
 * @returns {BorderStyle}
 */
export function createBorderStyleClass(defaultStyles) {
  const DefaultBorderStyle = class {};

  extend(DefaultBorderStyle.prototype, defaultStyles);

  const BorderStyle = class extends DefaultBorderStyle {};

  return BorderStyle;
}
