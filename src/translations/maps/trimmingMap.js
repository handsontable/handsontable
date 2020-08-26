import PhysicalIndexToValueMap from './physicalIndexToValueMap';

/**
 * Map for storing mappings from an physical index to a boolean value. It stores information whether physical index is
 * NOT included in a dataset and skipped in the process of rendering.
 */
class TrimmingMap extends PhysicalIndexToValueMap {
  constructor(initValueOrFn = false) {
    super(initValueOrFn);
  }

  /**
   * Get physical indexes which are trimmed.
   *
   * Note: Indexes marked as trimmed aren't included in a {@link DataMap} and aren't rendered.
   *
   * @returns {Array}
   */
  getTrimmedIndexes() {
    return this.getIndexesByValue(true);
  }

  /**
   * Get physical indexes which are NOT trimmed.
   *
   * @returns {Array}
   */
  getNotTrimmedIndexes() {
    return this.getIndexesByValue(false);
  }
}

export default TrimmingMap;
