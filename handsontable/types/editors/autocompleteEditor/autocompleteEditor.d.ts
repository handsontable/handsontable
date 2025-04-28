import Core from '../../core';
import { HandsontableEditor } from '../handsontableEditor';

export const EDITOR_TYPE: 'autocomplete';

export class AutocompleteEditor extends HandsontableEditor {
  constructor(instance: Core);

  query: string;
  strippedChoices: string[];
  rawChoices: string[];

  queryChoices(query: string): void;
}
export namespace AutocompleteEditor {
  export function sortByRelevance(value: any, choices: string[], caseSensitive: boolean): number[];
}
