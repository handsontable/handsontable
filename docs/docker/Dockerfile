FROM node:15 as build
ARG BUILD_MODE
ENV BUILD_MODE=${BUILD_MODE:-stage}

WORKDIR /app

# dependencies
COPY docs/package*.json ./docs/
COPY .git ./.git
RUN pwd
RUN ls -al
RUN ls -al docs

# install dependecies
WORKDIR /app/docs
RUN yarn

# app
WORKDIR /app
COPY docs ./docs

WORKDIR /app/docs

# clear non public documentation files
RUN if [ "$BUILD_MODE" = "production" ] ; then     \
    rm -rf ./next/     \
    rm ./.vuepress/public/handsontable.js ./.vuepress/public/handsontable.css     \
  ; fi

RUN yarn docs:build

# server image
FROM nginx:alpine

# set up static content
WORKDIR /usr/share/nginx
COPY --from=build ./app/docs/.vuepress/dist/docs ./html
