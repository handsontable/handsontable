const fs = require('fs');
const includeCodeSnippet = require('./../markdown-it-include-code-snippet');

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
        const files = $page._content.matchAll(/@\[code\]\((.*)\)/ig);

        files.forEach((file) => {
          const includePath = file[1].trim().split('@').join('.');

          if (fs.existsSync(includePath)) {
            fs.watch(includePath, () => {
              // Change the file system timestamps of the object referenced by `path`
              // This triggers a hot reload rebuild of the page
              fs.utimesSync($page._filePath, new Date(), new Date());
            });
          }
        });

      }
    },
    /**
     * Extend markdown-it instance with includeCodeSnippet plugin.
     *
     * @param {object} md - Markdown-it instance.
     */
    extendMarkdown: (md) => {
      md.use(includeCodeSnippet);
    }
  };
};
