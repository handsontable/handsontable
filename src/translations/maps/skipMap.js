import ValueMap from './valueMap';

/**
 * Map from physical indexes to boolean value.
 */
class SkipMap extends ValueMap {
  constructor(initValueOrFn = false) {
    super(initValueOrFn);
  }
}

export default SkipMap;
