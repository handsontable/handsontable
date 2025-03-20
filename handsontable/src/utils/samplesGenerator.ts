import { isObject } from './../helpers/object';
import { rangeEach } from './../helpers/number';
import { stringify } from './../helpers/mixed';

interface Range {
  from: number;
  to: number;
}

interface SampleData {
  value: any;
  bundleSeed?: string;
}

interface Sample {
  needed: number;
  strings: Array<{
    value: any;
    col?: number;
    row?: number;
  }>;
}

type DataFactory = (row: number, col: number) => SampleData | false;

/**
 * @class SamplesGenerator
 */
class SamplesGenerator {
  /**
   * Number of samples to take of each value length.
   *
   * @type {number}
   */
  static get SAMPLE_COUNT(): number {
    return 3;
  }
  /**
   * Samples prepared for calculations.
   *
   * @type {Map}
   * @default {null}
   */
  samples: Map<string, Sample> | null = null;
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
  allowDuplicates: boolean = false;

  constructor(dataFactory: DataFactory) {
    this.dataFactory = dataFactory;
  }

  /**
   * Get the sample count for this instance.
   *
   * @returns {number}
   */
  getSampleCount(): number {
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
  setSampleCount(sampleCount: number): void {
    this.customSampleCount = sampleCount;
  }

  /**
   * Set if the generator should accept duplicate values.
   *
   * @param {boolean} allowDuplicates `true` to allow duplicate values.
   */
  setAllowDuplicates(allowDuplicates: boolean): void {
    this.allowDuplicates = allowDuplicates;
  }

  /**
   * Generate samples for row. You can control which area should be sampled by passing `rowRange` object and `colRange` object.
   *
   * @param {object|number} rowRange The rows range to generate the samples.
   * @param {object} colRange The column range to generate the samples.
   * @returns {object}
   */
  generateRowSamples(rowRange: Range | number, colRange: Range): Map<number, Sample> {
    return this.generateSamples('row', colRange, rowRange);
  }

  /**
   * Generate samples for column. You can control which area should be sampled by passing `colRange` object and `rowRange` object.
   *
   * @param {object} colRange Column index.
   * @param {object} rowRange Column index.
   * @returns {object}
   */
  generateColumnSamples(colRange: Range, rowRange: Range): Map<number, Sample> {
    return this.generateSamples('col', rowRange, colRange);
  }

  /**
   * Generate collection of samples.
   *
   * @param {string} type Type to generate. Can be `col` or `row`.
   * @param {object} range The range to generate the samples.
   * @param {object|number} specifierRange The range to generate the samples.
   * @returns {Map}
   */
  generateSamples(type: 'row' | 'col', range: Range, specifierRange: Range | number): Map<number, Sample> {
    const samples = new Map<number, Sample>();
    const { from, to } = typeof specifierRange === 'number' ?
      { from: specifierRange, to: specifierRange } : specifierRange;

    rangeEach(from, to, (index) => {
      const sample = this.generateSample(type, range, index);
      if (sample) {
        samples.set(index, sample as unknown as Sample);
      }
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
  generateSample(type: 'row' | 'col', range: Range, specifierValue: number): Map<string, Sample> {
    if (type !== 'row' && type !== 'col') {
      throw new Error('Unsupported sample type');
    }

    const samples = new Map<string, Sample>();
    const computedKey = type === 'row' ? 'col' : 'row';
    const sampledValues: any[] = [];

    if (!this.dataFactory) {
      return samples;
    }

    const dataFactory = this.dataFactory;

    rangeEach(range.from, range.to, (index) => {
      const data = type === 'row' ?
        dataFactory(specifierValue, index) : dataFactory(index, specifierValue);

      if (data === false) {
        return;
      }

      const { value, bundleSeed } = data;
      const hasCustomBundleSeed = typeof bundleSeed === 'string' && bundleSeed.length > 0;
      let seed: string;

      if (hasCustomBundleSeed) {
        seed = bundleSeed;

      } else if (isObject(value)) {
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
      if (!sample) {
        return;
      }

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
