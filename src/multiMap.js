function MultiMap() {
  var map = {
    arrayMap: [],
    weakMap: new WeakMap(),
  };

  return {
    get(key) {
      let result;

      if (canBeAnArrayMapKey(key)) {
        result = map.arrayMap[key];
      } else if (canBeAWeakMapKey(key)) {
        result = map.weakMap.get(key);
      }

      return result;
    },

    set(key, value) {
      if (canBeAnArrayMapKey(key)) {
        map.arrayMap[key] = value;
      } else if (canBeAWeakMapKey(key)) {
        map.weakMap.set(key, value);
      } else {
        throw new Error('Invalid key type');
      }
    },

    delete(key) {
      if (canBeAnArrayMapKey(key)) {
        delete map.arrayMap[key];
      } else if (canBeAWeakMapKey(key)) {
        map.weakMap.delete(key);
      }
    },
  };

  function canBeAnArrayMapKey(obj) {
    return obj !== null && !isNaNSymbol(obj) && (typeof obj === 'string' || typeof obj === 'number');
  }

  function canBeAWeakMapKey(obj) {
    return obj !== null && (typeof obj === 'object' || typeof obj === 'function');
  }

  function isNaNSymbol(obj) {
    /* eslint-disable no-self-compare */
    return obj !== obj; // NaN === NaN is always false
  }
}

export default MultiMap;
