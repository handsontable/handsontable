import ValueMap from './valueMap';

/**
 * Map from physical indexes to boolean value.
 */
class SkipMap extends ValueMap {
  constructor() {
    super(false);
  }
}

export default SkipMap;
