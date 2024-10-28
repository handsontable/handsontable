import path from 'path';
import execa from 'execa';
import {
  displayErrorMessage
} from '../../scripts/utils/console.mjs';

((async function() {
  try {
    await execa('npm', ['run', 'swap-package-links'], {
      cwd: path.resolve(process.cwd(), '..'),
      stdio: 'inherit'
    });

  } catch (error) {
    displayErrorMessage('Error running the script.');
    process.exit(error.exitCode);
  }
})());
