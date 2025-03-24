import { Config, Context } from "@netlify/edge-functions";

export default async (req: Request, context: Context) => {
  console.log(context.params['0']) // first cauth group in the regex
  const url = new URL(`/docs/9.0`, req.url);
  return Response.redirect(url);
};

export const config: Config = {
    //redirect /x.x.x/ to /x.x/ only for the new docs engine (/docs/9.4.6/ to /docs/9.0/) 
  path: "/docs/(9).(\\d+).(\\d+)"
};