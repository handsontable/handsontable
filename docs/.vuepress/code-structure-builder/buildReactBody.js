const buildReactBody = ({ js, css, version, hyperformulaVersion, preset, sandbox }) => {
  const addReduxDependencies = preset.includes('redux')
    ? `
    "redux": "^4.0.0",
    "react-redux": "^7.2.4",`
    : '';

  const addAdvancedDependencies = preset.includes('advanced')
    ? `"redux": "^4.0.0",
    "react-redux": "^7.2.4",
    "react-colorful": "5.6.1",
    "react-star-rating-component": "1.4.1",`
    : '';

  if (sandbox === 'stackblitz') {
    return {
      files: {
        'package.json': {
          content: `{
  "name": "handsontable",
  "version": "1.0.0",
  "description": "",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",${addReduxDependencies}${addAdvancedDependencies}
    "hyperformula": "${hyperformulaVersion}",
    "handsontable": "${version}",
    "@handsontable/react": "${version}"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
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
    <noscript> You need to enable JavaScript to run this app. </noscript>
    <div id="root"></div>
  </body>
</html>
`
        },
        'src/styles.css': {
          content: css
        },
        'src/index.js': {
          content: `import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import ExampleComponent from "./ExampleComponent";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <ExampleComponent />
  </StrictMode>
);`
        },
        'src/ExampleComponent.jsx': {
          content: `import React from "react";
${js}`
        }
      }
    };
  }

  return {
    files: {
      'package.json': {
        content: `{
  "name": "handsontable",
  "version": "1.0.0",
  "description": "",
  "main": "src/index.jsx",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",${addReduxDependencies}${addAdvancedDependencies}
    "handsontable": "${version}",
    "@handsontable/react": "${version}"
  },
  "devDependencies": {
    "react-scripts": "^5.0.1"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}`
      },
      'public/index.html': {
        content: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Handsontable</title>
    ${js.includes('import { HyperFormula } from \'hyperformula\';')
    ? '<script src="https://cdn.jsdelivr.net/npm/hyperformula/dist/hyperformula.full.min.js"></script>'
    : ''}
  </head>

  <body>
    <noscript> You need to enable JavaScript to run this app. </noscript>
    <div id="root"></div>
  </body>
</html>
`
      },
      'src/styles.css': {
        content: css
      },
      'src/index.jsx': {
        content: `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import ExampleComponent from "./ExampleComponent";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <ExampleComponent />
  </StrictMode>
);`
      },
      'src/ExampleComponent.jsx': {
        content: js.replace('import { HyperFormula } from \'hyperformula\';', '')
      }
    }
  };

};

module.exports = { buildReactBody };
