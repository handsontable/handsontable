import type { Context, Config } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  return Response.redirect(`/docs/javascript-data-grid/angular-installation/`, 301);
}

export const config: Config = {
  path: ["/docs/angular"],
}
