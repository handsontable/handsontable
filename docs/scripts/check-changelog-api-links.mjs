// Reports changelog "Added" entries that name a public API without linking it to its reference
// page, and @/api/ links in the changelog pages whose file or anchor cannot resolve.
//
// The check is build-free on purpose: docs/content/api/*.md is generated from handsontable/tmp/
// and gitignored, so no pull-request job has it. Option, hook and plugin names are read from the
// committed core sources instead, and the api/*.md file slugs from docs/content/api/sidebar.js plus
// the plugin directories, since the generator emits a page per plugin whether the sidebar lists it
// or not.
//
// It is report-only and always exits 0. The candidate set is a heuristic - a backticked word that
// happens to match an option name is not proof the entry introduced that option - so a finding is
// a prompt for a human, never a gate.
//
// Usage: node scripts/check-changelog-api-links.mjs

import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const DOCS_ROOT = resolve(import.meta.dirname, '..');
const REPO_ROOT = resolve(DOCS_ROOT, '..');
const CHANGELOGS_DIR = join(DOCS_ROOT, 'content/guides/upgrade-and-migration');
const METASCHEMA = join(REPO_ROOT, 'handsontable/src/dataMap/metaManager/metaSchema.ts');
const HOOK_CONSTANTS = join(REPO_ROOT, 'handsontable/src/core/hooks/constants.ts');
const PLUGINS_INDEX = join(REPO_ROOT, 'handsontable/src/plugins/index.ts');
const CORE = join(REPO_ROOT, 'handsontable/src/core.ts');
const API_SIDEBAR = join(DOCS_ROOT, 'content/api/sidebar.js');

/**
 * Reads the configuration option names out of `metaSchema.ts`.
 *
 * The module exports a function returning an object literal, so the names are taken from the
 * declaration that follows each `@memberof Options#` JSDoc block. Both shapes count: a plain
 * `name:` property and a `name(` method shorthand, which is how `isEmptyCol` and `isEmptyRow` are
 * written.
 *
 * @param {string} source Contents of `metaSchema.ts`.
 * @returns {Set<string>} Option names.
 */
export function extractOptionNames(source) {
  const names = new Set();
  const lines = source.split('\n');
  let insideDocumentedBlock = false;

  lines.forEach((line) => {
    if (line.includes('@memberof Options#')) {
      insideDocumentedBlock = true;

      return;
    }

    if (!insideDocumentedBlock) {
      return;
    }

    // Still inside the JSDoc block that carried the tag.
    if (/^\s*(\/\*\*|\*)/.test(line)) {
      return;
    }

    const declaration = line.match(/^\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z_$][\w$]*))\s*[:(]/);

    if (declaration) {
      names.add(declaration[1] ?? declaration[2] ?? declaration[3]);
    }

    insideDocumentedBlock = false;
  });

  return names;
}

/**
 * Reads the hook names out of `core/hooks/constants.ts`.
 *
 * Only `REGISTERED_HOOKS` counts. `REMOVED_HOOKS` and `DEPRECATED_HOOKS` follow it in the same
 * file and are deliberately left out: the reference page no longer documents them, so a link
 * would not resolve.
 *
 * @param {string} source Contents of `constants.ts`.
 * @returns {Set<string>} Hook names.
 */
export function extractHookNames(source) {
  const start = source.indexOf('export const REGISTERED_HOOKS');

  if (start === -1) {
    return new Set();
  }

  const openingBracket = source.indexOf('[', start);
  const closingBracket = source.indexOf('\n];', openingBracket);
  const body = source.slice(openingBracket, closingBracket === -1 ? undefined : closingBracket);
  const names = new Set();

  // Match a whole line, not any quoted word: the array is interleaved with `@event` JSDoc blocks
  // whose examples contain quoted strings of their own.
  body.split('\n').forEach((line) => {
    const entry = line.match(/^\s*'([A-Za-z][\w]*)',?\s*$/);

    if (entry) {
      names.add(entry[1]);
    }
  });

  return names;
}

