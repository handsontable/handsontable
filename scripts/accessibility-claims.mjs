/**
 * @file The accessibility claims check: public text may say only what
 * `docs/content/data/accessibility.json` says.
 *
 * The target is "targets WCAG 2.2 Level A and AA", with a link to the conformance report, and the
 * screen readers that may be named are the ones the data file's matrix records as tested. Before
 * this check, the docs, the READMEs, and the website disagreed with the report on all of it: the
 * guide said "meets WCAG 2.1 AA" under a report that judges WCAG 2.2 per criterion, a recipe
 * targeted "WCAG 2.1 AA compliance", and three pages listed JAWS, which no audit has run.
 *
 * Every exported function is pure - text in, findings out - so the unit tests in
 * `scripts/__tests__/accessibility-claims.test.mjs` cover the rules without the filesystem. The
 * same test file runs `scanRepository()` over the real tree, which is the gate. `main()` is the
 * command-line form of that gate.
 *
 * Usage:
 *   node scripts/accessibility-claims.mjs          # scan, print findings, exit 1 on any
 *   node scripts/accessibility-claims.mjs --json   # the findings as JSON
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadAccessibilityData,
  allowedScreenReaderNames,
  accessibilityTemplateValues,
} from '../docs/src/plugins/accessibility-data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The screen readers the rules know by name. A name here that the matrix does not list as tested
 * is a finding wherever it appears in public text; a name not here is not checked, so add a new
 * screen reader here before it is added to the matrix.
 *
 * @type {string[]}
 */
export const SCREEN_READER_NAMES = ['JAWS', 'NVDA', 'VoiceOver', 'TalkBack', 'Narrator', 'ChromeVox', 'Orca'];

/**
 * What makes a sentence an accessibility sentence: the words that put "compliant" or "certified"
 * in scope. Outside this context the words are about something else (a license, a reseller) and
 * are left alone. A bare "508" and "Level A", "AA", or "AAA" count, so "508 compliant" and "Level
 * AA compliant" are claims even without the word WCAG.
 *
 * @type {RegExp}
 */
export const ACCESSIBILITY_CONTEXT =
  /accessib|wcag|\bada\b|section 508|\b508\b|\blevel a{1,3}\b|en 301 549|vpat|a11y|screen.reader|assistive/i;

/**
 * The standard's name, abbreviated or spelled out, as a regular expression source.
 *
 * @type {string}
 */
const WCAG_NAME = '(?:WCAG|Web Content Accessibility Guidelines)';

/**
 * The message the rules that catch a conformance claim share.
 *
 * @type {string}
 */
const CLAIMS_CONFORMANCE_MESSAGE =
  'claims conformance or compliance with WCAG; the approved wording is "targets WCAG 2.2 Level A and AA"';

/**
 * The rules. `pattern` runs per line, and again over each paragraph with its hard-wrapped lines
 * joined (see `joinWrappedLines()`); a rule with `context: true` fires only when the sentence around
 * the match, or the file's path, is about accessibility.
 *
 * @type {{id: string, pattern: RegExp, message: string, context?: boolean}[]}
 */
