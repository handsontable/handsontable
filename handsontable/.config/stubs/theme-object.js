// Minimal stub - only exports what themeBuilder actually uses
export function isObject(object) {
  return Object.prototype.toString.call(object) === '[object Object]';
}

export function deepClone(obj) {
  if (typeof obj === 'object') {
    return JSON.parse(JSON.stringify(obj));
  }
  return obj;
}

export function deepMerge(target = {}, source = {}) {
  const result = { ...target };

  Object.keys(source).forEach((key) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return;
    }
    const sourceValue = source[key];
    const targetValue = result[key];

    if (isObject(sourceValue) && isObject(targetValue)) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      result[key] = sourceValue;
    }
  });

  return result;
}

