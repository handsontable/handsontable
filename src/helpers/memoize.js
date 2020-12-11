
import microMemoize from 'micro-memoize';

export const memoize = (fn) => {
  const newFn = microMemoize(fn, { maxSize: Infinity });
  newFn.cache.orderByLru = (key, value, index) => {
    newFn.cache.keys[index] = key;
    newFn.cache.values[index] = value;
  }
  newFn.clear = () => {
    newFn.cache.keys.length = 0;
    newFn.cache.values.length = 0;
  }
  return newFn;
}

export const unmemoize = (fn) => {
  fn.clear = () => {};
  return fn;
}
