import { CellProperties } from '../../settings';
import { CellValue } from '../../common';

export const VALIDATOR_TYPE: 'dropdown';
export function dropdownValidator(this: CellProperties, value: CellValue, callback: (valid: boolean) => void): void;
