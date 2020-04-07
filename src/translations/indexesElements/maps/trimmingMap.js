import PhysicalIndexToValueMap from './physicalIndexToValueMap';

/**
 * Map for storing mappings from an physical index to a boolean value. It stores information whether physical index is
 * NOT included in a dataset and skipped in the process of rendering.
 */
class TrimmingMap extends PhysicalIndexToValueMap {
  constructor(initValueOrFn = false) {
    super(initValueOrFn);
  }
}

export default TrimmingMap;
