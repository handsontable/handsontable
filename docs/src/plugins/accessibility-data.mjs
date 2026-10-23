/**
 * The accessibility single source of truth: `docs/content/data/accessibility.json`.
 *
 * Every public accessibility claim - the target, the conformance report's version and date, the
 * screen readers and browsers that were tested, the known limitations - is written once, in that
 * file, and rendered from here. Three consumers read the renders:
 *
 * - the docs pages, through the `{{$a11y.<key>}}` template variables that
 *   `template-variables.mjs` resolves from `accessibilityTemplateValues()`;
 * - the website strings export (`docs/scripts/export-accessibility-strings.mjs`), a generated JSON
 *   the handsontable.com repository copies, built by `websiteStrings()`;
 * - the claims check (`scripts/accessibility-claims.mjs`), which reads the matrix to decide which
 *   screen-reader names public text may use, and which asserts the README sentence.
 *
 * The file's shape is documented in `docs/AGENTS.md`, section 2.20. `validateAccessibilityData()`
 * is the machine-readable half of that section: a field it rejects cannot reach any consumer.
 *
 * Pure node, no dependencies: the root `test:tooling` suite imports this module too.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Where the data lives, next to `version-highlights/`.
 */
export const ACCESSIBILITY_DATA_FILE = resolve(__dirname, '../../content/data/accessibility.json');

/**
 * How a matrix entry was tested, and the label each value renders as. `audit` renders with the
 * auditor and the period from `report.audit`, so its label here is a template.
 *
 * @type {Record<string, string>}
 */
export const HOW_TESTED = {
  audit: 'External audit ({auditor}, {period})',
  'automated-nightly': 'Automated nightly run',
  'manual-per-major': 'Manual check once per major release',
  'not-tested': 'Not tested',
};

/**
 * Checks the shape of the data. Every consumer calls `loadAccessibilityData()`, which throws on
 * the first error, so a field that goes missing fails the docs build and the tooling suite with the
 * field's name rather than an `undefined` in a rendered page.
 *
 * @param {object} data The parsed JSON.
 * @returns {string[]} The errors found, empty when the data is valid.
 */
