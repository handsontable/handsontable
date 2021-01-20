/* eslint-disable no-console, no-restricted-globals */

// Ensures that a new changelog entry was added in the current PR, if there
// exists a PR associated with the current commit. If multiple PR's are
// found, the first one returned from the API will be used for the check.

const core = require('@actions/core');
const github = require('@actions/github');

const token = process.env.TOKEN;

const skipCheckString = '[skip changelog]';

const changelogsPath = '.changelogs/';

const { owner, repo } = github.context.repo;
const octokit = github.getOctokit(token);

const run = async() => {
  const pr = github.context.payload.pull_request;

  if (pr === undefined) {
    return core.setFailed(
      'This script can only run within GitHub Action `pull_request` events.'
    );
  }

  if ((pr.body || '').includes(skipCheckString)) {
    console.log('The PR body (description) includes a string to disable this check, exiting.');
    process.exit(0);
  }

  // https://octokit.github.io/rest.js/v18#pagination
  const files = await octokit.paginate(octokit.pulls.listFiles, {
    owner,
    repo,
    pull_number: pr.number
  });

  const newChangelogFileAddedwasAdded = files.some(file =>
    file.status === 'added' && file.filename.startsWith(changelogsPath) && file.filename.endsWith('.json')
  );

  if (newChangelogFileAddedwasAdded) {
    console.log('Found new changelog(s), success!');
  } else {
    console.log('Added files:');
    console.log(
      files
        .filter(({ status }) => status === 'added')
        .map(({ filename }) => `${filename}\n`)
    );

    core.setFailed(
      // eslint-disable-next-line max-len
      'Expected a new changelog file to be added in this PR. See instructions in .changelogs/README.md for information on how to do that and instructions on how to mute this error.'
    );
  }
};

run();
