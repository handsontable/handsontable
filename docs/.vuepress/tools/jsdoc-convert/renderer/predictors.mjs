/**
 * A predicate which check if jsdoc data belong to the options file.
 *
 * @param {Array} data JSDoc data.
 * @returns {boolean}
 */
export const isJsdocOptions = data => data[0]?.meta.filename === 'metaSchema.js';

/**
 *  * A predicate which check if jsdoc data belong to the options file.
 *
 * @param {Array} data JSDoc data.
 * @returns {boolean}
 */
export const isJsdocPlugin = (data) => {
  return data[0]?.customTags?.filter(tag => tag.tag === 'plugin' && tag.value).length > 0 ?? false;
};
