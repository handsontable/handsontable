import assert from 'node:assert/strict';

/**
 * A count of the work that the string and regular expression built-ins do, to tell a linear scan from a quadratic one
 * without a clock. A clock cannot: the same code is 3 times slower on a loaded runner, and a limit loose enough for
 * that cannot see a regression that is only 10 times slower.
 *
 * `measureWork()` runs a function with the methods of `String.prototype` and `RegExp.prototype` wrapped, and adds up
 * what each call reads or copies: the distance a search scans (to the match, or to the end of the text when there is
 * none), the length of a slice, and the length of the text for a call that reads it all. A scan that starts again at
 * the beginning for each of n matches, a slice of the whole text for each of n edits, or an expression run over the
 * rest of the text from each of n offsets adds n times the length of the text, and the count grows with the square of
 * the input. A linear scan grows with the input, so quadrupling the input quadruples the count.
 *
 * It does not see a loop that indexes a string (`text[index]`) or the inside of one regular expression match, so it
 * guards the calls a scanner makes and not a catastrophic pattern. A scanner that walks its own arrays reports its
 * steps instead (`scanScripts()` takes a `stats` object), and a catastrophic pattern is held by the tests that compare
 * a scanner with the expression it replaced.
 *
 * @module helpers/work-meter
 */

const SCANS = ['indexOf', 'lastIndexOf', 'includes', 'startsWith', 'endsWith'];
const COPIES = ['slice', 'substring', 'substr', 'repeat', 'padStart', 'padEnd'];
const WHOLE = [
  'split', 'matchAll', 'replaceAll', 'trim', 'trimStart', 'trimEnd', 'toLowerCase', 'toUpperCase', 'normalize',
  'concat', 'localeCompare',
];
// These stop at the first match unless the expression is global. A string argument is a search for that string.
const FIRST_MATCH = ['replace', 'match', 'search'];
const REGEXP_WHOLE = [Symbol.matchAll, Symbol.split];
const REGEXP_FIRST = [Symbol.replace, Symbol.match, Symbol.search];

/**
 * Wrap a method of a prototype, remembering how to put it back.
 *
 * @param {object} prototype The prototype.
 * @param {string|symbol} name The method name.
 * @param {(original: Function) => Function} wrap Makes the wrapper from the original.
 * @param {Array<() => void>} restores Receives the function that restores the method.
 * @returns {void}
 */
function patch(prototype, name, wrap, restores) {
  const descriptor = Object.getOwnPropertyDescriptor(prototype, name);

  Object.defineProperty(prototype, name, { ...descriptor, value: wrap(descriptor.value) });
  restores.push(() => Object.defineProperty(prototype, name, descriptor));
}

/**
 * What a failed match read. A sticky expression tries one position, and an expression anchored at the start of the
 * text tries one, so neither reads the rest of the text. Any other expression read to the end of it.
 *
 * @param {RegExp} expression The expression.
 * @param {number} rest The characters from where it started to the end of the text.
 * @returns {number} The characters read.
 */
function failure(expression, rest) {
  return expression.sticky || (expression.source.startsWith('^') && !expression.multiline) ? 1 : rest;
}

/**
 * Run a function and count the work of the string and regular expression built-ins it calls.
 *
 * @param {() => unknown} body What to run. It may be async: the count is final when the promise settles.
 * @param {Map<string, number>} [breakdown] Receives the work of each built-in, by name.
 * @returns {Promise<number>} The work, in characters read or copied.
 */
