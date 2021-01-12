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
const { sha } = github.context;

const run = async() => {
  const octokit = github.getOctokit(token);

  const result = await octokit.repos.listPullRequestsAssociatedWithCommit({
    owner,
    repo,
    commit_sha: sha
  });

  console.log(`Found ${result.data.length} PR's associated with this commit`);
  const pr = result.data[0];

  if (pr === undefined) {
    console.log('No PR found associated with this commit, exiting.');
    process.exit(0);
  }

  if (pr.body.includes(skipCheckString)) {
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
