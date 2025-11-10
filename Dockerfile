# Stage 1: Build Rails backend
FROM ruby:3.2.0-alpine AS rails-builder

RUN apk add --no-cache \
    build-base \
    postgresql-dev \
    tzdata

WORKDIR /app

COPY Gemfile Gemfile.lock ./
RUN bundle install --jobs 4 --retry 3 --without development test

COPY . .

# Stage 2: Build Next.js frontend
FROM node:20-alpine AS nextjs-builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
COPY --from=rails-builder /app/public ./public

RUN pnpm run build

# Stage 3: Production image
FROM ruby:3.2.0-alpine

RUN apk add --no-cache \
    postgresql-client \
    tzdata \
    nodejs \
    nginx

WORKDIR /app

COPY --from=rails-builder /usr/local/bundle /usr/local/bundle
COPY --from=rails-builder /app /app
COPY --from=nextjs-builder /app/.next /app/.next
COPY --from=nextjs-builder /app/public /app/public
COPY --from=nextjs-builder /app/node_modules /app/node_modules

COPY config/nginx.conf /etc/nginx/nginx.conf
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["docker-entrypoint.sh"]
