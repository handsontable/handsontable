import { CellProperties } from '../../settings';
import { CellValue } from '../../common';

export const VALIDATOR_TYPE: 'intlTime';
export function sourceDataValidator(value: CellValue, cellProperties: CellProperties): boolean;
export function intlTimeValidator(this: CellProperties, value: CellValue, callback: (valid: boolean) => void): void;
