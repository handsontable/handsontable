import type { Context, Config } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  return Response.redirect(`/docs/react-data-grid/installation`, 301);
}

export const config: Config = {
  path: [
    "/docs/react", 
    "/docs/react/installation", 
    "/docs/frameworks-wrapper-for-react-installation"
  ],
}
