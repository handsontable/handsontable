/**
 * Dev-only tool: derive the type-export diff between two published npm packages of one library.
 *
 * Usage:
 *   node codemod/tools/derive-type-map.mjs --old <extracted pkg dir> --new <extracted pkg dir> --out <file>
 *     [--old-hot <dir> --new-hot <dir>] [--wrapper <old dir>,<new dir>]... [--empty-rules]
 *     [--full <file>] [--typescript <dir>]
 *
 * `--old` and `--new` are the `package/` directories of two extracted `npm pack` tarballs. The tool reads the
 * `exports` map of each package, resolves one types file per public entry point, and uses the TypeScript
 * compiler API to list every exported name of every entry point. It also walks the member tree of the
 * `Handsontable` default export (static members and merged namespace members). The output is a raw diff plus
 * heuristic "candidates" that suggest where a removed name went. Candidates are hints, never facts.
 *
 * `--old-hot` and `--new-hot` point at extracted `handsontable` packages and let a wrapper package resolve
 * `import ... from 'handsontable'`. `--wrapper` (repeatable) diffs a wrapper package pair the same way, resolving
 * `handsontable` to `--old` and `--new`, and stores the result under the `wrappers` key. `--empty-rules` adds a
 * top-level `"rules": []`. `--full` writes every collected export with its declaration text, for manual
 * inspection. `--typescript` names a directory that contains a `typescript` package.
 *
 * This is not a runtime part of the codemod, and `typescript` is not a dependency of the package. Never run
 * anything from an extracted tarball: the tool only reads `package.json` and `.d.ts` files as data.
 */
/* eslint-disable no-bitwise -- TypeScript symbol and type flags are bit masks. */
import { access, readdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const TOOL_NAME = 'codemod/tools/derive-type-map.mjs';
const TYPES_FILE = /\.d\.(ts|mts|cts)$/;
const EXTENSION_RANK = ['.d.ts', '.d.cts', '.d.mts'];
const MAIN_SPECIFIERS = ['base', 'settings', ''];
const MAX_NAMESPACE_DEPTH = 5;
const MAX_SAME_NAME_MATCHES = 8;
const MAX_DECLARATION_TEXT = 700;
const STRUCTURE_THRESHOLD = 0.8;
const STRUCTURE_MIN_PROPS = 3;

/**
 * Compare two strings by code unit order, for deterministic output.
 *
 * @param {string} a First string.
 * @param {string} b Second string.
 * @returns {number} Negative, zero, or positive.
 */
function compareText(a, b) {
  if (a === b) {
    return 0;
  }

  return a < b ? -1 : 1;
}

/**
 * Name the space a symbol lives in.
 *
 * @param {boolean} isValue Whether the symbol has a value meaning.
 * @param {boolean} isType Whether the symbol has a type meaning.
 * @returns {string} `both`, `value`, or `type`.
 */
function spaceOf(isValue, isType) {
  if (isValue && isType) {
    return 'both';
  }

  return isValue ? 'value' : 'type';
}

/**
 * Tell whether a path exists.
 *
 * @param {string} file Absolute path.
 * @returns {Promise<boolean>} True when the path is accessible.
 */
async function pathExists(file) {
  try {
    await access(file);

    return true;
  } catch {
    return false;
  }
}

/**
 * Load the TypeScript compiler API from the monorepo. The module is CommonJS, so it goes through `require`.
 *
 * @param {string|undefined} explicitDir Directory holding a `typescript` package, or undefined to search.
 * @returns {Promise<object>} The `typescript` module.
 * @throws {Error} When no copy of TypeScript can be found.
 */
async function loadTypescript(explicitDir) {
  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(here, '..', '..');
  const searchRoots = [
    explicitDir ? resolve(explicitDir) : null,
    here,
    join(repoRoot, 'handsontable'),
    join(repoRoot, 'wrappers', 'react-wrapper'),
    join(repoRoot, 'wrappers', 'vue3'),
    join(repoRoot, 'wrappers', 'angular-wrapper'),
    join(repoRoot, 'docs'),
  ].filter(Boolean);

  for (const root of searchRoots) {
    try {
      const requireFrom = createRequire(join(root, 'package.json'));

      return requireFrom('typescript');
    } catch {
      // Try the next root.
    }
  }

  throw new Error(
    'Cannot load the "typescript" package. This dev tool borrows it from the monorepo. Run a pnpm install at ' +
    'the repository root, or pass --typescript <dir containing node_modules/typescript>.'
  );
}

/**
 * Read `package.json` of an extracted tarball directory.
 *
 * @param {string} dir The `package/` directory.
 * @returns {Promise<object>} The parsed `package.json`.
 */
async function readPackageJson(dir) {
  return JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'));
}

/**
 * Flatten an `exports` value into its string leaves with the condition names that led to each.
 *
 * @param {unknown} value A string, array, or condition object from an `exports` entry.
 * @param {string[]} [conditions] Condition names collected so far.
 * @returns {Array<{ target: string, conditions: string[] }>} The leaves.
 */
function flattenTargets(value, conditions = []) {
  if (typeof value === 'string') {
    return [{ target: value, conditions }];
  }

  if (Array.isArray(value)) {
    return value.flatMap(item => flattenTargets(item, conditions));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([condition, nested]) => flattenTargets(nested, [...conditions, condition]));
  }

  return [];
}

/**
 * Pick the types file for one `exports` value. A leaf that is already a declaration file wins. A JavaScript
 * leaf counts when a declaration file sits next to it, because older resolution modes find it that way.
 *
 * @param {string} pkgDir Package directory.
 * @param {unknown} value The `exports` value for one key.
 * @returns {Promise<{ resolved: { file: string, via: string }|null, missing: string[] }>} The chosen file (null
 *   when the key has no types) and declared declaration files that do not exist in the package.
 */
