import { CellProperties } from '../../settings';
import { CellValue } from '../../common';

export const VALIDATOR_TYPE: 'autocomplete';
export function autocompleteValidator(this: CellProperties, value: CellValue, callback: (valid: boolean) => void): void;
