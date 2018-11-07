beforeEach(() => {
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
});
