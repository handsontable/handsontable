const buildReactBody = ({ js, css, version, hyperformulaVersion, themeName, preset, sandbox, lang }) => {
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

  const tsconfig = lang === 'tsx' ? {
    'tsconfig.json': {
      content: `{
  "compilerOptions": {
    "target": "es6",
    "module": "commonjs",
    "moduleResolution": "node",
    "noResolve": false,
    "noImplicitAny": false,
    "allowJs": true,
    "jsx": "react",
    "skipLibCheck": true,
    "lib": [
        "dom",
        "es2020"
    ]
  },
  "exclude": [
    "./node_modules/**/*"
  ]
}`
    }
  } : {};

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
    "@handsontable/react-wrapper": "${version}"${lang === 'tsx' ? `,
    "@types/react": "18.0.21",
    "@types/react-dom": "18.0.6",
    "typescript": "5.5.2"` : ''
}
  },
  ${lang === 'tsx' ?
    `"devDependencies": {
      "react-scripts-ts": "latest"
    },` : ''
}
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Handsontable</title>
  </head>

  <body>
    <noscript> You need to enable JavaScript to run this app. </noscript>
    <div id="root" class="${themeName}"></div>
  </body>
</html>
`
        },
        'src/styles.css': {
          content: css
        },
        [`src/index.${lang === 'jsx' ? 'js' : 'tsx'}`]: {
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
        [`src/ExampleComponent.${lang}`]: {
          content: `import React from "react";
${js}`
        },
        ...tsconfig
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
  "main": "src/index.${lang}",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",${addReduxDependencies}${addAdvancedDependencies}
    "handsontable": "${version}",
    "@handsontable/react-wrapper": "${version}"${lang === 'tsx' ? `,
    "@types/react": "18.0.21",
    "@types/react-dom": "18.0.6",
    "typescript": "5.5.2"` : ''
}
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Handsontable</title>
    ${js.includes('import { HyperFormula } from \'hyperformula\';')
    ? '<script src="https://cdn.jsdelivr.net/npm/hyperformula/dist/hyperformula.full.min.js"></script>'
    : ''}
  </head>

  <body>
    <noscript> You need to enable JavaScript to run this app. </noscript>
    <div id="root" class="${themeName}"></div>
  </body>
</html>
`
      },
      'src/styles.css': {
        content: css
      },
      [`src/index.${lang}`]: {
        content: `import * as React from "react";
import { StrictMode } from "react";
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
      [`src/ExampleComponent.${lang}`]: {
        content: `import * as React from "react";
${js.replace('import { HyperFormula } from \'hyperformula\';', '')}`
      },
      ...tsconfig
    }
  };

};

module.exports = { buildReactBody };
