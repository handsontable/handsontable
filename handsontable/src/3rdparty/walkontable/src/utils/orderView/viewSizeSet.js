import { ViewSize } from './viewSize';
import { WORKING_SPACE_ALL, WORKING_SPACE_TOP, WORKING_SPACE_BOTTOM } from './constants';

/**
 * The class is a source of the truth of information about the current and
 * next size of the rendered DOM elements and current and next offset of
 * the view. That information allows us to calculate diff between current
 * DOM order and this which should be rendered without touching the DOM API at all.
 *
 * Mostly the ViewSizeSet is created for each individual renderer. But in
 * the table, there is one case where this size information should be shared
 * between two different instances (different table renderers). This is a TR
 * element which can contain TH elements - managed by own renderer and
 * TD elements - managed by another renderer. To generate correct DOM order
 * for them it is required to connect these two instances by reference
 * through `sharedSize`.
 *
 * @class {ViewSizeSet}
 */
export class ViewSizeSet {
  /**
   * Holder for current and next view size and offset.
   *
   * @type {ViewSize}
   */
  size = new ViewSize();
  /**
   * Defines if this instance shares its size with another instance. If it's in the shared
   * mode it defines what space it occupies ('top' or 'bottom').
   *
   * @type {number}
   */
  workingSpace = WORKING_SPACE_ALL;
  /**
   * Shared Size instance.
   *
   * @type {ViewSize}
   */
  sharedSize = null;

  /**
   * Sets the size for rendered elements. It can be a size for rows, cells or size for row
   * headers etc.
   *
   * @param {number} size The size.
   */
  setSize(size) {
    this.size.setSize(size);
  }

  /**
   * Sets the offset for rendered elements. The offset describes the shift between 0 and
   * the first rendered element according to the scroll position.
   *
   * @param {number} offset The offset.
   */
  setOffset(offset) {
    this.size.setOffset(offset);
  }

  /**
   * Returns ViewSize instance.
   *
   * @returns {ViewSize}
   */
  getViewSize() {
    return this.size;
  }

  /**
   * Checks if this ViewSizeSet is sharing the size with another instance.
   *
   * @returns {boolean}
   */
  isShared() {
    return this.sharedSize !== null;
  }

  /**
   * Checks what working space describes this size instance.
   *
   * @param {number} workingSpace The number which describes the type of the working space (see constants.js).
   * @returns {boolean}
   */
  isPlaceOn(workingSpace) {
    return this.workingSpace === workingSpace;
  }

  /**
   * Appends the ViewSizeSet instance to this instance that turns it into a shared mode.
   *
   * @param {ViewSizeSet} viewSize The instance of the ViewSizeSet class.
   */
  append(viewSize) {
    this.workingSpace = WORKING_SPACE_TOP;
    viewSize.workingSpace = WORKING_SPACE_BOTTOM;
    this.sharedSize = viewSize.getViewSize();
  }

  /**
   * Prepends the ViewSize instance to this instance that turns it into a shared mode.
   *
   * @param {ViewSizeSet} viewSize The instance of the ViewSizeSet class.
   */
  prepend(viewSize) {
    this.workingSpace = WORKING_SPACE_BOTTOM;
    viewSize.workingSpace = WORKING_SPACE_TOP;
    this.sharedSize = viewSize.getViewSize();
  }
}
