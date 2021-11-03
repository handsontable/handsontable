import { CellProperties } from '../../settings';
import { CellValue } from '../../common';

export const VALIDATOR_TYPE: 'date';
export function dateValidator(this: CellProperties, value: CellValue, callback: (valid: boolean) => void): void;
