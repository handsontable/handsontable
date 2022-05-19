const path = require('path');
const fs = require('fs');
const {
  getEnvDocsVersion,
  getEnvDocsFramework
} = require('../../../helpers');

const BASE_PATH = path.join(__dirname, '../../../..');
const SUPPORTED_FRAMEWORKS = [
  'react'
];

/**
 * Returns information on whether the currently processed framework is supported by the transformer.
 *
 * @param {string} framework Currently processed framework.
 * @returns {boolean}
 */
function isFrameworkSupported(framework) {
  return SUPPORTED_FRAMEWORKS.includes(framework);
}

/**
 * Returns the currently processed version and framework information based on the environmental variables if the
 * provided version and/or framework are not defined.
 *
 * @param {{framework: string, version: string}} versionAndOrFramework Object containing the framework and version
 * information.
 * @returns {{framework: string, version: string}}
 */
function fetchVersionAndOrFramework(versionAndOrFramework) {
  const {
    version,
    framework
  } = versionAndOrFramework;

  return {
    version: version || getEnvDocsVersion(),
    framework: framework || getEnvDocsFramework()
  };
}

/**
 * Get the log file name.
 *
 * @param {string} [framework] Currently processed framework.
 * @returns {string}
 */
function getLogFileName(framework) {
  ({ framework } = fetchVersionAndOrFramework({
    framework
  }));

  return `snippet-transformer-log-${framework}.html`;
}

/**
 * Get the log file path.
 *
 * @param {string} [version] Currently processed version.
 * @param {string} [framework] Currently processed framework.
 * @returns {string}
 */
function getLogFilePath(version, framework) {
  ({
    version,
    framework
  } = fetchVersionAndOrFramework({
    version,
    framework
  }));

  return path.join(BASE_PATH, `./${version}/`, getLogFileName(framework));
}

/**
 * Escape the HTML tags.
 *
 * @param {string} htmlString The HTML string.
 * @returns {string}
 */
function escapeHtmlTags(htmlString) {
  return htmlString
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\$/g, '&#36;');
}

/**
 * Initialize the log file.
 *
 * @param {string} [version] Currently processed version.
 * @param {string} [framework] Currently processed framework.
 */
function initLog(version, framework) {
  ({
    version,
    framework
  } = fetchVersionAndOrFramework({
    version,
    framework
  }));

  if (!isFrameworkSupported(framework)) {
    // Add warning: `Trying to create a snippet transformation log file for ${framework}, which is not currently
    // supported.`
    return;
  }

  const template = `\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Snippet Transformer Log</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.5.0/highlight.min.js"></script>
  <script>hljs.highlightAll();</script>
  <style type="text/css">
      body {
          padding: 20px;
          font-size: 1.2em;
          font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,
          Cantarell,Fira Sans,Droid Sans,Helvetica Neue,sans-serif;
          color: #2c3e50;
      }

      .container {
          display: grid;
          grid-template-columns: repeat(2, calc(50% - 15px));
          grid-column-gap: 30px;
      }

      header {
          grid-column-start: 1;
          grid-column-end: span 2;
      }

      section {
        margin-bottom: 30px;
      }
  </style>
  <link rel="stylesheet" 
  href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.5.0/styles/base16/material.min.css"
  />
</head>
<body>
  <div class="container">
    <header><h2>Code snippet transformation preview</h2></header>
    <replace-me/>
  </div>
</body>
</html>
`;

  fs.writeFileSync(getLogFilePath(version, framework), template);
}

/**
 * Log a change (a transformation) to the log file.
 *
 * @param {string} before The previous content of the log file.
 * @param {string} after The new content of the log file.
 * @param {string} filePath The path to the file where the change happened.
 * @param {number} lineNumber Line number of the change.
 */
function logChange(before, after, filePath, lineNumber) {
  const { framework } = fetchVersionAndOrFramework({});

  if (!isFrameworkSupported(framework)) {
    return;
  }

  const logFilePath = getLogFilePath();
  const logFile = fs.readFileSync(logFilePath, {
    encoding: 'utf8'
  });

  fs.writeFileSync(logFilePath, logFile.replace(/<replace-me\/>/g, `\
  <header>Source: <code>${filePath}:${lineNumber}</code></header>
  <section><pre><code class="language-javascript">${escapeHtmlTags(before)}</code></pre></section>
  <section><pre><code class="language-javascript">${escapeHtmlTags(after)}</code></pre></section>
      <replace-me/>
 `), {
    encoding: 'utf8'
  });
}

/**
 * Clear the log file.
 *
 * @param {string} [version] Currently processed version.
 */
function clearLog(version) {
  ({ version } = fetchVersionAndOrFramework({ version }));

  fs.unlinkSync(getLogFilePath(version));
}

module.exports = {
  logChange,
  initLog,
  clearLog,
  getLogFilePath
};
