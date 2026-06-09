FROM node:19.6.0-alpine AS build

RUN apk --no-cache add curl

RUN npm i -g pnpm

ENV PATH=/node_modules/.bin:$PATH

WORKDIR /app

COPY package.json pnpm-lock.yaml /app/

COPY ./libs/ ./libs/

RUN pnpm install

ARG VITE_APP_KEYCLOAK_CLIENT_ID
ARG VITE_APP_KEYCLOAK_URL
ARG VITE_ENVIRONMENT_NAME
ENV NODE_ENV=$VITE_ENVIRONMENT_NAME

COPY . /app/

RUN pnpm build --mode $VITE_ENVIRONMENT_NAME

# ENV PORT=3000
# EXPOSE 3000
# CMD [ "npx", "serve", "build" ]

FROM nginx:latest

RUN mkdir -p /var/www/app/

COPY --chown=nginx:nginx --from=build /app/dist /usr/share/nginx/html
COPY /nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
