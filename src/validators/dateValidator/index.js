import { registerValidator } from '../index';
import dateValidator from './dateValidator';

export const VALIDATOR_TYPE = 'date';

registerValidator(VALIDATOR_TYPE, dateValidator);

export default dateValidator;
