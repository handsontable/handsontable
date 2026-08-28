/**
 * Configuration-option levels - pure parser and markdown builder.
 *
 * CommonJS on purpose, like `browser-targets.js`: the generator imports it as ESM
 * (Node's CJS interop) and the Jest unit test imports it through Babel. Publishing it as
 * `.mjs` instead would force a `transform` override in `jest.config.js`, and any such
 * override breaks `updateSettingsExternalDataSource.unit.js`.
 *
 * No filesystem and no paths live here, so both consumers can load it directly. The CLI
 * wrapper that reads and writes files is `scripts/generate-option-levels.mjs`.
 */

/**
 * The configuration levels, in cascade order. `cells` and `cell` both reach the cell
 * level; they are listed separately because they are different options to write.
 */
const LEVELS = ['grid', 'columns', 'cells', 'cell'];

/**
 * Extra explanation for options whose behavior a level mark alone would misrepresent.
 *
 * The `@configScope` tag stays levels-only so it can be parsed without prose, so these
 * caveats live here and reach the matrix page's Notes column. They do NOT reach the badge
 * in the Options API reference, which renders levels only - an option listed here reads as
 * a plain level list there. Moving the caveats into `metaSchema.ts` (a second tag the
 * badge could render) would close that gap.
 */
const NOTES = {
  width: 'Sets the grid width at the grid level and the column width inside `columns`. '
    + 'Only row 0 is read, so a `cells` or `cell` value must target row 0.',
  data: 'Sets the data set at the grid level and the column\'s data property inside `columns`.',
  title: 'Read from the raw `columns` setting rather than the meta chain, so a `cells` function cannot set it.',
  headerClassName: 'Applies to column headers, so it stops at the column level.',
  ariaTags: 'The switch is grid level. A per-cell value only changes that cell\'s ARIA attributes.',
  search: 'The plugin toggle is grid level. `queryMethod` and `callback` resolve per cell.',
  disableVisualSelection: 'Row and column headers read the grid-level value only, and so does the check '
    + 'that gates dragging a selection with `moveCells`.',
  cells: 'A grid-level function that is called for every cell.',
};

/**
 * Parses `metaSchema.ts` into one record per public option.
 *
 * @param {string} src The contents of metaSchema.ts.
 * @returns {{name: string, category: string, levels: string[], since: string|null}[]} Option records.
 */
function parseOptions(src) {
  // Options are declared either as `name: value` or as method shorthand `name(args) {}`
  // (`isEmptyRow` and `isEmptyCol`). Matching only the colon form silently merges a
  // method's doc block into the next option's, which misattributes every tag after it.
  const blockRe = /\/\*\*([\s\S]*?)\*\/\s*\n {4}([a-zA-Z_][a-zA-Z0-9_]*)\s*[:(]/g;
  const options = [];
  let match = blockRe.exec(src);

  for (; match !== null; match = blockRe.exec(src)) {
    const [, rawBlock, name] = match;
    const block = rawBlock.split('\n').map(line => line.replace(/^\s*\*\s?/, '')).join('\n');

    // Internal bookkeeping keys are not part of the public Options API.
    if (!/@memberof Options#/.test(block)) {
      continue;
    }

    const scope = (block.match(/@configScope\s+([^\n@]+)/) || [])[1];

    if (!scope) {
      throw new Error(`Option \`${name}\` has no @configScope tag in metaSchema.ts.`);
    }

    const levels = scope.trim().split(/\s+/);
    const unknown = levels.filter(level => !LEVELS.includes(level));

    if (unknown.length) {
      throw new Error(`Option \`${name}\` has unknown @configScope level(s): ${unknown.join(', ')}.`);
    }

    options.push({
      name,
      category: (block.match(/@category\s+(.+)/) || [])[1]?.trim() ?? 'Core',
      levels,
      since: (block.match(/@since\s+(.+)/) || [])[1]?.trim() ?? null,
    });
  }

  return options.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Builds the markdown injected between the marker comments on the guide page.
 *
 * The table is rendered statically so it works without JavaScript and stays indexable.
 * The search and filter controls on the page enhance this table in the browser.
 *
 * @param {object[]} options Option records from `parseOptions`.
 * @returns {string} The markdown block.
 */
function buildMarkdown(options) {
  const lines = [];

  lines.push('');
  lines.push('<div class="option-levels" data-option-levels>');
  lines.push('');
  lines.push('| Option | Grid | `columns` | `cells` | `cell` | Category | Notes |');
  lines.push('| ------ | :--: | :-------: | :-----: | :----: | -------- | ----- |');

  for (const option of options) {
    const marks = LEVELS.map(level => (option.levels.includes(level) ? 'Yes' : 'No'));
    const anchor = option.name.toLowerCase();
    // A pipe in a note would split the row into extra columns and misalign the table
    // from that row on, so escape it.
    const note = (NOTES[option.name] ?? '').split('|').join('\\|');
    // The row carries its own searchable name and level list so the page script can
    // filter without re-parsing the rendered markup.
    const levelAttr = option.levels.join(' ');

    lines.push(
      `| <span data-option="${option.name}" data-levels="${levelAttr}"></span>` +
      `[\`${option.name}\`](@/api/options.md#${anchor}) | ${marks.join(' | ')} | ${option.category} | ${note} |`
    );
  }

  lines.push('');
  lines.push('</div>');
  lines.push('');

  return lines.join('\n');
}

/**
 * Builds the machine-readable payload written next to the guide page.
 *
 * @param {object[]} options Option records from `parseOptions`.
 * @returns {object} The JSON payload.
 */
function buildPayload(options) {
  const counts = {};

  options.forEach((option) => {
    const key = option.levels.join(' ');

    counts[key] = (counts[key] ?? 0) + 1;
  });

  return {
    generatedFrom: 'handsontable/src/dataMap/metaManager/metaSchema.ts',
    levels: LEVELS,
    total: options.length,
    counts,
    options: options.map(option => ({ ...option, note: NOTES[option.name] ?? null })),
  };
}

exports.LEVELS = LEVELS;
exports.parseOptions = parseOptions;
exports.buildMarkdown = buildMarkdown;
exports.buildPayload = buildPayload;
