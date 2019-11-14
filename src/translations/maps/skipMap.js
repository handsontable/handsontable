import PhysicalIndexToValueMap from './physicalIndexToValueMap';

/**
 * Map for storing mappings from an physical index to a boolean value.
 */
class SkipMap extends PhysicalIndexToValueMap {
  constructor(initValueOrFn = false) {
    super(initValueOrFn);
  }
}

export default SkipMap;
