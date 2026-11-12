import { calleeName, propertyName, stringValue, unwrapNode } from '../lib/ast.mjs';
import { addFact } from '../lib/facts.mjs';
import { collectHotBindings } from '../lib/hot-bindings.mjs';
import { findDynamicImports, findImports, findReExports, findRequires } from '../lib/imports.mjs';
import { findOptionObjects, hasSpread } from '../lib/option-objects.mjs';
import { dynamicOptionSites, templateOptionSites } from '../lib/option-sites.mjs';
import { lookup } from '../lib/scope.mjs';

/**
 * A rule reports its matches one by one up to this number per part. A part with more matches gets one entry, at
 * the first match, that says how many there were. The limit is per part, so a Vue file with several script
 * blocks can report a rule more than once.
 */
export const COLLAPSE_AFTER = 5;

const FILE_KINDS = ['js', 'css', 'template'];
const SEVERITIES = ['manual', 'warning'];
const REQUIRES = ['hot-file', 'option-object', 'none'];
const JS_ONLY_MATCHERS = ['import', 'property', 'call', 'hook', 'string', 'missingOption', 'namespaceMember',
  'annotatedObject'];
const ANY_MATCHERS = ['regex', 'selector'];

/**
 * The fields each matcher may carry besides its own key. A field with no entry here is a typo.
 */
const MODIFIERS = {
  import: [],
  property: ['withKey', 'siblingKey', 'valueMatches', 'in', 'flags'],
  annotatedObject: ['flags'],
  call: ['argMatches', 'receiver', 'flags'],
  hook: [],
  namespaceMember: [],
  string: ['flags'],
  selector: ['flags'],
  regex: ['flags'],
  missingOption: ['whenAnyKey', 'whenValueMatches', 'unlessFileMatches', 'flags'],
};

const WRAPPERS = new Set(['TSAsExpression', 'TSSatisfiesExpression', 'TSNonNullExpression', 'TSTypeAssertion',
  'ParenthesizedExpression']);
const MEMBERS = new Set(['MemberExpression', 'OptionalMemberExpression']);
const MAX_STRING_DEPTH = 8;

/**
 * Turn a manifest field that holds one value or a list into a list.
 *
 * @param {unknown} value A value or an array of values.
 * @returns {unknown[]} The values.
 */
function listOf(value) {
  return Array.isArray(value) ? value : [value];
}

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
 * Name of the matcher a spec uses, or the compound it is.
 *
 * @param {object} spec A matcher object from a rule's `match`.
 * @returns {string[]} The matcher keys the object carries.
 */
function matcherKeys(spec) {
  return Object.keys(spec).filter(key => [...JS_ONLY_MATCHERS, ...ANY_MATCHERS, 'anyOf', 'allOf'].includes(key));
}

/**
 * Check a `match` tree and return the problems found. Pure: it does not read files.
 *
 * @param {unknown} spec A matcher object, or an `anyOf` or `allOf` compound of them.
 * @param {string[]} files The rule's `files`.
 * @param {string} where Path used in problem texts.
 * @returns {string[]} Problem descriptions, empty when the tree is valid.
 */
function validateMatch(spec, files, where) {
  if (!isObject(spec)) {
    return [`${where} must be an object`];
  }

  const keys = matcherKeys(spec);

  if (keys.length !== 1) {
    return [`${where} must name exactly one matcher (${[...JS_ONLY_MATCHERS, ...ANY_MATCHERS, 'anyOf', 'allOf']
      .join(', ')}), found ${keys.length}`];
  }

  const [key] = keys;

  if (key === 'anyOf' || key === 'allOf') {
    const extra = Object.keys(spec).filter(field => field !== key);

    if (!Array.isArray(spec[key]) || spec[key].length === 0) {
      return [`${where}.${key} must be a non-empty array`];
    }

    return [
      ...extra.map(field => `${where} has unknown field "${field}"`),
      ...spec[key].flatMap((item, index) => validateMatch(item, files, `${where}.${key}[${index}]`)),
    ];
  }

  const problems = Object.keys(spec)
    .filter(field => field !== key && !MODIFIERS[key].includes(field))
    .map(field => `${where} has unknown field "${field}" for the ${key} matcher`);

  const readable = ['property', 'annotatedObject'].includes(key) ? ['js', 'template'] : ['js'];

  if (JS_ONLY_MATCHERS.includes(key) && files.some(file => !readable.includes(file))) {
    problems.push(`${where}: the ${key} matcher reads js only${readable.length > 1 ? ', and templates' : ''}, `
      + `so "files" must be ${JSON.stringify(readable)} or a part of it`);
  }

  if (key === 'missingOption' && typeof spec.missingOption !== 'string') {
    problems.push(`${where}.missingOption must be a key name`);
  }

  if (['string', 'selector', 'regex'].includes(key) && typeof spec[key] !== 'string') {
    problems.push(`${where}.${key} must be a regular expression source`);
  }

  if (key === 'property' && !listOf(spec.property).every(item => typeof item === 'string' && item)) {
    problems.push(`${where}.property must be a dotted key path or a list of them`);
  }

  if (key === 'annotatedObject' && !listOf(spec.annotatedObject).every(item => typeof item === 'string' && item)) {
    problems.push(`${where}.annotatedObject must be a type name or a list of them`);
  }

  if (spec.siblingKey !== undefined && (typeof spec.siblingKey !== 'string' || !spec.siblingKey
    || listOf(spec.property).some(item => item.includes('.')))) {
    problems.push(`${where}.siblingKey must be a key name, and goes with a property of one segment`);
  }

  if (key === 'namespaceMember' && !listOf(spec.namespaceMember).every(item => typeof item === 'string' && item)) {
    problems.push(`${where}.namespaceMember must be a member path after the namespace or a list of them`);
  }

  if (spec.in !== undefined && spec.in !== 'option-object') {
    problems.push(`${where}.in must be "option-object"`);
  }

  for (const field of ['valueMatches', 'argMatches', 'whenValueMatches', 'unlessFileMatches', 'flags']) {
    if (field in spec && typeof spec[field] !== 'string') {
      problems.push(`${where}.${field} must be a string`);
    }
  }

  if (typeof spec.flags === 'string' && !/^[imsu]*$/.test(spec.flags)) {
    problems.push(`${where}.flags may hold only i, m, s, and u`);
  }

  for (const field of ['string', 'selector', 'regex', 'valueMatches', 'argMatches', 'whenValueMatches',
    'unlessFileMatches']) {
    if (typeof spec[field] === 'string') {
      try {
        regexOf(spec[field], spec.flags ?? '');
      } catch (error) {
        problems.push(`${where}.${field} is not a valid regular expression: ${error.message}`);
      }
    }
  }

  return problems;
}

