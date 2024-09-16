import type { Context, Config } from "@netlify/edge-functions";

import * as fs from 'fs';
import * as path from 'path';

interface Redirect {
  from: string;
  to: string;
  status: string;
}

const STATUS_PERMANENT_REDIRECT = 301;

function loadRedirectsArray(jsonFilePath: string, framework: string): Redirect[] {
  const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
  const redirectsArray = JSON.parse(fileContent);

  // Convert "from" string into a RegExp and replace $framework in "to" property
  const updatedRedirectsArray = redirectsArray.map((redirect: { from: string, to: string, status: string }) => {
    const fromRegex = new RegExp(redirect.from); // Convert from string to RegExp
    const updatedTo = redirect.to.replace('$framework', framework); // Replace $framework with provided framework

    return {
      from: fromRegex,
      to: updatedTo,
      status: redirect.status,
    };
  });

  return updatedRedirectsArray;
}


export default async function handler(request: Request, context: Context) {
  const url = new URL(request.url);
  console.log('url', url);

  const cookieValue = context.cookies.get("docs_fw");
  const framework = cookieValue === 'react' ? 'react-data-grid' : 'javascript-data-grid';

  const redirects = loadRedirectsArray('./utils/redirects.json', framework);

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