/**
 * Reads the plugin class names out of `plugins/index.ts`, paired with the api file slug of the page
 * generated for each.
 *
 * The slug follows the **class** name with its first letter lowercased, not the directory. The two
 * usually coincide, but `BasePlugin` is exported from `./base` and its page is `api/basePlugin.md`;
 * `api/base.md` does not exist, and suggesting it would break the very rule this check enforces.
 *
 * @param {string} source Contents of `plugins/index.ts`.
 * @returns {Map<string, string>} Class name to api file slug, for example `Filters` to `filters`.
 */
export function extractPluginNames(source) {
  const plugins = new Map();
  const pattern = /^(?:import|export)\s*\{\s*([A-Z][\w]*)\s*\}\s*from\s*'\.\/[\w]+'/gm;

  Array.from(source.matchAll(pattern)).forEach(([, className]) => {
    plugins.set(className, `${className[0].toLowerCase()}${className.slice(1)}`);
  });

  return plugins;
}

/**
 * Reads the `Core` members out of `core.ts`.
 *
 * Every one is declared with `@memberof Core#` plus a `@function` or `@member` tag naming it, and
 * `api/core.md` emits that name verbatim as a heading. The extraction is deliberately conservative:
 * measured against a generated `core.md` it finds 145 of the members it documents and invents none,
 * because the page also carries every configuration option and a handful of internal members. That
 * makes it safe to *suggest* a `core.md` link from, and unsafe to *reject* one with, which is why
 * {@link findBrokenApiLinks} never validates a `core.md` anchor.
 *
 * @param {string} source Contents of `core.ts`.
 * @returns {Set<string>} Core member names.
 */
export function extractCoreMemberNames(source) {
  const names = new Set();

  source.split('/**').slice(1).forEach((block) => {
    const body = block.split('*/')[0];

    if (!body.includes('@memberof Core#') || body.includes('@private')) {
      return;
    }

    const named = body.match(/@(?:function|member)\s+([A-Za-z_$][\w$]*)/);

    if (named) {
      names.add(named[1]);
    }
  });

  return names;
}

/**
 * Reads the api file slugs out of `docs/content/api/sidebar.js`.
 *
 * That file is the only git-tracked description of the generated reference, which makes it the
 * build-free source of truth for the `@/api/<file>.md` half of a link.
 *
 * @param {string} source Contents of `sidebar.js`.
 * @returns {Set<string>} File slugs, without the `.md` extension.
 */
export function extractApiFileSlugs(source) {
  const children = source.matchAll(/children:\s*\[([^\]]*)\]/g);
  const slugs = new Set();

  Array.from(children).forEach(([, list]) => {
    Array.from(list.matchAll(/'([\w]+)'/g)).forEach(([, slug]) => slugs.add(slug));
  });

  return slugs;
}

/**
 * Lists every api file slug a link may point at.
 *
 * `sidebar.js` describes the reference *navigation*, and the generator emits a page for every
 * plugin whether the sidebar lists it or not - `api/dataProvider.md` is generated and reachable at
 * its own permalink, but no sidebar entry names it. Taking the union keeps a link to such a page
 * from being reported as unresolvable.
 *
 * @param {string} sidebarSource Contents of `docs/content/api/sidebar.js`.
 * @param {string} pluginsSource Contents of `handsontable/src/plugins/index.ts`.
 * @returns {Set<string>} File slugs, without the `.md` extension.
 */
export function buildKnownFileSlugs(sidebarSource, pluginsSource) {
  return new Set([
    ...extractApiFileSlugs(sidebarSource),
    ...extractPluginNames(pluginsSource).values(),
  ]);
}

/**
 * Splits a markdown page into its `Added` sections, keeping each line's 1-based number.
 *
 * @param {string} markdown Page contents.
 * @returns {Array<{ line: number, text: string }>} Lines that belong to an `Added` section.
 */
