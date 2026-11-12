import { propertyName, unwrapPath } from '../lib/ast.mjs';
import { collectHotBindings } from '../lib/hot-bindings.mjs';
import { rewrites } from '../lib/safety.mjs';
import { lookup, referenceSpace } from '../lib/scope.mjs';
import { problemsOf } from '../lib/validate.mjs';

const CALL_TYPES = new Set(['CallExpression', 'OptionalCallExpression']);
const MEMBER_TYPES = ['MemberExpression', 'OptionalMemberExpression'];

/**
 * One `callUnwrap` rule prepared for matching.
 *
 * @typedef {object} Spec
 * @property {import('../types.mjs').Rule} rule The manifest rule.
 * @property {string} member Path under the namespace, `helper.sanitize` for `Handsontable.helper.sanitize`.
 * @property {string} prefix `helper`, the path of the object that holds the function (empty for a function on the
 * namespace itself).
 * @property {string} last `sanitize`, the function name.
 * @property {number} arg Index of the argument that replaces the call.
 */

/**
 * Check a rule's fields and turn it into a `Spec`.
 *
 * @param {import('../types.mjs').Rule} rule A `callUnwrap` rule.
 * @returns {Spec} The prepared rule.
 * @throws {Error} When `callee` is not a dotted path or `arg` is not a non-negative integer.
 */
function prepare(rule) {
  const parts = rule.callee.split('.');
  const arg = rule.arg ?? 0;

  if (parts.length < 2 || parts.some(part => !part)) {
    throw new Error(`Rule ${rule.id} needs "callee" to be a dotted path such as "Handsontable.helper.sanitize".`);
  }

  if (!Number.isInteger(arg) || arg < 0) {
    throw new Error(`Rule ${rule.id} needs "arg" to be a non-negative integer.`);
  }

  const path = parts.slice(1);

  return { rule, member: path.join('.'), prefix: path.slice(0, -1).join('.'), last: path.at(-1), arg };
}

/**
 * Find the local names that alias a rule's function: `const clean = Handsontable.helper.sanitize` and
 * `const { sanitize } = Handsontable.helper`. Only `const` bindings count.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The file's Collection.
 * @param {Spec[]} specs Prepared rules.
 * @param {import('../lib/hot-bindings.mjs').HotBindings} bindings Bindings of the file.
 * @returns {Map<object, Spec>} Declaring identifier node to the rule it aliases.
 */
function findAliases(j, root, specs, bindings) {
  const aliases = new Map();

  root.find(j.VariableDeclarator).forEach((path) => {
    const { id, init } = path.node;

    if (!init || path.parent.node.kind !== 'const') {
      return;
    }

    const initPath = path.get('init');

    for (const spec of specs) {
      if (id.type === 'Identifier' && bindings.resolveNamespaceMember(initPath) === spec.member) {
        aliases.set(id, spec);
      } else if (id.type === 'ObjectPattern') {
        const holder = spec.prefix === ''
          ? bindings.isNamespaceIdentifier(unwrapPath(initPath))
          : bindings.resolveNamespaceMember(initPath) === spec.prefix;

        for (const property of holder ? id.properties : []) {
          if (property.type !== 'RestElement' && propertyName(property) === spec.last
            && property.value?.type === 'Identifier') {
            aliases.set(property.value, spec);
          }
        }
      }
    }
  });

  return aliases;
}

/**
 * The rule a callee expression refers to, directly through the namespace or through a `const` alias.
 *
 * @param {object} path NodePath of an expression.
 * @param {Spec[]} specs Prepared rules.
 * @param {Map<object, Spec>} aliases Alias table from `findAliases`.
 * @param {import('../lib/hot-bindings.mjs').HotBindings} bindings Bindings of the file.
 * @returns {Spec|null} The rule, or `null`.
 */
function specOf(path, specs, aliases, bindings) {
  const target = unwrapPath(path);

  if (target.node.type === 'Identifier') {
    const binding = referenceSpace(target) === 'value' ? lookup(target, target.node.name, 'value') : null;

    return binding ? aliases.get(binding.idNode) ?? null : null;
  }

  if (!MEMBER_TYPES.includes(target.node.type)) {
    return null;
  }

  const member = bindings.resolveNamespaceMember(target);

  return specs.find(spec => spec.member === member) ?? null;
}

