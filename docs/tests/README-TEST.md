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
5. You can run the tests using GH workflow