export function collectAddedSectionLines(markdown) {
  const collected = [];
  let insideAdded = false;
  let insideCodeFence = false;

  markdown.split('\n').forEach((text, index) => {
    if (/^\s*```/.test(text)) {
      insideCodeFence = !insideCodeFence;

      return;
    }

    if (insideCodeFence) {
      return;
    }

    const heading = text.match(/^(#{1,6})\s+(.*)$/);

    if (heading) {
      insideAdded = heading[2].trim() === 'Added';

      return;
    }

    if (insideAdded) {
      collected.push({ line: index + 1, text });
    }
  });

  return collected;
}

/**
 * Groups the lines of an `Added` section into whole bullets, so that a name and the link that
 * covers it are seen together even when the entry wraps over several lines.
 *
 * @param {Array<{ line: number, text: string }>} lines Lines of an `Added` section.
 * @returns {Array<{ line: number, text: string }>} Bullets, each starting at its own line number.
 */
export function collectBullets(lines) {
  const bullets = [];

  lines.forEach(({ line, text }) => {
    if (/^\s*[-*]\s/.test(text)) {
      bullets.push({ line, text: text.trim() });

      return;
    }

    if (bullets.length > 0 && text.trim() !== '') {
      bullets[bullets.length - 1].text += ` ${text.trim()}`;
    }
  });

  return bullets;
}

/**
 * Resolves a name to the reference page it should link to.
 *
 * A plugin class wins over an option of the same word, because the two differ only in case
 * (`Filters` the plugin, `filters` the option) and the class form is the one an entry uses when it
 * means the plugin.
 *
 * @param {string} name Candidate name, already stripped of its call parentheses.
 * @param {object} api Known API names.
 * @param {Set<string>} api.optionNames Option names.
 * @param {Set<string>} api.hookNames Hook names.
 * @param {Map<string, string>} api.pluginNames Plugin class name to api file slug.
 * @param {Set<string>} [api.coreNames] `Core` member names.
 * @returns {{ file: string, anchor: string }|null} Link target, or `null` when the name is not a
 * documented API member.
 *
 * A **plugin method** never resolves here, and cannot: a bare `collapseAll()` belongs to both the
 * `CollapsibleColumns` and the `NestedRows` plugin, and only the sentence around it says which. The
 * check therefore does not see plugin methods at all, and a human editing a changelog page still
 * has to link those by hand. This is the one documented blind spot.
 */
export function resolveApiTarget(name, { optionNames, hookNames, pluginNames, coreNames }) {
  if (pluginNames.has(name)) {
    return { file: pluginNames.get(name), anchor: '' };
  }

  if (optionNames.has(name)) {
    return { file: 'options', anchor: name.toLowerCase() };
  }

  if (hookNames.has(name)) {
    return { file: 'hooks', anchor: name.toLowerCase() };
  }

  if (coreNames !== undefined && coreNames.has(name)) {
    return { file: 'core', anchor: name.toLowerCase() };
  }

  return null;
}

/**
 * Resolves a name that differs from a documented API member only in letter case.
 *
 * A changelog entry copied by hand can carry a name whose casing does not match the source -
 * `beforeCompositionstart` for the `beforeCompositionStart` hook, for example. Such a name reads
 * as an API member but is not one, so it is worth reporting with the spelling corrected.
 *
 * @param {string} name Candidate name.
 * @param {object} api Known API names, as taken by {@link resolveApiTarget}.
 * @returns {{ file: string, anchor: string, canonicalName: string }|null} Link target carrying the
 * documented spelling, or `null` when nothing matches.
 */
export function resolveMisspelledApiTarget(name, api) {
  const candidates = [
    ...api.pluginNames.keys(),
    ...api.optionNames,
    ...api.hookNames,
    ...(api.coreNames ?? []),
  ];
  const canonicalName = candidates.find(candidate => candidate.toLowerCase() === name.toLowerCase());

  if (canonicalName === undefined || canonicalName === name) {
    return null;
  }

  return { ...resolveApiTarget(canonicalName, api), canonicalName };
}

/**
 * Finds `Added` entries that name a documented API member in backticks without linking it.
 *
 * A name already wrapped in a markdown link is left alone, whichever form the link takes - an
 * internal `@/api/` link or an absolute `handsontable.com/docs` URL both count as linked.
 *
 * @param {string} markdown Page contents.
 * @param {object} api Known API names, as taken by {@link resolveApiTarget}.
 * @returns {Array<{ line: number, name: string, suggestion: string }>} Findings.
 */
export function findUnlinkedApiNames(markdown, api) {
  const findings = [];

  collectBullets(collectAddedSectionLines(markdown)).forEach(({ line, text }) => {
    const seen = new Set();

    Array.from(text.matchAll(/`([^`]+)`/g)).forEach((match) => {
      const isLinked = text[match.index - 1] === '[';
      const name = match[1].replace(/\(\)$/, '');

      if (isLinked || seen.has(name) || !/^[A-Za-z_$][\w$]*$/.test(name)) {
        return;
      }

      const target = resolveApiTarget(name, api) ?? resolveMisspelledApiTarget(name, api);

      if (target === null) {
        return;
      }

      const label = target.canonicalName === undefined
        ? match[1]
        : match[1].replace(name, target.canonicalName);

      seen.add(name);
      findings.push({
        line,
        name,
        misspelled: target.canonicalName !== undefined,
        suggestion: `[\`${label}\`](@/api/${target.file}.md${target.anchor ? `#${target.anchor}` : ''})`,
      });
    });
  });

  return findings;
}

/**
 * Finds `@/api/` links whose file slug or anchor cannot resolve.
 *
 * Anchors are the plain lowercased member name, because the reference page emits the name verbatim
 * as a heading. An anchor that carries a capital letter therefore never resolves, however real the
 * member behind it is.
 *
 * @param {string} markdown Page contents.
 * @param {object} api Known API names.
 * @param {Set<string>} api.optionNames Option names.
 * @param {Set<string>} api.hookNames Hook names.
 * @param {Set<string>} api.fileSlugs Api file slugs from `sidebar.js`.
 * @returns {Array<{ line: number, link: string, reason: string }>} Findings.
 */
export function findBrokenApiLinks(markdown, { optionNames, hookNames, fileSlugs }) {
  const findings = [];
  const anchorsOf = names => new Set(Array.from(names, name => name.toLowerCase()));
  const knownAnchors = { options: anchorsOf(optionNames), hooks: anchorsOf(hookNames) };

  markdown.split('\n').forEach((text, index) => {
    Array.from(text.matchAll(/@\/api\/([\w]+)\.md(?:#([^)\s]+))?/g)).forEach(([link, file, anchor]) => {
      const report = reason => findings.push({ line: index + 1, link, reason });

      if (!fileSlugs.has(file)) {
        report(`api/${file}.md is neither an api sidebar entry nor a plugin`);

        return;
      }

      if (anchor === undefined) {
        return;
      }

      if (anchor !== anchor.toLowerCase()) {
        report(`anchor #${anchor} must be lowercase - reference headings resolve to #${anchor.toLowerCase()}`);

        return;
      }

      if (knownAnchors[file] !== undefined && !knownAnchors[file].has(anchor)) {
        report(`#${anchor} is not a member of api/${file}.md`);
      }
    });
  });

  return findings;
}

/**
 * Lists the changelog pages to check.
 *
 * @param {string} directory The `upgrade-and-migration` guides directory.
 * @returns {string[]} Page paths, in ascending major order.
 */
export function listChangelogPages(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && /^changelog-\d+$/.test(entry.name))
    .sort((a, b) => Number(a.name.replace(/\D/g, '')) - Number(b.name.replace(/\D/g, '')))
    .map(entry => join(directory, entry.name, `${entry.name}.md`));
}

/**
 * Runs both checks over every changelog page.
 *
 * @param {object} [options] Options.
 * @param {string} [options.directory] The `upgrade-and-migration` guides directory.
 * @returns {{ unlinked: object[], broken: object[] }} Findings, each carrying its page path.
 */
export function checkChangelogPages({ directory = CHANGELOGS_DIR } = {}) {
  const api = {
    optionNames: extractOptionNames(readFileSync(METASCHEMA, 'utf8')),
    hookNames: extractHookNames(readFileSync(HOOK_CONSTANTS, 'utf8')),
    pluginNames: extractPluginNames(readFileSync(PLUGINS_INDEX, 'utf8')),
    coreNames: extractCoreMemberNames(readFileSync(CORE, 'utf8')),
    fileSlugs: buildKnownFileSlugs(
      readFileSync(API_SIDEBAR, 'utf8'),
      readFileSync(PLUGINS_INDEX, 'utf8'),
    ),
  };
  const unlinked = [];
  const broken = [];

  listChangelogPages(directory).forEach((page) => {
    const markdown = readFileSync(page, 'utf8');
    const file = page.slice(REPO_ROOT.length + 1);

    findUnlinkedApiNames(markdown, api).forEach(finding => unlinked.push({ file, ...finding }));
    findBrokenApiLinks(markdown, api).forEach(finding => broken.push({ file, ...finding }));
  });

  return { unlinked, broken };
}

/**
 * Renders the findings as the markdown written to the workflow step summary.
 *
 * @param {{ unlinked: object[], broken: object[] }} findings Findings.
 * @returns {string} Markdown.
 */
export function formatSummary({ unlinked, broken }) {
  const lines = ['## Changelog API reference links', ''];

  if (unlinked.length === 0 && broken.length === 0) {
    lines.push('Every API name in an `Added` entry links to its reference page.');

    return `${lines.join('\n')}\n`;
  }

  if (unlinked.length > 0) {
    lines.push(
      `### ${unlinked.length} API name(s) named without a reference link`,
      '',
      '| Page | Line | Name | Suggested link |',
      '| --- | --- | --- | --- |',
      ...unlinked.map(({ file, line, name, misspelled, suggestion }) =>
        `| ${file} | ${line} | \`${name}\`${misspelled ? ' (cased differently in the source)' : ''} | \`${suggestion}\` |`),
      '',
    );
  }

  if (broken.length > 0) {
    lines.push(
      `### ${broken.length} \`@/api/\` link(s) that cannot resolve`,
      '',
      '| Page | Line | Link | Reason |',
      '| --- | --- | --- | --- |',
      ...broken.map(({ file, line, link, reason }) => `| ${file} | ${line} | \`${link}\` | ${reason} |`),
      '',
    );
  }

  lines.push(
    'Linking is a docs-page step, not an entry-title one: an `@/api/` link in a `.changelogs/*.json`',
    'title would break the root `CHANGELOG.md` and the GitHub release body. See `.changelogs/README.md`.',
  );

  return `${lines.join('\n')}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { appendFileSync } = await import('node:fs');
  const findings = checkChangelogPages();
  const { unlinked, broken } = findings;

  unlinked.forEach(({ file, line, name, misspelled, suggestion }) => {
    const problem = misspelled
      ? 'is cased differently in the source and has no reference link'
      : 'has no reference link';

    console.log(`${file}:${line}: \`${name}\` ${problem} - suggested: ${suggestion}`);
  });

  broken.forEach(({ file, line, link, reason }) => {
    console.log(`${file}:${line}: ${link} - ${reason}`);
  });

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, formatSummary(findings));
  }

  if (unlinked.length === 0 && broken.length === 0) {
    console.log('Every API name in an `Added` entry links to its reference page.');
  } else {
    console.log(
      `\n${unlinked.length} unlinked API name(s), ${broken.length} unresolvable @/api/ link(s).`,
      '\nThis check is report-only. Link what belongs to the reference and leave the rest -',
      'theme tokens, TypeScript type names and external APIs have no reference page.',
    );
  }
}
