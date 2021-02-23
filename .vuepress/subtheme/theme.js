const MarkdownTheme = require('typedoc-plugin-markdown/dist/theme');

class HyperFormulaTheme extends MarkdownTheme.default {
  constructor(renderer, basePath) {
    super(renderer, basePath);
  }
}

exports.default = HyperFormulaTheme;
