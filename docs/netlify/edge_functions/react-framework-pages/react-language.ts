import type { Context, Config } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  return Response.redirect(`/docs/react-data-grid/language`, 301);
}

export const config: Config = {
  path: ["/docs/react-setting-up-a-language", "/docs/react-language-change-example"],
}
