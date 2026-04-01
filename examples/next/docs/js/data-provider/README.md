# Demo

## Description

Handsontable **DataProvider** with two small Node backends in one project:

- **REST** — Express JSON API at `/api/stock-lines` (`server-rest.mjs`, default port 4010).
- **GraphQL** — `POST /graphql` with graphql-js (`server-graphql.mjs`, default port 4011).

Shared filter evaluation for server-side filters lives in `server-filter-utils.mjs`.

## Installation

Install all necessary dependencies from npm with `npm install`.

## Development

1. Start both APIs: `npm run server` (or run `npm run server:rest` and `npm run server:graphql` in separate terminals).
2. Start the Vite app: `npm run start`, then open http://localhost:8080 (or the port Vite prints).

Override URLs with `VITE_API_BASE` and `VITE_GRAPHQL_URL` if you change ports.

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
