/**
 * Matches into: `example #ID .class :preset --html 0 --js 1 --hidden`.
 *
 * @type {RegExp}
 */
const exampleRegex = /^(example)\s*(#\S*|)\s*(\.\S*|)\s*(:\S*|)\s*([\S|\s]*)$/;

const JSFIDDLE_ENDPOINT = 'https://jsfiddle.net/api/post/library/pure/';

const mapVersion = (version = 'latest') => (version.match(/^\d+\.\d+\.\d+$/) ? version : 'latest');

//todo duplicate in handsontable manager
const getHotUrls = (version) => {
  const mappedVersion = mapVersion(version);

  return {
    handsontableJs:`https://cdn.jsdelivr.net/npm/handsontable@${mappedVersion}/dist/handsontable.full.min.js`,
    handsontableCss:`https://cdn.jsdelivr.net/npm/handsontable@${mappedVersion}/dist/handsontable.full.min.css`,
    languagesJs:`https://cdn.jsdelivr.net/npm/handsontable@${mappedVersion}/dist/languages/all.js`
  };
};
//todo duplicate in handsontable manager
const buildDependencyGetter = (version) => {
  const {handsontableJs, handsontableCss, languagesJs} = getHotUrls(version);
  // todo use version
  return (dependency) => {
    const dependencies = {
      hot: [handsontableJs, ['Handsontable', 'Handsontable.react'], handsontableCss],
      react: ['https://unpkg.com/react@17/umd/react.development.js', ['React']],
      'react-dom': ['https://unpkg.com/react-dom@17/umd/react-dom.development.js', ['ReactDOM']],
      'hot-react': ['https://cdn.jsdelivr.net/npm/@handsontable/react/dist/react-handsontable.js', ['Handsontable.react']],
      fixer: ['https://handsontable.com/docs/8.3.2/scripts/jsfiddle-fixer.js', ['require', 'exports']], //todo new one fixer doesn't work
      numbro: ['https://handsontable.com/docs/8.3.2/components/numbro/dist/languages.min.js', ['numbro.allLanguages','numbro']],
      redux: ['https://cdn.jsdelivr.net/npm/redux@4/dist/redux.min.js',[]],
      'rxjs': ["https://cdn.jsdelivr.net/npm/rxjs@6/bundles/rxjs.umd.js",[/*todo*/]],
      'core-js': ["https://cdn.jsdelivr.net/npm/core-js@2/client/core.min.js",[/*todo*/]],
      'zone': ["https://cdn.jsdelivr.net/npm/zone.js@0.9/dist/zone.min.js",[/*todo*/]],
      'angular-compiler': ["https://cdn.jsdelivr.net/npm/@angular/compiler@8/bundles/compiler.umd.min.js",[/*todo*/]],
      'angular-core': ["https://cdn.jsdelivr.net/npm/@angular/core@8/bundles/core.umd.min.js",[/*todo*/]],
      'angular-common': ["https://cdn.jsdelivr.net/npm/@angular/common@8/bundles/common.umd.min.js",[/*todo*/]],
      'angular-forms': ['https://cdn.jsdelivr.net/npm/@angular/forms@7/bundles/forms.umd.min.js',[/*todo*/]],
      'angular-platform-browser': ["https://cdn.jsdelivr.net/npm/@angular/platform-browser@8/bundles/platform-browser.umd.min.js",[/*todo*/]],
      'angular-platform-browser-dynamic': ["https://cdn.jsdelivr.net/npm/@angular/platform-browser-dynamic@8/bundles/platform-browser-dynamic.umd.min.js",[/*todo*/]],
      'hot-angular': ["https://cdn.jsdelivr.net/npm/@handsontable/angular@7.0.0/bundles/handsontable-angular.umd.min.js",[/*todo*/]],
      'hot-vue': ["https://cdn.jsdelivr.net/npm/@handsontable/vue@6.0.0/dist/vue-handsontable.min.js", [/*todo*/]],
      'vue': ["https://cdn.jsdelivr.net/npm/vue@2/dist/vue.min.js", [/*todo*/]],
      'vuex': ["https://unpkg.com/vuex@3/dist/vuex.js", [/*todo*/]],
      'languages': [languagesJs,[/*todo*/]],
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
    angular: ['hot', 'fixer', 'rxjs', 'core-js', 'zone', 'angular-compiler', 'angular-core', 'angular-common', 'angular-platform-browser', 'angular-platform-browser-dynamic', 'hot-angular', ],
    'angular-languages': ['hot', 'languages', 'fixer', 'rxjs', 'core-js', 'zone', 'angular-compiler', 'angular-core', 'angular-common', 'angular-forms', 'angular-platform-browser', 'angular-platform-browser-dynamic', 'hot-angular', ],
    'angular-numbro': ['hot', 'numbro', 'fixer', 'rxjs', 'core-js', 'zone', 'angular-compiler', 'angular-core', 'angular-common', 'angular-platform-browser', 'angular-platform-browser-dynamic', 'hot-angular', ],
    'vue':[ 'hot', 'vue', 'hot-vue', 'fixer'],
    'vue-numbro':[ 'hot', 'numbro', 'vue', 'hot-vue', 'fixer'],
    'vue-languages':[ 'hot', 'languages', 'vue', 'hot-vue', 'fixer'],
    'vue-vuex':[ 'hot', 'vue', 'vuex', 'hot-vue', 'fixer'],
    // todo others
  };
  return presetMap[preset].map(x => getter(x)).reduce((p,c,i)=> 
      p +
      (c[0] ? `<script src="${c[0]}"></script>\n` : '') +
      (c[2] ? `<link type="text/css" rel="stylesheet" href="${c[2]}" /> \n` : ''), 
    '</style><!-- Ugly Hack due to jsFiddle issue -->\n')
};

const jsfiddle = (id, html, code, version, preset) => {
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
      <textarea name="js" readOnly v-pre>${code}</textarea>
      <textarea name="html" readOnly v-pre>${html}</textarea>
      <textarea name="css" readOnly>${getCss(version, preset)}</textarea>
      ${preset.includes('react') || preset.includes('vue') ? '<input type="text" name="panel_js" value="3" readOnly>' : ''}
      ${preset.includes('angular') ? '<input type="text" name="panel_js" value="4" readOnly>' : ''}
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
    const m = token.info.trim().match(exampleRegex);
    const version = env.relativePath.split('/')[0];

    if (token.nesting === 1 && m) {
      let [, , id, klass, preset, args=''] = m;
      id = id ? id.substring(1) : 'example1';
      klass = klass ? klass.substring(1) : '';
      preset = preset ? preset.substring(1) : 'hot';
      
      const htmlPos = args.match(/--html (\d*)/)?.[1]
      const tokenHtml = htmlPos ? tokens[index + Number.parseInt(htmlPos)] : undefined;
      const contentHtml = tokenHtml 
        ? tokenHtml.content
        : `<div id="${id}" className="hot ${klass}"></div>`
      
      const jsPos = args.match(/--js (\d*)/)?.[1] || 1;
      const tokenJs = tokens[index +  Number.parseInt(jsPos)];
      const contentJs = tokenJs.content;
      
      const hidden = !!args.match(/--hidden/);

      let code;
      try {
        code = transformSync(contentJs, {
          filename: id + (preset.includes('angular') ? '.ts' : '.jsx'),
          presets: [
            "@babel/preset-env",
            '@babel/preset-react',
            '@babel/preset-typescript',
          ],
          plugins: [
            '@babel/plugin-transform-modules-commonjs',
            '@babel/plugin-syntax-class-properties',
            ["@babel/plugin-proposal-decorators", { "legacy": true }],
            ['@babel/plugin-proposal-class-properties', {loose: true}],

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
    <div v-pre>${contentHtml}</div>
    <script data-jsfiddle="${id}" v-pre>useHandsontable('${version}', function(){${code}}, '${preset}');</script>
    <div class="codeLayout ${hidden?'hidden':''}">${jsfiddle(id, contentHtml, contentJs, version, preset)}
`;
    } else {
      // closing tag
      return '</div>\n';
    }
  }
};
