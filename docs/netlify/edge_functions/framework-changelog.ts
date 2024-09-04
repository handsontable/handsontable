import type { Context, Config } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {

  const cookieValue = context.cookies.get("docs_fw");
  const framework = cookieValue === 'react' ? 'react-data-grid' : 'javascript-data-grid';

  return Response.redirect(`/docs/${framework}/changelog/`, 301);
}

export const config: Config = {
  path: ["/docs/tutorial-release-notes", "/docs/tutorial-changelog"],
}