async function resolveTypesFile(pkgDir, value) {
  const found = [];
  const missing = [];

  for (const { target, conditions } of flattenTargets(value)) {
    const absolute = join(pkgDir, target);
    const conditionRank = rankConditions(conditions);

    if (TYPES_FILE.test(target)) {
      if (await pathExists(absolute)) {
        found.push({ file: absolute, via: 'types', conditionRank, extensionRank: extensionRank(target) });
      } else {
        missing.push(target);
      }
    } else if (/\.(m|c)?js$/.test(target)) {
      for (const extension of EXTENSION_RANK) {
        const sibling = absolute.replace(/\.(m|c)?js$/, extension);

        if (await pathExists(sibling)) {
          found.push({
            file: sibling,
            via: 'sibling',
            conditionRank,
            extensionRank: extensionRank(sibling),
          });
        }
      }
    }
  }

  found.sort((a, b) => {
    const viaDelta = (a.via === 'types' ? 0 : 1) - (b.via === 'types' ? 0 : 1);

    return viaDelta || a.conditionRank - b.conditionRank || a.extensionRank - b.extensionRank;
  });

  return { resolved: found.length ? { file: found[0].file, via: found[0].via } : null, missing };
}

/**
 * Rank the condition path of an `exports` leaf: `types` first, then `require`, then anything else.
 *
 * @param {string[]} conditions Condition names that led to the leaf.
 * @returns {number} Lower is better.
 */
function rankConditions(conditions) {
  if (conditions.includes('types')) {
    return 0;
  }

  return conditions.includes('require') ? 1 : 2;
}

/**
 * Rank a declaration file extension: `.d.ts` first, then `.d.cts`, then `.d.mts`.
 *
 * @param {string} file File name or path.
 * @returns {number} Lower is better.
 */
function extensionRank(file) {
  const index = EXTENSION_RANK.findIndex(extension => file.endsWith(extension));

  return index === -1 ? EXTENSION_RANK.length : index;
}

/**
 * List files below a directory, as package-relative paths with forward slashes.
 *
 * @param {string} root Directory to walk.
 * @param {string} [current] Directory being walked.
 * @returns {Promise<string[]>} Relative file paths.
 */
async function listFiles(root, current = root) {
  const out = [];

  for (const entry of await readdir(current, { withFileTypes: true })) {
    if (entry.name === 'node_modules') {
      continue;
    }

    const full = join(current, entry.name);

    if (entry.isDirectory()) {
      out.push(...await listFiles(root, full));
    } else {
      out.push(relative(root, full).split(sep).join('/'));
    }
  }

  return out;
}

/**
 * Expand `exports` keys that contain `*` against the files on disk.
 *
 * @param {string} pkgDir Package directory.
 * @param {Record<string, unknown>} exportsMap The `exports` field.
 * @returns {Promise<Record<string, unknown>>} A map without wildcard keys.
 */
