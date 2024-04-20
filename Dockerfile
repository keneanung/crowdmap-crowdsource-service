FROM node:21-alpine3.18 AS build

RUN mkdir -p /source/src
WORKDIR /source

COPY package.json package-lock.json /source/

RUN npm ci
COPY tsconfig.json tsoa.json ./
COPY src/ /source/src/
COPY website/ /source/website/
RUN npm run build

FROM node:21-alpine3.18 AS prod-content

RUN mkdir -p /source/src
WORKDIR /source

COPY package.json package-lock.json /source/
RUN npm ci --omit=dev

FROM node:21-alpine3.18 AS prod

RUN mkdir -p /opt/serve

USER node

COPY --chown=node:node --from=build /source/build/ /opt/serve/build/
COPY --chown=node:node --from=prod-content /source/node_modules/ /opt/serve/node_modules
COPY --chown=node:node --from=build /source/package.json /opt/serve/
WORKDIR /opt/serve
EXPOSE 3000
CMD [ "node", "build/src/server.js" ]

