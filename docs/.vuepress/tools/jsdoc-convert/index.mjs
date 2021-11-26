import rimraf from 'rimraf';
import { fileURLToPath } from 'url';
import path from 'path';

/// shared dependencies
import utils from '../utils.js';

/// internal dependencies
import configuration from './configuration.mjs';
import { buildPathsDeterminants } from './paths.mjs';
import { buildJsdocToMarkdownIntegrator } from './integrations/jsdoc-to-markdown/index.mjs';
import { buildRenderer } from './renderer/index.mjs';
import { buildParser } from './parser/index.mjs';

/// extract commonjs module
const { logger } = utils;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filesToRemoveGlob = path.resolve(`${__dirname}/${configuration.pathToDist}/!(introduction|plugins).md`);

logger.log('Clearing old markdown files:', path.resolve(`${__dirname}/${configuration.pathToDist}`));

rimraf.sync(filesToRemoveGlob, {
  glob: true,
  silent: false,
});

logger.success('Cleared old markdown files successfully.');

/// build services
const { source, dist } = buildPathsDeterminants(configuration);
const { parseJsdoc, generateMarkdown } = buildJsdocToMarkdownIntegrator({ source });
const parse = buildParser({ logger, parseJsdoc });
const render = buildRenderer({ logger, dist, generateMarkdown, configuration });

/// program:
const errors = [];

for (const data of parse()) { // eslint-disable-line no-restricted-syntax
  const { type, members, metaData: { parsedTypes } } = data;
  const fileName = `${type}.md`;

  logger.log(`Generating \`${type}\` into:`, dist(fileName));
  try {
    render(fileName, members, parsedTypes);
  } catch (e) {
    logger.error('ERROR: ', e);
    errors.push({ type, e });
  }
}

if (errors.length) {
  logger.warn(`Finished with ${errors.length} errors`, errors.map(x => x.file));
  process.exit(1);
}

logger.success('OK!');
process.exit(0);
