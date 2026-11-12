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

    if (['includes', 'indexOf'].includes(memberName(callee)) && list?.type === 'ArrayExpression'
      && list.elements.some(element => stringValue(unwrapNode(element)) === 'innerHTML')) {
      return { kind: 'includes', line: parent.node.loc?.start?.line };
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
 * A test is `redundant` when the function also handles `'header'` in the same place: an operand of an `||` chain
 * with `source === 'header'`, or a `case 'innerHTML'` label in a fall-through group with `case 'header'`. Such a
 * test is dead code in 18.1, and the migration guide says to delete it.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} functionPath NodePath of the function.
 * @param {object} parameter The `Identifier` node of the `source` parameter.
 * @returns {Array<{line: number, redundant: boolean}>} The tests in source order, one per line.
 */
function innerHtmlTests(j, functionPath, parameter) {
  const uses = sourceReferences(j, functionPath, parameter).map(classify);
  const headerTests = new Set(uses.filter(use => use.kind === 'compare' && use.text === 'header'
    && EQUALITY.has(use.operator)).map(use => use.binary.node));
  const tests = new Map();

  for (const use of uses) {
    if (use.kind === 'compare' && use.text === 'innerHTML') {
      let top = use.binary;

      while (top.parent?.node.type === 'LogicalExpression' && top.parent.node.operator === '||') {
        top = top.parent;
      }

      const redundant = EQUALITY.has(use.operator) && top !== use.binary
        && orLeaves(top.node).some(leaf => headerTests.has(leaf));

      tests.set(use.binary.node.loc?.start?.line, redundant);
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

        tests.set(cases[index].loc?.start?.line, cases.slice(start, end + 1).some(item => hasLabel(item, 'header')));
      }
    } else if (use.kind === 'includes') {
      tests.set(use.line, false);
    }
  }

  return [...tests].filter(([line]) => line !== undefined).sort(([a], [b]) => a - b)
    .map(([line, redundant]) => ({ line, redundant }));
}

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

    innerHtmlTests(j, path, parameter).forEach(({ line, redundant }) => ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      line,
      message: redundant
        ? 'Handsontable 18.1 passes \'header\' for nested header measurement, and this function already handles '
          + 'it, so this \'innerHTML\' test no longer matches anything the grid sends. Delete it, unless your code '
          + 'also passes this sanitizer to Handsontable.dom.fastInnerHTML() without a context, which still passes '
          + '\'innerHTML\'.'
        : 'Handsontable 18.1 no longer passes \'innerHTML\' to the sanitizer option: nested header measurement '
          + 'now uses \'header\'. Move what this branch does to the \'header\' branch, or delete it. Keep it only '
          + 'if your code also passes this sanitizer to Handsontable.dom.fastInnerHTML() without a context.',
    }));

    if (sourceReferences(j, path, parameter).length > 0) {
      ctx.report({
        ruleId: rule.id,
        severity: 'manual',
        line: path.node.loc?.start?.line,
        message: 'This sanitizer reads its source argument. Handsontable 18.1 passes \'dialog\' for dialog content, '
          + 'where 18.0 passed undefined. If your default branch handled undefined, add a \'dialog\' branch when '
          + 'dialog content needs different treatment.',
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
 * Report the two sources a sanitizer sees for the first time in 18.1, once per sanitizer that reads its source
 * argument or looks like it escapes HTML. A sanitizer that strips markup and ignores its source is not affected.
 *
 * @param {import('../../../src/types.mjs').Ctx} ctx Context of a js part.
 * @param {import('../../../src/types.mjs').Rule} rule The `new-sources` rule.
 * @returns {void}
 */
function applyNewSources(ctx, rule) {
  for (const path of findSanitizers(ctx)) {
    const parameter = sourceParameter(path.node);
    const readsSource = parameter ? sourceReferences(ctx.j, path, parameter).length > 0 : false;

    if (readsSource || ESCAPING.test(textOf(ctx, path))) {
      ctx.report({
        ruleId: rule.id,
        severity: 'manual',
        line: path.node.loc?.start?.line,
        message: 'Handsontable 18.1 also passes password cell text (source \'password\') and its own clipboard '
          + 'payload (source \'CopyPaste.paste.sourceData\') to this sanitizer. If it escapes HTML instead of '
          + 'stripping it, return the \'CopyPaste.paste.sourceData\' content unchanged, or an object-valued cell '
          + 'arrives as text after a paste.',
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
