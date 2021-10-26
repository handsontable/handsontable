import Core from '../core';
import { CellProperties } from '../settings';
import { CellValue } from '../common';

interface BaseValidator {
  (this: CellProperties, value: CellValue, callback: (valid: boolean) => void): void;
}

declare function _register(name: string, validator: BaseValidator): void;
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
