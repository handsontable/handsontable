function MultiMap() {
  const map = {
    arrayMap: [],
    weakMap: new WeakMap(),
  };

  return {
    get(key) {
      if (canBeAnArrayMapKey(key)) {
        return map.arrayMap[key];
      } else if (canBeAWeakMapKey(key)) {
        return map.weakMap.get(key);
      }
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
