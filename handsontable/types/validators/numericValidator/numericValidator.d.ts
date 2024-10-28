import { CellProperties } from '../../settings';
import { CellValue } from '../../common';

export const VALIDATOR_TYPE: 'numeric';
export function numericValidator(this: CellProperties, value: CellValue, callback: (valid: boolean) => void): void;
