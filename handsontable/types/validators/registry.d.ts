import { BaseValidator } from './base';
import { Validators } from './index';

declare function _register(name: string, validator: BaseValidator): void;
declare function _register(validator: BaseValidator): void;
declare function _getItem<T extends keyof Validators>(name: T): Validators[T];
declare function _getItem(name: string): BaseValidator;
declare function hasItem(name: string): boolean;
declare function getNames(): string[];
declare function getValues(): BaseValidator[];

export {
  _register as registerValidator,
  _getItem as getValidator,
  hasItem as hasValidator,
  getNames as getRegisteredValidatorNames,
  getValues as getRegisteredValidators
};
