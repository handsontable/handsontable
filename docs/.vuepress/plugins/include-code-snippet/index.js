const {
  FRAMEWORK_SUFFIX,
  MULTI_FRAMEWORKED_CONTENT_DIR,
  getDefaultFramework,
  getDocsBase,
  getDocsHostname,
  getDocsRepoSHA,
  getFrameworks,
  getPrettyFrameworkName,
  getSidebars,
  getThisDocsVersion,
  parseFramework,
} = require('../../helpers');

const includeCodeSnippet = require('./../markdown-it-include-code-snippet');

const fs = require('fs');
const buildMode = process.env.BUILD_MODE;
const pluginName = 'hot/extend-page-data';
const now = new Date();

//const { include } = require('@mdit/plugin-include');
const  include2  = require('markdown-it-include');

const INCLUDE_RE = /!{3}\s*include(.+?)!{3}/i;
const BRACES_RE = /\((.+?)\)/i;

/**
 * Remove the slash from the beginning and ending of the string.
 *
 * @param {string} string String to process.
 * @returns {string}
 */
function removeEndingSlashes(string) {
  return string.replace(/^\//, '').replace(/\/$/, '');
}

/**
 * Dedupes the slashes in the string.
 *
 * @param {string} string String to process.
 * @returns {string}
 */
function dedupeSlashes(string) {
  return string.replace(/(\/)+/g, '$1');
}

/**
 * Returns the original (not symlinked) relative path of the MD file, which the page
 * are created from.
 *
 * @param {string} relativePath The relative path of the processed file (symlinked path).
 * @returns {string}
 */
function getOriginRelativePath(relativePath) {
  return relativePath
    .replace(new RegExp(`^/?${MULTI_FRAMEWORKED_CONTENT_DIR}`), '')
    .replace(new RegExp(`/(${getFrameworks().join('|')})${FRAMEWORK_SUFFIX}/`), '');
}

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const twoDigitDay = date.getDate();
  const shortMonthName = date.toLocaleString('default', { month: 'short' });

  return `${shortMonthName} ${twoDigitDay}, ${date.getFullYear()}`;
};

module.exports = (options, context) => {
  return {
    name: 'include-code-snippet',
    /**
     * Extends and updates a page with additional information for versioning.
     *
     * @param {object} $page The $page value of the page you’re currently reading.
     */
    extendPageData($page) {
      // only in dev server mode
      if (!context.isProd) {
        const files = $page._content.matchAll(/@\[code\]\((.*)\)/ig)
        for (const file of files) {
          let includePath = file[1].trim().split('@').join('.');
          if (fs.existsSync(includePath)) {
            fs.watch(includePath, (curr, prev) => {
              // Change the file system timestamps of the object referenced by `path`
              // This triggers a hot reload rebuild of the page
              fs.utimesSync( $page._filePath, new Date(), new Date() )
            })
          }
        }
      }
    },
    /**
     * Extend markdown-it instance with includeCodeSnippet plugin.
     * @param {object} md - markdown-it instance.
     */
    extendMarkdown: (md) => {
      md.use(includeCodeSnippet);
    }
  };
};
