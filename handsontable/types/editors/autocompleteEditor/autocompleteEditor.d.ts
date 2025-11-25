import Core from '../../core';
import { HandsontableEditor } from '../handsontableEditor';

export const EDITOR_TYPE: 'autocomplete';

type ChoiceObject = {
  key: any;
  value: any;
};
type ChoiceArray = (string | number)[] | ChoiceObject[];

export class AutocompleteEditor extends HandsontableEditor {
  constructor(instance: Core);

  query: string;
  strippedChoices: ChoiceArray;
  rawChoices: ChoiceArray;

  queryChoices(query: string): void;
  updateChoicesList(choicesList: ChoiceArray): void;
}
export namespace AutocompleteEditor {
  export function sortByRelevance(value: any, choices: string[], caseSensitive: boolean): number[];
}
