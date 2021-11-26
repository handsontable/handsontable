# server image
FROM nginx:alpine

# set up static content
WORKDIR /usr/share/nginx

COPY ./docker/default.conf /etc/nginx/conf.d/default.conf
COPY ./docker/redirects.conf /etc/nginx/redirects.conf
COPY ./.vuepress/dist/docs ./html

# a fuse that checks the external Nginx config files. It fails the image
# building when the config contains some syntax errors.
RUN nginx -t
