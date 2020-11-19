import { registerRenderer } from '../renderers';
import passwordRenderer from './passwordRenderer';

export const RENDERER_TYPE = 'password';

registerRenderer(RENDERER_TYPE, passwordRenderer);

export default passwordRenderer;
