import type { Config } from "@netlify/edge-functions"

export default async () => new Response("Hello, world!")

export const config: Config = {
  path: "^/docs/(\d+\.\d+|next)/?$",
  excludedPath: ["/*.css", "/*.js"]
}