export async function measureWork(body, breakdown = new Map()) {
  const restores = [];
  const originalExec = RegExp.prototype.exec;
  const originalIndexOf = String.prototype.indexOf;
  let total = 0;

  const add = (label, amount) => {
    const work = Math.max(1, amount);

    total += work;
    breakdown.set(label, (breakdown.get(label) ?? 0) + work);
  };

  for (const name of SCANS) {
    patch(String.prototype, name, original => function(...args) {
      const text = String(this);
      const start = Math.min(Math.max(Number(args[1]) || 0, 0), text.length);
      const result = Reflect.apply(original, this, args);

      if (name === 'lastIndexOf') {
        add(`String#${name}`, typeof result === 'number' && result >= 0 ? text.length - result : text.length);
      } else if (name === 'indexOf') {
        add(`String#${name}`, result === -1 ? text.length - start : result - start + String(args[0]).length);
      } else {
        add(`String#${name}`, result ? String(args[0]).length : text.length - start);
      }

      return result;
    }, restores);
  }

  for (const name of COPIES) {
    patch(String.prototype, name, original => function(...args) {
      const result = Reflect.apply(original, this, args);

      add(`String#${name}`, String(result).length);

      return result;
    }, restores);
  }

  for (const name of WHOLE) {
    patch(String.prototype, name, original => function(...args) {
      add(`String#${name}`, String(this).length);

      return Reflect.apply(original, this, args);
    }, restores);
  }

  patch(RegExp.prototype, 'exec', original => function(text) {
    const input = String(text);
    const start = this.global || this.sticky ? this.lastIndex : 0;
    const result = Reflect.apply(original, this, [text]);

    add('RegExp#exec', result ? result.index + result[0].length - start : failure(this, input.length - start));

    return result;
  }, restores);
  /**
   * How far an expression reads before it answers: to the end of the first match, or to the end of the text. A global or
   * sticky expression starts at its `lastIndex` and reads all matches when `all` is set.
   *
   * @param {RegExp} expression The expression.
   * @param {string} text The text.
   * @param {boolean} all Whether the call goes on to every match.
   * @returns {number} The characters read.
   */
  const reach = (expression, text, all) => {
    if (all && expression.global) {
      return text.length;
    }

    const probe = new RegExp(expression.source, expression.flags);
    const start = expression.global || expression.sticky ? expression.lastIndex : 0;

    probe.lastIndex = start;

    const found = Reflect.apply(originalExec, probe, [text]);

    return found ? found.index + found[0].length - start : failure(expression, text.length - start);
  };

  patch(RegExp.prototype, 'test', original => function(text) {
    add('RegExp#test', reach(this, String(text), false));

    return Reflect.apply(original, this, [text]);
  }, restores);

  for (const name of REGEXP_WHOLE) {
    patch(RegExp.prototype, name, original => function(text, ...rest) {
      add(`RegExp#${String(name)}`, String(text).length);

      return Reflect.apply(original, this, [text, ...rest]);
    }, restores);
  }

  for (const name of REGEXP_FIRST) {
    patch(RegExp.prototype, name, original => function(text, ...rest) {
      add(`RegExp#${String(name)}`, reach(this, String(text), true));

      return Reflect.apply(original, this, [text, ...rest]);
    }, restores);
  }

  for (const name of FIRST_MATCH) {
    patch(String.prototype, name, original => function(pattern, ...rest) {
      if (!(pattern instanceof RegExp)) {
        // The expression, when there is one, counts in its own wrapper.
        const text = String(this);
        const at = Reflect.apply(originalIndexOf, text, [String(pattern)]);

        add(`String#${name}`, at === -1 ? text.length : at + String(pattern).length);
      }

      return Reflect.apply(original, this, [pattern, ...rest]);
    }, restores);
  }

  try {
    await body();
  } finally {
    restores.reverse().forEach(restore => restore());
  }

  return total;
}

/**
 * Assert that the work grows in step with the input: the work at four times the input is at most `limit` times the
 * work at the input (a linear scan gives 4, a scan that starts again for each item gives 16).
 *
 * @param {object} options Options.
 * @param {(size: number) => unknown} options.input Builds the input for a size.
 * @param {(input: unknown) => unknown} options.run Runs the code under test on an input. It may be async.
 * @param {number} options.size The smaller size.
 * @param {number} [options.limit] The largest ratio that still counts as linear. The default is 5.
 * @returns {Promise<{small: number, large: number}>} The two counts, for a further assertion.
 */
export async function measureGrowth({ input, run, size, limit = 5 }) {
  const smallParts = new Map();
  const largeParts = new Map();
  const small = await measureWork(() => run(input(size)), smallParts);
  const large = await measureWork(() => run(input(size * 4)), largeParts);
  const worst = [...largeParts].map(([name, work]) => [name, work / (smallParts.get(name) ?? 1)])
    .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, ratio]) => `${name} x${ratio.toFixed(1)}`).join(', ');

  assert.ok(small > 1000, `the code did almost no work (${small}), so the count says nothing`);
  assert.ok(large <= small * limit, `the work grew ${(large / small).toFixed(1)} times for 4 times the input `
    + `(${small} to ${large}), and a linear scan grows 4 times. The fastest growing: ${worst}`);

  return { small, large };
}
