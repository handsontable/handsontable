const fs = require('fs');

const fileExists = filePath => fs.existsSync(filePath);

const readFileContent = filePath =>
  (fileExists(filePath)
    ? fs.readFileSync(filePath).toString()
    : `Not Found: ${filePath}`);

const parseOptions = (optionsString) => {
  const parsedOptions = {};

  optionsString
    .trim()
    .split(' ')
    .forEach((pair) => {
      const [option, value] = pair.split('=');

      parsedOptions[option] = value;
    });

  return parsedOptions;
};

module.exports = function includeCodeSnippet(markdown, options) {
  const rootDirectory = options && options.root ? options.root : process.cwd();

  const createDataObject = (state, position, maximum) => {
    const start = position + 6;
    const end = state.skipSpacesBack(maximum, position) - 1;
    const [optionsString, fullpathWithAtSym] = state.src
      .slice(start, end)
      .trim()
      .split('](');

    const fullpath = fullpathWithAtSym.replace(/^@/, rootDirectory).trim();
    const pathParts = fullpath.split('/');
    const fileParts = pathParts[pathParts.length - 1].split('.');

    return {
      file: {
        resolve: fullpath,
        path: pathParts.slice(0, pathParts.length - 1).join('/'),
        name: fileParts.slice(0, fileParts.length - 1).join('.'),
        ext: fileParts[fileParts.length - 1],
      },
      options: parseOptions(optionsString),
      content: readFileContent(fullpath),
      fileExists: fileExists(fullpath),
    };
  };

  // eslint-disable-next-line no-shadow
  const mapOptions = ({ options }) => ({
    hasHighlight: options.highlight || false,
    get meta() {
      return this.hasHighlight ? options.highlight : '';
    },
  });

  /**
   * Custom parser function for handling code snippets in markdown.
   *
   * @param {object} state - The current state object of the markdown-it parser.
   * @param {number} startLine - The line number where the code snippet starts.
   * @param {number} endLine - The line number where the code snippet ends.
   * @param {boolean} silent - Flag indicating whether the parser should run in silent mode.
   * @returns {boolean} - Returns true if the code snippet was successfully parsed, false otherwise.
   */
  function customParser(state, startLine, endLine, silent) {
    const fenceMarker = '@[code]';
    const position = state.bMarks[startLine] + state.tShift[startLine];
    const maximum = state.eMarks[startLine];

    // Early return for indented blocks
    if (state.sCount[startLine] - state.blkIndent >= 4) {
      return false;
    }

    if (!state.src.startsWith(fenceMarker, position)) {
      // Early return if fence marker is not present
      return false;
    }

    if (silent) {
      // Handle silent mode
      return true;
    }

    const dataObject = createDataObject(state, position, maximum);
    const optionsMapping = mapOptions(dataObject);

    const token = state.push('fence', 'code', 0);

    token.info =
      (dataObject.options.lang || dataObject.file.ext) + optionsMapping.meta;
    token.content = dataObject.content;
    token.markup = '```';
    token.map = [startLine, startLine + 1];

    state.line = startLine + 1;

    return true;
  }

  markdown.block.ruler.before('fence', 'snippet', customParser);
};
