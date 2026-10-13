/**
 * Text-level readers for GitHub Actions workflow files, shared by the tooling tests that pin workflow
 * structure. No YAML parser is a dependency of the repository root, so these split a workflow by the
 * indents GitHub's own files use: two spaces for a job id, four for a job's keys, six for the `- ` that
 * starts a step.
 *
 * The comment block above a step stays with the step before it. A test that reads a key from a step
 * must therefore anchor its pattern to the key's indent, never match a bare word that a comment could
 * also hold.
 */

/**
 * The jobs a workflow declares, by the two-space indent that starts each one.
 *
 * @param {string} source The workflow file's contents.
 * @returns {string[]} Job ids in order.
 */
export function jobIds(source) {
  const [, jobsBlock = ''] = source.split(/^jobs:$/m);

  return [...jobsBlock.matchAll(/^ {2}([A-Za-z0-9_-]+):$/gm)].map(([, id]) => id);
}

/**
 * One job's block, by the two-space indent that starts each job.
 *
 * @param {string} source The workflow file's contents.
 * @param {string} id The job id.
 * @returns {string} The job's text, or an empty string when the workflow has no such job.
 */
export function job(source, id) {
  const [, jobsBlock = ''] = source.split(/^jobs:$/m);
  const blocks = jobsBlock.split(/^ {2}(?=[A-Za-z0-9_-]+:$)/m);

  return blocks.find(block => block.startsWith(`${id}:`)) ?? '';
}

/**
 * A job's steps, split on the six-space `- ` that starts each one. Only the first line of a step loses
 * its indent, so a step's keys sit at eight spaces, or after the `- ` on its first line.
 *
 * @param {string} jobBody One job's text, from `job()`.
 * @returns {string[]} One entry per step.
 */
export function steps(jobBody) {
  const [, stepsBlock = ''] = jobBody.split(/^ {4}steps:$/m);

  return stepsBlock.split(/^ {6}(?=- )/m).filter(block => block.trim());
}
