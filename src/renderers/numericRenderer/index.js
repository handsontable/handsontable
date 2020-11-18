import { registerRenderer } from '../index';
import numericRenderer from './numericRenderer';

export const RENDERER_TYPE = 'numeric';

registerRenderer(RENDERER_TYPE, numericRenderer);

export default numericRenderer;
