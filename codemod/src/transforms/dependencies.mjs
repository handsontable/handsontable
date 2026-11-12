import { attributeName, propertyName } from '../lib/ast.mjs';
import { planRange, rangeAdmits } from '../lib/dependency-range.mjs';
import { addFact, dirOf, hasFactFor } from '../lib/facts.mjs';
import { memberPosition } from '../lib/json-edit.mjs';
import { rewrites } from '../lib/safety.mjs';
import { problemsOf } from '../lib/validate.mjs';

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
 * Raise the range of every listed package that the `package.json` declares, keeping the operator style. A range
 * that already allows the target version is left alone and not reported. Two migration steps that touch the same
 * entry produce one report entry that states the net change.
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
      const plan = planRange(current, target);

      if (plan.action === 'rewrite' && !rewrites(rule)) {
        ctx.report({
          ruleId: rule.id,
          severity: 'manual',
          mergeKey,
          message: `Update ${name} in ${section} from "${original}" to "${plan.value}".`,
        });
      } else if (plan.action === 'rewrite' && !setRange(ctx, section, name, plan.value)) {
        ctx.report({
          ruleId: rule.id,
          severity: 'manual',
          mergeKey,
          message: `Could not edit ${name} in ${section} without reformatting package.json. `
            + `Set it from "${original}" to "${plan.value}" by hand.`,
        });
      } else if (plan.action === 'rewrite') {
        written.set(key, original);
        ctx.markChanged();
        ctx.report({
          ruleId: rule.id,
          severity: 'changed',
          mergeKey,
          message: `Updated ${name} in ${section} from "${original}" to "${plan.value}".`,
        });
      } else if (plan.action === 'manual') {
        ctx.report({
          ruleId: rule.id,
          severity: 'manual',
          mergeKey,
          message: `${name} "${current}" in ${section} ${plan.reason}. Set it to ^${target} by hand.`,
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
  const last = key.split('>').pop().replace(/^(?:\*\*\/)+/, '');

  return names.find(name => last === name || last.startsWith(`${name}@`)
    || last.endsWith(`/${name}`) || last.includes(`/${name}@`)) ?? null;
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

    if (name && below(value, name)) {
      ctx.report({
        ruleId: rule.id,
        severity: 'manual',
        mergeKey: `pin:${label}`,
        message: `${label} pins ${name} to "${value}", which does not allow ${bumps[name]}. `
          + 'Update or remove it by hand. The tool does not edit overrides.',
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
          message: `${key} in ${section} is an alias of ${alias[1]}@${alias[2]}, which does not allow `
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
        ctx.report({
          ruleId: rule.id,
          severity: 'manual',
          line,
          mergeKey: `cdn:${line}:${name}`,
          message: `${name} ${pinned[1]} is loaded from a URL here, which does not allow ${target}. `
            + 'The tool does not edit HTML pages. Update the URL by hand.',
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
    });
  }

  if ('reportOnly' in rule) {
    throw new Error(`Rule ${rule.id}: "reportOnly" is now "reportMissing".`);
  }
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
    }
  },
};

export default dependencies;