/**
 * Check the fields of one `detect` rule that the manifest validator does not check, and return the problems
 * found. The shipped rules are pinned against it by `test/detect.test.mjs`.
 *
 * @param {object} rule A `detect` rule.
 * @returns {string[]} Problem descriptions, empty when the rule is valid.
 */
export function validateDetectRule(rule) {
  const problems = [];
  const files = Array.isArray(rule.files) ? rule.files : [];

  if (typeof rule.message !== 'string' || rule.message === '') {
    problems.push('"message" is required');
  }

  if (files.length === 0 || files.some(file => !FILE_KINDS.includes(file))) {
    problems.push(`"files" must be a non-empty list of ${FILE_KINDS.join(', ')}`);
  }

  if (rule.severity !== undefined && !SEVERITIES.includes(rule.severity)) {
    problems.push(`"severity" must be one of ${SEVERITIES.join(', ')}`);
  }

  if (rule.requires !== undefined && !REQUIRES.includes(rule.requires)) {
    problems.push(`"requires" must be one of ${REQUIRES.join(', ')}`);
  }

  return [...problems, ...validateMatch(rule.match, files, 'match')];
}

/**
 * Build a regular expression from a manifest source and flags.
 *
 * @param {string|undefined} source Pattern source, or `undefined`.
 * @param {string} [flags] Flags.
 * @returns {RegExp|null} The expression, or `null` when there is no source.
 */
function regexOf(source, flags = '') {
  return typeof source === 'string' ? new RegExp(source, flags) : null;
}

/**
 * A `match` tree with its regular expressions built, so a rule compiles once per run.
 *
 * @typedef {object} Compiled
 * @property {'anyOf'|'allOf'|'matcher'} type Node type.
 * @property {Compiled[]} [children] Children of a compound.
 * @property {string} [key] Matcher name.
 * @property {object} [spec] The manifest object of a matcher.
 * @property {Record<string, RegExp|null>} [re] The expressions of a matcher by field name.
 */

/**
 * Compile a validated `match` tree.
 *
 * @param {object} spec The matcher object or compound.
 * @returns {Compiled} The compiled node.
 */
function compileMatch(spec) {
  const [key] = matcherKeys(spec);

  if (key === 'anyOf' || key === 'allOf') {
    return { type: key, children: spec[key].map(compileMatch) };
  }

  const flags = spec.flags ?? '';

  return {
    type: 'matcher',
    key,
    spec,
    re: {
      primary: ['string', 'selector'].includes(key) ? regexOf(spec[key], flags) : null,
      raw: key === 'regex' ? regexOf(spec.regex, `${flags.replace('g', '')}g`) : null,
      value: regexOf(spec.valueMatches, flags),
      arg: regexOf(spec.argMatches, flags),
      whenValue: regexOf(spec.whenValueMatches, flags),
      unlessFile: regexOf(spec.unlessFileMatches, flags),
    },
  };
}

const compiledRules = new WeakMap();

/**
 * Validate and compile a rule once.
 *
 * @param {import('../types.mjs').Rule} rule A `detect` rule.
 * @returns {{tree: Compiled, files: string[], requires: string, severity: string}} The compiled rule.
 * @throws {Error} When the rule is invalid.
 */
function compileRule(rule) {
  if (!compiledRules.has(rule)) {
    const problems = validateDetectRule(rule);

    if (problems.length > 0) {
      throw new Error(`${rule.id}: ${problems.join('; ')}`);
    }

    compiledRules.set(rule, {
      tree: compileMatch(rule.match),
      files: rule.files,
      requires: rule.requires ?? 'hot-file',
      severity: rule.severity ?? 'manual',
    });
  }

  return compiledRules.get(rule);
}

/**
 * Wrap a function so it runs once and keeps its value.
 *
 * @param {Function} compute The function.
 * @returns {Function} The memoized function.
 */
