# Demo

## Description

Handsontable **DataProvider** with Angular (`hot-table`) and two small Node backends in one folder:

- **REST** — `server-rest.mjs` (default port 4010), `/api/stock-lines`.
- **GraphQL** — `server-graphql.mjs` (default port 4011), `POST /graphql`.

Shared filter logic for server-side filters: `server-filter-utils.mjs`. Browser wiring lives in `src/app/data-provider-clients.ts`. API URLs are set in `src/environments/environment.ts`.

## Installation

Install all necessary dependencies from npm with `npm install`.

## Development

1. Start both APIs: `npm run server` (or `npm run server:rest` and `npm run server:graphql` in separate terminals).
2. Start the dev server: `npm run start`, then open http://localhost:8080.

## Testing

To run tests for this project, first launch the development server with `npm run start`. Once the server is running, execute `npm run test` to run the test specs.

## Forking

There are two ways to fork this project in Handsontable's monorepo:

1. Fork the entire repository.
2. Copy the example to a new repository. Detailed instructions are available [here](../../../../README.md#copying-an-example-to-a-separate-repo) in the section _Copying an example to a separate repo_.

## License

Handsontable is a commercial software with two licenses available:

- Free for non-commercial purposes such as teaching, academic research, and evaluation. [Read it here](https://github.com/handsontable/handsontable/blob/master/handsontable-non-commercial-license.pdf).
- Commercial license with support and maintenance included. See [pricing plans](https://handsontable.com/pricing).

## Get help

Join our [community](https://github.com/handsontable/handsontable/discussions) to get help, share ideas, and contribute to the ongoing development of Handsontable!

Commercial license holders with an active support plan can contact our [Support Team](https://handsontable.com/contact?category=technical_support).
