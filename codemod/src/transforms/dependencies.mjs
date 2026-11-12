import { planRange } from '../lib/dependency-range.mjs';
import { addFact, dirOf, hasFactFor } from '../lib/facts.mjs';
import { rewrites } from '../lib/safety.mjs';

/**
 * The `package.json` sections that declare dependencies.
 */
const SECTIONS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

/**
 * Sections a new dependency may go to, in order of preference.
 */
const ADD_SECTIONS = ['dependencies', 'devDependencies'];

/**
 * Cheap test for the phase 1 scan. It is a superset of every module name a fact rule can look for, so a file
 * that imports `moment` without ever naming Handsontable is still parsed.
 */
const SCAN_PRECHECK = /handsontable|hyperformula|numbro|moment|dompurify|pikaday/i;

/**
 * Tell whether a value is a plain object.
 *
 * @param {unknown} value Value to test.
 * @returns {boolean} `true` for a non-null, non-array object.
 */
function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Tell whether an import path names a module or a file inside it.
 *
 * @param {unknown} path The path from an import, `require()`, or `import()`.
 * @param {string} name Module name, for example `numbro`.
 * @returns {boolean} `true` for `numbro` and `numbro/languages/de-DE`, not for `numbro-extra`.
 */
function isModulePath(path, name) {
  return typeof path === 'string' && (path === name || path.startsWith(`${name}/`));
}

/**
 * Tell whether a js file imports a module, by `import`, `export ... from`, `require()`, `import()`, or
 * `import x = require()`.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed file, a jscodeshift Collection.
 * @param {string} name Module name.
 * @returns {boolean} `true` when any such statement names the module.
 */
function importsModule(j, root, name) {
  const fromSource = type => Boolean(type)
    && root.find(type).some(path => isModulePath(path.node.source?.value, name));
  const isRequire = callee => (callee.type === 'Identifier' && callee.name === 'require') || callee.type === 'Import';
  const fromCall = root.find(j.CallExpression)
    .some(path => isRequire(path.node.callee) && isModulePath(path.node.arguments[0]?.value, name));
  const fromEquals = Boolean(j.TSImportEqualsDeclaration) && root.find(j.TSImportEqualsDeclaration)
    .some(path => isModulePath(path.node.moduleReference?.expression?.value, name));

  return [j.ImportDeclaration, j.ExportNamedDeclaration, j.ExportAllDeclaration, j.ImportExpression]
    .some(fromSource) || fromCall || fromEquals;
}

/**
 * Name of an object property key or JSX attribute name, or `null` for a computed key.
 *
 * @param {object} node An `ObjectProperty`, `Property`, or `JSXAttribute` node.
 * @returns {string|null} The name.
 */
function keyName(node) {
  if (node.type === 'JSXAttribute') {
    return node.name?.type === 'JSXIdentifier' ? node.name.name : null;
  }

  if (node.computed) {
    return null;
  }

  return node.key?.type === 'Identifier' ? node.key.name : (node.key?.value ?? null);
}

/**
 * Tell whether an object expression has a key.
 *
 * @param {object|undefined} node A node that may be an `ObjectExpression`.
 * @param {string} key Key name.
 * @returns {boolean} `true` when the node is an object with that key.
 */
function objectHasKey(node, key) {
  return node?.type === 'ObjectExpression'
    && node.properties.some(property => keyName(property) === key);
}

/**
 * Tell whether a js file sets a property, as an object property or a JSX attribute.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed file, a jscodeshift Collection.
 * @param {string} name Property name.
 * @param {string} [withKey] When set, the value must be an object that has this key.
 * @returns {boolean} `true` when the property exists (and has the key).
 */
function hasProperty(j, root, name, withKey) {
  const valueOf = node => (node.type === 'JSXAttribute' ? node.value?.expression : node.value);
  const found = path => keyName(path.node) === name
    && (withKey === undefined || objectHasKey(valueOf(path.node), withKey));

  return [j.ObjectProperty, j.Property, j.JSXAttribute].some(type => type && root.find(type).some(found));
}

/**
 * Test one `when` condition of a fact rule against a parsed js file. Pure: it reads the tree and nothing else.
 *
 * - `{ "import": "name" }`: the file imports the module `name` or a file inside it (`name/...`), through
 *   `import`, `export ... from`, `require()`, `import()`, or `import x = require()`.
 * - `{ "property": "name" }`: the file sets an object property or JSX attribute called `name`.
 *   `{ "property": "name", "withKey": "key" }` also needs its value to be an object literal with that key.
 *
 * A condition with neither field never matches.
 *
 * @param {object} j The jscodeshift API bound to the file's parser.
 * @param {object} root The parsed file, a jscodeshift Collection.
 * @param {object} when The condition: `{ import }` or `{ property, withKey }`, all fields optional strings.
 * @returns {boolean} `true` when the file matches.
 */
