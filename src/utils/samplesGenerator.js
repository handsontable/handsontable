import Handsontable from './../browser';
import {addClass, outerHeight, outerWidth} from './../helpers/dom/element';
import {arrayEach} from './../helpers/array';
import {objectEach, isObject} from './../helpers/object';
import {rangeEach} from './../helpers/number';
import {stringify} from './../helpers/mixed';

/**
 * @class SamplesGenerator
 * @util
 */
class SamplesGenerator {
  /**
   * Number of samples to take of each value length.
   *
   * @type {Number}
   */
  static get SAMPLE_COUNT() {
    return 3;
  }

  constructor(dataFactory) {
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
  }

  /**
   * Get the sample count for this instance.
   *
   * @returns {Number}
   */
  getSampleCount() {
    if (this.customSampleCount) {
      return this.customSampleCount;
    }
    return SamplesGenerator.SAMPLE_COUNT;
  };

  /**
   * Generate samples for row. You can control which area should be sampled by passing `rowRange` object and `colRange` object.
   *
   * @param {Object|Number} rowRange
   * @param {Object} colRange
   * @returns {Object}
   */
  generateRowSamples(rowRange, colRange) {
    return this.generateSamples('row', colRange, rowRange);
  }

  /**
   * Generate samples for column. You can control which area should be sampled by passing `colRange` object and `rowRange` object.
   *
   * @param {Object} colRange Column index.
   * @param {Object} rowRange Column index.
   * @returns {Object}
   */
  generateColumnSamples(colRange, rowRange) {
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
  generateSamples(type, range, specifierRange) {
    const samples = new Map();

    if (typeof specifierRange === 'number') {
      specifierRange = {from: specifierRange, to: specifierRange};
    }
    rangeEach(specifierRange.from, specifierRange.to, (index) => {
      const sample = this.generateSample(type, range, index);

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
  generateSample(type, range, specifierValue) {
    const samples = new Map();
    let sampledValues = [];
    let length;

    rangeEach(range.from, range.to, (index) => {
      let value;

      if (type === 'row') {
        value = this.dataFactory(specifierValue, index);

      } else if (type === 'col') {
        value = this.dataFactory(index, specifierValue);

      } else {
        throw new Error('Unsupported sample type');
      }

      if (isObject(value)) {
        length = Object.keys(value).length;

      } else if (Array.isArray(value)) {
        length = value.length;

      } else {
        length = stringify(value).length;
      }

      if (!samples.has(length)) {
        samples.set(length, {
          needed: this.getSampleCount(),
          strings: [],
        });
      }
      let sample = samples.get(length);

      if (sample.needed) {
        let duplicate = sampledValues.indexOf(value) > -1;

        if (!duplicate) {
          let computedKey = type === 'row' ? 'col' : 'row';

          sample.strings.push({value, [computedKey]: index});
          sampledValues.push(value);
          sample.needed--;
        }
      }
    });

    return samples;
  }
}

export {SamplesGenerator};

// temp for tests only!
Handsontable.utils.SamplesGenerator = SamplesGenerator;
