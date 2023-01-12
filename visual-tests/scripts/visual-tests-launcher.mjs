import execa from 'execa';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

let currentBranch;
const argv = yargs(hideBin(process.argv)).argv;
const pathToMount = `${process.cwd().split('\\').join('/')}/../`;
const isCI = process?.argv?.includes('CI');

// in CI we know name of current branch from Github Actions - it is send as a `currentBranch` argv,
// in local environment we have to take this name from Git by ourselves.
if (isCI) {
  currentBranch = argv?.currentBranch;
} else {
  currentBranch = (await execa.command('git rev-parse --abbrev-ref HEAD', { silent: true })).stdout;
}

if (!currentBranch) {
  throw new Error('There is lack of information about current branch');
}

if (process?.argv?.includes('build')) {
  if (isCI) {
    await execa.command('node scripts/visual-tests-build.mjs',
      { env: { CURRENT_BRANCH: currentBranch }, stdio: 'inherit' });
  } else {
    // we need access to `examples` and `virtual-tests` directories,
    // so here we mount entire HoT directory as a virtual `vtests`
    // and on start open `visual-tests` in it

    // eslint-disable-next-line max-len
    await execa.command(`docker run --name vtests-container --env CURRENT_BRANCH=${currentBranch} -v ${pathToMount}:/vtests/ -w /vtests/visual-tests --rm vtests`,
      { stdio: 'inherit' });
    await execa.command('docker stop vtests-container', { stdio: 'inherit' });
  }
}

if (process?.argv?.includes('upload')) {
  await execa.command(`node scripts/visual-tests-upload.mjs ${isCI ? 'CI' : ''}`,
    { env: { CURRENT_BRANCH: currentBranch }, stdio: 'inherit' });
}
