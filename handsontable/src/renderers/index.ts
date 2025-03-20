import { textRenderer, RENDERER_TYPE as TEXT_RENDERER } from './textRenderer';
import {
  registerRenderer,
} from './registry';
import { TypedRenderer } from './types';

/**
 * Registers all available renderers.
 */
export function registerAllRenderers(): void {
  registerRenderer(textRenderer as TypedRenderer);
}

export {
  textRenderer, TEXT_RENDERER,
};

export {
  getRenderer,
  registerRenderer,
} from './registry';
