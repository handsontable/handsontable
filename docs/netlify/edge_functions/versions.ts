import type { Context, Config } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {

  const url = new URL(request.url);
  console.log('url', url);
  const pattern = new URLPattern({ pathname: '/docs/:version(\\d+\\.\\d+|next)' });
  const match = pattern.exec(url.pathname);

  const cookieValue = context.cookies.get("docs_fw");
  const framework = cookieValue === 'react' ? 'react-data-grid' : 'javascript-data-grid';

  if (match) {
  
    console.log('match', match);
    const version = match.pathname.groups.version;
    const newUrl = `${url.origin}/docs/${version}/${framework}/`;
    return Response.redirect(newUrl, 301);
  }
  console.log('no match');

  return fetch(request);
}

// export const config: Config = {
//   path: ["/docs/:version(\\d+\\.\\d+|next)'"],
// }


