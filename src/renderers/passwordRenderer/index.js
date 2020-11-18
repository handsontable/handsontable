import { registerRenderer } from '../index';
import passwordRenderer from './passwordRenderer';

export const RENDERER_TYPE = 'password';

registerRenderer(RENDERER_TYPE, passwordRenderer);

export default passwordRenderer;
