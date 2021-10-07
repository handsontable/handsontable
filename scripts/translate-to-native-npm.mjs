/**
 * Translate the custom workspace delegation scripts to their native npm counterparts.
 */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import {
  displayErrorMessage,
  spawnProcess
} from './utils/index.mjs';

const argv = yargs(hideBin(process.argv))
  .array('if-present')
  .argv;
const modifier = process.env.COMMAND_ENV;

if (argv._.length === 0) {
  displayErrorMessage(`No arguments were provided for the 'npm run ${modifier}' command.`);

  process.exit(1);
}

(async() => {
  switch (modifier) {
    case 'in': {
      const prependWithScope = (packageName) => {
        if (packageName !== 'handsontable' && packageName !== 'examples') {
          return `@handsontable/${packageName}`;
        }

        return packageName;
      };
      const [project, command] = argv._;

      await spawnProcess(
        `npm run ${command} --workspace=${prependWithScope(project)}${argv.ifPresent ? ' --if-present' : ''}`
      );

      break;
    }
    case 'all': {
      const [command] = argv._;

      await spawnProcess(`npm run ${command} --workspaces${argv.ifPresent ? ' --if-present' : ''}`);

      break;
    }
    default:
  }
})();
