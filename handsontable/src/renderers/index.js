import { textRenderer, RENDERER_TYPE as TEXT_RENDERER } from './textRenderer';
import {
  registerRenderer,
} from './registry';

/**
 * Registers all available renderers.
 */
export function registerAllRenderers() {
  registerRenderer(textRenderer);
}

export {
  textRenderer, TEXT_RENDERER,
};

export {
  getRenderer,
  registerRenderer,
} from './registry';
