/**
 * Delegate the provided command to a sub-project.
 * For example:
 * `npm run in vue-handsontable build` or `run in vue build`
 * will run the `build` command from the directory of the provided project.
 */
import execa from 'execa';

const [/* node bin */, /* path to this script */, project, command, args] = process.argv;
const PROJECT_ALIASES = {
  angular: 'angular-handsontable',
  react: 'react-handsontable',
  vue: 'vue-handsontable'
};
const commandArray = [
  'run',
  command
];

if (args) {
  commandArray.push(args);
}

((async function() {
  try {
    await execa('npm', commandArray, {
      cwd: (project === 'handsontable' ? '.' : `./wrappers/${PROJECT_ALIASES[project] || project}`),
      stdio: 'inherit'
    });
  } catch (error) {
    process.exit(error.exitCode);
  }
})());
