import { collectHotBindings } from '../lib/hot-bindings.mjs';
import { addNamedImport } from '../lib/imports.mjs';
import { reportInstead, rewrites } from '../lib/safety.mjs';
import { lookup, referenceSpace } from '../lib/scope.mjs';
import { problemsOf } from '../lib/validate.mjs';
import {
  chooseSource,
  expandAdvice,
  lazyModular,
  matchDotted,
  toList,
} from '../lib/type-rules.mjs';

const NAMESPACE_PREFIX = 'Handsontable.';
const HERITAGE_TYPES = new Set(['TSExpressionWithTypeArguments', 'TSClassImplements', 'TSInterfaceHeritage']);
const MEMBER_TYPES = new Set(['MemberExpression', 'OptionalMemberExpression']);
const CONTAINER_TYPES = new Set([
  'Program',
  'BlockStatement',
  'StaticBlock',
  'TSModuleBlock',
  'ClassBody',
  'TSInterfaceBody',
  'TSTypeLiteral',
  'SwitchCase',
]);

/**
 * Paths of a rule after the namespace root: `Handsontable.plugins.*.Settings` gives `plugins.*.Settings`.
 *
 * @param {import('../types.mjs').Rule} rule A `namespaceType` rule.
 * @returns {string[]} The dotted paths, one per entry of `from`.
 */
function memberPatterns(rule) {
  return toList(rule.from).map((from) => {
    if (!from.startsWith(NAMESPACE_PREFIX)) {
      throw new Error(`Rule ${rule.id}: "from" must start with "${NAMESPACE_PREFIX}".`);
    }

    return from.slice(NAMESPACE_PREFIX.length);
  });
}

/**
 * Check the shape of a rule. The manifest validator cannot express "`to` or `removed`".
 *
 * @param {import('../types.mjs').Rule} rule A `namespaceType` rule.
 */
function assertRule(rule) {
  memberPatterns(rule);

  if (rule.removed !== true && toList(rule.to?.source).length === 0) {
    throw new Error(`Rule ${rule.id} needs "to": { "source" } or "removed": true.`);
  }

  if (rule.removed !== true && rule.to.name === undefined && memberPatterns(rule).some(path => path.includes('*'))) {
    throw new Error(`Rule ${rule.id} needs "to.name" because "from" has a wildcard.`);
  }

  if (rule.removed === true && typeof (rule.advice ?? rule.message) !== 'string') {
    throw new Error(`Rule ${rule.id} needs "advice" with "removed": true.`);
  }

  if (rule.positions !== undefined && rule.positions !== 'type' && rule.positions !== 'any') {
    throw new Error(`Rule ${rule.id}: "positions" must be "type" or "any".`);
  }
}

/**
 * Find the first rule that matches a member path.
 *
 * @param {import('../types.mjs').Rule[]} rules The rules.
 * @param {string} member Dotted path after the namespace root.
 * @param {boolean} isType Whether the reference sits in a type position.
 * @returns {{rule: import('../types.mjs').Rule, captures: string[]}|null} The rule and what its `*` matched.
 */
function findRule(rules, member, isType) {
  for (const rule of rules) {
    const positions = rule.positions ?? 'type';
    const captures = memberPatterns(rule).map(pattern => matchDotted(pattern, member)).find(Boolean);

    if (captures && (isType || positions === 'any')) {
      return { rule, captures };
    }
  }

  return null;
}

/**
 * The statement or class member that holds a node, for a TODO comment.
 *
 * @param {object} path NodePath inside the statement.
 * @returns {object} The NodePath of the child of the nearest statement container.
 */
function enclosingStatement(path) {
  let current = path;

  while (current.parent && !CONTAINER_TYPES.has(current.parent.node.type)) {
    current = current.parent;
  }

  return current;
}

/**
 * Root identifier path of a member or qualified-name chain.
 *
 * @param {object} path NodePath of the chain.
 * @returns {object|null} The NodePath of the root `Identifier`, or `null`.
 */
function rootOf(path) {
  let current = path;

  while (current) {
    const { type } = current.node;

    if (type === 'Identifier') {
      return current;
    }

    if (type === 'TSQualifiedName') {
      current = current.get('left');
    } else if (MEMBER_TYPES.has(type)) {
      current = current.get('object');
    } else if (type === 'TSNonNullExpression' || type === 'ParenthesizedExpression') {
      current = current.get('expression');
    } else {
      return null;
    }
  }

  return null;
}

/**
 * Collect the reference nodes a rule set can match: the type name of every type reference, the expression of a
 * heritage clause, and, when a rule asks for `any` positions, every member chain.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context.
 * @param {boolean} includeValues Whether value positions count.
 * @returns {Array<{path: object, isType: boolean}>} The references in source order.
 */
function collectReferences(ctx, includeValues) {
  const { j, root } = ctx;
  const found = [];

  root.find(j.TSTypeReference).forEach(path => found.push({ path: path.get('typeName'), isType: true }));
  root.find(j.Node).filter(path => HERITAGE_TYPES.has(path.node.type) && path.node.expression)
    .forEach(path => found.push({ path: path.get('expression'), isType: true }));

  if (includeValues) {
    root.find(j.MemberExpression).forEach(path => found.push({ path, isType: false }));
    root.find(j.OptionalMemberExpression).forEach(path => found.push({ path, isType: false }));
  }

  return found;
}

