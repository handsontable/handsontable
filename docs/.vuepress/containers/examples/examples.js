/**
 * Matches into: `example #ID .class :preset --css 2 --html 0 --js 1 --hidden`.
 *
 * @type {RegExp}
 */
const EXAMPLE_REGEX = /^(example)\s*(#\S*|)\s*(\.\S*|)\s*(:\S*|)\s*([\S|\s]*)$/;

const { buildCode } = require('./code-builder');
const { jsfiddle } = require('./jsfiddle');

const tab = (tabName, token) => {
  if (!token) return [];

  return [
    {
      type: 'html_block',
      tag: '',
      attrs: null,
      map: [],
      nesting: 0,
      level: 1,
      children: null,
      content: `<tab name="${tabName}">`,
      markup: '',
      info: '',
      meta: null,
      block: true,
      hidden: false
    },
    token,
    {
      type: 'html_block',
      tag: '',
      attrs: null,
      map: [],
      nesting: 0,
      level: 1,
      children: null,
      content: '</tab>',
      markup: '',
      info: '',
      meta: null,
      block: true,
      hidden: false
    }
  ];
};

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
      const htmlIndex = htmlPos ? index + Number.parseInt(htmlPos, 10) : 0;
      const htmlToken = htmlPos ? tokens[htmlIndex] : undefined;
      const htmlContent = htmlToken
        ? htmlToken.content
        : `<div id="${id}" className="hot ${klass}"></div>`;

      const cssPos = args.match(/--css (\d*)/)?.[1];
      const cssIndex = cssPos ? index + Number.parseInt(cssPos, 10) : 0;
      const cssToken = cssPos ? tokens[cssIndex] : undefined;
      const cssContent = cssToken ? cssToken.content : '';

      const jsPos = args.match(/--js (\d*)/)?.[1] || 1;
      const jsIndex = index + Number.parseInt(jsPos, 10);
      const jsToken = tokens[jsIndex];
      const jsContent = jsToken.content;

      const hidden = !!args.match(/--hidden/);

      const code = buildCode(id + (preset.includes('angular') ? '.ts' : '.jsx'), jsContent, env.relativePath);

      [htmlIndex, jsIndex, cssIndex].filter(x => !!x).sort().reverse().forEach((x) => {
        tokens.splice(x, 1);
      });

      const newTokens = [
        ...tab('HTML', htmlToken),
        ...tab('Code', jsToken),
        ...tab('CSS', cssToken),
      ];

      if (!hidden) {
        tokens.splice(index + 1, 0, ...newTokens);
      }

      return `
          ${jsfiddle(id, htmlContent, jsContent, cssContent, version, preset)}
          <tabs :options="{ useUrlFragment: false, defaultTabHash: 'code' }">
          <tab name="Preview">
              <style v-pre>${cssContent}</style>
              <div v-pre>${htmlContent}</div>
              <script data-jsfiddle="${id}" v-pre>
                  useHandsontable('${version}', function(){${code}}, '${preset}');
              </script>
          </tab>
        `;
    } else { // close preview
      return '</tabs>';
    }
  }
};
