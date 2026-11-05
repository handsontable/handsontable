import { resolve } from 'node:path';
import transformer from '../babelJestTransformer';

const ROOT = resolve(__dirname, '../..');
const SOURCE = 'export const version = process.env.HOT_VERSION;';
const SOURCE_PATH = resolve(ROOT, 'src/example.ts');

/**
 * Returns the cache key babel-jest would compute for the sample source under the current
 * environment.
 *
 * @returns {string}
 */
function cacheKey() {
  return transformer.getCacheKey(SOURCE, SOURCE_PATH, {
    config: { cwd: ROOT, rootDir: ROOT },
    configString: '{}',
    instrument: false,
    transformerConfig: {},
  });
}

/**
 * `babel.config.js` inlines `process.env.*` at transform time, so a transform cached under one
 * `HOT_VERSION` is wrong under another. The key has to move with the variables the source reads,
 * and stay put for the build date, which changes on every run.
 */
describe('babel-jest cache key', () => {
  const saved = {};

  beforeEach(() => {
    [...transformer.INLINED_ENV_KEYS, 'HOT_BUILD_DATE'].forEach((name) => {
      saved[name] = process.env[name];
    });
  });

  afterEach(() => {
    Object.entries(saved).forEach(([name, value]) => {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    });
  });

  it('should return the same key for the same environment', () => {
    process.env.HOT_VERSION = '19.0.0';

    expect(cacheKey()).toBe(cacheKey());
  });

  it('should change when an inlined variable changes', () => {
    process.env.HOT_VERSION = '19.0.0';

    const before = cacheKey();

    process.env.HOT_VERSION = '19.0.1';

    expect(cacheKey()).not.toBe(before);
  });

  it('should not change with the build date, which every run stamps anew', () => {
    process.env.HOT_BUILD_DATE = '05/11/2026 10:00:00';

    const before = cacheKey();

    process.env.HOT_BUILD_DATE = '05/11/2026 10:00:01';

    expect(cacheKey()).toBe(before);
  });
});