function memo(compute) {
  let done = false;
  let value;

  return () => {
    if (!done) {
      value = compute();
      done = true;
    }

    return value;
  };
}

/**
 * The one-based line of a node.
 *
 * @param {object|null|undefined} node An AST node.
 * @returns {number|undefined} The line, `undefined` for a node another transform created.
 */
function lineOfNode(node) {
  return node?.loc?.start?.line;
}

/**
 * The one-based line of a text offset.
 *
 * @param {string} source The text.
 * @param {number} index Character offset.
 * @returns {number} The line.
 */
function lineAt(source, index) {
  let line = 1;

  for (let position = source.indexOf('\n'); position !== -1 && position < index;
    position = source.indexOf('\n', position + 1)) {
    line += 1;
  }

  return line;
}

/**
 * Collect the plain strings an expression holds: string literals, no-expression template literals, the text
 * of a template literal with expressions, and what sits inside arrays, objects, call and `new` arguments, `+`,
 * and `?:`. Functions are not entered.
 *
 * @param {object|null|undefined} node An expression node.
 * @param {string[]} [out] Accumulator.
 * @param {number} [depth] Recursion guard.
 * @returns {string[]} The strings.
 */
export function stringsIn(node, out = [], depth = 0) {
  const target = unwrapNode(node);

  if (!target || depth > MAX_STRING_DEPTH) {
    return out;
  }

  const text = stringValue(target);

  if (text !== null) {
    out.push(text);

    return out;
  }

  const next = child => stringsIn(child, out, depth + 1);

  switch (target.type) {
    case 'TemplateLiteral':
      target.quasis.forEach(quasi => out.push(quasi.value.cooked ?? quasi.value.raw));
      break;
    case 'ArrayExpression':
      target.elements.forEach(next);
      break;
    case 'NewExpression':
    case 'CallExpression':
    case 'OptionalCallExpression':
      target.arguments.forEach(next);
      break;
    case 'ObjectExpression':
      target.properties.forEach(property => next(property.type === 'ObjectProperty' ? property.value : null));
      break;
    case 'BinaryExpression':
      if (target.operator === '+') {
        next(target.left);
        next(target.right);
      }

      break;
    case 'ConditionalExpression':
      next(target.consequent);
      next(target.alternate);
      break;
    default:
  }

  return out;
}

/**
 * Text of a receiver expression: `fireEvent`, `this`, or `a.b`.
 *
 * @param {object} node An expression node.
 * @returns {string|null} The text, or `null` for anything else.
 */
function receiverText(node) {
  const target = unwrapNode(node);

  if (target.type === 'Identifier') {
    return target.name;
  }

  if (target.type === 'ThisExpression') {
    return 'this';
  }

  if (MEMBERS.has(target.type) && !target.computed && target.property.type === 'Identifier') {
    const base = receiverText(target.object);

    return base === null ? null : `${base}.${target.property.name}`;
  }

  return null;
}

/**
 * Per-part state shared by every rule of one `apply` call. The js analyses are built on first use, after the
 * transforms that ran before have edited the tree.
 *
 * @typedef {object} Env
 * @property {import('../types.mjs').Ctx} ctx The transform context.
 * @property {string} source Text of the part.
 * @property {object|null} j The jscodeshift API.
 * @property {object} root The parsed form of the part.
 * @property {string} requires The `requires` of the rule being evaluated.
 * @property {() => import('../lib/hot-bindings.mjs').HotBindings} bindings Hot bindings of the part.
 * @property {() => import('../lib/option-objects.mjs').OptionObject[]} optionList Option objects of the part.
 * @property {() => Set<object>} optionNodes The nodes of those objects.
 */

/**
 * Build the state for one part.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context.
 * @returns {Env} The state.
 */
function createEnv(ctx) {
  const bindings = memo(() => collectHotBindings(ctx.j, ctx.root));
  const optionList = memo(() => findOptionObjects(ctx.j, ctx.root, bindings()));
  const optionNodes = memo(() => new Set(optionList().map(item => item.path.node)));

  return { ctx, source: ctx.source, j: ctx.j, root: ctx.root, requires: 'hot-file', bindings, optionList, optionNodes };
}

/**
 * One match of a matcher.
 *
 * @typedef {object} Match
 * @property {number|undefined} line One-based line inside the part.
 */

/**
 * Find the matches of an `import` matcher: imports, re-exports, `require()`, and `import()` of a module or a
 * file inside it.
 *
 * @param {Env} env Part state.
 * @param {Compiled} node The compiled matcher.
 * @returns {Match[]} The matches.
 */
function matchImport(env, node) {
  const names = listOf(node.spec.import);
  const isMatch = moduleName => names.some(name => moduleName === name || moduleName.startsWith(`${name}/`));
  const { j, root } = env;

  return [findImports, findReExports, findDynamicImports, findRequires]
    .flatMap(find => find(j, root, isMatch))
    .map(path => ({ line: lineOfNode(path.node) }));
}

/**
 * Climb out of type assertions and parentheses.
 *
 * @param {object} path A NodePath.
 * @returns {object} The outermost NodePath of the wrapped expression.
 */
function climbWrappers(path) {
  let current = path;

  while (current.parent && WRAPPERS.has(current.parent.node.type) && current.parent.node.expression === current.node) {
    current = current.parent;
  }

  return current;
}