/**
 * Replaces a call with one of its arguments, for functions that became a pass-through, such as
 * `Handsontable.helper.sanitize(html)` to `html`.
 *
 * The callee must resolve to the rule's path under a namespace binding of the file (see
 * `resolveNamespaceMember`), directly or through a `const` alias (`const { sanitize } = Handsontable.helper`).
 * The argument node is printed in place of the call, and recast adds the parentheses that precedence needs
 * (`sanitize(a || b).trim()` becomes `(a || b).trim()`). The alias declaration stays, because the tool never
 * deletes a declaration it did not create.
 *
 * A call is only reported (`manual`) when it has a spread, an argument besides the replaced one, or an optional
 * call or chain; when the function is used without a call; and for every match when the rule's `safe` is not
 * `true`. The last case is how a rule says "this changes behavior": unwrapping a function that used to do work
 * silently drops that work.
 *
 * @type {import('../types.mjs').Transform}
 */
const callUnwrap = {
  kinds: ['callUnwrap'],
  fileKinds: ['js'],

  /**
   * @param {import('../types.mjs').Rule} rule A `callUnwrap` rule.
   * @returns {string[]} The problems of the rule.
   */
  validate(rule) {
    return problemsOf(() => prepare(rule));
  },

  /**
   * @param {import('../types.mjs').Ctx} ctx Context of a `js` part.
   * @param {import('../types.mjs').Rule[]} rules `callUnwrap` rules.
   * @returns {void}
   */
  apply(ctx, rules) {
    const { j, root } = ctx;
    const specs = rules.map(prepare).filter(spec => ctx.source.includes(spec.last));

    if (specs.length === 0) {
      return;
    }

    const bindings = collectHotBindings(j, root);

    if (!bindings.isHotFile) {
      return;
    }

    const aliases = findAliases(j, root, specs, bindings);
    const handled = new Set();
    const manual = (spec, node, text) => ctx.report({
      ruleId: spec.rule.id,
      severity: 'manual',
      line: node.loc?.start?.line,
      message: `${text} ${spec.rule.advice ?? ''}`.trim(),
    });

    const calls = new Map();

    CALL_TYPES.forEach(type => root.find(j[type]).forEach(path => calls.set(path.node, path)));

    for (const call of calls.values()) {
      const calleePath = unwrapPath(call.get('callee'));
      const spec = specOf(calleePath, specs, aliases, bindings);

      if (!spec) {
        continue;
      }

      handled.add(calleePath.node);

      const { arguments: args } = call.node;
      const label = `${spec.rule.callee}()`;

      if (call.node.type === 'OptionalCallExpression' || calleePath.node.type === 'OptionalMemberExpression') {
        manual(spec, call.node, `Replace ${label} by hand: it is called through an optional chain.`);
      } else if (args.length !== spec.arg + 1 || args.some(arg => arg.type === 'SpreadElement')) {
        manual(spec, call.node, `Replace ${label} by hand: it has other arguments than the one that replaces it.`);
      } else if (!rewrites(spec.rule)) {
        manual(spec, call.node, `Review ${label} by hand.`);
      } else {
        const argument = args[spec.arg];

        if (call.node.comments?.length) {
          argument.comments = [...call.node.comments, ...(argument.comments ?? [])];
        }

        call.replace(argument);
        ctx.markChanged();
        ctx.report({
          ruleId: spec.rule.id,
          severity: 'changed',
          line: call.node.loc?.start?.line,
          message: `Replaced ${label} with its argument.${spec.rule.message ? ` ${spec.rule.message}` : ''}`,
        });
      }
    }

    const members = new Map();

    MEMBER_TYPES.forEach(type => root.find(j[type]).forEach(path => members.set(path.node, path)));
    members.forEach((path) => {
      const declaresAlias = path.parent.node.type === 'VariableDeclarator' && aliases.has(path.parent.node.id);
      const spec = handled.has(path.node) || declaresAlias ? null : specOf(path, specs, new Map(), bindings);

      if (spec) {
        manual(spec, path.node, `Replace ${spec.rule.callee} by hand: it is used without a call.`);
      }
    });

    if (aliases.size === 0) {
      return;
    }

    root.find(j.Identifier).forEach((path) => {
      const spec = aliases.has(path.node) || handled.has(path.node) ? null : specOf(path, specs, aliases, bindings);

      if (spec) {
        manual(spec, path.node, `Replace ${spec.rule.callee} by hand: it is used without a call.`);
      }
    });
  },
};

export default callUnwrap;
