import { isPlainObject } from './../helpers/object';
import { throwWithCause } from '../helpers/errors';
import { rangeEach } from './../helpers/number';
import { stringify } from './../helpers/mixed';

type DataFactoryResult = false | { value: unknown; bundleSeed?: string };
type DataFactory = (row: number, col: number, instance: SamplesGenerator) => DataFactoryResult;

/**
 * @class SamplesGenerator
 */
class SamplesGenerator {
  /**
   * Number of samples to take of each value length.
   *
   * @type {number}
   */
  static get SAMPLE_COUNT() {
    return 3;
  }
  /**
   * Samples prepared for calculations.
   *
   * @type {Map}
   * @default {null}
   */
  samples: Map<string | number, object> | null = null;
  /**
   * Function which give the data to collect samples.
   *
   * @type {Function}
   */
  dataFactory: DataFactory | null = null;
  /**
   * Custom number of samples to take of each value length.
   *
   * @type {number}
   * @default {null}
   */
  customSampleCount: number | null = null;
  /**
   * `true` if duplicate samples collection should be allowed, `false` otherwise.
   *
   * @type {boolean}
   * @default {false}
   */
  allowDuplicates = false;
  /**
   * `true` if hidden samples should be included, `false` otherwise.
   *
   * @type {boolean}
   * @default {false}
   */
  includeHidden = false;

  constructor(dataFactory: DataFactory) {
    this.dataFactory = dataFactory;
  }

  /**
   * Get the sample count for this instance.
   *
   * @returns {number}
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
   * @param {number} sampleCount Number of samples to be collected.
   */
  setSampleCount(sampleCount: number) {
    this.customSampleCount = sampleCount;
  }

  /**
   * Set if the generator should accept duplicate values.
   *
   * @param {boolean} allowDuplicates `true` to allow duplicate values.
   */
  setAllowDuplicates(allowDuplicates: boolean) {
    this.allowDuplicates = allowDuplicates as boolean;
  }

  /**
   * Sets the sampler to the mode where it will generate samples for hidden indexes.
   *
   * @param {boolean} includeHidden `true` to include hidden indexes, `false` otherwise.
   */
  setIncludeHidden(includeHidden: boolean) {
    this.includeHidden = includeHidden as boolean;
  }

  /**
   * Generate samples for row. You can control which area should be sampled by passing `rowRange` object and `colRange` object.
   *
   * @param {object|number} rowRange The rows range to generate the samples.
   * @param {object} colRange The column range to generate the samples.
   * @returns {object}
   */
  generateRowSamples(rowRange: unknown, colRange: unknown) {
    return this.generateSamples('row', colRange as { from: number; to: number }, rowRange);
  }

  /**
   * Generate samples for column. You can control which area should be sampled by passing `colRange` object and `rowRange` object.
   *
   * @param {object} colRange Column index.
   * @param {object} rowRange Column index.
   * @returns {object}
   */
  generateColumnSamples(colRange: unknown, rowRange: unknown) {
    return this.generateSamples('col', rowRange as { from: number; to: number }, colRange);
  }

  /**
   * Generate collection of samples.
   *
   * @param {string} type Type to generate. Can be `col` or `row`.
   * @param {object} range The range to generate the samples.
   * @param {object|number} specifierRange The range to generate the samples.
   * @returns {Map}
   */
  generateSamples(type: string, range: { from: number; to: number }, specifierRange: unknown) {
    const samples = new Map();
    const { from, to } = typeof specifierRange === 'number' ?
      { from: specifierRange, to: specifierRange } : specifierRange as { from: number; to: number };

    rangeEach(from, to, (index) => {
      const sample = this.generateSample(type, range, index);

      samples.set(index, sample);
    });

    return samples;
  }

  /**
   * Generate sample for specified type (`row` or `col`).
   *
   * @param {string} type Samples type `row` or `col`.
   * @param {object} range The range to generate the samples.
   * @param {number} specifierValue The range to generate the samples.
   * @returns {Map}
   */
  generateSample(type: string, range: { from: number; to: number }, specifierValue: number) {
    if (type !== 'row' && type !== 'col') {
      throwWithCause('Unsupported sample type');
    }

    const samples = new Map();
    const computedKey = type === 'row' ? 'col' : 'row';
    const sampledValues: unknown[] = [];

    rangeEach(range.from, range.to, (index) => {
      const data = type === 'row' ?
        this.dataFactory!(specifierValue, index, this) : this.dataFactory!(index, specifierValue, this);

      if (data === false) {
        return;
      }

      const { value, bundleSeed } = data;
      const hasCustomBundleSeed = typeof bundleSeed === 'string' && bundleSeed.length > 0;
      let seed;

      if (hasCustomBundleSeed) {
        seed = bundleSeed;

      } else if (isPlainObject(value)) {
        seed = `${Object.keys(value).length}`;

      } else if (Array.isArray(value)) {
        seed = `${value.length}`;

      } else {
        seed = `${stringify(value).length}`;
      }

      if (!samples.has(seed)) {
        samples.set(seed, {
          needed: this.getSampleCount(),
          strings: [],
        });
      }
      const sample = samples.get(seed);

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
