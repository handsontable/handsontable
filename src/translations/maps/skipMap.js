import ValueMap from './valueMap';

/**
 * Map for storing mappings from an physical index to a boolean value.
 */
class SkipMap extends ValueMap {
  constructor(initValueOrFn = false) {
    super(initValueOrFn);
  }
}

export default SkipMap;
