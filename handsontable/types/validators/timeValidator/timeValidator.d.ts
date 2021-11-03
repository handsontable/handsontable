import { CellProperties } from '../../settings';
import { CellValue } from '../../common';

export const VALIDATOR_TYPE: 'time';
export function timeValidator(this: CellProperties, value: CellValue, callback: (valid: boolean) => void): void;
