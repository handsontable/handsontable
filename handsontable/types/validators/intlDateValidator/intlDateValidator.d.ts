import { CellProperties } from '../../settings';
import { CellValue } from '../../common';

export const VALIDATOR_TYPE: 'intl-date';
export function sourceDataValidator(value: CellValue, cellProperties: CellProperties): boolean;
export function intlDateValidator(this: CellProperties, value: CellValue, callback: (valid: boolean) => void): void;
