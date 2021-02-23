FROM node:15 as build
# enable development features, comment to disable
ENV NODE_ENV=production

WORKDIR app

# dependencies
COPY package*.json ./
RUN yarn

# app
COPY . ./
RUN npm run build

# server image
FROM nginx:alpine

# set up static content
WORKDIR /usr/share/nginx
COPY --from=build ./app/.vuepress/dist ./html
