import type { Context, Config } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  return Response.redirect(`/docs/react-data-grid/context-menu/`, 301);
}

export const config: Config = {
  path: ["/docs/custom-context-menu-example"],
}
