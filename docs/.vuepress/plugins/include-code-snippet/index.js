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
            // Store initial file stats
            let lastStats = fs.statSync(includePath);

            fs.watch(includePath, () => {
              try {
                // Get current file stats
                const currentStats = fs.statSync(includePath);

                if (lastStats.size !== currentStats.size) {
                  // Only trigger hot reload if file size actually changed
                  fs.utimesSync($page._filePath, new Date(), new Date());

                  // Update stored stats
                  lastStats = currentStats;
                }
              } catch (error) {
                // eslint-disable-next-line no-console
                console.error(`Error reading file: ${error.message}`);
              }
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
