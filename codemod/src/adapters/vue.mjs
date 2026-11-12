import { parse as parseSfc } from '@vue/compiler-sfc';
import { CSS_PRECHECK, createCssPart, printCssPart } from './css.mjs';
import { JS_PRECHECK, createJsPart, printJsPart } from './js.mjs';

const SCRIPT_PARSERS = new Map([
  [undefined, 'babylon'],
  ['js', 'babylon'],
  ['jsx', 'babylon'],
  ['ts', 'ts'],
  ['tsx', 'tsx'],
]);

/**
 * The error `@vue/compiler-sfc` reports for a component that has only style blocks. Such a file is still
 * worth reading for its styles.
 */
const NO_SCRIPT_OR_TEMPLATE = /^At least one <template> or <script> is required/;

const MENTIONS = /--ht-|handsontable/i;
const STYLE_LANGS = new Set([undefined, 'css', 'postcss', 'scss']);
const TEMPLATE_LANGS = new Set([undefined, 'html']);

/**
 * Put the whitespace that surrounded the original block content around a printed text. A block starts with a
 * newline and ends with a newline plus indentation, and a printer may not keep either.
 *
 * @param {string} original Original block content.
 * @param {string} printed Printed block content.
 * @returns {string} The printed text with the original leading and trailing whitespace.
 */
function restoreEdges(original, printed) {
  const leading = /^\s*/.exec(original)[0];
  const trailing = /\s*$/.exec(original)[0];

  return leading + printed.trim() + trailing;
}

/**
 * Turn one SFC block into a part, or explain why it cannot be one.
 *
 * @param {object} block A block of the `@vue/compiler-sfc` descriptor.
 * @param {'script'|'style'|'template'} type Block type.
 * @param {string} filePath File path, for parser error messages.
 * @param {boolean} fileMentions Whether the whole file mentions Handsontable or a theme variable.
 * @returns {{part: object|null, skipped: {type: string, lang: string|null, line: number, src: boolean,
 * relevant: boolean}|null}} The part, or the description of a block the adapter does not handle. `relevant` is
 * `true` when the block's own text mentions Handsontable or a theme variable, or, for a `src=` block whose text
 * is not in the file, when the file does. Both are `null` for a block that cannot matter (empty, or without any
 * text a rule could match).
 */
function blockToPart(block, type, filePath, fileMentions) {
  const { lang, src, loc } = block;
  const skipped = {
    type,
    lang: lang ?? null,
    line: loc.start.line,
    src: Boolean(src),
    relevant: src ? fileMentions : MENTIONS.test(block.content),
  };
  const found = part => ({ part: { ...part, start: loc.start.offset, end: loc.end.offset }, skipped: null });

  if (src) {
    return { part: null, skipped };
  }

  if (block.content.trim() === '') {
    return { part: null, skipped: null };
  }

  const lineOffset = loc.start.line - 1;

  if (type === 'script') {
    if (!SCRIPT_PARSERS.has(lang)) {
      return { part: null, skipped };
    }

    return JS_PRECHECK.test(block.content)
      ? found(createJsPart(block.content, SCRIPT_PARSERS.get(lang), lineOffset))
      : { part: null, skipped: null };
  }

  if (type === 'style') {
    if (!STYLE_LANGS.has(lang)) {
      return { part: null, skipped };
    }

    return CSS_PRECHECK.test(block.content)
      ? found(createCssPart(block.content, filePath, lang === 'scss', lineOffset))
      : { part: null, skipped: null };
  }

  if (!TEMPLATE_LANGS.has(lang)) {
    return { part: null, skipped };
  }

  return found({
    fileKind: 'template',
    source: block.content,
    root: { content: block.content },
    j: null,
    lineOffset,
    changed: false,
  });
}

/**
 * Adapter for Vue single-file components. `parse` splits the file with `@vue/compiler-sfc` into independent
 * parts, in source order:
 *
 * - one `js` part per `<script>` and `<script setup>` block, with a jscodeshift `j` bound to the parser for
 *   the block's `lang` (`ts`, `tsx`, otherwise `babylon`);
 * - one `css` part per `<style>` block whose `lang` is `css` (the default), `postcss`, or `scss`;
 * - one `template` part for the `<template>` block, whose `root` is `{ content }`. No transform edits a
 *   template yet. A transform that does assigns the new text to `root.content` and calls `markChanged()`.
 *
 * Every part keeps `start` and `end`, the offsets of the block content in the file, and `lineOffset`, the
 * zero-based line where the content starts. The content starts right after the opening tag, so line 1 of a
 * part is the line of the tag and the first line of code is line 2.
 *
 * A block the adapter cannot handle (`lang="less"`, `lang="stylus"`, `lang="sass"`, or any `src=` block) gets
 * no part. `handle.skippedBlocks` lists them as `{ type, lang, line, src, relevant }`, and the runner reports each
 * `relevant` one as a `skipped-file` warning. A script or style block whose text carries nothing a rule could
 * match gets no part either, which keeps parsing cost down. The template part is never parsed.
 *
 * `print` splices the printed text of every changed part into the original file, last to first, and keeps
 * every other byte, including the template and the whitespace around each block's content.
 *
 * @type {import('../types.mjs').Adapter}
 */
const vueAdapter = {
  fileKind: 'vue',
  fileKinds: ['vue', 'js', 'css', 'template'],
  extensions: ['.vue'],
  implemented: true,
  precheck: /handsontable|--ht-/i,

  /**
   * @param {string} source File text.
   * @param {string} filePath File path, used for parser error messages.
   * @returns {import('../types.mjs').ParseHandle} Handle with the parts and the `skippedBlocks`.
   * @throws {Error} When the SFC syntax is invalid or a block does not parse.
   */
  parse(source, filePath) {
    const { descriptor, errors: allErrors } = parseSfc(source, { filename: filePath });
    const errors = allErrors.filter(error => !NO_SCRIPT_OR_TEMPLATE.test(error.message));

    if (errors.length > 0) {
      const error = new Error(errors[0].message);

      error.line = errors[0].loc?.start?.line;
      throw error;
    }

    const blocks = [
      ...[descriptor.script, descriptor.scriptSetup].filter(Boolean).map(block => [block, 'script']),
      ...descriptor.styles.map(block => [block, 'style']),
      ...(descriptor.template ? [[descriptor.template, 'template']] : []),
    ];
    const parts = [];
    const skippedBlocks = [];

    for (const [block, type] of blocks) {
      const { part, skipped } = blockToPart(block, type, filePath, MENTIONS.test(source));

      if (part) {
        parts.push(part);
      }

      if (skipped) {
        skippedBlocks.push(skipped);
      }
    }

    parts.sort((a, b) => a.start - b.start);
    skippedBlocks.sort((a, b) => a.line - b.line);

    return { parts, skippedBlocks };
  },

  /**
   * @param {import('../types.mjs').ParseHandle} handle Handle from `parse`.
   * @param {string} source Original file text.
   * @returns {string} Printed file.
   */
  print(handle, source) {
    const changed = handle.parts.filter(part => part.changed).sort((a, b) => b.start - a.start);
    let output = source;

    for (const part of changed) {
      let printed;

      if (part.fileKind === 'js') {
        printed = restoreEdges(part.source, printJsPart(part, part.source));
      } else if (part.fileKind === 'css') {
        printed = restoreEdges(part.source, printCssPart(part));
      } else {
        printed = part.root.content;
      }

      output = output.slice(0, part.start) + printed + output.slice(part.end);
    }

    return output;
  },
};

export default vueAdapter;
