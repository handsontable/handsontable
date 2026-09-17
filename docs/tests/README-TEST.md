# Visual Test README

This README provides instructions for running visual tests for documentation

## Prerequisites

Install dependencies in `./docs`

Install playwright binaries `npx playwright install --with-deps`

## Run tests

To run the visual tests, follow these steps:

1. First time you run the tests locally you will need to generate `golden images`:

    ```bash
    npm run docs:visual-test:update-screenshot
    ```

2. Once done run tests:

    ```bash
    npm run docs:visual-test
    ```
## Good to know

1. The framework will run the docs webserver if not already started
3. You can target diff environment using `BASE_URL` env variable 
2. To run the test in staging `https://dev.handsontable.com/docs` you need to provide additional cookie value as env variable 

4. You can set environment variables using `.env` file - just rename `docs/tests/.env.example`

## On CI

There is no snapshot cache. The goldens live in the `handsontable-visual` R2 bucket under
`docs/base/<branch>/screenshots/**`, with a manifest at
`https://visual.handsontable.com/docs/base/<branch>/out.json`, and only a seed writes them:

- `Docs visual seed` runs after every push build of `Docs Staging Deployment` (`develop`, `release/x.y.z`)
  and re-seeds `docs/base/<branch>` from the pages that deploy served. Dispatch it with `branch` to re-seed
  by hand.
- `Docs Visual Tests` (dispatch only) with `update-snapshots` ticked re-seeds `docs/base/<this branch>` from
  the chosen `test_env`; unticked, it compares against that baseline and publishes the report under
  `docs/dispatch/<branch>/<run_id>`.

A pull request with the `run-docs-visual` label is compared against `docs/base/<target branch>` by
`docs.yml`'s `visual` job. On CI a missing golden fails the test (`updateSnapshots: 'none'`), so a pull
request never writes a golden. The result is a sticky comment on the pull request and a report at
`https://visual.handsontable.com/docs/pr-<number>/<sha>/results/index.html`; differences hold the
`docs-visual-approval` environment until a reviewer approves the pending deployment on the run page. The
functional specs (every `tests/*.spec.ts` except `visualDocs`) run on every docs pull request in the
`functional` project, report-only for one sprint. Details: `docs/AGENTS.md`, section 2.18.