export const RULES = [
  {
    id: 'superseded-wcag-version',
    // The name and the version may be split by spaces, a hyphen, Markdown emphasis, `&nbsp;`, or
    // "v"/"version". `(?!\.?\d)` rejects 2.10 and 2.1.1 but keeps "WCAG 2.1." at a sentence end.
    pattern: new RegExp(`\\b${WCAG_NAME}(?:[\\s*_-]|&nbsp;)*(?:v(?:ersion)?\\s*)?2[.]?[01](?!\\.?\\d)`, 'gi'),
    message: 'names WCAG 2.0 or 2.1; the target is WCAG 2.2',
  },
  {
    id: 'meets-wcag',
    pattern: /\bmeets?\b[^.\n]{0,60}?\bWCAG\b/gi,
    message: 'says the grid "meets" WCAG; the approved wording is "targets WCAG 2.2 Level A and AA"',
  },
  {
    id: 'conformance-with-wcag',
    // "in conformance with WCAG", and the adjective after the name: "WCAG 2.2 AA compliant". A dot
    // inside a version number does not end the gap between the two.
    pattern: new RegExp([
      `\\b(?:in\\s+)?(?:conformance|compliance|compliant|conformant)\\s+(?:with|to)\\s+(?:the\\s+)?${WCAG_NAME}\\b`,
      '\\bWCAG\\b(?:[^.\\n]|\\.(?=\\d)){0,30}?\\b(?:conformant|compliant)\\b',
    ].join('|'), 'gi'),
    message: CLAIMS_CONFORMANCE_MESSAGE,
  },
  {
    id: 'claims-conformance',
    // The verbs: "conforms to WCAG", "complies with the WCAG", "adheres to WCAG". No row of the
    // conformance report's criteria tables uses one, so every verb stays in the pattern.
    pattern: new RegExp(
      `\\b(?:conforms?|complies|comply|adheres?|adhering)\\s+(?:to|with)\\s+(?:the\\s+)?${WCAG_NAME}\\b`, 'gi'),
    message: CLAIMS_CONFORMANCE_MESSAGE,
  },
  {
    id: 'compliant',
    pattern: /\b(?:compliant|compliance)\b/gi,
    message: 'says compliant or compliance in an accessibility sentence; say "targets" and link the report',
    context: true,
  },
  {
    id: 'certified',
    pattern: /\bcertif(?:ied|ication|icate)\b/gi,
    message: 'says certified in an accessibility sentence; no certification exists, link the report',
    context: true,
  },
];

/**
 * Paths, relative to the repository root, whose text is historical and keeps its wording: a
 * changelog entry or a version highlight describes what a release said at the time. The data file
 * itself is listed because it records which screen readers were not tested, by name; its text is
 * scanned through the values it renders instead (`scanAccessibilityData()`).
 *
 * @type {string[]}
 */
export const ALLOWLIST = [
  'docs/content/guides/upgrade-and-migration/changelog',
  'docs/content/guides/upgrade-and-migration/migrating-from-',
  'docs/content/data/version-highlights/',
  'docs/content/data/accessibility.json',
];

/**
 * Whether a repo-relative path is allowlisted.
 *
 * @param {string} file The path, with forward slashes.
 * @returns {boolean} `true` when a prefix matches.
 */
export function isAllowlisted(file) {
  return ALLOWLIST.some(prefix => file.startsWith(prefix));
}

/**
 * The sentence around an index in a line: the text between the nearest sentence boundaries.
 *
 * @param {string} line One line of text.
 * @param {number} index Where the match starts.
 * @returns {string} The sentence.
 */
function sentenceAround(line, index) {
  const before = line.slice(0, index);
  const after = line.slice(index);
  const start = Math.max(before.lastIndexOf('. '), before.lastIndexOf('; '), before.lastIndexOf(' - ')) + 1;
  const endMatch = /[.;](\s|$)/.exec(after);
  const end = index + (endMatch ? endMatch.index + 1 : after.length);

  return line.slice(start, end);
}

/**
 * Joins the hard-wrapped lines of a text, so a claim split across lines (a JSDoc block, a wrapped
 * Markdown paragraph) is matched as one phrase. A line break with the indentation and the JSDoc star
 * around it becomes one space; a blank line is a paragraph break and stays a line break, so a match
 * never spans two paragraphs.
 *
 * @param {string} text The text.
 * @returns {{joined: string, lineAt: (index: number) => number}} The joined text, and the original
 *   1-based line of an index in it.
 */
export function joinWrappedLines(text) {
  const pieces = [];
  const starts = [0];
  const lines = [1];
  let line = 1;
  let last = 0;
  let length = 0;

  for (const m of text.matchAll(/(?:\r?\n[ \t]*\*?[ \t]*)+/g)) {
    const piece = text.slice(last, m.index);
    const breaks = m[0].split('\n').length - 1;
    const separator = breaks > 1 ? '\n' : ' ';

    pieces.push(piece, separator);
    length += piece.length + separator.length;
    line += breaks;
    last = m.index + m[0].length;
    starts.push(length);
    lines.push(line);
  }
  pieces.push(text.slice(last));

  const lineAt = (index) => {
    let low = 0;
    let high = starts.length - 1;

    while (low < high) {
      const mid = Math.ceil((low + high) / 2);

      if (starts[mid] <= index) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }

    return lines[low];
  };

  return { joined: pieces.join(''), lineAt };
}

