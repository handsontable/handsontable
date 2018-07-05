/* eslint-disable import/prefer-default-export */

import {ASC_SORT_STATE, DESC_SORT_STATE} from './sortedColumnStates';

const HEADER_CLASS_ASC_SORT = 'ascending';
const HEADER_CLASS_DESC_SORT = 'descending';
export const HEADER_CLASS = 'colHeader';
export const HEADER_CLASS_SORTING = 'columnSorting';

const stateToCssClass = new Map([
  [ASC_SORT_STATE, HEADER_CLASS_ASC_SORT],
  [DESC_SORT_STATE, HEADER_CLASS_DESC_SORT]
]);

const indexToCssClass = new Map([
  [0, 'first'],
  [1, 'second'],
  [2, 'third'],
  [3, 'fourth'],
  [4, 'fifth'],
  [5, 'sixth'],
  [6, 'seventh']
]);

export class ClassHelper {
  constructor(sortedColumnStates) {
    this.states = sortedColumnStates;
  }

  getAddedClasses(physicalColumn, showSortIndicator) {
    const cssClasses = [HEADER_CLASS_SORTING];

    if (this.states.isSorted(physicalColumn) && showSortIndicator) {
      const state = this.states.getByColumn(physicalColumn);

      cssClasses.push(stateToCssClass.get(state));

      if (this.states.getSize() > 1) {
        cssClasses.push(indexToCssClass.get(this.states.indexOf(physicalColumn)));
      }
    }

    return cssClasses;
  }

  getRemovedClasses() {
    const cssClasses = Array.from(stateToCssClass.values()).concat(Array.from((indexToCssClass.values())));

    return cssClasses;
  }
}
