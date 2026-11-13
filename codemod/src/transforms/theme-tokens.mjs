import { anchorForProperty } from '../lib/anchor.mjs';
import { calleeName, isFunctionNode, propertyName, unwrapNode, unwrapPath } from '../lib/ast.mjs';
import { collectHotBindings } from '../lib/hot-bindings.mjs';
import { removalAdvice, renameKey } from '../lib/rename-key.mjs';
import { reportInstead, rewrites } from '../lib/safety.mjs';
import { invalidateScope, lookup } from '../lib/scope.mjs';
import { assertRenameOrRemoval, problemsOf } from '../lib/validate.mjs';

/**
 * Callee names that take a theme config or params object. `registerTheme(name, config)` and
 * `reinitTheme(name, config)` are the functions exported by `handsontable/themes`, and `.params(object)` is
 * the method of a registered theme (`getTheme('main')?.params({ tokens: {...} })`). `createTheme` is not
 * public API, so it is not listed.
 */
const DEFAULT_CALLEES = ['registerTheme', 'reinitTheme', 'params'];

const HANDSONTABLE_SOURCE = /^(?:@handsontable\/|handsontable(?:\/|$))/;
const THEMES_SOURCE = /^handsontable\/themes(?:\/|$)/;

/**
 * Collect the module names a file imports or requires.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The file's Collection.
 * @returns {string[]} Module specifiers.
 */
function moduleSources(j, root) {
  const sources = root.find(j.ImportDeclaration).nodes().map(node => node.source.value);

  root.find(j.CallExpression, { callee: { type: 'Identifier', name: 'require' } }).forEach((path) => {
    const [argument] = path.node.arguments;

    if (typeof argument?.value === 'string') {
      sources.push(argument.value);
    }
  });

  return sources;
}

/**
 * Callee names that are methods and so need a theme receiver (`x.params(...)`). The other callees are the functions
 * of `handsontable/themes`, which are recognized by name.
 */
const METHOD_CALLEES = new Set(['params']);

/**
 * Collect the identifiers a file binds to `handsontable/themes`: default, named, and namespace imports, and the
 * result of `require('handsontable/themes')` (whole or destructured).
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The file's Collection.
 * @returns {Set<object>} The declaring `Identifier` nodes.
 */
function themeIdentifiers(j, root) {
  const ids = new Set();

  root.find(j.ImportDeclaration)
    .filter(path => THEMES_SOURCE.test(String(path.node.source.value)))
    .forEach(path => path.node.specifiers.forEach(specifier => ids.add(specifier.local)));

  root.find(j.VariableDeclarator).forEach((path) => {
    const init = unwrapNode(path.node.init);
    const isRequire = init?.type === 'CallExpression' && init.callee.type === 'Identifier'
      && init.callee.name === 'require' && THEMES_SOURCE.test(String(init.arguments[0]?.value));

    if (!isRequire) {
      return;
    }

    if (path.node.id.type === 'Identifier') {
      ids.add(path.node.id);
    } else if (path.node.id.type === 'ObjectPattern') {
      path.node.id.properties.forEach((property) => {
        if (property.value?.type === 'Identifier') {
          ids.add(property.value);
        }
      });
    }
  });

  return ids;
}

/**
 * Whether an expression is a theme: a binding of `handsontable/themes` (or a variable that holds a theme, see
 * `addThemeVariables`), a call of such a function or method, or a member of one.
 *
 * @param {object} path NodePath of the expression.
 * @param {Set<object>} ids Declaring identifiers of theme bindings.
 * @param {import('../lib/hot-bindings.mjs').HotBindings} bindings Result of `collectHotBindings`, which knows the
 * `Handsontable` namespace.
 * @returns {boolean} `true` when the expression is rooted at the theme API.
 */
function isThemeReceiver(path, ids, bindings) {
  const target = unwrapPath(path);
  const { node } = target;

  switch (node.type) {
    case 'Identifier': {
      const binding = lookup(target, node.name, 'value');

      return Boolean(binding) && ids.has(binding.idNode);
    }
    case 'CallExpression':
    case 'OptionalCallExpression':
      return isThemeReceiver(target.get('callee'), ids, bindings);
    case 'MemberExpression':
    case 'OptionalMemberExpression':
      // `Handsontable.themes` is the registry that `handsontable/themes` exports, set on the namespace at run time.
      return bindings.resolveNamespaceMember(target) === 'themes'
        || isThemeReceiver(target.get('object'), ids, bindings);
    default:
      return false;
  }
}

/**
 * Add the variables that hold a theme to the theme bindings of a file, one hop: `const theme = registerTheme(...)`.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The file's Collection.
 * @param {Set<object>} ids Declaring identifiers of `handsontable/themes` bindings. The variables are added.
 * @param {import('../lib/hot-bindings.mjs').HotBindings} bindings Result of `collectHotBindings`.
 * @returns {void}
 */
function addThemeVariables(j, root, ids, bindings) {
  const found = [];

  root.find(j.VariableDeclarator).forEach((path) => {
    if (path.node.id.type === 'Identifier' && path.node.init && isThemeReceiver(path.get('init'), ids, bindings)) {
      found.push(path.node.id);
    }
  });
  found.forEach(id => ids.add(id));
}

/**
 * Whether an object node sits inside a function that is nested in the argument, which is code that runs later and
 * is not the theme configuration itself.
 *
 * @param {object} property NodePath of a property.
 * @param {object} argument NodePath of the argument that holds it.
 * @returns {boolean} `true` when a function lies between the property and the argument.
 */
