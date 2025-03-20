import staticRegister from '../utils/staticRegister';
import { RendererFunction, TypedRenderer } from './types';

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
function _getItem(name: string | RendererFunction): RendererFunction {
  if (typeof name === 'function') {
    return name as RendererFunction;
  }
  if (!hasItem(name)) {
    throw Error(`No registered renderer found under "${name}" name`);
  }

  return getItem(name);
}

/**
 * Register renderer under its alias.
 *
 * @param {string|Function} name Renderer's alias or renderer function with its descriptor.
 * @param {Function} [renderer] Renderer function.
 */
function _register(name: string | TypedRenderer, renderer?: RendererFunction): void {
  if (typeof name !== 'string') {
    renderer = name;
    name = (renderer as TypedRenderer).RENDERER_TYPE;
  }

  register(name as string, renderer as RendererFunction);
}

export {
  _register as registerRenderer,
  _getItem as getRenderer,
  hasItem as hasRenderer,
  getNames as getRegisteredRendererNames,
  getValues as getRegisteredRenderers,
};
