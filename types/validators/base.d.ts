import { CellProperties } from '../settings';
import { CellValue } from '../common';

declare function baseValidator(this: CellProperties, value: CellValue, callback: (valid: boolean) => void): void

export type BaseValidator = typeof baseValidator;
