import { attributeName, findOf, propertyName } from '../lib/ast.mjs';
import { judgeQueries, queriesOfPackage, queriesOfRc } from '../lib/browserslist.mjs';
import { isRemoteSource, parseCatalogSpec, planRange, rangeAdmits } from '../lib/dependency-range.mjs';
import { addFact, dirOf, factSite, hasFactFor } from '../lib/facts.mjs';
import { memberPosition, scanJson } from '../lib/json-edit.mjs';
import { redact } from '../lib/redact.mjs';
import { rewrites } from '../lib/safety.mjs';
import { problemsOf } from '../lib/validate.mjs';
import { BELOW_FROM_RULE_ID, SKIPPED_RULE_ID } from '../report.mjs';
import { lineBelowFrom, minimumOfRange } from '../versions.mjs';

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
 * An `npm:` alias spec: `npm:handsontable@^17.0.0` names the package and its range.
 */
const NPM_ALIAS = /^npm:((?:@[\w.-]+\/)?[\w.-]+)@(.+)$/;

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
 * @param {(type: object) => object} [find] Finds the paths of a node type (see `findOf()`).
 * @returns {object|null} The first such statement in source order, or `null` when none names the module.
 */
function firstImport(j, root, name, find = type => root.find(type)) {
  const isRequire = callee => (callee.type === 'Identifier' && callee.name === 'require') || callee.type === 'Import';
  const found = [];
  const collect = (type, test) => Boolean(type) && find(type).forEach((path) => {
    if (test(path.node)) {
      found.push(path.node);
    }
  });

  [j.ImportDeclaration, j.ExportNamedDeclaration, j.ExportAllDeclaration, j.ImportExpression]
    .forEach(type => collect(type, node => isModulePath(node.source?.value, name)));
  collect(j.CallExpression, node => isRequire(node.callee) && isModulePath(node.arguments[0]?.value, name));
  collect(j.TSImportEqualsDeclaration, node => isModulePath(node.moduleReference?.expression?.value, name));

  return earliest(found);
}

/**
 * The node that comes first in the source.
 *
 * @param {object[]} nodes AST nodes.
 * @returns {object|null} The node with the lowest start offset, or `null` for an empty list.
 */
function earliest(nodes) {
  return nodes.reduce((first, node) => (first === null || (node.start ?? Infinity) < (first.start ?? Infinity)
    ? node : first), null);
}

/**
 * Name of an object property key or JSX attribute name, or `null` for a computed key.
 *
 * @param {object} node An `ObjectProperty`, `Property`, or `JSXAttribute` node.
 * @returns {string|null} The name.
 */
