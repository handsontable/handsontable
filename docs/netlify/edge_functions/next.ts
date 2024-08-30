import type { Context, Config } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {

  const url = new URL(request.url);

  const params = new URLSearchParams(url.search);
  // const framework = params.get('framework')

  //const framework = url.searchParams.get('framework') === 'react-data-grid' ? 'react-data-grid' : 'javascript-data-grid';
  const framework = params.get('framework')

  console.log('framework', framework, context, request);


  // console.log(framework, context, request);
  return Response.redirect(`/docs/${framework}`, 301);
}

export const config: Config = {
  path: ["/docs/next/:framework"],
}
