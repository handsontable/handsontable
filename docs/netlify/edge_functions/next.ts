import type { Context, Config } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {


  const url = new URL(request.url);
  const params = url.searchParams;

  const framework = params.get('framework') === 'react' ? 'react-data-grid' : 'javascript-data-grid';

  console.log(framework, context, request);
  return Response.redirect(`/docs/${framework}`, 301);
}

export const config: Config = {
  path: ["/docs/next/:framework"],
}
