import PhysicalIndexToValueMap from './physicalIndexToValueMap';

/**
 * Map for storing mappings from an physical index to a boolean value. It stores information whether physical index is
 * included in a dataset, but skipped in the process of rendering.
 */
class HidingMap extends PhysicalIndexToValueMap {
  constructor(initValueOrFn = false) {
    super(initValueOrFn);
  }

  /**
   * Get physical indexes which are hidden.
   *
   * Note: Indexes marked as hidden are included in a {@link DataMap}, but aren't rendered.
   *
   * @returns {Array}
   */
  getHiddenIndexes() {
    return this.getIndexesByValue(true);
  }

  /**
   * Get physical indexes which are NOT hidden.
   *
   * @returns {Array}
   */
  getNotHiddenIndexes() {
    return this.getIndexesByValue(false);
  }
}

export default HidingMap;
