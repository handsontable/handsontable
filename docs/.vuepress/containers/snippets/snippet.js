const { getBuildDocsFramework } = require('../../helpers');
const {
  SnippetTransformer,
  logChange
} = require('../../tools/snippet-transform/snippetTransformer');

/**
 * Container used to transform the vanilla JS snippets and examples to the other frameworks.
 */
module.exports = {
  type: 'snippet',
  render(tokens, index, opts, env) {
    if (tokens[index].nesting === 1) {
      // For now, let's assume that the `snippet` container contains only one `js/javascript` code block.
      const snippetContent = tokens[index + 1].content;
      // Adding `3` to compensate for the frontmatter syntax
      const frontMatterLength = Object.keys(env.frontmatter).reduce(
        (sum, key) => ((Array.isArray(env.frontmatter[key])) ? sum + env.frontmatter[key].length + 1 : sum + 1), 0) + 3;
      const filePath = env.relativePath;
      const lineNumber = tokens[index].map[0] + frontMatterLength;

      const snippetTransformer = new SnippetTransformer(getBuildDocsFramework(), snippetContent, filePath, lineNumber);

      const translatedSnippetContent = snippetTransformer.makeSnippet();

      tokens[index + 1].content = translatedSnippetContent;

      // Log the transformation in the log file.
      logChange(
        snippetContent,
        translatedSnippetContent.error || translatedSnippetContent,
        filePath,
        lineNumber
      );

      return '';

    } else {
      return '';
    }
  }
};
