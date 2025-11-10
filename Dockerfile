# ============================================
# Stage 1: Base Ruby image for Rails
# ============================================
FROM ruby:3.2.0-alpine AS ruby-base

RUN apk add --no-cache \
    build-base \
    postgresql-dev \
    tzdata \
    curl

WORKDIR /app

# ============================================
# Stage 2: Rails Development
# ============================================
FROM ruby-base AS backend

COPY Gemfile Gemfile.lock ./
RUN bundle install --jobs 4 --retry 3

COPY . .

EXPOSE 3000

CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]

# ============================================
# Stage 3: Rails Production Builder
# ============================================
FROM ruby-base AS rails-builder

COPY Gemfile Gemfile.lock ./
RUN bundle install --jobs 4 --retry 3 --without development test

COPY . .

# ============================================
# Stage 4: Rails Production
# ============================================
FROM ruby:3.2.0-alpine AS backend-production

RUN apk add --no-cache \
    postgresql-client \
    tzdata \
    curl

WORKDIR /app

COPY --from=rails-builder /usr/local/bundle /usr/local/bundle
COPY --from=rails-builder /app /app

EXPOSE 3000

CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]

# ============================================
# Stage 5: Node.js Base
# ============================================
FROM node:20-alpine AS node-base

WORKDIR /app

# ============================================
# Stage 6: Next.js Development
# ============================================
FROM node-base AS frontend

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# ============================================
# Stage 7: Next.js Production Builder
# ============================================
FROM node-base AS nextjs-builder

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

# ============================================
# Stage 8: Next.js Production
# ============================================
FROM node:20-alpine AS frontend-production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=nextjs-builder /app/package*.json ./
COPY --from=nextjs-builder /app/node_modules ./node_modules
COPY --from=nextjs-builder /app/.next ./.next
COPY --from=nextjs-builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]

# ============================================
# Stage 9: Combined Production (for GCP)
# ============================================
FROM ruby:3.2.0-alpine AS production

RUN apk add --no-cache \
    postgresql-client \
    tzdata \
    nodejs \
    npm \
    nginx \
    curl

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
