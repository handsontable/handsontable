const buildReactBody = ({ js, css, version, preset, sandbox }) => {
  const addReduxDependencies = preset.includes('redux')
    ? `
    "redux": "^4.0.0",
    "react-redux": "^7.2.4",`
    : '';
  if (sandbox === 'stackblitz') {
    return {
      files: {
        'package.json': {
          content: `{
  "name": "handsontable",
  "version": "1.0.0",
  "description": "",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",${addReduxDependencies}
    "hyperformula": "latest",
    "handsontable": "${version}",
    "@handsontable/react": "${version}"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.1.6"
  }
}`
        },
        'vite.config.js': {
          content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()]
})`
        },
        'index.html': {
          content: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Handsontable</title>
  </head>

  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`
        },
        'src/styles.css': {
          content: css
        },
        'src/main.jsx': {
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
          content: js
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
    "react-dom": "^18.2.0",${addReduxDependencies}
    "hyperformula": "latest",
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
        content: js
      }
    }
  };

};

module.exports = { buildReactBody };