/**
 * Runs the rules over one segment of text: a line, or a paragraph of the joined text.
 *
 * @param {string} segment The text.
 * @param {(index: number) => number} lineAt The original line of an index in the segment.
 * @param {object} options The scan options.
 * @param {string} options.file The repo-relative path, for the report.
 * @param {boolean} options.pathIsAccessibility Whether the path alone puts every sentence in context.
 * @returns {{file: string, line: number, rule: string, match: string, message: string}[]} The findings.
 */
function scanSegment(segment, lineAt, { file, pathIsAccessibility }) {
  const findings = [];

  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    let m = rule.pattern.exec(segment);

    while (m !== null) {
      const inContext = !rule.context || pathIsAccessibility ||
        ACCESSIBILITY_CONTEXT.test(sentenceAround(segment, m.index));

      if (inContext) {
        findings.push({ file, line: lineAt(m.index), rule: rule.id, match: m[0], message: rule.message });
      }
      m = rule.pattern.exec(segment);
    }
  }

  return findings;
}

/**
 * Scans one text for claims the data file does not back. The rules run twice: per line, and per
 * paragraph with the hard-wrapped lines joined, which catches a phrase such as " * meets\n * WCAG
 * 2.1". A finding of the second pass is reported at the line its match starts on, and dropped when
 * the first pass already reported the same rule, line, and match.
 *
 * @param {string} text The file's text.
 * @param {object} options The scan options.
 * @param {string} options.file The repo-relative path, for the report and for the path context.
 * @param {string[]} options.allowedScreenReaders The names the matrix lists as tested.
 * @returns {{file: string, line: number, rule: string, match: string, message: string}[]} The findings.
 */
export function scanText(text, { file, allowedScreenReaders }) {
  const findings = [];
  const allowed = new Set(allowedScreenReaders.map(name => name.toLowerCase()));
  const options = { file, pathIsAccessibility: /accessib|a11y/i.test(file) };
  const screenReaderRule = new RegExp(`\\b(${SCREEN_READER_NAMES.join('|')})\\b`, 'gi');

  text.split('\n').forEach((line, i) => {
    findings.push(...scanSegment(line, () => i + 1, options));

    // A screen reader's name is one word, so the joined pass below cannot find one this pass missed.
    screenReaderRule.lastIndex = 0;
    let m = screenReaderRule.exec(line);

    while (m !== null) {
      if (!allowed.has(m[1].toLowerCase())) {
        findings.push({
          file,
          line: i + 1,
          rule: 'unlisted-screen-reader',
          match: m[0],
          message: `names ${m[1]}, which the tested matrix in docs/content/data/accessibility.json does not list` +
            ` (tested: ${allowedScreenReaders.join(', ')})`,
        });
      }
      m = screenReaderRule.exec(line);
    }
  });

  const seen = new Set(findings.map(f => `${f.rule}\n${f.line}\n${f.match}`));
  const { joined, lineAt } = joinWrappedLines(text);
  let offset = 0;

  for (const paragraph of joined.split('\n')) {
    const paragraphStart = offset;

    for (const finding of scanSegment(paragraph, index => lineAt(paragraphStart + index), options)) {
      const key = `${finding.rule}\n${finding.line}\n${finding.match}`;

      if (!seen.has(key)) {
        seen.add(key);
        findings.push(finding);
      }
    }
    offset += paragraph.length + 1;
  }

  return findings;
}

/**
 * Scans the data file's own text: every value it renders through the `{{$a11y.<key>}}` variables
 * and every known limitation's text. The file is allowlisted, because its matrix names the screen
 * readers that were not tested, and the pages carry only placeholders, so without this pass a claim
 * written into the data file would reach every page unchecked. A finding names the key, as
 * `docs/content/data/accessibility.json#<key>`.
 *
 * @param {object} data The validated data.
 * @returns {{file: string, line: number, rule: string, match: string, message: string}[]} The findings.
 */
