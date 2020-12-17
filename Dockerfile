FROM node:14-alpine as build
WORKDIR app

# dependencies
COPY package*.json ./
RUN yarn

# app
COPY . ./
RUN yarn build



# server image
FROM nginx:alpine

# set up static content
WORKDIR /usr/share/nginx
COPY --from=build ./app/build ./html
