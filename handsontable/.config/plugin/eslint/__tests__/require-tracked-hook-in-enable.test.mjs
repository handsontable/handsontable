import { test } from 'node:test';
import { createRequire } from 'node:module';
import { RuleTester } from 'eslint';

const rule = createRequire(import.meta.url)('../rules/require-tracked-hook-in-enable');

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

test('require-tracked-hook-in-enable', () => {
  ruleTester.run('require-tracked-hook-in-enable', rule, {
    valid: [
      {
        code: `
          class P {
            enablePlugin() {
              this.addHook('afterInit', () => {});
            }
          }
        `,
      },
      {
        code: `
          class P {
            constructor() {
              this.hot.addHook('afterInit', () => {});
            }
            init() {
              this.hot.addHook('afterInit', () => {});
            }
          }
        `,
      },
      {
        code: `
          class P {
            enablePlugin() {
              other.addHook('afterInit', () => {});
              this.hot.removeHook('afterInit', fn);
            }
          }
        `,
      },
    ],
    invalid: [
      {
        code: `
          class P {
            enablePlugin() {
              this.hot.addHook('afterInit', () => {});
            }
          }
        `,
        output: `
          class P {
            enablePlugin() {
              this.addHook('afterInit', () => {});
            }
          }
        `,
        errors: [{ messageId: 'useTrackedAddHook' }],
      },
      {
        code: `
          class P {
            enablePlugin() {
              if (this.enabled) {
                return;
              }
              [1].forEach(() => {
                this.hot.addHook('afterInit', () => {});
              });
            }
          }
        `,
        output: `
          class P {
            enablePlugin() {
              if (this.enabled) {
                return;
              }
              [1].forEach(() => {
                this.addHook('afterInit', () => {});
              });
            }
          }
        `,
        errors: [{ messageId: 'useTrackedAddHook' }],
      },
    ],
  });
});
