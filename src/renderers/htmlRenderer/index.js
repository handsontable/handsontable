import { registerRenderer } from '../index';
import htmlRenderer from './htmlRenderer';

export const RENDERER_TYPE = 'html';

registerRenderer(RENDERER_TYPE, htmlRenderer);

export default htmlRenderer;
