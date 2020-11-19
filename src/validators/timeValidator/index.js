import { registerValidator } from '../validators';
import timeValidator from './timeValidator';

export const VALIDATOR_TYPE = 'time';

registerValidator(VALIDATOR_TYPE, timeValidator);

export default timeValidator;
