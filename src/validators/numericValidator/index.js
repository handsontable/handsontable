import { registerValidator } from '../index';
import numericValidator from './numericValidator';

export const VALIDATOR_TYPE = 'numeric';

registerValidator(VALIDATOR_TYPE, numericValidator);

export default numericValidator;
