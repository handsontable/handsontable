import { isFunctionNode, memberName, stringValue, unwrapNode, unwrapPath } from '../../../src/lib/ast.mjs';
import { collectHotBindings } from '../../../src/lib/hot-bindings.mjs';
import {
  findJsxOptionAttributes,
  findOptionObjects,
  getProperties,
  getPropertyValue,
} from '../../../src/lib/option-objects.mjs';
import { lookup, referenceSpace } from '../../../src/lib/scope.mjs';

const EQUALITY = new Set(['===', '==']);
const COMPARISONS = new Set(['===', '==', '!==', '!=']);
const WRAPPERS = new Set(['TSAsExpression', 'TSSatisfiesExpression', 'TSNonNullExpression', 'TSTypeAssertion',
  'ParenthesizedExpression']);
const ESCAPING = /&lt;|&amp;|&quot;|escape|textContent|innerText|encode/i;

/**
 * Climb out of type assertions and parentheses.
 *
 * @param {object} path A NodePath.
 * @returns {object} The outermost NodePath of the wrapped expression.
 */
function climb(path) {
  let current = path;

  while (current.parent && WRAPPERS.has(current.parent.node.type) && current.parent.node.expression === current.node) {
    current = current.parent;
  }

  return current;
}

/**
 * Resolve the value of a `sanitizer` option to the function it stands for: a function written there, or a
 * `const`, `let`, `var`, or function declaration of the same file that the option names.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @param {object} valuePath NodePath of the option value.
 * @returns {object|null} NodePath of the function, or `null` when it cannot be resolved.
 */
function resolveFunction(j, root, valuePath) {
  const target = unwrapPath(valuePath);

  if (isFunctionNode(target.node)) {
    return target;
  }

  const binding = target.node.type === 'Identifier' ? lookup(target, target.node.name) : null;

  if (binding?.kind === 'function') {
    return root.find(j.FunctionDeclaration).filter(path => path.node === binding.node).paths()[0] ?? null;
  }

  if (binding && ['const', 'let', 'var'].includes(binding.kind) && binding.init) {
    const declaration = root.find(j.VariableDeclarator).filter(path => path.node === binding.node).paths()[0];
    const init = declaration ? unwrapPath(declaration.get('init')) : null;

    return init && isFunctionNode(init.node) ? init : null;
  }

  return null;
}

/**
 * Find the functions that are the value of a grid `sanitizer` option: a `sanitizer` property of an option object,
 * or a `sanitizer` prop of `<HotTable>`.
 *
 * @param {import('../../../src/types.mjs').Ctx} ctx Context of a js part.
 * @returns {object[]} NodePaths of the functions, each once, in source order.
 */
function findSanitizers(ctx) {
  const { j, root } = ctx;
  const bindings = collectHotBindings(j, root);
  const holders = [];

  findOptionObjects(j, root, bindings, { aggressive: ctx.options.aggressive }).forEach((item) => {
    const property = getProperties(item.path).filter(({ name }) => name === 'sanitizer').pop();

    if (property) {
      holders.push(getPropertyValue(property.path));
    }
  });
  findJsxOptionAttributes(j, root, bindings)
    .filter(attribute => attribute.name === 'sanitizer' && attribute.valuePath)
    .forEach(attribute => holders.push(attribute.valuePath));

  const found = new Map();

  for (const holder of holders) {
    const resolved = resolveFunction(j, root, holder);

    if (resolved && !found.has(resolved.node)) {
      found.set(resolved.node, resolved);
    }
  }

  return [...found.values()].sort((a, b) => (a.node.start ?? 0) - (b.node.start ?? 0));
}

/**
 * The identifier node of the second parameter of a function: the `source` argument.
 *
 * @param {object} functionNode A function node.
 * @returns {object|null} The `Identifier`, or `null` when the function has no plain second parameter.
 */
function sourceParameter(functionNode) {
  const parameter = functionNode.params[1];
  const identifier = parameter?.type === 'AssignmentPattern' ? parameter.left : parameter;

  return identifier?.type === 'Identifier' ? identifier : null;
}

/**
 * Collect the references to the `source` parameter inside the function body.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} functionPath NodePath of the function.
 * @param {object} parameter The `Identifier` node of the parameter.
 * @returns {object[]} NodePaths of the references, shadowed names excluded.
 */
function sourceReferences(j, functionPath, parameter) {
  return j(functionPath).find(j.Identifier, { name: parameter.name }).paths().filter(path => path.node !== parameter
    && referenceSpace(path) === 'value' && lookup(path, parameter.name)?.idNode === parameter);
}

