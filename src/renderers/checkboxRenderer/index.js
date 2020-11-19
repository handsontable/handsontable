import { registerRenderer } from '../renderers';
import checkboxRenderer from './checkboxRenderer';

export const RENDERER_TYPE = 'checkbox';

registerRenderer(RENDERER_TYPE, checkboxRenderer);

export default checkboxRenderer;
