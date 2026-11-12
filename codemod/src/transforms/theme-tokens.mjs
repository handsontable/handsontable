import { reportInstead, rewrites } from '../lib/safety.mjs';
import { replaceStringLiteral } from '../lib/string-literal.mjs';

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
 * Name of the function a call invokes: `registerTheme(...)` and `theme.params(...)` give `registerTheme` and
 * `params`.
 *
 * @param {object} callee The `callee` node of a call.
 * @returns {string|null} The name, or `null` for anything else.
 */
function calleeName(callee) {
  if (callee.type === 'Identifier') {
    return callee.name;
  }

  if ((callee.type === 'MemberExpression' || callee.type === 'OptionalMemberExpression') && !callee.computed) {
    return callee.property.type === 'Identifier' ? callee.property.name : null;
  }

  return null;
}

/**
 * Name of an object property key, or `null` for a computed key or a key that is not a name or a string.
 *
 * @param {object} property An `ObjectProperty` or `Property` node.
 * @returns {string|null} The key name.
 */
function keyName(property) {
  if (property.computed) {
    return null;
  }

  if (property.key.type === 'Identifier') {
    return property.key.name;
  }

  return typeof property.key.value === 'string' ? property.key.value : null;
}

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
 * Rename the key of a property to a new name, keeping the key's quote style and the property's value. A
 * shorthand property (`{ wrapperBorderRadius }`) becomes `borderRadius: wrapperBorderRadius`.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} path Path of the property.
 * @param {string} from Old key name.
 * @param {string} to New key name.
 * @returns {void}
 */
function renameKey(j, path, from, to) {
  const { node } = path;

  if (node.shorthand) {
    node.shorthand = false;
    node.value = j.identifier(from);
    node.key = j.identifier(to);

    return;
  }

  if (node.key.type === 'Identifier') {
    node.key = j.identifier(to);

    return;
  }

  replaceStringLiteral(j, path.get('key'), text => text.replace(from, to));
}

/**
 * Renames and removes theme tokens (`wrapperBorderRadius` to `borderRadius`, removal of `wrapperBorderWidth`).
 *
 * It rewrites a property key only inside an object that is an argument, at any depth, of a call to
 * `registerTheme`, `reinitTheme`, or `.params()` (a rule may list other names in `callees`). The call must sit
 * in a file that imports a `handsontable` module or mentions the `Handsontable` global. The same key anywhere
 * else is never rewritten. It is only reported (`manual`) when the file imports `handsontable/themes`, because
 * the object may reach the theme API through a variable.
 *
 * - Rename: the key changes and the value stays. A shorthand property turns into `to: from`. When the object
 *   already has the new key, nothing changes and a `manual` entry is reported.
 * - Removal (`removed: true`): the property stays and gets a TODO comment with the rule's advice, once.
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
   * @param {import('../types.mjs').Ctx} ctx Context of a `js` part.
   * @param {import('../types.mjs').Rule[]} rules `themeToken` rules.
   * @returns {void}
   */
  apply(ctx, rules) {
    const { j, root } = ctx;
    const entries = rules.filter((rule) => {
      if (rule.removed !== true && typeof rule.to !== 'string') {
        throw new Error(`Rule ${rule.id} needs "to" or "removed": true.`);
      }

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
        ctx.todo(property, rule.id, rule.advice ?? rule.message ?? `${rule.from} was removed.`);

        return;
      }

      if (!rewrites(rule)) {
        reportInstead(ctx, rule, property.node.loc?.start?.line, `Rename the ${rule.from} token to ${rule.to}.`);

        return;
      }

      const siblings = property.parent.node.properties ?? [];

      if (siblings.some(sibling => sibling !== property.node && keyName(sibling) === rule.to)) {
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

      for (const call of calls) {
        const name = calleeName(call.node.callee);

        for (const rule of entries.filter(entry => (entry.callees ?? DEFAULT_CALLEES).includes(name))) {
          for (const argument of call.get('arguments').map(path => path)) {
            propertiesIn(argument)
              .filter(property => keyName(property.node) === rule.from && !handled.has(property.node))
              .forEach(property => handle(rule, property));
          }
        }
      }
    }

    if (!importsThemes) {
      return;
    }

    for (const property of propertiesIn(root.paths()[0])) {
      const name = keyName(property.node);
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