/**
 * Rewrite one matched reference to a bare imported name.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context.
 * @param {object} match The match: `path`, `isType`, `rule`, `member`.
 * @param {() => boolean} isModular Lazy modular-file test.
 * @param {Set<string>} noted Rules whose note was reported already.
 */
function rewrite(ctx, match, isModular, noted) {
  const { j, root } = ctx;
  const { path, rule, member, isType } = match;
  const line = path.node.loc?.start?.line;
  const name = rule.to.name ?? member.split('.').pop();
  const rootPath = rootOf(path);
  const rootName = rootPath?.node.name;

  if (!rootPath || lookup(rootPath, rootName, referenceSpace(rootPath) ?? 'value') === null) {
    ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      line,
      message: `${NAMESPACE_PREFIX}${member} comes from the global Handsontable. Import ${name} from `
        + `"${toList(rule.to.source)[0]}" and use it instead.`,
    });

    return;
  }

  const source = chooseSource(j, root, toList(rule.to.source), { name, isModular });
  const result = addNamedImport(j, root, { source, imported: name, typeOnly: isType });

  if (result.reason === 'collision') {
    ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      line,
      message: `Could not replace ${NAMESPACE_PREFIX}${member}: this file already declares ${name}. Import `
        + `${name} from "${source}" under another name and use it instead.`,
    });

    return;
  }

  path.replace(j.identifier(result.local));
  ctx.markChanged();
  ctx.report({
    ruleId: rule.id,
    severity: 'changed',
    line,
    message: `Replaced ${NAMESPACE_PREFIX}${member} with ${result.local} imported from "${source}".`,
  });

  if (rule.note && !noted.has(rule.id)) {
    noted.add(rule.id);
    ctx.report({ ruleId: rule.id, severity: 'manual', line, message: rule.note, scope: 'run' });
  }
}

/**
 * Replaces `Handsontable.X` type members that became named exports (`Handsontable.CellCoords` as a type becomes
 * `CellCoords`, imported with `import type`), and flags the members that were removed.
 *
 * A rule has `from` (`Handsontable.<path>` or a list of them, where a `*` stands for one segment, as in
 * `Handsontable.plugins.*.Settings`) and either `to: { name, source }` (`name` defaults to the last segment of the
 * path, `source` is a module or a list of candidates) or `removed: true` with `advice`. `positions` is `type` (default) or `any`. With `type`, only type
 * references and heritage clauses are touched, so `new Handsontable.CellCoords(...)` stays as it is. A removed
 * member gets a TODO on the statement that holds it. The advice may use `{plugin}` (the segment the first `*`
 * matched) and `{optionKey}` (looked up in the rule's `optionKeys`, default the plugin name with a lower-case
 * first letter). The root must be a namespace the file imports. A global `Handsontable` and a name collision are
 * reported as `manual` and left alone.
 *
 * A rule whose `safe` is not `true` never edits code. It reports `manual` entries instead, and leaves a TODO comment
 * when the rule asks for one (see `lib/safety.mjs`).
 *
 * @type {import('../types.mjs').Transform}
 */
const namespaceType = {
  kinds: ['namespaceType'],
  fileKinds: ['js'],

  /**
   * @param {import('../types.mjs').Rule} rule A `namespaceType` rule.
   * @returns {string[]} The problems of the rule.
   */
  validate(rule) {
    return problemsOf(() => assertRule(rule));
  },

  /**
   * @param {import('../types.mjs').Ctx} ctx Context of a `js` part.
   * @param {import('../types.mjs').Rule[]} rules `namespaceType` rules.
   * @returns {void}
   */
  apply(ctx, rules) {
    rules.forEach(assertRule);

    const { j, root } = ctx;
    const bindings = collectHotBindings(j, root);

    if (bindings.namespace.length === 0) {
      return;
    }

    const includeValues = rules.some(rule => rule.positions === 'any');
    const matches = [];

    for (const reference of collectReferences(ctx, includeValues)) {
      const member = bindings.resolveNamespaceMember(reference.path);
      const found = member ? findRule(rules, member, reference.isType) : null;

      if (found) {
        matches.push({ ...reference, member, ...found });
      }
    }

    // A value use needs a value import, which also serves the type uses of the same name. A type-only import added
    // first would make the later value import collide with it.
    matches.sort((a, b) => Number(a.isType) - Number(b.isType));

    const isModular = lazyModular(j, root);
    const noted = new Set();

    for (const match of matches) {
      if (match.rule.removed === true) {
        const [plugin] = match.captures;

        ctx.todo(enclosingStatement(match.path), match.rule.id, expandAdvice(match.rule, {
          plugin: plugin ?? null,
          name: `${NAMESPACE_PREFIX}${match.member}`,
        }));
      } else if (rewrites(match.rule)) {
        rewrite(ctx, match, isModular, noted);
      } else {
        const name = match.rule.to.name ?? match.member.split('.').pop();
        const source = toList(match.rule.to.source)[0];

        reportInstead(ctx, match.rule, match.path.node.loc?.start?.line,
          `Replace ${NAMESPACE_PREFIX}${match.member} with ${name} from "${source}".`, enclosingStatement(match.path),
          `Use ${name} from "${source}" instead.`);
      }
    }
  },
};

export default namespaceType;
