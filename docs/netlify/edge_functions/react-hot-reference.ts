import type { Context, Config } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  return Response.redirect(`/docs/react-data-grid/methods`, 301);
}

export const config: Config = {
  path: [
    "/docs/react-hot-reference",
    "/docs/frameworks-wrapper-for-react-hot-reference"
  ],
}
