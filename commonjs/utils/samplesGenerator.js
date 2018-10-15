'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _object = require('./../helpers/object');

var _number = require('./../helpers/number');

var _mixed = require('./../helpers/mixed');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class SamplesGenerator
 * @util
 */
var SamplesGenerator = function () {
  _createClass(SamplesGenerator, null, [{
    key: 'SAMPLE_COUNT',

    /**
     * Number of samples to take of each value length.
     *
     * @type {Number}
     */
    get: function get() {
      return 3;
    }
  }]);

  function SamplesGenerator(dataFactory) {
    _classCallCheck(this, SamplesGenerator);

    /**
     * Samples prepared for calculations.
     *
     * @type {Map}
     * @default {null}
     */
    this.samples = null;
    /**
     * Function which give the data to collect samples.
     *
     * @type {Function}
     */
    this.dataFactory = dataFactory;
    /**
     * Custom number of samples to take of each value length.
     *
     * @type {Number}
     * @default {null}
     */
    this.customSampleCount = null;
    /**
     * `true` if duplicate samples collection should be allowed, `false` otherwise.
     *
     * @type {Boolean}
     * @default {false}
     */
    this.allowDuplicates = false;
  }

  /**
   * Get the sample count for this instance.
   *
   * @returns {Number}
   */


  _createClass(SamplesGenerator, [{
    key: 'getSampleCount',
    value: function getSampleCount() {
      if (this.customSampleCount) {
        return this.customSampleCount;
      }
      return SamplesGenerator.SAMPLE_COUNT;
    }

    /**
     * Set the sample count.
     *
     * @param {Number} sampleCount Number of samples to be collected.
     */

  }, {
    key: 'setSampleCount',
    value: function setSampleCount(sampleCount) {
      this.customSampleCount = sampleCount;
    }

    /**
     * Set if the generator should accept duplicate values.
     *
     * @param {Boolean} allowDuplicates `true` to allow duplicate values.
     */

  }, {
    key: 'setAllowDuplicates',
    value: function setAllowDuplicates(allowDuplicates) {
      this.allowDuplicates = allowDuplicates;
    }

    /**
     * Generate samples for row. You can control which area should be sampled by passing `rowRange` object and `colRange` object.
     *
     * @param {Object|Number} rowRange
     * @param {Object} colRange
     * @returns {Object}
     */

  }, {
    key: 'generateRowSamples',
    value: function generateRowSamples(rowRange, colRange) {
      return this.generateSamples('row', colRange, rowRange);
    }

    /**
     * Generate samples for column. You can control which area should be sampled by passing `colRange` object and `rowRange` object.
     *
     * @param {Object} colRange Column index.
     * @param {Object} rowRange Column index.
     * @returns {Object}
     */

  }, {
    key: 'generateColumnSamples',
    value: function generateColumnSamples(colRange, rowRange) {
      return this.generateSamples('col', rowRange, colRange);
    }

    /**
     * Generate collection of samples.
     *
     * @param {String} type Type to generate. Can be `col` or `row`.
     * @param {Object} range
     * @param {Object|Number} specifierRange
     * @returns {Map}
     */

  }, {
    key: 'generateSamples',
    value: function generateSamples(type, range, specifierRange) {
      var _this = this;

      var samples = new Map();

      var _ref = typeof specifierRange === 'number' ? { from: specifierRange, to: specifierRange } : specifierRange,
          from = _ref.from,
          to = _ref.to;

      (0, _number.rangeEach)(from, to, function (index) {
        var sample = _this.generateSample(type, range, index);

        samples.set(index, sample);
      });

      return samples;
    }

    /**
     * Generate sample for specified type (`row` or `col`).
     *
     * @param {String} type Samples type `row` or `col`.
     * @param {Object} range
     * @param {Number} specifierValue
     * @returns {Map}
     */

  }, {
    key: 'generateSample',
    value: function generateSample(type, range, specifierValue) {
      var _this2 = this;

      if (type !== 'row' && type !== 'col') {
        throw new Error('Unsupported sample type');
      }

      var samples = new Map();
      var computedKey = type === 'row' ? 'col' : 'row';
      var sampledValues = [];

      (0, _number.rangeEach)(range.from, range.to, function (index) {
        var _ref2 = type === 'row' ? _this2.dataFactory(specifierValue, index) : _this2.dataFactory(index, specifierValue),
            value = _ref2.value,
            bundleCountSeed = _ref2.bundleCountSeed;

        var hasCustomBundleSeed = bundleCountSeed > 0;
        var length = void 0;

        if ((0, _object.isObject)(value)) {
          length = Object.keys(value).length;
        } else if (Array.isArray(value)) {
          length = value.length;
        } else {
          length = (0, _mixed.stringify)(value).length;
        }

        if (hasCustomBundleSeed) {
          length += bundleCountSeed;
        }

        if (!samples.has(length)) {
          samples.set(length, {
            needed: _this2.getSampleCount(),
            strings: []
          });
        }
        var sample = samples.get(length);

        if (sample.needed) {
          var duplicate = sampledValues.indexOf(value) > -1;

          if (!duplicate || _this2.allowDuplicates || hasCustomBundleSeed) {
            sample.strings.push(_defineProperty({ value: value }, computedKey, index));
            sampledValues.push(value);
            sample.needed -= 1;
          }
        }
      });

      return samples;
    }
  }]);

  return SamplesGenerator;
}();

exports.default = SamplesGenerator;