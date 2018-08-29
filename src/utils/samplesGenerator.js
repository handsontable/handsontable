import { isObject } from './../helpers/object';
import { rangeEach } from './../helpers/number';
import { stringify } from './../helpers/mixed';

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
  getSampleCount() {
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
  setSampleCount(sampleCount) {
    this.customSampleCount = sampleCount;
  }

  /**
   * Set if the generator should accept duplicate values.
   *
   * @param {Boolean} allowDuplicates `true` to allow duplicate values.
   */
  setAllowDuplicates(allowDuplicates) {
    this.allowDuplicates = allowDuplicates;
  }

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
    const { from, to } = typeof specifierRange === 'number' ? { from: specifierRange, to: specifierRange } : specifierRange;

    rangeEach(from, to, (index) => {
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
    if (type !== 'row' && type !== 'col') {
      throw new Error('Unsupported sample type');
    }

    const samples = new Map();
    const computedKey = type === 'row' ? 'col' : 'row';
    const sampledValues = [];

    rangeEach(range.from, range.to, (index) => {
      const { value, bundleCountSeed } = type === 'row' ? this.dataFactory(specifierValue, index) : this.dataFactory(index, specifierValue);
      const hasCustomBundleSeed = bundleCountSeed > 0;
      let length;

      if (isObject(value)) {
        length = Object.keys(value).length;

      } else if (Array.isArray(value)) {
        length = value.length;

      } else {
        length = stringify(value).length;
      }

      if (hasCustomBundleSeed) {
        length += bundleCountSeed;
      }

      if (!samples.has(length)) {
        samples.set(length, {
          needed: this.getSampleCount(),
          strings: [],
        });
      }
      const sample = samples.get(length);

      if (sample.needed) {
        const duplicate = sampledValues.indexOf(value) > -1;

        if (!duplicate || this.allowDuplicates || hasCustomBundleSeed) {
          sample.strings.push({ value, [computedKey]: index });
          sampledValues.push(value);
          sample.needed -= 1;
        }
      }
    });

    return samples;
  }
}

export default SamplesGenerator;
