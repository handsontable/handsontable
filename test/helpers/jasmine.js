/* eslint-disable import/prefer-default-export */
let currentSpec;

export function spec() {
  return currentSpec;
}

jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

beforeEach(function() {
  currentSpec = this;

  const matchers = {
    toBeInArray() {
      return {
        compare(actual, expected) {
          return {
            pass: Array.isArray(expected) && expected.indexOf(actual) > -1
          };
        }
      };
    },
    toBeFunction() {
      return {
        compare(actual) {
          return {
            pass: typeof actual === 'function'
          };
        }
      };
    },
    toBeAroundValue() {
      return {
        compare(actual, expected, diff) {
          const margin = diff || 1;

          const pass = actual >= expected - margin && actual <= expected + margin;
          let message = `Expected ${actual} to be around ${expected} (between ${expected - margin} and ${expected + margin})`;

          if (!pass) {
            message = `Expected ${actual} NOT to be around ${expected} (between ${expected - margin} and ${expected + margin})`;
          }

          return {
            pass,
            message
          };
        }
      };
    }
  };

  jasmine.addMatchers(matchers);

  if (document.activeElement && document.activeElement !== document.body) {
    document.activeElement.blur();
  } else if (!document.activeElement) { // IE
    document.body.focus();
  }
});

afterEach(() => {
  window.scrollTo(0, 0);
});