export function matchesWhen(j, root, when) {
  if (typeof when?.import === 'string') {
    return importsModule(j, root, when.import);
  }

  if (typeof when?.property === 'string') {
    return hasProperty(j, root, when.property, when.withKey);
  }

  return false;
}

/**
 * Phase 1: evaluate the `facts` of every rule against one js part and record the ones that match. A `property`
 * condition counts only in a file that names Handsontable, because `formulas` and `engine` are common words.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of a js part.
 * @param {import('../types.mjs').Rule[]} rules The module's rules for one version.
 * @returns {void}
 */
function collectFacts(ctx, rules) {
  const mentionsHandsontable = /handsontable/i.test(ctx.source);
  const dir = dirOf(ctx.filePath);

  for (const rule of rules) {
    for (const fact of Array.isArray(rule.facts) ? rule.facts : []) {
      const needsMention = typeof fact.when?.property === 'string';

      if (ctx.facts.has(`${fact.name}@${dir}`) || (needsMention && !mentionsHandsontable)) {
        continue;
      }

      if (matchesWhen(ctx.j, ctx.root, fact.when)) {
        addFact(ctx, fact.name);
      }
    }
  }
}

/**
 * List the names a `package.json` declares in one section.
 *
 * @param {object} manifest The parsed `package.json`.
 * @param {string} section Section name.
 * @returns {object} The section, or an empty object when it is missing or not an object.
 */
function sectionOf(manifest, section) {
  return isObject(manifest[section]) ? manifest[section] : {};
}

/**
 * Tell whether any dependency section declares a package.
 *
 * @param {object} manifest The parsed `package.json`.
 * @param {string} name Package name.
 * @returns {boolean} `true` when a section lists it.
 */
function declares(manifest, name) {
  return SECTIONS.some(section => name in sectionOf(manifest, section));
}

/**
 * Tell whether the `package.json` declares at least one package of a list.
 *
 * @param {object} manifest The parsed `package.json`.
 * @param {string|string[]|undefined} names One name or several. Absent means no condition.
 * @returns {boolean} `true` when no condition is set or one of the names is declared.
 */
function dependsOnAny(manifest, names) {
  const list = [names].flat().filter(Boolean);

  return list.length === 0 || list.some(name => declares(manifest, name));
}

/**
 * Raise the range of every listed package that the `package.json` declares, keeping the operator style.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of the `package.json`.
 * @param {import('../types.mjs').Rule} rule A rule with a `bump` map of package name to target version.
 * @returns {void}
 */
function bump(ctx, rule) {
  for (const [name, target] of Object.entries(isObject(rule.bump) ? rule.bump : {})) {
    for (const section of SECTIONS) {
      const current = sectionOf(ctx.root, section)[name];

      if (typeof current !== 'string') {
        continue;
      }

      const plan = planRange(current, target);

      if (plan.action === 'rewrite' && !rewrites(rule)) {
        ctx.report({
          ruleId: rule.id,
          severity: 'manual',
          message: `Update ${name} in ${section} from "${current}" to "${plan.value}".`,
        });
      } else if (plan.action === 'rewrite') {
        ctx.root[section][name] = plan.value;
        ctx.markChanged();
        ctx.report({
          ruleId: rule.id,
          severity: 'changed',
          message: `Updated ${name} in ${section} from "${current}" to "${plan.value}".`,
        });
      } else if (plan.action === 'manual') {
        ctx.report({
          ruleId: rule.id,
          severity: 'manual',
          message: `${name} "${current}" in ${section} ${plan.reason}. Set it to ^${target} by hand.`,
        });
      }
    }
  }
}

/**
 * Report packages that have no release for the target version and name the package that replaces them.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of the `package.json`.
 * @param {import('../types.mjs').Rule} rule A rule with a `replaced` map of old package to advice text.
 * @returns {void}
 */
function reportReplaced(ctx, rule) {
  for (const [name, advice] of Object.entries(isObject(rule.replaced) ? rule.replaced : {})) {
    if (declares(ctx.root, name)) {
      ctx.report({ ruleId: rule.id, severity: 'manual', message: `${name} ${advice}` });
    }
  }
}

/**
 * Insert a dependency into a section. Keys stay in alphabetical order when they already were, and the new key
 * goes last otherwise. A missing section is created before `devDependencies`, or last.
 *
 * @param {object} manifest The parsed `package.json`.
 * @param {string} section Section name.
 * @param {string} name Package name.
 * @param {string} range Version range.
 * @returns {void}
 */