/**
 * The property or JSX attribute that holds an object literal as its value.
 *
 * @param {object} container NodePath of an `ObjectExpression`.
 * @returns {object|null} NodePath of the `ObjectProperty` or `JSXAttribute`, or `null`.
 */
function holderOf(container) {
  const outer = climbWrappers(container);
  const parent = outer.parent;

  if (!parent) {
    return null;
  }

  if ((parent.node.type === 'ObjectProperty' || parent.node.type === 'Property') && parent.node.value === outer.node) {
    return parent;
  }

  if (parent.node.type === 'JSXExpressionContainer' && parent.parent?.node.type === 'JSXAttribute') {
    return parent.parent;
  }

  return null;
}

/**
 * Name of a JSX attribute.
 *
 * @param {object} node A `JSXAttribute` node.
 * @returns {string|null} The name, or `null` for a namespaced name.
 */
function attributeName(node) {
  return node.name.type === 'JSXIdentifier' ? node.name.name : null;
}

/**
 * Resolve where a property sits for a dotted key path: below which option object, or on which JSX element.
 *
 * @param {object} propertyPath NodePath of the last property (or JSX attribute) of the path.
 * @param {string[]} segments The key path split at the dots.
 * @returns {{object: object|null, element: object|null}|null} The `ObjectExpression` NodePath that holds the
 * first key, or the NodePath of the JSX opening element whose attribute holds it. `null` when the property is
 * not at that path.
 */
function resolveOrigin(propertyPath, segments) {
  if (propertyPath.node.type === 'JSXAttribute') {
    return segments.length === 1 ? { object: null, element: propertyPath.parent } : null;
  }

  let container = propertyPath.parent;

  if (container?.node.type !== 'ObjectExpression') {
    return null;
  }

  for (let index = segments.length - 2; index >= 0; index--) {
    const holder = holderOf(container);

    if (!holder) {
      return null;
    }

    if (holder.node.type === 'JSXAttribute') {
      return index === 0 && attributeName(holder.node) === segments[0]
        ? { object: null, element: holder.parent } : null;
    }

    if (propertyName(holder.node) !== segments[index] || holder.parent?.node.type !== 'ObjectExpression') {
      return null;
    }

    container = holder.parent;
  }

  return { object: container, element: null };
}

/**
 * The value expression of a property or JSX attribute.
 *
 * @param {object} node An `ObjectProperty`, `ObjectMethod`, or `JSXAttribute` node.
 * @returns {object|null|undefined} The value node, `null` for a method or a bare attribute.
 */
function valueOfProperty(node) {
  if (node.type === 'JSXAttribute') {
    return node.value?.type === 'JSXExpressionContainer' ? node.value.expression : node.value;
  }

  return node.type === 'ObjectMethod' ? null : node.value;
}

/**
 * Find the matches of a `property` matcher: an object property or JSX attribute at a dotted key path.
 *
 * @param {Env} env Part state.
 * @param {Compiled} node The compiled matcher.
 * @returns {Match[]} The matches.
 */
function matchProperty(env, node) {
  if (env.ctx.fileKind === 'template') {
    return matchTemplateProperty(env, node);
  }

  const { j, root } = env;
  const { spec, re } = node;
  const paths = listOf(spec.property).map(dotted => dotted.split('.'));
  const optionOnly = (spec.in ?? (env.requires === 'option-object' ? 'option-object' : null)) === 'option-object';
  const seen = new Set();
  const matches = [];

  const visit = (path) => {
    if (seen.has(path.node)) {
      return;
    }

    seen.add(path.node);

    const name = path.node.type === 'JSXAttribute' ? attributeName(path.node) : propertyName(path.node);

    for (const segments of paths) {
      if (segments[segments.length - 1] !== name) {
        continue;
      }

      const origin = resolveOrigin(path, segments);

      if (!origin) {
        continue;
      }

      if (optionOnly && !(origin.element ? env.bindings().getComponent(origin.element)
        : env.optionNodes().has(origin.object.node))) {
        continue;
      }

      const value = valueOfProperty(path.node);

      if (spec.siblingKey !== undefined) {
        const siblings = origin.element
          ? origin.element.node.attributes.map(item => (item.type === 'JSXAttribute' ? attributeName(item) : null))
          : origin.object.node.properties.map(item => propertyName(item));

        if (!siblings.includes(spec.siblingKey)) {
          continue;
        }
      }

      if (spec.withKey !== undefined) {
        const target = unwrapNode(value);

        const hasKey = target?.type === 'ObjectExpression'
          && target.properties.some(item => propertyName(item) === spec.withKey);

        if (!hasKey) {
          continue;
        }
      }

      if (re.value) {
        const text = stringValue(unwrapNode(value));

        if (text === null || !re.value.test(text)) {
          continue;
        }
      }

      matches.push({ line: lineOfNode(path.node) });
    }
  };

  [j.ObjectProperty, j.Property, j.ObjectMethod, j.JSXAttribute]
    .filter(Boolean)
    .forEach(type => root.find(type).forEach(visit));

  return [...matches, ...matchDynamicProperty(env, node)];
}

/**
 * Whether a value node is an object literal with a key.
 *
 * @param {object|null|undefined} value A value node.
 * @param {string} key Key name.
 * @returns {boolean} `true` for an object literal that sets the key.
 */
