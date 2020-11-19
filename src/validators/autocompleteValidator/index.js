import { registerValidator } from '../validators';
import autocompleteValidator from './autocompleteValidator';

export const VALIDATOR_TYPE = 'autocomplete';

registerValidator(VALIDATOR_TYPE, autocompleteValidator);

export default autocompleteValidator;
