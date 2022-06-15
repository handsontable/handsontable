/**
 * Matches into: `example #ID .class :preset --css 2 --html 0 --js 1 --no-edit`.
 *
 * @type {RegExp}
 */
const EXAMPLE_REGEX = /^(example)\s*(#\S*|)\s*(\.\S*|)\s*(:\S*|)\s*([\S|\s]*)$/;

const { buildCode } = require('./code-builder');
const { jsfiddle } = require('./jsfiddle');
const {
  getDefaultFramework,
  isEnvDev,
  parseVersion
} = require('../../helpers');
const {
  getContainerFrontMatterLength,
  getContainerFramework
} = require('../helpers');
const {
  SnippetTransformer,
  logChange,
  SUPPORTED_FRAMEWORKS
} = require('../../tools/snippet-transformer/snippetTransformer');

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

const getPreviewTab = (id, cssContent, htmlContent, code) => {
  return {
    type: 'html_block',
    tag: '',
    attrs: null,
    map: [],
    nesting: 0,
    level: 1,
    children: null,
    content: `
      <tab name="Preview" id="preview-tab-${id}">
        <style v-pre>${cssContent}</style>
        <div v-pre>${htmlContent}</div>
        <ScriptLoader v-if="$parent.$parent.isScriptLoaderActivated('${id}')" code="${code}"></ScriptLoader>
      </tab>
    `,
    markup: '',
    info: '',
    meta: null,
    block: true,
    hidden: false
  };
};

module.exports = {
  type: 'example',
  render(tokens, index, opts, env) {
    const token = tokens[index];
    const m = token.info.trim().match(EXAMPLE_REGEX);
    const version = parseVersion(env.relativePath);

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
        : `<div id="${id}" class="hot ${klass}"></div>`;
      let htmlContentRoot = `<div data-preset-type="${preset}">${htmlContent}</div>`;

      const cssPos = args.match(/--css (\d*)/)?.[1];
      const cssIndex = cssPos ? index + Number.parseInt(cssPos, 10) : 0;
      const cssToken = cssPos ? tokens[cssIndex] : undefined;
      const cssContent = cssToken ? cssToken.content : '';

      const jsPos = args.match(/--js (\d*)/)?.[1] || 1;
      const jsIndex = index + Number.parseInt(jsPos, 10);
      const jsToken = tokens[jsIndex];
      let jsContent = jsToken.content;

      const filePath = env.relativePath;
      const framework = getContainerFramework(filePath);

      // Transform the JS snippet to the framework-based one, where the framework is defined in the `DOCS_FRAMEWORK`
      // environmental variable or retrieved from the `.md` url (depending on the build script being run).
      if (
        !['angular', 'react', 'vue'].some(value => preset.includes(value)) &&
        (framework &&
          framework !== getDefaultFramework() &&
          SUPPORTED_FRAMEWORKS.includes(framework)
        )
      ) {
        const frontMatterLength = getContainerFrontMatterLength(env.frontmatter);
        const lineNumber = tokens[jsIndex].map[0] + frontMatterLength;
        const snippetTransformer = new SnippetTransformer(framework, jsContent, filePath, lineNumber);
        const transformedSnippetContent = snippetTransformer.makeSnippet(true, true, id);

        // Don't log the the HTML log file while in the watch script.
        if (!isEnvDev()) {
          // Log the transformation in the log file.
          logChange(
            jsContent,
            transformedSnippetContent.error || transformedSnippetContent,
            filePath,
            lineNumber
          );
        }

        if (!transformedSnippetContent.error) {
          const basePreset = preset;

          // Inject a correct preset for the framework.
          preset = preset.replace('hot', framework.replace(/\d/, ''));

          // Workaround for `hot` presets having the `lang` postfix, while other frameworks -> `languages`.
          preset = preset.replace('lang', 'languages');

          // Replace the `data-preset-type` attribute value with the updates preset name.
          htmlContentRoot = htmlContentRoot.replace(`data-preset-type="${basePreset}"`, `data-preset-type="${preset}"`);

          jsContent = transformedSnippetContent;
          jsToken.content = jsContent;
        }
      }

      const activeTab = [args.match(/--tab (code|html|css|preview)/)?.[1]].map((entry) => {
        if (!entry || entry === 'preview') {
          return `preview-tab-${id}`;

        } else {
          return entry;
        }
      }).join('');
      const noEdit = !!args.match(/--no-edit/)?.[0];

      const code = buildCode(id + (preset.includes('angular') ? '.ts' : '.jsx'), jsContent, env.relativePath);
      const encodedCode = encodeURI(`useHandsontable('${version}', function(){${code}}, '${preset}')`);

      [htmlIndex, jsIndex, cssIndex].filter(x => !!x).sort().reverse().forEach((x) => {
        tokens.splice(x, 1);
      });

      const newTokens = [
        ...tab('Code', jsToken),
        ...tab('HTML', htmlToken),
        ...tab('CSS', cssToken),
        getPreviewTab(id, cssContent, htmlContentRoot, encodedCode)
      ];

      tokens.splice(index + 1, 0, ...newTokens);

      return `
          ${!noEdit ? jsfiddle(id, htmlContent, jsContent, cssContent, version, preset, framework) : ''}
          <tabs
            :options="{ useUrlFragment: false, defaultTabHash: '${activeTab}' }"
            cache-lifetime="0"
            @changed="$parent.$parent.codePreviewTabChanged(...arguments, '${id}')"
          >
        `;
    } else { // close preview
      return '</tabs>';
    }
  }
};
