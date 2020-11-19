import './baseRenderer';
import './autocompleteRenderer';
import './checkboxRenderer';
import './htmlRenderer';
import './numericRenderer';
import './passwordRenderer';
import './textRenderer';

export {
  getRegisteredRendererNames,
  getRegisteredRenderers,
  getRenderer,
  hasRenderer,
  registerRenderer,
} from './renderers';