function objectHasKey(value, key) {
  const target = value ? unwrapNode(value) : null;

  return target?.type === 'ObjectExpression' && target.properties.some(item => propertyName(item) === key);
}

/**
 * Find the places a `property` matcher's option is set by assignment (`column.dateFormat = ...`) or by
 * `setCellMeta()` in a Handsontable file. A dotted path matches `a.b = ...` and `x.a.b = ...`, and a value of `a`
 * that is an object literal with `b`. The `valueMatches` and `withKey` modifiers apply to the assigned value.
 *
 * @param {Env} env Part state.
 * @param {Compiled} node The compiled matcher.
 * @returns {Match[]} The matches.
 */
function matchDynamicProperty(env, node) {
  const { spec, re } = node;

  if (!env.bindings().isHotFile || spec.siblingKey !== undefined) {
    return [];
  }

  const paths = listOf(spec.property).map(dotted => dotted.split('.'));

  return dynamicOptionSites(env.j, env.root).filter(site => paths.some((segments) => {
    const last = segments[segments.length - 1];
    const before = segments[segments.length - 2];
    const set = site.name === last && (segments.length === 1 || site.parent === before);
    const holds = segments.length > 1 && site.name === before && objectHasKey(site.value, last);

    if (!set && !holds) {
      return false;
    }

    if (set && spec.withKey !== undefined && !objectHasKey(site.value, spec.withKey)) {
      return false;
    }

    if (re.value) {
      const text = site.value ? stringValue(unwrapNode(site.value)) : null;

      return text !== null && re.value.test(text);
    }

    return true;
  })).map(site => ({ line: site.line }));
}

/**
 * Find the matches of a `property` matcher in a template: attributes of the wrapper tags (`<hot-column>`,
 * `<HotColumn>`, ...) that bind the option, in kebab-case or camel-case, with `:`, `v-bind:`, or `[...]`, and
 * `settings` bindings that name it. The option is the first segment of the dotted path. For a longer path, an
 * attribute whose value is an object literal must name the next segment, while a value that is a reference is kept,
 * because the template cannot say what it holds. The `valueMatches` modifier tests the attribute value.
 *
 * @param {Env} env Part state.
 * @param {Compiled} node The compiled matcher.
 * @returns {Match[]} The matches.
 */
