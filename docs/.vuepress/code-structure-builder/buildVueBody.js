const buildVueBody = ({ id, html, js, css, version, preset }) => {
  const addVuexDependencies = preset.includes('vuex')
    ? `
    "vuex": "^3.6.2",`
    : '';
  const addAdvancedDependencies = preset.includes('advanced')
    ? `
    "vuex": "^3.6.2",
    "vue-color": "latest",
    "vue-star-rating": "latest",`
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
    "hyperformula": "^2.4.0",
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
