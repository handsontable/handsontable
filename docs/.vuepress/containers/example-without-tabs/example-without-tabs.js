/**
 * Matches into: `example-without-tabs #ID :preset`.
 *
 * @type {RegExp}
 */
const EXAMPLE_REGEX = /^(example-without-tabs)\s*(#\S*|)\s*(:\S*|)\s*([\S|\s]*)$/;

const { buildCode } = require('../examples/code-builder');

const getPreview = (cssContent, htmlContent, code) => {
  return {
    type: 'html_block',
    tag: '',
    attrs: null,
    map: [],
    nesting: 0,
    level: 1,
    children: null,
    content: `
       <div>
         <style v-pre>${cssContent}</style>
         <div v-pre>${htmlContent}</div>
         <ScriptLoader code="${code}"></ScriptLoader>
       </div>
     `,
    markup: '',
    info: '',
    meta: null,
    block: true,
    hidden: false
  };
};

module.exports = function(docsVersion, base) {
  return {
    type: 'example-without-tabs',
    render(tokens, index, opts, env) {
      const token = tokens[index];
      const m = token.info.trim().match(EXAMPLE_REGEX);

      if (token.nesting === 1 && m) { // open preview
        let [, , id, preset] = m;

        id = id ? id.substring(1) : 'example1';
        preset = preset ? preset.substring(1) : 'hot';

        const htmlIndex = index + 1;
        const htmlToken = tokens[htmlIndex];
        const htmlContent = htmlToken.content;
        const htmlContentRoot = `<div data-preset-type="${preset}" data-example-id="${id}" >${htmlContent}</div>`;

        const cssIndex = index + 2;
        const cssToken = tokens[cssIndex];
        const cssContent = cssToken.content;

        const jsIndex = index + 3;
        const jsToken = tokens[jsIndex];

        jsToken.content = jsToken.content.replaceAll('{{$basePath}}', base);

        const codeToCompile = jsToken.content
        // Remove the all "/* start:skip-in-preview */" and "/* end:skip-in-preview */" comments
          .replace(/\/\*(\s+)?(start|end):skip-in-preview(\s+)?\*\/\n/gm, '')
        // Remove the code between "/* start:skip-in-compilation */" and "/* end:skip-in-compilation */" expressions
        // eslint-disable-next-line max-len
          .replace(/\/\*(\s+)?start:skip-in-compilation(\s+)?\*\/\n.*?\/\*(\s+)?end:skip-in-compilation(\s+)?\*\/\n/msg, '');

        const code = buildCode(id + (preset.includes('angular') ? '.ts' : '.jsx'), codeToCompile, env.relativePath);
        const encodedCode = encodeURI(`useHandsontable('${docsVersion}', function(){${code}}, '${preset}')`);

        [htmlIndex, jsIndex, cssIndex].filter(x => !!x).sort().reverse().forEach((x) => {
          // remove actual snippets from rendering
          tokens.splice(x, 1);
        });

        const newTokens = [
          getPreview(cssContent, htmlContentRoot, encodedCode),
        ];

        tokens.splice(index + 1, 0, ...newTokens);

        return '';
      } else { // close preview
        return '';
      }
    }
  };
};
