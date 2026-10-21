import path from 'path';
import { fileURLToPath } from 'url';
import jsdoc2md from 'jsdoc-to-markdown';
import dmd from 'dmd';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const buildJsdocToMarkdownIntegrator = ({ source }) => {
  // The async API streams jsdoc's output. The sync one buffers it through `spawnSync` with a hardcoded
  // 20 MiB `maxBuffer` (jsdoc-api), and the API JSON outgrew that, failing with a bare `JSDOC_ERROR: [`.
  const parseJsdoc = (files) => {
    return jsdoc2md.getTemplateData({
      files: source(files),
      'no-cache': true,
    });
  };

  const generateMarkdown = data => dmd(data, {
    noCache: true,
    partial: path.join(__dirname, 'dmd/partials/**/*.hbs'),
    template: '{{>hot-main~}}'
  });

  return {
    parseJsdoc,
    generateMarkdown
  };
};
