# Install dependencies only when needed
FROM node:lts-alpine AS deps
ARG mongo_connection

WORKDIR /opt/app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
# This is where because may be the case that you would try
# to build the app based on some `X_TAG` in my case (Git commit hash)
# but the code hasn't changed.
FROM node:lts-alpine AS builder

ENV NODE_ENV=production
WORKDIR /opt/app
COPY . .
COPY --from=deps /opt/app/node_modules ./node_modules
RUN yarn run build

# Production image, copy all the files and run next
FROM node:lts-alpine AS runner

ENV MONGO_CONNECTION_STRING=$mongo_connection
WORKDIR /opt/app
EXPOSE 3000
ENV NODE_ENV=production
COPY --from=builder /opt/app/next.config.js ./
COPY --from=builder /opt/app/public ./public
COPY --from=builder /opt/app/.next ./.next
COPY --from=builder /opt/app/node_modules ./node_modules
COPY ./gcp-storage-key.json /opt/app/gcp-storage-key.json
CMD ["node_modules/.bin/next", "start"]
