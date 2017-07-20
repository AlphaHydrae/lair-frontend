FROM alphahydrae/lair-frontend-base:1.0.1

ARG GOOGLE_CLIENT_ID

RUN mkdir -p /var/www/dist \
    && chown build:build /var/www/dist

USER build
COPY config.js gulpfile.js /usr/src/app/
COPY src /usr/src/app/src
RUN npm install
RUN gulp build

USER root
RUN chown -R root:root /usr/src/app/build
COPY docker/entrypoint.sh /docker-entrypoint.sh

ENTRYPOINT [ "/docker-entrypoint.sh" ]
CMD [ "update" ]
