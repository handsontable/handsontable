import type { Context, Config } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  return Response.redirect(`/docs/react-data-grid/binding-to-data`, 301);
}

export const config: Config = {
  path: [
    "/docs/react-simple-examples",
     "frameworks-wrapper-for-react-simple-examples"
    ],
}
