/**
 * Matches into: `example #ID .class :preset --css 2 --html 0 --js 1 --no-edit`.
 *
 * @type {RegExp}
 */
const EXAMPLE_REGEX = /^(example)\s*(#\S*|)\s*(\.\S*|)\s*(:\S*|)\s*([\S|\s]*)$/;

const { buildCode } = require('./code-builder');
const { addCodeForPreset } = require('./add-code-for-preset');
const { codesandbox } = require('./codesandbox');
const { jsfiddle } = require('./jsfiddle');
const { stackblitz } = require('./stackblitz');

const tab = (tabName, token, id) => {
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
      content: `<tab id="${tabName.toLowerCase()}-tab-${id}" name="${tabName}">`,
      markup: '',
      info: '',
      meta: null,
      block: true,
      hidden: false,
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
      hidden: false,
    },
  ];
};

module.exports = function(docsVersion, base) {
  return {
    type: 'example',
    render(tokens, index, opts, env) {
      const token = tokens[index];
      const m = token.info.trim().match(EXAMPLE_REGEX);

      if (token.nesting === 1 && m) {
        // open preview
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
          : `<div id="${id}" class="hot ${klass}"></div>`;
        const htmlContentRoot = `<div data-preset-type="${preset}" data-example-id="${id}" >${htmlContent}</div>`;

        const cssPos = args.match(/--css (\d*)/)?.[1];
        const cssIndex = cssPos ? index + Number.parseInt(cssPos, 10) : 0;
        const cssToken = cssPos ? tokens[cssIndex] : undefined;
        const cssContent = cssToken ? cssToken.content : '';

        const jsPos = args.match(/--js (\d*)/)?.[1] || 1;
        const jsIndex = index + Number.parseInt(jsPos, 10);
        const jsToken = tokens[jsIndex];

        jsToken.content = jsToken.content.replaceAll('{{$basePath}}', base);

        const codeToCompile = jsToken.content
          // Remove the all "/* start:skip-in-preview */" and "/* end:skip-in-preview */" comments
          .replace(/\/\*(\s+)?(start|end):skip-in-preview(\s+)?\*\/\n/gm, '')
          // Remove the code between "/* start:skip-in-compilation */" and "/* end:skip-in-compilation */" expressions
          // eslint-disable-next-line max-len
          .replace(/\/\*(\s+)?start:skip-in-compilation(\s+)?\*\/\n.*?\/\*(\s+)?end:skip-in-compilation(\s+)?\*\/\n/msg, '')
          // Remove /* end-file */
          .replace(/\/\* end-file \*\//gm, '');

        const codeToPreview = jsToken.content
          // Remove the all "/* start:skip-in-compilation */" and "/* end:skip-in-compilation */" comments
          .replace(/\/\*(\s+)?(start|end):skip-in-compilation(\s+)?\*\/\n/gm, '')
          // Remove the code between "/* start:skip-in-preview */" and "/* end:skip-in-preview */" expressions
          .replace(/\/\*(\s+)?start:skip-in-preview(\s+)?\*\/\n.*?\/\*(\s+)?end:skip-in-preview(\s+)?\*\/\n/msg, '')
          // Remove /* end-file */
          .replace(/\/\* end-file \*\//gm, '')
          .trim();

        const codeToCompileSandbox = jsToken.content
          // Remove the all "/* start:skip-in-preview */" and "/* end:skip-in-preview */" comments
          .replace(/\/\*(\s+)?(start|end):skip-in-preview(\s+)?\*\/\n/gm, '')
          // Remove the all "/* start:skip-in-compilation */" and "/* end:skip-in-compilation */" comments
          .replace(/\/\*(\s+)?(start|end):skip-in-compilation(\s+)?\*\/\n/gm, '');

        jsToken.content = codeToPreview;

        const activeTab = `${args.match(/--tab (code|html|css|preview)/)?.[1] ?? 'preview'}-tab-${id}`;
        const noEdit = !!args.match(/--no-edit/)?.[0];

        const codeForPreset = addCodeForPreset(codeToCompile, preset, id);

        const code = buildCode(
          id + (preset.includes('angular') ? '.ts' : '.jsx'),
          codeForPreset,
          env.relativePath
        );
        const encodedCode = encodeURI(
          `useHandsontable('${docsVersion}', function(){${code}}, '${preset}')`
        );

        [htmlIndex, jsIndex, cssIndex].filter(x => !!x).sort().reverse().forEach((x) => {
          tokens.splice(x, 1);
        });

        const newTokens = [
          ...tab('Code', jsToken, id),
          ...tab('HTML', htmlToken, id),
          ...tab('CSS', cssToken, id),
        ];

        tokens.splice(index + 1, 0, ...newTokens);
        const isAngular = /angular(-.*)?/.test(preset);
        const isRTL = /layoutDirection(.*)'rtl'/.test(codeToCompile) || /dir="rtl"/.test(htmlContent);
        const isReact = /react(-.*)?/.test(preset);

        const displayJsFiddle = Boolean(!noEdit && !isAngular);

        const isActive = `$parent.$parent.isScriptLoaderActivated('${id}')`;

        return `
          <div class="example-container" >
            <template v-if="${isActive}">
              <style v-pre>${cssContent}</style>
              <div v-pre>${htmlContentRoot}</div>
              <ScriptLoader code="${encodedCode}"></ScriptLoader>
            </template>
          </div>
          <div class="tabs-button-wrapper">
            <div class="tabs-button-list" ${isRTL ? 'div="rtl"' : ''}>
              <button class="show-code" @click="$parent.$parent.showCodeButton($event)">
                <i class="ico i-code"></i>Source code
              </button>
              <div class="example-controls">
                ${Boolean(!noEdit) && stackblitz(
    id,
    htmlContent,
    codeToCompileSandbox,
    cssContent,
    docsVersion,
    preset
  )}
  ${!noEdit && !isReact
    ? codesandbox(
      id,
      htmlContent,
      codeToCompileSandbox,
      cssContent,
      docsVersion,
      preset
    ) : ''}
                ${displayJsFiddle ? jsfiddle(id, htmlContent, codeForPreset, cssContent, docsVersion, preset) : ''}
                <button 
                  aria-label="Reset the demo" 
                  @click="$parent.$parent.resetDemo('${id}')" 
                  :disabled="$parent.$parent.isButtonInactive"
                >
                  <i class="ico i-refresh"></i>
                </button>
              </div>
            </div>
            <div class="example-container-code">
              <tabs
                :options="{ useUrlFragment: false, defaultTabHash: '${activeTab}' }"
                cache-lifetime="0"
              >
          `;
      } else {
        // close preview
        return '</tabs></div></div>';
      }
    },
  };
};
