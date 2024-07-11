const buildJavascriptBody = ({ id, html, js, css, version, hyperformulaVersion, sandbox, lang }) => {
  if (sandbox === 'stackblitz') {
    return {
      files: {
        'package.json': {
          content: `{
    "name": "handsontable",
    "version": "1.0.0",
    "description": "",
    "dependencies": {
      "hyperformula": "${hyperformulaVersion}",
      "handsontable": "${version}"
    }
  }`
        },
        'index.html': {
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
        'styles.css': {
          content: css
        },
        [`index.${lang}`]: {
          content: `import './styles.css'
${js}`
        },
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
  "main": "index.html",
  "scripts": {
    "start": "parcel --no-source-maps index.html --open",
    "build": "parcel build index.html"
  },
  "dependencies": {
    "hyperformula": "${hyperformulaVersion}",
    "handsontable": "${version}"
  },
  "devDependencies": {
    "@babel/core": "7.2.0",
    "parcel-bundler": "^1.6.1"
  }
}`
      },
      'index.html': {
        content: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Handsontable</title>
    <link rel="stylesheet" href="src/styles.css" />
    ${js.includes('import { HyperFormula } from \'hyperformula\';')
    ? '<script src="https://cdn.jsdelivr.net/npm/hyperformula/dist/hyperformula.full.min.js"></script>'
    : ''}
  </head>

  <body>
    ${html || `<div id="${id}"></div>`}
    <script src="src/index.${lang}"></script>
  </body>
</html>`
      },
      'src/styles.css': {
        content: css
      },
      [`src/index.${lang}`]: {
        content: js.replace('import { HyperFormula } from \'hyperformula\';', '')
      }
    }
  };
};

module.exports = { buildJavascriptBody };
