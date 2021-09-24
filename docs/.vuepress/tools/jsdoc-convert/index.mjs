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

/// build services
const { source, dist } = buildPathsDeterminants(configuration);
const { parseJsdoc, generateMarkdown } = buildJsdocToMarkdownIntegrator({ source });
const parse = buildParser({ logger, parseJsdoc });
const render = buildRenderer({ logger, dist, generateMarkdown, configuration });

/// program:
const errors = [];

for (const { type, members, metaData: { parsedTypes } } of parse()) { // eslint-disable-line no-restricted-syntax
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
