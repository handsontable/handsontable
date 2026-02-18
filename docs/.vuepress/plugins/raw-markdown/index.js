const fs = require('fs');

/**
 * Removes YAML frontmatter block from markdown (--- ... ---).
 *
 * @param {string} content - Raw file content.
 * @returns {string} Content without frontmatter.
 */
function stripFrontmatter(content) {
  return content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '');
}

module.exports = () => ({
  name: 'vuepress-plugin-raw-markdown',

  extendPageData($page) {
    // $page._filePath contains the absolute path to the markdown file
    if ($page._filePath) {
      try {
        const rawContent = fs.readFileSync($page._filePath, 'utf-8');

        $page.rawMarkdown = stripFrontmatter(rawContent);
      } catch (err) {
        $page.rawMarkdown = '';
      }
    }
  }
});
