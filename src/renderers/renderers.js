import staticRegister from '../utils/staticRegister';

const {
  register,
  getItem,
  hasItem,
  getNames,
  getValues,
} = staticRegister('renderers');

/**
 * Retrieve renderer function.
 *
 * @param {string} name Renderer identification.
 * @returns {Function} Returns renderer function.
 */
function _getItem(name) {
  if (typeof name === 'function') {
    return name;
  }
  if (!hasItem(name)) {
    throw Error(`No registered renderer found under "${name}" name`);
  }

  return getItem(name);
}

export {
  register as registerRenderer,
  _getItem as getRenderer,
  hasItem as hasRenderer,
  getNames as getRegisteredRendererNames,
  getValues as getRegisteredRenderers,
};
