import type { Context, Config } from "@netlify/edge-functions";

const STATUS_PERMANENT_REDIRECT = 301;

function prepareRedirects(framework){
  return [
    // # --- HyperFormula -
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

    // redirect /docs/ to /docs/javascript-data-grid/ ---
    {
      from: /^\/docs\/?$/,
      to: `/docs/${framework}/`,
      status: STATUS_PERMANENT_REDIRECT,
    },
    {
      from: /^\/docs\/(\d+\.\d+|next)\/?$/,
      to: `/docs/${framework}/`,
      status: STATUS_PERMANENT_REDIRECT,
    },
    // documentation links that come up in Handsontable's console logs ---
    {
      from: /^\/docs\/i18n\/missing-language-code$/,
      to: `/docs/${framework}/language/#loading-the-prepared-language-files`,
      status: STATUS_PERMANENT_REDIRECT,
    },

    // framework shortcuts
    {
      from: /^\/docs\/react$/,
      to: `/docs/react-data-grid/installation/`,
      status: STATUS_PERMANENT_REDIRECT,
    },
    {
      from: /^\/docs\/angular$/,
      to: `/docs/javascript-data-grid/angular-installation/`,
      status: STATUS_PERMANENT_REDIRECT,
    },
    {
      from: /^\/docs\/vue$/,
      to: `/docs/javascript-data-grid/vue-installation/`,
      status: STATUS_PERMANENT_REDIRECT,
    },
    {
      from: /^\/docs\/vue3$/,
      to: `/docs/javascript-data-grid/vue3-installation/`,
      status: STATUS_PERMANENT_REDIRECT,
    },

    {
      from: /^\/docs\/react-hot-column$/,
      to: "/docs/react-data-grid/hot-column",
      status: STATUS_PERMANENT_REDIRECT,
    },
  ]
}


export default async function handler(request: Request, context: Context) {
  const url = new URL(request.url);
  console.log('url', url);

  const cookieValue = context.cookies.get("docs_fw");
  const framework = cookieValue === 'react' ? 'react-data-grid' : 'javascript-data-grid';

  const redirects = prepareRedirects(framework);

  const matchFound = redirects.find(redirect => redirect.from.test(url.pathname));

  if (matchFound) {
    const newUrl = url.pathname.replace(matchFound.from, matchFound.to)
    console.log('Match found, redirecting to', newUrl);
    return Response.redirect(newUrl, 301);
  }
  
  return context.next();

  console.log('no match');
  const path = url.pathname;

  try {
    // Fetch the static file from the Netlify-deployed assets
    console.log('Trying to fetch', `${url.origin}${path}`);
    const assetResponse = await fetch(`../.${path}`);  // Fetch the static file
  
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

export const config: Config = {
  path: ["/*"],
}
