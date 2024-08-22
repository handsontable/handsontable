export default async (request) =>
  new Response('Hello, World!', {
    headers: { 'content-type': 'text/html' },
  })
