import {
  attributeName,
  calleeName,
  lineOfNode,
  propertyName,
  stringValue,
  typeArguments,
  unwrapNode,
  unwrapPath,
} from '../lib/ast.mjs';
import { addFact } from '../lib/facts.mjs';
import { collectHotBindings } from '../lib/hot-bindings.mjs';
import { findDynamicImports, findImports, findReExports, findRequires } from '../lib/imports.mjs';
import { GENERIC_OPTIONS, KNOWN_OPTIONS, findOptionObjects, hasSpread } from '../lib/option-objects.mjs';
import { dynamicOptionSites, templateOptionSites } from '../lib/option-sites.mjs';
import { createHop, isReference } from '../lib/resolve.mjs';
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
const VALUE_KINDS = [true, false, null, 'array', 'function', 'object'];

/**
 * The fields each matcher may carry besides its own key. A field with no entry here is a typo.
 */
const MODIFIERS = {
  import: [],
  property: ['withKey', 'siblingKey', 'valueMatches', 'viaReference', 'valueIs', 'in', 'flags'],
  annotatedObject: ['recordEntries', 'withKey', 'flags'],
  call: ['argMatches', 'receiver', 'flags'],
  hook: [],
  namespaceMember: [],
  string: ['flags'],
  selector: ['flags'],
  regex: ['flags'],
  missingOption: ['whenAnyKey', 'whenValueMatches', 'reportUnresolved', 'unlessFileMatches', 'flags'],
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

  const readable = ['property', 'annotatedObject', 'missingOption'].includes(key) ? ['js', 'template'] : ['js'];

  if (JS_ONLY_MATCHERS.includes(key) && files.some(file => !readable.includes(file))) {
    problems.push(`${where}: the ${key} matcher reads js only${readable.length > 1 ? ', and templates' : ''}, `
      + `so "files" must be ${JSON.stringify(readable)} or a part of it`);
  }

  if (spec.reportUnresolved !== undefined && (spec.reportUnresolved !== true || key !== 'missingOption'
    || !Array.isArray(spec.whenAnyKey))) {
    problems.push(`${where}.reportUnresolved must be true, and goes with missingOption and whenAnyKey`);
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

  if (spec.valueIs !== undefined) {
    if (!VALUE_KINDS.includes(spec.valueIs)) {
      problems.push(`${where}.valueIs must be true, false, null, "array", "function", or "object"`);
    }

    if (files.includes('template')) {
      problems.push(`${where}: valueIs reads js only, so "files" must not list template`);
    }
  }

  for (const field of ['valueMatches', 'argMatches', 'whenValueMatches', 'unlessFileMatches', 'flags']) {
    if (field in spec && typeof spec[field] !== 'string') {
      problems.push(`${where}.${field} must be a string`);
    }
  }

  if (spec.viaReference !== undefined && (spec.viaReference !== true || spec.valueMatches === undefined)) {
    problems.push(`${where}.viaReference must be true, and goes with valueMatches`);
  }

  if (spec.recordEntries !== undefined && (spec.recordEntries !== true || key !== 'annotatedObject'
    || typeof spec.withKey !== 'string')) {
    problems.push(`${where}.recordEntries must be true, and goes with annotatedObject and withKey`);
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

  if (rule.unlessFileMatches !== undefined) {
    if (typeof rule.unlessFileMatches !== 'string') {
      problems.push('"unlessFileMatches" must be a string');
    } else {
      try {
        regexOf(rule.unlessFileMatches);
      } catch (error) {
        problems.push(`"unlessFileMatches" is not a valid regular expression: ${error.message}`);
      }
    }
  }

  if (rule.mergeKey !== undefined && (typeof rule.mergeKey !== 'string' || rule.mergeKey === '')) {
    problems.push('"mergeKey" must be a string');
  }

  if (rule.unresolvedMessage !== undefined && (typeof rule.unresolvedMessage !== 'string'
    || !rule.unresolvedMessage.includes('{sources}'))) {
    problems.push('"unresolvedMessage" must be a string with a {sources} placeholder');
  }

  if (rule.variableMessage !== undefined && (typeof rule.variableMessage !== 'string' || rule.variableMessage === '')) {
    problems.push('"variableMessage" must be a string');
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
      unlessFile: regexOf(rule.unlessFileMatches),
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
 * @property {() => ReturnType<import('../lib/resolve.mjs').createHop>} resolver The one-hop resolver of the part.
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
  const resolver = memo(() => createHop(ctx.j, ctx.root));

  return {
    ctx,
    source: ctx.source,
    j: ctx.j,
    root: ctx.root,
    requires: 'hot-file',
    bindings,
    optionList,
    optionNodes,
    resolver,
  };
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
 * The NodePath of the value expression of a property or JSX attribute.
 *
 * @param {object} path NodePath of an `ObjectProperty`, `JSXAttribute`, or `ObjectMethod`.
 * @returns {object|null} NodePath of the value, `null` for a method or a bare attribute.
 */
function valuePathOf(path) {
  if (path.node.type === 'JSXAttribute') {
    if (path.node.value?.type === 'JSXExpressionContainer') {
      return path.get('value', 'expression');
    }

    return path.node.value ? path.get('value') : null;
  }

  return path.node.type === 'ObjectMethod' ? null : path.get('value');
}

/**
 * Whether the value of a property is of the kind a `valueIs` modifier asks for.
 *
 * @param {object|null} property The `ObjectProperty`, `ObjectMethod`, or `JSXAttribute` node, `null` for an
 * assignment.
 * @param {object|null|undefined} value The value node.
 * @param {boolean|null|'array'|'function'|'object'} expected `true`, `false`, `null`, or a kind name.
 * @returns {boolean} `true` when the value is that.
 */
function isValueKind(property, value, expected) {
  const node = value ? unwrapNode(value) : null;

  if (property?.type === 'ObjectMethod') {
    return expected === 'function';
  }

  if (!node) {
    return false;
  }

  switch (expected) {
    case 'array':
      return node.type === 'ArrayExpression';
    case 'object':
      return node.type === 'ObjectExpression';
    case 'function':
      return node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression';
    case null:
      return node.type === 'NullLiteral' || (node.type === 'Literal' && node.value === null && !node.regex);
    default:
      return (node.type === 'BooleanLiteral' || (node.type === 'Literal' && typeof node.value === 'boolean'))
        && node.value === expected;
  }
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

      let variable = false;

      if (re.value) {
        let text = stringValue(unwrapNode(value));
        const target = value ? unwrapNode(value) : null;

        if (text === null && spec.viaReference && target && isReference(target)) {
          const valuePath = valuePathOf(path);
          const resolved = valuePath ? env.resolver().hop(valuePath) : null;

          text = resolved ? stringValue(resolved.node) : null;
          // A reference that does not resolve (or resolves to another reference or a call) may hold a matching string.
          // One that resolves to an object or another literal does not.
          variable = resolved === null || isReference(resolved.node) || resolved.node.type === 'CallExpression';
        }

        if (!variable && (text === null || !re.value.test(text))) {
          continue;
        }
      }

      if (spec.valueIs !== undefined && !isValueKind(path.node, value, spec.valueIs)) {
        continue;
      }

      matches.push({ line: lineOfNode(path.node), ...(variable ? { variable: true } : {}) });
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

    if (spec.valueIs !== undefined && !isValueKind(null, site.value, spec.valueIs)) {
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
 * `const format: NumericFormatOptions = { ... }`. With `recordEntries` and `withKey`, it matches instead each entry of an
 * object annotated `Record<K, Type>` whose value is an object literal that sets the key, at that key, as in
 * `{ fxRate: { pattern: '0.00' } } satisfies Record<string, NumericFormatOptions>`.
 *
 * @param {Env} env Part state.
 * @param {Compiled} node The compiled matcher.
 * @returns {Match[]} The matches, at the object.
 */
function matchAnnotatedObject(env, node) {
  const { j, root } = env;
  const names = new Set(listOf(node.spec.annotatedObject));
  const records = node.spec.recordEntries === true;
  const lastName = (type) => {
    const reference = type?.type === 'TSTypeAnnotation' ? type.typeAnnotation : type;
    const typeName = reference?.type === 'TSTypeReference' ? reference.typeName : null;

    return typeName?.type === 'TSQualifiedName' ? typeName.right.name : typeName?.name;
  };
  const named = (type) => {
    if (!records) {
      return names.has(lastName(type));
    }

    // `Record<K, Named>`: the values of the object are the named type.
    const reference = type?.type === 'TSTypeAnnotation' ? type.typeAnnotation : type;

    return lastName(reference) === 'Record' && reference.typeName.type === 'Identifier'
      && names.has(lastName(typeArguments(reference)[1]));
  };

  const matches = [];
  const report = (object) => {
    if (!records) {
      matches.push({ line: lineOfNode(object) });

      return;
    }

    for (const entry of object.properties) {
      const value = entry.type === 'ObjectProperty' ? unwrapNode(entry.value) : null;
      const key = value?.type === 'ObjectExpression'
        ? value.properties.find(property => propertyName(property) === node.spec.withKey) : null;

      if (key) {
        matches.push({ line: lineOfNode(key) });
      }
    }
  };

  root.find(j.VariableDeclarator).forEach((path) => {
    const init = path.node.init ? unwrapNode(path.node.init) : null;

    if (init?.type === 'ObjectExpression' && named(path.node.id.typeAnnotation)) {
      report(init);
    }
  });

  [j.TSAsExpression, j.TSSatisfiesExpression].filter(Boolean).forEach((type) => {
    root.find(type).forEach((path) => {
      const expression = records ? unwrapNode(path.node.expression) : path.node.expression;

      if (expression.type === 'ObjectExpression' && named(path.node.typeAnnotation)) {
        report(expression);
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
 * Whether the receiver of an `add()` or `once()` call is the global hook registry: `Handsontable.hooks`, or a
 * `const` of this file that holds it (`const globalHooks = Handsontable.hooks`).
 *
 * @param {Env} env Part state.
 * @param {object} callPath NodePath of the call.
 * @returns {boolean} `true` for a call on the registry.
 */
function isHooksRegistry(env, callPath) {
  if (['hooks.add', 'hooks.once'].includes(env.bindings().resolveNamespaceMember(callPath.get('callee')))) {
    return true;
  }

  const receiver = unwrapPath(callPath.get('callee')).get('object');

  if (unwrapNode(receiver.node).type !== 'Identifier') {
    return false;
  }

  const alias = env.resolver().hop(receiver);

  return Boolean(alias) && alias.node.type !== 'Identifier' && env.bindings().resolveNamespaceMember(alias) === 'hooks';
}

/**
 * The `hook` matches on component elements that the tool does not know as Handsontable wrappers: a component with a
 * hook as a prop and at least two other known options, one of them not a common name (`<DeskGrid data columns
 * afterColumnMove={...}>`, where `DeskGrid` is a re-exported `HotTable`). A DOM tag never matches, and neither does a
 * wrapper, which the property matcher already covers.
 *
 * @param {Env} env Part state.
 * @param {string[]} names The hook names.
 * @returns {Match[]} The matches, at the attribute.
 */
function matchHookOnElements(env, names) {
  if (!env.bindings().isHotFile) {
    return [];
  }

  const matches = [];

  env.root.find(env.j.JSXElement).forEach((path) => {
    const opening = path.node.openingElement;
    const isComponent = opening.name.type === 'JSXMemberExpression'
      || (opening.name.type === 'JSXIdentifier' && /^[A-Z]/.test(opening.name.name));

    if (!isComponent || env.bindings().getComponent(path)) {
      return;
    }

    const known = opening.attributes.map(item => attributeName(item)).filter(name => KNOWN_OPTIONS.has(name));

    for (const attribute of opening.attributes) {
      const hook = attributeName(attribute);

      if (names.includes(hook)) {
        const others = known.filter(name => name !== hook);

        if (others.length >= 2 && others.some(name => !GENERIC_OPTIONS.has(name))) {
          matches.push({ line: lineOfNode(attribute) });
        }
      }
    }
  });

  return matches;
}

/**
 * Find the matches of a `hook` matcher: a hook used as an option key, a JSX prop, or the name in `addHook()`,
 * `addHookOnce()`, `Handsontable.hooks.add()`, or `Handsontable.hooks.once()`. The name may come one hop away in the
 * same file (a `const`, or a member of a `const` object, also `as const`), the registry may be a `const` alias of
 * `Handsontable.hooks`, and the option key may sit in an object annotated `Events` or `Partial<Events>`. A component
 * that is not a known wrapper counts when it sets other known options (see `matchHookOnElements()`).
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

      if (!['addHook', 'addHookOnce', 'add', 'once'].includes(name) || path.node.arguments.length === 0) {
        return;
      }

      const hookName = env.resolver().stringOf(path.get('arguments', 0));

      if (hookName === null || !names.includes(hookName)) {
        return;
      }

      if (name === 'addHook' || name === 'addHookOnce' || (MEMBERS.has(callee.type) && isHooksRegistry(env, path))) {
        calls.push({ line: lineOfNode(path.node) });
      }
    }));

  return [...keyed, ...calls, ...matchHookOnElements(env, names)];
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
 * @param {(text: string) => string} [normalize] Applied to each string before the test.
 * @returns {Match[]} One match per string that passes.
 */
function matchStrings(env, pattern, normalize = text => text) {
  const matches = [];
  const { j, root } = env;

  root.find(j.Literal).forEach((path) => {
    if (typeof path.node.value === 'string' && pattern.test(normalize(path.node.value))) {
      matches.push({ line: lineOfNode(path.node) });
    }
  });
  root.find(j.TemplateElement).forEach((path) => {
    if (pattern.test(normalize(path.node.value.cooked ?? path.node.value.raw))) {
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
 * The functional wrappers of component styles: `:deep(...)`, `:global(...)`, and `::v-deep(...)` hold a selector and
 * keep its meaning.
 */
const SELECTOR_FUNCTIONS = /(?:::?v-deep|:deep|:global)\(/g;

/**
 * The combinator-like markers of component styles that carry no selector of their own: `::v-deep`, `:v-deep`,
 * `::ng-deep`, `/deep/`, and `>>>`. They all mean "a descendant, past the component scope".
 */
const SELECTOR_MARKERS = /::?v-deep|::ng-deep|\/deep\/|>>>/g;

/**
 * Take the style-scoping wrappers out of a selector, so a rule that looks for `.ht-grid >` sees it inside
 * `:deep(.ht-grid) > ...`, `::v-deep .ht-grid >`, `:global(.ht-grid) >`, `::ng-deep .ht-grid >`, and `>>>`. A function
 * wrapper is replaced by its content, a marker by a space. The text is only tested, never edited, and the report
 * keeps the line of the original rule.
 *
 * @param {string} selector Selector text.
 * @returns {string} The selector without the wrappers.
 */
export function normalizeSelector(selector) {
  let text = selector;

  for (let match = SELECTOR_FUNCTIONS.exec(text); match; match = SELECTOR_FUNCTIONS.exec(text)) {
    let depth = 1;
    let index = match.index + match[0].length;

    while (index < text.length && depth > 0) {
      if (text[index] === '(') {
        depth += 1;
      } else if (text[index] === ')') {
        depth -= 1;
      }

      index += 1;
    }

    const inner = text.slice(match.index + match[0].length, depth === 0 ? index - 1 : index);

    text = `${text.slice(0, match.index)}${inner}${text.slice(index)}`;
    SELECTOR_FUNCTIONS.lastIndex = match.index;
  }

  SELECTOR_FUNCTIONS.lastIndex = 0;

  return text.replace(SELECTOR_MARKERS, ' ');
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
    return matchStrings(env, pattern, normalizeSelector);
  }

  if (env.ctx.fileKind === 'css') {
    const matches = [];

    env.root.walkRules((rule) => {
      if (pattern.test(normalizeSelector(rule.selector))) {
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
 * @property {string[]} unresolved What hides the keys, as text for a message: a spread (`...props`), the `settings` prop, a
 * computed key.
 */

/**
 * Mark a candidate unknown and remember what hid its keys.
 *
 * @param {Env} env Part state.
 * @param {Candidate} candidate The candidate.
 * @param {object|string} source The node of a spread argument or a prop, or a description.
 * @returns {void}
 */
function markUnknown(env, candidate, source) {
  const text = typeof source === 'string' ? source : env.j(source).toSource().trim().replace(/\s+/g, ' ');

  candidate.unknown = true;
  candidate.unresolved.push(text.length > 40 ? `${text.slice(0, 37)}...` : text);
}

/**
 * Read the keys of an object literal into a candidate. A spread is read when it stands for an object literal of
 * this file (one hop, through a `const` or a member of one) that has no spread of its own: its keys count, so the
 * keys of the merged object are fully known. Any other spread marks the candidate unknown, because it may set the key.
 *
 * @param {Env} env Part state.
 * @param {object} objectNode An `ObjectExpression` node.
 * @param {Candidate} candidate The candidate to fill.
 * @param {object|null} [objectPath] NodePath of the object, which lets its spreads resolve.
 * @returns {void}
 */
function readKeys(env, objectNode, candidate, objectPath = null) {
  objectNode.properties.forEach((property, index) => {
    if (property.type === 'SpreadElement' || property.type === 'SpreadProperty'
      || property.type === 'ExperimentalSpreadProperty') {
      const spread = objectPath ? resolveSpread(env, objectPath.get('properties', index, 'argument')) : null;

      if (spread) {
        readKeys(env, spread.node, candidate);
      } else {
        markUnknown(env, candidate, `the spread ...${env.j(property.argument).toSource()}`);
      }

      return;
    }

    if (property.type !== 'ObjectProperty' && property.type !== 'ObjectMethod') {
      return;
    }

    const name = propertyName(property);

    if (name === null) {
      markUnknown(env, candidate, 'a computed key');
    } else {
      candidate.keys.set(name, valueOfProperty(property));
    }
  });
}

/**
 * The object literal a spread argument stands for, when it is written there or one hop away, and has no spread of its
 * own.
 *
 * @param {Env} env Part state.
 * @param {object} argumentPath NodePath of the spread argument.
 * @returns {object|null} NodePath of the `ObjectExpression`, or `null`.
 */
function resolveSpread(env, argumentPath) {
  const target = unwrapPath(argumentPath);
  const resolved = target.node.type === 'ObjectExpression' ? target : env.resolver().hop(target);

  return resolved?.node.type === 'ObjectExpression' && !hasSpread(resolved) ? resolved : null;
}

/**
 * Describe a `<HotTable>` element: its attributes merged with the object in `settings={...}` and with the object
 * literals its spread attributes stand for (`<HotTable {...settings}>`). An unresolvable `settings` or spread attribute
 * marks the element unknown.
 *
 * @param {Env} env Part state.
 * @param {object} elementPath NodePath of the `JSXElement`.
 * @returns {Candidate} The candidate.
 */
function describeElement(env, elementPath) {
  const candidate = {
    line: lineOfNode(elementPath.node.openingElement),
    keys: new Map(),
    unknown: false,
    unresolved: [],
  };

  elementPath.node.openingElement.attributes.forEach((attribute, index) => {
    if (attribute.type === 'JSXSpreadAttribute') {
      const spread = resolveSpread(env, elementPath.get('openingElement', 'attributes', index, 'argument'));

      if (spread) {
        readKeys(env, spread.node, candidate);
      } else {
        markUnknown(env, candidate, `the spread ...${env.j(attribute.argument).toSource()}`);
      }

      return;
    }

    if (attribute.type !== 'JSXAttribute' || attributeName(attribute) === null) {
      markUnknown(env, candidate, 'an attribute it cannot read');

      return;
    }

    const name = attributeName(attribute);

    if (name !== 'settings') {
      candidate.keys.set(name, valueOfProperty(attribute));

      return;
    }

    const valuePath = elementPath.get('openingElement', 'attributes', index, 'value', 'expression');
    let resolved = unwrapNode(valueOfProperty(attribute));
    let resolvedPath = resolved?.type === 'ObjectExpression' ? unwrapPath(valuePath) : null;

    if (resolved?.type === 'Identifier') {
      resolvedPath = env.resolver().hop(valuePath);
      resolved = resolvedPath ? resolvedPath.node : unwrapNode(lookup(valuePath, resolved.name)?.init);
    }

    if (resolved?.type === 'ObjectExpression') {
      readKeys(env, resolved, candidate, resolvedPath);
    } else {
      markUnknown(env, candidate, 'the settings prop');
    }
  });

  return candidate;
}

/**
 * An inline `<script>` element with no `src` attribute. The groups are its attributes and its text.
 */
const INLINE_SCRIPT = /<script\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/script\b[^>]*>/gid;

/**
 * Find where the arguments of a call end, by counting parentheses and skipping strings, template literals, and
 * comments. This is a raw-text scan, not a parse.
 *
 * @param {string} text The script text.
 * @param {number} start Offset just after the opening parenthesis.
 * @returns {number} The offset of the closing parenthesis, or the end of the text when it never closes.
 */
function closeOfCall(text, start) {
  let depth = 1;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (char === '\'' || char === '"' || char === '`') {
      for (index += 1; index < text.length && text[index] !== char; index += 1) {
        index += text[index] === '\\' ? 1 : 0;
      }
    } else if (char === '/' && text[index + 1] === '/') {
      index = text.indexOf('\n', index) === -1 ? text.length : text.indexOf('\n', index);
    } else if (char === '/' && text[index + 1] === '*') {
      index = text.indexOf('*/', index) === -1 ? text.length : text.indexOf('*/', index) + 1;
    } else if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return text.length;
}

/**
 * The `missingOption` check for the inline scripts of an HTML page, which the tool does not parse: a
 * `new Handsontable(` call whose arguments hold an object literal and never name the key. A call that passes its
 * settings by a variable is skipped, because the page says nothing about what that holds.
 *
 * @param {Env} env Part state of a `template` part.
 * @param {Compiled} node The compiled matcher.
 * @returns {Match[]} The matches, with the line of each call in the file.
 */
function matchInlineMissingOption(env, node) {
  const key = new RegExp(`\\b${node.spec.missingOption}\\b`);
  const matches = [];

  for (const script of env.source.matchAll(INLINE_SCRIPT)) {
    const [from] = script.indices[2];

    if (/\bsrc\s*=/i.test(script[1])) {
      continue;
    }

    for (const call of script[2].matchAll(/\bnew\s+Handsontable\s*\(/g)) {
      const open = call.index + call[0].length;
      const args = script[2].slice(open, closeOfCall(script[2], open));

      if (args.includes('{') && !key.test(args)) {
        matches.push({ line: env.source.slice(0, from + call.index).split('\n').length });
      }
    }
  }

  return matches;
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
  // Only a check that also needs visible markup can be hedged: without it, an unread source proves nothing.
  const hedges = spec.reportUnresolved === true;

  if (re.unlessFile?.test(env.source)) {
    return [];
  }

  if (env.ctx.fileKind === 'template') {
    return matchInlineMissingOption(env, node);
  }

  const candidates = env.optionList()
    .filter(item => item.confidence === 'high' && item.role === 'grid'
      && ['new', 'new:identifier'].includes(item.origin))
    .map((item) => {
      const candidate = { line: lineOfNode(item.path.node), keys: new Map(), unknown: false, unresolved: [] };

      readKeys(env, item.path.node, candidate, item.path);

      return candidate;
    });

  env.root.find(env.j.JSXElement).forEach((path) => {
    if (env.bindings().getComponent(path) === 'HotTable') {
      candidates.push(describeElement(env, path));
    }
  });

  return candidates
    .filter((candidate) => {
      if (candidate.keys.has(spec.missingOption) || (candidate.unknown && !hedges)) {
        return false;
      }

      return !spec.whenAnyKey || spec.whenAnyKey.some(key => candidate.keys.has(key)
        && (!re.whenValue || stringsIn(candidate.keys.get(key)).some(text => re.whenValue.test(text))));
    })
    .map(candidate => ({
      line: candidate.line,
      ...(candidate.unknown ? { hedge: [...new Set(candidate.unresolved)] } : {}),
    }));
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
 * The message of one match: the rule's `message`, its `variableMessage` for a value that comes from a variable, or its
 * `unresolvedMessage` for a grid with sources the tool could not read, with `{sources}` replaced by their names.
 *
 * @param {import('../types.mjs').Rule} rule A `detect` rule.
 * @param {Match} match The match.
 * @returns {string} The message.
 */
function messageOf(rule, match) {
  if (match.hedge && rule.unresolvedMessage) {
    return rule.unresolvedMessage.replace('{sources}', match.hedge.join(', '));
  }

  return match.variable && rule.variableMessage ? rule.variableMessage : rule.message;
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

  if (compiled.unlessFile?.test(ctx.source)) {
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
      message: messageOf(rule, match),
      ...(rule.mergeKey && match.line !== undefined
        ? { mergeKey: `${rule.mergeKey}:${match.line}`, merge: 'earliest' } : {}),
    }));

    return;
  }

  ctx.report({
    ruleId: rule.id,
    severity: compiled.severity,
    line: matches[0].line,
    lines: matches.map(match => match.line),
    message: `${rule.variableMessage && matches.every(match => match.variable) ? rule.variableMessage : rule.message} `
      + `This part has ${matches.length} matches.`,
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
 *   a string literal or a template literal without expressions, so a non-literal value never matches it. With
 *   `viaReference`, a value that is an identifier or a member read (`DATE_FORMAT`, `FORMATS.date`) is followed one hop
 *   to a `const` of the same file and tested as that literal, and one the tool cannot resolve (an import, a parameter,
 *   a `let`) matches too, with the rule's `variableMessage` as its message. `in: "option-object"` needs the object to
 *   be found by `findOptionObjects` (any confidence) or the attribute to sit on a Handsontable wrapper component.
 * - `call`: a method or function name, or a list. `argMatches` is tested against every string literal inside the
 *   arguments, also inside `new MouseEvent('mousedown')`. `receiver` is `"instance"` (a confirmed grid instance) or
 *   the text of the receiver, such as `fireEvent`.
 * - `hook`: a hook name, or a list, used as an option key in an option object (also one annotated `Events` or
 *   `Partial<Events>`), as a prop of a `<HotTable>` or of a component that sets other known options, in `addHook()` and
 *   `addHookOnce()`, or in `add()` and `once()` on `Handsontable.hooks` or a `const` alias of it. The name may be a
 *   `const` or a member of a `const` object in the same file.
 * - `namespaceMember`: a member path after the namespace, or a list, such as `helper.log`. Matches a read of
 *   `Handsontable.helper.log`, called or not, when `Handsontable` is the file's own import or global. A destructured
 *   alias (`const { log } = Handsontable.helper`) is not followed.
 * - `string`: a regular expression tested against string literals and template text.
 * - `selector` (`js`, `css`, `template`): a regular expression tested against the selector of every stylesheet
 *   rule, against string literals in js, and against the raw text of a template. A selector nested in SCSS
 *   is tested as written, so `.a { > .b {} }` does not match `.a >`. The scoping wrappers of component styles are taken
 *   out first (`normalizeSelector()`): `:deep(.a)`, `:global(.a)`, `::v-deep(.a)` become `.a`, and `::v-deep`, `::ng-deep`,
 *   `/deep/`, and `>>>` become a space. The report keeps the line of the original rule.
 * - `regex` (`js`, `css`, `template`): a regular expression on the raw text of the part, with a line per hit.
 * - `missingOption`: reports each grid configuration the file builds (`new Handsontable(element, {...})`, directly
 *   or through one variable, and every `<HotTable>` element with its `settings` object) that lacks the key. A
 *   configuration with a computed key, an unresolved `settings`, or a spread that is not an object literal of this file
 *   (one hop, with no spread of its own) is skipped. A spread that is one adds its keys. `whenAnyKey` limits it to
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
  validate: validateDetectRule,

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
