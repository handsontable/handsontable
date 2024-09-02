import type { Context, Config } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  return Response.redirect(`/docs/react-data-grid/numeric-cell-type`, 301);
}

export const config: Config = {
  path: ["/docs/react-setting-up-a-locale"],
}
