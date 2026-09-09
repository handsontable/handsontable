import { isPlainObject } from './../helpers/object';
import { throwWithCause } from '../helpers/errors';
import { rangeEach } from './../helpers/number';
import { stringify } from './../helpers/mixed';

type DataFactoryResult = false | { value: unknown; bundleSeed?: string };
type DataFactory = (row: number, col: number, instance: SamplesGenerator) => DataFactoryResult;
type SampleEntry = { needed: number; strings: Array<{ value: unknown; col?: number; row?: number }> };
type SampleRange = { from: number; to: number } | number[];
type SamplingOptions = { samplingRatio: unknown; allowDuplicates: boolean };

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

  /**
   * Initializes the samples generator with the data factory function used to retrieve cell values during sampling.
   */
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
   * Resolves a `samplingRatio` option into a usable sample count.
   *
   * Anything that is not a whole number above zero resolves to `null`, meaning the default
   * {@link SamplesGenerator.SAMPLE_COUNT}. That covers the option being absent, but also the values
   * that used to be stored raw and then quietly broke the sampler: `true` and `[]` became `NaN`,
   * which made every later comparison report a change because `NaN !== NaN`; a negative number
   * became a `needed` count that collected no samples at all; and the string `'6'` compared as
   * different from the number `6`.
   *
   * @param {*} samplingRatio The raw option value.
   * @returns {number|null} The sample count to use, or `null` for the default.
   */
  static resolveSampleCount(samplingRatio: unknown): number | null {
    const sampleCount = parseInt(String(samplingRatio), 10);

    return Number.isInteger(sampleCount) && sampleCount > 0 ? sampleCount : null;
  }

  /**
   * Applies both sampling options at once and reports whether either of them changed.
   *
   * Callers use the return value to decide whether the sizes they measured earlier are still
   * usable. Both options change which cells end up in a sample, so a size measured under the
   * previous options cannot be trusted once they change - the auto-size plugins answer a `true`
   * here by re-measuring.
   *
   * The raw `samplingRatio` is resolved here rather than by each caller, so that every plugin
   * reading the option agrees on what it means. See {@link SamplesGenerator.resolveSampleCount}.
   *
   * @param {object} options The sampling options to apply.
   * @param {*} options.samplingRatio The raw `samplingRatio` option value.
   * @param {boolean} options.allowDuplicates `true` to allow duplicate values.
   * @returns {boolean} `true` when at least one option changed its value.
   */
  applySamplingOptions({ samplingRatio, allowDuplicates }: SamplingOptions): boolean {
    const sampleCount = SamplesGenerator.resolveSampleCount(samplingRatio);
    const hasChanged = sampleCount !== this.customSampleCount || allowDuplicates !== this.allowDuplicates;

    this.customSampleCount = sampleCount;
    this.allowDuplicates = allowDuplicates;

    return hasChanged;
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
   * @param {object|number[]} colRange The column range (or an explicit list of column indexes) to generate the samples.
   * @returns {object}
   */
  generateRowSamples(rowRange: number | { from: number; to: number }, colRange: SampleRange) {
    return this.generateSamples('row', colRange, rowRange);
  }

  /**
   * Generate samples for column. You can control which area should be sampled by passing `colRange` object and `rowRange` object.
   *
   * @param {object|number} colRange The columns range to generate the samples.
   * @param {object|number[]} rowRange The row range (or an explicit list of row indexes) to generate the samples.
   * @returns {object}
   */
  generateColumnSamples(colRange: number | { from: number; to: number }, rowRange: SampleRange) {
    return this.generateSamples('col', rowRange, colRange);
  }

  /**
   * Generate collection of samples.
   *
   * @param {string} type Type to generate. Can be `col` or `row`.
   * @param {object|number[]} range The range (or an explicit list of indexes) to generate the samples.
   * @param {object|number} specifierRange The range to generate the samples.
   * @returns {Map}
   */
  generateSamples(type: string, range: SampleRange, specifierRange: number | { from: number; to: number }) {
    const samples = new Map();
    const { from, to } = typeof specifierRange === 'number' ?
      { from: specifierRange, to: specifierRange } : specifierRange;

    rangeEach(from, to, (index) => {
      const sample = this.generateSample(type, range, index);

      samples.set(index, sample);
    });

    return samples;
  }

  /**
   * Generate sample for specified type (`row` or `col`).
   *
   * When `existingSamples` is provided, the new samples are accumulated into it instead of a fresh
   * map. This lets callers sweep a large range in slices (e.g. one slice per animation frame)
   * while keeping the per-bucket sample limits and the duplicate detection working across slices.
   *
   * @param {string} type Samples type `row` or `col`.
   * @param {object|number[]} range The range (or an explicit list of indexes) to generate the samples.
   * @param {number} specifierValue The row (for `row` type) or column (for `col` type) index to sample.
   * @param {Map} [existingSamples] A samples map from a previous call to accumulate into.
   * @returns {Map}
   */
  generateSample(
    type: string,
    range: SampleRange,
    specifierValue: number,
    existingSamples?: Map<string, SampleEntry>
  ) {
    this.#ensureSupportedType(type);

    const samples = existingSamples ?? new Map<string, SampleEntry>();
    const computedKey = type === 'row' ? 'col' : 'row';
    const sampledValues: unknown[] = [];

    if (existingSamples) {
      existingSamples.forEach((sample) => {
        sample.strings.forEach(({ value }) => sampledValues.push(value));
      });
    }

    const collect = (index: number) => {
      const data = type === 'row' ?
        this.dataFactory!(specifierValue, index, this) : this.dataFactory!(index, specifierValue, this);

      if (data === false) {
        return;
      }

      this.#collectSample(samples, sampledValues, computedKey, index, data.value, data.bundleSeed);
    };

    if (Array.isArray(range)) {
      range.forEach(collect);
    } else {
      rangeEach(range.from, range.to, collect);
    }

    return samples;
  }

  /**
   * Generates one samples map from already-known values, bypassing the data factory. Used to
   * bucket-and-cap values that can no longer be read from the data source (e.g. the previous
   * cell values carried by a change batch).
   *
   * @param {string} type Samples type `row` or `col`.
   * @param {Array} entries An array of `{ index, value }` objects, where `index` is the
   * opposite-axis index the value belongs to (a row index for `col` type samples).
   * @returns {Map}
   */
  generateSampleFromValues(type: string, entries: Array<{ index: number; value: unknown }>) {
    this.#ensureSupportedType(type);

    const samples = new Map<string, SampleEntry>();
    const computedKey = type === 'row' ? 'col' : 'row';
    const sampledValues: unknown[] = [];

    entries.forEach(({ index, value }) => {
      this.#collectSample(samples, sampledValues, computedKey, index, value, undefined);
    });

    return samples;
  }

  /**
   * Throws when the sample type is not one of the supported `row`/`col` values.
   *
   * @param {string} type Samples type to validate.
   */
  #ensureSupportedType(type: string) {
    if (type !== 'row' && type !== 'col') {
      throwWithCause('Unsupported sample type');
    }
  }

  /**
   * Buckets a single value into the samples map, respecting the per-bucket sample limit and
   * the duplicate detection.
   *
   * @param {Map} samples The samples map to collect into.
   * @param {Array} sampledValues Values collected so far (across the whole sweep), used for duplicate detection.
   * @param {string} computedKey The key (`row` or `col`) under which the index is stored in the sample string.
   * @param {number} index The opposite-axis index the value belongs to.
   * @param {*} value The value to bucket.
   * @param {string|undefined} bundleSeed A custom bucket seed provided by the data factory.
   */
  #collectSample(
    samples: Map<string, SampleEntry>,
    sampledValues: unknown[],
    computedKey: string,
    index: number,
    value: unknown,
    bundleSeed: string | undefined
  ) {
    const customBundleSeed = typeof bundleSeed === 'string' && bundleSeed.length > 0 ? bundleSeed : null;
    const hasCustomBundleSeed = customBundleSeed !== null;
    let seed: string;

    if (customBundleSeed !== null) {
      seed = customBundleSeed;

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

    if (sample && sample.needed) {
      const duplicate = sampledValues.indexOf(value) > -1;

      if (!duplicate || this.allowDuplicates || hasCustomBundleSeed) {
        sample.strings.push({ value, [computedKey]: index });
        sampledValues.push(value);
        sample.needed -= 1;
      }
    }
  }
}

export default SamplesGenerator;
