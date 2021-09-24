FROM node:15 as build
ENV BUILD_MODE=stage

WORKDIR /app

# dependencies
COPY docs/package*.json ./docs/
COPY .git ./.git
RUN pwd
RUN ls -al
RUN ls -al docs

# install dependecies
WORKDIR /app/docs
RUN npm ci

# app
WORKDIR /app
COPY src ./src
COPY docs ./docs

# Copy the Handsontable files for the "next" version into the image.
COPY dist /app/docs/.vuepress/public/handsontable

WORKDIR /app/docs

RUN npm run docs:api
RUN npm run docs:build

# server image
FROM nginx:alpine

# set up static content
WORKDIR /usr/share/nginx

COPY --from=build ./app/docs/docker/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build ./app/docs/docker/redirects.conf /etc/nginx/redirects.conf
COPY --from=build ./app/docs/.vuepress/dist/docs ./html

# A fuse that checks the external Nginx config files. It fails the image
# building when the config contains some syntax errors.
RUN nginx -t
