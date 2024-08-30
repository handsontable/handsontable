import type { Context, Config } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {

  const url = new URL(request.url);

  const params = url.searchParams;
  console.log(url, params.get('framework'), params);
  const framework = params.get('framework') === 'react-data-grid' ? 'react-data-grid' : 'javascript-data-grid';

  console.log(framework, context, request);
  return Response.redirect(`/docs/${framework}`, 301);
}

export const config: Config = {
  path: ["/docs/next/:framework"],
}
