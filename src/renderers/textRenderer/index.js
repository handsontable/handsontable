import { registerRenderer } from '../index';
import textRenderer from './textRenderer';

export const RENDERER_TYPE = 'text';

registerRenderer(RENDERER_TYPE, textRenderer);

export default textRenderer;
