FROM node:15 as build
ARG BUILD_MODE
ENV BUILD_MODE=${BUILD_MODE:-stage}

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
