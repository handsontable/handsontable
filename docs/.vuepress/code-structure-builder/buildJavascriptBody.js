const buildJavascriptBody = ({ id, html, js, css, version }) => {
  return {
    files: {
      'package.json': {
        content: `{
  "name": "handsontable",
  "version": "1.0.0",
  "description": "",
  "scripts": {
    "start": "parcel ./src/index.html",
    "build": "parcel build ./src/index.html"
  },
  "dependencies": {
    "hyperformula": "^2.4.0",
    "handsontable": "${version}"
  },
  "devDependencies": {
    "@babel/core": "7.2.0",
    "parcel-bundler": "^1.6.1"
  }
}`
      },
      'src/index.html': {
        content: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Handsontable</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>

  <body>
    ${html || `<div id="${id}"></div>`}
    <script src="./index.js"></script>
  </body>
</html>`
      },
      'src/styles.css': {
        content: css
      },
      'src/index.js': {
        content: js
      },
    }
  };
};

module.exports = { buildJavascriptBody };
