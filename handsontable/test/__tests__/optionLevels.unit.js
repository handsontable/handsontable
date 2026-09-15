import { readFileSync } from 'fs';
import { resolve } from 'path';

import { LEVELS, parseOptions, buildMarkdown } from '../../scripts/utils/option-levels';

/**
 * The configuration-option levels matrix has three parts that can drift apart:
 * the `@configScope` tags in `metaSchema.ts`, the generator that reads them, and the
 * table committed into the guide page. These tests pin all three together.
 *
 * `metaSchema.ts` is the single source of truth. Regenerate the page with
 * `npm run generate:option-levels --prefix handsontable` after changing a tag.
 */

const readRepoFile = relativePath => readFileSync(resolve(__dirname, '../../', relativePath), 'utf8');

const META_SCHEMA = 'src/dataMap/metaManager/metaSchema.ts';
const PAGE_MD = '../docs/content/guides/configuration/configuration-option-levels/'
  + 'configuration-option-levels.md';
const JSON_OUT = '../docs/content/guides/configuration/configuration-option-levels/option-levels.json';

describe('configuration-option levels', () => {
  const schemaSource = readRepoFile(META_SCHEMA);
  const options = parseOptions(schemaSource);

  it('should declare at least one option', () => {
    expect(options.length).toBeGreaterThan(100);
  });

  it('should give every public option a @configScope tag', () => {
    // parseOptions throws on a missing tag, so reaching here already proves it. Assert the
    // count as well, so an option silently dropped from the parse is caught too.
    // `@private` options are excluded on purpose: jsdoc drops them from the API reference,
    // so listing one would link the matrix at an anchor that does not exist.
    // Count `@private` only inside blocks that declare an option; the file uses the tag
    // on non-option members too.
    const blocks = schemaSource.match(/\/\*\*[\s\S]*?\*\//g) ?? [];
    const optionBlocks = blocks.filter(block => /@memberof Options#/.test(block));
    const privateOptions = optionBlocks.filter(block => /^\s*\*\s*@private\s*$/m.test(block));

    expect(options.length).toBe(optionBlocks.length - privateOptions.length);
  });

  it('should leave `@private` options out of the matrix', () => {
    // `preventWheel` is the current case. A dead `@/api/options.md#...` link is invisible
    // until someone clicks it, so pin the rule rather than the single name.
    expect(options.find(o => o.name === 'preventWheel')).toBeUndefined();
  });

  it('should only use known levels, in cascade order', () => {
    options.forEach(({ levels }) => {
      expect(levels.length).toBeGreaterThan(0);
      levels.forEach(level => expect(LEVELS).toContain(level));

      const ordered = LEVELS.filter(level => levels.includes(level));

      expect(levels).toEqual(ordered);
    });
  });

  it('should let every option be set at the grid level, except the `columns`-only ones', () => {
    // Nothing but `title` is read from the raw `columns` setting, so every other option
    // resolves through the cascade and therefore also works when set for the whole grid.
    options
      .filter(({ levels }) => !levels.includes('grid'))
      .forEach(({ name }) => expect(name).toBe('title'));
  });

  it('should never skip a level in the middle of the cascade', () => {
    // A `cells` value reaches a cell the same way a `cell` value does, so an option that
    // works at one works at the other. `columns` sits above both.
    options.forEach(({ name, levels }) => {
      if (levels.includes('cells') || levels.includes('cell')) {
        expect([name, levels.includes('cells')]).toEqual([name, true]);
        expect([name, levels.includes('cell')]).toEqual([name, true]);
        expect([name, levels.includes('columns')]).toEqual([name, true]);
      }
    });
  });

  it('should keep `label` set to every level', () => {
    // Regression guard: `label` carried no scope statement for years, but the checkbox
    // renderer reads it from the cell meta, so it works at every level.
    expect(options.find(o => o.name === 'label').levels).toEqual(['grid', 'columns', 'cells', 'cell']);
  });

  it('should keep `title` at the `columns` level only', () => {
    // `getColHeader` reads `title` off the raw `columns` setting, never the meta chain.
    expect(options.find(o => o.name === 'title').levels).toEqual(['columns']);
  });

  it('should keep the committed guide page in sync with the generator', () => {
    const page = readRepoFile(PAGE_MD);
    const start = page.indexOf('<!-- option-levels:start -->');
    const end = page.indexOf('<!-- option-levels:end -->');

    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);

    const committed = page.slice(start + '<!-- option-levels:start -->'.length, end).trim();

    expect(committed).toBe(buildMarkdown(options).trim());
  });

  it('should keep the committed JSON in sync with the schema', () => {
    const payload = JSON.parse(readRepoFile(JSON_OUT));

    expect(payload.total).toBe(options.length);
    expect(payload.levels).toEqual(LEVELS);
    expect(payload.options.map(o => o.name)).toEqual(options.map(o => o.name));
    expect(payload.options.map(o => o.levels)).toEqual(options.map(o => o.levels));
  });
});