/**
 * Read a reference as a comparison, a `switch` discriminant, or an `includes()` argument.
 *
 * @param {object} reference NodePath of a reference to the `source` parameter.
 * @returns {{kind: 'compare'|'switch'|'includes'|'other', binary?: object, switchPath?: object,
 * text?: string|null, operator?: string, line?: number}} What the reference is used for.
 */
function classify(reference) {
  const outer = climb(reference);
  const parent = outer.parent;

  if (parent?.node.type === 'BinaryExpression' && COMPARISONS.has(parent.node.operator)) {
    const other = parent.node.left === outer.node ? parent.node.right : parent.node.left;

    return { kind: 'compare', binary: parent, text: stringValue(unwrapNode(other)), operator: parent.node.operator };
  }

  if (parent?.node.type === 'SwitchStatement' && parent.node.discriminant === outer.node) {
    return { kind: 'switch', switchPath: parent };
  }

  if (parent?.node.type === 'CallExpression' && parent.node.arguments[0] === outer.node) {
    const callee = unwrapNode(parent.node.callee);
    const list = unwrapNode(callee.object);

    const labels = list?.type === 'ArrayExpression'
      ? list.elements.map(element => stringValue(unwrapNode(element))) : [];

    const relevant = labels.some(text => ['innerHTML', 'header'].includes(text));

    if (['includes', 'indexOf'].includes(memberName(callee)) && relevant) {
      return {
        kind: 'includes',
        line: parent.node.loc?.start?.line,
        inner: labels.includes('innerHTML'),
        header: labels.includes('header'),
      };
    }
  }

  return { kind: 'other' };
}

/**
 * Leaves of a chain of `||` expressions.
 *
 * @param {object} node An expression node.
 * @returns {object[]} The operand nodes that are not themselves `||` expressions.
 */
function orLeaves(node) {
  return node.type === 'LogicalExpression' && node.operator === '||'
    ? [...orLeaves(node.left), ...orLeaves(node.right)] : [node];
}

/**
 * Whether a `switch` case holds a string label.
 *
 * @param {object} caseNode A `SwitchCase` node.
 * @param {string} text The string.
 * @returns {boolean} `true` when the case tests that string.
 */
function hasLabel(caseNode, text) {
  return caseNode.test !== null && stringValue(unwrapNode(caseNode.test)) === text;
}

/**
 * Where the function still tests its source argument against `'innerHTML'`: a comparison with any operator, a
 * `switch` label, or `['...', 'innerHTML'].includes(source)`. Another variable that holds the same string is not
 * the source argument and is not listed.
 *
 * Each test has a `shape`, which decides what the report says:
 *
 * - `same-place`: the function also handles `'header'` in the same place, as an operand of an `||` chain with
 *   `source === 'header'`, a `case 'innerHTML'` label in a fall-through group with `case 'header'`, or one list.
 *   The test is dead code in 18.1, and the migration guide says to delete it.
 * - `elsewhere`: the function handles `'header'` in another place, so header content already has its own branch.
 * - `none`: the function never names `'header'`. In 18.0 its rendered headers took the default branch and only
 *   the offscreen measuring pass reached the `'innerHTML'` branch.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} functionPath NodePath of the function.
 * @param {object} parameter The `Identifier` node of the `source` parameter.
 * @returns {Array<{line: number, shape: 'same-place'|'elsewhere'|'none'}>} The tests in source order, one per
 * line.
 */
function innerHtmlTests(j, functionPath, parameter) {
  const uses = sourceReferences(j, functionPath, parameter).map(classify);
  const headerTests = new Set(uses.filter(use => use.kind === 'compare' && use.text === 'header'
    && EQUALITY.has(use.operator)).map(use => use.binary.node));
  const handlesHeader = headerTests.size > 0
    || uses.some(use => (use.kind === 'includes' && use.header)
      || (use.kind === 'switch' && use.switchPath.node.cases.some(item => hasLabel(item, 'header'))));
  const tests = new Map();
  const elsewhere = handlesHeader ? 'elsewhere' : 'none';
  const shapeOf = samePlace => (samePlace ? 'same-place' : elsewhere);

  for (const use of uses) {
    if (use.kind === 'compare' && use.text === 'innerHTML') {
      let top = use.binary;

      while (top.parent?.node.type === 'LogicalExpression' && top.parent.node.operator === '||') {
        top = top.parent;
      }

      const redundant = EQUALITY.has(use.operator) && top !== use.binary
        && orLeaves(top.node).some(leaf => headerTests.has(leaf));

      tests.set(use.binary.node.loc?.start?.line, shapeOf(redundant));
    } else if (use.kind === 'switch') {
      const { cases } = use.switchPath.node;
      const index = cases.findIndex(item => hasLabel(item, 'innerHTML'));

      if (index !== -1) {
        let start = index;
        let end = index;

        while (start > 0 && cases[start - 1].consequent.length === 0) {
          start -= 1;
        }

        while (end < cases.length - 1 && cases[end].consequent.length === 0) {
          end += 1;
        }

        const group = cases.slice(start, end + 1);

        tests.set(cases[index].loc?.start?.line, shapeOf(group.some(item => hasLabel(item, 'header'))));
      }
    } else if (use.kind === 'includes' && use.inner) {
      tests.set(use.line, shapeOf(use.header));
    }
  }

  return [...tests].filter(([line]) => line !== undefined).sort(([a], [b]) => a - b)
    .map(([line, shape]) => ({ line, shape }));
}

