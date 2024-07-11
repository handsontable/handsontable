const buildVueBody = ({ id, html, js, css, version, hyperformulaVersion, preset }) => {
  const addVuexDependencies = preset.includes('vuex')
    ? `
    "vuex": "^3.6.2",`
    : '';
  const addAdvancedDependencies = preset.includes('advanced')
    ? `
    "vuex": "^3.6.2",
    "vue-color": "2.8.1",
    "vue-star-rating": "1.7.0",`
    : '';

  return {
    files: {
      'package.json': {
        content: `{
  "name": "handsontable",
  "version": "1.0.0",
  "description": "",
  "main": "src/main.js",
  "scripts": {
    "start": "vue-cli-service serve",
    "build": "vue-cli-service build"
  },
  "dependencies": {
    "vue": "2.7.14",${addVuexDependencies}${addAdvancedDependencies}
    "hyperformula": "${hyperformulaVersion}",
    "handsontable": "${version}",
    "@handsontable/vue": "${version}"
  },
  "devDependencies": {
    "@vue/cli-service": "5.0.8"
  }
}`
      },
      'vue.config.js': {
        content: `module.exports = {
    runtimeCompiler: true
}`
      },
      'public/index.html': {
        content: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Handsontable</title>
  </head>

  <body>
    ${html || `<div id="${id}"></div>`}
  </body>
</html>`
      },
      'src/styles.css': {
        content: css
      },
      'src/main.js': {
        content: `import Vue from "vue";
import "./styles.css";
import ExampleComponent from "./ExampleComponent.js";

new Vue({
  ...ExampleComponent,
  el: '#${id}',
});
`
      },
      'src/ExampleComponent.js': {
        content: js
      },
    }
  };
};

module.exports = { buildVueBody };
