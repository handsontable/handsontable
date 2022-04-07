const {
  SnippetTransformer
} = require('./snippetTransformer');
const { logChange } = require('./helpers/previewLogger');

/**
 * Container used to transform the vanilla JS snippets and examples to the other frameworks.
 */
module.exports = {
  type: 'snippet',
  render(tokens, index, opts, env) {
    if (tokens[index].nesting === 1) {
      // TODO: After testing default to `js`.
      const framework = env.frontmatter.framework || 'react';
      // For now, let's assume that the `snippet` container contains only one `js/javascript` code block.
      const snippetContent = tokens[index + 1].content;
      // Adding `3` to compensate for the frontmatter syntax
      const frontMatterLength = Object.keys(env.frontmatter).reduce(
        (s, key) => ((Array.isArray(env.frontmatter[key])) ? s + env.frontmatter[key].length + 1 : s + 1), 0) + 3;
      const filePath = env.relativePath;
      const lineNumber = tokens[index].map[0] + frontMatterLength;

      const snippetTransformer = new SnippetTransformer(framework, snippetContent, filePath, lineNumber);

      const translatedSnippetContent = snippetTransformer.makeSnippet();

      // Log the transformation in the log file.
      logChange(
        snippetContent,
        translatedSnippetContent.error || translatedSnippetContent,
        filePath,
        lineNumber
      );

      // TODO: add the `translatedSnippetContent` result to the documentation contents.

      return '';

    } else {
      return '';
    }
  }
};
