const path = require('path');
const fs = require('fs');

const LOG_FILE_NAME = 'react-translation-log.html';
const LOG_FILE_PATH = path.join(__dirname, '../../../..', LOG_FILE_NAME);

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
 */
function initLog() {
  const template = `\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Snippet Translation Preview</title>
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

  fs.writeFileSync(LOG_FILE_PATH, template);
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
  const logFile = fs.readFileSync(LOG_FILE_PATH, {
    encoding: 'utf8'
  });

  fs.writeFileSync(LOG_FILE_PATH, logFile.replace(/<replace-me\/>/g, `\
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
 */
function clearLog() {
  fs.unlinkSync(LOG_FILE_PATH);
}

module.exports = {
  logChange,
  initLog,
  clearLog
};