function matchTemplateProperty(env, node) {
  const { spec, re } = node;

  if (spec.siblingKey !== undefined) {
    return [];
  }
  const paths = listOf(spec.property).map(dotted => dotted.split('.'));
  const named = word => new RegExp(`(?<![\\w$])${word}(?![\\w$])`);

  return templateOptionSites(env.source, paths.map(segments => segments[0]))
    .filter((site) => {
      const needs = [...paths.filter(segments => segments[0] === site.name && segments.length > 1)
        .map(segments => segments[1]), ...(spec.withKey === undefined ? [] : [spec.withKey])];
      const literal = site.value !== null && /^\s*\{/.test(site.value.replace(/^['"]/, ''));

      if (needs.length > 0 && literal && !needs.some(word => named(word).test(site.value))) {
        return false;
      }

      return !re.value || (site.value !== null && re.value.test(site.value));
    })
    .map(site => ({ line: site.line }));
}

/**
 * Find the matches of an `annotatedObject` matcher: an object literal that a type annotation, `as`, or `satisfies`
 * names with one of the listed types (the last segment of a qualified name counts), as in
 * `const format: NumericFormatOptions = { ... }`.
 *
 * @param {Env} env Part state.
 * @param {Compiled} node The compiled matcher.
 * @returns {Match[]} The matches, at the object.
 */
function matchAnnotatedObject(env, node) {
  const { j, root } = env;
  const names = new Set(listOf(node.spec.annotatedObject));
  const named = (type) => {
    const reference = type?.type === 'TSTypeAnnotation' ? type.typeAnnotation : type;
    const typeName = reference?.type === 'TSTypeReference' ? reference.typeName : null;
    const last = typeName?.type === 'TSQualifiedName' ? typeName.right.name : typeName?.name;

    return names.has(last);
  };
  const matches = [];

  root.find(j.VariableDeclarator).forEach((path) => {
    const init = path.node.init ? unwrapNode(path.node.init) : null;

    if (init?.type === 'ObjectExpression' && named(path.node.id.typeAnnotation)) {
      matches.push({ line: lineOfNode(init) });
    }
  });

  [j.TSAsExpression, j.TSSatisfiesExpression].filter(Boolean).forEach((type) => {
    root.find(type).forEach((path) => {
      if (path.node.expression.type === 'ObjectExpression' && named(path.node.typeAnnotation)) {
        matches.push({ line: lineOfNode(path.node.expression) });
      }
    });
  });

  return matches;
}

/**
 * Find the matches of a `call` matcher: calls of a method or function by name.
 *
 * @param {Env} env Part state.
 * @param {Compiled} node The compiled matcher.
 * @returns {Match[]} The matches.
 */
function matchCall(env, node) {
  const { j, root } = env;
  const { spec, re } = node;
  const names = listOf(spec.call);
  const matches = [];

  [j.CallExpression, j.OptionalCallExpression].filter(Boolean).forEach(type => root.find(type).forEach((path) => {
    if (!names.includes(calleeName(path.node.callee))) {
      return;
    }

    if (spec.receiver !== undefined) {
      const callee = unwrapNode(path.node.callee);

      if (!MEMBERS.has(callee.type)) {
        return;
      }

      const isMatch = spec.receiver === 'instance'
        ? env.bindings().isInstance(path.get('callee', 'object'))
        : receiverText(callee.object) === spec.receiver;

      if (!isMatch) {
        return;
      }
    }

    if (re.arg && !path.node.arguments.some(argument => stringsIn(argument).some(text => re.arg.test(text)))) {
      return;
    }

    matches.push({ line: lineOfNode(path.node) });
  }));

  return matches;
}

/**
 * Find the matches of a `hook` matcher: a hook used as an option key, a JSX prop, or the name in `addHook()`,
 * `addHookOnce()`, `Handsontable.hooks.add()`, or `Handsontable.hooks.once()`.
 *
 * @param {Env} env Part state.
 * @param {Compiled} node The compiled matcher.
 * @returns {Match[]} The matches.
 */
function matchHook(env, node) {
  const names = listOf(node.spec.hook);
  const keyed = matchProperty({ ...env, requires: 'option-object' }, {
    ...node,
    spec: { property: names, in: 'option-object' },
    re: {},
  });
  const calls = [];

  [env.j.CallExpression, env.j.OptionalCallExpression].filter(Boolean).forEach(type => env.root.find(type)
    .forEach((path) => {
      const callee = unwrapNode(path.node.callee);
      const name = calleeName(callee);
      const hookName = stringValue(path.node.arguments[0]);

      if (hookName === null || !names.includes(hookName)) {
        return;
      }

      const viaNamespace = ['add', 'once'].includes(name) && MEMBERS.has(callee.type)
        && ['hooks.add', 'hooks.once'].includes(env.bindings().resolveNamespaceMember(path.get('callee')));

      if (name === 'addHook' || name === 'addHookOnce' || viaNamespace) {
        calls.push({ line: lineOfNode(path.node) });
      }
    }));

  return [...keyed, ...calls];
}

/**
 * Find the matches of a `namespaceMember` matcher: a read of `<namespace>.<path>` where the root is the file's own
 * `Handsontable` binding (a default import, a namespace import, or the global), with no call needed.
 *
 * @param {Env} env Part state.
 * @param {Compiled} node The compiled matcher.
 * @returns {Match[]} The matches.
 */
function matchNamespaceMember(env, node) {
  const names = listOf(node.spec.namespaceMember);
  const matches = [];

  [env.j.MemberExpression, env.j.OptionalMemberExpression].filter(Boolean).forEach(type => env.root.find(type)
    .forEach((path) => {
      if (names.includes(env.bindings().resolveNamespaceMember(path))) {
        matches.push({ line: lineOfNode(path.node) });
      }
    }));

  return matches;
}

/**
 * Collect the string literals and template text of a js part.
 *
 * @param {Env} env Part state.
 * @param {RegExp} pattern Test for one string.
 * @returns {Match[]} One match per string that passes.
 */
function matchStrings(env, pattern) {
  const matches = [];
  const { j, root } = env;

  root.find(j.Literal).forEach((path) => {
    if (typeof path.node.value === 'string' && pattern.test(path.node.value)) {
      matches.push({ line: lineOfNode(path.node) });
    }
  });
  root.find(j.TemplateElement).forEach((path) => {
    if (pattern.test(path.node.value.cooked ?? path.node.value.raw)) {
      matches.push({ line: lineOfNode(path.node) });
    }
  });

  return matches;
}

/**
 * Find every match of a pattern in the raw text of a part.
 *
 * @param {Env} env Part state.
 * @param {RegExp} pattern A global expression.
 * @returns {Match[]} One match per hit, with its line.
 */
function matchRaw(env, pattern) {
  return [...env.source.matchAll(pattern)].map(hit => ({ line: lineAt(env.source, hit.index) }));
}

/**
 * Find the matches of a `selector` matcher. In a stylesheet it tests the selector of every rule, in js it tests
 * string literals and template text, and in a template it tests the raw text.
 *
 * @param {Env} env Part state.
 * @param {Compiled} node The compiled matcher.
 * @returns {Match[]} The matches.
 */
function matchSelector(env, node) {
  const pattern = node.re.primary;

  if (env.ctx.fileKind === 'js') {
    return matchStrings(env, pattern);
  }

  if (env.ctx.fileKind === 'css') {
    const matches = [];

    env.root.walkRules((rule) => {
      if (pattern.test(rule.selector)) {
        matches.push({ line: rule.source?.start?.line });
      }
    });

    return matches;
  }

  return matchRaw(env, new RegExp(pattern.source, `${pattern.flags.replace('g', '')}g`));
}

/**
 * What a `missingOption` check needs to know about one grid configuration.
 *
 * @typedef {object} Candidate
 * @property {number|undefined} line Line of the object or the JSX element.
 * @property {Map<string, object|null>} keys Own keys with their value nodes.
 * @property {boolean} unknown `true` when a spread, a computed key, or an unresolved `settings` hides keys.
 */

/**
 * Read the keys of an object literal node into a candidate.
 *
 * @param {object} objectNode An `ObjectExpression` node.
 * @param {Candidate} candidate The candidate to fill.
 * @returns {void}
 */
function readKeys(objectNode, candidate) {
  const path = { node: objectNode };

  candidate.unknown = candidate.unknown || hasSpread(path);

  for (const property of objectNode.properties) {
    if (property.type !== 'ObjectProperty' && property.type !== 'ObjectMethod') {
      continue;
    }

    const name = propertyName(property);

    if (name === null) {
      candidate.unknown = true;
    } else {
      candidate.keys.set(name, valueOfProperty(property));
    }
  }
}

/**
 * Describe a `<HotTable>` element: its attributes merged with the object in `settings={...}`. An unresolvable
 * `settings` or a spread attribute marks the element unknown.
 *
 * @param {object} elementPath NodePath of the `JSXElement`.
 * @returns {Candidate} The candidate.
 */
function describeElement(elementPath) {
  const candidate = { line: lineOfNode(elementPath.node.openingElement), keys: new Map(), unknown: false };

  elementPath.node.openingElement.attributes.forEach((attribute, index) => {
    if (attribute.type !== 'JSXAttribute' || attributeName(attribute) === null) {
      candidate.unknown = true;

      return;
    }

    const name = attributeName(attribute);

    if (name !== 'settings') {
      candidate.keys.set(name, valueOfProperty(attribute));

      return;
    }

    const valuePath = elementPath.get('openingElement', 'attributes', index, 'value', 'expression');
    let resolved = unwrapNode(valueOfProperty(attribute));

    if (resolved?.type === 'Identifier') {
      resolved = unwrapNode(lookup(valuePath, resolved.name)?.init);
    }

    if (resolved?.type === 'ObjectExpression') {
      readKeys(resolved, candidate);
    } else {
      candidate.unknown = true;
    }
  });

  return candidate;
}

/**
 * Find the matches of a `missingOption` matcher. It looks at the grid configurations the file builds itself: an
 * object passed to `new Handsontable(element, {...})` (directly or through one variable), and every `<HotTable>`
 * element with its `settings` object merged in. It does not look at `updateSettings()` objects, spreads,
 * annotated objects, or column and cell objects, because a missing key there proves nothing. A configuration that
 * hides keys behind a spread, a computed key, or an `settings` it cannot resolve is skipped.
 *
 * @param {Env} env Part state.
 * @param {Compiled} node The compiled matcher.
 * @returns {Match[]} The matches.
 */
function matchMissingOption(env, node) {
  const { spec, re } = node;

  if (re.unlessFile?.test(env.source)) {
    return [];
  }

  const candidates = env.optionList()
    .filter(item => item.confidence === 'high' && item.role === 'grid'
      && ['new', 'new:identifier'].includes(item.origin))
    .map((item) => {
      const candidate = { line: lineOfNode(item.path.node), keys: new Map(), unknown: false };

      readKeys(item.path.node, candidate);

      return candidate;
    });

  env.root.find(env.j.JSXElement).forEach((path) => {
    if (env.bindings().getComponent(path) === 'HotTable') {
      candidates.push(describeElement(path));
    }
  });

  return candidates
    .filter((candidate) => {
      if (candidate.unknown || candidate.keys.has(spec.missingOption)) {
        return false;
      }

      return !spec.whenAnyKey || spec.whenAnyKey.some(key => candidate.keys.has(key)
        && (!re.whenValue || stringsIn(candidate.keys.get(key)).some(text => re.whenValue.test(text))));
    })
    .map(candidate => ({ line: candidate.line }));
}

/**
 * Evaluate a compiled match tree against one part.
 *
 * - A matcher returns its matches.
 * - `anyOf` returns the matches of every child.
 * - `allOf` returns the matches of its first child, and only when every other child matches somewhere in the
 *   part. The other children are conditions: they report nothing.
 *
 * @param {Env} env Part state.
 * @param {Compiled} node The compiled tree.
 * @returns {Match[]} The matches.
 */
function evaluate(env, node) {
  if (node.type === 'anyOf') {
    return node.children.flatMap(child => evaluate(env, child));
  }

  if (node.type === 'allOf') {
    const [first, ...gates] = node.children;

    return gates.every(gate => evaluate(env, gate).length > 0) ? evaluate(env, first) : [];
  }

  switch (node.key) {
    case 'import':
      return matchImport(env, node);
    case 'property':
      return matchProperty(env, node);
    case 'call':
      return matchCall(env, node);
    case 'hook':
      return matchHook(env, node);
    case 'annotatedObject':
      return env.ctx.fileKind === 'js' ? matchAnnotatedObject(env, node) : [];
    case 'namespaceMember':
      return matchNamespaceMember(env, node);
    case 'string':
      return matchStrings(env, node.re.primary);
    case 'selector':
      return matchSelector(env, node);
    case 'regex':
      return matchRaw(env, node.re.raw);
    default:
      return matchMissingOption(env, node);
  }
}

/**
 * Drop the matches that share a line, keeping the first of each, and order them by line.
 *
 * @param {Match[]} matches The matches.
 * @returns {Match[]} Unique matches by line, unknown lines last.
 */
function uniqueByLine(matches) {
  const seen = new Set();
  const unique = matches.filter((match) => {
    if (match.line === undefined) {
      return true;
    }

    const fresh = !seen.has(match.line);

    seen.add(match.line);

    return fresh;
  });

  return unique.sort((a, b) => (a.line ?? Infinity) - (b.line ?? Infinity));
}

/**
 * Apply one rule to a part: evaluate it, report the matches, and record the rule's fact.
 *
 * @param {Env} env Part state.
 * @param {import('../types.mjs').Rule} rule A `detect` rule.
 * @returns {void}
 */
function applyRule(env, rule) {
  const compiled = compileRule(rule);
  const { ctx } = env;

  if (!compiled.files.includes(ctx.fileKind)) {
    return;
  }

  if (ctx.fileKind === 'js' && compiled.requires === 'hot-file' && !env.bindings().isHotFile) {
    return;
  }

  env.requires = compiled.requires;

  const matches = uniqueByLine(evaluate(env, compiled.tree));

  if (matches.length === 0) {
    return;
  }

  if (typeof rule.emitsFact === 'string') {
    addFact(ctx, rule.emitsFact);
  }

  if (matches.length <= COLLAPSE_AFTER) {
    matches.forEach(match => ctx.report({
      ruleId: rule.id,
      severity: compiled.severity,
      line: match.line,
      message: rule.message,
    }));

    return;
  }

  ctx.report({
    ruleId: rule.id,
    severity: compiled.severity,
    line: matches[0].line,
    lines: matches.map(match => match.line),
    message: `${rule.message} This part has ${matches.length} matches.`,
  });
}

/**
 * Handles `detect` rules: report-only checks for the parts of an upgrade that a tool cannot rewrite. A rule says
 * what to look for (`match`), in which part kinds (`files`), and what to tell the user (`message`). It never edits
 * a file.
 *
 * Rule fields: `match`, `files` (`js`, `css`, `template`), `message`, optional `severity` (`manual` by default,
 * or `warning`), `requires` (`hot-file` by default: a js part must import or use Handsontable; `option-object`:
 * `property` and `hook` matchers must sit in an option object or on a `<HotTable>` or `<HotColumn>` element;
 * `none`), and `emitsFact` (a fact name added when the rule matches).
 *
 * Matchers, one per object (`js` only unless noted):
 *
 * - `import`: a module name, or a list. Matches an import, a re-export, `require()`, or `import()` of the module or
 *   of `name/...`.
 * - `property`: a dotted key path, or a list, such as `numericFormat.pattern`. Matches an object property or a JSX
 *   attribute. `withKey` needs an object value with that key. `valueMatches` is a regular expression tested against
 *   a string literal or a template literal without expressions, so a non-literal value never matches it. `in:
 *   "option-object"` needs the object to be found by `findOptionObjects` (any confidence) or the attribute to sit on
 *   a Handsontable wrapper component.
 * - `call`: a method or function name, or a list. `argMatches` is tested against every string literal inside the
 *   arguments, also inside `new MouseEvent('mousedown')`. `receiver` is `"instance"` (a confirmed grid instance) or
 *   the text of the receiver, such as `fireEvent`.
 * - `hook`: a hook name, or a list, used as an option key in an option object, as a `<HotTable>` prop, in
 *   `addHook()` and `addHookOnce()`, or in `Handsontable.hooks.add()` and `.once()`.
 * - `namespaceMember`: a member path after the namespace, or a list, such as `helper.log`. Matches a read of
 *   `Handsontable.helper.log`, called or not, when `Handsontable` is the file's own import or global. A destructured
 *   alias (`const { log } = Handsontable.helper`) is not followed.
 * - `string`: a regular expression tested against string literals and template text.
 * - `selector` (`js`, `css`, `template`): a regular expression tested against the selector of every stylesheet
 *   rule, against string literals in js, and against the raw text of a template. A selector nested in SCSS
 *   is tested as written, so `.a { > .b {} }` does not match `.a >`.
 * - `regex` (`js`, `css`, `template`): a regular expression on the raw text of the part, with a line per hit.
 * - `missingOption`: reports each grid configuration the file builds (`new Handsontable(element, {...})`, directly
 *   or through one variable, and every `<HotTable>` element with its `settings` object) that lacks the key. A
 *   configuration with a spread, a computed key, or an unresolved `settings` is skipped. `whenAnyKey` limits it to
 *   configurations that set one of those keys, and with `whenValueMatches` only when that key holds a matching
 *   string. `unlessFileMatches` skips files whose text matches.
 * - `anyOf` and `allOf`: lists of matchers. `anyOf` reports the matches of all of them. `allOf` reports the matches
 *   of the first one and needs every other matcher to match somewhere in the same part.
 *
 * Every match becomes one entry with its line. A rule with more than `COLLAPSE_AFTER` matches in one part
 * becomes one entry, at the first match, that carries the count.
 *
 * @type {import('../types.mjs').Transform}
 */
const detect = {
  kinds: ['detect'],
  fileKinds: ['js', 'css', 'template'],

  /**
   * @param {import('../types.mjs').Ctx} ctx Context of a `js`, `css`, or `template` part.
   * @param {import('../types.mjs').Rule[]} rules `detect` rules.
   * @returns {void}
   */
  apply(ctx, rules) {
    const env = createEnv(ctx);

    rules.forEach(rule => applyRule(env, rule));
  },
};

export default detect;
