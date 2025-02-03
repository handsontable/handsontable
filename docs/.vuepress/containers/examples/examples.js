/**
 * Matches into: `example #ID .class :preset --css 2 --html 0 --js 1 --ts 3 --no-edit`.
 *
 * @type {RegExp}
 */
const EXAMPLE_REGEX = /^(example)\s*(#\S*|)\s*(\.\S*|)\s*(:\S*|)\s*([\S|\s]*)$/;
const { buildCode } = require('./code-builder');
const { addCodeForPreset } = require('./add-code-for-preset');
const { jsfiddle } = require('./jsfiddle');
const { stackblitz } = require('./stackblitz');

const tab = (tabName, token, id) => {
  if (!token) {
    return [];
  }

  const openTSDivToken = {
    type: 'html_block',
    tag: '',
    nesting: 1,
    content: `<tab id="${tabName.toLowerCase()}-tab-${id}" name="${tabName}">`
  };
  const closeDivToken = {
    type: 'html_block',
    tag: '',
    nesting: -1,
    content: '</tab>'
  };

  return [
    openTSDivToken,
    token,
    closeDivToken
  ];
};

const parsePreview = (content) => {
  if (!content) {
    return '';
  }

  return content
    // Remove the all "/* start:skip-in-compilation */" and "/* end:skip-in-compilation */" comments
    .replace(/\/\*(\s+)?(start|end):skip-in-compilation(\s+)?\*\/\n/gm, '')
    // Remove the code between "/* start:skip-in-preview */" and "/* end:skip-in-preview */" expressions
    .replace(/\/\*(\s+)?start:skip-in-preview(\s+)?\*\/\n.*?\/\*(\s+)?end:skip-in-preview(\s+)?\*\/\n/msg, '')
    // Remove /* end-file */
    .replace(/\/\* end-file \*\//gm, '')
    .trim();
};

const parseCode = (content) => {
  if (!content) {
    return '';
  }

  return content
    // Remove the all "/* start:skip-in-preview */" and "/* end:skip-in-preview */" comments
    .replace(/\/\*(\s+)?(start|end):skip-in-preview(\s+)?\*\/\n/gm, '')
    // Remove the code between "/* start:skip-in-compilation */" and "/* end:skip-in-compilation */" expressions
    // eslint-disable-next-line max-len
    .replace(/\/\*(\s+)?start:skip-in-compilation(\s+)?\*\/\n.*?\/\*(\s+)?end:skip-in-compilation(\s+)?\*\/\n/msg, '')
    // Remove /* end-file */
    .replace(/\/\* end-file \*\//gm, '');
};

const parseCodeSandbox = (content) => {
  if (!content) {
    return '';
  }

  return content
    // Remove the all "/* start:skip-in-preview */" and "/* end:skip-in-preview */" comments
    .replace(/\/\*(\s+)?(start|end):skip-in-preview(\s+)?\*\/\n/gm, '')
    // Remove the all "/* start:skip-in-compilation */" and "/* end:skip-in-compilation */" comments
    .replace(/\/\*(\s+)?(start|end):skip-in-compilation(\s+)?\*\/\n/gm, '');
};

const getCodeToken = (jsToken, tsToken) => {
  const code = {
    type: 'inline',
    tag: '',
    nesting: 1
  };
  const openJSDivToken = {
    type: 'container_div_open',
    tag: 'div',
    nesting: 1,
    attrs: [
      ['class', 'tab-content-js'],
      ['v-if', '$parent.$parent.selectedLang === \'JavaScript\'']
    ]
  };
  const openTSDivToken = {
    type: 'container_div_open',
    tag: 'div',
    nesting: 1,
    attrs: [
      ['class', 'tab-content-ts'],
      ['v-if', '$parent.$parent.selectedLang === \'TypeScript\'']
    ]
  };
  const closeDivToken = {
    type: 'container_div_close',
    tag: 'div',
    nesting: -1
  };

  code.children = [
    openJSDivToken,
    jsToken,
    closeDivToken
  ];

  if (tsToken) {
    code.children.push(openTSDivToken);
    code.children.push(tsToken);
    code.children.push(closeDivToken);
  }

  return code;
};

module.exports = function(docsVersion, base) {
  return {
    type: 'example',
    render(tokens, index, _opts, env) {
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
        const htmlContentSandbox = htmlToken
          ? htmlToken.content
          : `<div id="${id}" ${!klass?.includes('disable-auto-theme')
            ? `class="hot ht-theme-main ${klass}"`
            : ''} ></div>`;
        const htmlContentRoot = `<div 
          data-preset-type="${preset}" 
          data-example-id="${id}" 
          class="${!klass?.includes('disable-auto-theme') ? 'ht-theme-main-dark-auto' : ''}">
          ${htmlContent}
        </div>`;

        const cssPos = args.match(/--css (\d*)/)?.[1];
        const cssIndex = cssPos ? index + Number.parseInt(cssPos, 10) : 0;
        const cssToken = cssPos ? tokens[cssIndex] : undefined;
        const cssContent = cssToken ? cssToken.content : '';

        const jsPos = args.match(/--js (\d*)/)?.[1] || 1;
        const jsIndex = jsPos ? index + Number.parseInt(jsPos, 10) : 0;
        const jsToken = jsPos ? tokens[jsIndex] : undefined;

        const tsPos = args.match(/--ts (\d*)/)?.[1];
        const tsIndex = tsPos ? index + Number.parseInt(tsPos, 10) : 0;
        const tsToken = tsPos ? tokens[tsIndex] : undefined;

        // Parse code
        const jsTokenWithBasePath = jsToken?.content?.replaceAll('{{$basePath}}', base);
        const tsTokenWithBasePath = tsToken?.content?.replaceAll('{{$basePath}}', base);
        const codeToCompile = parseCode(jsTokenWithBasePath);
        const tsCodeToCompile = parseCode(tsTokenWithBasePath);
        const codeToCompileSandbox = parseCodeSandbox(jsTokenWithBasePath);
        const tsCodeToCompileSandbox = parseCodeSandbox(tsTokenWithBasePath);
        const codeToPreview = parsePreview(jsTokenWithBasePath);
        const tsCodeToPreview = parsePreview(tsTokenWithBasePath);

        // Replace token content
        if (jsToken) {
          jsToken.content = codeToPreview;
        }

        if (tsToken) {
          tsToken.content = tsCodeToPreview;
        }

        [htmlIndex, jsIndex, tsIndex, cssIndex].filter(x => !!x).sort().reverse().forEach((x) => {
          tokens.splice(x, 1);
        });

        const newTokens = [
          ...tab('Code', tsToken ? getCodeToken(jsToken, tsToken) : jsToken, id),
          ...tab('HTML', htmlToken, id),
          ...tab('CSS', cssToken, id),
        ];

        tokens.splice(index + 1, 0, ...newTokens);

        const codeForPreset = addCodeForPreset(codeToCompile, preset, id);
        const tsCodeForPreset = addCodeForPreset(tsCodeToCompile, preset, id);
        const code = buildCode(
          id + (preset.includes('angular') ? '.ts' : '.jsx'),
          codeForPreset,
          env.relativePath
        );
        const encodedCode = encodeURI(
          `useHandsontable('${docsVersion}', function(){${code}}, '${preset}')`
        );
        const activeTab = `${args.match(/--tab (code|html|css|preview)/)?.[1] ?? 'preview'}-tab-${id}`;
        const noEdit = !!args.match(/--no-edit/)?.[0];
        const isRTL = /layoutDirection(.*)'rtl'/.test(codeToCompile) || /dir="rtl"/.test(htmlContent);
        const isActive = `$parent.$parent.isScriptLoaderActivated('${id}')`;
        const selectedLang = '$parent.$parent.selectedLang';
        const isJavaScript = preset.includes('hot');
        const isReact = preset.includes('react');
        const isReactOrJavaScript = isJavaScript || isReact;

        return `
          <div class="example-container">
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
                <div class="examples-buttons" v-if="${selectedLang} === 'JavaScript' || !${isReactOrJavaScript}">
                  ${!noEdit
    ? stackblitz(
      id,
      htmlContentSandbox,
      codeToCompileSandbox,
      cssContent,
      docsVersion,
      preset,
      'JavaScript'
    )
    : ''}
                  ${!noEdit
    ? jsfiddle(
      id,
      htmlContentSandbox,
      codeForPreset,
      cssContent,
      docsVersion,
      preset,
      'JavaScript'
    )
    : ''}
                </div>
                <div class="examples-buttons" v-if="${selectedLang} === 'TypeScript' && ${isReactOrJavaScript}">
                  ${!noEdit
    ? stackblitz(
      id,
      htmlContentSandbox,
      tsCodeToCompileSandbox,
      cssContent,
      docsVersion,
      preset,
      'TypeScript'
    )
    : ''}
                  ${!noEdit && !isReact
    ? jsfiddle(
      id,
      htmlContentSandbox,
      tsCodeForPreset,
      cssContent,
      docsVersion,
      preset,
      'TypeScript'
    )
    : ''}
                </div>
                <button
                  aria-label="Reset the demo" 
                  @click="$parent.$parent.resetDemo('${id}')" 
                  :disabled="$parent.$parent.isButtonInactive"
                >
                  <i class="ico i-refresh"></i>
                </button>
                <button
                  aria-label="View the source on GitHub" 
                  @click="$parent.$parent.openExample('${env.relativePath}', '${preset}', '${id}')" 
                >
                  <i class="ico i-github"></i>
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