/**
 * What the report says about an `'innerHTML'` test, by its shape (see `innerHtmlTests`). The 18.0 facts behind the
 * wording: the rendered header already reached the sanitizer as `'header'`, the offscreen pass that measures
 * nested header widths reached it as `'innerHTML'`, and 18.1 sends `'header'` from both.
 *
 * @type {Record<'same-place'|'elsewhere'|'none', string>}
 */
const INNER_HTML_ADVICE = {
  'same-place': 'Delete this \'innerHTML\' test: the same condition already handles \'header\'. 18.1 passes '
    + '\'header\' for nested header measurement, so the grid never sends \'innerHTML\' there. Keep the test only if '
    + 'your code also passes this sanitizer to Handsontable.dom.fastInnerHTML() without a context, which still sends '
    + '\'innerHTML\'.',
  elsewhere: 'Delete this \'innerHTML\' branch: 18.1 no longer passes \'innerHTML\' to the sanitizer option. In 18.0 '
    + 'only the offscreen pass that measured nested headers sent it, and rendered headers already arrived as '
    + '\'header\', which this function handles elsewhere. Both passes send \'header\' now. Keep the branch only if '
    + 'your code also passes this sanitizer to Handsontable.dom.fastInnerHTML() without a context, which still '
    + 'sends \'innerHTML\'.',
  none: 'Delete this \'innerHTML\' branch: 18.1 no longer passes \'innerHTML\' to the sanitizer option. In 18.0 '
    + 'only the offscreen pass that measured nested headers sent it. Rendered headers arrived as \'header\' and took '
    + 'your default branch, because this function never handles \'header\', and both passes send \'header\' now. '
    + 'Do not move this branch to a \'header\' branch unless you want rendered headers treated like this branch '
    + 'treats them: that changes what they show compared with 18.0. Keep the branch only if your code also passes '
    + 'this sanitizer to Handsontable.dom.fastInnerHTML() without a context, which still sends \'innerHTML\'.',
};

/**
 * Report the `'innerHTML'` source and the `'dialog'` source for every sanitizer function. Nothing is edited.
 *
 * @param {import('../../../src/types.mjs').Ctx} ctx Context of a js part.
 * @param {import('../../../src/types.mjs').Rule} rule The `source` rule.
 * @returns {void}
 */
function applySource(ctx, rule) {
  const { j } = ctx;

  for (const path of findSanitizers(ctx)) {
    const parameter = sourceParameter(path.node);

    if (!parameter) {
      continue;
    }

    innerHtmlTests(j, path, parameter).forEach(({ line, shape }) => ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      line,
      message: INNER_HTML_ADVICE[shape],
    }));

    if (sourceReferences(j, path, parameter).length > 0) {
      ctx.report({
        ruleId: rule.id,
        severity: 'manual',
        line: path.node.loc?.start?.line,
        message: 'Add a \'dialog\' branch if dialog content needs different treatment from your default branch. '
          + 'This sanitizer reads its source argument, and Handsontable 18.1 passes \'dialog\' for dialog content, '
          + 'where 18.0 passed undefined.',
      });
    }
  }
}

/**
 * Text of a function, from the original source when the node has offsets.
 *
 * @param {import('../../../src/types.mjs').Ctx} ctx Context of a js part.
 * @param {object} functionPath NodePath of the function.
 * @returns {string} The function text.
 */
function textOf(ctx, functionPath) {
  const { start, end } = functionPath.node;

  return typeof start === 'number' && typeof end === 'number'
    ? ctx.source.slice(start, end) : ctx.j(functionPath).toSource();
}

/**
 * The identifier node of the first parameter of a function: the content argument.
 *
 * @param {object} functionNode A function node.
 * @returns {object|null} The `Identifier`, or `null` when the function has no plain first parameter.
 */
