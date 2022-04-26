const { getBuildDocsFramework } = require('../../helpers');
const { getFrontMatterLength } = require('../helpers');
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
      const frontMatterLength = getFrontMatterLength(env.frontmatter);
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
