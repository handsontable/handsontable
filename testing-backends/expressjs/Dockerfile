FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY tsconfig.json .
COPY server/ ./server/
EXPOSE 3000
# Seed is idempotent - safe to run on every container start
CMD ["sh", "-c", "npx ts-node server/seed.ts && npx ts-node server/main.ts"]
