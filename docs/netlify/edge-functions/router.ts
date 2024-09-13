import type { Context } from "@netlify/edge-functions";

const STATUS_PERMANENT_REDIRECT = 301;

const redirects = [
  {
    from: /^\/docs\/hyperformula$/,
    to: "https://hyperformula.handsontable.com",
    status: STATUS_PERMANENT_REDIRECT,
  },
  {
    from: /^\/docs\/hyperformula\/(.*)$/,
    to: "https://hyperformula.handsontable.com",
    status: STATUS_PERMANENT_REDIRECT,
  },
  {
    from: /^\/docs\/react-hot-column$/,
    to: "/docs/react-data-grid/hot-column",
    status: STATUS_PERMANENT_REDIRECT,
  },
  {
    from: /^\/docs\/frameworks-wrapper-for-react-hot-column$/,
    to: "/docs/react-data-grid/hot-column",
    status: STATUS_PERMANENT_REDIRECT,
  },
  {
    from: /^\/docs\/react-hot-column$/,
    to: "/docs/react-data-grid/hot-column",
    status: STATUS_PERMANENT_REDIRECT,
  },
  {
    from: /^\/docs\/frameworks-wrapper-for-react-hot-column$/,
    to: "/docs/react-data-grid/hot-column",
    status: STATUS_PERMANENT_REDIRECT,
  },
  {
    from: /^\/docs\/react-hot-column$/,
    to: "/docs/react-data-grid/hot-column",
    status: STATUS_PERMANENT_REDIRECT,
  },
  {
    from: /^\/docs\/frameworks-wrapper-for-react-hot-column$/,
    to: "/docs/react-data-grid/hot-column",
    status: STATUS_PERMANENT_REDIRECT,
  },
  {
    from: /^\/docs\/react-hot-column$/,
    to: "/docs/react-data-grid/hot-column",
    status: STATUS_PERMANENT_REDIRECT,
  },
  {
    from: /^\/docs\/frameworks-wrapper-for-react-hot-column$/,
    to: "/docs/react-data-grid/hot-column",
    status: STATUS_PERMANENT_REDIRECT,
  },
  {
    from: /^\/docs\/react-hot-column$/,
    to: "/docs/react-data-grid/hot-column",
    status: STATUS_PERMANENT_REDIRECT,
  },
  {
    from: /^\/docs\/frameworks-wrapper-for-react-hot-column$/,
    to: "/docs/react-data-grid/hot-column",
    status: STATUS_PERMANENT_REDIRECT,
  },
  {
    from: /^\/docs\/react-hot-column$/,
    to: "/docs/react-data-grid/hot-column",
    status: STATUS_PERMANENT_REDIRECT,
  },
  {
    from: /^\/docs\/frameworks-wrapper-for-react-hot-column$/,
    to: "/docs/react-data-grid/hot-column",
    status: STATUS_PERMANENT_REDIRECT,
  },
  {
    from: /^\/docs\/react-hot-column$/,
    to: "/docs/react-data-grid/hot-column",
    status: STATUS_PERMANENT_REDIRECT,
  },
]

export default async function handler(request: Request, context: Context) {
  const url = new URL(request.url);
  console.log('url', url);

  const cookieValue = context.cookies.get("docs_fw");
  const framework = cookieValue === 'react' ? 'react-data-grid' : 'javascript-data-grid';

  const match = redirects.find(redirect => redirect.from.test(url.pathname));

  if (match) {
    console.log('match', match);
    return Response.redirect(match.to, 301);
  }

  console.log('no match');

  return fetch(request);
}
