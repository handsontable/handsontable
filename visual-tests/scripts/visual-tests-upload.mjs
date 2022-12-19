/* eslint-disable no-console */
/* eslint-disable no-restricted-globals */
import execa from 'execa';

console.log('Upload to Argos');
await execa.command('npx @argos-ci/cli upload tests/screenshots', { stdio: 'inherit' });
