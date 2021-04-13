/**
 * Matches into: `example #ID .class`.
 *
 * @type {RegExp}
 */
const exampleRegex = /^(example)\s*(#\S*|)\s*(\.\S*|)\s*(:\S*|)\s*([\S|\s]*)$/;

const JSFIDDLE_ENDPOINT = 'https://jsfiddle.net/api/post/library/pure/';

// Both react and vue (vuepress) use {{ for different purposes. 
// So using it in react example causes that vuepress build attempt to insert a variable value
// as the effect we gain syntax error 
const escape = (unsafe) => unsafe.replace(/{{/g, '{ {');

const mapVersion = (version = 'latest') => (version.match(/^\d+\.\d+\.\d+$/) ? version : 'latest');

//todo duplicate in handsontable manager
const getHotUrls = (version) => {
  const mappedVersion = mapVersion(version);

  return [
    `https://cdn.jsdelivr.net/npm/handsontable@${mappedVersion}/dist/handsontable.full.min.js`,
    `https://cdn.jsdelivr.net/npm/handsontable@${mappedVersion}/dist/handsontable.full.min.css`,
  ];
};
//todo duplicate in handsontable manager
const buildDependencyGetter = (version) => {
  const [hotJsUrl, hotCssUrl] = getHotUrls(version);
  // todo use version
  return (dependency) => {
    const dependencies = {
      hot: [hotJsUrl, ['Handsontable', 'Handsontable.react'], hotCssUrl],
      react: ['https://unpkg.com/react@17/umd/react.development.js', ['React']],
      'react-dom': ['https://unpkg.com/react-dom@17/umd/react-dom.development.js', ['ReactDOM']],
      'hot-react': ['https://cdn.jsdelivr.net/npm/@handsontable/react/dist/react-handsontable.js', ['Handsontable.react']],
      fixer: ['https://handsontable.com/docs/8.3.2/scripts/jsfiddle-fixer.js', ['require', 'exports']], //todo new one fixer doesn't work
      numbro: ['https://handsontable.com/docs/8.3.2/components/numbro/dist/languages.min.js', ['numbro.allLanguages','numbro']],
      redux: ['https://cdn.jsdelivr.net/npm/redux@4/dist/redux.min.js',[]],
    };

    // [jsUrl, dependentVars[]?, cssUrl?]
    return dependencies[dependency];
  };
};


const getCss = (version, preset) => {
  const getter = buildDependencyGetter(version)// todo refactoring
  const presetMap = { //todo duplicated, refactoring
    hot: ['hot'],
    react: [ 'hot','react', 'react-dom', 'hot-react', 'fixer'],
    'react-numbro': [ 'hot', 'numbro', 'react', 'react-dom', 'hot-react', 'fixer'],
    'react-redux': [ 'hot', 'react', 'react-dom', 'redux', 'hot-react', 'fixer'],
    // todo others
  };
  return presetMap[preset].map(x => getter(x)).reduce((p,c,i)=> 
      p +
      (c[0] ? `<script src="${c[0]}"></script>\n` : '') +
      (c[2] ? `<link type="text/css" rel="stylesheet" href="${c[2]}" /> \n` : ''), 
    '</style><!-- Ugly Hack due to jsFiddle issue -->\n')
};

const getHtml = id => `<div id="${id}" ></div>`;
const jsfiddle = (id, code, version, preset) => {
  return `
    <form
      id="jsfiddle-${id}"
      action=${JSFIDDLE_ENDPOINT}
      method="post"
      target="_blank"
      style="display:none;"
    >
      <input type="text" name="title" readOnly value="Handsontable example" />
      <input type="text" name="wrap" readOnly value="d" />
      <textarea name="js" readOnly>${escape(code)}</textarea>
      <textarea name="html" readOnly>${getHtml(id)}</textarea>
      <textarea name="css" readOnly>${getCss(version, preset)}</textarea>
      ${preset.includes('react') ? '<input type="text" name="panel_js" value="3" readOnly>' : ''}
  }
    </form>
    <div class="js-fiddle-link">
      <button type="submit" form="jsfiddle-${id}"><i class="fa fa-jsfiddle"></i>Edit</button>
    </div>
  `;
  //todo babel + jsx
};
module.exports = {
  type: 'example',
  render(tokens, index, opts, env) {
    const { transformSync } = require('@babel/core');

    const token = tokens[index];
    const tokenNext = tokens[index + 1];
    const m = token.info.trim().match(exampleRegex);
    const version = env.relativePath.split('/')[0];

    if (token.nesting === 1 && m) {
      let [, , id, klass, preset] = m;
      id = id ? id.substring(1) : '';
      klass = klass ? klass.substring(1) : '';
      preset = preset ? preset.substring(1) : 'hot';

      let code;
      try {
        code = transformSync(tokenNext.content, {
          presets: [
            "@babel/preset-env",
            '@babel/preset-react',
          ],
          plugins: [
            '@babel/plugin-transform-modules-commonjs',
            '@babel/plugin-syntax-class-properties',
            ['@babel/plugin-proposal-class-properties', {loose: true}]
          ],
          targets: {
            ie: 9
          }
        }).code;
      }catch (error){
        console.error(`Babel error when building ${env.relativePath}`);
        throw error;
      }

      // opening tag
      return `
    <div data-jsfiddle="${id}">
    <div id="${id}" class="hot ${klass}"></div>
    </div><script data-jsfiddle="${id}">useHandsontable('${version}', function(){${code}}, '${preset}');</script>
    <div class="codeLayout">${jsfiddle(id, tokenNext.content, version, preset)}
`;
    } else {
      // closing tag
      return '</div>\n';
    }
  }
};