function insertDependency(manifest, section, name, range) {
  if (!isObject(manifest[section])) {
    const entries = Object.entries(manifest);
    const index = entries.findIndex(([key]) => key === 'devDependencies');

    entries.splice(index === -1 ? entries.length : index, 0, [section, {}]);
    Object.keys(manifest).forEach(key => delete manifest[key]);
    entries.forEach(([key, value]) => {
      manifest[key] = value;
    });
  }

  const entries = Object.entries(manifest[section]);
  const compare = (left, right) => left.localeCompare(right, 'en');
  const sorted = entries.every(([key], index) => index === 0 || compare(entries[index - 1][0], key) <= 0);
  const before = entries.filter(([key]) => compare(key, name) < 0);
  const after = entries.filter(([key]) => compare(key, name) > 0);
  const next = sorted ? [...before, [name, range], ...after] : [...entries, [name, range]];

  Object.keys(manifest[section]).forEach(key => delete manifest[section][key]);
  next.forEach(([key, value]) => {
    manifest[section][key] = value;
  });
}

/**
 * Add the packages a rule asks for when their fact is present for this project, the project depends on the
 * host package, and the package is not declared yet. A package that has no section to go to (the host is only
 * a peer dependency) is reported instead.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of the `package.json`.
 * @param {import('../types.mjs').Rule} rule A rule with an `add` list of `{ name, range, whenFact, onlyIfDependsOn }`.
 * @returns {void}
 */
function addPackages(ctx, rule) {
  for (const item of Array.isArray(rule.add) ? rule.add : []) {
    if (declares(ctx.root, item.name) || !dependsOnAny(ctx.root, item.onlyIfDependsOn)
      || (item.whenFact && !hasFactFor(ctx, item.whenFact))) {
      continue;
    }

    const hosts = [item.onlyIfDependsOn].flat().filter(Boolean);
    const section = ADD_SECTIONS.find(candidate => hosts.some(host => host in sectionOf(ctx.root, candidate)))
      ?? (hosts.some(host => host in sectionOf(ctx.root, 'optionalDependencies')) ? 'dependencies' : null);

    if (!section) {
      ctx.report({
        ruleId: rule.id,
        severity: 'manual',
        message: `Add ${item.name}@${item.range} to your own dependencies. This package.json lists Handsontable `
          + 'only as a peer dependency.',
      });
      continue;
    }

    if (!rewrites(rule)) {
      ctx.report({
        ruleId: rule.id,
        severity: 'manual',
        message: `Add ${item.name}@${item.range} to ${section}. Handsontable no longer installs it.`,
      });
      continue;
    }

    insertDependency(ctx.root, section, item.name, item.range);
    ctx.markChanged();
    ctx.report({
      ruleId: rule.id,
      severity: 'changed',
      message: `Added ${item.name} "${item.range}" to ${section}. Handsontable no longer installs it.`,
    });
  }
}

/**
 * Report packages Handsontable used to install and no longer does, when the project imports them and does not
 * declare them. Nothing is added.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of the `package.json`.
 * @param {import('../types.mjs').Rule} rule A rule with a `reportOnly` list of `{ name, whenFact, message? }`.
 * @returns {void}
 */
function reportMissing(ctx, rule) {
  for (const item of Array.isArray(rule.reportOnly) ? rule.reportOnly : []) {
    if (declares(ctx.root, item.name) || !dependsOnAny(ctx.root, item.onlyIfDependsOn)
      || (item.whenFact && !hasFactFor(ctx, item.whenFact))) {
      continue;
    }

    ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      message: item.message
        ?? `${item.name} is no longer installed with Handsontable. Add it to your dependencies if you still import it.`,
    });
  }
}

/**
 * Handles `dependency` rules. In phase 2 it edits a `package.json`: it raises the Handsontable package
 * ranges, reports replaced wrapper packages, adds packages that a project now has to install itself, and
 * reports the ones it will not add. In phase 1 it scans js parts for the facts those steps read.
 *
 * A rule whose `safe` is not `true` never edits code. It reports `manual` entries instead, and leaves a TODO comment
 * when the rule asks for one (see `lib/safety.mjs`).
 *
 * @type {import('../types.mjs').Transform}
 */
const dependencies = {
  kinds: ['dependency'],
  fileKinds: ['json', 'js'],
  scan: { fileKinds: ['js'], precheck: SCAN_PRECHECK },

  /**
   * @param {import('../types.mjs').Ctx} ctx The transform context.
   * @param {import('../types.mjs').Rule[]} rules The module's rules for one version.
   * @returns {void}
   */
  apply(ctx, rules) {
    if (ctx.fileKind === 'js') {
      collectFacts(ctx, rules);

      return;
    }

    if (!isObject(ctx.root)) {
      return;
    }

    for (const rule of rules) {
      bump(ctx, rule);
      reportReplaced(ctx, rule);
      addPackages(ctx, rule);
      reportMissing(ctx, rule);
    }
  },
};

export default dependencies;
