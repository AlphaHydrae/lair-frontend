FROM alphahydrae/lair-frontend-base:1.1.0

ARG GOOGLE_CLIENT_ID

RUN mkdir -p /var/www/dist \
    && chown build:build /var/www/dist

USER build

# Update dependencies
COPY package.json package-lock.json /usr/src/app/
RUN npm install

# Update application
COPY config.js gulpfile.js /usr/src/app/
COPY src /usr/src/app/src

# Build
RUN gulp build

USER root
RUN chown -R root:root /usr/src/app/build
COPY docker/entrypoint.sh /docker-entrypoint.sh

ENTRYPOINT [ "/docker-entrypoint.sh" ]
CMD [ "update" ]
