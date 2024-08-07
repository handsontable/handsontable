const buildVue3Body = ({ id, html, js, css, version, hyperformulaVersion, preset }) => {
  const addVuexDependencies = preset.includes('vuex')
    ? `
    "vuex": "^4.0.2",`
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
    "vue": "3.2.45",${addVuexDependencies}
    "hyperformula": "${hyperformulaVersion}",
    "handsontable": "${version}",
    "@handsontable/vue3": "${version}"
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
        content: `import { createApp } from "vue";
import "./styles.css";
import ExampleComponent from "./ExampleComponent.js";

createApp(ExampleComponent).mount("#${id}");
`
      },
      'src/ExampleComponent.js': {
        content: js
      }
    }
  };
};

module.exports = { buildVue3Body };
