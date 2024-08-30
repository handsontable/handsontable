import type { Context, Config } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {  

  const value = context.cookies.get("docs_fw");

  const framework = value === 'react' ? 'react-data-grid' : 'javascript-data-grid';

  console.log(framework, context, request);
  return Response.redirect(`/docs/${framework}`, 301);
}

export const config: Config = {
  path: ["/", "/docs/"],
}