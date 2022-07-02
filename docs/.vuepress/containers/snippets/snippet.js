const {
  getContainerFrontMatterLength,
  getContainerFramework
} = require('../helpers');
const {
  getDefaultFramework,
  isEnvDev
} = require('../../helpers');
const {
  SnippetTransformer,
  logChange,
  SUPPORTED_FRAMEWORKS
} = require('../../tools/snippet-transformer/snippetTransformer');

/**
 * Container used to transform the vanilla JS snippets and examples to the other frameworks.
 */
module.exports = {
  type: 'snippet',
  render(tokens, index, opts, env) {
    const filePath = env.relativePath;
    const framework = getContainerFramework(filePath);

    if (
      tokens[index].nesting === 1 &&
      (framework &&
        framework !== getDefaultFramework() &&
        SUPPORTED_FRAMEWORKS.includes(framework)
      )
    ) {
      // For now, let's assume that the `snippet` container contains only one `js/javascript` code block.
      const snippetContent = tokens[index + 1].content;
      const frontMatterLength = getContainerFrontMatterLength(env.frontmatter);
      const lineNumber = tokens[index].map[0] + frontMatterLength;

      const snippetTransformer = new SnippetTransformer(
        framework,
        snippetContent,
        '<!-- snippet -->',
        filePath,
        lineNumber
      );

      const transformedSnippetContent = snippetTransformer.makeSnippet();

      tokens[index + 1].content = transformedSnippetContent;

      // Don't log the the HTML log file while in the watch script.
      if (!isEnvDev()) {
        // Log the transformation in the log file.
        logChange(
          snippetContent,
          transformedSnippetContent.error || transformedSnippetContent,
          filePath,
          lineNumber
        );
      }

      return '';

    } else {
      return '';
    }
  }
};
