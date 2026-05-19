const path = require('path');
const env = process.env.NODE_ENV;
// eslint-disable-next-line import/no-dynamic-require
const configFactory = require(`./.config/${env}`);

// In some cases, npm env variables become rewritten to lower case names. To prevent this it is rewritten to the
// original variable name so the --testPathPattern work in any case.
if (process.env.npm_config_testpathpattern) {
  process.env.npm_config_testPathPattern = process.env.npm_config_testpathpattern;
}

// Default theme for all rspack-based scripts (e.g. test:e2e.dump, watch).
const DEFAULT_THEME = 'main';

// Extract entry files from CLI positional arguments (webpack CLI compatibility).
// Webpack CLI treats positional args as entry files and merges them with config entries.
// Rspack CLI does not support positional entry arguments, so we parse them manually.
function getCliEntries() {
  const args = process.argv.slice(2);
  const entries = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // Skip known rspack flags and their values
    if (arg.startsWith('-')) {
      // Flags that take a value -- skip the next argument too
      if (['--config', '-c', '--entry', '--mode', '-m', '--devtool', '-d',
           '--output-path', '-o', '--node-env', '--env', '--config-name',
           '--config-loader', '--json'].includes(arg)) {
        i++;
      }
      continue;
    }

    // Remaining positional arguments are entry files
    if (arg.endsWith('.js') || arg.endsWith('.mjs') || arg.endsWith('.ts') ||
        arg.endsWith('.scss') || arg.endsWith('.css')) {
      entries.push(path.resolve(arg));
    }
  }

  return entries;
}

module.exports = function() {
  const configs = configFactory.create({
    testPathPattern: process.env.npm_config_testPathPattern,
    HOT_THEME: process.env.npm_config_theme ?? DEFAULT_THEME,
  });

  const cliEntries = getCliEntries();

  if (cliEntries.length > 0) {
    configs.forEach(function(c) {
      if (!c.entry || (Array.isArray(c.entry) && c.entry.length === 0)) {
        // No entry or empty array -- replace with CLI entries
        c.entry = cliEntries;
      } else if (Array.isArray(c.entry)) {
        // Merge CLI entries with existing config entries (preserves items like 'hyperformula')
        c.entry = [...c.entry, ...cliEntries];
      } else if (typeof c.entry === 'object' && Object.keys(c.entry).length === 0) {
        // Empty object entry -- replace with CLI entries
        c.entry = cliEntries;
      } else {
        // For non-empty named entries, leave them as-is (e.g. named entries in styles/themes)
      }
    });
  }

  return configs;
};
