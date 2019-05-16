import ViewSize from './viewSize';
import { SHARED_WORKING_SPACE_UNSET, SHARED_WORKING_SPACE_TOP, SHARED_WORKING_SPACE_BOTTOM } from './constants';

export default class ViewSizeSet {
  constructor() {
    this.size = new ViewSize();
    this.sharedSizeWorkingSpace = SHARED_WORKING_SPACE_UNSET;
    this.sharedSize = null;
  }

  setSize(size) {
    this.size.setSize(size);
  }

  setOffset(offset) {
    this.size.setOffset(offset);
  }

  getSize() {
    return this.size.getSize();
  }

  canAppend(index) {
    if (this.sharedSizeWorkingSpace === SHARED_WORKING_SPACE_BOTTOM) {
      return index < this.sharedSize.nextOffset;
    }

    return true;
  }

  append(size) {
    this.sharedSizeWorkingSpace = SHARED_WORKING_SPACE_BOTTOM;
    this.sharedSize = size;
  }

  prepend(size) {
    this.sharedSizeWorkingSpace = SHARED_WORKING_SPACE_TOP;
    this.sharedSize = size;
  }
}
