import ValueMap from './valueMap';

/**
 * Map from physical indexes to boolean value.
 */
class HiddenMap extends ValueMap {
  constructor(initValueOrFn = false) {
    super(initValueOrFn);
  }
}

export default HiddenMap;
