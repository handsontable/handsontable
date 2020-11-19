import { registerValidator } from '../validators';
import dateValidator from './dateValidator';

export const VALIDATOR_TYPE = 'date';

registerValidator(VALIDATOR_TYPE, dateValidator);

export default dateValidator;