export function validateAccessibilityData(data) {
  const errors = [];
  const need = (value, path, type = 'string') => {
    let ok;

    if (type === 'array') {
      ok = Array.isArray(value);
    } else if (type === 'object') {
      // `typeof null` and `typeof []` are both 'object': neither holds the fields read next.
      ok = typeof value === 'object' && value !== null && !Array.isArray(value);
    } else {
      ok = typeof value === type && value !== '';
    }

    if (!ok) {
      errors.push(`${path} must be a non-empty ${type}`);
    }

    return ok;
  };

  if (!data || typeof data !== 'object') {
    return ['the data must be an object'];
  }

  const { target, report, matrix, browsers, knownLimitations, notes } = data;

  if (need(target, 'target', 'object')) {
    need(target.standard, 'target.standard');
    need(target.version, 'target.version');
    need(target.level, 'target.level');
    need(target.url, 'target.url');

    if (need(target.wording, 'target.wording', 'object')) {
      need(target.wording.long, 'target.wording.long');
      need(target.wording.short, 'target.wording.short');

      for (const [key, wording] of Object.entries(target.wording)) {
        if (typeof wording === 'string' && !/^targets\b/.test(wording)) {
          errors.push(`target.wording.${key} must start with "targets" - the approved public wording ` +
            'never says meets, compliant, or certified');
        }
      }
    }
  }

  if (need(report, 'report', 'object')) {
    for (const key of ['title', 'version', 'date', 'slug', 'url', 'docsPath', 'template']) {
      need(report[key], `report.${key}`);
    }

    if (report.evaluatedProductVersion !== null) {
      need(report.evaluatedProductVersion,
        'report.evaluatedProductVersion (a string, or null when the report does not state it)');
    }

    if (need(report.audit, 'report.audit', 'object')) {
      need(report.audit.auditor, 'report.audit.auditor');
      need(report.audit.period, 'report.audit.period');
      need(report.audit.coverage, 'report.audit.coverage');
    }

    const nextPath = 'report.next (an object, or null when no next version is planned)';

    if (report.next !== null && need(report.next, nextPath, 'object')) {
      need(report.next.version, 'report.next.version');
      need(report.next.status, 'report.next.status');
      need(report.next.scope, 'report.next.scope');
    }
  }

  if (need(matrix, 'matrix', 'array')) {
    matrix.forEach((entry, i) => {
      need(entry.name, `matrix[${i}].name`);
      need(entry.platform, `matrix[${i}].platform`);

      // A tested entry renders its version; only an entry recorded as not tested may leave it null.
      const notTested = Array.isArray(entry.howTested) && entry.howTested.includes('not-tested');

      if (!notTested || entry.version !== null) {
        need(entry.version, `matrix[${i}].version (a string; null only when howTested is not-tested)`);
      }

      if (need(entry.howTested, `matrix[${i}].howTested`, 'array')) {
        if (entry.howTested.length === 0) {
          errors.push(`matrix[${i}].howTested must name at least one value`);
        }

        for (const how of entry.howTested) {
          if (!Object.hasOwn(HOW_TESTED, how)) {
            errors.push(`matrix[${i}].howTested has "${how}"; the values are ${Object.keys(HOW_TESTED).join(', ')}`);
          }
        }

        if (entry.howTested.includes('not-tested') && entry.howTested.length > 1) {
          errors.push(`matrix[${i}].howTested cannot combine not-tested with another value`);
        }
      }
    });
  }

  if (need(browsers, 'browsers', 'array')) {
    browsers.forEach((browser, i) => {
      need(browser.name, `browsers[${i}].name`);
      need(browser.version, `browsers[${i}].version`);
    });
  }

  if (need(knownLimitations, 'knownLimitations', 'array')) {
    const ids = new Set();

    knownLimitations.forEach((limitation, i) => {
      need(limitation.id, `knownLimitations[${i}].id`);
      need(limitation.text, `knownLimitations[${i}].text`);
      need(limitation.criteria, `knownLimitations[${i}].criteria`, 'array');

      if (limitation.reportRef !== null) {
        need(limitation.reportRef, `knownLimitations[${i}].reportRef (a string, or null)`);
      }

      if (ids.has(limitation.id)) {
        errors.push(`knownLimitations has the id "${limitation.id}" twice`);
      }
      ids.add(limitation.id);
    });
  }

  if (need(notes, 'notes', 'object')) {
    need(notes.mobile, 'notes.mobile');
    need(notes.automation, 'notes.automation');
  }

  return errors;
}

/**
 * Reads and validates the data file.
 *
 * @param {string} [file] The file to read; defaults to the committed one.
 * @returns {object} The validated data.
 */
export function loadAccessibilityData(file = ACCESSIBILITY_DATA_FILE) {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const errors = validateAccessibilityData(data);

  if (errors.length > 0) {
    throw new Error(`${file} is not valid:\n  - ${errors.join('\n  - ')}`);
  }

  return data;
}

/**
 * Joins items into a sentence list with the Oxford comma: `a`, `a and b`, `a, b, and c`.
 *
 * @param {string[]} items The items.
 * @returns {string} The list.
 */
