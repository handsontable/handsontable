import PhysicalIndexToValueMap from './physicalIndexToValueMap';

/**
 * Map for storing mappings from an physical index to a boolean value. It stores information whether physical index is
 * included in a dataset, but skipped in the process of rendering.
 */
class HidingMap extends PhysicalIndexToValueMap {
  constructor(initValueOrFn = false) {
    super(initValueOrFn);
  }
}

export default HidingMap;
