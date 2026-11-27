import { extname } from 'node:path';
import { parse as parseSfc } from '@vue/compiler-sfc';
import postcss from 'postcss';
import postcssScss from 'postcss-scss';
import { blankCodeComments } from '../../src/lib/tool-comments.mjs';
import { parserOf } from './literals.mjs';

/**
 * A stylesheet without its comments, read with the parser that the tool uses (`//` is a comment in SCSS only, and a
 * `/* ... *\/` inside a string is not one).
 *
 * @param {string} text Stylesheet text.
 * @param {boolean} scss Whether the syntax is SCSS.
 * @returns {string} The text without comments, or the text itself when it does not parse.
 */
function withoutStyleComments(text, scss) {
  try {
    const root = (scss ? postcssScss : postcss).parse(text);

    root.walkComments(comment => comment.remove());

    return root.toString();
  } catch {
    return text;
  }
}

/**
 * The code of a text: no comment and no white space. A comment can move when a TODO lands next to it, and a TODO
 * is the one thing a rule that is not safe may add.
 *
 * The comments are found the way the language reads them, never by looking for `//` in the text: `'http://x'` and
 * `"/* y *\/"` hold the characters of a comment and are code. A script is read with the parser the tool uses
 * (`blankCodeComments()`), a stylesheet with postcss, and a Vue file block by block. A text of another kind
 * (`package.json`, an HTML page) has no comment the tool writes, so it is compared as it is.
 *
 * @param {string} text File text.
 * @param {string} fileName The file name, which says the language.
 * @returns {string} The text without comments, with its white space.
 */
export function withoutComments(text, fileName) {
  const extension = extname(fileName).toLowerCase();
  let code = text;

  if (extension === '.vue') {
    const { descriptor } = parseSfc(text, { filename: fileName });

    code = [descriptor.script, descriptor.scriptSetup].filter(Boolean)
      .map(block => blankCodeComments(parserOf(`x.${block.lang ?? 'js'}`), block.content)).join('')
      + descriptor.styles.map(block => withoutStyleComments(block.content, block.lang === 'scss')).join('')
      + (descriptor.template?.content ?? '');
  } else if (['.css', '.scss'].includes(extension)) {
    code = withoutStyleComments(text, extension === '.scss');
  } else if (/^\.[cm]?[jt]sx?$/.test(extension)) {
    code = blankCodeComments(parserOf(fileName), text);
  }

  return code;
}

