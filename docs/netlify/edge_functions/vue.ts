import type { Context, Config } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  return Response.redirect(`/docs/javascript-data-grid/vue-installation`, 301);
}

export const config: Config = {
  path: ["/docs/vue"],
}
