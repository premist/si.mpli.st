FROM alpine:latest AS builder

COPY . /tmp/si.mpli.st

WORKDIR /tmp/si.mpli.st

RUN apk add --no-cache --virtual .hugo hugo \
  && hugo \
  && apk del .hugo


FROM nginx:mainline-alpine

COPY --from=builder /tmp/si.mpli.st/public /usr/share/nginx/html
