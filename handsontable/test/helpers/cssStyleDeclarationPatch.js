/**
 * The `cssstyle` speed patch itself, without applying it. `test/jsdomComputedStyleSpeed.js` applies it
 * for every spec file; `test/__tests__/jsdomComputedStyleSpeed.unit.js` imports this file instead, so
 * that importing it cannot be what makes the patch "applied" in that spec.
 */
const crypto = require('crypto');

// MD5 of `CSSStyleDeclaration.prototype._setProperty.toString()` in `cssstyle@2.3.0`.
const SUPPORTED_SOURCE_HASH = '190ea18a6b17cc68ee787b65e60c2884';
const NOOP_CALLBACK_SOURCE = /^function\s*\(\)\s*\{\s*return;\s*\}$/;

/**
 * Hashes a function's source.
 *
 * @param {Function} fn The function.
 * @returns {string}
 */
function hashSource(fn) {
  return crypto.createHash('md5').update(Function.prototype.toString.call(fn)).digest('hex');
}

/**
 * Applies the patch to a `CSSStyleDeclaration` class.
 *
 * @param {Function} CSSStyleDeclaration The class jsdom exposes on `window`.
 * @returns {boolean} `true` when the prototype was patched.
 */
function patchCssStyleDeclaration(CSSStyleDeclaration) {
  const proto = CSSStyleDeclaration && CSSStyleDeclaration.prototype;

  if (!proto || typeof proto._setProperty !== 'function' || proto._setProperty.__htFast) {
    return false;
  }

  if (hashSource(proto._setProperty) !== SUPPORTED_SOURCE_HASH) {
    return false;
  }

  const original = proto._setProperty;

  proto._setProperty = function(name, value, priority) {
    const onChange = this._onChange;

    if (typeof onChange !== 'function' || !NOOP_CALLBACK_SOURCE.test(Function.prototype.toString.call(onChange))) {
      return original.call(this, name, value, priority);
    }

    if (value === undefined) {
      return undefined;
    }

    if (value === null || value === '') {
      this.removeProperty(name);

      return undefined;
    }

    if (this._values[name]) {
      // Property already exists. Overwrite it.
      if (Array.prototype.indexOf.call(this, name) < 0) {
        this[this._length] = name;
        this._length += 1;
      }
    } else {
      // New property.
      this[this._length] = name;
      this._length += 1;
    }

    this._values[name] = value;
    this._importants[name] = priority;

    return undefined;
  };
  proto._setProperty.__htFast = true;

  return true;
}

module.exports = { patchCssStyleDeclaration, hashSource };
