import type { Context, Config } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {

  const cookieValue = context.cookies.get("docs_fw");
  const framework = cookieValue === 'react' ? 'react-data-grid' : 'javascript-data-grid';

  const versionUrl = request.url.replace(/\/docs\/(\d.\d+|next)\//, `/docs/${framework}/`);

  return Response.redirect(versionUrl, 301);
}

export const config: Config = {
  path: ["/docs/(\d.\d+|next)/?"],
}