async function expandWildcards(pkgDir, exportsMap) {
  const expanded = {};
  let files = null;

  for (const [key, value] of Object.entries(exportsMap)) {
    if (!key.includes('*')) {
      expanded[key] = value;
      continue;
    }

    files ??= await listFiles(pkgDir);

    const leaves = flattenTargets(value);
    const anchor = leaves.find(leaf => leaf.target.includes('*'));

    if (!anchor) {
      continue;
    }

    const [prefix, suffix] = anchor.target.replace(/^\.\//, '').split('*');

    for (const file of files) {
      if (file.startsWith(prefix) && file.endsWith(suffix) && file.length >= prefix.length + suffix.length) {
        const captured = file.slice(prefix.length, file.length - suffix.length);
        const replaceStar = target => (typeof target === 'string' ? target.replaceAll('*', captured) : target);
        const substitute = (nested) => {
          if (typeof nested === 'string') {
            return replaceStar(nested);
          }

          if (Array.isArray(nested)) {
            return nested.map(substitute);
          }

          return nested && typeof nested === 'object' ?
            Object.fromEntries(Object.entries(nested).map(([name, inner]) => [name, substitute(inner)])) :
            nested;
        };

        expanded[key.replaceAll('*', captured)] = substitute(value);
      }
    }
  }

  return expanded;
}

/**
 * Enumerate every public entry point of a package that has a types file.
 *
 * @param {string} pkgDir Package directory.
 * @param {object} pkgJson Parsed `package.json`.
 * @returns {Promise<{ entries: Map<string, { file: string, via: string }>, missing: string[] }>} Entry points
 *   by import specifier, plus declared types files that are not in the package.
 */
async function enumerateEntryPoints(pkgDir, pkgJson) {
  const entries = new Map();
  const missing = [];
  const exportsField = pkgJson.exports && typeof pkgJson.exports === 'object' && !Array.isArray(pkgJson.exports) ?
    pkgJson.exports :
    null;

  if (exportsField) {
    const keys = Object.keys(exportsField);
    const isSubpathMap = keys.some(key => key.startsWith('.'));
    const subpaths = isSubpathMap ? await expandWildcards(pkgDir, exportsField) : { '.': exportsField };

    for (const [key, value] of Object.entries(subpaths)) {
      if (!key.startsWith('.') || key.endsWith('.json')) {
        continue;
      }

      const { resolved, missing: absent } = await resolveTypesFile(pkgDir, value);
      const specifier = key === '.' ? pkgJson.name : `${pkgJson.name}${key.slice(1)}`;

      if (resolved) {
        entries.set(specifier, resolved);
      } else {
        missing.push(...absent.map(target => `${specifier} -> ${target}`));
      }
    }
  }

  const legacy = pkgJson.types ?? pkgJson.typings;

  if (!entries.has(pkgJson.name) && legacy) {
    if (await pathExists(join(pkgDir, legacy))) {
      entries.set(pkgJson.name, { file: join(pkgDir, legacy), via: 'types' });
    } else if (!missing.some(item => item.startsWith(`${pkgJson.name} -> `))) {
      missing.push(`${pkgJson.name} -> ${legacy}`);
    }
  }

  return { entries, missing: [...new Set(missing)].sort() };
}

/**
 * Create a TypeScript program with every entry point types file as a root.
 *
 * @param {object} ts The TypeScript module.
 * @param {Map<string, { file: string }>} entries Entry points.
 * @param {string|undefined} hotDir Extracted `handsontable` package used to resolve imports of it.
 * @returns {object} The program.
 */
function createProgram(ts, entries, hotDir) {
  const options = {
    noEmit: true,
    skipLibCheck: true,
    noResolve: false,
    types: [],
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: false,
    allowJs: false,
  };

  if (hotDir) {
    options.paths = {
      handsontable: [join(hotDir, 'index.d.ts')],
      'handsontable/*': [join(hotDir, '*')],
    };
  }

  const roots = [...new Set([...entries.values()].map(entry => entry.file))];

  return ts.createProgram({ rootNames: roots, options });
}

/**
 * Follow alias symbols (re-exports, import bindings) to the symbol they stand for.
 *
 * @param {object} ts The TypeScript module.
 * @param {object} checker The type checker.
 * @param {object} symbol A symbol, possibly an alias.
 * @returns {object} The resolved symbol, or the input when it is not an alias or cannot be resolved.
 */
function resolveAlias(ts, checker, symbol) {
  if (symbol.flags & ts.SymbolFlags.Alias) {
    try {
      const target = checker.getAliasedSymbol(symbol);

      return target && target.escapedName !== 'unknown' ? target : symbol;
    } catch {
      return symbol;
    }
  }

  return symbol;
}

/**
 * Tell whether an alias symbol comes from a type-only export or import.
 *
 * @param {object} ts The TypeScript module.
 * @param {object} symbol The alias symbol before resolution.
 * @returns {boolean} True when the declaration says `type`.
 */
function isTypeOnlyAlias(ts, symbol) {
  if (!(symbol.flags & ts.SymbolFlags.Alias)) {
    return false;
  }

  return (symbol.declarations ?? []).some((declaration) => {
    if (ts.isExportSpecifier(declaration) || ts.isImportSpecifier(declaration)) {
      return declaration.isTypeOnly || Boolean(declaration.parent?.parent?.isTypeOnly);
    }

    return false;
  });
}

/**
 * Tell whether a type is a plain bag of members, such as an object literal type or `typeof import('./x')`.
 *
 * @param {object} ts The TypeScript module.
 * @param {object} type A type.
 * @returns {boolean} True when walking its properties describes a namespace.
 */
function isNamespaceLikeType(ts, type) {
  if (type.isIntersection()) {
    return type.types.every(part => isNamespaceLikeType(ts, part));
  }

  if (!(type.flags & ts.TypeFlags.Object) || !type.symbol) {
    return false;
  }

  const bag = ts.SymbolFlags.ValueModule | ts.SymbolFlags.NamespaceModule |
    ts.SymbolFlags.TypeLiteral | ts.SymbolFlags.ObjectLiteral;
  const named = ts.SymbolFlags.Class | ts.SymbolFlags.Interface;

  return Boolean(type.symbol.flags & bag) && !(type.symbol.flags & named);
}

/**
 * Classify a symbol into one primary kind.
 *
 * @param {object} ts The TypeScript module.
 * @param {object} checker The type checker.
 * @param {object} symbol A resolved symbol.
 * @returns {{ kind: string, also: string[] }} The kind plus extra declaration kinds merged into the symbol.
 */
function classify(ts, checker, symbol) {
  const flags = symbol.flags;
  const F = ts.SymbolFlags;
  const also = [];
  const hasNamespace = Boolean(flags & (F.ValueModule | F.NamespaceModule));
  let kind;

  if (flags & F.Class) {
    kind = 'class';
  } else if (flags & F.Enum) {
    kind = 'enum';
  } else if (flags & F.Function) {
    kind = 'function';
  } else if (flags & (F.Variable | F.Property | F.Method | F.Accessor)) {
    kind = valueKind(ts, checker, symbol);
  } else if (flags & F.EnumMember) {
    kind = 'enumMember';
  } else if (flags & F.Interface) {
    kind = 'interface';
  } else if (flags & F.TypeAlias) {
    kind = 'type';
  } else if (hasNamespace) {
    kind = 'namespace';
  } else {
    kind = 'unknown';
  }

  if (hasNamespace && kind !== 'namespace') {
    also.push('namespace');
  }

  if ((flags & F.Interface) && kind !== 'interface' && kind !== 'class') {
    also.push('interface');
  }

  if ((flags & F.TypeAlias) && kind !== 'type') {
    also.push('type');
  }

  return { kind, also };
}

/**
 * Classify a variable, property, or method symbol by the shape of its type.
 *
 * @param {object} ts The TypeScript module.
 * @param {object} checker The type checker.
 * @param {object} symbol A value symbol.
 * @returns {string} One of `function`, `class`, `namespace`, `const`.
 */
function valueKind(ts, checker, symbol) {
  if (symbol.flags & ts.SymbolFlags.Method) {
    return 'function';
  }

  let type;

  try {
    type = checker.getTypeOfSymbol(symbol);
  } catch {
    return 'const';
  }

  if (type.getConstructSignatures().length > 0) {
    return 'class';
  }

  if (type.symbol && (type.symbol.flags & ts.SymbolFlags.Class)) {
    return 'class';
  }

  if (isNamespaceLikeType(ts, type) && type.getCallSignatures().length === 0) {
    return type.getProperties().length > 0 ? 'namespace' : 'const';
  }

  if (type.getCallSignatures().length > 0) {
    return 'function';
  }

  return 'const';
}

/**
 * Describe a symbol: its kind, its value-or-type space, and a handle for lazy structural work.
 *
 * @param {object} ts The TypeScript module.
 * @param {object} checker The type checker.
 * @param {object} original The symbol as exported (may be an alias).
 * @returns {object} The record. Fields starting with `_` are internal and never written to the output.
 */
function describeSymbol(ts, checker, original) {
  const resolved = resolveAlias(ts, checker, original);
  const flags = resolved.flags;
  const F = ts.SymbolFlags;
  const { kind, also } = classify(ts, checker, resolved);
  const isValue = Boolean(flags & F.Value);
  const isType = Boolean(flags & (F.Type | F.NamespaceModule));
  let space = spaceOf(isValue, isType);

  if (isTypeOnlyAlias(ts, original)) {
    space = 'type';
  }

  const record = { kind, space };

  if (also.length) {
    record.also = also;
  }

  Object.defineProperties(record, {
    _ts: { value: ts },
    _checker: { value: checker },
    _symbol: { value: resolved },
    _shape: { value: null, writable: true },
  });

  return record;
}

/**
 * Collect the exports of one module symbol as a name to record map.
 *
 * @param {object} ts The TypeScript module.
 * @param {object} checker The type checker.
 * @param {object} moduleSymbol The module symbol of an entry point file.
 * @returns {Map<string, object>} Records by exported name, `default` included.
 */
function collectExports(ts, checker, moduleSymbol) {
  const out = new Map();

  for (const symbol of checker.getExportsOfModule(moduleSymbol)) {
    out.set(String(symbol.escapedName), describeSymbol(ts, checker, symbol));
  }

  return out;
}

/**
 * Gather the member symbols of a symbol for the namespace walk: namespace exports, class statics (only at the
 * root), and the properties of an object-like value type.
 *
 * @param {object} ts The TypeScript module.
 * @param {object} checker The type checker.
 * @param {object} symbol A resolved symbol.
 * @param {boolean} isRoot Whether this is the `Handsontable` symbol itself.
 * @returns {Map<string, object[]>} Member symbols grouped by name.
 */
function gatherMembers(ts, checker, symbol, isRoot) {
  const F = ts.SymbolFlags;
  const members = new Map();
  const add = (member) => {
    const name = String(member.escapedName);

    if (name === 'prototype' || name.startsWith('__') || name === 'default') {
      return;
    }

    if (!members.has(name)) {
      members.set(name, []);
    }

    members.get(name).push(member);
  };
  const staticOnly = member => (member.flags & (F.Property | F.Method | F.Accessor)) &&
    !(member.flags & (F.Type | F.Namespace | F.Alias));

  if (symbol.flags & (F.ValueModule | F.NamespaceModule | F.Class | F.Enum)) {
    const exported = symbol.flags & (F.ValueModule | F.NamespaceModule) ?
      checker.getExportsOfModule(symbol) :
      [...(symbol.exports?.values() ?? [])];

    for (const member of exported) {
      if (isRoot || !(symbol.flags & F.Class) || !staticOnly(member)) {
        add(member);
      }
    }
  }

  if (symbol.flags & (F.Variable | F.Property)) {
    const type = checker.getTypeOfSymbol(symbol);

    if (isRoot || isNamespaceLikeType(ts, type)) {
      for (const property of checker.getPropertiesOfType(type)) {
        add(property);
      }
    }
  }

  return members;
}

/**
 * Walk the member tree below a symbol and add one record per dotted path.
 *
 * @param {object} ts The TypeScript module.
 * @param {object} checker The type checker.
 * @param {object[]} symbols The symbols that share the container's name (merged declarations).
 * @param {string} prefix Dotted path of the container.
 * @param {number} depth Current depth.
 * @param {Set<object>} seen Symbols on the current path, to stop cycles.
 * @param {Map<string, object>} out The records by path.
 * @returns {void}
 */
function walkMembers(ts, checker, symbols, prefix, depth, seen, out) {
  const merged = new Map();

  for (const symbol of symbols) {
    for (const [name, list] of gatherMembers(ts, checker, symbol, depth === 0)) {
      merged.set(name, [...(merged.get(name) ?? []), ...list]);
    }
  }

  for (const [name, list] of merged) {
    const path = `${prefix}.${name}`;
    const resolvedList = list.map(member => resolveAlias(ts, checker, member));
    const records = list.map(member => describeSymbol(ts, checker, member));
    const primary = records.find(record => record.kind !== 'unknown' && record.kind !== 'interface' &&
      record.kind !== 'type') ?? records[0];
    const hasValue = records.some(record => record.space !== 'type');
    const hasType = records.some(record => record.space !== 'value');
    const record = { ...primary, space: spaceOf(hasValue, hasType) };

    for (const key of ['_ts', '_checker', '_symbol', '_shape']) {
      Object.defineProperty(record, key, {
        value: primary[key],
        writable: true,
        enumerable: false,
      });
    }

    out.set(path, record);

    if (depth + 1 < MAX_NAMESPACE_DEPTH) {
      const next = resolvedList.filter(member => !seen.has(member));

      if (next.length) {
        walkMembers(ts, checker, next, path, depth + 1, new Set([...seen, ...next]), out);
      }
    }
  }
}

/**
 * Collect the member tree of the default export of an entry point (the `Handsontable` namespace).
 *
 * @param {object} ts The TypeScript module.
 * @param {object} checker The type checker.
 * @param {object} moduleSymbol The entry point module symbol.
 * @returns {Map<string, object>|null} Records by dotted path, or null when there is no default export.
 */
function collectNamespace(ts, checker, moduleSymbol) {
  const defaultExport = checker.getExportsOfModule(moduleSymbol).find(symbol => symbol.escapedName === 'default');

  if (!defaultExport) {
    return null;
  }

  const root = resolveAlias(ts, checker, defaultExport);
  const out = new Map();

  walkMembers(ts, checker, [root], 'Handsontable', 0, new Set([root]), out);

  return out;
}

/**
 * Analyze one extracted package: entry points, exports per entry point, and the default export tree.
 *
 * @param {object} ts The TypeScript module.
 * @param {string} dir Extracted package directory.
 * @param {string|undefined} hotDir Extracted `handsontable` package, for wrapper packages.
 * @returns {Promise<object>} Name, version, entry point sources, exports, and namespaces.
 */
async function analyzePackage(ts, dir, hotDir) {
  const pkgJson = await readPackageJson(dir);
  const { entries, missing } = await enumerateEntryPoints(dir, pkgJson);
  const program = createProgram(ts, entries, hotDir);
  const checker = program.getTypeChecker();
  const exportsBySpecifier = new Map();
  const namespaces = new Map();
  const unreadable = [];

  for (const [specifier, { file }] of entries) {
    const sourceFile = program.getSourceFile(file);
    const moduleSymbol = sourceFile && checker.getSymbolAtLocation(sourceFile);

    if (!moduleSymbol) {
      unreadable.push(specifier);
      exportsBySpecifier.set(specifier, new Map());
      continue;
    }

    exportsBySpecifier.set(specifier, collectExports(ts, checker, moduleSymbol));

    if (specifier === 'handsontable' || specifier === 'handsontable/base') {
      const tree = collectNamespace(ts, checker, moduleSymbol);

      if (tree) {
        namespaces.set(specifier, tree);
      }
    }
  }

  return {
    dir,
    name: pkgJson.name,
    version: pkgJson.version,
    entries,
    exportsBySpecifier,
    namespaces,
    unreadable,
    missing,
  };
}

/**
 * Compare two name to record maps.
 *
 * @param {Map<string, object>} before Old records.
 * @param {Map<string, object>} after New records.
 * @param {string} keyField Output field that carries the key (`name` or `path`).
 * @returns {{ removed: object[], added: object[], spaceChanged: object[] }} Sorted differences.
 */
function diffMaps(before, after, keyField) {
  const sortByKey = (a, b) => compareText(a[keyField], b[keyField]);
  const removed = [];
  const added = [];
  const spaceChanged = [];

  for (const [key, record] of before) {
    if (!after.has(key)) {
      removed.push({ [keyField]: key, kind: record.kind, space: record.space });
    } else if (after.get(key).space !== record.space) {
      spaceChanged.push({
        [keyField]: key,
        oldKind: record.kind,
        oldSpace: record.space,
        newKind: after.get(key).kind,
        newSpace: after.get(key).space,
      });
    }
  }

  for (const [key, record] of after) {
    if (!before.has(key)) {
      added.push({ [keyField]: key, kind: record.kind, space: record.space });
    }
  }

  return {
    removed: removed.sort(sortByKey),
    added: added.sort(sortByKey),
    spaceChanged: spaceChanged.sort(sortByKey),
  };
}

/**
 * Split a PascalCase or camelCase identifier into lower-case words.
 *
 * @param {string} name An identifier.
 * @returns {string[]} The words.
 */
function tokenize(name) {
  return (name.match(/[A-Z]+(?![a-z])|[A-Z]?[a-z]+|\d+/g) ?? [name]).map(word => word.toLowerCase());
}

/**
 * Tell whether `needle` is a subsequence of `haystack`.
 *
 * @param {string[]} needle Words to find, in order.
 * @param {string[]} haystack Words to search in.
 * @returns {boolean} True when every needle word appears in order.
 */
function isSubsequence(needle, haystack) {
  let position = 0;

  for (const word of haystack) {
    if (word === needle[position]) {
      position += 1;
    }
  }

  return position === needle.length;
}

/**
 * Tell whether a declared type is made of plain object types only. A union of string literals is not: its
 * "properties" would be the apparent members of `string`. Arrays and tuples are not either, for the same reason.
 *
 * @param {object} ts The TypeScript module.
 * @param {object} type A type.
 * @returns {boolean} True for object types and for unions or intersections of them.
 */
function isObjectish(ts, type) {
  if (type.isUnionOrIntersection()) {
    return type.types.every(part => isObjectish(ts, part));
  }

  if (!(type.flags & ts.TypeFlags.Object)) {
    return false;
  }

  const isArray = type.symbol && ['Array', 'ReadonlyArray'].includes(type.symbol.name);
  const isTuple = (type.objectFlags & ts.ObjectFlags.Reference) && type.target &&
    (type.target.objectFlags & ts.ObjectFlags.Tuple);

  return !isArray && !isTuple;
}

/**
 * Compute and cache the property-name set (and the type text for property-less aliases) of a record.
 *
 * @param {object} record A record from `describeSymbol`.
 * @returns {{ props: Set<string>, text: string }} The structural shape.
 */
function shapeOf(record) {
  if (record._shape) {
    return record._shape;
  }

  const ts = record._ts;
  const checker = record._checker;
  const symbol = record._symbol;
  const F = ts.SymbolFlags;
  let props = new Set();
  let text = '';

  try {
    if (symbol.flags & (F.Interface | F.TypeAlias | F.Class)) {
      const declared = checker.getDeclaredTypeOfSymbol(symbol);

      if (isObjectish(ts, declared)) {
        props = new Set(checker.getPropertiesOfType(declared).map(property => String(property.escapedName)));
      }

      if (props.size === 0 && (symbol.flags & F.TypeAlias)) {
        text = checker.typeToString(
          declared,
          undefined,
          ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.InTypeAlias
        );
      }
    }
  } catch {
    // A shape that cannot be computed simply yields no structural match.
  }

  record._shape = { props, text };

  return record._shape;
}

/**
 * Compare two shapes. Returns a similarity in [0, 1], or 0 when the shapes are too small to compare.
 *
 * @param {{ props: Set<string>, text: string }} a First shape.
 * @param {{ props: Set<string>, text: string }} b Second shape.
 * @returns {number} Jaccard similarity of property names, or 1 for equal non-trivial alias text.
 */
function similarity(a, b) {
  if (a.props.size === 0 && b.props.size === 0) {
    return a.text.length > 24 && a.text === b.text ? 1 : 0;
  }

  const common = [...a.props].filter(name => b.props.has(name)).length;
  const union = new Set([...a.props, ...b.props]).size;
  const smallest = Math.min(a.props.size, b.props.size);

  if (smallest < 2 || (smallest < STRUCTURE_MIN_PROPS && common !== union)) {
    return 0;
  }

  return common / union;
}

/**
 * Build the lookup structures the candidate heuristics need from the new package.
 *
 * @param {object} oldPkg Analysis of the old package.
 * @param {object} newPkg Analysis of the new package.
 * @returns {object} The context shared by all heuristics.
 */
function buildCandidateContext(oldPkg, newPkg) {
  const byName = new Map();

  for (const [specifier, records] of newPkg.exportsBySpecifier) {
    for (const [name, record] of records) {
      if (name !== 'default') {
        byName.set(name, [...(byName.get(name) ?? []), { specifier, name, record }]);
      }
    }
  }

  return { oldPkg, newPkg, byName, pkgName: newPkg.name };
}

/**
 * Name the plugin that owns an entry point, for `<pkg>/plugins/<name>` specifiers.
 *
 * @param {string} specifier Import specifier.
 * @param {string} pkgName Package name.
 * @returns {string|null} The plugin folder name or null.
 */
function pluginOf(specifier, pkgName) {
  const prefix = `${pkgName}/plugins/`;

  return specifier.startsWith(prefix) ? specifier.slice(prefix.length).split('/')[0] : null;
}

/**
 * Specifiers whose exports can hold the replacement of a removed name from `specifier`.
 *
 * @param {object} context Candidate context.
 * @param {string} specifier The entry point the name was removed from.
 * @returns {string[]} Specifiers that exist in the new package.
 */
function poolSpecifiers(context, specifier) {
  const pkg = context.pkgName;
  const list = [specifier, ...MAIN_SPECIFIERS.map(suffix => (suffix ? `${pkg}/${suffix}` : pkg))];
  const plugin = pluginOf(specifier, pkg);

  if (plugin) {
    list.push(`${pkg}/plugins`);
  }

  return [...new Set(list)].filter(item => context.newPkg.exportsBySpecifier.has(item));
}

/**
 * Add a match to a list. A second heuristic that finds the same target adds its name and reason to the first.
 *
 * @param {object[]} matches The match list.
 * @param {object} match The new match (`heuristic` and `reason` are single values here).
 * @returns {void}
 */
function pushMatch(matches, match) {
  const { heuristic, reason, ...target } = match;
  const existing = matches.find(item => item.specifier === target.specifier && item.name === target.name);

  if (!existing) {
    matches.push({ ...target, heuristics: [heuristic], reasons: [reason] });
  } else if (!existing.heuristics.includes(heuristic)) {
    existing.heuristics.push(heuristic);
    existing.reasons.push(reason);
  }
}

/**
 * Run the candidate heuristics for one removed name.
 *
 * @param {object} context Candidate context.
 * @param {object} subject What was removed.
 * @param {string} subject.specifier Entry point it was removed from (the namespace walk passes a pseudo entry).
 * @param {string} subject.name The name to find a home for.
 * @param {object|null} subject.record Its old record, for structural comparison.
 * @param {string[]} subject.extraSpecifiers Additional entry points worth searching.
 * @param {string|null} subject.prefixWord Plugin or owner name to prepend when matching by words.
 * @returns {{ matches: object[], sameNameTotal: number }} The matches and how many same-name hits existed.
 */
function findMatches(context, subject) {
  const { specifier, name, record, extraSpecifiers, prefixWord } = subject;
  const pkg = context.pkgName;
  const matches = [];
  const pool = [...new Set([...poolSpecifiers(context, specifier), ...extraSpecifiers])]
    .filter(item => context.newPkg.exportsBySpecifier.has(item));
  const oldRecords = context.oldPkg.exportsBySpecifier;
  const isNewInSpec = (spec, exportName) => !(oldRecords.get(spec)?.has(exportName));
  const ownerWord = pluginOf(specifier, pkg) ?? prefixWord;
  const ownerWords = ownerWord ? tokenize(ownerWord) : [];
  const ownerEntry = ownerWord ? `${pkg}/plugins/${ownerWord.charAt(0).toLowerCase()}${ownerWord.slice(1)}` : null;
  const isOtherPlugin = spec => pluginOf(spec, pkg) !== null && Boolean(ownerWord) && spec !== ownerEntry &&
    spec !== specifier;
  const sameName = (context.byName.get(name) ?? [])
    .filter(item => item.specifier !== specifier && !isOtherPlugin(item.specifier));
  const keptSameName = sameName.length > MAX_SAME_NAME_MATCHES ?
    sameName.filter(item => pluginOf(item.specifier, pkg) === null).slice(0, MAX_SAME_NAME_MATCHES) :
    sameName;

  for (const item of keptSameName) {
    pushMatch(matches, {
      specifier: item.specifier,
      name,
      kind: item.record.kind,
      heuristic: 'same-name',
      reason: 'the same name is exported from this entry point in the new package',
    });
  }

  const ownWords = tokenize(name);

  for (const spec of pool) {
    const inOwnEntry = spec === specifier || spec === ownerEntry;
    const prefixed = isSubsequence(ownerWords, ownWords) ? ownWords : [...ownerWords, ...ownWords];
    const query = inOwnEntry ? ownWords : prefixed;

    for (const [exportName, exportRecord] of context.newPkg.exportsBySpecifier.get(spec)) {
      if (exportName === name || exportName === 'default' || !isNewInSpec(spec, exportName)) {
        continue;
      }

      if (isSubsequence(query, tokenize(exportName))) {
        pushMatch(matches, {
          specifier: spec,
          name: exportName,
          kind: exportRecord.kind,
          heuristic: 'name-words',
          reason: `new export whose name contains the words "${query.join(' ')}" in order`,
        });
      }
    }
  }

  if (record && ['interface', 'type'].includes(record.kind)) {
    const oldShape = shapeOf(record);
    const structurePool = [...context.newPkg.exportsBySpecifier.keys()];

    for (const spec of structurePool) {
      const wide = !pool.includes(spec);

      for (const [exportName, exportRecord] of context.newPkg.exportsBySpecifier.get(spec)) {
        const skipKind = !['interface', 'type', 'class'].includes(exportRecord.kind);

        if (exportName === 'default' || skipKind || (wide && !isNewInSpec(spec, exportName))) {
          continue;
        }

        const score = similarity(oldShape, shapeOf(exportRecord));

        if (score >= STRUCTURE_THRESHOLD) {
          const newShape = shapeOf(exportRecord);
          const basis = oldShape.props.size === 0 ?
            'same alias text' :
            `${oldShape.props.size} old and ${newShape.props.size} new properties`;

          pushMatch(matches, {
            specifier: spec,
            name: exportName,
            kind: exportRecord.kind,
            heuristic: 'structure',
            reason: `declaration overlap ${Math.round(score * 100)} percent (${basis})`,
            newlyAdded: isNewInSpec(spec, exportName),
          });
        }
      }
    }
  }

  const order = ['same-name', 'namespace-type-export', 'structure', 'name-words'];
  const rank = match => Math.min(...match.heuristics.map(item => order.indexOf(item)));

  matches.sort((a, b) => rank(a) - rank(b) || compareText(a.specifier + a.name, b.specifier + b.name));

  return { matches, sameNameTotal: sameName.length };
}

/**
 * Build the candidates list for removed entry point exports and removed namespace type members.
 *
 * @param {object} context Candidate context.
 * @param {Array<{ specifier: string, removed: object[] }>} exportRemovals Removed names per old entry point.
 * @param {Map<string, object>|null} oldNamespace Old namespace records.
 * @param {object[]} namespaceRemoved Removed namespace paths.
 * @param {Map<string, object>|null} newNamespace New namespace records.
 * @returns {object[]} Candidate entries, sorted.
 */
function buildCandidates(context, exportRemovals, oldNamespace, namespaceRemoved, newNamespace) {
  const candidates = [];
  const pkg = context.pkgName;
  const newPathsByName = new Map();

  for (const path of newNamespace?.keys() ?? []) {
    const last = path.slice(path.lastIndexOf('.') + 1);

    newPathsByName.set(last, [...(newPathsByName.get(last) ?? []), path]);
  }

  for (const { specifier, removed } of exportRemovals) {
    const oldRecords = context.oldPkg.exportsBySpecifier.get(specifier);

    for (const item of removed) {
      const { matches, sameNameTotal } = findMatches(context, {
        specifier,
        name: item.name,
        record: oldRecords.get(item.name),
        extraSpecifiers: [],
        prefixWord: null,
      });

      if (matches.length) {
        const entry = { source: 'export', specifier, name: item.name, kind: item.kind, matches };

        if (sameNameTotal > MAX_SAME_NAME_MATCHES) {
          entry.sameNameTotal = sameNameTotal;
        }

        candidates.push(entry);
      }
    }
  }

  for (const item of namespaceRemoved) {
    const segments = item.path.split('.');
    const name = segments[segments.length - 1];
    const parent = segments[segments.length - 2];
    const isPluginMember = segments[1] === 'plugins' && segments.length === 4;
    const pluginFolder = isPluginMember ? parent.charAt(0).toLowerCase() + parent.slice(1) : null;
    const extra = pluginFolder ? [`${pkg}/plugins/${pluginFolder}`] : [];
    const { matches } = findMatches(context, {
      specifier: `${pkg}/namespace`,
      name,
      record: oldNamespace.get(item.path),
      extraSpecifiers: extra,
      prefixWord: isPluginMember ? parent : null,
    });

    for (const spec of [pkg, `${pkg}/base`]) {
      const exported = context.newPkg.exportsBySpecifier.get(spec)?.get(name);

      if (exported) {
        pushMatch(matches, {
          specifier: spec,
          name,
          kind: exported.kind,
          heuristic: 'namespace-type-export',
          reason: `"${name}" is a named export of this entry point in the new package`,
        });
      }
    }

    const samePaths = (newPathsByName.get(name) ?? []).filter(path => path !== item.path);

    if (matches.length || samePaths.length) {
      const entry = { source: 'namespace', path: item.path, kind: item.kind, matches };

      if (samePaths.length) {
        entry.sameNameInNamespace = samePaths.slice(0, MAX_SAME_NAME_MATCHES);
      }

      candidates.push(entry);
    }
  }

  const keyOf = entry => `${entry.source}|${entry.specifier ?? ''}|${entry.name ?? entry.path}`;

  return candidates.sort((a, b) => compareText(keyOf(a), keyOf(b)));
}

/**
 * Diff two analyzed packages.
 *
 * @param {object} oldPkg Analysis of the old package.
 * @param {object} newPkg Analysis of the new package.
 * @returns {object} The diff section of the output.
 */
function diffPackages(oldPkg, newPkg) {
  const oldSpecifiers = [...oldPkg.exportsBySpecifier.keys()];
  const newSpecifiers = [...newPkg.exportsBySpecifier.keys()];
  const removedEntries = oldSpecifiers.filter(spec => !newPkg.exportsBySpecifier.has(spec)).sort();
  const addedEntries = newSpecifiers.filter(spec => !oldPkg.exportsBySpecifier.has(spec)).sort();
  const changed = {};
  const exportRemovals = [];

  for (const specifier of removedEntries) {
    const records = oldPkg.exportsBySpecifier.get(specifier);
    const removed = diffMaps(records, new Map(), 'name').removed;

    exportRemovals.push({ specifier, removed });
  }

  for (const specifier of oldSpecifiers.filter(spec => newPkg.exportsBySpecifier.has(spec)).sort()) {
    const diff = diffMaps(
      oldPkg.exportsBySpecifier.get(specifier),
      newPkg.exportsBySpecifier.get(specifier),
      'name'
    );

    if (diff.removed.length || diff.added.length || diff.spaceChanged.length) {
      changed[specifier] = { removed: diff.removed, added: diff.added };

      if (diff.spaceChanged.length) {
        changed[specifier].spaceChanged = diff.spaceChanged;
      }

      exportRemovals.push({ specifier, removed: diff.removed });
    }
  }

  const oldNamespace = oldPkg.namespaces.get(oldPkg.name) ?? null;
  const newNamespace = newPkg.namespaces.get(newPkg.name) ?? null;
  let namespace = { removed: [], added: [], spaceChanged: [] };

  if (oldNamespace && newNamespace) {
    namespace = diffMaps(oldNamespace, newNamespace, 'path');
  }

  const context = buildCandidateContext(oldPkg, newPkg);
  const candidates = buildCandidates(context, exportRemovals, oldNamespace, namespace.removed, newNamespace);
  const result = {
    entryPoints: {
      removed: removedEntries.map(specifier => ({
        specifier,
        exports: diffMaps(oldPkg.exportsBySpecifier.get(specifier), new Map(), 'name').removed,
      })),
      added: addedEntries.map(specifier => ({
        specifier,
        exports: diffMaps(new Map(), newPkg.exportsBySpecifier.get(specifier), 'name').added,
      })),
      changed,
    },
    namespace,
    candidates,
  };

  const oldBase = oldPkg.namespaces.get(`${oldPkg.name}/base`);
  const newBase = newPkg.namespaces.get(`${newPkg.name}/base`);

  if (oldBase && newBase) {
    const baseDiff = diffMaps(oldBase, newBase, 'path');

    if (JSON.stringify(baseDiff) !== JSON.stringify(namespace)) {
      result.namespaceBase = baseDiff;
    }
  }

  return result;
}

/**
 * Summarize one analyzed package for the output header.
 *
 * @param {object} pkg Analysis of a package.
 * @returns {object} Name, version, and entry point bookkeeping.
 */
function describePackage(pkg) {
  const sibling = [...pkg.entries].filter(([, entry]) => entry.via === 'sibling').map(([spec]) => spec).sort();
  const header = {
    name: pkg.name,
    version: pkg.version,
    entryPointCount: pkg.entries.size,
  };

  if (sibling.length) {
    header.typesFromSiblingFile = sibling;
  }

  if (pkg.missing.length) {
    header.typesDeclaredButMissing = pkg.missing;
  }

  if (pkg.unreadable.length) {
    header.unreadableEntryPoints = pkg.unreadable.slice().sort();
  }

  return header;
}

/**
 * Shorten a declaration to one line for the full dump.
 *
 * @param {object} record A record.
 * @returns {string} Declaration text or an empty string.
 */
function declarationText(record) {
  const declaration = record._symbol.declarations?.[0];

  if (!declaration) {
    return '';
  }

  const text = declaration.getText().replace(/\s+/g, ' ');

  return text.length > MAX_DECLARATION_TEXT ? `${text.slice(0, MAX_DECLARATION_TEXT)}...` : text;
}

/**
 * Name the package-relative file that declares a record, so two versions can be matched by entity.
 *
 * @param {object} pkg Analysis of a package.
 * @param {object} record A record.
 * @returns {string} Forward-slash relative path, or an empty string.
 */
function declarationFile(pkg, record) {
  const declaration = record._symbol.declarations?.[0];

  return declaration ? relative(pkg.dir, declaration.getSourceFile().fileName).split(sep).join('/') : '';
}

/**
 * Produce the full dump (every export with declaration text) of one analyzed package.
 *
 * @param {object} pkg Analysis of a package.
 * @returns {object} Serializable dump.
 */
function dumpPackage(pkg) {
  const entryPoints = {};
  const namespaces = {};

  for (const specifier of [...pkg.exportsBySpecifier.keys()].sort()) {
    entryPoints[specifier] = {};

    for (const name of [...pkg.exportsBySpecifier.get(specifier).keys()].sort()) {
      const record = pkg.exportsBySpecifier.get(specifier).get(name);

      entryPoints[specifier][name] = {
        kind: record.kind,
        space: record.space,
        declaredIn: declarationFile(pkg, record),
        declaration: declarationText(record),
      };
    }
  }

  for (const [specifier, tree] of pkg.namespaces) {
    namespaces[specifier] = {};

    for (const path of [...tree.keys()].sort()) {
      const record = tree.get(path);

      namespaces[specifier][path] = {
        kind: record.kind,
        space: record.space,
        declaredIn: declarationFile(pkg, record),
        declaration: declarationText(record),
      };
    }
  }

  return { name: pkg.name, version: pkg.version, entryPoints, namespaces };
}

/**
 * Entry point of the tool.
 *
 * @param {string[]} argv Command line arguments without the node and script paths.
 * @returns {Promise<number>} Process exit code.
 */
async function main(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      old: { type: 'string' },
      new: { type: 'string' },
      out: { type: 'string' },
      'old-hot': { type: 'string' },
      'new-hot': { type: 'string' },
      wrapper: { type: 'string', multiple: true },
      'empty-rules': { type: 'boolean' },
      full: { type: 'string' },
      typescript: { type: 'string' },
    },
  });

  if (!values.old || !values.new || !values.out) {
    console.error('Usage: node derive-type-map.mjs --old <dir> --new <dir> --out <file> ' +
      '[--old-hot <dir> --new-hot <dir>] [--wrapper <old dir>,<new dir>]... [--empty-rules] ' +
      '[--full <file>] [--typescript <dir>]');

    return 2;
  }

  const ts = await loadTypescript(values.typescript);
  const oldPkg = await analyzePackage(ts, resolve(values.old), values['old-hot'] && resolve(values['old-hot']));
  const newPkg = await analyzePackage(ts, resolve(values.new), values['new-hot'] && resolve(values['new-hot']));
  const output = {
    generatedBy: `${TOOL_NAME} (typescript ${ts.version})`,
    old: describePackage(oldPkg),
    new: describePackage(newPkg),
    ...(values['empty-rules'] ? { rules: [] } : {}),
    ...diffPackages(oldPkg, newPkg),
  };
  const dumps = [];

  if (values.wrapper?.length) {
    output.wrappers = {};

    for (const pair of values.wrapper) {
      const [oldDir, newDir] = pair.split(',').map(item => resolve(item));
      const oldWrapper = await analyzePackage(ts, oldDir, resolve(values.old));
      const newWrapper = await analyzePackage(ts, newDir, resolve(values.new));
      const { namespace, namespaceBase, ...rest } = diffPackages(oldWrapper, newWrapper);

      output.wrappers[newWrapper.name] = {
        old: describePackage(oldWrapper),
        new: describePackage(newWrapper),
        ...rest,
      };
      dumps.push(oldWrapper, newWrapper);
    }
  }

  await writeFile(resolve(values.out), `${JSON.stringify(output, null, 2)}\n`);

  if (values.full) {
    const dump = {
      old: dumpPackage(oldPkg),
      new: dumpPackage(newPkg),
      wrappers: dumps.map(dumpPackage),
    };

    await writeFile(resolve(values.full), `${JSON.stringify(dump, null, 2)}\n`);
  }

  return 0;
}

process.exitCode = await main(process.argv.slice(2));
