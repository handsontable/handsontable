import Core from '../../core';
import { HandsontableEditor } from '../handsontableEditor';

export const EDITOR_TYPE: 'autocomplete';

export class AutocompleteEditor extends HandsontableEditor {
  constructor(instance: Core);

  query: string;
  strippedChoices: string[];
  rawChoices: string[];

  getValue(): string;
  queryChoices(query: string): void;
  updateChoicesList(choicesList: string[]): void;
  flipDropdownIfNeeded(): boolean;
  limitDropdownIfNeeded(spaceAvailable: number, dropdownHeight: number): void;
  flipDropdown(dropdownHeight: number): void;
  unflipDropdown(): void;
  updateDropdownDimensions(): void;
  setDropdownHeight(height: number): void;
  highlightBestMatchingChoice(index?: number): void;
  getDropdownHeight(): number;
  stripValueIfNeeded(value: string): string;
  stripValuesIfNeeded(values: string[]): string[];
}
export namespace AutocompleteEditor {
  export function sortByRelevance(value: any, choices: string[], caseSensitive: boolean): number[];
}