export function joinList(items) {
  if (items.length <= 1) {
    return items.join('');
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

/**
 * The matrix entries that were tested at all: the screen readers public text may name.
 *
 * @param {object} data The validated data.
 * @returns {object[]} The entries whose `howTested` is not `not-tested`.
 */
export function testedScreenReaders(data) {
  return data.matrix.filter(entry => !entry.howTested.includes('not-tested'));
}

/**
 * The unique names of the tested screen readers, in matrix order.
 *
 * @param {object} data The validated data.
 * @returns {string[]} The names.
 */
export function allowedScreenReaderNames(data) {
  return [...new Set(testedScreenReaders(data).map(entry => entry.name))];
}

/**
 * The names the matrix records as not tested: public text must not name them.
 *
 * @param {object} data The validated data.
 * @returns {string[]} The names.
 */
export function untestedScreenReaderNames(data) {
  const allowed = new Set(allowedScreenReaderNames(data));

  return [...new Set(data.matrix
    .filter(entry => entry.howTested.includes('not-tested') && !allowed.has(entry.name))
    .map(entry => entry.name))];
}

/**
 * The platform family of a matrix entry: `macOS 15.3.2` and `Windows 11` read as `macOS` and
 * `Windows` in a sentence.
 *
 * @param {string} platform The platform as written in the data.
 * @returns {string} Its first word.
 */
function platformFamily(platform) {
  return platform.split(/\s+/)[0];
}

/**
 * The tested screen readers as one sentence fragment: `VoiceOver (macOS and iOS) and NVDA (Windows)`.
 *
 * @param {object} data The validated data.
 * @returns {string} The fragment.
 */
export function screenReadersSentence(data) {
  const byName = new Map();

  for (const entry of testedScreenReaders(data)) {
    const platforms = byName.get(entry.name) ?? [];
    const family = platformFamily(entry.platform);

    if (!platforms.includes(family)) {
      platforms.push(family);
    }
    byName.set(entry.name, platforms);
  }

  return joinList([...byName].map(([name, platforms]) => `${name} (${joinList(platforms)})`));
}

/**
 * The tested browsers as one sentence fragment, by major version: `Chrome 141 and Firefox 143`.
 *
 * @param {object} data The validated data.
 * @returns {string} The fragment.
 */
export function browsersSentence(data) {
  return joinList(data.browsers.map(browser => `${browser.name} ${browser.version.split('.')[0]}`));
}

/**
 * The label for one `howTested` value, with the audit's auditor and period filled in.
 *
 * @param {object} data The validated data.
 * @param {string} how A `HOW_TESTED` key.
 * @returns {string} The label.
 */
export function howTestedLabel(data, how) {
  return HOW_TESTED[how]
    .replace('{auditor}', data.report.audit.auditor)
    .replace('{period}', data.report.audit.period);
}

/**
 * The tested screen readers as a Markdown table.
 *
 * @param {object} data The validated data.
 * @returns {string} The table.
 */
export function matrixTable(data) {
  const rows = testedScreenReaders(data).map(entry => [
    entry.name,
    entry.version,
    entry.platform,
    entry.howTested.map(how => howTestedLabel(data, how)).join('; '),
  ]);

  return [
    '| Screen reader | Version | Platform | How it was tested |',
    '| --- | --- | --- | --- |',
    ...rows.map(cells => `| ${cells.join(' | ')} |`),
  ].join('\n');
}

/**
 * The tested screen readers as a Markdown list, one line per entry.
 *
 * @param {object} data The validated data.
 * @returns {string} The list.
 */
export function matrixList(data) {
  const lowerFirst = text => text.charAt(0).toLowerCase() + text.slice(1);

  return testedScreenReaders(data)
    .map((entry) => {
      // VoiceOver's version is the OS version, so "VoiceOver on macOS 15.3.2" reads better than
      // "VoiceOver macOS 15.3.2 on macOS"; NVDA keeps "NVDA 2025.3 on Windows 11".
      const where = entry.version.startsWith(entry.platform) ? entry.version : `${entry.version} on ${entry.platform}`;
      const subject = entry.version.startsWith(entry.platform) ? `${entry.name} on ${where}` : `${entry.name} ${where}`;

      return `- ${subject}: ${entry.howTested.map(how => lowerFirst(howTestedLabel(data, how))).join('; ')}.`;
    })
    .join('\n');
}

/**
 * The tested browsers as a Markdown list with their full versions.
 *
 * @param {object} data The validated data.
 * @returns {string} The list.
 */
export function browsersList(data) {
  return data.browsers.map(browser => `- ${browser.name} ${browser.version}.`).join('\n');
}

/**
 * The known limitations as a Markdown list, each with its WCAG criteria and its reference in the
 * conformance report where one exists. `reportRef` is the report's own "Ref." column (`#2375`),
 * not a GitHub issue number, so it renders as "ref. #2375 in the report".
 *
 * @param {object} data The validated data.
 * @returns {string} The list.
 */
export function knownLimitationsList(data) {
  return data.knownLimitations.map((limitation) => {
    const details = [];

    if (limitation.criteria.length > 0) {
      details.push(`WCAG ${limitation.criteria.join(', ')}`);
    }
    if (limitation.reportRef) {
      details.push(`ref. ${limitation.reportRef} in the report`);
    }

    if (details.length === 0) {
      return `- ${limitation.text}`;
    }

    // The details sit inside the sentence: "... not announced (WCAG 4.1.3; ref. #2375 in the report)."
    const text = limitation.text.endsWith('.') ? limitation.text.slice(0, -1) : limitation.text;

    return `- ${text} (${details.join('; ')}).`;
  }).join('\n');
}

/**
 * Every `{{$a11y.<key>}}` value a docs page can use, as a flat map keyed by the dotted name. A page
 * that names a key missing here fails its build, so add a key here before using it in content.
 *
 * `report.next` may be `null` (no next version planned). The three `report.next.*` parts are then
 * empty, so a page composes the announcement from `report.next.sentence`, which is empty too,
 * rather than from the parts, which would render "Version  is : .".
 *
 * @param {object} data The validated data.
 * @returns {Record<string, string>} The values.
 */
export function accessibilityTemplateValues(data) {
  const { target, report, notes } = data;
  const targetName = `${target.standard} ${target.version}`;
  const next = report.next;

  return {
    'target.name': targetName,
    'target.level': target.level,
    'target.long': target.wording.long,
    'target.short': target.wording.short,
    'target.url': target.url,
    'target.link': `[${targetName} ${target.level}](${target.url})`,
    'report.title': report.title,
    'report.version': report.version,
    'report.date': report.date,
    'report.url': report.url,
    'report.docsPath': report.docsPath,
    'report.link': `[accessibility conformance report](${report.docsPath})`,
    'report.template': report.template,
    'report.evaluatedProductVersion': report.evaluatedProductVersion ?? `not stated in version ${report.version}`,
    'report.auditor': report.audit.auditor,
    'report.auditPeriod': report.audit.period,
    'report.auditCoverage': report.audit.coverage,
    'report.next.version': next ? next.version : '',
    'report.next.status': next ? next.status : '',
    'report.next.scope': next ? next.scope : '',
    'report.next.sentence': next ? `Version ${next.version} of this report is ${next.status}: ${next.scope}.` : '',
    'matrix.table': matrixTable(data),
    'matrix.list': matrixList(data),
    'matrix.sentence': screenReadersSentence(data),
    'matrix.names': joinList(allowedScreenReaderNames(data)),
    'browsers.sentence': browsersSentence(data),
    'browsers.list': browsersList(data),
    'knownLimitations.list': knownLimitationsList(data),
    'notes.mobile': notes.mobile,
    'notes.automation': notes.automation,
  };
}

/**
 * The strings the handsontable.com repository publishes. The website has no access to this
 * repository at build time, so `docs/scripts/export-accessibility-strings.mjs` writes this object
 * to `docs/content/data/accessibility-website-strings.json`, and the website keeps a copy of that
 * file. The root tooling suite fails when the committed export drifts from the data. The website
 * composes its sentences from the fields; `strings` holds only the chip and the trust card label.
 *
 * @param {object} data The validated data.
 * @returns {object} The export, ready to serialize.
 */
export function websiteStrings(data) {
  const { target, report } = data;
  const targetName = `${target.standard} ${target.version}`;

  return {
    $generated: 'Generated from docs/content/data/accessibility.json by ' +
      'docs/scripts/export-accessibility-strings.mjs. Do not edit: change the data file and run ' +
      '`npm run docs:export-accessibility-strings --prefix docs`.',
    target: {
      name: targetName,
      level: target.level,
      url: target.url,
      wording: { ...target.wording },
    },
    report: {
      title: report.title,
      version: report.version,
      date: report.date,
      url: report.url,
      evaluatedProductVersion: report.evaluatedProductVersion,
    },
    screenReaders: {
      names: allowedScreenReaderNames(data),
      sentence: screenReadersSentence(data),
    },
    browsers: {
      sentence: browsersSentence(data),
    },
    strings: {
      chip: `Targets ${targetName} ${target.level.replace('Level ', '').replace('A and AA', 'AA')}`,
      trustCardLabel: targetName,
    },
  };
}

/**
 * The website strings export as the text of the JSON file.
 *
 * @param {object} data The validated data.
 * @returns {string} The file content, with a trailing newline.
 */
export function websiteStringsJson(data) {
  return `${JSON.stringify(websiteStrings(data), null, 2)}\n`;
}
