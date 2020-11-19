import { registerValidator } from '../validators';
import autocompleteRenderer from './autocompleteValidator';

export const VALIDATOR_TYPE = 'autocomplete';

registerValidator(VALIDATOR_TYPE, autocompleteRenderer);

export default autocompleteRenderer;
