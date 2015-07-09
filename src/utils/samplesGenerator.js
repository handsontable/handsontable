
import {addClass, outerHeight, outerWidth} from './../dom.js';
import {arrayEach, objectEach, rangeEach, stringify} from './../helpers.js';


class SamplesGenerator {
  /**
   * Number of samples to take of each value length.
   *
   * @type {Number}
   */
  static get SAMPLE_COUNT() {
    return 3;
  }

  /**
   * @param {Function} dataFactory Function which gave data to collect samples.
   */
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

    rangeEach(range.from, range.to, (index) => {
      let value;

      if (type === 'row') {
        value = this.dataFactory(specifierValue, index);

      } else if (type === 'col') {
        value = this.dataFactory(index, specifierValue);

      } else {
        throw new Error('Unsupported sample type');
      }
      if (!Array.isArray(value)) {
        value = stringify(value);
      }
      let len = value.length;

      if (!samples.has(len)) {
        samples.set(len, {
          needed: SamplesGenerator.SAMPLE_COUNT,
          strings: []
        });
      }
      let sample = samples.get(len);

      if (sample.needed) {
        sample.strings.push({value, [type === 'row' ? 'col' : 'row']: index});
        sample.needed--;
      }
    });

    return samples;
  }
}

export {SamplesGenerator};

// temp for tests
Handsontable.utils = Handsontable.utils || {};
Handsontable.utils.SamplesGenerator = SamplesGenerator;
