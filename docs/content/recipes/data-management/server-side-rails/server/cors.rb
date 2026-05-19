# config/initializers/cors.rb
#
# Allow cross-origin requests from the frontend dev servers.
# Without rack-cors the browser blocks the preflight OPTIONS request
# before Rails ever sees it.
#
# insert_before 0 puts this middleware at the very front of the stack
# so it runs before Rails' routing can reject a cross-origin preflight.
#
# Replace the dev-server origins with your actual production domain(s)
# before deploying. Never use `origins "*"` with credentialed requests.
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "http://localhost:5173", # Vite dev server
            "http://localhost:3000"  # Create React App / Next.js dev server

    resource "/api/*",
      headers: :any,
      methods: [:get, :post, :patch, :put, :delete, :options],
      expose:  ["Content-Type"]

    # If the frontend sends credentials (cookies, Authorization headers),
    # also set `credentials: true` here and pin `origins` to exact URLs --
    # wildcards are not allowed with credentialed requests.
  end
end