function keyName(node) {
  return node.type === 'JSXAttribute' ? attributeName(node) : propertyName(node);
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
 * @param {(type: object) => object} [find] Finds the paths of a node type (see `findOf()`).
 * @returns {object|null} The first such property or attribute in source order, or `null` when there is none.
 */
function firstProperty(j, root, name, withKey, find = type => root.find(type)) {
  const valueOf = node => (node.type === 'JSXAttribute' ? node.value?.expression : node.value);
  const found = [];

  [j.ObjectProperty, j.Property, j.JSXAttribute].filter(Boolean).forEach(type => find(type).forEach((path) => {
    if (keyName(path.node) === name && (withKey === undefined || objectHasKey(valueOf(path.node), withKey))) {
      found.push(path.node);
    }
  }));

  return earliest(found);
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
  return findWhen(j, root, when) !== null;
}

/**
 * Find the first match of one `when` condition, as `matchesWhen` reads it.
 *
 * @param {object} j The jscodeshift API bound to the file's parser.
 * @param {object} root The parsed file, a jscodeshift Collection.
 * @param {object} when The condition: `{ import }` or `{ property, withKey }`.
 * @param {(type: object) => object} [find] Finds the paths of a node type (see `findOf()`).
 * @returns {{line: number|undefined}|null} The line of the first match (`undefined` for a node with no position),
 * or `null` when the file does not match.
 */
export function findWhen(j, root, when, find = undefined) {
  let node = null;

  if (typeof when?.import === 'string') {
    node = firstImport(j, root, when.import, find);
  } else if (typeof when?.property === 'string') {
    node = firstProperty(j, root, when.property, when.withKey, find);
  }

  return node === null ? null : { line: node.loc?.start?.line };
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
  const find = findOf(ctx);

  for (const rule of rules) {
    for (const fact of Array.isArray(rule.facts) ? rule.facts : []) {
      const needsMention = typeof fact.when?.property === 'string';

      if (ctx.facts.has(`${fact.name}@${dir}`) || (needsMention && !mentionsHandsontable)) {
        continue;
      }

      const found = findWhen(ctx.j, ctx.root, fact.when, find);

      if (found) {
        addFact(ctx, fact.name, found.line);
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
 * Pad a partial version (`2`, `2.1`) to three numbers.
 *
 * @param {string|null} version The version text.
 * @returns {string|null} `MAJOR.MINOR.PATCH`, or `null` when there is no version.
 */
function fullVersion(version) {
  return version === null ? null : [...version.split('-')[0].split('.'), '0', '0'].slice(0, 3).join('.');
}

/**
 * Whether two ranges of one package can resolve to the same version: one admits the lowest version of the other.
 * `^3.4.0` and `^3.0.0` can, `>=2.0.0` and `^3.0.0` can, `^2.7.0` and `^3.0.0` cannot, and a spec that names no
 * version (`catalog:`, `workspace:*`) is not known to. The lowest version that a text reads out of an upper bound only
 * (`<3` gives 3) is not in its own range, so it does not count.
 *
 * @param {string} declared The range a `package.json` above declares.
 * @param {string} wanted The range the rule would add.
 * @returns {boolean} `true` when the two overlap.
 */
function compatible(declared, wanted) {
  const lowestDeclared = fullVersion(minimumOfRange(declared));
  const lowestWanted = fullVersion(minimumOfRange(wanted));

  return (lowestWanted !== null && rangeAdmits(declared, lowestWanted) === true)
    || (lowestDeclared !== null && rangeAdmits(declared, lowestDeclared) === true
      && rangeAdmits(wanted, lowestDeclared) === true);
}

/**
 * The nearest `package.json` above this one that declares a package, with the range it gives.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of the `package.json`.
 * @param {string} name Package name.
 * @returns {{file: string, range: string}|null} The file and the range, or `null` when no file above declares it.
 */
function declaredAbove(ctx, name) {
  for (const { file, manifest } of ctx.ancestors ?? []) {
    if (manifest === null) {
      continue;
    }

    const section = SECTIONS.find(candidate => name in sectionOf(manifest, candidate));

    if (section) {
      return { file, range: String(sectionOf(manifest, section)[name]) };
    }
  }

  return null;
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
 * The range each `package.json` entry had before the run changed it, so a chain of migrations (17 to 18.0 to 18.1)
 * reports the net change once, from the range the user wrote.
 *
 * @type {WeakMap<object, Map<string, string>>}
 */
const writtenRanges = new WeakMap();

/**
 * Write a new range into a `package.json` entry. The text is edited by offset when the file has a `JsonDocument`,
 * so nothing outside the value changes. A scan that disagrees with the parsed file edits nothing.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of the `package.json`.
 * @param {string} section Section name.
 * @param {string} name Package name.
 * @param {string} value The new range.
 * @returns {boolean} `true` when the range was written.
 */
function setRange(ctx, section, name, value) {
  if (ctx.json) {
    return ctx.json.setString(section, name, value);
  }

  ctx.root[section][name] = value;

  return true;
}

/**
 * The packages of one `package.json` that were left alone because their range is below `--from`, in the order the
 * run found them. Two migration steps that find the same package list it once.
 *
 * @type {WeakMap<object, Array<{name: string, range: string, line: string}>>}
 */
const belowFrom = new WeakMap();

/**
 * Report that a package declares a range below `--from`. The tool does not raise it: the steps that lead from that
 * version were not selected, so a raised range would claim a migration that did not happen. One entry per
 * `package.json` lists every such package, and a later step replaces it with the same, longer list.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of the `package.json`.
 * @param {{name: string, range: string, line: string}} found The package, its range, and the line of the range.
 * @returns {void}
 */
function reportBelowFrom(ctx, found) {
  const list = belowFrom.get(ctx.root) ?? [];

  belowFrom.set(ctx.root, list);

  if (!list.some(item => item.name === found.name && item.range === found.range)) {
    list.push(found);
  }

  const lowest = list.map(item => item.line).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0];
  const declared = list.map(item => `${item.name} ${redact(item.range)}`).join(' and ');

  ctx.report({
    ruleId: BELOW_FROM_RULE_ID,
    severity: 'warning',
    mergeKey: 'below-from',
    message: `${ctx.filePath} declares ${declared}, which ${list.length === 1 ? 'is' : 'are'} below --from `
      + `${ctx.fromText}. It was not changed. Run the tool on that package with --from ${lowest}.`,
  });
}

/**
 * Report a peer range that sits below the target, and leave it alone. A peer range is the contract a package makes with
 * its consumers: raising it drops the older versions for every project that installs the package, and the code of the
 * package may still run on them. The tool does not know which versions the package supports, so the entry says how to
 * widen it and when to raise it.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of the `package.json`.
 * @param {import('../types.mjs').Rule} rule The `dependency` rule that found the range.
 * @param {{name: string, original: string, value: string, mergeKey: string}} change The package, the range the user
 * wrote, the range a bump would write, and the merge key of the spot.
 * @returns {void}
 */
function reportPeerBelow(ctx, rule, { name, original, value, mergeKey }) {
  const [major] = (minimumOfRange(original) ?? '').split('.');
  const [targetMajor] = value.replace(/^\D*/, '').split('.');
  const widened = major && major !== targetMajor ? ` For example "${redact(original)} || ${value}".` : '';

  ctx.report({
    ruleId: rule.id,
    severity: 'manual',
    mergeKey,
    message: `${name} "${redact(original)}" in peerDependencies is below ${value}, and the tool left it. `
      + 'Raising a peer range drops the older versions for every consumer of this package, so widen it by hand '
      + `to cover the versions you still support, or set it to ${value} when you do not.${widened}`,
  });
}

/**
 * Report a dependency that takes its range from a pnpm catalog. The range lives in `pnpm-workspace.yaml`, so the
 * entry says to set it there: replacing the spec in `package.json` would take the package out of the catalog. The
 * tool edits neither file. When the workspace file is found and has an entry, the report names its current value. An
 * entry that already admits the target, sits above it, or is a source (a path, a link) gets no report.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of the `package.json`.
 * @param {import('../types.mjs').Rule} rule A `dependency` rule with a `bump` map.
 * @param {object} found What was found.
 * @param {string} found.name The package name.
 * @param {string} found.section The `package.json` section that holds the spec.
 * @param {string} found.spec The spec as written (`catalog:` or `catalog:<name>`).
 * @param {string} found.target The target version.
 * @param {{name: string|null}} found.catalog The catalog the spec names, `null` for the default one.
 * @param {string} found.mergeKey Merge key of the spot.
 * @returns {void}
 */
function reportCatalog(ctx, rule, { name, section, spec, target, catalog, mergeKey }) {
  const place = catalog.name ? `catalogs.${catalog.name}` : 'catalog';
  const range = ctx.catalog?.catalogs.get(catalog.name ?? '')?.get(name);
  const file = ctx.catalog?.file ?? 'pnpm-workspace.yaml';
  const lead = `${name} "${redact(spec)}" in ${section} takes its range from the pnpm catalog.`;

  if (range && (['keep', 'skip'].includes(planRange(range, target).action) || rangeAdmits(range, target) === true)) {
    return;
  }

  ctx.report({
    ruleId: rule.id,
    severity: 'manual',
    mergeKey,
    message: range
      ? `${lead} The ${place} section of ${file} has "${redact(range)}". `
        + `Set it to ^${target} there, not in package.json.`
      : `${lead} Set it to ^${target} in the ${place} section of ${file}, not in package.json.`,
  });
}

/**
 * Raise the range of every listed package that the `package.json` declares, keeping the operator style. A compound
 * or open range that already allows the target version (`>=17.1.0 <19`, `*`) is left alone and not reported, and so
 * is a range that starts at or above it. A simple caret, tilde, or exact range below the target is raised even when
 * it admits the target (`^18.0.0` becomes `^18.1.0`). Two migration steps that touch the same entry produce one
 * report entry that states the net change.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of the `package.json`.
 * @param {import('../types.mjs').Rule} rule A rule with a `bump` map of package name to target version.
 * @returns {void}
 */
function bump(ctx, rule) {
  const written = writtenRanges.get(ctx.root) ?? new Map();

  writtenRanges.set(ctx.root, written);

  for (const [name, target] of Object.entries(isObject(rule.bump) ? rule.bump : {})) {
    for (const section of SECTIONS) {
      const current = sectionOf(ctx.root, section)[name];

      if (typeof current !== 'string') {
        continue;
      }

      const key = `${section}:${name}`;
      const original = written.get(key) ?? current;
      const mergeKey = `range:${key}`;
      const catalog = parseCatalogSpec(current);

      if (catalog) {
        reportCatalog(ctx, rule, { name, section, spec: current, target, catalog, mergeKey });
        continue;
      }

      const plan = planRange(current, target);
      const line = plan.action === 'rewrite' || plan.action === 'manual' ? lineBelowFrom(current, ctx.fromText) : null;

      if (line) {
        reportBelowFrom(ctx, { name, range: current, line });
        continue;
      }

      if (plan.action === 'rewrite' && section === 'peerDependencies') {
        // A peer range that admits the target needs nothing: the consumers of the package can already install it.
        if (rangeAdmits(current, target) !== true) {
          reportPeerBelow(ctx, rule, { name, original: current, value: plan.value, mergeKey });
        }
      } else if (plan.action === 'rewrite' && !rewrites(rule)) {
        ctx.report({
          ruleId: rule.id,
          severity: 'manual',
          mergeKey,
          message: `Update ${name} in ${section} from "${redact(original)}" to "${plan.value}".`,
        });
      } else if (plan.action === 'rewrite' && !setRange(ctx, section, name, plan.value)) {
        ctx.report({
          ruleId: rule.id,
          severity: 'manual',
          mergeKey,
          message: `Could not edit ${name} in ${section} without reformatting package.json. `
            + `Set it from "${redact(original)}" to "${plan.value}" by hand.`,
        });
      } else if (plan.action === 'rewrite') {
        written.set(key, original);
        ctx.markChanged();
        ctx.report({
          ruleId: rule.id,
          severity: 'changed',
          mergeKey,
          message: `Updated ${name} in ${section} from "${redact(original)}" to "${plan.value}".`,
        });
      } else if (plan.action === 'manual') {
        ctx.report({
          ruleId: rule.id,
          severity: 'manual',
          mergeKey,
          message: `${name} "${redact(current)}" in ${section} ${plan.reason}. Set it to ^${target} by hand.`,
        });
      } else if (plan.action === 'skip' && isRemoteSource(current)) {
        ctx.report({
          ruleId: rule.id,
          severity: 'manual',
          mergeKey,
          message: `${name} "${redact(current)}" in ${section} installs from a repository or a URL, so the tool `
            + `cannot tell its version. Point it at ${target} by hand.`,
        });
      }
    }
  }
}

/**
 * The package a `overrides`, `resolutions`, or `pnpm.overrides` key names, when it is Handsontable or a wrapper:
 * `handsontable`, `handsontable@^17`, `**\/handsontable`, `some-lib>handsontable`, `@handsontable/vue3`.
 *
 * @param {string} key The key as written.
 * @param {string[]} names The package names the rule bumps.
 * @returns {string|null} The package name, or `null` for any other key.
 */
function overriddenPackage(key, names) {
  const parts = key.split('>').pop().replace(/^(?:\*\*\/)+/, '').split('/');
  const packages = [];

  // A yarn path names packages one under another (`some-lib/handsontable`), and a scoped one is two segments.
  for (let index = 0; index < parts.length; index += 1) {
    if (parts[index].startsWith('@') && index + 1 < parts.length) {
      packages.push(`${parts[index]}/${parts[index + 1]}`);
      index += 1;
    } else {
      packages.push(parts[index]);
    }
  }

  const last = packages[packages.length - 1] ?? '';
  const at = last.lastIndexOf('@');
  const bare = at > 0 ? last.slice(0, at) : last;

  return names.find(name => bare === name) ?? null;
}

/**
 * Report the pins that hold a package below the target version: an entry of `overrides`, `resolutions`, or
 * `pnpm.overrides` that names Handsontable or a wrapper, and an `npm:` alias to one of them under another name.
 * The tool never edits them: each is one `manual` entry, and two migration steps report it once.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of the `package.json`.
 * @param {import('../types.mjs').Rule} rule A rule with a `bump` map of package name to target version.
 * @returns {void}
 */
function reportPins(ctx, rule) {
  const bumps = isObject(rule.bump) ? rule.bump : {};
  const names = Object.keys(bumps);

  if (names.length === 0) {
    return;
  }

  const below = (spec, name) => {
    if (typeof spec !== 'string' || spec.startsWith('$') || planRange(spec, bumps[name]).action === 'skip') {
      return false;
    }

    const alias = NPM_ALIAS.exec(spec.trim());

    return rangeAdmits(alias ? alias[2] : spec, bumps[name]) !== true;
  };
  const visit = (label, key, value, inherited = null) => {
    const name = inherited ?? overriddenPackage(key, names);

    if (isObject(value)) {
      Object.entries(value).forEach(([childKey, child]) => {
        visit(`${label}.${childKey}`, childKey, child, childKey === '.' ? name : null);
      });

      return;
    }

    if (name && typeof value === 'string' && isRemoteSource(value)) {
      ctx.report({
        ruleId: rule.id,
        severity: 'manual',
        mergeKey: `pin:${label}`,
        message: `${label} pins ${name} to "${redact(value)}", which installs from a repository or a URL, so the tool `
          + `cannot tell its version. Point it at ${bumps[name]} by hand. `
          + `The tool does not edit ${label.replace(/\[.*$/s, '')}.`,
      });
    } else if (name && below(value, name)) {
      ctx.report({
        ruleId: rule.id,
        severity: 'manual',
        mergeKey: `pin:${label}`,
        message: `${label} pins ${name} to "${redact(value)}", which does not allow ${bumps[name]}. `
          + `Update or remove it by hand. The tool does not edit ${label.replace(/\[.*$/s, '')}.`,
      });
    }
  };
  const containers = [
    ['overrides', ctx.root.overrides],
    ['resolutions', ctx.root.resolutions],
    ['pnpm.overrides', isObject(ctx.root.pnpm) ? ctx.root.pnpm.overrides : undefined],
  ];

  containers.filter(([, value]) => isObject(value)).forEach(([label, value]) => {
    Object.entries(value).forEach(([key, child]) => visit(`${label}["${key}"]`, key, child));
  });

  for (const section of SECTIONS) {
    for (const [key, spec] of Object.entries(sectionOf(ctx.root, section))) {
      const alias = typeof spec === 'string' ? NPM_ALIAS.exec(spec.trim()) : null;

      // A package that is its own alias is reported by the range bump.
      if (alias && names.includes(alias[1]) && alias[1] !== key && below(spec, alias[1])) {
        ctx.report({
          ruleId: rule.id,
          severity: 'manual',
          mergeKey: `alias:${section}:${key}`,
          message: `${key} in ${section} is an alias of ${alias[1]}@${redact(alias[2])}, which does not allow `
            + `${bumps[alias[1]]}. Update it by hand.`,
        });
      }
    }
  }
}

/**
 * Report script and stylesheet URLs of an HTML page that pin Handsontable or a wrapper to a version below the target:
 * `.../npm/handsontable@17.1.0/...`, `unpkg.com/handsontable@17/...`, `.../ajax/libs/handsontable/17.1.0/...`. The
 * page is never edited, so each one is a `manual` entry with its line, and two migration steps report it once.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of a `template` part of an HTML file.
 * @param {import('../types.mjs').Rule} rule A rule with a `bump` map of package name to target version.
 * @returns {void}
 */
function reportCdnPins(ctx, rule) {
  const bumps = isObject(rule.bump) ? rule.bump : {};

  for (const attribute of ctx.source.matchAll(/\b(?:src|href)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    const url = attribute[1] ?? attribute[2];
    const line = ctx.source.slice(0, attribute.index).split('\n').length;

    for (const [name, target] of Object.entries(bumps)) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\/]/g, match => `\\${match}`);
      const pinned = new RegExp(`(?:[/]|^)${escaped}@([0-9][^/?#]*)`).exec(url)
        ?? new RegExp(`/${escaped}/([0-9]+\\.[0-9]+\\.[0-9]+[^/?#]*)/`).exec(url);

      if (pinned && rangeAdmits(pinned[1], target) !== true) {
        const below = lineBelowFrom(pinned[1], ctx.fromText)
          ? ` This URL is below --from ${ctx.fromText}, so the earlier steps were not checked for this page. `
            + 'Follow the earlier migration guides for it.'
          : '';

        ctx.report({
          ruleId: rule.id,
          severity: 'manual',
          line,
          mergeKey: `cdn:${line}:${name}`,
          message: `${name} ${pinned[1]} is loaded from a URL here, which does not allow ${target}. `
            + `The tool does not edit HTML pages. Update the URL by hand.${below}`,
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
 * Add a dependency to a section. Keys stay in alphabetical order when they already were, and the new key goes last
 * otherwise. A missing section is created before `devDependencies`, or last. The text is edited by offset (see
 * `JsonDocument`), so the only new bytes are the new line.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of the `package.json`.
 * @param {string} section Section name.
 * @param {string} name Package name.
 * @param {string} range Version range.
 * @returns {boolean} `true` when the dependency was added. `false` edits nothing: the scan of the text and the
 * parsed file disagree.
 */
function addMember(ctx, section, name, range) {
  if (!ctx.json) {
    const manifest = ctx.root;

    if (!isObject(manifest[section])) {
      manifest[section] = {};
    }

    const keys = Object.keys(manifest[section]);
    const entries = Object.entries(manifest[section]);

    entries.splice(memberPosition(keys, name), 0, [name, range]);
    Object.keys(manifest[section]).forEach(key => delete manifest[section][key]);
    entries.forEach(([key, value]) => {
      manifest[section][key] = value;
    });

    return true;
  }

  return ctx.json.addMember(section, name, range);
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

    // A package of a monorepo can take the package from the root, so a declaration above this one counts. When it
    // shares no version with the new range, the install may end with two versions, and the tool does not edit the
    // other file.
    const above = declaredAbove(ctx, item.name);

    if (above && !compatible(above.range, item.range)) {
      ctx.report({
        ruleId: rule.id,
        severity: 'manual',
        message: `Update ${item.name} in ${above.file} to ${item.range}. `
          + `It is declared there as "${redact(above.range)}", which does not allow ${item.range}, `
          + `so the tool did not add ${item.name} to this package.json.`,
      });
      continue;
    }

    // A file above that the tool cannot read may declare it: the add would be a guess.
    const unreadable = above ? null : (ctx.ancestors ?? []).find(ancestor => ancestor.manifest === null);

    if (unreadable) {
      ctx.report({
        ruleId: rule.id,
        severity: 'manual',
        message: `Check ${item.name} in ${unreadable.file}: the tool could not read it as JSON, so it cannot `
          + `tell whether ${item.name} is declared there. It did not add ${item.name}@${item.range} to this `
          + 'package.json.',
      });
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

    if (!addMember(ctx, section, item.name, item.range)) {
      ctx.report({
        ruleId: rule.id,
        severity: 'manual',
        message: `Could not add ${item.name} to ${section} without reformatting package.json. Add `
          + `${item.name}@${item.range} by hand. Handsontable no longer installs it.`,
      });
      continue;
    }

    ctx.markChanged();
    ctx.report({
      ruleId: rule.id,
      severity: 'changed',
      message: `Added ${item.name} "${item.range}" to ${section}. Handsontable no longer installs it.`,
    });
  }
}

/**
 * Report packages the `package.json` does declare, for a rule that says a declared package needs a decision (a
 * deprecated package, say). With `whenFact`, only when phase 1 found that fact for this project. Nothing is edited.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of the `package.json`.
 * @param {import('../types.mjs').Rule} rule A rule with a `reportPresent` list of
 * `{ name, message, whenFact?, onlyIfDependsOn? }`.
 * @returns {void}
 */
function reportPresent(ctx, rule) {
  for (const item of Array.isArray(rule.reportPresent) ? rule.reportPresent : []) {
    if (!declares(ctx.root, item.name) || !dependsOnAny(ctx.root, item.onlyIfDependsOn)
      || (item.whenFact && !hasFactFor(ctx, item.whenFact))) {
      continue;
    }

    ctx.report({ ruleId: rule.id, severity: 'manual', message: item.message });
  }
}

/**
 * Join names for a sentence: `A`, `A and B`, `A, B, and C`.
 *
 * @param {string[]} items The names.
 * @returns {string} The text.
 */
function listOf(items) {
  if (items.length <= 2) {
    return items.join(' and ');
  }

  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

/**
 * The one-based line of a top-level key of a `package.json`, or `undefined` when the text cannot be scanned.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of the `package.json`.
 * @param {string} key The key.
 * @returns {number|undefined} The line.
 */
function lineOfKey(ctx, key) {
  try {
    const member = scanJson(ctx.json?.text ?? '')?.members.find(item => item.key === key);

    return member ? ctx.json.text.slice(0, member.keyStart).split('\n').length : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The most queries one message of the Browserslist check names. The rest are counted ("and 5 more").
 */
const MAX_QUERIES_LISTED = 10;

/**
 * Report one Browserslist configuration against the minimum browsers of a release: a `manual` entry that names the
 * queries below the minimum, and a `review` entry that names the queries the tool cannot judge. Nothing is edited.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of the `package.json`.
 * @param {import('../types.mjs').Rule} rule The rule that holds the minimums.
 * @param {object} found What the configuration holds.
 * @param {string} found.file The file the configuration is in.
 * @param {Array<{query: string, line?: number}>} found.queries Its queries, with their lines when it has them.
 * @param {number} [found.line] The line of the configuration, for a `package.json`.
 * @returns {void}
 */
function reportConfig(ctx, rule, { file, queries, line }) {
  const spec = rule.browserslist;
  const names = spec.names ?? {};
  const minimums = listOf(Object.entries(spec.minimums).map(([key, version]) => `${names[key] ?? key} ${version}`));
  const judged = judgeQueries(queries.map(item => item.query), spec);
  // A file can repeat a query many times. Each one is said once, and a long list is cut, so the message stays short.
  const below = [...new Set(judged.below)];
  const unchecked = [...new Set(judged.unchecked)];
  const lineOf = list => line ?? queries.find(item => item.query === list[0])?.line;
  const shown = list => list.slice(0, MAX_QUERIES_LISTED);
  const named = list => `${listOf(shown(list))}${list.length > MAX_QUERIES_LISTED
    ? ` and ${list.length - MAX_QUERIES_LISTED} more` : ''}`;

  if (below.length > 0) {
    ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      file,
      line: lineOf(below),
      todo: false,
      quoted: shown(below),
      message: `Raise the Browserslist targets in ${file} to the ${spec.release} minimums: ${minimums}. `
        + `${named(below)} ${below.length === 1 ? 'targets' : 'target'} an older version, and ${spec.release} does `
        + 'not support it. The tool never edits a Browserslist configuration.',
    });
  }

  if (unchecked.length > 0) {
    const those = unchecked.length === 1 ? 'that query' : 'those queries';

    ctx.report({
      ruleId: rule.id,
      severity: 'review',
      file,
      line: lineOf(unchecked),
      todo: false,
      quoted: shown(unchecked),
      message: `Check what ${named(unchecked)} in ${file} select, because the tool cannot judge ${those} without the `
        + `data of Browserslist. They are fine when no browser below the ${spec.release} minimums (${minimums}) is in `
        + 'the result: run npx browserslist in the project to see it.',
    });
  }
}

/**
 * Report the Browserslist configuration of a package against the minimum browsers a rule names: the `browserslist` key
 * of the `package.json`, and the `.browserslistrc` next to it (read by the runner). A package that does not declare one
 * of the packages in `onlyIfDependsOn` is not checked, and a package with no configuration says nothing.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of the `package.json`.
 * @param {import('../types.mjs').Rule} rule A rule with a `browserslist` object.
 * @returns {void}
 */
function reportBrowserslist(ctx, rule) {
  const spec = rule.browserslist;

  if (!isObject(spec) || !dependsOnAny(ctx.root, spec.onlyIfDependsOn)) {
    return;
  }

  if ('browserslist' in ctx.root) {
    reportConfig(ctx, rule, {
      file: ctx.filePath,
      queries: queriesOfPackage(ctx.root.browserslist).map(query => ({ query })),
      line: lineOfKey(ctx, 'browserslist'),
    });
  }

  if (ctx.browserslistrc?.skipped) {
    // The file exists and the tool could not use it. Say so as for any other file it skipped.
    ctx.report({
      ruleId: SKIPPED_RULE_ID,
      severity: 'warning',
      file: ctx.browserslistrc.file,
      message: ctx.browserslistrc.skipped,
    });
  } else if (ctx.browserslistrc) {
    reportConfig(ctx, rule, { file: ctx.browserslistrc.file, queries: queriesOfRc(ctx.browserslistrc.text) });
  }
}

/**
 * Check the items of a rule's `add`, `reportMissing`, and `reportPresent` lists.
 *
 * @param {import('../types.mjs').Rule} rule A `dependency` rule.
 * @returns {void}
 * @throws {Error} When an item has no `name`, an `add` item no `range`, or a `reportPresent` item no `message`.
 */
function assertItems(rule) {
  const needs = { add: ['name', 'range'], reportMissing: ['name'], reportPresent: ['name', 'message'] };

  for (const [list, fields] of Object.entries(needs)) {
    (Array.isArray(rule[list]) ? rule[list] : []).forEach((item, index) => {
      for (const field of fields) {
        if (typeof item?.[field] !== 'string' || item[field] === '') {
          throw new Error(`Rule ${rule.id}: "${list}[${index}].${field}" must be a string.`);
        }
      }

      // An `add` item picks the section of the package it adds to from the packages it depends on, so without
      // `onlyIfDependsOn` it would claim the project lists Handsontable as a peer dependency only.
      const hosts = item.onlyIfDependsOn;
      const named = typeof hosts === 'string' ? [hosts] : hosts;

      if ((hosts !== undefined || list === 'add') && (!Array.isArray(named) || named.length === 0
        || named.some(host => typeof host !== 'string' || host === ''))) {
        throw new Error(`Rule ${rule.id}: "${list}[${index}].onlyIfDependsOn" must be a package name or a non-empty `
          + 'list of package names.');
      }
    });
  }

  if ('reportOnly' in rule) {
    throw new Error(`Rule ${rule.id}: "reportOnly" is now "reportMissing".`);
  }

  if ('browserslist' in rule) {
    assertBrowserslist(rule);
  }
}

/**
 * Check the `browserslist` object of a rule: the minimum version of each browser, the name of the release, and the
 * packages that make a `package.json` worth checking.
 *
 * @param {import('../types.mjs').Rule} rule A `dependency` rule with a `browserslist` field.
 * @returns {void}
 * @throws {Error} When a field is missing or has the wrong shape.
 */
function assertBrowserslist(rule) {
  const spec = rule.browserslist;
  const fail = (text) => {
    throw new Error(`Rule ${rule.id}: "browserslist" ${text}`);
  };
  const isText = value => typeof value === 'string' && value !== '';
  const isVersion = value => typeof value === 'string' && /^\d+(?:\.\d+)*$/.test(value);
  const mapOf = (field, test, what) => {
    if (spec[field] !== undefined && (!isObject(spec[field]) || !Object.values(spec[field]).every(test))) {
      fail(`"${field}" must map a name to ${what}.`);
    }
  };

  if (!isObject(spec)) {
    fail('must be an object.');
  }

  if (!isObject(spec.minimums) || Object.keys(spec.minimums).length === 0
    || !Object.values(spec.minimums).every(isVersion)) {
    fail('"minimums" must map the Browserslist name of a browser to a version such as "130" or "18.2".');
  }

  if (!isText(spec.release)) {
    fail('"release" must name the release the minimums belong to, such as "Handsontable 19.0".');
  }

  if (!isText(spec.onlyIfDependsOn) && !(Array.isArray(spec.onlyIfDependsOn) && spec.onlyIfDependsOn.length > 0
    && spec.onlyIfDependsOn.every(isText))) {
    fail('"onlyIfDependsOn" must be a package name or a non-empty list of package names.');
  }

  mapOf('names', isText, 'a display name');
  mapOf('aliases', value => isText(value) && value in spec.minimums, 'the name of a browser in "minimums"');
}

/**
 * Report packages Handsontable used to install and no longer does, when the project imports them and does not
 * declare them. Nothing is added.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context of the `package.json`.
 * @param {import('../types.mjs').Rule} rule A rule with a `reportMissing` list of
 * `{ name, whenFact?, onlyIfDependsOn?, message? }`.
 * @returns {void}
 */
function reportMissing(ctx, rule) {
  for (const item of Array.isArray(rule.reportMissing) ? rule.reportMissing : []) {
    if (declares(ctx.root, item.name) || !dependsOnAny(ctx.root, item.onlyIfDependsOn)
      || (item.whenFact && !hasFactFor(ctx, item.whenFact))) {
      continue;
    }

    const site = item.whenFact ? factSite(ctx, item.whenFact) : null;
    const where = site ? `${site} imports it` : 'Your code imports it';
    const version = item.range
      ? ` Handsontable 17.1.0 shipped ${item.name} ${item.range}, so that range is a safe start.` : '';

    ctx.report({
      ruleId: rule.id,
      severity: 'manual',
      message: item.message
        ?? `Add ${item.name} to your dependencies. ${where}, and Handsontable no longer installs it.${version}`
        + ' The tool never adds it.',
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
  fileKinds: ['json', 'js', 'template'],
  scan: { fileKinds: ['js', 'template'], precheck: SCAN_PRECHECK },

  /**
   * @param {import('../types.mjs').Rule} rule A `dependency` rule.
   * @returns {string[]} The problems of the rule.
   */
  validate(rule) {
    return problemsOf(() => assertItems(rule));
  },

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

    if (ctx.fileKind === 'template') {
      if (/\.html?$/i.test(ctx.filePath)) {
        rules.forEach(rule => reportCdnPins(ctx, rule));
      }

      return;
    }

    if (!isObject(ctx.root)) {
      return;
    }

    for (const rule of rules) {
      bump(ctx, rule);
      reportPins(ctx, rule);
      reportReplaced(ctx, rule);
      addPackages(ctx, rule);
      reportMissing(ctx, rule);
      reportPresent(ctx, rule);
      reportBrowserslist(ctx, rule);
    }
  },
};

export default dependencies;
