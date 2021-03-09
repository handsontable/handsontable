FROM node:15 as build
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV:-stage}

WORKDIR app

# dependencies
COPY package*.json ./
RUN yarn

# app
COPY . ./
RUN npm run docs:build

# server image
FROM nginx:alpine

# set up static content
WORKDIR /usr/share/nginx
COPY --from=build ./app/.vuepress/dist ./html
