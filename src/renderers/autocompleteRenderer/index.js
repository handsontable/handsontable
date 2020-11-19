import { registerRenderer } from '../renderers';
import autocompleteRenderer from './autocompleteRenderer';

export const RENDERER_TYPE = 'autocomplete';

registerRenderer(RENDERER_TYPE, autocompleteRenderer);

export default autocompleteRenderer;