function contentParameter(functionNode) {
  const parameter = functionNode.params[0];
  const identifier = parameter?.type === 'AssignmentPattern' ? parameter.left : parameter;

  return identifier?.type === 'Identifier' ? identifier : null;
}

/**
 * Tell whether an expression is an identifier with a name.
 *
 * @param {object|null|undefined} node An expression node.
 * @param {string} name The name.
 * @returns {boolean} `true` for that identifier.
 */
function isNamed(node, name) {
  const target = node ? unwrapNode(node) : null;

  return target?.type === 'Identifier' && target.name === name;
}

/**
 * Read a condition as a test of the source argument against string literals: `explicit` for `source === 'a'` joined
 * by `||` (true for the sources it lists), `negated` for `source !== 'a'` (true for every other source).
 *
 * @param {object} node The test expression.
 * @param {string} source Name of the source parameter.
 * @returns {'explicit'|'negated'|null} The kind, or `null` for any other condition.
 */
function sourceTest(node, source) {
  const test = unwrapNode(node);

  if (test.type === 'LogicalExpression' && test.operator === '||') {
    const kinds = [sourceTest(test.left, source), sourceTest(test.right, source)];

    return kinds.every(kind => kind === 'explicit') ? 'explicit' : null;
  }

  if (test.type === 'BinaryExpression' && COMPARISONS.has(test.operator)) {
    let literal = isNamed(test.right, source) ? test.left : null;

    if (isNamed(test.left, source)) {
      literal = test.right;
    }

    if (literal && stringValue(unwrapNode(literal)) !== null) {
      return EQUALITY.has(test.operator) ? 'explicit' : 'negated';
    }
  }

  return null;
}

/**
 * The expressions a function returns for a source that no test of the source argument lists. Nothing after a
 * statement this function does not understand counts, so an unknown shape gives `null`.
 *
 * @param {object} node A statement or an expression.
 * @param {string} source Name of the source parameter.
 * @returns {object[]|null} The returned expressions, or `null` when the shape is not recognized.
 */
function defaultReturns(node, source) {
  if (node.type === 'BlockStatement') {
    return defaultReturnsOfList(node.body, source);
  }

  if (node.type === 'ReturnStatement') {
    return node.argument ? defaultReturns(node.argument, source) : null;
  }

  if (node.type === 'IfStatement') {
    const kind = sourceTest(node.test, source);

    if (kind === 'explicit' && node.alternate) {
      return defaultReturns(node.alternate, source);
    }

    return kind === 'negated' ? defaultReturns(node.consequent, source) : null;
  }

  const expression = unwrapNode(node);

  if (expression.type === 'ConditionalExpression') {
    const kind = sourceTest(expression.test, source);

    if (kind) {
      return defaultReturns(kind === 'explicit' ? expression.alternate : expression.consequent, source);
    }
  }

  return [expression];
}

/**
 * The default returns of a statement list: the first `return` the tests of the source do not guard.
 *
 * @param {object[]} statements The statements of a block.
 * @param {string} source Name of the source parameter.
 * @returns {object[]|null} The returned expressions, or `null` when the shape is not recognized.
 */
function defaultReturnsOfList(statements, source) {
  for (const statement of statements) {
    if (statement.type === 'ReturnStatement') {
      return defaultReturns(statement, source);
    }

    if (statement.type === 'IfStatement' && sourceTest(statement.test, source) === 'explicit') {
      if (statement.alternate) {
        return defaultReturns(statement.alternate, source);
      }

      continue;
    }

    if (statement.type === 'SwitchStatement' && isNamed(statement.discriminant, source)) {
      const fallback = statement.cases.find(item => item.test === null);

      if (fallback) {
        return defaultReturnsOfList(fallback.consequent, source);
      }

      continue;
    }

    return null;
  }

  return null;
}

/**
 * Tell whether a sanitizer already passes a source it was never written for through unchanged: it tests the
 * source only against listed strings, and every other source gets the content back as it came. The two sources
 * 18.1 adds then reach it as before, so nothing needs to change.
 *
 * @param {object} functionNode The sanitizer function node.
 * @returns {boolean} `true` when the default path returns the content argument.
 */
function passesOtherSourcesThrough(functionNode) {
  const source = sourceParameter(functionNode);
  const content = contentParameter(functionNode);

  if (!source || !content) {
    return false;
  }

  const results = defaultReturns(functionNode.body, source.name);

  return Boolean(results) && results.length > 0 && results.every(result => isNamed(result, content.name));
}

