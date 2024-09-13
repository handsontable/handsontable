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
    to: "https://hyperformula.handsontable.com/$1",
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
    from: /^\/docs\/disablethis\/docs\/(.*)$/,
    to: "/docs/$1",
    status: STATUS_PERMANENT_REDIRECT,
  },
  {
    from: /^\/docs\/(\d+\.\d+|next)$/,
    to: "/docs/$1/javascript-data-grid/",
    status: STATUS_PERMANENT_REDIRECT,
  },
  {
    from: /^\/docs\/(\d+\.\d+|next)\/(react-data-grid|javascript-data-grid)\/(.*)$/,
    to: "/docs/$1/$2/$3",
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
    from: /^\/docs\/react-data-grid$/,
    to: "/docs/react-data-grid/getting-started",
    status: STATUS_PERMANENT_REDIRECT,
  },
  {
    from: /^\/docs\/javascript-data-grid$/,
    to: "/docs/javascript-data-grid/getting-started",
    status: STATUS_PERMANENT_REDIRECT,
  },
]

export default async function handler(request: Request, context: Context) {
  const url = new URL(request.url);
  console.log('url', url);

  const cookieValue = context.cookies.get("docs_fw");
  const framework = cookieValue === 'react' ? 'react-data-grid' : 'javascript-data-grid';

  const matchFound = redirects.find(redirect => redirect.from.test(url.pathname));

  if (matchFound) {
    const newUrl = url.pathname.replace(matchFound.from,matchFound.to)
    console.log('Match found, redirecting to', newUrl);
    return Response.redirect(newUrl, 301);
  }

  console.log('no match');
  const path = url.pathname;

  try {
    // Fetch the static file from the Netlify-deployed assets
    console.log('Trying to fetch', `${url.origin}${path}`);
    const assetResponse = await fetch(`${url.origin}${path}`);
  
    // If the asset exists, serve it back to the user
    if (assetResponse.ok) {
      return assetResponse;  // Return the fetched static file
    }

    // If the asset is not found, return a 404 response

    return new Response('Asset not found', { status: 404 });
  } catch (error) {
    // Handle any errors that occurred during fetch
    return new Response('Error fetching asset', { status: 500 });
  }
}
