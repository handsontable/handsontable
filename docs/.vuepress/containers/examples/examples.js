/**
 * Matches into: `example #ID .class :preset --html 0 --js 1 --hidden`.
 *
 * @type {RegExp}
 */
const EXAMPLE_REGEX = /^(example)\s*(#\S*|)\s*(\.\S*|)\s*(:\S*|)\s*([\S|\s]*)$/;

const { buildCode } = require('./code-builder');
const { jsfiddle } = require('./jsfiddle');

module.exports = {
  type: 'example',
  render(tokens, index, opts, env) {
    const token = tokens[index];
    const m = token.info.trim().match(EXAMPLE_REGEX);
    const version = env.relativePath.split('/')[0];

    if (token.nesting === 1 && m) { // open preview
      let [, , id, klass, preset, args] = m;
      id = id ? id.substring(1) : 'example1';
      klass = klass ? klass.substring(1) : '';
      preset = preset ? preset.substring(1) : 'hot';
      args = args || '';

      const htmlPos = args.match(/--html (\d*)/)?.[1];
      const tokenHtml = htmlPos ? tokens[index + Number.parseInt(htmlPos, 10)] : undefined;
      const contentHtml = tokenHtml
        ? tokenHtml.content
        : `<div id="${id}" className="hot ${klass}"></div>`;

      const jsPos = args.match(/--js (\d*)/)?.[1] || 1;
      const tokenJs = tokens[index + Number.parseInt(jsPos, 10)];
      const contentJs = tokenJs.content;

      const hidden = !!args.match(/--hidden/);

      const code = buildCode(id + (preset.includes('angular') ? '.ts' : '.jsx'), contentJs, env.relativePath);

      return `
    <div v-pre>${contentHtml}</div>
    <script data-jsfiddle="${id}" v-pre>
        useHandsontable('${version}', function(){${code}}, '${preset}');
    </script>
    <div class="codeLayout ${hidden ? 'hidden' : ''}">
        ${jsfiddle(id, contentHtml, contentJs, version, preset)}
`;
    } else { // close preview
      return '</div>\n';
    }
  }
};