export function scanAccessibilityData(data) {
  const allowedScreenReaders = allowedScreenReaderNames(data);
  const texts = [
    ...Object.entries(accessibilityTemplateValues(data)),
    ...data.knownLimitations.map((limitation, i) => [`knownLimitations[${i}].text`, limitation.text]),
  ];

  return texts.flatMap(([key, text]) => scanText(text, {
    file: `docs/content/data/accessibility.json#${key}`,
    allowedScreenReaders,
  }));
}

/**
 * Walks a directory, returning repo-relative paths with forward slashes.
 *
 * @param {string} dir The directory, relative to the root.
 * @param {(file: string) => boolean} keep Which files to keep.
 * @returns {string[]} The files.
 */
function walk(dir, keep) {
  const absolute = path.join(ROOT, dir);

  try {
    if (!statSync(absolute).isDirectory()) {
      return [];
    }
  } catch {
    return [];
  }

  return readdirSync(absolute, { recursive: true })
    .map(entry => `${dir}/${String(entry).split(path.sep).join('/')}`)
    .filter((file) => {
      try {
        return statSync(path.join(ROOT, file)).isFile() && keep(file);
      } catch {
        return false;
      }
    })
    .sort();
}

const TEST_FILE = /(?:^|\/)(?:__tests__|test|tests)\/|\.(?:spec|unit|types|d)\.[cm]?[jt]sx?$/;

/**
 * The docs content files: the pages and data files, and the example sources the pages embed, whose
 * comments and strings render on the page too.
 *
 * @type {RegExp}
 */
const DOCS_CONTENT_FILE = /\.(?:md|mdx|json|js|ts|tsx|jsx|vue|html)$/;

/**
 * The public text this check reads: the docs content (every page, recipe, and data file, and the
 * example sources the pages embed; the generated API reference is not content), the four published
 * READMEs, the core source whose JSDoc becomes the API reference, and the website strings export.
 *
 * @returns {string[]} Repo-relative paths.
 */
export function publicFiles() {
  return [
    ...walk('docs/content', file => DOCS_CONTENT_FILE.test(file) && !file.startsWith('docs/content/api/')),
    'README.md',
    'wrappers/react-wrapper/README.md',
    'wrappers/angular-wrapper/README.md',
    'wrappers/vue3/README.md',
    ...walk('handsontable/src', file => /\.(?:ts|js|mjs)$/.test(file) && !TEST_FILE.test(file)),
  ];
}

/**
 * Scans the repository: the public files, and the data file's own text (`scanAccessibilityData()`).
 *
 * @param {object} [options] The scan options.
 * @param {object} [options.data] The accessibility data; loaded from the committed file by default.
 * @param {string[]} [options.files] The files to scan; `publicFiles()` by default.
 * @returns {{file: string, line: number, rule: string, match: string, message: string}[]} The findings.
 */
export function scanRepository({ data = loadAccessibilityData(), files = publicFiles() } = {}) {
  const allowedScreenReaders = allowedScreenReaderNames(data);

  return [
    ...files
      .filter(file => !isAllowlisted(file))
      .flatMap(file => scanText(readFileSync(path.join(ROOT, file), 'utf8'), { file, allowedScreenReaders })),
    ...scanAccessibilityData(data),
  ];
}

/**
 * Formats findings for a terminal, grouped by file.
 *
 * @param {{file: string, line: number, rule: string, match: string, message: string}[]} findings The findings.
 * @returns {string} The report.
 */
export function formatFindings(findings) {
  const byFile = new Map();

  for (const finding of findings) {
    byFile.set(finding.file, [...(byFile.get(finding.file) ?? []), finding]);
  }

  return [...byFile].map(([file, list]) => [
    `${file} (${list.length})`,
    ...list.map(f => `  ${file}:${f.line}: [${f.rule}] "${f.match}" ${f.message}`),
  ].join('\n')).join('\n');
}

/**
 * The command-line gate.
 *
 * @returns {void}
 */
function main() {
  const findings = scanRepository();

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(findings, null, 2));
  } else if (findings.length === 0) {
    console.log('No public accessibility claim contradicts docs/content/data/accessibility.json.');
  } else {
    console.log(`${findings.length} accessibility claim(s) contradict docs/content/data/accessibility.json:\n`);
    console.log(formatFindings(findings));
  }

  process.exit(findings.length === 0 ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
