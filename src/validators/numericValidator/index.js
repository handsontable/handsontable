import { registerValidator } from '../validators';
import numericValidator from './numericValidator';

export const VALIDATOR_TYPE = 'numeric';

registerValidator(VALIDATOR_TYPE, numericValidator);

export default numericValidator;