/**
 * The function that holds a node, so a `return` of a nested function is not read as a return of the sanitizer.
 *
 * @param {object} path NodePath of the node.
 * @returns {object|null} The function node, or `null` at the top of the file.
 */
function enclosingFunction(path) {
  for (let current = path.parent; current; current = current.parent) {
    if (isFunctionNode(current.node)) {
      return current.node;
    }
  }

  return null;
}

/**
 * Tell whether a sanitizer is one sanitizing call on its content argument, with no test of the source: every
 * return is a call that takes the content as its first argument (`DOMPurify.sanitize(html)`, `sanitizeHtml(html)`).
 * Such a function treats every source alike, so the new sources need nothing from it.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} functionPath NodePath of the function.
 * @returns {boolean} `true` when the function reads no source and only returns such calls.
 */
function wrapsContentInOneCall(j, functionPath) {
  const content = contentParameter(functionPath.node);
  const source = sourceParameter(functionPath.node);

  if (!content || (source && sourceReferences(j, functionPath, source).length > 0)) {
    return false;
  }

  const { body } = functionPath.node;
  const returned = body.type === 'BlockStatement'
    ? j(functionPath).find(j.ReturnStatement).filter(path => enclosingFunction(path) === functionPath.node)
      .paths().map(path => path.node.argument)
    : [body];
  const isWrapped = (node) => {
    const call = node ? unwrapNode(node) : null;

    return call?.type === 'CallExpression' && isNamed(call.arguments[0], content.name);
  };

  return returned.length > 0 && returned.every(isWrapped);
}

/**
 * Report the two sources a sanitizer sees for the first time in 18.1, once per sanitizer that reads its source
 * argument or looks like it escapes HTML. A sanitizer that strips markup and ignores its source is not affected,
 * and neither is one that lists the sources it changes and returns the content as it came for every other source.
 *
 * @param {import('../../../src/types.mjs').Ctx} ctx Context of a js part.
 * @param {import('../../../src/types.mjs').Rule} rule The `new-sources` rule.
 * @returns {void}
 */
function applyNewSources(ctx, rule) {
  for (const path of findSanitizers(ctx)) {
    const parameter = sourceParameter(path.node);
    const readsSource = parameter ? sourceReferences(ctx.j, path, parameter).length > 0 : false;

    if (wrapsContentInOneCall(ctx.j, path) || passesOtherSourcesThrough(path.node)) {
      continue;
    }

    if (readsSource || ESCAPING.test(textOf(ctx, path))) {
      ctx.report({
        ruleId: rule.id,
        severity: 'manual',
        line: path.node.loc?.start?.line,
        message: 'Return the \'CopyPaste.paste.sourceData\' content unchanged if this sanitizer escapes HTML. '
          + 'Handsontable 18.1 also passes password cell text (source \'password\') and its own clipboard payload '
          + '(source \'CopyPaste.paste.sourceData\') to this sanitizer. If it escapes HTML instead of stripping it, '
          + 'an object-valued cell arrives as text after a paste.',
      });
    }
  }
}

/**
 * Report-only rules for the `sanitizer` option in 18.1, found by function, not by name: a function that is the
 * value of a grid `sanitizer` option (written there, or a same-file function it names). The rule's `mode` picks
 * the check:
 *
 * - `source`: reports every test of the source argument against `'innerHTML'`, and once per function that reads
 *   its source argument, because dialog content now arrives as `'dialog'` instead of `undefined`. The `'innerHTML'`
 *   test is never edited, not even the one the migration guide says to delete: `Handsontable.dom.fastInnerHTML()`
 *   still defaults its `context` to `'innerHTML'` in 18.1, so a sanitizer that the project also passes there
 *   without a context still receives it, and removing the branch would change how that call sanitizes.
 * - `new-sources`: reports once per sanitizer function that reads its source argument or looks like it escapes
 *   HTML, because it now also sees `'password'` and `'CopyPaste.paste.sourceData'`.
 *
 * @type {{fileKinds: string[], apply: Function}}
 */
export default {
  fileKinds: ['js'],

  /**
   * @param {import('../../../src/types.mjs').Ctx} ctx Context of a js part.
   * @param {import('../../../src/types.mjs').Rule} rule A `custom` rule with a `mode`.
   * @returns {void}
   */
  apply(ctx, rule) {
    if (!/sanitizer/.test(ctx.source)) {
      return;
    }

    if (rule.mode === 'source') {
      applySource(ctx, rule);
    } else if (rule.mode === 'new-sources') {
      applyNewSources(ctx, rule);
    } else {
      throw new Error(`${rule.id}: unknown mode "${rule.mode}".`);
    }
  },
};
