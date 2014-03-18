(function (window) {
  'use strict';

  function MultiMap(){
    var map = {
      arrayMap: [],
      weakMap: new WeakMap()
    };

    this.get = function (key) {
      if (canBeAnArrayMapKey(key)){
        return map.arrayMap[key];
      } else if (canBeAWeakMapKey(key)){
        return map.weakMap.get(key);
      }
    };

    this.set = function (key, value) {
      if (canBeAnArrayMapKey(key)){
        map.arrayMap[key] = value;
      } else if (canBeAWeakMapKey(key)){
        map.weakMap.set(key, value);
      } else {
        throw new Error('Invalid key type');
      }


    };

    this.delete = function (key) {
      if (canBeAnArrayMapKey(key)){
        delete map.arrayMap[key];
      } else if (canBeAWeakMapKey(key)){
        map.weakMap.delete(key);
      }
    };

    function canBeAnArrayMapKey(obj){
      return obj !== null && !isNaNSymbol(obj) && (typeof obj == 'string' || typeof obj == 'number');
    }

    function canBeAWeakMapKey(obj){
      return obj !== null && (typeof obj == 'object' || typeof obj == 'function');
    }

    function isNaNSymbol(obj){
      return obj !== obj; // NaN === NaN is always false
    }

  }

  if (!window.MultiMap){
    window.MultiMap = MultiMap;
  }

})(window);