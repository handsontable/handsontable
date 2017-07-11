import staticRegister from './../utils/staticRegister';

import baseRenderer from './_cellDecorator';
import autocompleteRenderer from './autocompleteRenderer';
import checkboxRenderer from './checkboxRenderer';
import htmlRenderer from './htmlRenderer';
import numericRenderer from './numericRenderer';
import passwordRenderer from './passwordRenderer';
import textRenderer from './textRenderer';

const {
  register,
  getItem,
  hasItem,
  getNames,
  getValues,
} = staticRegister('renderers');

register('base', baseRenderer);
register('autocomplete', autocompleteRenderer);
register('checkbox', checkboxRenderer);
register('html', htmlRenderer);
register('numeric', numericRenderer);
register('password', passwordRenderer);
register('text', textRenderer);

/**
 * Retrieve renderer function.
 *
 * @param {String} name Renderer identification.
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