function insideNestedFunction(property, argument) {
  for (let current = property.parent; current && current.node !== argument.node; current = current.parent) {
    if (isFunctionNode(current.node)) {
      return true;
    }
  }

  return false;
}

/**
 * Renames and removes theme tokens (`wrapperBorderRadius` to `borderRadius`, removal of `wrapperBorderWidth`).
 *
 * It rewrites a property key only inside an object that is an argument, at any depth, of a call to
 * `registerTheme`, `reinitTheme`, or `.params()` (a rule may list other names in `callees`). A `.params()` call
 * needs a theme receiver: a call chain rooted at a binding of `handsontable/themes`, or a variable that holds
 * one. The search stops at a function nested in the argument. The call must sit
 * in a file that imports a `handsontable` module or mentions the `Handsontable` global. The same key anywhere
 * else is never rewritten. It is only reported (`manual`) when the file imports `handsontable/themes`, because
 * the object may reach the theme API through a variable.
 *
 * - Rename: the key changes and the value stays. A shorthand property turns into `to: from`. When the object
 *   already has the new key, nothing changes and a `manual` entry is reported.
 * - Removal (`removed: true`): the property stays and gets a TODO comment with the rule's advice, once. The comment
 *   goes before the property when it has lines of its own, else before the enclosing statement.
 *
 * A rule whose `safe` is not `true` never edits code. It reports `manual` entries instead, and leaves a TODO comment
 * when the rule asks for one (see `lib/safety.mjs`).
 *
 * @type {import('../types.mjs').Transform}
 */
const themeTokens = {
  kinds: ['themeToken'],
  fileKinds: ['js'],

  /**
   * @param {import('../types.mjs').Rule} rule A `themeToken` rule.
   * @returns {string[]} The problems of the rule.
   */
  validate(rule) {
    return problemsOf(() => assertRenameOrRemoval(rule));
  },

  /**
   * @param {import('../types.mjs').Ctx} ctx Context of a `js` part.
   * @param {import('../types.mjs').Rule[]} rules `themeToken` rules.
   * @returns {void}
   */
  apply(ctx, rules) {
    const { j, root } = ctx;
    const entries = rules.filter((rule) => {
      assertRenameOrRemoval(rule);

      return ctx.source.includes(rule.from);
    });

    if (entries.length === 0) {
      return;
    }

    const sources = moduleSources(j, root);
    const knowsHandsontable = sources.some(source => HANDSONTABLE_SOURCE.test(source))
      || /\bHandsontable\b/.test(ctx.source);
    const importsThemes = sources.some(source => THEMES_SOURCE.test(source));
    const handled = new Set();
    const propertiesIn = path => [...j(path).find(j.ObjectProperty).paths(), ...j(path).find(j.Property).paths()];

    const handle = (rule, property) => {
      handled.add(property.node);

      if (rule.removed === true) {
        ctx.todo(anchorForProperty(property), rule.id, removalAdvice(rule, rule.from));

        return;
      }

      if (!rewrites(rule)) {
        reportInstead(ctx, rule, property.node.loc?.start?.line, `Rename the ${rule.from} token to ${rule.to}.`);

        return;
      }

      const siblings = property.parent.node.properties ?? [];

      if (siblings.some(sibling => sibling !== property.node && propertyName(sibling) === rule.to)) {
        ctx.report({
          ruleId: rule.id,
          severity: 'manual',
          line: property.node.loc?.start?.line,
          message: `Both ${rule.from} and ${rule.to} are set in this object. Remove ${rule.from} by hand.`,
        });

        return;
      }

      renameKey(j, property, rule.from, rule.to);
      ctx.markChanged();
      ctx.report({
        ruleId: rule.id,
        severity: 'changed',
        line: property.node.loc?.start?.line,
        message: `Renamed the ${rule.from} token to ${rule.to}.`,
      });
    };

    if (knowsHandsontable) {
      const calls = [...root.find(j.CallExpression).paths(), ...root.find(j.OptionalCallExpression).paths()];

      invalidateScope();

      const themeIds = themeIdentifiers(j, root);
      const bindings = collectHotBindings(j, root);

      addThemeVariables(j, root, themeIds, bindings);

      for (const call of calls) {
        const name = calleeName(call.node.callee);
        const onTheme = !METHOD_CALLEES.has(name) || (call.node.callee.type !== 'Identifier'
          && isThemeReceiver(unwrapPath(call.get('callee')).get('object'), themeIds, bindings));

        if (!onTheme) {
          continue;
        }

        for (const rule of entries.filter(entry => (entry.callees ?? DEFAULT_CALLEES).includes(name))) {
          for (const argument of call.get('arguments').map(path => path)) {
            propertiesIn(argument)
              .filter(property => propertyName(property.node) === rule.from && !handled.has(property.node)
                && !insideNestedFunction(property, argument))
              .forEach(property => handle(rule, property));
          }
        }
      }
    }

    if (!importsThemes) {
      return;
    }

    for (const property of propertiesIn(root.paths()[0])) {
      const name = propertyName(property.node);
      const rule = entries.find(entry => entry.from === name);

      if (!rule || handled.has(property.node)) {
        continue;
      }

      ctx.report({
        ruleId: rule.id,
        severity: 'manual',
        line: property.node.loc?.start?.line,
        message: rule.removed === true
          ? (rule.advice ?? `${rule.from} was removed.`)
          : `Rename the ${rule.from} token to ${rule.to} if this object is passed to the theme API.`,
      });
    }
  },
};

export default themeTokens;
